import { createClient } from '@supabase/supabase-js';

async function checkSettingsTable() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(url, key);

  const { data, error } = await supabase.from('settings').select('*');
  console.log('settings error:', error);
  console.log('settings data:', data);
}

checkSettingsTable();
