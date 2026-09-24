import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
});

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const candidateTables = [
    'platform_banners', 'platform_settings', 'platform_logs', 'site_settings', 
    'banners', 'categories', 'products', 'trade_orders', 'profiles', 'users'
  ];

  for (const t of candidateTables) {
    const { data, error, count } = await sb.from(t).select('*', { count: 'exact' }).limit(1);
    if (!error) {
      console.log(`✓ Table '${t}' exists. Rows: ${count}, Sample:`, data?.[0] ? Object.keys(data[0]) : 'empty');
    } else {
      console.log(`✗ Table '${t}': ${error.code} - ${error.message}`);
    }
  }
}

run();
