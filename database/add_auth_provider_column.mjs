import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Load .env.local manually
const envContent = readFileSync('.env.local', 'utf-8');
envContent.split('\n').forEach(line => {
  const [key, ...vals] = line.split('=');
  if (key && vals.length) process.env[key.trim()] = vals.join('=').trim();
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addAuthProviderColumn() {
  console.log('Adding auth_provider column to users table...');
  
  // Add column (will be no-op if already exists)
  const { error } = await supabase.rpc('exec_sql', {
    query: `
      ALTER TABLE public.users 
      ADD COLUMN IF NOT EXISTS auth_provider TEXT DEFAULT 'email';
      
      COMMENT ON COLUMN public.users.auth_provider IS 'Login method: email or google';
    `
  });

  if (error) {
    // If rpc doesn't exist, try raw SQL via REST
    console.log('RPC not available, trying direct approach...');
    
    // Try adding the column by upserting a test row 
    // The column may already exist if added via Supabase dashboard
    const { data: testUser, error: testError } = await supabase
      .from('users')
      .select('auth_provider')
      .limit(1);
    
    if (testError && testError.message.includes('auth_provider')) {
      console.log('\n⚠️  Column "auth_provider" does not exist yet.');
      console.log('Please add it manually in Supabase Dashboard:');
      console.log('  1. Go to Table Editor → users');
      console.log('  2. Click "New Column"');
      console.log('  3. Name: auth_provider');
      console.log('  4. Type: text');
      console.log('  5. Default: email');
      console.log('  6. Save');
    } else {
      console.log('✅ Column "auth_provider" already exists or was added successfully.');
    }
  } else {
    console.log('✅ auth_provider column added successfully.');
  }

  // Backfill existing users with auth provider from Supabase auth
  console.log('\nBackfilling auth_provider for existing users...');
  
  const { data: { users: authUsers } } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  
  if (authUsers) {
    let updated = 0;
    for (const au of authUsers) {
      const provider = au.app_metadata?.provider || au.app_metadata?.providers?.[0] || 'email';
      const { error: updateErr } = await supabase
        .from('users')
        .update({ auth_provider: provider })
        .eq('firebase_uid', au.id);
      
      if (!updateErr) updated++;
    }
    console.log(`✅ Backfilled ${updated} users with auth_provider data.`);
  }
}

addAuthProviderColumn().catch(console.error);
