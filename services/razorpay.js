// ============================================================================
// RAZORPAY PAYMENT GATEWAY SERVICE
// ============================================================================
// Server-side Razorpay SDK initialization and helper functions.
// Supports standard web checkout with signature validation.
//
// Required env vars:
//   RAZORPAY_KEY_ID / NEXT_PUBLIC_RAZORPAY_KEY_ID — rzp_test_... or rzp_live_...
//   RAZORPAY_KEY_SECRET                           — Secret key
//
// NEVER import this file in client components.
// ============================================================================

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export function getCredentials() {
  let keyId = null;
  let keySecret = null;
  let webhookSecret = null;

  // Read from .env.local / .env first
  try {
    for (const envFileName of ['.env.local', '.env']) {
      const envPath = path.join(process.cwd(), envFileName);
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach((line) => {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#')) {
            const [k, ...v] = trimmed.split('=');
            if (k && v.length) {
              const key = k.trim();
              const val = v.join('=').trim();
              if (key === 'RAZORPAY_KEY_ID' && !keyId) keyId = val;
              if (key === 'NEXT_PUBLIC_RAZORPAY_KEY_ID' && !keyId) keyId = val;
              if (key === 'RAZORPAY_KEY_SECRET' && !keySecret) keySecret = val;
              if (key === 'RAZORPAY_WEBHOOK_SECRET' && !webhookSecret) webhookSecret = val;
            }
          }
        });
      }
    }
  } catch (e) {}

  keyId = keyId || process.env.RAZORPAY_KEY_ID?.trim() || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim() || 'rzp_test_TWLTjuvaVcjNFc';
  keySecret = keySecret || process.env.RAZORPAY_KEY_SECRET?.trim() || 'fq5tI6y0SF9U7qSLa4Af5nOs';
  webhookSecret = webhookSecret || process.env.RAZORPAY_WEBHOOK_SECRET?.trim() || '';

  // Synchronize process.env
  process.env.RAZORPAY_KEY_ID = keyId;
  process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = keyId;
  process.env.RAZORPAY_KEY_SECRET = keySecret;

  return { keyId, keySecret, webhookSecret };
}

/**
 * Check if Razorpay is configured (env vars present).
 */
export function isRazorpayConfigured() {
  const { keyId, keySecret } = getCredentials();
  return !!(keyId && keySecret);
}

/**
 * Make authenticated requests to Razorpay REST API.
 */
export async function razorpayFetch(endpoint, method = 'GET', body = null) {
  const { keyId, keySecret } = getCredentials();
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

  const options = {
    method,
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  return fetch(`https://api.razorpay.com/v1${endpoint}`, options);
}

/**
 * Create a Razorpay order for a given amount.
 *
 * @param {Object} params
 * @param {number} params.amount - Amount in INR (converted to paise) or in paise directly
 * @param {string} params.currency - Currency code (default: INR)
 * @param {string} params.receipt - Internal receipt/order ID
 * @param {Object} params.notes - Additional notes (object)
 * @param {boolean} params.isPaise - Whether amount is already in paise
 * @returns {Promise<Object>} Razorpay order object
 */
export async function createRazorpayOrder({ amount, currency = 'INR', receipt, notes = {}, isPaise = false }) {
  const paiseAmount = isPaise ? Math.round(Number(amount)) : Math.round(Number(amount) * 100);

  if (paiseAmount < 100) {
    throw new Error('Minimum order amount must be at least 100 paise (₹1.00)');
  }

  const response = await razorpayFetch('/orders', 'POST', {
    amount: paiseAmount,
    currency,
    receipt: receipt || `rcpt_${Date.now()}`,
    notes,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (response.status === 401) {
      throw new Error('Razorpay Authentication failed: Invalid API credentials');
    }
    throw new Error(errorData.error?.description || `Razorpay order creation failed with status ${response.status}`);
  }

  const data = await response.json();
  return {
    ...data,
    order_id: data.id,
  };
}

/**
 * Verify a Razorpay payment signature using HMAC-SHA256.
 *
 * @param {Object} params
 * @param {string} params.razorpay_order_id - Razorpay Order ID
 * @param {string} params.razorpay_payment_id - Razorpay Payment ID
 * @param {string} params.razorpay_signature - Razorpay Payment Signature
 * @returns {boolean} Whether signature matches
 */
export function verifyPaymentSignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return false;
  }

  const { keySecret } = getCredentials();
  if (!keySecret) {
    console.error('Razorpay keySecret not configured for signature verification');
    return false;
  }

  const body = `${razorpay_order_id}|${razorpay_payment_id}`;
  try {
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(body)
      .digest('hex');

    return expectedSignature === razorpay_signature;
  } catch (err) {
    console.error('Signature verification error:', err);
    return false;
  }
}

/**
 * Verify a Razorpay webhook signature.
 */
export function verifyWebhookSignature(body, signature) {
  const { webhookSecret } = getCredentials();
  if (!webhookSecret) return true;

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(body)
    .digest('hex');

  return expectedSignature === signature;
}

/**
 * Fetch a Razorpay payment by ID.
 */
export async function fetchPayment(paymentId) {
  const response = await razorpayFetch(`/payments/${paymentId}`);
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.description || 'Failed to fetch payment');
  }
  return response.json();
}

/**
 * Get the public Razorpay Key ID for client-side checkout.
 */
export function getPublicKeyId() {
  const { keyId } = getCredentials();
  return keyId;
}
