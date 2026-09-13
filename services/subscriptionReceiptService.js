import nodemailer from 'nodemailer';

/**
 * Dispatches an official Payment Receipt & Activation Confirmation Email for Subscriptions.
 * Informs the user that payment was received, plan is activated, and they can now add products.
 *
 * @param {Object} subscriptionData - Details of the subscription & payment
 * @param {Object} options - Additional metadata
 */
export async function sendSubscriptionReceiptEmail(subscriptionData, options = {}) {
  try {
    const email = (subscriptionData.email || options.email || '').trim();
    if (!email || !email.includes('@')) {
      console.warn('Cannot send subscription receipt: No valid email provided');
      return { success: false, error: 'Invalid email address' };
    }

    const companyName = subscriptionData.companyName || subscriptionData.company_name || options.companyName || 'Valued Supplier Partner';
    const plan = subscriptionData.plan || 'QUARTERLY PLAN';
    const isAnnual = plan === 'ANNUAL PLAN';
    const planLabel = isAnnual ? 'Annual Enterprise Plan (12 Months)' : 'Quarterly Growth Plan (3 Months)';
    const durationDays = subscriptionData.durationDays || (isAnnual ? 365 : 90);
    
    const paymentId = subscriptionData.paymentId || subscriptionData.payment_id || `PAY-${Date.now().toString().slice(-8)}`;
    const receiptNo = `AAPL/SUB/2026/${(paymentId.replace(/[^0-9a-zA-Z]/g, '')).slice(-6).toUpperCase() || Math.floor(100000 + Math.random() * 900000)}`;

    const today = new Date();
    const dateStr = today.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = today.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    // Expiry date calculation
    let expiresAt = subscriptionData.expiresAt || subscriptionData.expires_at;
    if (!expiresAt) {
      expiresAt = new Date(today.getTime() + durationDays * 24 * 60 * 60 * 1000).toISOString();
    }
    const expiresAtFormatted = new Date(expiresAt).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    // Pricing calculation
    const baseAmount = Number(subscriptionData.baseAmount) || (isAnnual ? 2000 : 600);
    const gstAmount = Number(subscriptionData.gstAmount) || parseFloat((baseAmount * 0.18).toFixed(2));
    const gatewayFee = Number(subscriptionData.gatewayFee) || (isAnnual ? 59.00 : 17.70);
    const totalAmount = Number(subscriptionData.totalAmount) || parseFloat((baseAmount + gstAmount + gatewayFee).toFixed(2));

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://b2bindia.site';
    const addProductUrl = `${siteUrl}/dashboard?tab=products`;
    const dashboardUrl = `${siteUrl}/dashboard`;

    // Email Design Colors
    const navy = '#0f172a';
    const orange = '#ff5500';
    const emerald = '#10b981';

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Payment Received &amp; Membership Activated — B2B India</title>
</head>
<body style="margin:0;padding:0;background-color:#0b0f19;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#334155;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0b0f19;padding:36px 16px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="620" cellpadding="0" cellspacing="0" style="max-width:620px;background-color:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);">
          
          <!-- Top Hero Brand Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0052cc 0%,#ff5500 50%,#10b981 100%);padding:36px 32px;text-align:center;">
              <div style="font-size:28px;font-weight:900;color:#ffffff;letter-spacing:1px;text-shadow:0 2px 4px rgba(0,0,0,0.3);">
                B2B INDIA
              </div>
              <div style="font-size:11px;font-weight:800;color:#ffffff;letter-spacing:2px;text-transform:uppercase;margin-top:4px;opacity:0.95;">
                Official Membership Desk • Tax Invoice &amp; Payment Receipt
              </div>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding:36px 32px;">
              
              <!-- Celebration Tag -->
              <div style="display:inline-block;padding:6px 16px;background-color:#ecfdf5;border:1px solid #a7f3d0;border-radius:999px;color:#047857;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:1px;margin-bottom:20px;">
                🎉 Payment Received &amp; Plan Activated!
              </div>

              <h1 style="font-size:24px;font-weight:900;color:#0f172a;margin:0 0 12px 0;line-height:1.3;">
                We Received Your Payment — Now You Can Add Products!
              </h1>

              <p style="font-size:15px;line-height:1.6;color:#475569;margin:0 0 24px 0;">
                Dear <strong>${companyName}</strong>,<br><br>
                Thank you for your purchase! We have successfully received and verified your payment. Your <strong>${planLabel}</strong> is now officially <strong>ACTIVE</strong> on B2B India.
              </p>

              <!-- Highlight Callout: Add Products Now -->
              <div style="background:linear-gradient(135deg,#eff6ff 0%,#fff7ed 100%);border:2px solid #fdba74;border-radius:18px;padding:22px;margin-bottom:30px;text-align:center;">
                <div style="font-size:18px;font-weight:900;color:#ea580c;margin-bottom:6px;">
                  🚀 Start Adding Products to Your Catalog
                </div>
                <p style="font-size:14px;color:#334155;margin:0 0 16px 0;line-height:1.5;">
                  Your supplier catalog quota has been unlocked. List your wholesale commodities, products, and equipment to connect with pan-India buyers and receive high-intent RFQ quotes immediately!
                </p>
                <a href="${addProductUrl}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#ff5500,#ea580c);color:#ffffff;text-decoration:none;font-size:15px;font-weight:900;border-radius:12px;box-shadow:0 8px 20px rgba(234,88,12,0.3);letter-spacing:0.5px;">
                  ⚡ Add Products to Catalog Now →
                </a>
              </div>

              <!-- Official Tax Invoice / Receipt Breakdown -->
              <div style="border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;margin-bottom:28px;">
                <div style="background-color:#f8fafc;padding:14px 20px;border-bottom:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;">
                  <span style="font-size:12px;font-weight:800;color:#0f172a;text-transform:uppercase;letter-spacing:0.5px;">
                    📄 Official Subscription Receipt
                  </span>
                  <span style="font-family:monospace;font-size:11px;color:#64748b;font-weight:700;">
                    ${receiptNo}
                  </span>
                </div>

                <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;">
                  <tr style="border-bottom:1px solid #f1f5f9;">
                    <td style="padding:12px 20px;color:#64748b;width:45%;">Member Company:</td>
                    <td style="padding:12px 20px;font-weight:800;color:#0f172a;">${companyName}</td>
                  </tr>
                  <tr style="border-bottom:1px solid #f1f5f9;">
                    <td style="padding:12px 20px;color:#64748b;">Registered Email:</td>
                    <td style="padding:12px 20px;font-weight:700;color:#0f172a;">${email}</td>
                  </tr>
                  <tr style="border-bottom:1px solid #f1f5f9;">
                    <td style="padding:12px 20px;color:#64748b;">Subscription Plan:</td>
                    <td style="padding:12px 20px;font-weight:800;color:#ea580c;">👑 ${planLabel}</td>
                  </tr>
                  <tr style="border-bottom:1px solid #f1f5f9;">
                    <td style="padding:12px 20px;color:#64748b;">Payment / Transaction ID:</td>
                    <td style="padding:12px 20px;font-family:monospace;font-weight:800;color:#0f172a;">${paymentId}</td>
                  </tr>
                  <tr style="border-bottom:1px solid #f1f5f9;">
                    <td style="padding:12px 20px;color:#64748b;">Payment Date &amp; Time:</td>
                    <td style="padding:12px 20px;font-weight:600;color:#0f172a;">${dateStr} at ${timeStr}</td>
                  </tr>
                  <tr style="border-bottom:1px solid #f1f5f9;">
                    <td style="padding:12px 20px;color:#64748b;">Plan Duration:</td>
                    <td style="padding:12px 20px;font-weight:700;color:#0f172a;">${durationDays} Days</td>
                  </tr>
                  <tr style="border-bottom:1px solid #f1f5f9;background-color:#ecfdf5;">
                    <td style="padding:12px 20px;color:#047857;font-weight:700;">Active Deadline / Valid Until:</td>
                    <td style="padding:12px 20px;font-weight:900;color:#047857;">📅 ${expiresAtFormatted}</td>
                  </tr>

                  <!-- Pricing Rows -->
                  <tr style="border-bottom:1px solid #f1f5f9;">
                    <td style="padding:10px 20px;color:#64748b;">Base Subscription:</td>
                    <td style="padding:10px 20px;font-weight:600;color:#0f172a;">₹${baseAmount.toLocaleString('en-IN')}</td>
                  </tr>
                  <tr style="border-bottom:1px solid #f1f5f9;">
                    <td style="padding:10px 20px;color:#64748b;">18% GST (CGST 9% + SGST 9%):</td>
                    <td style="padding:10px 20px;font-weight:600;color:#0f172a;">₹${gstAmount.toFixed(2)}</td>
                  </tr>
                  <tr style="border-bottom:1px solid #e2e8f0;">
                    <td style="padding:10px 20px;color:#64748b;">Payment Gateway / Platform Fee:</td>
                    <td style="padding:10px 20px;font-weight:600;color:#0f172a;">₹${gatewayFee.toFixed(2)}</td>
                  </tr>
                  <tr style="background-color:#fff7ed;">
                    <td style="padding:14px 20px;font-size:14px;font-weight:900;color:#9a3412;">Total Amount Paid (Settled):</td>
                    <td style="padding:14px 20px;font-size:16px;font-weight:900;color:#ea580c;">₹${totalAmount.toLocaleString('en-IN')}</td>
                  </tr>
                </table>
              </div>

              <!-- Unlocked Features Grid -->
              <div style="margin-bottom:28px;">
                <div style="font-size:13px;font-weight:800;color:#0f172a;text-transform:uppercase;margin-bottom:12px;">
                  ✨ Premium Features Now Active On Your Account
                </div>
                <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;color:#334155;">
                  <tr>
                    <td style="padding:6px 0;">✓ <strong>Live Catalog Discovery:</strong> Your products are visible across 38 industry sectors.</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;">✓ <strong>Instant RFQ Broadcasts:</strong> Respond to buyer requests for quotes in real-time.</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;">✓ <strong>Verified Blue Badge:</strong> Build immediate credibility with corporate procurement teams.</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;">✓ <strong>10% Escrow Protection:</strong> Guaranteed advance protection on wholesale trade orders.</td>
                  </tr>
                </table>
              </div>

              <!-- Support & Assistance -->
              <div style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:16px 20px;font-size:12px;line-height:1.6;color:#64748b;">
                <strong>Need Assistance or Catalog Setup Help?</strong><br>
                Our dedicated onboarding desk is available to assist with bulk catalog uploads and buyer RFQ matching.<br>
                📞 Helpline &amp; WhatsApp: <strong>+91 84088 41998</strong> • Email: <a href="mailto:b2bbharat.in@gmail.com" style="color:#0284c7;text-decoration:none;">b2bbharat.in@gmail.com</a>
              </div>

            </td>
          </tr>

          <!-- Footer Legal & Corporate Information -->
          <tr>
            <td style="background-color:#0f172a;padding:24px 32px;text-align:center;border-top:1px solid #1e293b;">
              <div style="font-size:12px;font-weight:800;color:#f8fafc;letter-spacing:0.5px;">
                Aaudumbar Agro Private Limited (B2B India)
              </div>
              <div style="font-size:11px;color:#94a3b8;margin-top:4px;">
                GSTIN: 27ABACA6256A1Z2 • Plot No. 5, Prerna Nagar, Garkheda Parisar, Chhatrapati Sambhajinagar 431009, Maharashtra
              </div>
              <div style="font-size:10px;color:#64748b;margin-top:6px;">
                This is an official automated computer-generated payment receipt &amp; tax invoice. No physical signature required.
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

    // Plaintext Fallback
    const textContent = `
B2B INDIA — PAYMENT RECEIVED & SUBSCRIPTION ACTIVATED!
------------------------------------------------------
Dear ${companyName},

We have successfully received your payment. Your ${planLabel} is now officially ACTIVE!

🚀 START ADDING PRODUCTS NOW:
Your catalog quota has been unlocked. Enjoy your purchase and start listing your products to receive verified buyer RFQ quotes:
${addProductUrl}

OFFICIAL RECEIPT DETAILS:
- Receipt No: ${receiptNo}
- Company: ${companyName}
- Plan: ${planLabel}
- Payment ID: ${paymentId}
- Date: ${dateStr} at ${timeStr}
- Valid Duration: ${durationDays} Days
- Active Deadline: ${expiresAtFormatted}
- Total Amount Paid: ₹${totalAmount.toLocaleString('en-IN')} (Includes 18% GST)

Visit your dashboard anytime:
${dashboardUrl}

Need assistance? Contact our central desk:
📞 +91 84088 41998 | ✉️ b2bbharat.in@gmail.com

Aaudumbar Agro Private Limited (B2B India)
GSTIN: 27ABACA6256A1Z2
    `;

    // Nodemailer configuration
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
      subject: `🎉 Payment Received & Plan Activated! [${receiptNo}] — Now You Can Add Products | B2B India`,
      text: textContent,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Subscription payment receipt email dispatched to ${email}:`, info.messageId);

    return {
      success: true,
      messageId: info.messageId,
      receiptNo,
      expiresAt,
    };
  } catch (error) {
    console.error('Error dispatching subscription receipt email:', error);
    return { success: false, error: error.message };
  }
}
