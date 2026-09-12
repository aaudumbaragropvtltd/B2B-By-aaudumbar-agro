import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ihsgymlxdgmdrtwlnetr.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imloc2d5bWx4ZGdtZHJ0d2xuZXRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzQ5NDY3OCwiZXhwIjoyMDk5MDcwNjc4fQ.kog1SWIohMiQ76VIOtL5Paa5MSZlV96_nOFjUW0UPII';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: authUsers } = await supabase.auth.admin.listUsers();
  console.log('Total auth users:', authUsers?.users?.length);

  for (const au of authUsers.users) {
    // Check if in users table
    const { data: uByFid } = await supabase.from('users').select('id, registered_email, role, firebase_uid').eq('firebase_uid', au.id).maybeSingle();
    const { data: uByEmail } = await supabase.from('users').select('id, registered_email, role, firebase_uid').ilike('registered_email', au.email).maybeSingle();
    
    console.log(`Auth user: ${au.email} (ID: ${au.id})`);
    console.log(`  - By firebase_uid:`, uByFid ? `FOUND (id: ${uByFid.id})` : 'NOT FOUND');
    console.log(`  - By registered_email:`, uByEmail ? `FOUND (id: ${uByEmail.id}, fuid: ${uByEmail.firebase_uid})` : 'NOT FOUND');
  }
}

run();
