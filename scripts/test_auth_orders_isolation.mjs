import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envContent = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
});

const adminClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  console.log('--- 1. Testing Unauthenticated Access ---');
  const unauthRes = await fetch('http://localhost:3000/api/orders/list');
  const unauthData = await unauthRes.json();
  console.log('Unauth count:', unauthData.count, 'Expected: 0');

  console.log('\n--- 2. Testing Unauthenticated Snooping by Email ---');
  const snoopRes = await fetch('http://localhost:3000/api/orders/list?email=raghavendra.sevalikar5730@gmail.com');
  const snoopData = await snoopRes.json();
  console.log('Snoop count:', snoopData.count, 'Expected: 0');

  console.log('\n--- 3. Testing astropanditsaraf@gmail.com (New User) with Token ---');
  // Generate a custom/magic session or link for astropanditsaraf
  const { data: astroLink } = await adminClient.auth.admin.generateLink({
    type: 'magiclink',
    email: 'astropanditsaraf@gmail.com',
  });
  
  // Use anon client to verify OTP or sign in
  const anonClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const tokenHash = astroLink?.properties?.hashed_token;
  
  const { data: sessionData, error: sessionErr } = await anonClient.auth.verifyOtp({
    token_hash: tokenHash,
    type: 'email',
  });

  if (sessionData?.session?.access_token) {
    const token = sessionData.session.access_token;
    console.log('Authenticated as astropanditsaraf@gmail.com successfully.');

    // Fetch orders with Bearer token
    const astroOrdersRes = await fetch('http://localhost:3000/api/orders/list', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const astroOrders = await astroOrdersRes.json();
    console.log('astropanditsaraf orders count:', astroOrders.count, 'Expected: 0');
    console.log('astropanditsaraf sessionEmail:', astroOrders.sessionEmail);

    // Try to snoop on Raghavendra's orders by passing ?email=raghavendra... while logged in as astropanditsaraf
    console.log('\n--- 4. Testing Malicious Email Param Tampering ---');
    const tamperRes = await fetch('http://localhost:3000/api/orders/list?email=raghavendra.sevalikar5730@gmail.com', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const tamperData = await tamperRes.json();
    console.log('Tampered query orders count:', tamperData.count, 'Expected: 0');
    console.log('Tampered query sessionEmail:', tamperData.sessionEmail, 'Expected: astropanditsaraf@gmail.com');
  } else {
    console.log('Could not obtain session for astropanditsaraf:', sessionErr?.message);
  }

  console.log('\n--- 5. Testing raghavendra.sevalikar5730@gmail.com (Owner) with Token ---');
  const { data: raghavLink } = await adminClient.auth.admin.generateLink({
    type: 'magiclink',
    email: 'raghavendra.sevalikar5730@gmail.com',
  });
  const raghavTokenHash = raghavLink?.properties?.hashed_token;
  const anonClient2 = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const { data: raghavSession } = await anonClient2.auth.verifyOtp({
    token_hash: raghavTokenHash,
    type: 'email',
  });

  if (raghavSession?.session?.access_token) {
    const raghavToken = raghavSession.session.access_token;
    const raghavRes = await fetch('http://localhost:3000/api/orders/list', {
      headers: { 'Authorization': `Bearer ${raghavToken}` }
    });
    const raghavData = await raghavRes.json();
    console.log('Raghav orders count:', raghavData.count, 'Expected: >0');
    console.log('Raghav orders all belong to Raghavendra:', raghavData.orders.every(o => o.buyer_email?.toLowerCase() === 'raghavendra.sevalikar5730@gmail.com'));
  }

  console.log('\n--- 6. Specific Transaction ID Guest Lookup ---');
  const txnRes = await fetch('http://localhost:3000/api/orders/list?search=TXN-RZP-S7UDNE');
  const txnData = await txnRes.json();
  console.log('Specific TXN search orders count:', txnData.count, 'Expected: 1');
  console.log('Specific TXN transaction ID:', txnData.orders[0]?.transaction_id);
}

test().catch(console.error);
