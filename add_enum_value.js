require('@next/env').loadEnvConfig(process.cwd());
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: "ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'both';" });
  if (error) {
    console.error("Error adding value to enum:", error);
  } else {
    console.log("Successfully added 'both' to user_role ENUM", data);
  }
}

run();
