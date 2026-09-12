import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://ihsgymlxdgmdrtwlnetr.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imloc2d5bWx4ZGdtZHJ0d2xuZXRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzQ5NDY3OCwiZXhwIjoyMDk5MDcwNjc4fQ.kog1SWIohMiQ76VIOtL5Paa5MSZlV96_nOFjUW0UPII');

async function run() {
  const { data: products } = await supabase.from('products').select('id, title, description, technical_specifications, sector_id');
  const { data: sectors } = await supabase.from('industry_sectors').select('id, slug, name');
  
  const sectorMap = {};
  sectors.forEach(s => sectorMap[s.id] = { slug: s.slug, name: s.name.split(' ')[0] });
  
  // Suppliers
  const prefixes = ['Shree', 'Global', 'National', 'Premier', 'Apex', 'Royal', 'Balaji', 'Swastik', 'Pioneer', 'Mega', 'Elite', 'Paramount', 'Venkateshwara'];
  const suffixes = ['Industries', 'Enterprises', 'Exporters', 'Manufacturing Co.', 'Corporation', 'Traders', 'Ventures', 'Solutions'];
  const areas = ['Phase 1, MIDC', 'Industrial Area', 'GIDC', 'Sector 5', 'Tech Park', 'Industrial Estate', 'Phase 3, SIIP', 'Ghatkopar Industrial Estate'];
  
  let updated = 0;
  for (const p of products) {
    const sInfo = sectorMap[p.sector_id] || { slug: 'general', name: 'Trade' };
    const sName = sInfo.name;
    const slug = sInfo.slug;
    
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    const area = areas[Math.floor(Math.random() * areas.length)];
    const companyName = `${prefix} ${sName} ${suffix}`;
    const loc = p.technical_specifications['Origin Location'] || 'Mumbai, MH';
    const city = loc.split(',')[0];
    const address = `Plot No. ${Math.floor(Math.random()*200)+1}, ${area}, ${city}`;
    
    // Fix specifications
    const newSpecs = {
      ...p.technical_specifications,
      'Supplier Name': companyName,
      'Supplier Address': address,
      'GSTIN': `${Math.floor(Math.random()*20)+10}AAACA${Math.floor(Math.random()*8999)+1000}A1Z${Math.floor(Math.random()*9)}`,
      'Year Established': Math.floor(Math.random() * (2020 - 1990) + 1990).toString()
    };
    
    // Fix "1 Liter" for solid food
    if (newSpecs['Packaging Size'] === '1 Liter' && (slug === 'food-agriculture' || slug === 'ayurvedic-herbal')) {
      newSpecs['Packaging Size'] = Math.random() > 0.5 ? '25 Kg' : '50 Kg';
    }
    
    // Fix Description
    let newDesc = p.description;
    
    if (slug === 'food-agriculture' || slug === 'ayurvedic-herbal' || slug === 'pharma-drugs') {
      newDesc = `We are a leading manufacturer and wholesale supplier of premium quality **${p.title}**, catering to bulk B2B requirements across India. Sourced from the finest, authentic origins and adhering to strict safety and quality standards, our ${p.title} ensures exceptional freshness, purity, and nutritional value. 

**Key Specifications & Features:**
- **Category:** ${sInfo.slug.replace('-', ' & ').toUpperCase()}
- **Quality Grade:** Premium / Export Quality
- **Applications:** Suitable for commercial food processing, retail packaging, and culinary applications.
- **Features:** 100% adulteration-free, long shelf-life, hygienically processed, and naturally sourced.
- **Packaging:** Safe, moisture-proof bulk packaging.

**Why Choose Us?**
As verified suppliers on B2B India, we guarantee 100% genuine products, on-time delivery, and highly competitive wholesale pricing. Our state-of-the-art facility allows us to fulfill large-scale orders with a rapid turnaround time. 

*Contact us today for a custom quotation or to request a sample.*`;
    } 
    else if (slug === 'apparel-garments' || slug === 'textiles-fabrics') {
      newDesc = `We are a leading manufacturer and wholesale supplier of premium quality **${p.title}**, catering to bulk B2B requirements across India. Sourced from the finest yarns and adhering to strict textile standards, our ${p.title} ensures exceptional comfort, color-fastness, and durability. 

**Key Specifications & Features:**
- **Category:** ${sInfo.slug.replace('-', ' & ').toUpperCase()}
- **Quality Grade:** Premium / Export Quality
- **Applications:** Suitable for retail, boutiques, and large-scale distribution.
- **Features:** Breathable fabric, flawless stitching, shrink-resistant, and trendy design.
- **Packaging:** Safe, transit-ready bulk packaging.

**Why Choose Us?**
As verified suppliers on B2B India, we guarantee 100% genuine products, on-time delivery, and highly competitive wholesale pricing. Our state-of-the-art facility allows us to fulfill large-scale orders with a rapid turnaround time. 

*Contact us today for a custom quotation or to request a sample.*`;
    }
    else {
      // General industrial/machinery
      newDesc = `We are a leading manufacturer and wholesale supplier of premium quality **${p.title}**, catering to bulk B2B requirements across India. Sourced from the finest materials and adhering to strict industry standards, our ${p.title} ensures exceptional durability, performance, and reliability. 

**Key Specifications & Features:**
- **Category:** ${sInfo.slug.replace('-', ' & ').toUpperCase()}
- **Quality Grade:** Premium / Export Quality
- **Applications:** Suitable for industrial, commercial, and heavy-duty applications.
- **Features:** High efficiency, robust construction, wear-resistant, and low maintenance.
- **Packaging:** Safe, transit-ready bulk packaging.

**Why Choose Us?**
As verified suppliers on B2B India, we guarantee 100% genuine products, on-time delivery, and highly competitive wholesale pricing. Our state-of-the-art facility allows us to fulfill large-scale orders with a rapid turnaround time. 

*Contact us today for a custom quotation or to request a sample.*`;
    }

    const { error } = await supabase.from('products').update({ 
      technical_specifications: newSpecs,
      description: newDesc
    }).eq('id', p.id);
    
    if (!error) updated++;
  }
  console.log(`Done! Updated ${updated} products with correct descriptions and supplier names.`);
}

run();
