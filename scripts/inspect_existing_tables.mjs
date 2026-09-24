import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
});

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function inspectTables() {
  const existingTables = [
    'industry_sectors',
    'activity_logs',
    'search_logs',
    'platform_ledger'
  ];

  for (const t of existingTables) {
    const { data, error } = await sb.from(t).select('*').limit(1);
    if (!error && data && data.length > 0) {
      console.log(`Table ${t}:`, Object.keys(data[0]));
    } else {
      console.log(`Table ${t} empty or error:`, error?.message);
    }
  }
}

inspectTables();
