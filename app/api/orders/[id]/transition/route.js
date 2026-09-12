// ============================================================================
// ORDER STATE TRANSITION API
// ============================================================================
// Handles order state transitions (confirm_loading, cancel, reroute).
// Validates transitions using the state machine and records audit trails.
// ============================================================================

import { NextResponse } from 'next/server';
import { createClient } from '@/services/supabaseServer';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { canTransition, STATE_LABELS } from '@/utils/orderStateMachine';
import { recordTimelineEvent } from '@/services/settlementService';
import { notifyOrderUpdate } from '@/services/notificationService';

export async function POST(request, { params }) {
  try {
    const { id: orderId } = await params;
    const supabase = await createClient();

    // 1. Authenticate
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('firebase_uid', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // 2. Parse action
    const body = await request.json();
    const { action, notes, reroute_supplier_id, reroute_reason } = body;

    if (!action) {
      return NextResponse.json({ error: 'Missing action' }, { status: 400 });
    }

    // Map actions to target states
    const ACTION_STATE_MAP = {
      confirm_loading: 'warehouse_loading',
      cancel: 'cancelled',
      reroute: 'rerouted',
      reissue_quotation: 'quotation_issued',
    };

    const targetState = ACTION_STATE_MAP[action];
    if (!targetState) {
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    // 3. Fetch order
    const { data: order, error: orderError } = await supabaseAdmin
      .from('trade_orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // 4. Verify user is a party to this order (or admin)
    if (profile.role !== 'admin' && order.buyer_id !== profile.id && order.supplier_id !== profile.id) {
      return NextResponse.json({ error: 'Not authorized for this order' }, { status: 403 });
    }

    // 5. Validate state transition
    const transition = canTransition(order.current_state, targetState, profile.role);
    if (!transition.valid) {
      return NextResponse.json({ error: transition.reason }, { status: 400 });
    }

    // 6. Execute the transition
    const updateData = { current_state: targetState };

    // Handle reroute-specific fields
    if (action === 'reroute') {
      updateData.rerouted_from_supplier_id = order.supplier_id;
      updateData.reroute_reason = reroute_reason || notes || 'Supplier failed to deliver';
      if (reroute_supplier_id) {
        updateData.supplier_id = reroute_supplier_id;
      }
    }

    // Handle loading confirmation
    if (action === 'confirm_loading') {
      updateData.actual_loading_date = new Date().toISOString().split('T')[0];
    }

    const { error: updateError } = await supabaseAdmin
      .from('trade_orders')
      .update(updateData)
      .eq('id', orderId);

    if (updateError) throw updateError;

    // 7. Record timeline
    await recordTimelineEvent(supabaseAdmin, {
      orderId,
      fromState: order.current_state,
      toState: targetState,
      action,
      performedBy: profile.id,
      performedByRole: profile.role,
      notes: notes || `Order transitioned from ${STATE_LABELS[order.current_state]} to ${STATE_LABELS[targetState]}`,
      metadata: { reroute_supplier_id, reroute_reason },
    });

    // 8. Send notifications
    await notifyOrderUpdate(supabaseAdmin, order, targetState, action);

    // 9. Handle cancellation refund logic
    if (action === 'cancel' && order.current_state === 'price_locked_10') {
      // Record refund in ledger (actual refund to be processed manually or via Razorpay)
      await supabaseAdmin.from('platform_ledger').insert({
        order_id: orderId,
        entry_type: 'refund_buyer',
        amount: order.advance_paid_10 || order.total_contract_value * 0.10,
        from_entity_id: null,
        to_entity_id: order.buyer_id,
        description: `Refund of 10% advance due to order cancellation by ${profile.role}`,
      });
    }

    // 10. Activity log
    await supabaseAdmin.from('activity_logs').insert({
      user_id: profile.id,
      action: `order_${action}`,
      details: {
        order_id: orderId,
        from_state: order.current_state,
        to_state: targetState,
        notes,
      },
    });

    return NextResponse.json({
      success: true,
      orderId,
      previousState: order.current_state,
      newState: targetState,
      message: `Order updated to ${STATE_LABELS[targetState]}`,
    });

  } catch (error) {
    console.error('Order transition error:', error);
    return NextResponse.json(
      { error: error.message || 'State transition failed' },
      { status: 500 }
    );
  }
}

// GET: Fetch order timeline
export async function GET(request, { params }) {
  try {
    const { id: orderId } = await params;
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Fetch timeline entries
    const { data: timeline, error } = await supabaseAdmin
      .from('order_timeline')
      .select('*, performed_by_user:users!order_timeline_performed_by_fkey(company_name)')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Fetch ledger entries
    const { data: ledger } = await supabaseAdmin
      .from('platform_ledger')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true });

    return NextResponse.json({ timeline: timeline || [], ledger: ledger || [] });

  } catch (error) {
    console.error('Order timeline fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch timeline' },
      { status: 500 }
    );
  }
}
