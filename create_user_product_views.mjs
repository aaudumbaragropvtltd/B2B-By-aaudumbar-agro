import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf-8').split('\n').reduce((acc, line) => {
  const [key, value] = line.split('=');
  if (key && value) acc[key.trim()] = value.trim();
  return acc;
}, {});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const sql = `
    CREATE TABLE IF NOT EXISTS user_product_views (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      viewed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- RLS
    ALTER TABLE user_product_views ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Users can insert their own views"
      ON user_product_views FOR INSERT
      WITH CHECK (user_id IN (SELECT id FROM users WHERE firebase_uid = current_setting('request.jwt.claim.sub', true)));

    CREATE POLICY "Admins can view all"
      ON user_product_views FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM users 
          WHERE firebase_uid = current_setting('request.jwt.claim.sub', true) 
          AND role = 'admin'
        )
      );

    -- Index for faster query
    CREATE INDEX IF NOT EXISTS idx_user_views ON user_product_views(user_id, viewed_at DESC);
  `;
  
  console.log('Running DDL for user_product_views...');
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
  if (error) {
    console.error('Error creating table:', error);
  } else {
    console.log('Table user_product_views created successfully!');
  }
}

run();
