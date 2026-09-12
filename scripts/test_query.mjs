import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data: sectorData } = await supabase
    .from('industry_sectors')
    .select('id, name, slug, description, hero_image_url, parent_id')
    .is('parent_id', null)
    .eq('is_active', true)
    .order('display_order');
    
  console.log("Null parent sectors:", sectorData?.length);
  
  const { data: allSectors } = await supabase
    .from('industry_sectors')
    .select('id, name, slug, parent_id')
    .eq('is_active', true);
    
  console.log("All sectors:", allSectors?.length);
  if (allSectors?.length > 0) {
    console.log("Sample sector:", allSectors[0]);
  }
}
test();
