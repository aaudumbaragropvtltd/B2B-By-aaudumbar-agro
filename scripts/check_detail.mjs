import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
});

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  for (const t of ['platform_banners', 'platform_settings', 'platform_ledger', 'industry_sectors']) {
    const res = await sb.from(t).select('*').limit(1);
    console.log(t, '-> error:', res.error?.message, 'status:', res.status, 'data:', res.data);
  }
}
check();
