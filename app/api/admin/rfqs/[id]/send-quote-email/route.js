import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

export async function POST(request, { params }) {
  try {
    const { id: rfqId } = await params;
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: { get(name) { return cookieStore.get(name)?.value; } }
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('role, company_name')
      .eq('firebase_uid', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required.' }, { status: 403 });
    }

    const body = await request.json();
    const { quoteId } = body;

    if (!quoteId) {
      return NextResponse.json({ error: 'Quote ID is required.' }, { status: 400 });
    }

    // 1. Fetch RFQ with buyer information
    const { data: rfq, error: rfqErr } = await supabaseAdmin
      .from('rfqs')
      .select('*, users!rfqs_buyer_id_fkey(company_name, registered_email, corporate_phone)')
      .eq('id', rfqId)
      .single();

    if (rfqErr || !rfq) {
      return NextResponse.json({ error: 'RFQ record not found.' }, { status: 404 });
    }

    // 2. Fetch Quote
    const { data: quote, error: quoteErr } = await supabaseAdmin
      .from('rfq_quotes')
      .select('*')
      .eq('id', quoteId)
      .single();

    if (quoteErr || !quote) {
      return NextResponse.json({ error: 'Quotation record not found.' }, { status: 404 });
    }

    const recipientEmail = rfq.buyer_email || rfq.users?.registered_email;

    if (!recipientEmail) {
      return NextResponse.json({ error: 'No buyer email address found on file for this RFQ.' }, { status: 400 });
    }

    const quantity = Number(rfq.quantity) || 1;
    const gstRate = Number(quote.gst_rate) || 5;

    // Commercial calculation:
    // Supplier base price already includes 3% platform commission.
    // Buyer sees clean unit rate and total deal without commission line items.
    let unitBasePrice = Number(quote.price_before_gst) || 0;
    const totalQuotedPrice = Number(quote.quoted_price) || 0;

    // Normalize unit base price in case total lot was passed in price_before_gst
    if (unitBasePrice > 0 && quantity > 1 && totalQuotedPrice > 0 && unitBasePrice > totalQuotedPrice * 0.7 && unitBasePrice > 100000) {
      unitBasePrice = unitBasePrice / quantity;
    }

    const unitGst = unitBasePrice * (gstRate / 100);
    const unitAllInclusive = unitBasePrice + unitGst;

    const totalOrderPayable = totalQuotedPrice > 0 
      ? Math.round(totalQuotedPrice) 
      : Math.round(unitAllInclusive * quantity);

    const advance10 = Math.round(totalOrderPayable * 0.10);
    const remaining90 = totalOrderPayable - advance10;

    // 3. Send email via Nodemailer
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'b2bbharat.in@gmail.com',
          pass: process.env.SMTP_PASSWORD || 'jrwgvucuxrbepnei',
        },
      });

      const navy = '#1e3a5f';
      const orange = '#ea580c';
      const emerald = '#16a34a';

      const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="margin:0;padding:0;background-color:#f4f5f7;font-family:'Segoe UI',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7;padding:30px 0;">
          <tr>
            <td align="center">
              <table width="640" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
                <tr>
                  <td style="background: linear-gradient(135deg, ${navy} 0%, #0f172a 100%);padding:32px 40px;">
                    <div style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:1px;">B2B INDIA</div>
                    <div style="font-size:11px;color:${orange};font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-top:4px;">Official Verified Quotation Dispatch</div>
                  </td>
                </tr>
                <tr>
                    <p style="font-size:16px;color:#1e293b;font-weight:bold;margin:0 0 8px;">
                      Dear ${rfq.users?.full_name || rfq.users?.company_name || 'Valued Buyer'},
                    </p>
                    <p style="font-size:14px;color:#475569;line-height:1.6;margin:0 0 20px;">
                      B2B India has reviewed and generated an official verified quotation for your procurement inquiry: <strong>${rfq.product_name}</strong>.
                    </p>

                    <!-- Buyer & Requirement Details -->
                    <div style="background:#f8fafc;border-radius:12px;padding:16px 20px;border:1px solid #e2e8f0;margin-bottom:24px;">
                      <table width="100%" style="font-size:13px;color:#334155;">
                        <tr>
                          <td style="padding:4px 0;width:40%;color:#64748b;"><strong>Buyer / Company:</strong></td>
                          <td><strong>${rfq.users?.company_name || rfq.users?.full_name || 'Enterprise Buyer'}</strong></td>
                        </tr>
                        <tr>
                          <td style="padding:4px 0;color:#64748b;"><strong>Buyer GSTIN:</strong></td>
                          <td><strong style="color:${navy};font-family:monospace;">${rfq.users?.gst_number || rfq.buyer_gst || '27AAECR1234F1Z5'}</strong></td>
                        </tr>
                        <tr>
                          <td style="padding:4px 0;color:#64748b;"><strong>Delivery Address:</strong></td>
                          <td>${rfq.destination || [rfq.users?.warehouse_address, rfq.users?.city, rfq.users?.state, rfq.users?.pincode].filter(Boolean).join(', ') || 'Pan India Godown'}</td>
                        </tr>
                        <tr>
                          <td style="padding:4px 0;color:#64748b;"><strong>Required Quantity:</strong></td>
                          <td><strong>${quantity.toLocaleString('en-IN')} ${rfq.unit}</strong></td>
                        </tr>
                        <tr>
                          <td style="padding:4px 0;color:#64748b;"><strong>Target Budget:</strong></td>
                          <td>₹${Number(rfq.target_price || 0).toLocaleString('en-IN')} / ${rfq.unit}</td>
                        </tr>
                      </table>
                    </div>

                    <!-- Price Breakdown Matrix -->
                    <h3 style="font-size:15px;color:${navy};margin:0 0 12px;text-transform:uppercase;letter-spacing:1px;">Approved Price Breakdown</h3>
                    <table width="100%" style="font-size:14px;color:#334155;border-collapse:collapse;margin-bottom:20px;">
                      <tr>
                        <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;">Base Price (Per ${rfq.unit}):</td>
                        <td style="text-align:right;font-weight:bold;color:#0f172a;">₹${unitBasePrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      </tr>
                      <tr>
                        <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;">GST (${gstRate}%):</td>
                        <td style="text-align:right;font-weight:bold;color:${emerald};">+₹${unitGst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      </tr>
                      <tr style="background:#f1f5f9;">
                        <td style="padding:12px 10px;font-size:15px;font-weight:bold;color:${navy};">All-Inclusive Unit Rate:</td>
                        <td style="text-align:right;padding:12px 10px;font-size:16px;font-weight:bold;color:${orange};">₹${unitAllInclusive.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / ${rfq.unit}</td>
                      </tr>
                      <tr style="background:#fffbeb;border:1px solid #fef3c7;">
                        <td style="padding:14px 10px;font-size:16px;font-weight:bold;color:#0f172a;">Total Deal Amount (${quantity.toLocaleString('en-IN')} ${rfq.unit}):</td>
                        <td style="text-align:right;padding:14px 10px;font-size:20px;font-weight:900;color:${orange};">₹${totalOrderPayable.toLocaleString('en-IN')}</td>
                      </tr>
                    </table>

                    <!-- Logistics & Terms -->
                    <div style="background:#f0fdf4;border-left:4px solid ${emerald};padding:14px 18px;border-radius:6px;margin-bottom:24px;">
                      <p style="margin:0 0 4px;font-size:13px;color:#166534;"><strong>Dispatch From Godown:</strong> ${quote.supplier_location || 'Verified Godown'}</p>
                      <p style="margin:0 0 4px;font-size:13px;color:#166534;"><strong>Estimated Transit Time:</strong> ${quote.delivery_days || 7} Days</p>
                      ${quote.notes ? `<p style="margin:4px 0 0;font-size:13px;color:#166534;"><strong>Supplier Remarks:</strong> "${quote.notes}"</p>` : ''}
                    </div>

                    <!-- Escrow Guarantee -->
                    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:16px 20px;margin-bottom:28px;text-align:center;">
                      <p style="margin:0 0 6px;font-size:14px;color:#1e40af;font-weight:bold;">
                        🛡️ 10% Advance Escrow Protection: Lock Deal with 10% Advance (₹${advance10.toLocaleString('en-IN')})
                      </p>
                      <p style="margin:0;font-size:12px;color:#3b82f6;">
                        Remaining 90% balance (₹${remaining90.toLocaleString('en-IN')}) is released only after physical warehouse dock inspection.
                      </p>
                    </div>

                    <!-- CTA -->
                    <div style="text-align:center;margin-bottom:20px;">
                      <a href="https://b2bindia.site/orders" style="display:inline-block;background:linear-gradient(135deg, ${orange} 0%, #c2410c 100%);color:#ffffff;text-decoration:none;font-weight:bold;padding:14px 32px;border-radius:10px;font-size:15px;box-shadow:0 4px 12px rgba(234,88,12,0.3);">
                        ⚡ View Quote & Buy Now in Dashboard
                      </a>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;text-align:center;font-size:12px;color:#94a3b8;">
                    This is an official transaction email from B2B India. For assistance, visit <a href="https://b2bindia.site" style="color:#ea580c;text-decoration:none;">b2bindia.site</a> or email <a href="mailto:support@b2bindia.site" style="color:#1e3a5f;font-weight:bold;text-decoration:none;">support@b2bindia.site</a>.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
      `;

      const mailOptions = {
        from: '"B2B India RFQ Desk" <b2bbharat.in@gmail.com>',
        to: recipientEmail,
        subject: `[B2B India] Quotation Approved: ${rfq.product_name} (₹${unitAllInclusive.toFixed(2)}/${rfq.unit})`,
        html: htmlContent,
      };

      await transporter.sendMail(mailOptions);
      console.log('Quotation email dispatched by admin to:', recipientEmail);
    } catch (mailErr) {
      console.error('Nodemailer dispatch failed:', mailErr);
      return NextResponse.json({ error: `Failed to send email: ${mailErr.message}` }, { status: 500 });
    }

    // 4. Update status in rfq_quotes
    await supabaseAdmin
      .from('rfq_quotes')
      .update({
        status: 'email_dispatched',
        updated_at: new Date().toISOString()
      })
      .eq('id', quoteId);

    return NextResponse.json({
      success: true,
      recipientEmail: recipientEmail,
      message: `Quotation email successfully dispatched to ${recipientEmail}`
    });

  } catch (error) {
    console.error('Error in send-quote-email route:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
