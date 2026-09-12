import { NextResponse } from 'next/server';
import { sendWhatsAppMessage, isTwilioConfigured } from '@/services/whatsapp';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    twilioConfigured: isTwilioConfigured(),
    provider: isTwilioConfigured() ? 'Twilio WhatsApp Business API' : 'Direct WhatsApp Web / Mock',
    sender: process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886',
  });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, toPhone, messageBody, supplierId, testMode } = body;

    // Single direct dispatch via Twilio / Server
    if (action === 'send_single') {
      if (!toPhone || !messageBody) {
        return NextResponse.json({ error: 'toPhone and messageBody are required' }, { status: 400 });
      }

      const digits = String(toPhone).replace(/\D/g, '');
      const formattedPhone = digits.length === 10 ? `+91${digits}` : digits.startsWith('91') ? `+${digits}` : `+${digits}`;

      const result = await sendWhatsAppMessage(formattedPhone, messageBody);

      return NextResponse.json({
        success: result.success,
        messageId: result.messageId,
        mock: result.mock || false,
        twilioUsed: isTwilioConfigured(),
        recipient: formattedPhone,
        error: result.error,
      });
    }

    // Bulk server dispatch
    if (action === 'send_bulk') {
      const { suppliers: targetSuppliers, messageTemplate } = body;
      if (!Array.isArray(targetSuppliers) || targetSuppliers.length === 0) {
        return NextResponse.json({ error: 'No target suppliers provided' }, { status: 400 });
      }

      const results = [];
      for (const sup of targetSuppliers) {
        if (!sup.phone) continue;
        const digits = String(sup.phone).replace(/\D/g, '');
        const formattedPhone = digits.length === 10 ? `+91${digits}` : digits.startsWith('91') ? `+${digits}` : `+${digits}`;
        const personalizedMsg = (messageTemplate || '')
          .replace(/{{company_name}}/g, sup.company_name || 'Partner')
          .replace(/{{contact_name}}/g, sup.contact_name || 'Partner')
          .replace(/{{portal_url}}/g, 'https://b2bindia.site/dashboard/products');

        const res = await sendWhatsAppMessage(formattedPhone, personalizedMsg);
        results.push({
          supplierId: sup.id,
          company_name: sup.company_name,
          phone: formattedPhone,
          success: res.success,
          messageId: res.messageId,
          error: res.error,
        });

        // Small delay between server messages
        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      return NextResponse.json({
        success: true,
        total: results.length,
        sent: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
        twilioUsed: isTwilioConfigured(),
        details: results,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    console.error('WhatsApp Dispatch API Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
