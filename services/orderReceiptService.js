import nodemailer from 'nodemailer';

/**
 * Dispatches an official 10% Order Booking & Advance Escrow Receipt
 * with full Two-Party Credentials Matrix (Aaudumbar Agro Pvt. Ltd. and Buyer),
 * including both Company Names, GSTIN numbers, contact phone numbers, and addresses,
 * along with complete HSN code, product description, quantity, unit rates, tax breakdown, and escrow balance status.
 *
 * @param {Object} orderData - The order details
 * @param {Object} options - Sending options (customEmail, hsnCode, etc.)
 */
export async function sendOrderReceiptEmail(orderData, options = {}) {
  try {
    const buyerEmail = (options.buyerEmail || options.customEmail || orderData.buyer_email || orderData.buyerEmail || '').trim();
    if (!buyerEmail || !buyerEmail.includes('@')) {
      console.warn('Cannot send order receipt email: No valid buyer email provided');
      return { success: false, error: 'Invalid buyer email' };
    }

    const today = new Date();
    const dateStr = today.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = today.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    const txnId = orderData.transaction_id || orderData.transactionId || orderData.payment_reference || orderData.razorpay_payment_id || `TXN-IND-${Date.now().toString().slice(-6)}`;
    const orderId = orderData.order_id || orderData.orderId || orderData.id || `ORD-IND-${Date.now().toString().slice(-6)}`;
    const receiptRef = `AAPL/REC/2026/${(txnId.replace(/[^0-9a-zA-Z]/g, '')).slice(-6).toUpperCase() || Math.floor(100000 + Math.random() * 900000)}`;

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
    let buyerCompanyName = (
      options.buyerCompanyName || 
      orderData.buyer_company_name || 
      orderData.company_name || 
      orderData.buyer?.company_name || 
      ''
    ).trim();

    // Prevent visitor/driver names from polluting company name
    const visitorNames = [
      orderData.p1_name, orderData.p1Name,
      orderData.p2_name, orderData.p2Name,
      orderData.receiver_name, orderData.receiverName
    ].filter(Boolean).map(n => n.trim().toLowerCase());

    if (buyerCompanyName && visitorNames.includes(buyerCompanyName.toLowerCase())) {
      buyerCompanyName = '';
    }

    // Lookup company name from Supabase users if not already resolved
    if (!buyerCompanyName || buyerCompanyName === 'Enterprise Buyer' || buyerCompanyName === 'Verified Buyer') {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ihsgymlxdgmdrtwlnetr.supabase.co';
        const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imloc2d5bWx4ZGdtZHJ0d2xuZXRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzQ5NDY3OCwiZXhwIjoyMDk5MDcwNjc4fQ.kog1SWIohMiQ76VIOtL5Paa5MSZlV96_nOFjUW0UPII';
        if (sbUrl && sbKey) {
          const supabaseAdmin = createClient(sbUrl, sbKey);
          const buyerId = orderData.buyer_id || orderData.buyerId;
          if (buyerId) {
            const { data: uData } = await supabaseAdmin.from('users').select('company_name, full_name').eq('id', buyerId).maybeSingle();
            if (uData?.company_name) buyerCompanyName = uData.company_name;
          }
          if (!buyerCompanyName && buyerEmail) {
            const { data: uData } = await supabaseAdmin.from('users').select('company_name, full_name').eq('registered_email', buyerEmail).maybeSingle();
            if (uData?.company_name) buyerCompanyName = uData.company_name;
          }
        }
      } catch (lookupErr) {
        // Non-fatal lookup
      }
    }

    if (!buyerCompanyName) {
      const candidate = (orderData.buyer_name || orderData.buyerName || '').trim();
      if (candidate && !visitorNames.includes(candidate.toLowerCase())) {
        buyerCompanyName = candidate.toLowerCase().includes('enterprise') || candidate.toLowerCase().includes('expo') || candidate.toLowerCase().includes('agro') || candidate.toLowerCase().includes('ltd') || candidate.toLowerCase().includes('co')
          ? candidate
          : `${candidate} Enterprises`;
      } else {
        buyerCompanyName = 'Enterprise Commercial Buyer';
      }
    }

    let buyerContactPerson = (
      orderData.buyer_contact_person || 
      options.buyerContactPerson || 
      orderData.buyer_name || 
      orderData.buyerName || 
      buyerCompanyName
    ).trim();

    if (visitorNames.includes(buyerContactPerson.toLowerCase()) && buyerContactPerson !== buyerCompanyName) {
      buyerContactPerson = buyerCompanyName;
    }

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

    const gstRate = Number(orderData.gst_rate) || 5;
    const unitBasePrice = unitAllInclusive / (1 + gstRate / 100);
    const unitGst = unitAllInclusive - unitBasePrice;

    const subtotal = Math.round(unitBasePrice * quantity);
    const totalGst = Math.round(unitGst * quantity);
    const logisticsCost = Number(orderData.logistics_cost || orderData.logisticsCost) || 0;

    // Escrow Advance breakdown
    const advancePaid = Number(orderData.advance_amount || orderData.advance_paid_10 || (isHighVal ? 100000 : Math.round(totalAmount * 0.1)));
    const balanceRemaining = totalAmount - advancePaid;

    // Logistics details
    const deliveryOption = orderData.delivery_option || orderData.deliveryOption || 'deliver';
    const isDeliver = deliveryOption === 'deliver';
    const isPickup = deliveryOption === 'pickup';
    const deliveryDate = orderData.delivery_date || orderData.deliveryDate || null;
    const receiverName = orderData.receiver_name || orderData.receiverName || buyerContactPerson;
    const receiverPhone = orderData.receiver_phone || orderData.receiverPhone || buyerPhone;

    const arrivalDate = orderData.arrival_date || orderData.arrivalDate || null;
    const visitorCount = orderData.visitor_count || orderData.visitorCount || 1;
    const vehicleNumber = orderData.vehicle_number || orderData.vehicleNumber || null;
    const transporterName = orderData.transporter_name || orderData.transporterName || 'B2B Dedicated Fleet';
    const p1Name = orderData.p1_name || orderData.p1Name || 'Authorized Driver / Visitor';
    const p1Phone = orderData.p1_phone || orderData.p1Phone || 'N/A';
    const p1Aadhar = orderData.p1_aadhar || orderData.p1Aadhar || 'N/A';
    const p2Name = orderData.p2_name || orderData.p2Name || null;
    const p2Phone = orderData.p2_phone || orderData.p2Phone || null;
    const p2Aadhar = orderData.p2_aadhar || orderData.p2Aadhar || null;
    const trackingNumber = orderData.tracking_number || (isPickup ? `GATE-PASS-${txnId.slice(-6).toUpperCase()}` : `AWB-IND-${txnId.slice(-6).toUpperCase()}`);

    // Brand Colors
    const navy = '#1B3A5C';
    const orange = '#E8792B';
    const green = '#2E7D32';

    // Plain text version - structured with Terms & Conditions FIRST, and visitor details STRICTLY BELOW
    const textContent = `================================================================================
B2B INDIA — ORDER BOOKING & 10% ESCROW ADVANCE RECEIPT
================================================================================
Receipt No: ${receiptRef}
Order ID: ${orderId}
Transaction ID: ${txnId}
Date: ${dateStr} ${timeStr}

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
Authorized Contact: ${buyerContactPerson}
GSTIN Number: ${buyerGstin}
Contact Phone: ${buyerPhone}
Email Address: ${buyerEmail}
Billing/Premises Address: ${deliveryAddress}

--------------------------------------------------------------------------------
ITEMIZED GOODS & TAX BREAKDOWN:
--------------------------------------------------------------------------------
# | Product Description | HSN Code | Quantity | Base Rate | Taxable Amt | GST (${gstRate}%) | Total
1 | ${productTitle} | ${hsnCode} | ${displayQty} | ₹${unitBasePrice.toFixed(2)} | ₹${subtotal.toLocaleString('en-IN')} | ₹${totalGst.toLocaleString('en-IN')} | ₹${Math.round(totalAmount).toLocaleString('en-IN')}
${logisticsCost > 0 ? `Logistics & Freight: ₹${logisticsCost.toLocaleString('en-IN')}\n` : ''}
TOTAL CONTRACT VALUE: ₹${Math.round(totalAmount).toLocaleString('en-IN')}

--------------------------------------------------------------------------------
ESCROW ADVANCE CLEARANCE & PAYMENT STATUS:
--------------------------------------------------------------------------------
>>> 10% ADVANCE PAID (ESCROW CLEARED): ₹${Math.round(advancePaid).toLocaleString('en-IN')} <<<
REMAINING BALANCE (90%): ₹${Math.round(balanceRemaining).toLocaleString('en-IN')} (Payable strictly at the time of loading goods into the truck at warehouse/godown)
Escrow Status: 10% Advance Cleared into B2B India Escrow Protection.

--------------------------------------------------------------------------------
TERMS & CONDITIONS OF WHOLESALE SALE & ESCROW GUARANTEE:
--------------------------------------------------------------------------------
1. Escrow Settlement: 10% advance deposit held securely in B2B India Escrow to lock commodity rate & initiate packaging.
2. 90% Balance at Truck Loading: Remaining 90% balance is payable strictly at the time of loading the goods into the truck at warehouse/godown.
3. Direct Sale Billing: Direct commercial wholesale purchase billed directly by Aaudumbar Agro Pvt. Ltd. to ${buyerCompanyName} with complete GST & HSN compliance.
4. Dispute & Jurisdiction: Exclusive jurisdiction of competent courts at Chhatrapati Sambhajinagar, Maharashtra.

--------------------------------------------------------------------------------
${isPickup ? 'VISITOR & VEHICLE GATE PASS CLEARANCE (DETAILS BELOW TERMS & CONDITIONS):' : 'DIRECT DELIVERY FULFILLMENT DOSSIER (DETAILS BELOW TERMS & CONDITIONS):'}
--------------------------------------------------------------------------------
Mode: ${isPickup ? 'Central Godown Self-Pickup' : 'Direct Doorstep Delivery'}
${isPickup ? `Scheduled Arrival Date: ${arrivalDate || 'Scheduled'}
Vehicle / Truck Number: ${vehicleNumber || 'Reported at gate'}
Visitor Count: ${visitorCount} Person(s)
Visitor 1 (Primary / Driver): ${p1Name} (Phone: ${p1Phone} | Aadhar: ${p1Aadhar})
${p2Name ? `Visitor 2 (Secondary): ${p2Name} (Phone: ${p2Phone} | Aadhar: ${p2Aadhar})\n` : ''}Gate Pass Reference: ${trackingNumber}
Pickup Godown: Central Godown, Plot 14, MIDC Shendra, Chhatrapati Sambhajinagar 431154, Maharashtra
Accommodation: Complimentary hotel stay near godown arranged for verified buyer visitors.` : `Fulfillment Date: ${deliveryDate || 'Scheduled'}
Destination Address: ${deliveryAddress}
Authorized Consignee: ${receiverName} (${receiverPhone})
Tracking Ref: ${trackingNumber}
Transporter Fleet: ${transporterName}`}

Contact Desk: +91 84088 41998 | b2bbharat.in@gmail.com`;

    // Professional HTML Email Matching Quotation & Two-Party Matrix with Visitors BELOW Terms
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Booking & 10% Advance Receipt — B2B India</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f5f7;font-family:'Segoe UI',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7;padding:30px 0;">
    <tr>
      <td align="center">
        <table width="680" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);border:1px solid #e2e8f0;">

          <!-- Header Bar -->
          <tr>
            <td style="background: linear-gradient(135deg, ${navy} 0%, #234b73 100%);padding:30px 36px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle;">
                    <div style="font-size:24px;font-weight:900;color:#ffffff;letter-spacing:1px;">B2B INDIA</div>
                    <div style="font-size:11px;color:${orange};font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-top:4px;">
                      by Aaudumbar Agro Pvt. Ltd.
                    </div>
                  </td>
                  <td style="text-align:right;vertical-align:middle;">
                    <div style="display:inline-block;background:${green};color:#ffffff;font-size:11px;font-weight:800;padding:6px 16px;border-radius:8px;letter-spacing:1px;text-transform:uppercase;">
                      ✓ 10% BOOKING RECEIPT
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
                Thank you for ordering with B2B India. Below is your official <strong>10% Advance Payment Receipt &amp; Order Booking Certificate</strong> issued to <strong>${buyerCompanyName}</strong> by <strong>Aaudumbar Agro Pvt. Ltd.</strong>
              </p>

              <!-- Receipt Metadata Bar with Connected Order ID & Transaction ID -->
              <div style="background:#f8fafc;border-radius:12px;padding:14px 18px;border:1px solid #e2e8f0;margin-bottom:20px;">
                <table width="100%" style="font-size:12px;color:#334155;border-collapse:collapse;">
                  <tr>
                    <td style="padding-bottom:6px;"><strong style="color:${navy};">Receipt No:</strong> <span style="font-family:monospace;font-weight:bold;color:#0f172a;background:#e2e8f0;padding:2px 8px;border-radius:4px;">${receiptRef}</span></td>
                    <td align="right" style="padding-bottom:6px;"><strong style="color:${navy};">Receipt Date:</strong> ${dateStr}</td>
                  </tr>
                  <tr>
                    <td style="padding-top:4px;"><strong style="color:${navy};">Order ID:</strong> <span style="font-family:monospace;font-weight:bold;color:#0f172a;background:#e0f2fe;padding:2px 8px;border-radius:4px;border:1px solid #bae6fd;">${orderId}</span></td>
                    <td align="right" style="padding-top:4px;"><strong style="color:${navy};">Transaction ID:</strong> <span style="font-family:monospace;font-weight:bold;color:#166534;background:#dcfce7;padding:2px 8px;border-radius:4px;border:1px solid #bbf7d0;">${txnId}</span></td>
                  </tr>
                </table>
              </div>

              <!-- ========================================================= -->
              <!-- TWO PARTIES DETAIL MATRIX: SELLER & BUYER COMPANY -->
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

                  <!-- Party 2: Buyer / Consignee (Billed To) — ALWAYS BUYER COMPANY NAME -->
                  <td width="48%" style="vertical-align:top;background:#f0fdf4;border:2px solid #86efac;border-radius:12px;padding:16px;">
                    <div style="font-size:11px;font-weight:800;color:#166534;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;border-bottom:1px solid #bbf7d0;padding-bottom:5px;">
                      👤 BUYER / BILLED TO (PARTY 2)
                    </div>
                    <div style="font-size:14px;font-weight:800;color:#0f172a;">${buyerCompanyName}</div>
                    <div style="font-size:12px;color:#334155;margin-top:6px;line-height:1.7;">
                      ${buyerContactPerson && buyerContactPerson !== buyerCompanyName ? `<strong>Authorized Contact:</strong> ${buyerContactPerson}<br>` : ''}
                      <strong>GSTIN:</strong> <span style="font-family:monospace;font-weight:bold;color:#166534;background:#dcfce7;padding:1px 6px;border-radius:4px;">${buyerGstin}</span><br>
                      <strong>Contact Phone:</strong> <span style="font-family:monospace;font-weight:bold;color:#15803d;">📞 ${buyerPhone}</span><br>
                      <strong>Email:</strong> ${buyerEmail}<br>
                      <strong>Registered Address:</strong> ${deliveryAddress}
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Advance Payment Clearance Banner -->
              <div style="background:#e8f5e9;border:1px solid #c8e6c9;border-left:4px solid ${green};border-radius:10px;padding:16px 20px;margin-bottom:20px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="vertical-align:middle;">
                      <div style="font-size:14px;font-weight:800;color:${green};">
                        ✓ 10% ADVANCE PAYMENT CLEARED (ESCROW PROTECTED)
                      </div>
                      <div style="font-size:12px;color:#2e7d32;margin-top:4px;">
                        Advance Amount of <strong>₹${Math.round(advancePaid).toLocaleString('en-IN')}</strong> has been locked into B2B India Protected Escrow. Goods preparation and fulfillment initiated for <strong>${buyerCompanyName}</strong>.
                      </div>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- ========================================================= -->
              <!-- COMPLETE ITEMIZED GOODS & TAX BREAKDOWN TABLE (WITH HSN & QTY) -->
              <!-- ========================================================= -->
              <h3 style="font-size:14px;color:${navy};margin:0 0 10px;text-transform:uppercase;letter-spacing:1px;">
                📦 Itemized Goods, HSN &amp; Tax Breakdown
              </h3>
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-radius:10px;overflow:hidden;border:1px solid #cbd5e1;margin-bottom:20px;">
                <thead>
                  <tr style="background:${navy};color:#ffffff;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">
                    <th style="padding:10px 8px;text-align:center;border-right:1px solid rgba(255,255,255,0.15);">#</th>
                    <th style="padding:10px 10px;text-align:left;border-right:1px solid rgba(255,255,255,0.15);">Product Name &amp; Description</th>
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
                    <td style="padding:12px 8px;text-align:right;font-family:monospace;color:${green};font-weight:700;border-bottom:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
                      ₹${totalGst.toLocaleString('en-IN')}
                    </td>
                    <td style="padding:12px 10px;text-align:right;font-family:monospace;font-weight:800;color:${navy};border-bottom:1px solid #e2e8f0;">
                      ₹${Math.round(totalAmount).toLocaleString('en-IN')}
                    </td>
                  </tr>
                  ${logisticsCost > 0 ? `
                  <tr style="background:#f8fafc;">
                    <td style="padding:10px 8px;text-align:center;border-bottom:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">2</td>
                    <td style="padding:10px 10px;font-weight:600;color:#0f172a;border-bottom:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">Logistics &amp; Dedicated Freight</td>
                    <td style="padding:10px 8px;text-align:center;font-family:monospace;color:#64748b;border-bottom:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">9965</td>
                    <td style="padding:10px 8px;text-align:center;border-bottom:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">${displayQty}</td>
                    <td style="padding:10px 8px;text-align:right;font-family:monospace;border-bottom:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">—</td>
                    <td style="padding:10px 8px;text-align:right;font-family:monospace;border-bottom:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">₹${logisticsCost.toLocaleString('en-IN')}</td>
                    <td style="padding:10px 8px;text-align:right;font-family:monospace;color:${green};border-bottom:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">Incl.</td>
                    <td style="padding:10px 10px;text-align:right;font-family:monospace;font-weight:700;color:${navy};border-bottom:1px solid #e2e8f0;">₹${logisticsCost.toLocaleString('en-IN')}</td>
                  </tr>
                  ` : ''}
                  <tr style="background:#f1f5f9;font-weight:bold;">
                    <td colspan="7" style="padding:12px 14px;text-align:right;font-size:13px;color:${navy};">TOTAL CONTRACT VALUE:</td>
                    <td style="padding:12px 10px;text-align:right;font-size:16px;color:${navy};font-family:monospace;font-weight:900;">₹${Math.round(totalAmount).toLocaleString('en-IN')}</td>
                  </tr>
                </tbody>
              </table>

              <!-- Escrow Financial Summary Table -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;border-collapse:collapse;border-radius:10px;overflow:hidden;border:1px solid #cbd5e1;">
                <tr style="background:#e8f5e9;">
                  <td style="padding:12px 16px;font-size:14px;font-weight:800;color:${green};">
                    ✓ 10% ADVANCE PAID (ESCROW CLEARED)
                  </td>
                  <td style="padding:12px 16px;font-size:18px;font-weight:900;color:${green};text-align:right;font-family:monospace;">
                    ₹${Math.round(advancePaid).toLocaleString('en-IN')}
                  </td>
                </tr>
                <tr style="background:#fff7ed;border-top:1px solid #fed7aa;">
                  <td style="padding:12px 16px;font-size:13px;font-weight:700;color:${orange};">
                    Remaining Balance Due at Truck Loading at Warehouse/Godown (90%)
                  </td>
                  <td style="padding:12px 16px;font-size:15px;font-weight:800;color:${orange};text-align:right;font-family:monospace;">
                    ₹${Math.round(balanceRemaining).toLocaleString('en-IN')}
                  </td>
                </tr>
              </table>

              <!-- ========================================================= -->
              <!-- TERMS & CONDITIONS AND ESCROW PROTECTION GUARANTEE -->
              <!-- ========================================================= -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8faf9;border:1px solid ${green}40;border-left:4px solid ${green};border-radius:10px;margin-bottom:20px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <div style="font-size:12px;font-weight:800;color:${green};text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">
                      🛡️ B2B India Escrow Protection Guarantee &amp; Terms
                    </div>
                    <table cellpadding="0" cellspacing="0" style="font-size:12px;color:#555;line-height:1.8;">
                      <tr><td style="padding-right:8px;color:${green};font-weight:700;">•</td><td><strong>10% Advance Protection:</strong> Held securely in B2B India Escrow to lock commodity rate &amp; initiate packaging.</td></tr>
                      <tr><td style="padding-right:8px;color:${green};font-weight:700;">•</td><td><strong>90% Balance at Truck Loading:</strong> Remaining 90% balance is payable strictly at the time of loading goods into the truck at warehouse/godown.</td></tr>
                      <tr><td style="padding-right:8px;color:${green};font-weight:700;">•</td><td><strong>100% Tax Billing to Company:</strong> Direct wholesale sale on the official bill of Aaudumbar Agro Pvt. Ltd. to <strong>${buyerCompanyName}</strong> with GSTIN &amp; HSN codes.</td></tr>
                      <tr><td style="padding-right:8px;color:${green};font-weight:700;">•</td><td><strong>Dispute &amp; Legal Jurisdiction:</strong> Subject to the exclusive jurisdiction of the competent courts at Chhatrapati Sambhajinagar, Maharashtra.</td></tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- ========================================================= -->
              <!-- DETAILS BELOW TERMS & CONDITIONS (VISITORS / DELIVERY) -->
              <!-- ========================================================= -->
              ${isPickup ? `
              <!-- Central Godown Self-Pickup Visitor Clearance & Gate Pass Dossier (BELOW TERMS) -->
              <div style="background:#f8fafc;border:2px solid #cbd5e1;border-radius:12px;padding:18px 20px;margin-bottom:20px;">
                <div style="font-size:12px;font-weight:800;color:${navy};text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;border-bottom:1px solid #e2e8f0;padding-bottom:6px;">
                  🏢 Central Godown Self-Pickup — Authorized Visitor(s) &amp; Vehicle Gate Pass
                </div>
                <table width="100%" cellpadding="0" cellspacing="0" style="font-size:12px;color:#475569;line-height:1.8;">
                  <tr><td width="180" style="font-weight:700;color:#334155;">Scheduled Arrival Date:</td><td style="font-weight:700;color:${navy};">${arrivalDate || 'Pending Schedule'}</td></tr>
                  ${vehicleNumber ? `<tr><td style="font-weight:700;color:#334155;">Vehicle / Truck Number:</td><td><strong style="font-family:monospace;color:#4338ca;background:#e0e7ff;padding:2px 6px;border-radius:4px;">${vehicleNumber}</strong></td></tr>` : ''}
                  <tr><td style="font-weight:700;color:#334155;">Authorized Visitor Count:</td><td>${visitorCount} Person(s)</td></tr>
                  <tr><td style="font-weight:700;color:#334155;">Visitor 1 (Primary / Driver):</td><td><strong style="color:#0f172a;">${p1Name}</strong> (📞 <span style="font-family:monospace;">${p1Phone}</span> | Aadhar: <span style="font-family:monospace;font-weight:700;">${p1Aadhar}</span>)</td></tr>
                  ${p2Name ? `<tr><td style="font-weight:700;color:#334155;">Visitor 2 (Secondary):</td><td><strong style="color:#0f172a;">${p2Name}</strong> (📞 <span style="font-family:monospace;">${p2Phone}</span> | Aadhar: <span style="font-family:monospace;font-weight:700;">${p2Aadhar}</span>)</td></tr>` : ''}
                  <tr><td style="font-weight:700;color:#334155;">Godown Gate Pass Ref:</td><td style="font-family:monospace;font-weight:700;color:${green};">${trackingNumber}</td></tr>
                  <tr><td style="font-weight:700;color:#334155;">Pickup Warehouse / Godown:</td><td>Central Godown, Plot 14, MIDC Shendra, Chhatrapati Sambhajinagar 431154, Maharashtra</td></tr>
                  <tr><td style="font-weight:700;color:#334155;">Complimentary Stay:</td><td>Complimentary hotel stay near central godown arranged for verified buyer visitors.</td></tr>
                </table>
              </div>
              ` : `
              <!-- Direct Delivery Fulfillment & Destination Record (BELOW TERMS) -->
              <div style="background:#f8fafc;border:2px solid #cbd5e1;border-radius:12px;padding:18px 20px;margin-bottom:20px;">
                <div style="font-size:12px;font-weight:800;color:${navy};text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;border-bottom:1px solid #e2e8f0;padding-bottom:6px;">
                  🚚 Direct Delivery Fulfillment &amp; Destination Record
                </div>
                <table width="100%" cellpadding="0" cellspacing="0" style="font-size:12px;color:#475569;line-height:1.8;">
                  <tr><td width="180" style="font-weight:700;color:#334155;">Scheduled Fulfillment:</td><td>${deliveryDate || 'To be confirmed by operations'}</td></tr>
                  <tr><td style="font-weight:700;color:#334155;">Destination Address:</td><td>${deliveryAddress || 'On file'}</td></tr>
                  <tr><td style="font-weight:700;color:#334155;">Authorized Consignee:</td><td><strong>${receiverName}</strong> (📞 <span style="font-family:monospace;">${receiverPhone}</span>)</td></tr>
                  <tr><td style="font-weight:700;color:#334155;">Consignment Tracking Ref:</td><td style="font-family:monospace;font-weight:700;color:#2563eb;">${trackingNumber}</td></tr>
                  <tr><td style="font-weight:700;color:#334155;">Dedicated Transporter:</td><td>${transporterName}</td></tr>
                </table>
              </div>
              `}

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
            <td style="height:6px;background: linear-gradient(90deg, ${navy} 0%, ${orange} 50%, ${green} 100%);"></td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
    // Nodemailer configuration
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'b2bbharat.in@gmail.com',
        pass: 'jrwgvucuxrbepnei',
      },
    });

    const mailOptions = {
      from: '"B2B India Booking Desk" <b2bbharat.in@gmail.com>',
      to: buyerEmail,
      cc: 'b2bbharat.in@gmail.com',
      subject: `Order Booking & 10% Advance Receipt [${txnId}] — B2B India | Aaudumbar Agro Pvt. Ltd.`,
      text: textContent,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Order 10% receipt email successfully dispatched to ${buyerEmail}:`, info.messageId);

    return {
      success: true,
      messageId: info.messageId,
      receiptRef,
      transactionId: txnId,
      recipientEmail: buyerEmail
    };

  } catch (err) {
    console.error('Error sending order receipt email:', err);
    return { success: false, error: err.message || 'Failed to send receipt email' };
  }
}
