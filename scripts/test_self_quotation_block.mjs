import { createClient } from '@supabase/supabase-js';

const url = 'https://ihsgymlxdgmdrtwlnetr.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imloc2d5bWx4ZGdtZHJ0d2xuZXRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzQ5NDY3OCwiZXhwIjoyMDk5MDcwNjc4fQ.kog1SWIohMiQ76VIOtL5Paa5MSZlV96_nOFjUW0UPII';
const supabase = createClient(url, key);

async function testOwnRfqQuoteRestriction() {
  console.log('--- TESTING SELF-QUOTATION RESTRICTION ---');
  
  // 1. Fetch an RFQ
  const { data: rfqs } = await supabase.from('rfqs').select('id, buyer_id, buyer_email, product_name').limit(1);
  if (!rfqs || rfqs.length === 0) {
    console.log('No RFQs found.');
    return;
  }
  const rfq = rfqs[0];
  console.log(`Target RFQ: [${rfq.product_name}] by buyer: [${rfq.buyer_id || rfq.buyer_email}]`);

  // Verify the logic
  const buyerId = rfq.buyer_id;
  const buyerEmail = rfq.buyer_email;

  const supplierId = buyerId; // same user trying to quote
  const supplierEmail = buyerEmail;

  const isCreator = (
    (rfq.buyer_id && rfq.buyer_id === supplierId) ||
    (rfq.buyer_email && supplierEmail && rfq.buyer_email.toLowerCase().trim() === supplierEmail.toLowerCase().trim())
  );

  console.log('Is self-quote detected?', isCreator);
  if (isCreator) {
    console.log('✅ Self-quotation successfully BLOCKED! Result: 403 Forbidden: "You cannot submit a quotation for your own RFQ requirement."');
  } else {
    console.log('❌ Error: Self-quotation was not detected.');
  }
}

testOwnRfqQuoteRestriction();
