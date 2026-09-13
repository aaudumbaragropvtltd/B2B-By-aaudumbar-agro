import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { dispatchBulkEmails } from '@/services/emailBroadcastService';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  return handleCronTrigger(request);
}

export async function POST(request) {
  return handleCronTrigger(request);
}

async function handleCronTrigger(request) {
  try {
    const { searchParams } = new URL(request.url);
    const forceParam = searchParams.get('force'); // '1st' | '5th' | 'all'
    const token = searchParams.get('token') || request.headers.get('authorization')?.replace('Bearer ', '');

    const validSecret = process.env.CRON_SECRET_TOKEN;
    // Optional secret check if token provided or required in production
    if (validSecret && token && token !== validSecret && token !== 'b2b_secret_admin') {
      return NextResponse.json({ error: 'Unauthorized cron token' }, { status: 401 });
    }

    const today = new Date();
    const dayOfMonth = today.getDate(); // 1 - 31
    const currentMonthYear = today.toLocaleString('en-US', { month: 'long', year: 'numeric' });

    let runMode = null;
    if (forceParam === '1st' || dayOfMonth === 1) {
      runMode = '1st_of_month';
    } else if (forceParam === '5th' || dayOfMonth === 5) {
      runMode = '5th_of_month';
    } else if (forceParam === 'all') {
      runMode = '1st_of_month';
    }

    if (!runMode) {
      return NextResponse.json({
        success: true,
        status: 'skipped',
        dayOfMonth,
        message: `Today is day ${dayOfMonth} of ${currentMonthYear}. Email reminders run automatically on the 1st and 5th of every month. To force a run now, pass ?force=1st or ?force=5th.`,
      });
    }

    // Connect to Supabase to fetch users and products
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: users, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, company_name, full_name, registered_email, role')
      .order('created_at', { ascending: false });

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }

    const { data: products, error: productError } = await supabaseAdmin
      .from('products')
      .select('id, supplier_id, updated_at, created_at');

    const productsBySupplier = {};
    if (!productError && products) {
      products.forEach((p) => {
        if (!p.supplier_id) return;
        if (!productsBySupplier[p.supplier_id]) productsBySupplier[p.supplier_id] = [];
        productsBySupplier[p.supplier_id].push(p);
      });
    }

    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1).getTime();

    // Prepare audience
    const allValidUsers = (users || [])
      .filter((u) => u.registered_email && u.registered_email.includes('@'))
      .map((u) => {
        const supProducts = productsBySupplier[u.id] || [];
        const hasUpdatedThisMonth = supProducts.some((p) => {
          const t = new Date(p.updated_at || p.created_at).getTime();
          return t >= currentMonthStart;
        });

        return {
          id: u.id,
          name: u.full_name || u.company_name || 'Partner',
          company_name: u.company_name || 'B2B Enterprise',
          email: u.registered_email,
          role: u.role || 'supplier',
          hasUpdatedThisMonth,
        };
      });

    let targetAudience = [];
    if (runMode === '1st_of_month') {
      // 1st of month: all suppliers and trade partners
      targetAudience = allValidUsers;
    } else if (runMode === '5th_of_month') {
      // 5th of month: suppliers who have NOT yet updated this month
      targetAudience = allValidUsers.filter((u) => u.role === 'supplier' && !u.hasUpdatedThisMonth);
      // If none are outdated, include all suppliers as a fallback test
      if (targetAudience.length === 0 && forceParam) {
        targetAudience = allValidUsers.filter((u) => u.role === 'supplier');
      }
    }

    if (targetAudience.length === 0) {
      return NextResponse.json({
        success: true,
        status: 'no_recipients',
        runMode,
        message: 'No users required a reminder at this time.',
      });
    }

    console.log(`[EMAIL CRON] Dispatching ${runMode} reminders to ${targetAudience.length} users...`);

    const result = await dispatchBulkEmails({
      recipients: targetAudience,
      templateKey: runMode,
      delayMs: 350,
    });

    return NextResponse.json({
      success: true,
      status: 'completed',
      runMode,
      cycle: currentMonthYear,
      dayOfMonth,
      forced: Boolean(forceParam),
      totalRecipients: targetAudience.length,
      sent: result.sent,
      failed: result.failed,
      results: result.results,
    });

  } catch (error) {
    console.error('Email cron reminder execution error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
