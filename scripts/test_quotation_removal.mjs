const BASE_URL = 'http://localhost:3000';

async function testQuotationRemoval() {
  console.log('====================================================');
  console.log('🧪 TESTING QUOTATION REMOVAL ON ORDER BOOKING');
  console.log('====================================================\n');

  const res = await fetch(`${BASE_URL}/api/orders/list`);
  const data = await res.json();

  console.log('Response status:', res.status);
  console.log(`Confirmed orders: ${data.orders?.length || 0}`);
  console.log(`Open quotations ready to book: ${data.quotations?.length || 0}`);

  // Check that every quotation returned is strictly NOT accepted/fulfilled
  const invalidQuotes = (data.quotations || []).filter(q => 
    ['accepted', 'fulfilled', 'ordered', 'closed'].includes(q.status?.toLowerCase())
  );

  if (invalidQuotes.length > 0) {
    console.error('❌ Found quotations that should have been excluded:', invalidQuotes);
    throw new Error('Quotations with accepted/fulfilled status are still present');
  }

  console.log('✅ All returned quotations are strictly open & unbooked!');
  console.log('====================================================');
  console.log('🎉 ALL QUOTATION REMOVAL TESTS PASSED!');
  console.log('====================================================');
}

testQuotationRemoval().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
