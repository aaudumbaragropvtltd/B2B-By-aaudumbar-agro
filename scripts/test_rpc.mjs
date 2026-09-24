import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
});

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function testRpc() {
  const rpcs = ['exec_sql', 'execute_sql', 'sql', 'run_sql', 'query'];
  for (const r of rpcs) {
    const { data, error } = await sb.rpc(r, { query: 'SELECT 1;' });
    console.log(r, '->', error ? error.message : 'SUCCESS: ' + JSON.stringify(data));
  }
}
testRpc();
