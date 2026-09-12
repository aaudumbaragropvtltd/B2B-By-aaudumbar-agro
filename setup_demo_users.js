const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf-8').split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) process.env[match[1]] = match[2];
});
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const DEMO_USERS = [
  { uid: 'firebase_demo_jain', email: 'demo_jain@b2bindia.site' },
  { uid: 'firebase_demo_arvind', email: 'demo_arvind@b2bindia.site' },
];

async function setup() {
  console.log('Setting up demo users in Supabase Auth...');
  for (const demo of DEMO_USERS) {
    console.log(`Processing ${demo.email}...`);
    // Create user in auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: demo.email,
      password: 'password123',
      email_confirm: true
    });

    if (authError && authError.message !== 'User already registered') {
      console.error('Error creating auth user:', authError);
      continue;
    }

    let authId = authData?.user?.id;

    if (!authId) {
      // Fetch existing user ID
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingUser = existingUsers.users.find(u => u.email === demo.email);
      if (existingUser) authId = existingUser.id;
    }

    if (authId) {
      // Update public.users
      const { error: updateError } = await supabase
        .from('users')
        .update({ firebase_uid: authId, onboarding_complete: true })
        .eq('firebase_uid', demo.uid);
        
      if (updateError) {
        console.error('Error updating users table:', updateError);
      } else {
        console.log(`Successfully mapped ${demo.email} to real auth ID.`);
      }
    }
  }
  console.log('Done!');
}

setup();
