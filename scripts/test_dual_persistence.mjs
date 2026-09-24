import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
});

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const BANNER_STATE_ACTION = 'platform_banners_config';

async function saveBannersToSupabase(banners) {
  // Check if platform_banners table exists
  const { error: pbErr } = await sb.from('platform_banners').select('id').limit(1);
  if (!pbErr) {
    console.log('Using public.platform_banners table');
    return true;
  }

  // Fallback to activity_logs config storage
  console.log('platform_banners table missing, using activity_logs persistent store');
  const { data, error } = await sb.from('activity_logs').insert([{
    action: BANNER_STATE_ACTION,
    details: { banners, updated_at: new Date().toISOString() }
  }]).select();

  if (error) {
    console.error('Error saving to activity_logs:', error.message);
    return false;
  }
  console.log('Saved banners to activity_logs successfully, id:', data[0].id);
  return true;
}

async function loadBannersFromSupabase() {
  const { data: pbData, error: pbErr } = await sb.from('platform_banners').select('*').order('display_order', { ascending: true });
  if (!pbErr && pbData && pbData.length > 0) {
    return pbData;
  }

  // Fallback to activity_logs
  const { data: logData, error: logErr } = await sb
    .from('activity_logs')
    .select('*')
    .eq('action', BANNER_STATE_ACTION)
    .order('created_at', { ascending: false })
    .limit(1);

  if (!logErr && logData && logData.length > 0 && logData[0].details?.banners) {
    return logData[0].details.banners;
  }

  return null;
}

async function test() {
  const sampleBanners = JSON.parse(fs.readFileSync('data/platform_banners.json', 'utf8'));
  // Set first banner to inactive
  sampleBanners[0].is_active = false;

  await saveBannersToSupabase(sampleBanners);

  const loaded = await loadBannersFromSupabase();
  console.log('Loaded banners count:', loaded?.length);
  console.log('First banner is_active:', loaded?.[0]?.is_active);

  // Restore to true
  sampleBanners[0].is_active = true;
  await saveBannersToSupabase(sampleBanners);
  const loaded2 = await loadBannersFromSupabase();
  console.log('Restored first banner is_active:', loaded2?.[0]?.is_active);
}

test();
