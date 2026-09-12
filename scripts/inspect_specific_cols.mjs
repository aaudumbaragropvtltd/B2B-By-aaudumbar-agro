import { createClient } from '@supabase/supabase-js';

const url = 'https://ihsgymlxdgmdrtwlnetr.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imloc2d5bWx4ZGdtZHJ0d2xuZXRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzQ5NDY3OCwiZXhwIjoyMDk5MDcwNjc4fQ.kog1SWIohMiQ76VIOtL5Paa5MSZlV96_nOFjUW0UPII';
const supabase = createClient(url, key);

async function checkColumns(tableName, candidateColumns) {
  console.log(`\n--- Inspecting Table [${tableName}] ---`);
  for (const col of candidateColumns) {
    const { data, error } = await supabase.from(tableName).select(col).limit(1);
    if (error) {
      console.log(`  ❌ Column [${col}] -> MISSING (${error.message})`);
    } else {
      console.log(`  ✅ Column [${col}] -> EXISTS`);
    }
  }
}

async function run() {
  await checkColumns('user_product_views', ['id', 'user_id', 'product_id', 'viewed_at', 'created_at']);
  await checkColumns('conversations', ['id', 'buyer_id', 'supplier_id', 'product_id', 'rfq_id', 'last_message_at', 'created_at', 'updated_at']);
  await checkColumns('messages', ['id', 'conversation_id', 'sender_id', 'content', 'is_read', 'created_at']);
}

run();
