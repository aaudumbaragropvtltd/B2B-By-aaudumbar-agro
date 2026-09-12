import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import { 
  readMemberships, 
  getUserMembership, 
  manualActivateMembership, 
  deactivateUserMembership, 
  recordReminderSent 
} from '@/services/membershipStore';
import { sendSubscriptionReceiptEmail } from '@/services/subscriptionReceiptService';

export const dynamic = 'force-dynamic';

function getAdminSupabase() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

// ----------------------------------------------------------------------------
// GET: Fetch all subscribers with status, deadlines, payments & KPIs
// ----------------------------------------------------------------------------
export async function GET(request) {
  try {
    const supabase = getAdminSupabase();

    // 1. Fetch all users and products from Supabase
    const [{ data: users, error: userErr }, { data: products, error: prodErr }] = await Promise.all([
      supabase.from('users').select('*').order('created_at', { ascending: false }),
      supabase.from('products').select('id, supplier_id, is_active')
    ]);

    if (userErr) throw userErr;

    // Map product counts by supplier
    const productCounts = {};
    const activeProductCounts = {};
    (products || []).forEach(p => {
      if (p.supplier_id) {
        productCounts[p.supplier_id] = (productCounts[p.supplier_id] || 0) + 1;
        if (p.is_active) {
          activeProductCounts[p.supplier_id] = (activeProductCounts[p.supplier_id] || 0) + 1;
        }
      }
    });

    const membershipsMap = readMemberships();
    const now = new Date();

    // 2. Build enriched subscriber records for all registered users
    const userProcessedSet = new Set();
    const subscribers = (users || []).map(u => {
      userProcessedSet.add(u.id);
      if (u.registered_email) userProcessedSet.add(u.registered_email.toLowerCase());

      const membership = getUserMembership(u.id, u.registered_email);
      const rawStored = membershipsMap[u.id] || (u.registered_email ? membershipsMap[u.registered_email.toLowerCase()] : null) || {};

      let computedStatus = 'free';
      if (membership.plan && membership.plan !== 'FREE TIER') {
        if (membership.isExpired) {
          computedStatus = 'expired';
        } else if (membership.isExpiringSoon) {
          computedStatus = 'expiring_soon';
        } else {
          computedStatus = 'active';
        }
      }

      return {
        id: u.id,
        user_id: u.id,
        company_name: u.company_name || u.full_name || 'Verified Member',
        full_name: u.full_name || u.company_name || 'N/A',
        email: u.registered_email || 'N/A',
        phone: u.corporate_phone || u.phone_number || 'N/A',
        role: u.role || 'supplier',
        city: u.city || 'N/A',
        state: u.state || 'N/A',
        
        // Subscription particulars
        plan: membership.plan || 'FREE TIER',
        raw_plan: rawStored.plan || membership.plan || 'FREE TIER',
        status: computedStatus,
        is_active: computedStatus === 'active' || computedStatus === 'expiring_soon',
        is_expired: membership.isExpired || false,
        is_expiring_soon: membership.isExpiringSoon || false,
        days_left: membership.daysLeft || 0,
        
        // Dates
        activated_at: rawStored.activatedAt || null,
        expires_at: membership.expiresAt || null,
        expires_at_formatted: membership.expiresAtFormatted || (membership.expiresAt ? new Date(membership.expiresAt).toLocaleDateString('en-IN') : 'Lifetime Free Access'),
        
        // Payment & Audit
        payment_id: rawStored.paymentId || null,
        razorpay_order_id: rawStored.razorpayOrderId || null,
        payment_method: rawStored.paymentMethod || (rawStored.paymentId ? 'razorpay' : 'none'),
        notes: rawStored.notes || null,
        activated_by: rawStored.activatedBy || null,
        last_reminder_sent_at: rawStored.lastReminderSentAt || null,
        
        // Catalog stats
        total_products: productCounts[u.id] || 0,
        active_products: activeProductCounts[u.id] || 0,
        created_at: u.created_at
      };
    });

    // Also include any standalone membership records in memberships.json that might not be in users table
    Object.entries(membershipsMap).forEach(([key, record]) => {
      if (!userProcessedSet.has(key) && (!record.userId || !userProcessedSet.has(record.userId)) && (!record.email || !userProcessedSet.has(record.email.toLowerCase()))) {
        const mem = getUserMembership(record.userId || key, record.email);
        userProcessedSet.add(key);
        if (record.email) userProcessedSet.add(record.email.toLowerCase());

        let computedStatus = 'free';
        if (mem.plan && mem.plan !== 'FREE TIER') {
          if (mem.isExpired) computedStatus = 'expired';
          else if (mem.isExpiringSoon) computedStatus = 'expiring_soon';
          else computedStatus = 'active';
        }

        subscribers.push({
          id: record.userId || key,
          user_id: record.userId || key,
          company_name: record.email || 'Subscriber ' + key.slice(0, 8),
          full_name: 'Direct Subscriber',
          email: record.email || key,
          phone: 'N/A',
          role: 'supplier',
          city: 'N/A',
          state: 'N/A',
          plan: mem.plan || record.plan || 'FREE TIER',
          raw_plan: record.plan || mem.plan,
          status: computedStatus,
          is_active: computedStatus === 'active' || computedStatus === 'expiring_soon',
          is_expired: mem.isExpired || false,
          is_expiring_soon: mem.isExpiringSoon || false,
          days_left: mem.daysLeft || 0,
          activated_at: record.activatedAt || null,
          expires_at: mem.expiresAt || null,
          expires_at_formatted: mem.expiresAtFormatted || 'N/A',
          payment_id: record.paymentId || null,
          razorpay_order_id: record.razorpayOrderId || null,
          payment_method: record.paymentMethod || 'razorpay',
          notes: record.notes || null,
          activated_by: record.activatedBy || null,
          last_reminder_sent_at: record.lastReminderSentAt || null,
          total_products: 0,
          active_products: 0,
          created_at: record.activatedAt || new Date().toISOString()
        });
      }
    });

    // 3. Calculate Global KPI Statistics
    let activeSubscribers = 0;
    let expiringSoonCount = 0;
    let expiredCount = 0;
    let paidSubscribersCount = 0;
    let totalRevenue = 0;

    subscribers.forEach(s => {
      if (s.plan !== 'FREE TIER' || s.payment_id) {
        paidSubscribersCount++;
        if (s.status === 'active') {
          activeSubscribers++;
          totalRevenue += (s.plan === 'ANNUAL PLAN' ? 2000 : 600);
        } else if (s.status === 'expiring_soon') {
          activeSubscribers++;
          expiringSoonCount++;
          totalRevenue += (s.plan === 'ANNUAL PLAN' ? 2000 : 600);
        } else if (s.status === 'expired') {
          expiredCount++;
        }
      }
    });

    return NextResponse.json({
      success: true,
      subscribers,
      stats: {
        total_subscribers: subscribers.length,
        paid_subscribers: paidSubscribersCount,
        active_subscribers: activeSubscribers,
        expiring_soon: expiringSoonCount,
        expired_subscribers: expiredCount,
        free_tier_users: subscribers.length - paidSubscribersCount,
        total_revenue: totalRevenue,
      }
    });
  } catch (error) {
    console.error('Error fetching admin subscriptions:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// ----------------------------------------------------------------------------
// POST: Actions — Manual Activation, Deactivation, Send Reminder Email
// ----------------------------------------------------------------------------
export async function POST(request) {
  try {
    const supabase = getAdminSupabase();
    const body = await request.json();
    const { action, user_id, email, plan = 'QUARTERLY PLAN', days, payment_id, notes, activated_by = 'admin' } = body;

    if (!action) {
      return NextResponse.json({ success: false, error: 'Missing action parameter.' }, { status: 400 });
    }

    if (!user_id && !email) {
      return NextResponse.json({ success: false, error: 'User ID or Email is required.' }, { status: 400 });
    }

    // ------------------------------------------------------------------------
    // 1. ACTION: MANUALLY ACTIVATE SUBSCRIPTION
    // ------------------------------------------------------------------------
    if (action === 'activate') {
      const targetDays = days || (plan === 'ANNUAL PLAN' ? 365 : 90);
      const planAmount = plan === 'ANNUAL PLAN' ? 2000 : 600;

      // Update membership store
      const record = manualActivateMembership({
        userId: user_id,
        email,
        plan,
        days: targetDays,
        paymentId: payment_id || `MANUAL-${Date.now().toString().slice(-6)}`,
        notes: notes || `Manual activation by admin (${plan})`,
        activatedBy: activated_by
      });

      // Automatically reactivate all products of this supplier in Supabase
      if (user_id) {
        try {
          await supabase
            .from('products')
            .update({ is_active: true })
            .eq('supplier_id', user_id);
        } catch (prodErr) {
          console.warn('Notice restoring supplier products:', prodErr.message);
        }
      }

      // Record in platform ledger
      try {
        await supabase.from('platform_ledger').insert([{
          entry_type: 'platform_commission',
          amount: planAmount,
          from_entity_id: user_id || null,
          payment_reference: record.paymentId,
          description: `Manual Subscription Activation: ${plan} (${targetDays} Days) by Admin`,
        }]);
      } catch (ledgerErr) {
        console.warn('Notice writing to ledger:', ledgerErr.message);
      }

      // Record activity log
      try {
        await supabase.from('activity_logs').insert([{
          user_id: user_id || null,
          action: 'admin_manual_subscription_activation',
          details: {
            plan,
            days: targetDays,
            payment_id: record.paymentId,
            expires_at: record.expiresAt,
            notes,
            activated_by
          },
        }]);
      } catch (actErr) {
        // ignore
      }

      // Dispatch official Payment Receipt & Activation Confirmation Email
      if (email && email.includes('@') && email !== 'N/A') {
        try {
          await sendSubscriptionReceiptEmail({
            email,
            companyName: body.company_name || email,
            plan,
            durationDays: targetDays,
            paymentId: record.paymentId,
            expiresAt: record.expiresAt,
            baseAmount: planAmount,
            totalAmount: planAmount,
          });
        } catch (emailErr) {
          console.warn('Manual activation receipt email notice:', emailErr.message);
        }
      }

      return NextResponse.json({
        success: true,
        message: `✓ Successfully activated ${plan} (${targetDays} days) for ${email || user_id}. Activation receipt emailed & all catalog products are now live!`,
        subscription: record
      });
    }

    // ------------------------------------------------------------------------
    // 2. ACTION: MANUALLY DEACTIVATE / EXPIRE SUBSCRIPTION
    // ------------------------------------------------------------------------
    if (action === 'deactivate') {
      const record = deactivateUserMembership(user_id, email, notes || 'Deactivated by Admin');

      // Set products to inactive
      if (user_id) {
        try {
          await supabase
            .from('products')
            .update({ is_active: false })
            .eq('supplier_id', user_id);
        } catch (prodErr) {
          console.warn('Notice setting products inactive:', prodErr.message);
        }
      }

      // Record activity log
      try {
        await supabase.from('activity_logs').insert([{
          user_id: user_id || null,
          action: 'admin_manual_subscription_deactivation',
          details: { notes, deactivated_by: activated_by },
        }]);
      } catch (actErr) {
        // ignore
      }

      return NextResponse.json({
        success: true,
        message: `✓ Subscription deactivated for ${email || user_id}. Product listings set to inactive.`,
        subscription: record
      });
    }

    // ------------------------------------------------------------------------
    // 3. ACTION: SEND PAYMENT / RENEWAL REMINDER ON EMAIL
    // ------------------------------------------------------------------------
    if (action === 'send_reminder') {
      if (!email || email === 'N/A') {
        return NextResponse.json({ success: false, error: 'User does not have a valid registered email.' }, { status: 400 });
      }

      const membership = getUserMembership(user_id, email);
      const companyName = body.company_name || 'Valued Partner';
      const targetPlan = body.plan || membership.plan || 'QUARTERLY PLAN';
      const deadlineDate = membership.expiresAt 
        ? new Date(membership.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
        : 'Immediate Action Required';

      const planPrice = targetPlan === 'ANNUAL PLAN' ? '₹2,000 + 18% GST' : '₹600 + 18% GST';
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://b2bindia.site';
      const renewalUrl = `${siteUrl}/dashboard?tab=membership`;

      // Email HTML Template
      const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Subscription Renewal Notice — B2B India</title>
</head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#334155;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);">
          
          <!-- Top Brand Banner -->
          <tr>
            <td style="background:linear-gradient(135deg,#0052cc 0%,#ff5500 50%,#10b981 100%);padding:36px 32px;text-align:center;">
              <div style="font-size:28px;font-weight:900;color:#ffffff;letter-spacing:1px;text-shadow:0 2px 4px rgba(0,0,0,0.3);">
                B2B INDIA
              </div>
              <div style="font-size:11px;font-weight:800;color:#ffffff;letter-spacing:2px;text-transform:uppercase;margin-top:4px;opacity:0.95;">
                Conglomerate Marketplace • Official Membership Desk
              </div>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding:40px 32px;">
              <div style="display:inline-block;padding:6px 14px;background-color:#fff7ed;border:1px solid #ffedd5;border-radius:999px;color:#c2410c;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:1px;margin-bottom:18px;">
                ⏰ Membership Payment &amp; Renewal Notice
              </div>

              <h2 style="font-size:22px;font-weight:800;color:#0f172a;margin:0 0 14px 0;line-height:1.3;">
                Keep Your Verified Catalog &amp; RFQ Discovery Active
              </h2>

              <p style="font-size:15px;line-height:1.6;color:#475569;margin:0 0 24px 0;">
                Dear <strong>${companyName}</strong>,<br><br>
                This is an official advisory regarding your verified supplier membership on <strong>B2B India</strong>. To prevent disruption to your active product listings and buyer RFQ quotes, please complete or verify your membership renewal.
              </p>

              <!-- Subscription Info Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;margin-bottom:28px;overflow:hidden;">
                <tr>
                  <td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;">
                    <span style="font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;">Subscription Tier:</span>
                    <div style="font-size:16px;font-weight:800;color:#0f172a;margin-top:2px;">👑 ${targetPlan}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;">
                    <span style="font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;">Renewal Fee:</span>
                    <div style="font-size:16px;font-weight:800;color:#ea580c;margin-top:2px;">${planPrice}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 20px;">
                    <span style="font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;">Subscription Deadline / Status:</span>
                    <div style="font-size:16px;font-weight:800;color:#dc2626;margin-top:2px;">${deadlineDate}</div>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td align="center">
                    <a href="${renewalUrl}" style="display:inline-block;padding:16px 36px;background:linear-gradient(135deg,#ff5500,#ea580c);color:#ffffff;text-decoration:none;font-size:16px;font-weight:800;border-radius:12px;box-shadow:0 10px 20px rgba(234,88,12,0.3);letter-spacing:0.5px;">
                      ⚡ Renew / Activate Membership Now →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Offline Payment Details -->
              <div style="background-color:#eff6ff;border:1px solid #bfdbfe;border-radius:14px;padding:20px;margin-bottom:28px;">
                <div style="font-size:13px;font-weight:800;color:#1e40af;text-transform:uppercase;margin-bottom:8px;">
                  🏛️ Prefer Direct Bank Transfer / UPI?
                </div>
                <p style="font-size:13px;color:#1e3a8a;margin:0 0 10px 0;line-height:1.5;">
                  You may also settle directly to our corporate nodal escrow account and share your transaction reference:
                </p>
                <div style="font-size:12px;color:#1e3a8a;font-family:monospace;line-height:1.6;background-color:#ffffff;padding:12px;border-radius:8px;border:1px solid #dbeafe;">
                  <strong>Beneficiary:</strong> Aaudumbar Agro Pvt. Ltd.<br>
                  <strong>Bank:</strong> State Bank of India (SBI)<br>
                  <strong>UPI ID:</strong> 8408841998@sbi<br>
                  <strong>Helpdesk WhatsApp:</strong> +91 84088 41998
                </div>
              </div>

              <!-- Note -->
              <p style="font-size:12px;line-height:1.6;color:#64748b;margin:0;">
                <em>Notice: If you have already paid and are waiting for manual activation, our administrative desk is cross-verifying your transaction ID and will activate your plan shortly.</em>
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#0f172a;padding:24px 32px;text-align:center;border-top:1px solid #1e293b;">
              <div style="font-size:12px;font-weight:700;color:#94a3b8;">
                B2B India Central Operations • Aaudumbar Agro Pvt. Ltd.
              </div>
              <div style="font-size:11px;color:#64748b;margin-top:4px;">
                Contact Desk: +91 84088 41998 | Email: b2bbharat.in@gmail.com
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `;

      // Plaintext fallback
      const textContent = `
B2B INDIA — SUBSCRIPTION PAYMENT & RENEWAL NOTICE
------------------------------------------------
Dear ${companyName},

This is an official reminder regarding your B2B India Supplier Membership.

• Plan: ${targetPlan}
• Renewal Fee: ${planPrice}
• Deadline: ${deadlineDate}

Please renew your subscription to maintain active live status for your product catalog:
${renewalUrl}

Direct Bank Transfer / UPI Details:
- Beneficiary: Aaudumbar Agro Pvt. Ltd.
- Bank: State Bank of India (SBI)
- UPI: 8408841998@sbi
- WhatsApp Helpline: +91 84088 41998

If you have already paid, our operations team will activate your plan upon UTR verification.

Warm regards,
B2B India Operations Desk
b2bbharat.in@gmail.com | +91 84088 41998
      `;

      // Nodemailer transport
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'b2bbharat.in@gmail.com',
          pass: 'jrwgvucuxrbepnei',
        },
      });

      const mailOptions = {
        from: '"B2B India Membership Desk" <b2bbharat.in@gmail.com>',
        to: email,
        cc: 'b2bbharat.in@gmail.com',
        subject: `⏰ Subscription Payment & Renewal Reminder [${targetPlan}] — B2B India`,
        text: textContent,
        html: htmlContent,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`Payment reminder successfully emailed to ${email}:`, info.messageId);

      // Record timestamp in store
      const reminderTimestamp = recordReminderSent(user_id, email);

      // Record activity log
      try {
        await supabase.from('activity_logs').insert([{
          user_id: user_id || null,
          action: 'subscription_reminder_sent',
          details: {
            email,
            plan: targetPlan,
            deadline: deadlineDate,
            message_id: info.messageId,
            sent_at: reminderTimestamp
          },
        }]);
      } catch (actErr) {
        // ignore
      }

      return NextResponse.json({
        success: true,
        message: `✓ Renewal reminder email successfully dispatched to ${email}!`,
        messageId: info.messageId,
        sentAt: reminderTimestamp
      });
    }

    return NextResponse.json({ success: false, error: `Invalid action: ${action}` }, { status: 400 });

  } catch (error) {
    console.error('Error handling subscription action:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
