import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ihsgymlxdgmdrtwlnetr.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imloc2d5bWx4ZGdtZHJ0d2xuZXRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzQ5NDY3OCwiZXhwIjoyMDk5MDcwNjc4fQ.kog1SWIohMiQ76VIOtL5Paa5MSZlV96_nOFjUW0UPII';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  const insertUser = {
    firebase_uid: '6abd4765-3038-454a-ab9a-937b300533b2',
    registered_email: 'raghavendra.sevalikar@gmail.com',
    company_name: 'Raghavendra Enterprises',
    corporate_phone: '+91 9999999999',
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

  const { data, error } = await supabase.from('users').insert([insertUser]).select();
  console.log('Insert result:', { data, error });
}

testInsert();
