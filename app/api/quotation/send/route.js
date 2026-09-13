import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      buyerEmail, 
      buyerName,
      buyerCompany,
      buyerGst,
      buyerAddress,
      buyerPhone,
      product, 
      quantity, 
      weight, 
      subtotal, 
      gst, 
      logisticsCost,
      platformCommission,
      total,
    } = body;

    if (!buyerEmail || !product || !quantity) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const today = new Date();
    const dateStr = today.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
    const nextDay = new Date(today);
    nextDay.setDate(today.getDate() + 1);
    const validUntilStr = nextDay.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });

    const quoteId = Date.now().toString(36).toUpperCase().slice(-5);
    const quoteRef = `AAPL/2026/${quoteId}`;

    const unitPrice = Number(product.base_price_per_unit);
    const displayQty = Number(quantity).toLocaleString('en-IN') + ' ' + (product.unit_label || '');
    const productSubtotal = subtotal || 0;
    const logCost = logisticsCost || 0;
    const commission = platformCommission || 0;
    const gstAmount = gst || 0;
    const grandTotal = total || 0;

    // Brand colors
    const navy = '#1B3A5C';
    const orange = '#E8792B';
    const green = '#4A8C3F';

    // Plain text fallback
    const textContent = `QUOTATION ${quoteRef}
Date: ${dateStr} | Valid Until: ${validUntilStr}

From: Aaudumbar Agro Pvt. Ltd.
Plot No. 5, Prerna Nagar, Garkheda Parisar, Chhatrapati Sambhajinagar 431009, Maharashtra
Phone: +91 84088 41998 | GSTIN: 27ABACA6256A1Z2

To (Buyer): ${buyerCompany || buyerName || 'Valued Buyer'}
Contact: ${buyerName || ''} | Phone: ${buyerPhone || ''}
GSTIN: ${buyerGst || 'Not Registered'}
Delivery Address: ${buyerAddress || 'Pan India Godown'}

Product: ${product.title}
HSN: ${product.hsn_code || 'XXXX'} | Qty: ${displayQty} | Rate: ₹${unitPrice.toLocaleString('en-IN')} | Amount: ₹${productSubtotal.toLocaleString('en-IN')}
${logCost > 0 ? `Logistics: ₹${logCost.toLocaleString('en-IN')}` : ''}

Subtotal: ₹${(productSubtotal + logCost).toLocaleString('en-IN')}
Taxes: ₹${Math.round(gstAmount).toLocaleString('en-IN')}
TOTAL: ₹${Math.round(grandTotal).toLocaleString('en-IN')}

Terms: 10% advance with PO, 90% before dispatch. Delivery within 7 days. Valid for 1 day.

Best regards,
Aaudumbar Agro Pvt. Ltd.
+91 84088 41998 | b2bbharat.in@gmail.com`;

    // Professional HTML email
    const htmlContent = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f5f7;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7;padding:24px 0;">
    <tr><td align="center">
      <table width="640" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header Bar -->
        <tr>
          <td style="background: linear-gradient(135deg, ${navy} 0%, #234b73 100%);padding:28px 36px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="vertical-align:middle;">
                  <div style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:1px;">B2B INDIA</div>
                  <div style="font-size:10px;color:${orange};font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-top:2px;">by Aaudumbar Agro Pvt. Ltd.</div>
                </td>
                <td style="text-align:right;vertical-align:middle;">
                  <div style="display:inline-block;background:${orange};color:#fff;font-size:11px;font-weight:800;padding:6px 16px;border-radius:6px;letter-spacing:1.5px;text-transform:uppercase;">QUOTATION</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Quotation Meta (Two-Party Matrix) -->
        <tr>
          <td style="padding:24px 36px 0;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size:12px;color:#666;width:50%;vertical-align:top;">
                  <strong style="color:${navy};">Quotation No:</strong> ${quoteRef}<br>
                  <strong style="color:${navy};">Date:</strong> ${dateStr}<br>
                  <strong style="color:${navy};">Valid Until:</strong> <span style="color:${orange};font-weight:700;">${validUntilStr}</span>
                </td>
                <td style="text-align:right;font-size:12px;color:#666;width:50%;vertical-align:top;">
                  <strong style="color:${navy};">Supplier Origin:</strong><br>
                  Aaudumbar Agro Pvt. Ltd.<br>
                  Garkheda Parisar, Sambhajinagar<br>
                  GSTIN: 27ABACA6256A1Z2
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Buyer Information Card -->
        <tr>
          <td style="padding:16px 36px 0;">
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px 16px;font-size:12px;color:#334155;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:50%;vertical-align:top;">
                    <strong style="color:${navy};font-size:13px;display:block;margin-bottom:2px;">Quotation Issued To:</strong>
                    <strong>${buyerCompany || buyerName || 'Enterprise Buyer'}</strong><br>
                    ${buyerName && buyerName !== buyerCompany ? `<span>Contact Person: ${buyerName}</span><br>` : ''}
                    <span>Email: ${buyerEmail}</span>
                    ${buyerPhone ? `<br><span>Phone: ${buyerPhone}</span>` : ''}
                  </td>
                  <td style="width:50%;vertical-align:top;text-align:right;">
                    <strong style="color:${navy};">Buyer GSTIN:</strong> <span style="font-family:monospace;font-weight:bold;color:#0f172a;">${buyerGst || 'Not Registered'}</span><br>
                    <strong style="color:${navy};">Delivery Address:</strong><br>
                    <span>${buyerAddress || 'Pan India Godown Delivery'}</span>
                  </td>
                </tr>
              </table>
            </div>
          </td>
        </tr>

        <!-- Greeting -->
        <tr>
          <td style="padding:16px 36px 8px;">
            <p style="margin:0;font-size:14px;color:#333;">Dear <strong>${buyerName || buyerCompany || 'Valued Buyer'}</strong>,</p>
            <p style="margin:4px 0 0;font-size:13px;color:#666;">Please review your official price quotation below with direct escrow protection.</p>
          </td>
        </tr>

        <!-- Product Table -->
        <tr>
          <td style="padding:16px 36px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-radius:8px;overflow:hidden;border:1px solid #e0e4e8;">
              <thead>
                <tr style="background:${navy};">
                  <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:0.5px;border-right:1px solid rgba(255,255,255,0.1);">#</th>
                  <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:0.5px;border-right:1px solid rgba(255,255,255,0.1);">Product Description</th>
                  <th style="padding:10px 12px;text-align:center;font-size:11px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:0.5px;border-right:1px solid rgba(255,255,255,0.1);">HSN</th>
                  <th style="padding:10px 12px;text-align:center;font-size:11px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:0.5px;border-right:1px solid rgba(255,255,255,0.1);">Qty</th>
                  <th style="padding:10px 12px;text-align:right;font-size:11px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:0.5px;border-right:1px solid rgba(255,255,255,0.1);">Rate (₹)</th>
                  <th style="padding:10px 12px;text-align:right;font-size:11px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:0.5px;">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr style="background:#ffffff;">
                  <td style="padding:12px;font-size:13px;color:#333;border-bottom:1px solid #eee;border-right:1px solid #eee;">1</td>
                  <td style="padding:12px;font-size:13px;color:#333;font-weight:600;border-bottom:1px solid #eee;border-right:1px solid #eee;">${product.title}</td>
                  <td style="padding:12px;font-size:12px;color:#666;text-align:center;font-family:monospace;border-bottom:1px solid #eee;border-right:1px solid #eee;">${product.hsn_code || 'XXXX'}</td>
                  <td style="padding:12px;font-size:13px;color:#333;text-align:center;border-bottom:1px solid #eee;border-right:1px solid #eee;">${displayQty}</td>
                  <td style="padding:12px;font-size:13px;color:#333;text-align:right;font-family:monospace;border-bottom:1px solid #eee;border-right:1px solid #eee;">₹${unitPrice.toLocaleString('en-IN')}</td>
                  <td style="padding:12px;font-size:13px;color:${navy};text-align:right;font-weight:700;font-family:monospace;border-bottom:1px solid #eee;">₹${productSubtotal.toLocaleString('en-IN')}</td>
                </tr>
                ${logCost > 0 ? `
                <tr style="background:#fafbfc;">
                  <td style="padding:12px;font-size:13px;color:#333;border-bottom:1px solid #eee;border-right:1px solid #eee;">2</td>
                  <td style="padding:12px;font-size:13px;color:#333;font-weight:600;border-bottom:1px solid #eee;border-right:1px solid #eee;">Logistics / Shipping</td>
                  <td style="padding:12px;font-size:12px;color:#666;text-align:center;font-family:monospace;border-bottom:1px solid #eee;border-right:1px solid #eee;">9965</td>
                  <td style="padding:12px;font-size:13px;color:#333;text-align:center;border-bottom:1px solid #eee;border-right:1px solid #eee;">${weight || '--'} kg</td>
                  <td style="padding:12px;font-size:13px;color:#333;text-align:right;font-family:monospace;border-bottom:1px solid #eee;border-right:1px solid #eee;">₹2.30</td>
                  <td style="padding:12px;font-size:13px;color:${navy};text-align:right;font-weight:700;font-family:monospace;border-bottom:1px solid #eee;">₹${logCost.toLocaleString('en-IN')}</td>
                </tr>
                ` : ''}
              </tbody>
            </table>
          </td>
        </tr>

        <!-- Financial Summary -->
        <tr>
          <td style="padding:0 36px 16px;">
            <table width="280" cellpadding="0" cellspacing="0" style="margin-left:auto;border-collapse:collapse;">
              <tr>
                <td style="padding:8px 12px;font-size:13px;color:#555;">Subtotal</td>
                <td style="padding:8px 12px;font-size:13px;color:#333;text-align:right;font-family:monospace;font-weight:600;">₹${(productSubtotal + logCost).toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td style="padding:8px 12px;font-size:13px;color:#555;border-top:1px solid #eee;">Taxes (CGST/SGST/IGST)</td>
                <td style="padding:8px 12px;font-size:13px;color:#333;text-align:right;font-family:monospace;font-weight:600;border-top:1px solid #eee;">₹${Math.round(gstAmount).toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td style="padding:12px;font-size:15px;font-weight:800;color:#fff;background:${navy};border-radius:0 0 0 8px;">TOTAL AMOUNT</td>
                <td style="padding:12px;font-size:15px;font-weight:800;color:${orange};background:${navy};text-align:right;font-family:monospace;border-radius:0 0 8px 0;">₹${Math.round(grandTotal).toLocaleString('en-IN')}</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Terms & Conditions -->
        <tr>
          <td style="padding:0 36px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8faf9;border:1px solid ${green}40;border-left:4px solid ${green};border-radius:8px;">
              <tr>
                <td style="padding:16px 20px;">
                  <div style="font-size:12px;font-weight:800;color:${green};text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Terms & Conditions</div>
                  <table cellpadding="0" cellspacing="0" style="font-size:12px;color:#555;line-height:1.8;">
                    <tr><td style="padding-right:8px;color:${green};font-weight:700;">•</td><td><strong>Payment:</strong> 10% advance with PO, 90% before dispatch.</td></tr>
                    <tr><td style="padding-right:8px;color:${green};font-weight:700;">•</td><td><strong>Delivery:</strong> Within 7 days of confirmed Purchase Order.</td></tr>
                    <tr><td style="padding-right:8px;color:${green};font-weight:700;">•</td><td><strong>Validity:</strong> This quotation is valid for 1 day only.</td></tr>
                    <tr><td style="padding-right:8px;color:${green};font-weight:700;">•</td><td><strong>Escrow:</strong> All payments are secured through B2B India Escrow.</td></tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:${navy};padding:20px 36px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size:12px;color:#fff;opacity:0.8;">
                  <strong>Aaudumbar Agro Pvt. Ltd.</strong><br>
                  <span style="font-size:11px;opacity:0.7;">Plot No. 5, Prerna Nagar, Garkheda Parisar, Chhatrapati Sambhajinagar 431009, Maharashtra</span>
                </td>
                <td style="text-align:right;font-size:11px;color:#fff;opacity:0.7;">
                  📞 +91 84088 41998<br>
                  ✉ b2bbharat.in@gmail.com
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Bottom accent bar -->
        <tr>
          <td style="height:4px;background:linear-gradient(90deg, ${navy}, ${orange}, ${green});"></td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

    // Create the real email transporter using provided Gmail credentials
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'b2bbharat.in@gmail.com',
        pass: 'jrwgvucuxrbepnei', // App Password provided by user
      },
    });

    const mailOptions = {
      from: '"B2B India by Aaudumbar Agro" <b2bbharat.in@gmail.com>',
      to: buyerEmail,
      subject: `Quotation ${quoteRef} — B2B India | Aaudumbar Agro Pvt. Ltd.`,
      text: textContent,
      html: htmlContent,
    };

    // Send the real email
    const info = await transporter.sendMail(mailOptions);
    console.log('Quotation Email Sent:', info.messageId);

    return NextResponse.json({ success: true, message: 'Quotation sent successfully.', quoteRef });

  } catch (error) {
    console.error('Failed to send quotation email:', error);
    return NextResponse.json({ error: 'Failed to send email. Check console for details.' }, { status: 500 });
  }
}
