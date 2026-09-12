import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data: sectorData } = await supabase
    .from('industry_sectors')
    .select('slug, name');
  console.log("Seeded Slugs:", sectorData.map(s => s.slug).join(', '));
}
test();
