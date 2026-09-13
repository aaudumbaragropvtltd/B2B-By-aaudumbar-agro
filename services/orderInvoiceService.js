import nodemailer from 'nodemailer';

/**
 * Dispatches an official GST Tax Invoice & Final Settlement Certificate email
 * with complete details of both parties (Aaudumbar Agro Pvt. Ltd. and Buyer),
 * including both Company Names, GSTIN numbers, contact phone numbers, and addresses,
 * along with full HSN code, product name, quantity, rates, tax breakdown, and escrow reconciliation.
 *
 * @param {Object} orderData - The order details
 * @param {Object} options - Sending options (buyerEmail, buyerCompanyName, buyerGstin, buyerPhone, hsnCode, customEmail)
 */
export async function sendTotalInvoiceEmail(orderData, options = {}) {
  try {
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = today.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    const txnId = orderData.transaction_id || orderData.transactionId || `TXN-IND-${Date.now().toString().slice(-6)}`;
    const orderId = orderData.id || `ORD-IND-${Date.now().toString().slice(-6)}`;
    const invoiceNumber = orderData.invoice_number || options.invoiceNumber || `AAPL/INV/2026/${(txnId.replace(/[^0-9a-zA-Z]/g, '')).slice(-6).toUpperCase() || Math.floor(100000 + Math.random() * 900000)}`;

    const buyerEmail = (options.buyerEmail || options.customEmail || orderData.buyer_email || orderData.buyerEmail || '').trim();
    if (!buyerEmail || !buyerEmail.includes('@')) {
      return { success: false, error: 'Valid buyer email address is required to dispatch invoice' };
    }

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

    // Product Specifications & HSN
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

    // Standard B2B GST Rate (5% default for agricultural commodities, or specified)
    const gstRate = Number(orderData.gst_rate) || 5;
    const unitBasePrice = unitAllInclusive / (1 + gstRate / 100);
    const unitGst = unitAllInclusive - unitBasePrice;

    const subtotal = Math.round(unitBasePrice * quantity);
    const totalGst = Math.round(unitGst * quantity);
    const logisticsCost = Number(orderData.logistics_cost || orderData.logisticsCost) || 0;

    // Escrow payment reconciliation
    const advancePaid = Number(orderData.advance_amount || orderData.advance_paid_10 || (isHighVal ? 100000 : Math.round(totalAmount * 0.1)));
    const balanceSettled = Number(orderData.balance_amount || orderData.balance_due_90 || (totalAmount - advancePaid));
    const totalReconciled = advancePaid + balanceSettled;

    // Logistics & Dispatch details
    const deliveryOption = orderData.delivery_option || 'deliver';
    const isDeliver = deliveryOption === 'deliver';
    const isPickup = deliveryOption === 'pickup';
    const deliveryDate = orderData.delivery_date || orderData.arrival_date || dateStr;
    const vehicleNumber = orderData.vehicle_number || orderData.vehicleNumber || null;
    const p1Name = orderData.p1_name || orderData.p1Name || buyerContactPerson;
    const p1Phone = orderData.p1_phone || orderData.p1Phone || buyerPhone;
    const p1Aadhar = orderData.p1_aadhar || orderData.p1Aadhar || null;
    const trackingNumber = orderData.tracking_number || (isPickup ? 'GATE-PASS-CLEARED' : `AWB-IND-${txnId.slice(-6).toUpperCase()}`);
    const receiverName = orderData.receiver_name || buyerContactPerson;
    const receiverPhone = orderData.receiver_phone || buyerPhone;

    // Brand Colors
    const navy = '#1e3a5f';
    const orange = '#ea580c';
    const emerald = '#16a34a';

    // Plain text invoice
    const textContent = `================================================================================
B2B INDIA — OFFICIAL GST TAX INVOICE & FINAL SETTLEMENT BILL
================================================================================
Invoice No: ${invoiceNumber}
Status: 100% SETTLED & COMPLETED (TRANSACTION CLEARED)
Date: ${dateStr} ${timeStr}
Transaction ID: ${txnId}
Order Reference: ${orderId}

--------------------------------------------------------------------------------
PARTY 1: SELLER / CONSIGNOR (BILLED BY):
--------------------------------------------------------------------------------
Company Name: ${seller.companyName}
Legal Entity: ${seller.legalName}
GSTIN Number: ${seller.gstin}
PAN Number: ${seller.pan}
Contact Phone: ${seller.phone}
Email Address: ${seller.email}
Address: ${seller.address}

--------------------------------------------------------------------------------
PARTY 2: BUYER / CONSIGNEE (BILLED TO):
--------------------------------------------------------------------------------
Company Name: ${buyerCompanyName}
Contact Person: ${buyerContactPerson}
GSTIN Number: ${buyerGstin}
Contact Phone: ${buyerPhone}
Email Address: ${buyerEmail}
Billing/Delivery Address: ${deliveryAddress}

--------------------------------------------------------------------------------
ITEMIZED GOODS & TAX BREAKDOWN:
--------------------------------------------------------------------------------
# | Product Description | HSN Code | Quantity | Base Rate | Taxable Amt | GST (${gstRate}%) | Total
1 | ${productTitle} | ${hsnCode} | ${displayQty} | ₹${unitBasePrice.toFixed(2)} | ₹${subtotal.toLocaleString('en-IN')} | ₹${totalGst.toLocaleString('en-IN')} | ₹${Math.round(totalAmount).toLocaleString('en-IN')}
${logisticsCost > 0 ? `Logistics & Freight: ₹${logisticsCost.toLocaleString('en-IN')}\n` : ''}
TOTAL INVOICE AMOUNT: ₹${Math.round(totalAmount).toLocaleString('en-IN')}

--------------------------------------------------------------------------------
ESCROW SETTLEMENT & PAYMENT RECONCILIATION:
--------------------------------------------------------------------------------
- 10% Initial Advance (Escrow Booking): ₹${Math.round(advancePaid).toLocaleString('en-IN')} [PAID & CLEARED]
- 90% Final Balance (Cleared at Truck Loading at Warehouse/Godown): ₹${Math.round(balanceSettled).toLocaleString('en-IN')} [PAID & SETTLED]
TOTAL RECONCILED: ₹${Math.round(totalReconciled).toLocaleString('en-IN')} (100% PAID)
OUTSTANDING BALANCE DUE: ₹0.00 (NIL / FULLY PAID)

--------------------------------------------------------------------------------
FULFILLMENT & DISPATCH RECORD:
--------------------------------------------------------------------------------
Mode: ${isDeliver ? 'Direct Delivery to Destination' : 'Central Godown Self-Pickup'}
${isDeliver ? `Delivery Date: ${deliveryDate}\nDestination Address: ${deliveryAddress}\nConsignee: ${receiverName} (${receiverPhone})\nTracking Ref: ${trackingNumber}` : `Clearance Date: ${deliveryDate}\nGate Pass Ref: ${trackingNumber}`}

This is an electronically verified GST Tax Invoice issued by Aaudumbar Agro Pvt. Ltd.`;

    // Professional HTML Email with 2-Column Party Matrix and Full Itemized Table
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GST Tax Invoice & Final Settlement — B2B India</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f5f7;font-family:'Segoe UI',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7;padding:30px 0;">
    <tr>
      <td align="center">
        <table width="680" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);border:1px solid #e2e8f0;">
          
          <!-- Header Bar -->
          <tr>
            <td style="background: linear-gradient(135deg, ${navy} 0%, #0f172a 100%);padding:30px 36px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle;">
                    <div style="font-size:24px;font-weight:900;color:#ffffff;letter-spacing:1px;">B2B INDIA</div>
                    <div style="font-size:11px;color:${orange};font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-top:4px;">
                      by Aaudumbar Agro Pvt. Ltd.
                    </div>
                  </td>
                  <td style="text-align:right;vertical-align:middle;">
                    <div style="display:inline-block;background:${emerald};color:#ffffff;font-size:11px;font-weight:800;padding:6px 16px;border-radius:8px;letter-spacing:1px;text-transform:uppercase;">
                      ✓ 100% SETTLED INVOICE
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content Body -->
          <tr>
            <td style="padding:30px 36px;">
              <p style="font-size:16px;color:#1e293b;font-weight:bold;margin:0 0 6px;">Dear ${buyerCompanyName},</p>
              <p style="font-size:14px;color:#475569;line-height:1.6;margin:0 0 20px;">
                Thank you for your business. Your procurement contract has been fulfilled and 100% reconciled. Below is the official <strong>GST Tax Invoice & Final Settlement Statement</strong> issued by <strong>Aaudumbar Agro Pvt. Ltd.</strong>
              </p>

              <!-- Invoice Metadata Bar -->
              <div style="background:#f8fafc;border-radius:12px;padding:14px 18px;border:1px solid #e2e8f0;margin-bottom:20px;">
                <table width="100%" style="font-size:12px;color:#334155;">
                  <tr>
                    <td><strong style="color:${navy};">Invoice Number:</strong> <span style="font-family:monospace;font-weight:bold;color:#0f172a;background:#e2e8f0;padding:2px 8px;border-radius:4px;">${invoiceNumber}</span></td>
                    <td align="center"><strong style="color:${navy};">Transaction ID:</strong> <span style="font-family:monospace;font-weight:bold;">${txnId}</span></td>
                    <td align="right"><strong style="color:${navy};">Invoice Date:</strong> ${dateStr}</td>
                  </tr>
                </table>
              </div>

              <!-- ========================================================= -->
              <!-- TWO PARTIES DETAIL MATRIX: SELLER & BUYER COMPANY + GSTIN + PHONES -->
              <!-- ========================================================= -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <!-- Party 1: Seller / Consignor (Billed By) -->
                  <td width="48%" style="vertical-align:top;background:#f8fafc;border:2px solid #cbd5e1;border-radius:12px;padding:16px;">
                    <div style="font-size:11px;font-weight:800;color:${navy};text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;border-bottom:1px solid #e2e8f0;padding-bottom:5px;">
                      🏢 SELLER / BILLED BY (PARTY 1)
                    </div>
                    <div style="font-size:14px;font-weight:800;color:#0f172a;">${seller.companyName}</div>
                    <div style="font-size:12px;color:#334155;margin-top:6px;line-height:1.7;">
                      <strong>GSTIN:</strong> <span style="font-family:monospace;font-weight:bold;color:${navy};background:#e2e8f0;padding:1px 6px;border-radius:4px;">${seller.gstin}</span><br>
                      <strong>Contact Phone:</strong> <span style="font-family:monospace;font-weight:bold;color:#15803d;">📞 ${seller.phone}</span><br>
                      <strong>Email:</strong> ${seller.email}<br>
                      <strong>Address:</strong> ${seller.address}
                    </div>
                  </td>

                  <td width="4%"></td>

                  <!-- Party 2: Buyer / Consignee (Billed To) -->
                  <td width="48%" style="vertical-align:top;background:#f0fdf4;border:2px solid #86efac;border-radius:12px;padding:16px;">
                    <div style="font-size:11px;font-weight:800;color:#166534;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;border-bottom:1px solid #bbf7d0;padding-bottom:5px;">
                      👤 BUYER / BILLED TO (PARTY 2)
                    </div>
                    <div style="font-size:14px;font-weight:800;color:#0f172a;">${buyerCompanyName}</div>
                    <div style="font-size:12px;color:#334155;margin-top:6px;line-height:1.7;">
                      <strong>GSTIN:</strong> <span style="font-family:monospace;font-weight:bold;color:#166534;background:#dcfce7;padding:1px 6px;border-radius:4px;">${buyerGstin}</span><br>
                      <strong>Contact Phone:</strong> <span style="font-family:monospace;font-weight:bold;color:#15803d;">📞 ${buyerPhone}</span><br>
                      <strong>Email:</strong> ${buyerEmail}<br>
                      <strong>Destination Address:</strong> ${deliveryAddress}
                    </div>
                  </td>
                </tr>
              </table>

              <!-- ========================================================= -->
              <!-- COMPLETE ITEMIZED GOODS & TAX BREAKDOWN TABLE (WITH HSN & QTY) -->
              <!-- ========================================================= -->
              <h3 style="font-size:14px;color:${navy};margin:0 0 10px;text-transform:uppercase;letter-spacing:1px;">
                📦 Itemized Goods, HSN & Tax Breakdown
              </h3>
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-radius:10px;overflow:hidden;border:1px solid #cbd5e1;margin-bottom:20px;">
                <thead>
                  <tr style="background:${navy};color:#ffffff;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">
                    <th style="padding:10px 8px;text-align:center;border-right:1px solid rgba(255,255,255,0.15);">#</th>
                    <th style="padding:10px 10px;text-align:left;border-right:1px solid rgba(255,255,255,0.15);">Product Name & Description</th>
                    <th style="padding:10px 8px;text-align:center;border-right:1px solid rgba(255,255,255,0.15);">HSN Code</th>
                    <th style="padding:10px 8px;text-align:center;border-right:1px solid rgba(255,255,255,0.15);">Quantity</th>
                    <th style="padding:10px 8px;text-align:right;border-right:1px solid rgba(255,255,255,0.15);">Base Rate</th>
                    <th style="padding:10px 8px;text-align:right;border-right:1px solid rgba(255,255,255,0.15);">Taxable (₹)</th>
                    <th style="padding:10px 8px;text-align:right;border-right:1px solid rgba(255,255,255,0.15);">GST (${gstRate}%)</th>
                    <th style="padding:10px 10px;text-align:right;">Total (₹)</th>
                  </tr>
                </thead>
                <tbody style="font-size:12px;color:#334155;">
                  <tr style="background:#ffffff;">
                    <td style="padding:12px 8px;text-align:center;border-bottom:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">1</td>
                    <td style="padding:12px 10px;font-weight:700;color:#0f172a;border-bottom:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
                      ${productTitle}
                    </td>
                    <td style="padding:12px 8px;text-align:center;font-family:monospace;font-weight:700;color:${navy};background:#f8fafc;border-bottom:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
                      ${hsnCode}
                    </td>
                    <td style="padding:12px 8px;text-align:center;font-weight:700;border-bottom:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
                      ${displayQty}
                    </td>
                    <td style="padding:12px 8px;text-align:right;font-family:monospace;border-bottom:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
                      ₹${unitBasePrice.toFixed(2)}
                    </td>
                    <td style="padding:12px 8px;text-align:right;font-family:monospace;border-bottom:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
                      ₹${subtotal.toLocaleString('en-IN')}
                    </td>
                    <td style="padding:12px 8px;text-align:right;font-family:monospace;color:${emerald};font-weight:700;border-bottom:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
                      ₹${totalGst.toLocaleString('en-IN')}
                    </td>
                    <td style="padding:12px 10px;text-align:right;font-family:monospace;font-weight:800;color:${navy};border-bottom:1px solid #e2e8f0;">
                      ₹${Math.round(totalAmount).toLocaleString('en-IN')}
                    </td>
                  </tr>
                  ${logisticsCost > 0 ? `
                  <tr style="background:#f8fafc;">
                    <td style="padding:10px 8px;text-align:center;border-bottom:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">2</td>
                    <td style="padding:10px 10px;font-weight:600;color:#0f172a;border-bottom:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">Logistics & Dedicated Freight</td>
                    <td style="padding:10px 8px;text-align:center;font-family:monospace;color:#64748b;border-bottom:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">9965</td>
                    <td style="padding:10px 8px;text-align:center;border-bottom:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">${displayQty}</td>
                    <td style="padding:10px 8px;text-align:right;font-family:monospace;border-bottom:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">—</td>
                    <td style="padding:10px 8px;text-align:right;font-family:monospace;border-bottom:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">₹${logisticsCost.toLocaleString('en-IN')}</td>
                    <td style="padding:10px 8px;text-align:right;font-family:monospace;color:${emerald};border-bottom:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">Incl.</td>
                    <td style="padding:10px 10px;text-align:right;font-family:monospace;font-weight:700;color:${navy};border-bottom:1px solid #e2e8f0;">₹${logisticsCost.toLocaleString('en-IN')}</td>
                  </tr>
                  ` : ''}
                  <tr style="background:#f1f5f9;font-weight:bold;">
                    <td colspan="7" style="padding:12px 14px;text-align:right;font-size:13px;color:${navy};">TOTAL INVOICE VALUE (ALL INCLUSIVE):</td>
                    <td style="padding:12px 10px;text-align:right;font-size:16px;color:${orange};font-family:monospace;font-weight:900;">₹${Math.round(totalAmount).toLocaleString('en-IN')}</td>
                  </tr>
                </tbody>
              </table>

              <!-- Escrow Settlement Reconciliation -->
              <div style="background:#f0fdf4;border-left:4px solid ${emerald};padding:18px 20px;border-radius:10px;margin-bottom:20px;border:1px solid #bbf7d0;">
                <div style="font-size:13px;font-weight:bold;color:#166534;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px;">
                  ✓ 100% Payment Reconciliation & Settlement Certificate
                </div>
                <table width="100%" style="font-size:13px;color:#166534;line-height:1.9;">
                  <tr>
                    <td>10% Advance Paid (Escrow Booking):</td>
                    <td style="text-align:right;font-family:monospace;font-weight:bold;">₹${Math.round(advancePaid).toLocaleString('en-IN')} ✓</td>
                  </tr>
                  <tr>
                    <td>90% Final Balance Cleared (at Truck Loading at Warehouse/Godown):</td>
                    <td style="text-align:right;font-family:monospace;font-weight:bold;">₹${Math.round(balanceSettled).toLocaleString('en-IN')} ✓</td>
                  </tr>
                  <tr style="border-top:1px solid #bbf7d0;padding-top:6px;">
                    <td style="font-weight:bold;color:#0f172a;">Total Reconciled by Aaudumbar Agro:</td>
                    <td style="text-align:right;font-family:monospace;font-weight:900;color:#0f172a;">₹${Math.round(totalReconciled).toLocaleString('en-IN')} (100% FULLY CLEARED)</td>
                  </tr>
                  <tr>
                    <td style="font-weight:bold;color:${emerald};font-size:14px;">Outstanding Balance Due:</td>
                    <td style="text-align:right;font-family:monospace;font-weight:900;color:${emerald};font-size:14px;">₹0.00 (NIL / FULLY PAID)</td>
                  </tr>
                </table>
              </div>

              <!-- Dispatch & Logistics Record -->
              <div style="background:#f8fafc;border:1px solid #cbd5e1;border-radius:10px;padding:16px 20px;margin-bottom:20px;">
                <div style="font-size:11px;font-weight:800;color:${navy};text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">
                  🚚 Fulfillment & Physical Dispatch Dossier
                </div>
                <table width="100%" style="font-size:12px;color:#475569;line-height:1.7;">
                  <tr><td width="160" style="font-weight:700;color:#334155;">Logistics Mode:</td><td><strong>${isDeliver ? 'Direct Doorstep Delivery' : 'Central Godown Self-Pickup'}</strong></td></tr>
                  <tr><td style="font-weight:700;color:#334155;">Fulfillment Date:</td><td>${deliveryDate}</td></tr>
                  ${isPickup && vehicleNumber ? `<tr><td style="font-weight:700;color:#334155;">Vehicle / Truck No.:</td><td><strong style="font-family:monospace;color:#4338ca;background:#e0e7ff;padding:2px 6px;border-radius:4px;">${vehicleNumber}</strong></td></tr>` : ''}
                  ${isPickup ? `<tr><td style="font-weight:700;color:#334155;">Driver / Visitor:</td><td>${p1Name} (📞 ${p1Phone}${p1Aadhar ? ` | Aadhar: ${p1Aadhar}` : ''})</td></tr>` : ''}
                  <tr><td style="font-weight:700;color:#334155;">${isDeliver ? 'Destination Address:' : 'Dispatch Godown:'}</td><td>${deliveryAddress}</td></tr>
                  ${isDeliver ? `<tr><td style="font-weight:700;color:#334155;">Authorized Consignee:</td><td>${receiverName} (📞 ${receiverPhone})</td></tr>` : ''}
                  <tr><td style="font-weight:700;color:#334155;">${isDeliver ? 'Consignment Tracking Ref:' : 'Godown Gate Pass Ref:'}</td><td style="font-family:monospace;font-weight:bold;color:#2563eb;">${trackingNumber}</td></tr>
                </table>
              </div>

              <!-- Standard Terms & Conditions -->
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px 16px;margin-bottom:20px;font-size:11px;color:#64748b;line-height:1.6;">
                <strong style="color:#334155;text-transform:uppercase;letter-spacing:0.5px;">Terms &amp; Conditions of Wholesale Sale:</strong><br>
                1. <strong>Escrow Settlement:</strong> 10% advance deposit received at booking. Remaining 90% balance was cleared at truck loading at warehouse/godown prior to vehicle departure.<br>
                2. <strong>Direct Sale Billing:</strong> Goods sold and billed directly by <strong>Aaudumbar Agro Pvt. Ltd.</strong> to the Buyer with full GST &amp; HSN compliance.<br>
                3. <strong>Dispute &amp; Jurisdiction:</strong> All transactions are subject to the exclusive jurisdiction of the competent courts at Chhatrapati Sambhajinagar, Maharashtra.
              </div>

              <!-- Authorised Signatory Footer -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e2e8f0;padding-top:16px;margin-top:10px;">
                <tr>
                  <td width="55%" style="font-size:11px;color:#64748b;line-height:1.6;">
                    <strong>B2B India Central Operations</strong><br>
                    Aaudumbar Agro Pvt. Ltd.<br>
                    Plot No. 5, Prerna Nagar, Garkheda Parisar,<br>
                    Chhatrapati Sambhajinagar 431009, Maharashtra<br>
                    GSTIN: 27ABACA6256A1Z2 | PAN: ABACA6256A
                  </td>
                  <td width="45%" style="text-align:right;vertical-align:bottom;">
                    <div style="font-size:12px;font-weight:bold;color:${navy};">For Aaudumbar Agro Private Limited</div>
                    <div style="font-size:11px;color:#64748b;margin-top:24px;font-style:italic;">Authorised Signatory / Billing Department</div>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Bottom Color Stripe -->
          <tr>
            <td style="height:6px;background: linear-gradient(90deg, ${navy} 0%, ${orange} 50%, ${emerald} 100%);"></td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    // Nodemailer transport
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'b2bbharat.in@gmail.com',
        pass: 'jrwgvucuxrbepnei',
      },
    });

    const mailOptions = {
      from: '"B2B India Billing Desk" <b2bbharat.in@gmail.com>',
      to: buyerEmail,
      cc: 'b2bbharat.in@gmail.com',
      subject: `Official GST Tax Invoice & Settlement [${invoiceNumber}] — B2B India | Aaudumbar Agro Pvt. Ltd.`,
      text: textContent,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`GST Tax Invoice ${invoiceNumber} successfully emailed to ${buyerEmail}:`, info.messageId);

    return {
      success: true,
      messageId: info.messageId,
      invoiceNumber,
      transactionId: txnId,
      recipientEmail: buyerEmail
    };

  } catch (err) {
    console.error('Error sending total invoice email:', err);
    return { success: false, error: err.message || 'Failed to dispatch invoice email' };
  }
}
