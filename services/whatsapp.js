// ============================================================================
// WHATSAPP BUSINESS API SERVICE
// ============================================================================
// Sends automated WhatsApp messages for price alerts, order updates,
// and admin interventions.
//
// When TWILIO_SID is configured: Uses Twilio WhatsApp Business API
// When not configured: Falls back to console.log mock
//
// Required env vars (optional — falls back to mock):
//   TWILIO_SID            — Your Twilio Account SID
//   TWILIO_AUTH_TOKEN      — Your Twilio Auth Token
//   TWILIO_WHATSAPP_FROM   — Your Twilio WhatsApp sender (e.g., whatsapp:+14155238886)
// ============================================================================

const TWILIO_SID = process.env.TWILIO_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';

// Simple rate limiter: max 100 messages per hour
const messageLog = [];
const MAX_MESSAGES_PER_HOUR = 100;

function isRateLimited() {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  // Remove old entries
  while (messageLog.length > 0 && messageLog[0] < oneHourAgo) {
    messageLog.shift();
  }
  return messageLog.length >= MAX_MESSAGES_PER_HOUR;
}

/**
 * Check if Twilio is configured for real WhatsApp delivery.
 */
export function isTwilioConfigured() {
  return !!(TWILIO_SID && TWILIO_AUTH_TOKEN);
}

/**
 * Send a WhatsApp message via Twilio (or mock if not configured).
 *
 * @param {string} toPhoneNumber - Recipient phone number (e.g., +919876543210)
 * @param {string} messageBody - Message text
 * @param {string} [templateId] - Optional template ID (for approved templates)
 * @returns {Promise<{ success: boolean, messageId?: string, error?: string, mock?: boolean }>}
 */
export async function sendWhatsAppMessage(toPhoneNumber, messageBody, templateId = null) {
  if (!toPhoneNumber) {
    console.error('WhatsApp Error: No recipient phone number provided.');
    return { success: false, error: 'No recipient provided' };
  }

  // Rate limiting check
  if (isRateLimited()) {
    console.warn('WhatsApp rate limit reached (100/hour). Message queued.');
    return { success: false, error: 'Rate limit exceeded' };
  }

  messageLog.push(Date.now());

  // ── Real Twilio delivery ──
  if (isTwilioConfigured()) {
    try {
      const toNumber = toPhoneNumber.startsWith('whatsapp:')
        ? toPhoneNumber
        : `whatsapp:${toPhoneNumber}`;

      const params = new URLSearchParams();
      params.append('To', toNumber);
      params.append('From', TWILIO_WHATSAPP_FROM);
      params.append('Body', messageBody);

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + Buffer.from(`${TWILIO_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64'),
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        console.error('Twilio WhatsApp Error:', result);
        return { success: false, error: result.message || 'Twilio API error' };
      }

      return { success: true, messageId: result.sid };
    } catch (error) {
      console.error('Twilio WhatsApp Error:', error);
      return { success: false, error: error.message };
    }
  }

  // ── Mock delivery (development) ──
  try {
    console.log('\n======================================================');
    console.log('📲 MOCK WHATSAPP MESSAGE SENT');
    console.log(`To: ${toPhoneNumber}`);
    if (templateId) {
      console.log(`Template: ${templateId}`);
    }
    console.log(`Message: \n${messageBody}`);
    console.log('======================================================\n');

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));

    return {
      success: true,
      messageId: `mock-wa-${Date.now()}`,
      mock: true,
    };
  } catch (error) {
    console.error('WhatsApp Service Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Standardized Templates
 */
export const WhatsAppTemplates = {
  SUPPLIER_PRICE_ALERT: (supplierName, productName, detectedPrice, externalPrice) =>
    `Hello ${supplierName},\n\nOur system detected a significant price divergence for your product *${productName}*.\nYour Listed Price: ₹${detectedPrice}\nMarket Average: ₹${externalPrice}\n\nPlease update your pricing to remain competitive in the Resiliency Network.`,

  FALLBACK_SUPPLIER_ALERT: (supplierName, productName, quantity, price) =>
    `Hello ${supplierName},\n\nYou have been selected as a fallback supplier for *${quantity} units* of *${productName}* at your listed price of *₹${price}*.\n\nPlease log in to the B2B India dashboard to confirm availability within the next 4 hours.`,

  ADMIN_MANUAL_INTERVENTION: (orderId, reason) =>
    `🚨 ADMIN ALERT\nOrder ID: ${orderId}\nReason: ${reason}\n\nManual intervention required. Please check the Admin Dashboard immediately.`,

  ORDER_ADVANCE_PAID: (companyName, orderId, amount) =>
    `Hello ${companyName},\n\n✅ 10% advance payment of *₹${amount}* received for order *#${orderId}*.\n\nThe price is now locked. Supplier will begin loading.`,

  ORDER_SETTLED: (companyName, orderId, totalValue) =>
    `Hello ${companyName},\n\n✅ Order *#${orderId}* has been fully settled!\n\nTotal Value: *₹${totalValue}*\n\nThank you for trading on B2B India.`,

  ORDER_CANCELLED: (companyName, orderId, reason) =>
    `Hello ${companyName},\n\n❌ Order *#${orderId}* has been cancelled.\nReason: ${reason}\n\nAny advance payments will be refunded within 5-7 business days.`,
};

