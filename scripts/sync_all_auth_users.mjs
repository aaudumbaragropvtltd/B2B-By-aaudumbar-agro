import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ihsgymlxdgmdrtwlnetr.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imloc2d5bWx4ZGdtZHJ0d2xuZXRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzQ5NDY3OCwiZXhwIjoyMDk5MDcwNjc4fQ.kog1SWIohMiQ76VIOtL5Paa5MSZlV96_nOFjUW0UPII';

const supabase = createClient(supabaseUrl, supabaseKey);

async function syncAllUsers() {
  const { data: authUsers, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error('Error listing auth users:', error);
    return;
  }

  console.log(`Syncing ${authUsers.users.length} auth users into users table...`);

  for (const user of authUsers.users) {
    // 1. Check if user exists by firebase_uid
    let { data: existingUser } = await supabase
      .from('users')
      .select('id, firebase_uid, registered_email, role')
      .eq('firebase_uid', user.id)
      .maybeSingle();

    // 2. Fallback check by registered_email
    if (!existingUser && user.email) {
      const { data: byEmail } = await supabase
        .from('users')
        .select('id, firebase_uid, registered_email, role')
        .ilike('registered_email', user.email)
        .maybeSingle();

      if (byEmail) {
        existingUser = byEmail;
        await supabase
          .from('users')
          .update({ firebase_uid: user.id })
          .eq('id', byEmail.id);
        console.log(`Linked auth user ${user.email} (UID: ${user.id}) to existing users row ${byEmail.id}`);
      }
    }

    // 3. If not existing at all, insert them!
    if (!existingUser) {
      const name = user.user_metadata?.company_name || user.user_metadata?.full_name || (user.email ? user.email.split('@')[0] : 'Verified Business');
      const insertUser = {
        firebase_uid: user.id,
        registered_email: user.email || `user_${user.id.slice(0, 8)}@b2bindia.site`,
        company_name: name,
        corporate_phone: user.user_metadata?.phone || '+91 9999999999',
        role: 'supplier',
        status: 'active',
        gst_number: 'PENDING',
        warehouse_address: 'India Warehouse',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        geo_lat: 19.0760,
        geo_lng: 72.8777
      };

      const { data: created, error: createErr } = await supabase
        .from('users')
        .insert([insertUser])
        .select()
        .single();

      if (createErr) {
        console.warn(`Failed to insert user ${user.email}:`, createErr.message);
      } else {
        console.log(`Created new profile for ${user.email} (ID: ${created.id})`);
      }
    }
  }

  console.log('All auth users successfully synced!');
}

syncAllUsers();
