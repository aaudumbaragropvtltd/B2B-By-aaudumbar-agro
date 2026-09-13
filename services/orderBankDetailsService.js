import nodemailer from 'nodemailer';

/**
 * Dispatches an official Quotation-style 90% Balance Payment & Bank Details email
 * with complete Two-Party Matrix (Aaudumbar Agro Pvt. Ltd. and Buyer),
 * including both Company Names, GSTIN numbers, contact details, commodity breakdown,
 * 10% advance payment reconciliation, and official SBI banking details for the 90% balance payment.
 *
 * Bank Details:
 * Account Name: Aaudumbar Agro Pvt. Ltd.
 * Account No.: 20521984403
 * IFSC Code: SBIN0011514
 * Bank: State Bank of India
 * Branch: Garkheda Parisar, Chhatrapati Sambhajinagar
 * Account Type: Current Account
 *
 * @param {Object} orderData - The order record
 * @param {Object} options - Sending options (buyerEmail, buyerCompanyName, buyerGstin, buyerPhone, hsnCode, etc.)
 */
export async function sendOrderBankDetailsEmail(orderData, options = {}) {
  try {
    const buyerEmail = (options.buyerEmail || options.customEmail || orderData.buyer_email || orderData.buyerEmail || '').trim();
    if (!buyerEmail || !buyerEmail.includes('@')) {
      return { success: false, error: 'Valid buyer email address is required' };
    }

    const today = new Date();
    const dateStr = today.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
    const nextDay = new Date(today);
    nextDay.setDate(today.getDate() + 2);
    const validUntilStr = nextDay.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });

    const txnId = orderData.transaction_id || orderData.transactionId || `TXN-IND-${Date.now().toString().slice(-6)}`;
    const orderId = orderData.id || `ORD-IND-${Date.now().toString().slice(-6)}`;
    const quoteRef = `AAPL/PAY90/2026/${(txnId.replace(/[^0-9a-zA-Z]/g, '')).slice(-6).toUpperCase() || Math.floor(100000 + Math.random() * 900000)}`;

    // Party 1: Seller / Billing Entity Details
    const seller = {
      companyName: 'Aaudumbar Agro Pvt. Ltd. (B2B India)',
      legalName: 'Aaudumbar Agro Private Limited',
      gstin: '27ABACA6256A1Z2',
      pan: 'ABACA6256A',
      phone: '+91 84088 41998',
      email: 'b2bbharat.in@gmail.com',
      address: 'Plot No. 5, Prerna Nagar, Garkheda Parisar, Chhatrapati Sambhajinagar 431009, Maharashtra',
      state: 'Maharashtra (State Code: 27)'
    };

    // Party 2: Buyer / Billed To Entity Details
    const buyerCompanyName = options.buyerCompanyName || orderData.buyer_company_name || orderData.company_name || orderData.buyer_name || 'Enterprise Buyer';
    const buyerContactPerson = orderData.buyer_contact_person || orderData.receiver_name || orderData.buyer_name || buyerCompanyName;
    const buyerPhone = options.buyerPhone || orderData.buyer_phone || orderData.buyer_whatsapp || orderData.receiver_phone || '+91 98765 43210';
    const buyerGstin = options.buyerGstin || orderData.buyer_gstin || orderData.gstin || '27AAACR1234F1Z5';
    const deliveryAddress = orderData.delivery_address || orderData.buyer_location || 'Registered Commercial Premises';

    // Commodity Specifications
    const productTitle = orderData.product_name || orderData.productTitle || 'Commercial Goods / Bulk Commodity';
    const hsnCode = options.hsnCode || orderData.hsn_code || orderData.hsn || '1006.30';
    const quantity = Number(orderData.quantity) || 1000;
    const unit = orderData.unit || 'Kg';
    const displayQty = `${quantity.toLocaleString('en-IN')} ${unit}`;

    const totalAmount = Number(orderData.total_amount || orderData.total_contract_value || orderData.totalAmount || orderData.total) || 0;
    const isHighVal = totalAmount >= 1000000;

    let unitAllInclusive = Number(orderData.price_per_unit || orderData.agreed_unit_price || orderData.pricePerUnit) || 0;
    if (unitAllInclusive <= 0 && quantity > 0 && totalAmount > 0) {
      unitAllInclusive = totalAmount / quantity;
    }

    const gstRate = Number(orderData.gst_rate) || 5;
    const unitBasePrice = unitAllInclusive / (1 + gstRate / 100);
    const unitGst = unitAllInclusive - unitBasePrice;
    const subtotal = Math.round(unitBasePrice * quantity);
    const totalGst = Math.round(unitGst * quantity);
    const logisticsCost = Number(orderData.logistics_cost || orderData.logisticsCost) || 0;

    // Escrow Breakdown
    const advancePaid = Number(orderData.advance_amount || orderData.advance_paid_10 || (isHighVal ? 100000 : Math.round(totalAmount * 0.1)));
    const balanceRemaining = Number(orderData.balance_amount || orderData.balance_due_90 || Math.max(0, totalAmount - advancePaid));

    // Brand Colors (Exact match with Quotation)
    const navy = '#1B3A5C';
    const orange = '#E8792B';
    const green = '#4A8C3F';

    // Plain text version fallback
    const textContent = `================================================================================
B2B INDIA — 90% BALANCE PAYMENT DETAILS & BANK TRANSFER INVOICE
================================================================================
Quotation / Notice Ref: ${quoteRef}
Date: ${dateStr} | Valid Until: ${validUntilStr}
Order ID: ${orderId}
Transaction Ref: ${txnId}

FROM (SELLER):
Aaudumbar Agro Pvt. Ltd.
Plot No. 5, Prerna Nagar, Garkheda Parisar, Chhatrapati Sambhajinagar 431009, Maharashtra
Phone: +91 84088 41998 | GSTIN: 27ABACA6256A1Z2

TO (BUYER):
Company: ${buyerCompanyName}
Contact: ${buyerContactPerson} | Phone: ${buyerPhone}
GSTIN: ${buyerGstin}
Delivery Address: ${deliveryAddress}

COMMODITY & ORDER BREAKDOWN:
Product: ${productTitle}
HSN: ${hsnCode} | Qty: ${displayQty} | Rate: ₹${unitAllInclusive.toLocaleString('en-IN')}/${unit}
Subtotal: ₹${subtotal.toLocaleString('en-IN')}
GST: ₹${totalGst.toLocaleString('en-IN')}
Total Contract Value: ₹${Math.round(totalAmount).toLocaleString('en-IN')}

FINANCIAL STATUS:
10% Advance Received (Escrow Verified): ₹${Math.round(advancePaid).toLocaleString('en-IN')} [CLEARED]
REMAINING 90% BALANCE DUE: ₹${Math.round(balanceRemaining).toLocaleString('en-IN')}

================================================================================
OFFICIAL BANK TRANSFER DETAILS (FOR 90% PAYMENT):
================================================================================
Beneficiary / Account Name: Aaudumbar Agro Pvt. Ltd.
Account Number: 20521984403
IFSC Code: SBIN0011514
Bank Name: State Bank of India (SBI)
Branch: Garkheda Parisar, Chhatrapati Sambhajinagar
Account Type: Current Account
Payment Remarks: ${quoteRef} / ${orderId}

Terms:
- 10% Advance has been confirmed and locked in Escrow.
- Please remit the 90% balance amount (₹${Math.round(balanceRemaining).toLocaleString('en-IN')}) via RTGS/NEFT/IMPS before dispatch.
- After transferring, please email UTR receipt to b2bbharat.in@gmail.com or WhatsApp +91 84088 41998.

Best regards,
Aaudumbar Agro Pvt. Ltd.
+91 84088 41998 | b2bbharat.in@gmail.com`;

    // Professional HTML Email (Exact Quotation UI & Template)
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
                  <div style="display:inline-block;background:${orange};color:#fff;font-size:11px;font-weight:800;padding:6px 16px;border-radius:6px;letter-spacing:1.5px;text-transform:uppercase;">90% BALANCE PAYMENT</div>
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
                  <strong style="color:${navy};">Reference No:</strong> ${quoteRef}<br>
                  <strong style="color:${navy};">Order ID:</strong> ${orderId}<br>
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
                    <strong style="color:${navy};font-size:13px;display:block;margin-bottom:2px;">Payment Request Issued To:</strong>
                    <strong>${buyerCompanyName}</strong><br>
                    ${buyerContactPerson && buyerContactPerson !== buyerCompanyName ? `<span>Contact Person: ${buyerContactPerson}</span><br>` : ''}
                    <span>Email: ${buyerEmail}</span>
                    ${buyerPhone ? `<br><span>Phone: ${buyerPhone}</span>` : ''}
                  </td>
                  <td style="width:50%;vertical-align:top;text-align:right;">
                    <strong style="color:${navy};">Buyer GSTIN:</strong> <span style="font-family:monospace;font-weight:bold;color:#0f172a;">${buyerGstin}</span><br>
                    <strong style="color:${navy};">Delivery Destination:</strong><br>
                    <span>${deliveryAddress}</span>
                  </td>
                </tr>
              </table>
            </div>
          </td>
        </tr>

        <!-- Greeting -->
        <tr>
          <td style="padding:16px 36px 8px;">
            <p style="margin:0;font-size:14px;color:#333;">Dear <strong>${buyerContactPerson || buyerCompanyName}</strong>,</p>
            <p style="margin:4px 0 0;font-size:13px;color:#666;">
              Your 10% advance deposit has been confirmed under B2B Escrow protection. Below are the official banking details to remit the remaining <strong>90% balance payment (₹${Math.round(balanceRemaining).toLocaleString('en-IN')})</strong> prior to final dispatch.
            </p>
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
                  <td style="padding:12px;font-size:13px;color:#333;font-weight:600;border-bottom:1px solid #eee;border-right:1px solid #eee;">${productTitle}</td>
                  <td style="padding:12px;font-size:12px;color:#666;text-align:center;font-family:monospace;border-bottom:1px solid #eee;border-right:1px solid #eee;">${hsnCode}</td>
                  <td style="padding:12px;font-size:13px;color:#333;text-align:center;border-bottom:1px solid #eee;border-right:1px solid #eee;">${displayQty}</td>
                  <td style="padding:12px;font-size:13px;color:#333;text-align:right;font-family:monospace;border-bottom:1px solid #eee;border-right:1px solid #eee;">₹${unitAllInclusive.toLocaleString('en-IN')}</td>
                  <td style="padding:12px;font-size:13px;color:${navy};text-align:right;font-weight:700;font-family:monospace;border-bottom:1px solid #eee;">₹${Math.round(totalAmount).toLocaleString('en-IN')}</td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>

        <!-- Financial Summary -->
        <tr>
          <td style="padding:0 36px 16px;">
            <table width="320" cellpadding="0" cellspacing="0" style="margin-left:auto;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
              <tr>
                <td style="padding:8px 12px;font-size:13px;color:#555;">Total Contract Value</td>
                <td style="padding:8px 12px;font-size:13px;color:#333;text-align:right;font-family:monospace;font-weight:600;">₹${Math.round(totalAmount).toLocaleString('en-IN')}</td>
              </tr>
              <tr style="background:#f0fdf4;">
                <td style="padding:8px 12px;font-size:13px;color:#166534;border-top:1px solid #e2e8f0;">✓ 10% Advance Received</td>
                <td style="padding:8px 12px;font-size:13px;color:#166534;text-align:right;font-family:monospace;font-weight:700;border-top:1px solid #e2e8f0;">₹${Math.round(advancePaid).toLocaleString('en-IN')}</td>
              </tr>
              <tr style="background:${navy};color:#ffffff;">
                <td style="padding:12px;font-size:14px;font-weight:800;letter-spacing:0.5px;">90% BALANCE PAYABLE</td>
                <td style="padding:12px;font-size:16px;font-weight:900;color:${orange};text-align:right;font-family:monospace;">₹${Math.round(balanceRemaining).toLocaleString('en-IN')}</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- OFFICIAL BANKING DETAILS (HIGHLIGHTED BOX) -->
        <tr>
          <td style="padding:0 36px 20px;">
            <div style="background:linear-gradient(180deg, #f8fafc 0%, #edf2f7 100%);border:2px solid ${navy};border-radius:10px;padding:18px 20px;box-shadow:0 2px 12px rgba(27,58,92,0.08);">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom:12px;border-bottom:2px dashed #cbd5e1;">
                    <div style="font-size:11px;font-weight:800;color:${orange};text-transform:uppercase;letter-spacing:1.5px;">OFFICIAL BANK TRANSFER DETAILS</div>
                    <div style="font-size:16px;font-weight:800;color:${navy};margin-top:2px;">Bank Transfer / RTGS / NEFT / IMPS</div>
                  </td>
                  <td style="text-align:right;padding-bottom:12px;border-bottom:2px dashed #cbd5e1;">
                    <span style="display:inline-block;background:#e0f2fe;color:#0369a1;font-size:10px;font-weight:700;padding:4px 10px;border-radius:4px;border:1px solid #bae6fd;">
                      🔒 VERIFIED ESCROW ACCOUNT
                    </span>
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="padding-top:14px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;line-height:1.9;">
                      <tr>
                        <td style="width:40%;color:#64748b;font-weight:600;">Beneficiary / Account Name:</td>
                        <td style="width:60%;color:#0f172a;font-weight:800;font-size:14px;">Aaudumbar Agro Pvt. Ltd.</td>
                      </tr>
                      <tr>
                        <td style="color:#64748b;font-weight:600;">Account Number:</td>
                        <td style="color:${navy};font-weight:900;font-size:18px;font-family:monospace;letter-spacing:1px;">
                          20521984403
                        </td>
                      </tr>
                      <tr>
                        <td style="color:#64748b;font-weight:600;">IFSC Code:</td>
                        <td style="color:${orange};font-weight:900;font-size:16px;font-family:monospace;letter-spacing:1px;">
                          SBIN0011514
                        </td>
                      </tr>
                      <tr>
                        <td style="color:#64748b;font-weight:600;">Bank Name:</td>
                        <td style="color:#0f172a;font-weight:700;">State Bank of India (SBI)</td>
                      </tr>
                      <tr>
                        <td style="color:#64748b;font-weight:600;">Account Type:</td>
                        <td style="color:#0f172a;font-weight:700;">Current Account</td>
                      </tr>
                      <tr>
                        <td style="color:#64748b;font-weight:600;">Branch:</td>
                        <td style="color:#475569;">Garkheda Parisar, Chhatrapati Sambhajinagar 431009</td>
                      </tr>
                      <tr>
                        <td style="color:#64748b;font-weight:600;">Payment Remarks / Reference:</td>
                        <td style="color:${navy};font-family:monospace;font-weight:700;">${quoteRef}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </div>
          </td>
        </tr>

        <!-- Terms & Dispatch Instructions -->
        <tr>
          <td style="padding:0 36px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8faf9;border:1px solid ${green}40;border-left:4px solid ${green};border-radius:8px;">
              <tr>
                <td style="padding:16px 20px;">
                  <div style="font-size:12px;font-weight:800;color:${green};text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Settlement & Dispatch Guidelines</div>
                  <table cellpadding="0" cellspacing="0" style="font-size:12px;color:#555;line-height:1.8;">
                    <tr><td style="padding-right:8px;color:${green};font-weight:700;">•</td><td><strong>Advance Confirmation:</strong> 10% advance deposit is safely locked in B2B India Escrow.</td></tr>
                    <tr><td style="padding-right:8px;color:${green};font-weight:700;">•</td><td><strong>90% Balance Remittance:</strong> Please transfer ₹${Math.round(balanceRemaining).toLocaleString('en-IN')} to the SBI account above prior to warehouse dispatch.</td></tr>
                    <tr><td style="padding-right:8px;color:${green};font-weight:700;">•</td><td><strong>Instant Clearance:</strong> Immediately upon transfer, please reply to this email with UTR / payment receipt or WhatsApp to <strong>+91 84088 41998</strong>.</td></tr>
                    <tr><td style="padding-right:8px;color:${green};font-weight:700;">•</td><td><strong>Tax Invoice:</strong> Final 100% Tax Invoice & E-Way Bill will be issued upon dock clearance.</td></tr>
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

    // Create real email transporter using Gmail credentials
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'b2bbharat.in@gmail.com',
        pass: 'jrwgvucuxrbepnei',
      },
    });

    const mailOptions = {
      from: '"B2B India by Aaudumbar Agro" <b2bbharat.in@gmail.com>',
      to: buyerEmail,
      cc: 'b2bbharat.in@gmail.com',
      subject: `Quotation & 90% Balance Payment Details [${quoteRef}] — B2B India | Aaudumbar Agro Pvt. Ltd.`,
      text: textContent,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`90% Bank Details email dispatched to ${buyerEmail}:`, info.messageId);

    return {
      success: true,
      messageId: info.messageId,
      recipientEmail: buyerEmail,
      quoteRef,
      balanceAmount: balanceRemaining,
      accountNo: '20521984403',
      ifscCode: 'SBIN0011514'
    };
  } catch (error) {
    console.error('Failed to dispatch 90% bank details email:', error);
    return {
      success: false,
      error: error.message || 'Failed to dispatch 90% payment banking details email'
    };
  }
}
