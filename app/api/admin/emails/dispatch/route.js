import { NextResponse } from 'next/server';
import {
  renderEmailHtml,
  sendBroadcastEmail,
  dispatchBulkEmails,
  EMAIL_TEMPLATES,
} from '@/services/emailBroadcastService';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      action = 'preview', // 'preview' | 'send_test' | 'send_bulk'
      templateKey = '1st_of_month',
      recipient = {},
      recipients = [],
      customSubject = '',
      customBody = '',
      testEmail = '',
    } = body;

    // 1. Preview HTML
    if (action === 'preview') {
      const sampleRecipient = recipient.email ? recipient : {
        name: 'Demo Enterprise Partner',
        company_name: 'Aaudumbar Agro Foods',
        email: 'partner@demo.b2bindia.site',
        location: 'Chhatrapati Sambhajinagar, Maharashtra',
      };

      const html = renderEmailHtml({
        templateKey,
        recipient: sampleRecipient,
        customSubject,
        customBody,
      });

      const tpl = EMAIL_TEMPLATES[templateKey] || EMAIL_TEMPLATES['1st_of_month'];

      return NextResponse.json({
        success: true,
        subject: customSubject || tpl.subject,
        preheader: tpl.preheader,
        html,
      });
    }

    // 2. Send Single Test Email
    if (action === 'send_test') {
      if (!testEmail || !testEmail.includes('@')) {
        return NextResponse.json({ error: 'Valid test email address is required.' }, { status: 400 });
      }

      const tpl = EMAIL_TEMPLATES[templateKey] || EMAIL_TEMPLATES['1st_of_month'];
      const subject = customSubject || tpl.subject;

      const html = renderEmailHtml({
        templateKey,
        recipient: {
          name: 'Test Administrator',
          company_name: 'B2B India Trade Desk',
          email: testEmail,
          location: 'Maharashtra, India',
        },
        customSubject,
        customBody,
      });

      const result = await sendBroadcastEmail({
        to: testEmail,
        subject: `[TEST PREVIEW] ${subject}`,
        html,
      });

      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        recipient: testEmail,
        note: `Test email successfully dispatched to ${testEmail} via Gmail SMTP.`,
      });
    }

    // 3. Send Bulk Emails to All Users Simultaneously
    if (action === 'send_bulk') {
      if (!Array.isArray(recipients) || recipients.length === 0) {
        return NextResponse.json({ error: 'No recipients provided for bulk dispatch.' }, { status: 400 });
      }

      const validRecipients = recipients.filter((r) => r.email && r.email.includes('@'));

      if (validRecipients.length === 0) {
        return NextResponse.json({ error: 'No valid email addresses found in the recipient list.' }, { status: 400 });
      }

      const result = await dispatchBulkEmails({
        recipients: validRecipients,
        templateKey,
        customSubject,
        customBody,
        delayMs: 300, // 300ms delay between emails to stay within Gmail SMTP limits
      });

      return NextResponse.json({
        success: true,
        total: result.total,
        sent: result.sent,
        failed: result.failed,
        results: result.results,
      });
    }

    return NextResponse.json({ error: 'Unknown action specified.' }, { status: 400 });
  } catch (err) {
    console.error('Email dispatch error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
