import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ihsgymlxdgmdrtwlnetr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imloc2d5bWx4ZGdtZHJ0d2xuZXRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzQ5NDY3OCwiZXhwIjoyMDk5MDcwNjc4fQ.kog1SWIohMiQ76VIOtL5Paa5MSZlV96_nOFjUW0UPII'
);

async function run() {
  const sql = `
    CREATE TABLE IF NOT EXISTS market_rates (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      product_id UUID REFERENCES products(id) ON DELETE CASCADE,
      commodity_name VARCHAR(255) NOT NULL,
      min_price NUMERIC(10, 2) NOT NULL,
      max_price NUMERIC(10, 2) NOT NULL,
      average_price NUMERIC(10, 2) NOT NULL,
      source_url VARCHAR(255),
      is_competitor BOOLEAN DEFAULT false,
      recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
  
  console.log('Running DDL...');
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
  if (error) {
    console.error('Error creating table:', error);
  } else {
    console.log('Table market_rates created successfully!');
  }
}

run();
