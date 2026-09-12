import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function cleanOrders() {
  console.log('=== Starting Database & Orders Store Cleanup ===\n');

  // 1. Load direct_orders.json
  const dataFilePath = path.join(process.cwd(), 'data', 'direct_orders.json');
  let directOrders = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));

  // Remove test orders created during tests
  const initialCount = directOrders.length;
  directOrders = directOrders.filter(o => {
    const isTestOrder = (o.transaction_id || '').includes('TXN-LOCK-TEST-') || 
                        (o.transaction_id || '').includes('TXN-LOCK-DELIVER-');
    return !isTestOrder;
  });
  fs.writeFileSync(dataFilePath, JSON.stringify(directOrders, null, 2), 'utf8');
  console.log(`1. Cleaned direct_orders.json: removed ${initialCount - directOrders.length} test order(s). Remaining: ${directOrders.length}`);

  // Build map of paid order IDs in direct_orders
  const paidDirectMap = new Map();
  directOrders.forEach(o => {
    if (['paid_to_escrow', 'released_to_supplier', 'paid', 'completed', 'settled'].includes(o.payment_status)) {
      paidDirectMap.set(o.id, o);
    }
  });

  // 2. Query all trade_orders from Supabase
  const { data: dbOrders, error: fetchErr } = await supabase
    .from('trade_orders')
    .select('id, current_state, qr_payment_reference, buyer_notes, created_at');

  if (fetchErr) {
    console.error('Error fetching trade_orders:', fetchErr);
    process.exit(1);
  }

  console.log(`2. Total trade_orders in Supabase: ${dbOrders.length}`);

  const toUpdatePaid = [];
  const toDeleteUnpaid = [];

  dbOrders.forEach(o => {
    if (o.current_state === 'quotation_issued' || o.current_state === 'draft' || o.current_state === 'payment_failed' || o.current_state === 'cancelled') {
      if (paidDirectMap.has(o.id)) {
        toUpdatePaid.push(o.id);
      } else {
        toDeleteUnpaid.push(o.id);
      }
    }
  });

  console.log(`- Legitimate paid orders to update to price_locked_10: ${toUpdatePaid.length}`);
  console.log(`- Unpaid / abandoned / failed orders to delete from database: ${toDeleteUnpaid.length}`);

  // 3. Update legitimate paid orders
  for (const id of toUpdatePaid) {
    const directInfo = paidDirectMap.get(id);
    const { error: updErr } = await supabase
      .from('trade_orders')
      .update({
        current_state: 'price_locked_10',
        qr_payment_reference: directInfo?.transaction_id || undefined,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updErr) {
      console.warn(`Failed to update order ${id}:`, updErr.message);
    } else {
      console.log(`  ✓ Updated order ${id} to price_locked_10`);
    }
  }

  // 4. Delete unpaid / failed orders
  for (const id of toDeleteUnpaid) {
    // Clean child records if any
    try {
      await supabase.from('order_timeline').delete().eq('order_id', id);
    } catch (e) {}
    try {
      await supabase.from('platform_ledger').delete().eq('order_id', id);
    } catch (e) {}
    try {
      await supabase.from('logistics_arrangements').delete().eq('order_id', id);
    } catch (e) {}

    const { error: delErr } = await supabase
      .from('trade_orders')
      .delete()
      .eq('id', id);

    if (delErr) {
      console.warn(`Failed to delete order ${id}:`, delErr.message);
    } else {
      console.log(`  ✕ Deleted unpaid quotation/failed order ${id}`);
    }
  }

  // 5. Verify final counts
  const { data: remainingOrders } = await supabase
    .from('trade_orders')
    .select('id, current_state');

  console.log(`\n=== Cleanup Complete ===`);
  console.log(`Remaining trade_orders in Supabase: ${remainingOrders?.length}`);
  const finalStateCounts = {};
  remainingOrders?.forEach(o => {
    finalStateCounts[o.current_state] = (finalStateCounts[o.current_state] || 0) + 1;
  });
  console.log('Final state counts in Supabase:', finalStateCounts);
}

cleanOrders().catch(err => {
  console.error('Script error:', err);
  process.exit(1);
});
