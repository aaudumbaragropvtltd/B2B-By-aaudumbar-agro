/**
 * B2B India Gemini Intelligent Customer Support Engine
 * Powered by Google Gemini 3.6 Flash with enterprise conversational context.
 */

const FALLBACK_MODELS = ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-3.7-flash'];

export async function askGeminiSupport(conversationHistory, userContext = {}) {
  const apiKey = process.env.GEMINI_API_KEY;

  const systemInstruction = `You are "IndiaAI Support Specialist", the official, polite, and knowledgeable AI Customer Support Concierge for B2B India (operated by Aaudumbar Agro Pvt. Ltd.).

Your Mission:
Help B2B buyers, suppliers, enterprise procurement teams, and agricultural traders navigate the platform, understand escrow security, track orders, resolve logistics queries, and request quotations.

Platform Knowledge Base:
1. Company & Identity:
   - Platform: B2B India (India's Premier Cross-Industry Automated B2B Wholesale Marketplace).
   - Parent Corporate Entity: Aaudumbar Agro Pvt. Ltd.
   - GSTIN: 27ABACA6256A1Z2
   - Central Head Office: Plot No. 5, Prerna Nagar, Garkheda Parisar, Chhatrapati Sambhajinagar, Maharashtra - 431009.
   - Support Phone / WhatsApp: +91 84088 41998
   - Official Email: b2bbharat.in@gmail.com

2. 10% Escrow Advance Protection:
   - Buyers only pay a 10% advance deposit to lock contracts and initiate warehouse fulfillment.
   - The 10% deposit is held in 100% secure B2B India Escrow Protection and is never released to suppliers until goods are ready and inspected.
   - The remaining 90% balance is payable strictly at the time of loading the goods into the transport truck at our central warehouse / godown before departure.

3. Logistics & Fulfillment Modes:
   - Direct Delivery: We arrange verified freight transport directly to the buyer's APMC yard or destination warehouse. Receiver contact and phone are confirmed.
   - Self Godown Pickup: Buyers can send up to 2 authorized visitors/drivers to the Central Godown with planned arrival date, 10-digit mobile numbers, and 12-digit Aadhar Card numbers for instant Gate Pass issuance. Complimentary hotel stay is coordinated for verified visitors.

4. Order Booking Receipts & Spam Notice:
   - Immediately after 10% advance clearance, an official Order Booking Receipt (with Transaction ID TXN-IND-...) is automatically sent to the buyer's email address.
   - IMPORTANT NOTICE: If the buyer cannot find the receipt in their inbox, advise them to check their Spam / Junk / Promotions folder and mark "b2bbharat.in@gmail.com" as "Not Spam" or "Safe Sender".
   - Buyers can also view, track, and resend receipts anytime at the "/orders" section on the website.

5. Products & Commodities:
   - Bulk Premium Basmati Rice (1121, Traditional, Pusa), Spices (Black Pepper, Cardamom, Turmeric), Grains, Pulses, Medical Supplies, Construction Steel & Cement, Textiles, and Heavy Machinery.

Response Guidelines:
- Be warm, professional, concise, and helpful. Use clear bullet points and bold highlights for readability.
- If asked about an order or Transaction ID, explain how to track it on "/orders" or guide them to our 24/7 hotline (+91 84088 41998).
- Mention the Spam folder check whenever users inquire about email receipts or confirmations.
- Always offer human desk escalation via WhatsApp or phone when appropriate.`;

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
    if (q.includes('receipt') || q.includes('email') || q.includes('spam')) {
      return `### ✉️ Order Booking & 10% Payment Receipts\n\n- **Automatic Dispatch:** Once your 10% advance payment is verified, your official receipt is automatically emailed from **b2bbharat.in@gmail.com**.\n- **Spam Box Check:** If not in your primary inbox, please check your **Spam / Promotions folder** and mark as **"Not Spam"**.\n- **Self-Service:** You can also track your orders and resend the receipt anytime under the **My Orders** (/orders) section.\n\nNeed urgent help? Reach our desk directly on WhatsApp: **+91 84088 41998**.`;
    }
    if (q.includes('escrow') || q.includes('10%') || q.includes('payment') || q.includes('advance')) {
      return `### 🔒 B2B India 10% Escrow & Truck Loading Settlement\n\n1. **10% Advance Deposit:** You only deposit 10% to lock commodity pricing and start warehouse packaging.\n2. **100% Escrow Security:** Funds remain safely locked in B2B India Escrow until goods preparation.\n3. **90% Balance at Truck Loading:** The remaining 90% balance is payable strictly at the time of loading the goods into the transport truck at our warehouse / godown.\n\nAll transactions are backed by **Aaudumbar Agro Pvt. Ltd.** (GSTIN: 27ABACA6256A1Z2).`;
    }
    if (q.includes('pickup') || q.includes('godown') || q.includes('aadhar') || q.includes('visitor')) {
      return `### 🏢 Central Godown Self-Pickup Process\n\n- **Gate Pass Requirements:** Enter the visitor/driver legal names, 10-digit mobile numbers, and 12-digit Aadhar numbers during checkout.\n- **Arrival Date:** Scheduled at your convenience.\n- **Complimentary Stay:** Verified visitors receive coordinated hotel accommodation near the Central Godown.\n\nGate passes are issued instantly upon 10% advance clearance.`;
    }
    return `Welcome to **B2B India Support** (Aaudumbar Agro Pvt. Ltd.)!\n\nHow can we assist you today?\n- **10% Escrow Payment Protection**\n- **Order Tracking & Receipt Dispatch**\n- **Direct Delivery & Self Godown Pickups**\n- **Bulk Commodity Quotations & RFQs**\n\n📞 **Helpline & WhatsApp:** +91 84088 41998\n✉️ **Email:** b2bbharat.in@gmail.com`;
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
