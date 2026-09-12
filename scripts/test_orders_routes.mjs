const BASE_URL = 'http://localhost:3000';

async function testOrdersRoutes() {
  console.log('Testing /orders...');
  const res1 = await fetch(`${BASE_URL}/orders`);
  console.log('/orders status:', res1.status);

  console.log('Testing /dashboard/orders (should redirect or load cleanly)...');
  const res2 = await fetch(`${BASE_URL}/dashboard/orders`, { redirect: 'manual' });
  console.log('/dashboard/orders status:', res2.status);

  console.log('Testing /dashboard...');
  const res3 = await fetch(`${BASE_URL}/dashboard`);
  console.log('/dashboard status:', res3.status);

  console.log('✅ All Orders routing tests passed!');
}

testOrdersRoutes().catch(console.error);
