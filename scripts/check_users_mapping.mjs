import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ihsgymlxdgmdrtwlnetr.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imloc2d5bWx4ZGdtZHJ0d2xuZXRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzQ5NDY3OCwiZXhwIjoyMDk5MDcwNjc4fQ.kog1SWIohMiQ76VIOtL5Paa5MSZlV96_nOFjUW0UPII';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: users, error } = await supabase
    .from('users')
    .select('id, firebase_uid, company_name, registered_email, role')
    .limit(10);

  console.log('Users in DB:', users);
  
  const { data: authUsers, error: aErr } = await supabase.auth.admin.listUsers();
  console.log('Auth users count:', authUsers?.users?.length);
  if (authUsers?.users) {
    console.log('Auth users sample:', authUsers.users.map(u => ({ id: u.id, email: u.email })));
  }
}

run();
