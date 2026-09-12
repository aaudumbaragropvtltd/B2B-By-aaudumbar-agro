import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createAdminClient } from '@/services/supabaseServer';

export const dynamic = 'force-dynamic';

function verifyAdminCookie() {
  const ADMIN_PASSPHRASE = process.env.ADMIN_PASSPHRASE || 'b2bindia@admin2024';
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('b2b_admin_token')?.value;
    return token === ADMIN_PASSPHRASE;
  } catch {
    return false;
  }
}

/**
 * PATCH /api/admin/verify-supplier
 * Body: { supplierId: string, action: 'verify' | 'reject' }
 */
export async function PATCH(request) {
  try {
    if (!verifyAdminCookie()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { supplierId, action } = body;

    if (!supplierId || !['verify', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request. Provide supplierId and action (verify/reject).' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const newStatus = action === 'verify' ? 'verified' : 'rejected';
    const { data, error } = await supabase
      .from('users')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', supplierId)
      .select()
      .single();

    if (error) {
      console.error('Verify supplier error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, supplier: data });
  } catch (error) {
    console.error('Admin verify-supplier error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
