import nodemailer from 'nodemailer';

// Nodemailer SMTP Transporter
export function getEmailTransporter() {
  const user = process.env.EMAIL_USER || 'b2bbharat.in@gmail.com';
  const pass = process.env.EMAIL_PASS || 'jrwgvucuxrbepnei';

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
}

/**
 * Pre-configured B2B India Email Templates
 */
export const EMAIL_TEMPLATES = {
  '1st_of_month': {
    id: '1st_of_month',
    title: '🌾 1st of Month: Wholesale Price Update Reminder',
    badge: '1ST OF MONTH REMINDER',
    badgeBg: '#E8792B',
    subject: '🌾 [1st of Month Reminder] Update Your Wholesale Prices & Catalog | B2B India',
    preheader: 'Keep your wholesale commodity prices refreshed so verified bulk buyers receive accurate quotes.',
    description: 'Scheduled for the 1st of every month. Prompts all registered suppliers to update catalog spot rates.',
  },
  '5th_of_month': {
    id: '5th_of_month',
    title: '🚨 5th of Month: Urgent Price Verification & RFQ Protection',
    badge: 'URGENT 5TH CHECK',
    badgeBg: '#dc2626',
    subject: '🚨 [Urgent: 5th of Month] Confirm Your Active Spot Rates Today | B2B India',
    preheader: 'Important notice: High-volume bulk buyer RFQs are actively matching this week.',
    description: 'Scheduled for the 5th of every month. Follows up with suppliers who have not updated rates.',
  },
  'buyer_demand': {
    id: 'buyer_demand',
    title: '📢 High Buyer Demand & Bulk Purchase Notice',
    badge: 'BUYER DEMAND ALERT',
    badgeBg: '#2563eb',
    subject: '📢 [High Buyer Demand] Verified Institutional Purchase Orders Active in Mandis | B2B India',
    preheader: 'Fresh wholesale purchase requests with guaranteed 10% advance escrow protection.',
    description: 'Announces surging buyer demand, new RFQs, and active procurement requirements.',
  },
  'custom': {
    id: 'custom',
    title: '✨ Custom Announcement / Gemini AI Campaign',
    badge: 'OFFICIAL NOTICE',
    badgeBg: '#7c3aed',
    subject: 'Important Trade Update from B2B India Marketplace',
    preheader: 'Official trade announcement from B2B India (Aaudumbar Agro Pvt. Ltd.).',
    description: 'Compose a custom campaign or generate dynamically using Google Gemini AI.',
  },
};

/**
 * Render Complete Responsive HTML Email
 * Designed with the exact B2B India Quotation UI Aesthetic (Navy #1B3A5C, Orange #E8792B, Green #16a34a)
 * 100% Mobile Responsive with fluid tables and media queries.
 */
export function renderEmailHtml({
  templateKey = '1st_of_month',
  recipient = {},
  customSubject = '',
  customBody = '',
}) {
  const navy = '#1B3A5C';
  const orange = '#E8792B';
  const green = '#16a34a';

  const recipientName = recipient.name || recipient.company_name || recipient.contact_name || 'Valued Trade Partner';
  const companyName = recipient.company_name || recipient.name || 'Enterprise Partner';
  const recipientEmail = recipient.email || 'partner@demo.b2bindia.site';
  const recipientPhone = recipient.phone ? (String(recipient.phone).startsWith('+') ? recipient.phone : `+${recipient.phone}`) : '+91 XXXXXXXXXX';
  const location = recipient.location || 'Maharashtra, India';

  const portalUrl = 'https://b2bindia.site/dashboard/products';
  const rfqUrl = 'https://b2bindia.site/rfq';
  const supportPhone = '+91 84088 41998';
  const supportEmail = 'support@b2bindia.site';

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const currentMonthYear = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const cycleCode = `${now.toLocaleString('en-US', { month: 'short' }).toUpperCase()}-${now.getFullYear()}`;
  const noticeRef = `B2B-REM-${cycleCode}-${String(recipient.id || '101').slice(0, 4)}`;

  const tpl = EMAIL_TEMPLATES[templateKey] || EMAIL_TEMPLATES['1st_of_month'];
  const finalSubject = customSubject || tpl.subject;
  const badgeText = tpl.badge;
  const badgeBg = tpl.badgeBg;

  // Custom body or template-specific content
  let mainBodyHtml = '';

  if (templateKey === '1st_of_month') {
    mainBodyHtml = `
      <!-- Greeting -->
      <tr>
        <td class="responsive-padding" style="padding:16px 36px 8px;">
          <p style="margin:0;font-size:15px;color:#1e293b;">Dear <strong>${companyName}</strong> (Attn: ${recipientName}),</p>
          <p style="margin:6px 0 0;font-size:13px;color:#64748b;line-height:1.5;">
            Greetings from <strong>B2B India Marketplace (Aaudumbar Agro Pvt. Ltd.)</strong>. As we commence the trading month of <strong>${currentMonthYear}</strong>, please review and update your active wholesale commodity rates on your portal.
          </p>
        </td>
      </tr>

      <!-- Action Items Matrix Table (Quotation UI Style) -->
      <tr>
        <td class="responsive-padding" style="padding:16px 36px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-radius:8px;overflow:hidden;border:1px solid #e0e4e8;">
            <thead>
              <tr style="background:${navy};">
                <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:0.5px;border-right:1px solid rgba(255,255,255,0.1);">#</th>
                <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:0.5px;border-right:1px solid rgba(255,255,255,0.1);">Catalog Refresh Action</th>
                <th style="padding:10px 12px;text-align:center;font-size:11px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:0.5px;border-right:1px solid rgba(255,255,255,0.1);">Target Cycle</th>
                <th style="padding:10px 12px;text-align:right;font-size:11px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:0.5px;">Benefit</th>
              </tr>
            </thead>
            <tbody>
              <tr style="background:#ffffff;">
                <td style="padding:12px;font-size:13px;color:#333;border-bottom:1px solid #eee;border-right:1px solid #eee;font-weight:bold;">1</td>
                <td style="padding:12px;font-size:13px;color:#1e293b;font-weight:600;border-bottom:1px solid #eee;border-right:1px solid #eee;">
                  Wholesale Spot Rates Update
                  <div style="font-size:11px;color:#64748b;font-weight:normal;margin-top:2px;">Refresh active per-kg / per-quintal price per lot</div>
                </td>
                <td style="padding:12px;font-size:12px;color:#0f172a;text-align:center;font-family:monospace;border-bottom:1px solid #eee;border-right:1px solid #eee;font-weight:bold;">
                  ${cycleCode}
                </td>
                <td style="padding:12px;font-size:13px;color:${navy};text-align:right;font-weight:700;border-bottom:1px solid #eee;">
                  <span style="background:#ecfdf5;color:#047857;padding:3px 8px;border-radius:4px;font-size:11px;">🏆 #1 Ranking</span>
                </td>
              </tr>
              <tr style="background:#fafbfc;">
                <td style="padding:12px;font-size:13px;color:#333;border-bottom:1px solid #eee;border-right:1px solid #eee;font-weight:bold;">2</td>
                <td style="padding:12px;font-size:13px;color:#1e293b;font-weight:600;border-bottom:1px solid #eee;border-right:1px solid #eee;">
                  Available Godown Lots &amp; MOQ
                  <div style="font-size:11px;color:#64748b;font-weight:normal;margin-top:2px;">Verify minimum bulk order tonnage &amp; loading origin</div>
                </td>
                <td style="padding:12px;font-size:12px;color:#0f172a;text-align:center;font-family:monospace;border-bottom:1px solid #eee;border-right:1px solid #eee;font-weight:bold;">
                  Immediate
                </td>
                <td style="padding:12px;font-size:13px;color:${navy};text-align:right;font-weight:700;border-bottom:1px solid #eee;">
                  <span style="background:#eff6ff;color:#1d4ed8;padding:3px 8px;border-radius:4px;font-size:11px;">🔒 10% Escrow</span>
                </td>
              </tr>
              <tr style="background:#ffffff;">
                <td style="padding:12px;font-size:13px;color:#333;border-bottom:1px solid #eee;border-right:1px solid #eee;font-weight:bold;">3</td>
                <td style="padding:12px;font-size:13px;color:#1e293b;font-weight:600;border-bottom:1px solid #eee;border-right:1px solid #eee;">
                  Verified Active Spot Badge
                  <div style="font-size:11px;color:#64748b;font-weight:normal;margin-top:2px;">Prevents quote delays &amp; automated buyer inquiries</div>
                </td>
                <td style="padding:12px;font-size:12px;color:#0f172a;text-align:center;font-family:monospace;border-bottom:1px solid #eee;border-right:1px solid #eee;font-weight:bold;">
                  1st - 5th
                </td>
                <td style="padding:12px;font-size:13px;color:${navy};text-align:right;font-weight:700;border-bottom:1px solid #eee;">
                  <span style="background:#fef3c7;color:#92400e;padding:3px 8px;border-radius:4px;font-size:11px;">⚡ Zero Delay</span>
                </td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>

      <!-- CTA Button Row -->
      <tr>
        <td class="responsive-padding" style="padding:10px 36px 24px;text-align:center;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td align="center">
                <a href="${portalUrl}" target="_blank" class="mobile-cta" style="display:inline-block;background:${orange};color:#ffffff;font-size:14px;font-weight:800;text-decoration:none;padding:15px 36px;border-radius:8px;box-shadow:0 4px 14px rgba(232,121,43,0.35);letter-spacing:0.5px;text-transform:uppercase;">
                  👉 Update Your Wholesale Prices Now
                </a>
                <div style="font-size:11px;color:#64748b;margin-top:8px;">Takes under 2 minutes • Refreshes your entire marketplace catalog</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `;
  } else if (templateKey === '5th_of_month') {
    mainBodyHtml = `
      <!-- Greeting -->
      <tr>
        <td class="responsive-padding" style="padding:16px 36px 8px;">
          <p style="margin:0;font-size:15px;color:#1e293b;">Dear <strong>${companyName}</strong> (Attn: ${recipientName}),</p>
          <p style="margin:6px 0 0;font-size:13px;color:#dc2626;font-weight:bold;line-height:1.5;">
            ⚠️ URGENT 5TH CHECK: Your wholesale product prices have not been refreshed yet for ${currentMonthYear}.
          </p>
          <p style="margin:4px 0 0;font-size:13px;color:#64748b;line-height:1.5;">
            Verified bulk buyers across India are currently placing RFQs. To prevent temporary suspension of automated quotation matching, please confirm your spot rates today.
          </p>
        </td>
      </tr>

      <!-- Urgent Warning Box (Quotation Terms Style) -->
      <tr>
        <td class="responsive-padding" style="padding:12px 36px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff8f8;border:1px solid #fecaca;border-left:4px solid #dc2626;border-radius:8px;">
            <tr>
              <td style="padding:16px 20px;">
                <div style="font-size:12px;font-weight:800;color:#dc2626;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Action Required Before End of Day:</div>
                <table cellpadding="0" cellspacing="0" style="font-size:12px;color:#475569;line-height:1.8;">
                  <tr><td style="padding-right:8px;color:#dc2626;font-weight:700;">•</td><td><strong>Quotation Matching:</strong> Unverified rates cannot be matched with instant buyer purchase orders.</td></tr>
                  <tr><td style="padding-right:8px;color:#dc2626;font-weight:700;">•</td><td><strong>Catalog Ranking:</strong> Products without active spot rates lose their top-tier search visibility.</td></tr>
                  <tr><td style="padding-right:8px;color:#dc2626;font-weight:700;">•</td><td><strong>Escrow Protection:</strong> Active rate confirmation enables automatic 10% advance protection.</td></tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- CTA Button Row -->
      <tr>
        <td class="responsive-padding" style="padding:14px 36px 24px;text-align:center;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td align="center">
                <a href="${portalUrl}" target="_blank" class="mobile-cta" style="display:inline-block;background:#dc2626;color:#ffffff;font-size:14px;font-weight:800;text-decoration:none;padding:15px 36px;border-radius:8px;box-shadow:0 4px 14px rgba(220,38,38,0.35);letter-spacing:0.5px;text-transform:uppercase;">
                  ⚡ Confirm &amp; Verify Your Rates Today
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `;
  } else if (templateKey === 'buyer_demand') {
    mainBodyHtml = `
      <!-- Greeting -->
      <tr>
        <td class="responsive-padding" style="padding:16px 36px 8px;">
          <p style="margin:0;font-size:15px;color:#1e293b;">Dear <strong>${companyName}</strong> (Attn: ${recipientName}),</p>
          <p style="margin:6px 0 0;font-size:13px;color:#64748b;line-height:1.5;">
            Verified bulk institutional buyers and superstockists have posted fresh purchase requests across agri-commodities, spices, grains, and perishables.
          </p>
        </td>
      </tr>

      <!-- Demand Table -->
      <tr>
        <td class="responsive-padding" style="padding:12px 36px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-left:4px solid ${green};border-radius:8px;">
            <tr>
              <td style="padding:16px 20px;">
                <div style="font-size:12px;font-weight:800;color:${green};text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Active Buyer Procurement Notice</div>
                <table cellpadding="0" cellspacing="0" style="font-size:12px;color:#334155;line-height:1.8;">
                  <tr><td style="padding-right:8px;color:${green};font-weight:700;">•</td><td><strong>Advance Deposit:</strong> Direct 10% escrow advance secured before loading dispatch.</td></tr>
                  <tr><td style="padding-right:8px;color:${green};font-weight:700;">•</td><td><strong>Balance Clearance:</strong> 90% balance payable at warehouse weighment &amp; quality check.</td></tr>
                  <tr><td style="padding-right:8px;color:${green};font-weight:700;">•</td><td><strong>Direct RFQ Matching:</strong> Available to all suppliers with refreshed spot rates.</td></tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- CTA Button Row -->
      <tr>
        <td class="responsive-padding" style="padding:14px 36px 24px;text-align:center;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td align="center">
                <a href="${rfqUrl}" target="_blank" class="mobile-cta" style="display:inline-block;background:${navy};color:#ffffff;font-size:14px;font-weight:800;text-decoration:none;padding:15px 36px;border-radius:8px;box-shadow:0 4px 14px rgba(27,58,92,0.35);letter-spacing:0.5px;text-transform:uppercase;">
                  🔍 View Live RFQs &amp; Submit Quotation
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `;
  } else {
    // Custom Announcement
    mainBodyHtml = `
      <!-- Greeting -->
      <tr>
        <td class="responsive-padding" style="padding:16px 36px 8px;">
          <p style="margin:0;font-size:15px;color:#1e293b;">Dear <strong>${companyName}</strong> (Attn: ${recipientName}),</p>
          <div style="margin:10px 0 0;font-size:13px;color:#334155;line-height:1.7;white-space:pre-line;">
            ${customBody || 'Greetings from B2B India Marketplace. Please log into your supplier dashboard to check the latest trading updates and purchase orders.'}
          </div>
        </td>
      </tr>

      <!-- CTA Button Row -->
      <tr>
        <td class="responsive-padding" style="padding:16px 36px 24px;text-align:center;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td align="center">
                <a href="${portalUrl}" target="_blank" class="mobile-cta" style="display:inline-block;background:${orange};color:#ffffff;font-size:14px;font-weight:800;text-decoration:none;padding:15px 36px;border-radius:8px;box-shadow:0 4px 14px rgba(232,121,43,0.35);letter-spacing:0.5px;text-transform:uppercase;">
                  👉 Access Your B2B Dashboard
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `;
  }

  // Complete Email HTML with quotation aesthetics and mobile media queries
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${finalSubject}</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; border-radius: 0 !important; }
      .responsive-padding { padding-left: 18px !important; padding-right: 18px !important; }
      .mobile-stack { display: block !important; width: 100% !important; text-align: left !important; }
      .mobile-right { text-align: left !important; margin-top: 8px !important; }
      .mobile-cta { width: 100% !important; box-sizing: border-box !important; text-align: center !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f4f5f7;font-family:'Segoe UI',Arial,sans-serif;-webkit-font-smoothing:antialiased;">

  <!-- Outer background table -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f5f7;padding:24px 0;">
    <tr>
      <td align="center">
        <!-- Main Card (Max 640px) -->
        <table class="email-container" width="640" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:640px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);border:1px solid #e2e8f0;">

          <!-- 1. Header Bar (Quotation Style) -->
          <tr>
            <td style="background:linear-gradient(135deg, ${navy} 0%, #234b73 100%);padding:28px 36px;" class="responsive-padding">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td class="mobile-stack" style="vertical-align:middle;">
                    <div style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:1px;font-family:'Segoe UI',Arial,sans-serif;">B2B INDIA</div>
                    <div style="font-size:10px;color:${orange};font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-top:2px;">by Aaudumbar Agro Pvt. Ltd.</div>
                  </td>
                  <td class="mobile-stack mobile-right" style="text-align:right;vertical-align:middle;">
                    <div style="display:inline-block;background:${badgeBg};color:#ffffff;font-size:11px;font-weight:800;padding:6px 16px;border-radius:6px;letter-spacing:1.5px;text-transform:uppercase;">
                      ${badgeText}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 2. Notice Meta (Two-Party Matrix from Quotation) -->
          <tr>
            <td class="responsive-padding" style="padding:22px 36px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td class="mobile-stack" style="font-size:12px;color:#666;width:50%;vertical-align:top;line-height:1.6;">
                    <strong style="color:${navy};">Notice Ref:</strong> <span style="font-family:monospace;font-weight:bold;color:#0f172a;">${noticeRef}</span><br>
                    <strong style="color:${navy};">Dispatch Date:</strong> ${dateStr}<br>
                    <strong style="color:${navy};">Trading Cycle:</strong> <span style="color:${orange};font-weight:700;">${currentMonthYear}</span>
                  </td>
                  <td class="mobile-stack mobile-right" style="text-align:right;font-size:12px;color:#666;width:50%;vertical-align:top;line-height:1.6;">
                    <strong style="color:${navy};">Marketplace Desk:</strong><br>
                    Aaudumbar Agro Pvt. Ltd.<br>
                    Plot No. 5, Prerna Nagar, Garkheda Parisar,<br>
                    Chhatrapati Sambhajinagar 431009, Maharashtra<br>
                    GSTIN: 27ABACA6256A1Z2
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 3. Partner / Recipient Information Card (Quotation Buyer Card Style) -->
          <tr>
            <td class="responsive-padding" style="padding:16px 36px 0;">
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px 18px;font-size:12px;color:#334155;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td class="mobile-stack" style="width:55%;vertical-align:top;line-height:1.5;">
                      <strong style="color:${navy};font-size:13px;display:block;margin-bottom:2px;">Reminder Notice Issued To:</strong>
                      <strong style="color:#0f172a;font-size:13px;">${companyName}</strong><br>
                      <span>Contact Person: ${recipientName}</span><br>
                      <span>Registered Email: ${recipientEmail}</span><br>
                      <span>WhatsApp Phone: <strong style="color:#16a34a;">${recipientPhone}</strong></span>
                    </td>
                    <td class="mobile-stack mobile-right" style="width:45%;vertical-align:top;text-align:right;line-height:1.5;">
                      <strong style="color:${navy};">Trading Account:</strong> <span style="font-weight:bold;color:#16a34a;">✓ Verified Partner</span><br>
                      <strong style="color:${navy};">Registered Location:</strong><br>
                      <span>${location}</span>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- 4. Dynamic Main Body & Action Matrix -->
          ${mainBodyHtml}

          <!-- 5. Terms & Escrow Conditions Box (Exact Quotation Style) -->
          <tr>
            <td class="responsive-padding" style="padding:0 36px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8faf9;border:1px solid ${green}40;border-left:4px solid ${green};border-radius:8px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <div style="font-size:12px;font-weight:800;color:${green};text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">
                      Verified Trading Terms &amp; Escrow Protection
                    </div>
                    <table cellpadding="0" cellspacing="0" style="font-size:12px;color:#475569;line-height:1.8;">
                      <tr>
                        <td style="padding-right:8px;color:${green};font-weight:700;vertical-align:top;">•</td>
                        <td><strong>10% Escrow Advance:</strong> Verified buyers provide 10% advance deposit into escrow upon order confirmation.</td>
                      </tr>
                      <tr>
                        <td style="padding-right:8px;color:${green};font-weight:700;vertical-align:top;">•</td>
                        <td><strong>90% Balance Clearance:</strong> Full balance payment is cleared at warehouse gate weighment &amp; loading.</td>
                      </tr>
                      <tr>
                        <td style="padding-right:8px;color:${green};font-weight:700;vertical-align:top;">•</td>
                        <td><strong>Instant RFQ Proformas:</strong> Updated spot prices allow buyers to generate instant purchase orders without renegotiation.</td>
                      </tr>
                      <tr>
                        <td style="padding-right:8px;color:${green};font-weight:700;vertical-align:top;">•</td>
                        <td><strong>Direct Trade Support:</strong> Call our 24/7 mandi operations trade desk at <strong>+91 84088 41998</strong>.</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 6. Quotation-Style Navy Footer -->
          <tr>
            <td class="responsive-padding" style="background:${navy};padding:22px 36px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td class="mobile-stack" style="font-size:12px;color:#ffffff;opacity:0.9;line-height:1.5;">
                    <strong style="font-size:13px;">Aaudumbar Agro Pvt. Ltd. (B2B India)</strong><br>
                    <span style="font-size:11px;opacity:0.85;">Registered Office: Plot No. 5, Prerna Nagar, Garkheda Parisar, Chhatrapati Sambhajinagar 431009, Maharashtra</span><br>
                    <span style="font-size:10px;opacity:0.75;">GSTIN: 27ABACA6256A1Z2 • Official Trade Marketplace</span>
                  </td>
                  <td class="mobile-stack mobile-right" style="text-align:right;font-size:11px;color:#ffffff;opacity:0.85;line-height:1.6;">
                    📞 Helpline: <a href="tel:+918408841998" style="color:#ffffff;text-decoration:none;font-weight:bold;">${supportPhone}</a><br>
                    ✉ Official Email: <a href="mailto:${supportEmail}" style="color:${orange};text-decoration:none;font-weight:bold;">${supportEmail}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 7. Bottom Tri-Color Accent Bar -->
          <tr>
            <td style="height:4px;background:linear-gradient(90deg, ${navy}, ${orange}, ${green});"></td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
}

/**
 * Send Single Email via Nodemailer
 */
export async function sendBroadcastEmail({
  to,
  subject,
  html,
  text,
}) {
  const transporter = getEmailTransporter();
  const mailOptions = {
    from: '"B2B India Trade Desk" <b2bbharat.in@gmail.com>',
    to,
    subject,
    text: text || 'Please view this email in an HTML-compatible client.',
    html,
  };

  const info = await transporter.sendMail(mailOptions);
  return {
    success: true,
    messageId: info.messageId,
    recipient: to,
  };
}

/**
 * Dispatch Bulk Emails to Multiple Recipients
 */
export async function dispatchBulkEmails({
  recipients = [],
  templateKey = '1st_of_month',
  customSubject = '',
  customBody = '',
  delayMs = 350,
}) {
  const results = [];
  let sentCount = 0;
  let failedCount = 0;

  const tplConfig = EMAIL_TEMPLATES[templateKey] || EMAIL_TEMPLATES['1st_of_month'];
  const finalSubject = customSubject || tplConfig.subject;

  for (let i = 0; i < recipients.length; i++) {
    const user = recipients[i];
    if (!user.email || !user.email.includes('@')) continue;

    try {
      const html = renderEmailHtml({
        templateKey,
        recipient: user,
        customSubject: finalSubject,
        customBody,
      });

      const res = await sendBroadcastEmail({
        to: user.email,
        subject: finalSubject,
        html,
      });

      results.push({
        userId: user.id,
        email: user.email,
        success: true,
        messageId: res.messageId,
      });
      sentCount++;
    } catch (err) {
      console.error(`Failed to send broadcast email to ${user.email}:`, err.message);
      results.push({
        userId: user.id,
        email: user.email,
        success: false,
        error: err.message,
      });
      failedCount++;
    }

    if (i < recipients.length - 1 && delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return {
    total: recipients.length,
    sent: sentCount,
    failed: failedCount,
    results,
  };
}
