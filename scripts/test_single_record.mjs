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

async function testSingleRecord() {
  const sampleBanners = JSON.parse(fs.readFileSync('data/platform_banners.json', 'utf8'));
  
  // Find all existing records
  const { data: allRecords } = await sb
    .from('activity_logs')
    .select('id')
    .eq('action', BANNER_STATE_ACTION);

  console.log('Existing records count:', allRecords?.length);

  // If more than 1, delete extras
  if (allRecords && allRecords.length > 1) {
    const idsToDelete = allRecords.slice(1).map(r => r.id);
    await sb.from('activity_logs').delete().in('id', idsToDelete);
    console.log('Cleaned up extra records:', idsToDelete.length);
  }

  // Update or insert single record
  const targetId = allRecords?.[0]?.id;
  if (targetId) {
    const { error } = await sb
      .from('activity_logs')
      .update({
        details: { banners: sampleBanners, updated_at: new Date().toISOString() },
        created_at: new Date().toISOString()
      })
      .eq('id', targetId);
    console.log('Updated record:', targetId, 'Error:', error?.message);
  } else {
    const { data, error } = await sb
      .from('activity_logs')
      .insert([{
        action: BANNER_STATE_ACTION,
        details: { banners: sampleBanners, updated_at: new Date().toISOString() }
      }])
      .select();
    console.log('Inserted record:', data?.[0]?.id, 'Error:', error?.message);
  }

  // Verify fetch
  const { data: fetched } = await sb
    .from('activity_logs')
    .select('*')
    .eq('action', BANNER_STATE_ACTION);
  console.log('Final record count:', fetched.length, 'Banners in details:', fetched[0].details.banners.length);
}

testSingleRecord();
