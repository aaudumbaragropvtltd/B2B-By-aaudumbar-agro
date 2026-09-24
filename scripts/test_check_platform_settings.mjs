import { createClient } from '@supabase/supabase-js';

async function checkPlatformSettings() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(url, key);

  const { data, error } = await supabase.from('platform_settings').select('*');
  console.log('platform_settings error:', error);
  console.log('platform_settings data:', data);
}

checkPlatformSettings();
