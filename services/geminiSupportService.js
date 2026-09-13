/**
 * B2B India Gemini Intelligent Customer Support Engine
 * Powered by Google Gemini with enterprise user context & live order tracking.
 */

const FALLBACK_MODELS = ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-3.7-flash', 'gemini-3.5-flash-lite'];

function formatStatusDescription(status) {
  const s = (status || '').toLowerCase();
  if (s.includes('transit') || s.includes('dispatched')) return 'Goods are dispatched and currently in transit to destination';
  if (s.includes('pickup') || s.includes('collected') || s.includes('ready_for_pickup')) return 'Ready for collection at Central Godown with Gate Pass';
  if (s.includes('loading') || s.includes('warehouse')) return 'Goods are being prepared and loaded at warehouse';
  if (s.includes('confirmed') || s.includes('locked') || s.includes('price_locked_10')) return '10% Escrow secured, contract locked with supplier';
  if (s.includes('delivered') || s.includes('settled')) return 'Order completed, goods delivered and escrow settled';
  if (s.includes('cancel')) return 'Order cancelled';
  return 'Order active in fulfillment pipeline';
}

export async function askGeminiSupport(conversationHistory, userContext = {}) {
  const apiKey = process.env.GEMINI_API_KEY;

  const currentUser = userContext.user || null;
  const userOrders = Array.isArray(userContext.orders) ? userContext.orders : [];

  const userProfileSection = currentUser ? `
CURRENT AUTHENTICATED USER PROFILE:
- Full Name: ${currentUser.name || 'Registered Partner'}
- Company Name: ${currentUser.company || 'Enterprise Account'}
- Registered Email: ${currentUser.email || 'N/A'}
- Contact Phone: ${currentUser.phone || 'On file'}
- Location: ${currentUser.location || 'India'}
- Account Role: ${currentUser.role || 'Trader'}
` : `
CURRENT AUTHENTICATED USER PROFILE:
- Guest / Unauthenticated Visitor
(Note: If this user asks "What did I order?", "My orders", or for status without providing an Order ID, warmly invite them to log in or share their 10% receipt Transaction ID e.g. TXN-IND-xxxxxx).
`;

  const userOrdersSection = userOrders.length > 0 ? `
USER'S LIVE ORDER HISTORY (${userOrders.length} active/recent order(s) on file):
${userOrders.map((o, idx) => `
[ORDER #${idx + 1}]
  - Transaction ID / Booking Ref: ${o.transaction_id || o.id}
  - Internal Order ID: ${o.id}
  - Product / Commodity: ${o.product_name}
  - Quantity Booked: ${o.quantity} ${o.unit || 'units'}
  - Booking Date: ${o.created_at ? new Date(o.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent'}
  - Current Status: ${o.order_status?.toUpperCase() || 'CONFIRMED'} (${formatStatusDescription(o.order_status)})
  - Total Contract Value: ₹${Number(o.total_amount || 0).toLocaleString('en-IN')}
  - 10% Advance Deposit Paid: ₹${Number(o.advance_amount || (Number(o.total_amount || 0) * 0.10)).toLocaleString('en-IN')} (Status: ${o.payment_status === 'paid_to_escrow' || o.payment_status === 'settled' ? 'PAID & SECURED IN ESCROW' : o.payment_status || 'Paid'})
  - Remaining 90% Balance Due: ₹${Number(o.balance_amount || (Number(o.total_amount || 0) * 0.90)).toLocaleString('en-IN')}
  - Balance Payment Terms: Payable strictly at the time of loading the goods into the transport truck at the central warehouse / godown before vehicle departure.
  - Delivery Method: ${o.delivery_option === 'pickup' ? `Self Godown Pickup (Gate Pass visitor: ${o.p1_name || o.receiver_name || 'Driver on file'})` : `Direct Hauling Delivery (To: ${o.delivery_address || 'Customer APMC / Warehouse'})`}
  - Tracking / Waybill Number: ${o.tracking_number || o.transaction_id || 'Generating with transporter'}
  ${o.arrival_date ? `- Scheduled Godown Arrival: ${o.arrival_date}` : ''}
  ${o.notes ? `- Operational Notes: ${o.notes}` : ''}
`).join('\n')}
` : `
USER'S LIVE ORDER HISTORY:
No orders currently placed under this account.
`;

  const systemInstruction = `You are "IndiaAI Support Specialist", the official, polite, highly competent, and knowledgeable AI Customer Support Concierge for B2B India (operated by Aaudumbar Agro Pvt. Ltd.).

Your Mission:
Provide direct, personalized, real-time customer care to B2B buyers, suppliers, enterprise procurement teams, and commodity traders. You have complete visibility into the user's profile and orders.

${userProfileSection}

${userOrdersSection}

Platform & Business Rules:
1. Company & Identity:
   - Platform: B2B India (India's Premier Cross-Industry Automated B2B Wholesale Marketplace).
   - Parent Corporate Entity: Aaudumbar Agro Pvt. Ltd.
   - GSTIN: 27ABACA6256A1Z2
   - Central Head Office: Plot No. 5, Prerna Nagar, Garkheda Parisar, Chhatrapati Sambhajinagar 431009, Maharashtra.
   - Support Phone / WhatsApp: +91 84088 41998
   - Official Email: support@b2bindia.site (Receipts auto-sent from b2bbharat.in@gmail.com)

2. 10% Escrow Advance Protection:
   - Buyers only pay a 10% advance deposit to lock wholesale commodity prices and trigger warehouse packing.
   - The 10% deposit is held in 100% secure B2B India Escrow Protection and is NEVER released to suppliers until goods are inspected and ready.
   - The remaining 90% balance is payable strictly at the time of loading the goods into the transport truck at our central warehouse / godown before vehicle departure.
   - Balance payment can be cleared via RTGS, NEFT, IMPS, or official company bank transfer.

3. Logistics & Fulfillment Modes:
   - Direct Delivery: Transport arranged directly to the buyer's destination yard/warehouse with live tracking.
   - Self Godown Pickup: Buyers can send up to 2 authorized drivers/representatives to the Central Godown with planned arrival date, 10-digit mobile numbers, and 12-digit Aadhar Card numbers for immediate Gate Pass clearance. Verified visitors receive coordinated hotel stay.

4. Order Booking Receipts & Spam Notice:
   - After 10% payment, an official Order Booking Receipt (with Transaction ID TXN-IND-...) is automatically sent to the buyer's email.
   - IMPORTANT SPAM NOTICE: If the buyer asks where their email receipt is, advise them to check their Spam / Junk / Promotions folder and mark "b2bbharat.in@gmail.com" as "Not Spam".
   - Buyers can also view, track, and resend receipts anytime at the "/orders" section.

5. How to Answer User Order Inquiries:
   - When the user asks "What did I order?", "My orders", "Where is my shipment?", "What is the status of my order?", or "How much do I have to pay?":
     * IMMEDIATELY answer using their actual orders listed above!
     * State their Product Name, Quantity, Transaction ID, Current Status (e.g. In Transit, Confirmed, Ready for Pickup), and Delivery method.
     * When asked about the 90% payment or remaining balance: quote their exact remaining balance amount (e.g. ₹X) and explain that it is paid at truck loading before warehouse departure.
     * Be proactive, professional, concise, and courteous. Address the user by their company/name when available.
   - If the user is a guest (not logged in) and asks about an order: politely ask for their Transaction ID (TXN-IND-...) or invite them to log in to access full account tracking.

Response Guidelines:
- Keep answers structured with clean bullet points and bold highlights.
- Keep language professional, polite, and warm (incorporate "Namaste" or "Welcome").
- Always offer human desk escalation via WhatsApp or phone (+91 84088 41998) for urgent freight matters.`;

  // Build the messages payload for Gemini API
  const contents = [];
  
  // Format past conversation turns
  if (Array.isArray(conversationHistory) && conversationHistory.length > 0) {
    for (const msg of conversationHistory) {
      contents.push({
        role: msg.role === 'model' || msg.role === 'assistant' || msg.sender === 'system' ? 'model' : 'user',
        parts: [{ text: msg.text || msg.content || '' }]
      });
    }
  }

  // Fallback response if API key is invalid or offline
  const fallbackReply = (query) => {
    const q = (query || '').toLowerCase();

    // If user asks about their order or status and we have orders
    if ((q.includes('order') || q.includes('status') || q.includes('what did i') || q.includes('track') || q.includes('item')) && userOrders.length > 0) {
      let orderListText = userOrders.map((o, idx) => `
### 📦 Order #${idx + 1}: ${o.product_name}
- **Transaction ID:** \`${o.transaction_id || o.id}\`
- **Quantity:** **${o.quantity} ${o.unit || 'units'}**
- **Current Status:** **${o.order_status?.toUpperCase() || 'CONFIRMED'}** (${formatStatusDescription(o.order_status)})
- **Total Contract:** ₹${Number(o.total_amount || 0).toLocaleString('en-IN')}
- **10% Advance Paid:** ₹${Number(o.advance_amount || (Number(o.total_amount || 0) * 0.10)).toLocaleString('en-IN')} (Escrow Secured)
- **90% Remaining Balance:** **₹${Number(o.balance_amount || (Number(o.total_amount || 0) * 0.90)).toLocaleString('en-IN')}** *(Payable at truck loading)*
- **Fulfillment:** ${o.delivery_option === 'pickup' ? '🏢 Self Godown Pickup' : `🚚 Direct Delivery to ${o.delivery_address || 'Destination'}`}
`).join('\n');

      return `${currentUser?.name ? `Hello **${currentUser.name}** (${currentUser.company || 'Valued Buyer'})!` : 'Hello!'} Here is your live order summary:\n\n${orderListText}\n\nYou can also view invoices, gate passes, or resend receipts anytime on **[My Orders](/orders)**.\n\nNeed urgent transport assistance? Reach our hotline: **+91 84088 41998**.`;
    }

    if (q.includes('balance') || q.includes('90%') || q.includes('pay')) {
      if (userOrders.length > 0) {
        const o = userOrders[0];
        const bal = Number(o.balance_amount || (Number(o.total_amount || 0) * 0.90)).toLocaleString('en-IN');
        return `### 💰 90% Balance Payment Details\n\nFor your order **${o.product_name}** (\`${o.transaction_id || o.id}\`):\n- **Total Contract:** ₹${Number(o.total_amount || 0).toLocaleString('en-IN')}\n- **10% Advance Paid:** ₹${Number(o.advance_amount || (Number(o.total_amount || 0) * 0.10)).toLocaleString('en-IN')}\n- **90% Balance Due:** **₹${bal}**\n\n**When is it paid?**\nThe remaining 90% balance is payable strictly at the time of loading the goods into the transport truck at our central warehouse / godown before vehicle departure.\n\nPayment can be made via RTGS, NEFT, or official bank transfer. Contact our accounts desk at **+91 84088 41998** for settlement assistance.`;
      }
      return `### 🔒 B2B India 10% Escrow & 90% Settlement Terms\n\n1. **10% Advance Deposit:** You only deposit 10% to lock commodity pricing and initiate fulfillment.\n2. **100% Escrow Security:** Funds remain safely locked in B2B India Escrow until goods preparation.\n3. **90% Balance at Truck Loading:** The remaining 90% balance is payable strictly at the time of loading the goods into the transport truck at our warehouse / godown.\n\nAll transactions are backed by **Aaudumbar Agro Pvt. Ltd.** (GSTIN: 27ABACA6256A1Z2).`;
    }

    if (q.includes('receipt') || q.includes('email') || q.includes('spam')) {
      return `### ✉️ Order Booking & 10% Payment Receipts\n\n- **Automatic Dispatch:** Once your 10% advance payment is verified, your official receipt is automatically emailed from **b2bbharat.in@gmail.com**.\n- **Spam Box Check:** If not in your primary inbox, please check your **Spam / Promotions folder** and mark as **"Not Spam"**.\n- **Self-Service:** You can also track your orders and resend the receipt anytime under the **[My Orders](/orders)** section.\n\nNeed urgent help? Reach our desk directly on WhatsApp: **+91 84088 41998**.`;
    }

    if (q.includes('pickup') || q.includes('godown') || q.includes('aadhar') || q.includes('visitor')) {
      return `### 🏢 Central Godown Self-Pickup Process\n\n- **Gate Pass Requirements:** Enter the visitor/driver legal names, 10-digit mobile numbers, and 12-digit Aadhar numbers during checkout.\n- **Arrival Date:** Scheduled at your convenience.\n- **Complimentary Stay:** Verified visitors receive coordinated hotel accommodation near the Central Godown.\n\nGate passes are issued instantly upon 10% advance clearance.`;
    }

    return `Welcome to **B2B India Enterprise Support** (Aaudumbar Agro Pvt. Ltd.)!\n\n${currentUser ? `Logged in as **${currentUser.name || currentUser.email}**.` : ''}\n\nHow can we assist you today?\n- **Check My Orders & Delivery Status**\n- **10% Escrow & 90% Balance Payment Details**\n- **Order Receipts & Gate Pass Verification**\n- **Commodity Quotations & Logistics**\n\n📞 **Helpline & WhatsApp:** +91 84088 41998\n✉️ **Email:** b2bbharat.in@gmail.com`;
  };

  if (!apiKey || apiKey === 'AIzaSyYourGeminiApiKeyString') {
    const lastUserMsg = conversationHistory[conversationHistory.length - 1]?.text || '';
    return {
      success: true,
      reply: fallbackReply(lastUserMsg),
      model: 'fallback-rules-engine'
    };
  }

  // Attempt calling Gemini models with automatic fallbacks
  for (const model of FALLBACK_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const payload = {
        contents: contents,
        systemInstruction: {
          parts: [{ text: systemInstruction }]
        },
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1000,
        }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        console.warn(`Gemini model ${model} returned status ${response.status}:`, errJson?.error?.message);
        continue; // try next model
      }

      const data = await response.json();
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

      if (reply) {
        return {
          success: true,
          reply,
          model
        };
      }
    } catch (err) {
      console.warn(`Gemini call error on ${model}:`, err.message);
    }
  }

  // If all Gemini calls failed, use the intelligent localized fallback
  const lastUserMsg = conversationHistory[conversationHistory.length - 1]?.text || '';
  return {
    success: true,
    reply: fallbackReply(lastUserMsg),
    model: 'localized-safety-agent'
  };
}
