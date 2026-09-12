import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://ihsgymlxdgmdrtwlnetr.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imloc2d5bWx4ZGdtZHJ0d2xuZXRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzQ5NDY3OCwiZXhwIjoyMDk5MDcwNjc4fQ.kog1SWIohMiQ76VIOtL5Paa5MSZlV96_nOFjUW0UPII');

async function run() {
  const { data: products } = await supabase.from('products').select('id, technical_specifications, sector_id');
  const { data: sectors } = await supabase.from('industry_sectors').select('id, name');
  
  const sectorMap = {};
  sectors.forEach(s => sectorMap[s.id] = s.name.split(' ')[0]);
  
  const prefixes = ['Shree', 'Global', 'National', 'Premier', 'Apex', 'Royal', 'Balaji', 'Swastik', 'Pioneer', 'Mega', 'Elite', 'Paramount', 'Venkateshwara'];
  const suffixes = ['Industries', 'Enterprises', 'Exporters', 'Manufacturing Co.', 'Corporation', 'Traders', 'Ventures', 'Solutions'];
  const areas = ['Phase 1, MIDC', 'Industrial Area', 'GIDC', 'Sector 5', 'Tech Park', 'Industrial Estate', 'Phase 3, SIIP', 'Ghatkopar Industrial Estate'];
  
  let updated = 0;
  for (const p of products) {
    const sName = sectorMap[p.sector_id] || 'Trade';
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    const area = areas[Math.floor(Math.random() * areas.length)];
    
    const companyName = `${prefix} ${sName} ${suffix}`;
    const loc = p.technical_specifications['Origin Location'] || 'Mumbai, MH';
    const city = loc.split(',')[0];
    const address = `Plot No. ${Math.floor(Math.random()*200)+1}, ${area}, ${city}`;
    
    const newSpecs = {
      ...p.technical_specifications,
      'Supplier Name': companyName,
      'Supplier Address': address,
      'GSTIN': `${Math.floor(Math.random()*20)+10}AAACA${Math.floor(Math.random()*8999)+1000}A1Z${Math.floor(Math.random()*9)}`,
      'Year Established': Math.floor(Math.random() * (2020 - 1990) + 1990).toString()
    };
    
    const { error } = await supabase.from('products').update({ technical_specifications: newSpecs }).eq('id', p.id);
    if (!error) updated++;
  }
  console.log(`Done! Updated ${updated} products.`);
}

run();
