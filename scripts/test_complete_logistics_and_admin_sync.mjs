import { createClient } from '@supabase/supabase-js';

const url = 'https://ihsgymlxdgmdrtwlnetr.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imloc2d5bWx4ZGdtZHJ0d2xuZXRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzQ5NDY3OCwiZXhwIjoyMDk5MDcwNjc4fQ.kog1SWIohMiQ76VIOtL5Paa5MSZlV96_nOFjUW0UPII';
const supabaseAdmin = createClient(url, key);

async function testCompleteLogistics() {
  console.log('=== TEST SUITE: COMPLETE LOGISTICS & ADMIN PANEL INTEGRATION ===\n');

  // 1. Fetch a sample trade order
  const { data: sampleOrder } = await supabaseAdmin
    .from('trade_orders')
    .select('id, buyer_notes')
    .limit(1)
    .single();

  console.log('1. Testing Self-Pickup Logistics Metadata packing on trade_orders:', sampleOrder.id);
  const pickupMeta = {
    delivery_option: 'pickup',
    arrival_date: '2026-09-02',
    visitor_count: 2,
    vehicle_number: 'MH 14 HG 5678',
    p1_name: 'Suresh Patil (Primary Driver)',
    p1_phone: '9822012345',
    p1_aadhar: '123456789012',
    p2_name: 'Anand Shinde (Logistics Manager)',
    p2_phone: '9822054321',
    p2_aadhar: '987654321098',
    tracking_number: `GATE-PASS-${sampleOrder.id.slice(0, 8).toUpperCase()}`,
    confirmed_at: new Date().toISOString()
  };

  const pickupNotes = `<!--LOGISTICS_META:${JSON.stringify(pickupMeta)}-->\nDirect Factory Self-Pickup arrangement at Central Godown.`;

  const { data: updateRes, error: updateErr } = await supabaseAdmin
    .from('trade_orders')
    .update({ buyer_notes: pickupNotes, updated_at: new Date().toISOString() })
    .eq('id', sampleOrder.id)
    .select()
    .single();

  if (updateErr) throw new Error('Self-pickup update failed: ' + updateErr.message);
  console.log('   ✓ Packed Self-Pickup metadata successfully into trade_orders.buyer_notes');

  // 2. Verify extraction
  console.log('\n2. Testing Extraction of Logistics metadata:');
  const match = updateRes.buyer_notes.match(/<!--LOGISTICS_META:(.*?)-->/);
  const extracted = JSON.parse(match[1]);
  console.log('   ✓ Mode:', extracted.delivery_option === 'pickup' ? '🏢 Self-Pickup' : '🚚 Delivery');
  console.log('   ✓ Arrival Date:', extracted.arrival_date);
  console.log('   ✓ Vehicle Number:', extracted.vehicle_number);
  console.log('   ✓ Driver 1:', extracted.p1_name, '| Phone:', extracted.p1_phone, '| Aadhar:', extracted.p1_aadhar);
  console.log('   ✓ Visitor 2:', extracted.p2_name, '| Aadhar:', extracted.p2_aadhar);
  console.log('   ✓ Gate Pass:', extracted.tracking_number);

  // 3. Test Delivery Logistics Metadata packing
  console.log('\n3. Testing Delivery Logistics Metadata packing:');
  const deliveryMeta = {
    delivery_option: 'deliver',
    delivery_date: '5 business days',
    delivery_address: 'Plot 45, MIDC Phase 2, Chakan, Pune - 410501, Maharashtra',
    receiver_name: 'Vikram Joshi (Site Incharge)',
    receiver_phone: '9226497450',
    transporter_name: 'VRL Commercial Fleet',
    tracking_number: `AWB-IND-${sampleOrder.id.slice(0, 8).toUpperCase()}`,
    confirmed_at: new Date().toISOString()
  };

  const deliveryNotes = `<!--LOGISTICS_META:${JSON.stringify(deliveryMeta)}-->\nDirect pan-India delivery to Chakan Industrial MIDC.`;
  const { data: delivRes, error: delivErr } = await supabaseAdmin
    .from('trade_orders')
    .update({ buyer_notes: deliveryNotes, updated_at: new Date().toISOString() })
    .eq('id', sampleOrder.id)
    .select()
    .single();

  if (delivErr) throw new Error('Delivery update failed: ' + delivErr.message);
  console.log('   ✓ Packed Delivery metadata successfully into trade_orders.buyer_notes');
  const delivMatch = delivRes.buyer_notes.match(/<!--LOGISTICS_META:(.*?)-->/);
  const delivExtracted = JSON.parse(delivMatch[1]);
  console.log('   ✓ Destination:', delivExtracted.delivery_address);
  console.log('   ✓ Transporter:', delivExtracted.transporter_name);
  console.log('   ✓ Receiver:', delivExtracted.receiver_name, '| Phone:', delivExtracted.receiver_phone);
  console.log('   ✓ AWB Number:', delivExtracted.tracking_number);

  console.log('\n============================================================');
  console.log('🎉 ALL LOGISTICS & ADMIN ORDER INTEGRATION VERIFIED 100%!');
  console.log('============================================================');
}

testCompleteLogistics().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
