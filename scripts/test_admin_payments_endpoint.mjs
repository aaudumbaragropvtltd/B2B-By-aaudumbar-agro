import { GET } from '../app/api/admin/payments/route.js';

async function run() {
  const req = new Request('http://localhost:3000/api/admin/payments?status=all');
  const res = await GET(req);
  console.log('Status:', res.status);
  const data = await res.json();
  console.log('Payments count:', data.payments?.length);
  console.log('Total count:', data.total);
  console.log('Metrics:', data.metrics);
  const soy = data.payments?.find(p => p.order_id === '7320c7be-4aa0-4ea8-80b8-1d2fd897a3a8');
  console.log('Soybean payment in response:');
  console.log(soy);
}

run();
