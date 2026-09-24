import { createClient } from '@supabase/supabase-js';

async function checkSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  console.log('Supabase URL:', url ? 'Defined' : 'Missing');
  console.log('Service Key:', key ? 'Defined' : 'Missing');

  if (!url || !key) return;

  const supabase = createClient(url, key);
  const { data, error } = await supabase.from('platform_banners').select('*');
  console.log('platform_banners data length:', data?.length);
  console.log('platform_banners data:', data);
  console.log('platform_banners error:', error);
}

checkSupabase();
