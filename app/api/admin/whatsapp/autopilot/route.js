import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function cleanIndianPhone(rawPhone) {
  if (!rawPhone) return '';
  const digits = String(rawPhone).replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return digits;
  if (digits.length === 11 && digits.startsWith('0')) return `91${digits.slice(1)}`;
  return digits;
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      message = '🌾 *Namaste Valued Suppliers & Trade Partners!* 🌾\n\nGreetings from *B2B India Marketplace (Aaudumbar Agro Pvt. Ltd.)*!\n\nKindly review and update your wholesale prices on the portal:\nhttps://b2bindia.site/dashboard/products\n\n— *Team B2B India*',
      targetSupplierIds = null,
      mode = 'pending', // 'pending' | 'all' | 'custom'
    } = body;

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: users, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, company_name, full_name, corporate_phone, phone_number, whatsapp_number, city, state, role')
      .order('created_at', { ascending: false });

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }

    const suppliers = (users || [])
      .map((u) => {
        const rawPhone = u.whatsapp_number || u.corporate_phone || u.phone_number || '';
        const phone = cleanIndianPhone(rawPhone);
        return {
          id: u.id,
          name: u.company_name || u.full_name || 'B2B Partner',
          phone,
          location: [u.city, u.state].filter(Boolean).join(', ') || 'India',
          role: u.role || 'supplier',
        };
      })
      .filter((s) => s.phone && s.phone.length >= 10 && !s.phone.includes('9999999999'));

    const filtered = Array.isArray(targetSupplierIds) && targetSupplierIds.length > 0
      ? suppliers.filter((s) => targetSupplierIds.includes(s.id))
      : suppliers;

    return NextResponse.json({
      success: true,
      total: filtered.length,
      suppliers: filtered,
      message,
    });
  } catch (error) {
    console.error('Autopilot API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
