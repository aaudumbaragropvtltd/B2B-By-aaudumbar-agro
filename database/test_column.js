const { readFileSync } = require('fs');
const env = readFileSync('.env.local', 'utf-8');
env.split('\n').forEach(l => {
  const [k, ...v] = l.split('=');
  if (k && v.length) process.env[k.trim()] = v.join('=').trim();
});

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function run() {
  // Test if auth_provider column exists
  const res = await fetch(`${url}/rest/v1/users?select=auth_provider&limit=1`, {
    headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
  });
  const text = await res.text();
  console.log('Column test status:', res.status);
  console.log('Column test result:', text);

  if (res.status !== 200 || text.includes('auth_provider')) {
    // Try adding column via SQL editor endpoint
    console.log('\nAttempting to add column via SQL...');
    const sqlRes = await fetch(`${url}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: "ALTER TABLE public.users ADD COLUMN IF NOT EXISTS auth_provider TEXT DEFAULT 'email'"
      })
    });
    console.log('SQL result status:', sqlRes.status);
    console.log('SQL result:', await sqlRes.text());
  }
}

run().catch(console.error);
