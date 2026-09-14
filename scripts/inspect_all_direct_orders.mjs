import fs from 'fs';

const orders = JSON.parse(fs.readFileSync('data/direct_orders.json', 'utf8'));
console.log('Total orders in direct_orders.json:', orders.length);

const summary = orders.map((o, idx) => ({
  idx,
  id: o.id,
  product_name: o.product_name,
  buyer_email: o.buyer_email,
  buyer_company: o.buyer_company_name || o.company_name,
  buyer_contact: o.buyer_contact_person || o.buyer_name,
  total_amount: o.total_amount,
  advance_amount: o.advance_amount,
  transaction_id: o.transaction_id,
  payment_status: o.payment_status,
  created_at: o.created_at
}));

console.log(JSON.stringify(summary, null, 2));
