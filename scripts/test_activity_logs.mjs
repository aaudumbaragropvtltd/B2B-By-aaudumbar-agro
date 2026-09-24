import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
});

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function testActivityLogs() {
  const testPayload = {
    action: 'cms_banner_state_test',
    user_id: null,
    details: {
      banners: [
        { id: 'banner-1', is_active: false }
      ]
    }
  };

  const { data, error } = await sb.from('activity_logs').insert([testPayload]).select();
  console.log('Insert into activity_logs ->', error ? error.message : 'SUCCESS', data);

  if (!error) {
    const { data: fetched, error: fetchErr } = await sb
      .from('activity_logs')
      .select('*')
      .eq('action', 'cms_banner_state_test')
      .order('created_at', { ascending: false })
      .limit(1);
    console.log('Fetch from activity_logs ->', fetchErr ? fetchErr.message : 'SUCCESS', fetched);

    // Clean up test entry
    if (fetched?.[0]?.id) {
      await sb.from('activity_logs').delete().eq('id', fetched[0].id);
      console.log('Cleaned up test entry');
    }
  }
}

testActivityLogs();
