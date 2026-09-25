import { NextResponse } from 'next/server';
import { createClient } from '@/services/supabaseServer';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createRazorpayOrder, verifyPaymentSignature, getPublicKeyId } from '@/services/razorpay';
import { getUserMembership, saveUserMembership } from '@/services/membershipStore';
import { resolveAuthenticatedUser } from '@/utils/userResolver';
import { sendSubscriptionReceiptEmail } from '@/services/subscriptionReceiptService';

import { getLiveMembershipPricing, calculateDynamicMembershipPricing } from '@/utils/platformSettings';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function calculateMembershipPricing(plan = 'ANNUAL PLAN', paymentMethod = 'all') {
  return await getLiveMembershipPricing(paymentMethod);
}

// GET — Fetch current membership status
export async function GET(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: {} }));

    const membership = getUserMembership(user?.id || 'demo-supplier-1', user?.email || 'supplier@b2bindia.site');
    const pricing = await getLiveMembershipPricing('all');
    return NextResponse.json(
      {
        success: true,
        membership,
        pricing,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching membership:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST — Create Razorpay order OR Verify payment
export async function POST(request) {
  try {
    const supabase = await createClient();
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    let user = null;
    let profile = null;

    try {
      const { data: authData } = await supabase.auth.getUser();
      user = authData?.user;
    } catch (e) {
      // Guest
    }

    if (user) {
      profile = await resolveAuthenticatedUser(supabaseAdmin, user, 'supplier');
    }

    if (!profile) {
      const { data: firstSupplier } = await supabaseAdmin
        .from('users')
        .select('id, company_name, registered_email, corporate_phone, role')
        .limit(1)
        .maybeSingle();

      profile = firstSupplier || {
        id: 'demo-supplier-1',
        company_name: 'Verified Supplier',
        registered_email: 'supplier@b2bindia.site',
        corporate_phone: '+91 9226497450',
        role: 'supplier',
      };
      user = { id: profile.id, email: profile.registered_email };
    }

    const body = await request.json();

    // -------------------------------------------------------------
    // ACTION: VERIFY PAYMENT SIGNATURE
    // -------------------------------------------------------------
    if (body.action === 'verify' || body.razorpay_signature) {
      const { plan, razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

      if (!plan || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return NextResponse.json({ error: 'Missing payment verification parameters.' }, { status: 400 });
      }

      const isValid = verifyPaymentSignature({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      });

      if (!isValid) {
        return NextResponse.json({ error: 'Payment signature verification failed.' }, { status: 400 });
      }

      // Activate membership in store (Annual Plan only)
      const activePlan = 'ANNUAL PLAN';
      const updatedSub = saveUserMembership(user.id, user.email, {
        plan: activePlan,
        paymentId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
      });

      const planConfig = PLAN_PRICES[activePlan] || { amount: 2000, label: 'Annual Plan (12 Months)', durationDays: 365 };

      // Dispatch official Payment Receipt & Activation Confirmation Email
      let pricing = null;
      try {
        pricing = await getLiveMembershipPricing();
        await sendSubscriptionReceiptEmail({
          email: user.email || profile?.registered_email,
          companyName: profile?.company_name || profile?.full_name || user.email,
          plan: activePlan,
          durationDays: 365,
          paymentId: razorpay_payment_id,
          expiresAt: updatedSub.expiresAt,
          baseAmount: pricing.baseAmount,
          gstAmount: pricing.gstAmount,
          gatewayFee: pricing.gatewayFee,
          totalAmount: pricing.totalPayable,
        });
      } catch (emailErr) {
        console.warn('Subscription receipt email notice:', emailErr.message);
      }

      // Reactivate all previously uploaded products of this supplier back to live status!
      if (profile?.id) {
        try {
          await supabaseAdmin
            .from('products')
            .update({ is_active: true })
            .eq('supplier_id', profile.id);
        } catch (prodErr) {
          console.warn('Reactivating supplier products notice:', prodErr.message);
        }
      }

      // Record in platform ledger
      try {
        await supabaseAdmin.from('platform_ledger').insert([{
          entry_type: 'platform_commission',
          amount: pricing?.baseAmount || 2000,
          from_entity_id: profile?.id || null,
          payment_reference: razorpay_payment_id,
          description: `Supplier Membership Upgrade: ${plan} (Paid via Razorpay: ${razorpay_payment_id})`,
        }]);
      } catch (ledgerErr) {
        console.warn('Ledger recording notice for membership:', ledgerErr.message);
      }

      // Record activity log
      try {
        await supabaseAdmin.from('activity_logs').insert([{
          user_id: profile?.id || null,
          action: 'membership_upgraded',
          details: {
            plan,
            amount: planConfig.amount,
            razorpay_payment_id,
            expires_at: updatedSub.expiresAt,
          },
        }]);
      } catch (actErr) {
        // ignore
      }

      const fullMembership = getUserMembership(user.id, user.email);

      return NextResponse.json({
        success: true,
        message: `✓ Successfully activated ${plan}! All your product catalog listings are now live on B2B India.`,
        plan: fullMembership.plan,
        membership: fullMembership,
        expiresAt: fullMembership.expiresAt,
        daysLeft: fullMembership.daysLeft,
        paymentId: razorpay_payment_id,
      });
    }

    // -------------------------------------------------------------
    // ACTION: CREATE RAZORPAY ORDER FOR MEMBERSHIP
    // -------------------------------------------------------------
    const { plan = 'ANNUAL PLAN', paymentMethod = 'upi' } = body;
    const selectedPlan = 'ANNUAL PLAN';

    const pricing = await getLiveMembershipPricing(paymentMethod);
    const receiptId = `sub-${Date.now().toString().slice(-8)}`;

    let razorpayOrderId = null;
    try {
      const razorpayOrder = await createRazorpayOrder({
        amount: pricing.totalPayable,
        currency: 'INR',
        receipt: receiptId,
        notes: {
          membership_plan: plan,
          payment_method: paymentMethod,
          base_amount: pricing.baseAmount,
          gst_18: pricing.gstAmount,
          subtotal_with_gst: pricing.subtotalWithGst,
          gateway_fee: pricing.gatewayFee,
          gst_on_fee: pricing.gstOnGatewayFee,
          total_payable: pricing.totalPayable,
          user_id: user.id,
          email: user.email || profile?.registered_email,
          company: profile?.company_name || 'Supplier',
        },
      });
      razorpayOrderId = razorpayOrder.id;
    } catch (rzpErr) {
      console.warn('Razorpay membership order creation fallback:', rzpErr.message);
      razorpayOrderId = `order_sub_${Date.now()}`;
    }

    return NextResponse.json({
      success: true,
      plan,
      pricing,
      amount: pricing.totalPayable,
      amountPaise: pricing.amountPaise,
      currency: 'INR',
      razorpayOrderId,
      razorpayKeyId: getPublicKeyId(),
      prefill: {
        name: profile?.company_name || user.user_metadata?.full_name || 'Supplier Member',
        email: user.email || profile?.registered_email || '',
        contact: profile?.corporate_phone || '',
      },
    });
  } catch (error) {
    console.error('Membership payment API error:', error);
    return NextResponse.json(
      { error: error.message || 'Membership upgrade processing failed.' },
      { status: 500 }
    );
  }
}
