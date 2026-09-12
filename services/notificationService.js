// ============================================================================
// NOTIFICATION SERVICE
// ============================================================================
// Creates in-app notifications and dispatches WhatsApp messages.
// All notifications are stored in the `notifications` table and
// high-priority ones are also sent via WhatsApp.
// ============================================================================

import { sendWhatsAppMessage } from '@/services/whatsapp';

/**
 * Create an in-app notification for a user.
 *
 * @param {Object} supabaseAdmin - Supabase admin client (bypasses RLS)
 * @param {Object} params
 * @param {string} params.userId - Target user UUID
 * @param {string} params.type - Notification type (order_update, rfq_response, etc.)
 * @param {string} params.title - Notification title
 * @param {string} params.body - Notification body text
 * @param {Object} [params.data] - Additional JSONB data
 * @param {string} [params.link] - Deep link URL (e.g., /dashboard/orders)
 * @returns {Promise<{ success: boolean, id?: string, error?: string }>}
 */
export async function createNotification(supabaseAdmin, { userId, type, title, body, data = {}, link = null }) {
  try {
    const { data: notification, error } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        body,
        data,
        link,
        is_read: false,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to create notification:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: notification.id };
  } catch (err) {
    console.error('Notification creation error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Notify both buyer and supplier about an order state change.
 *
 * @param {Object} supabaseAdmin - Supabase admin client
 * @param {Object} order - The trade_order record
 * @param {string} newState - The new state label
 * @param {string} action - What triggered the change
 */
export async function notifyOrderUpdate(supabaseAdmin, order, newState, action) {
  const stateLabels = {
    quotation_issued: 'Quotation Issued',
    price_locked_10: 'Price Locked (10% Paid)',
    warehouse_loading: 'Goods Loading at Warehouse',
    settled: 'Order Settled ✅',
    cancelled: 'Order Cancelled ❌',
    rerouted: 'Order Rerouted 🔄',
  };

  const stateLabel = stateLabels[newState] || newState;

  // Notify buyer
  await createNotification(supabaseAdmin, {
    userId: order.buyer_id,
    type: 'order_update',
    title: `Order ${stateLabel}`,
    body: `Your order #${order.id.slice(0, 8)} has been updated to "${stateLabel}".`,
    data: { orderId: order.id, state: newState, action },
    link: '/orders',
  });

  // Notify supplier
  await createNotification(supabaseAdmin, {
    userId: order.supplier_id,
    type: 'order_update',
    title: `Order ${stateLabel}`,
    body: `Order #${order.id.slice(0, 8)} has been updated to "${stateLabel}".`,
    data: { orderId: order.id, state: newState, action },
    link: '/orders',
  });

  // Send WhatsApp for high-priority events
  if (['settled', 'cancelled', 'rerouted'].includes(newState)) {
    try {
      const { data: buyer } = await supabaseAdmin
        .from('users')
        .select('whatsapp_number, company_name')
        .eq('id', order.buyer_id)
        .single();

      const { data: supplier } = await supabaseAdmin
        .from('users')
        .select('whatsapp_number, company_name')
        .eq('id', order.supplier_id)
        .single();

      if (buyer?.whatsapp_number) {
        await sendWhatsAppMessage(
          buyer.whatsapp_number,
          `Hello ${buyer.company_name},\n\nYour order #${order.id.slice(0, 8)} has been updated:\n📋 Status: *${stateLabel}*\n\nLog in to B2B India for details.`
        );
      }

      if (supplier?.whatsapp_number) {
        await sendWhatsAppMessage(
          supplier.whatsapp_number,
          `Hello ${supplier.company_name},\n\nOrder #${order.id.slice(0, 8)} status update:\n📋 Status: *${stateLabel}*\n\nLog in to B2B India for details.`
        );
      }
    } catch (err) {
      console.error('WhatsApp notification failed (non-critical):', err);
    }
  }
}

/**
 * Notify the RFQ buyer when a supplier submits a quote.
 */
export async function notifyRFQQuote(supabaseAdmin, { rfqId, buyerId, supplierName, quotedPrice }) {
  await createNotification(supabaseAdmin, {
    userId: buyerId,
    type: 'rfq_response',
    title: 'New Quote Received',
    body: `${supplierName} quoted ₹${quotedPrice} on your requirement.`,
    data: { rfqId },
    link: '/dashboard/rfqs',
  });
}

/**
 * Notify the recipient when a new message is received.
 */
export async function notifyNewMessage(supabaseAdmin, { recipientId, senderName, conversationId, preview }) {
  await createNotification(supabaseAdmin, {
    userId: recipientId,
    type: 'message_received',
    title: `Message from ${senderName}`,
    body: preview.length > 100 ? preview.slice(0, 100) + '...' : preview,
    data: { conversationId },
    link: '/dashboard/messages',
  });
}

/**
 * Notify a user about payment events.
 */
export async function notifyPayment(supabaseAdmin, { userId, type, orderId, amount, success }) {
  const notifType = success ? 'payment_received' : 'payment_failed';
  const title = success ? 'Payment Successful ✅' : 'Payment Failed ❌';
  const body = success
    ? `₹${amount.toLocaleString()} payment for order #${orderId.slice(0, 8)} was successful.`
    : `Payment of ₹${amount.toLocaleString()} for order #${orderId.slice(0, 8)} failed. Please try again.`;

  await createNotification(supabaseAdmin, {
    userId,
    type: notifType,
    title,
    body,
    data: { orderId, amount, paymentType: type },
    link: '/orders',
  });
}
