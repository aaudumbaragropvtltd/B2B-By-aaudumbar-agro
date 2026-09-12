import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ihsgymlxdgmdrtwlnetr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imloc2d5bWx4ZGdtZHJ0d2xuZXRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzQ5NDY3OCwiZXhwIjoyMDk5MDcwNjc4fQ.kog1SWIohMiQ76VIOtL5Paa5MSZlV96_nOFjUW0UPII';
const supabase = createClient(supabaseUrl, supabaseKey);

const SPECS = {
  'Material': ['Stainless Steel', 'Brass', 'Mild Steel', 'HDPE', 'Plastic', 'Copper', 'Aluminum', 'Cotton', 'Polyester', 'Wood', 'Glass', 'Ceramic', 'Leather'],
  'Grade': ['Industrial', 'Commercial', 'Premium', 'A Grade', 'Export Quality', 'Standard'],
  'Dimension': ['Standard', 'Custom', '10x10 inch', '1m x 2m', 'Customizable'],
  'Dimensions': ['Standard', 'Custom', '10x10 inch', '1m x 2m', 'Customizable'],
  'Strength': ['High', 'Medium', 'Heavy Duty', 'Standard'],
  'Voltage': ['220V', '415V', '12V', '24V', '110V'],
  'Power': ['1 kW', '5 kW', '10 HP', '0.5 HP', '500W'],
  'Phase': ['Single Phase', 'Three Phase', 'DC'],
  'Automation Grade': ['Manual', 'Semi-Automatic', 'Fully Automatic'],
  'Capacity': ['100 L', '120 L', '240 L', '500 kg/hr', '1 ton/day', 'Custom'],
  'Weight': ['5 kg', '10 kg', '50 kg', 'Heavy Duty', 'Lightweight'],
  'Fabric': ['100% Cotton', 'Polyester', 'Blend', 'Silk', 'Denim'],
  'Size': ['Small', 'Medium', 'Large', 'Free Size', 'Custom', '1 Inch', '2 Inch'],
  'Color': ['Red', 'Blue', 'Green', 'Black', 'White', 'Multicolor', 'Custom'],
  'Pattern': ['Plain', 'Printed', 'Checked', 'Striped'],
  'Wash Care': ['Machine Wash', 'Hand Wash', 'Dry Clean Only'],
  'Crop Type': ['Organic', 'Hybrid', 'Conventional', 'Premium'],
  'Shelf Life': ['6 Months', '1 Year', '2 Years', '36 Months'],
  'Packaging Size': ['5 kg', '10 kg', '25 kg', '50 kg', '1 Liter'],
  'Purity': ['99%', '98%', '100%', 'Standard'],
  'Form': ['Liquid', 'Powder', 'Solid', 'Granules', 'Paste'],
  'Packaging': ['Bag', 'Box', 'Bottle', 'Drum', 'Carton'],
  'Usage': ['Industrial', 'Commercial', 'Residential', 'General Purpose'],
  'Certification': ['ISO 9001', 'CE', 'ISI', 'RoHS', 'FDA', 'FSSAI'],
  'Warranty': ['6 Months', '1 Year', '2 Years', '5 Years', 'Not Applicable'],
  'Finish': ['Matte', 'Glossy', 'Polished', 'Zinc Plated', 'Painted'],
  'Thickness': ['1mm', '2mm', '5mm', '10mm', 'Custom'],
  'Compatibility': ['Universal', 'Specific Models', 'Standard'],
  'Efficiency': ['High', 'Standard', 'Premium (IE3)', 'Energy Efficient'],
  'Pressure Rating': ['PN10', 'PN16', '150 PSI', 'High Pressure', 'Standard'],
  'GSM': ['120', '180', '220', '300'],
  'Width': ['36 inch', '44 inch', '58 inch'],
  'Dosage': ['As Prescribed', 'Standard', '500mg', '10ml'],
  'Hardness': ['Soft', 'Medium', 'Hard', 'Custom'],
  'Polish': ['High Gloss', 'Matte', 'Standard'],
  'Density': ['High', 'Medium', 'Low'],
  'Flash Point': ['Standard', 'High', 'Non-flammable'],
  'Length': ['1m', '2m', '5m', '10m', 'Custom'],
  'Technology': ['RO', 'UV', 'UF', 'Standard', 'Advanced'],
  'Flow Rate': ['100 LPH', '500 LPH', '1000 LPH', 'Custom'],
  'Refrigerant': ['R32', 'R410A', 'R22', 'R134a'],
  'Accuracy': ['High Precision', 'Standard', '+/- 1%', '+/- 0.1%'],
  'Range': ['0-100', 'Standard', 'Extended', 'Custom'],
  'Leather Type': ['Genuine Leather', 'PU Leather', 'Synthetic', 'Suede'],
  'Design': ['Modern', 'Traditional', 'Custom', 'Ergonomic'],
  'Frequency': ['50Hz', '60Hz', '2.4GHz', '5GHz'],
  'Port': ['USB', 'Ethernet', 'HDMI', 'Standard'],
  'Wood Type': ['Teak', 'Pine', 'Oak', 'MDF', 'Plywood'],
  'Moisture': ['Max 12%', 'Max 10%', 'Max 8%', 'N/A'],
  'Fuel Type': ['Diesel', 'Petrol', 'Gas', 'Electric'],
  'Ingredients': ['Herbal', 'Natural', 'Standard', 'Ayurvedic Extract'],
  'Type': ['Standard', 'Premium', 'Custom', 'Advanced'],
  'Wheels': ['With Wheels', 'Without Wheels', '2 Wheels', '4 Wheels'],
  'Skin Type': ['All Skin Types', 'Dry Skin', 'Oily Skin', 'Sensitive'],
  'Language': ['English', 'Hindi', 'Regional', 'Multilingual'],
};

const SECTOR_CONFIG = {
  'building-construction': { gst: 18, keys: ['Material', 'Grade', 'Dimension', 'Strength'] },
  'electronics-electrical': { gst: 18, keys: ['Voltage', 'Power', 'Phase', 'Material', 'Warranty'] },
  'industrial-machinery': { gst: 18, keys: ['Automation Grade', 'Capacity', 'Power', 'Weight', 'Warranty'] },
  'apparel-garments': { gst: 5, keys: ['Fabric', 'Size', 'Color', 'Pattern', 'Wash Care'] },
  'food-agriculture': { gst: 5, keys: ['Crop Type', 'Shelf Life', 'Packaging Size', 'Grade'] },
  'chemicals-dyes': { gst: 18, keys: ['Purity', 'Grade', 'Form', 'Shelf Life', 'Packaging'] },
  'medical-healthcare': { gst: 12, keys: ['Material', 'Usage', 'Certification', 'Warranty'] },
  'furniture-interiors': { gst: 18, keys: ['Material', 'Dimensions', 'Color', 'Finish'] },
  'packaging-paper': { gst: 12, keys: ['Material', 'Thickness', 'Dimensions', 'Usage'] },
  'automobile-parts': { gst: 28, keys: ['Material', 'Compatibility', 'Warranty', 'Finish'] },
  'solar-renewable': { gst: 5, keys: ['Capacity', 'Power', 'Voltage', 'Efficiency'] },
  'pipes-fittings': { gst: 18, keys: ['Material', 'Size', 'Pressure Rating', 'Usage'] }, // Ball Valve!
  'safety-security': { gst: 18, keys: ['Material', 'Certification', 'Usage', 'Warranty'] },
  'textiles-fabrics': { gst: 5, keys: ['Fabric', 'GSM', 'Width', 'Pattern'] },
  'pharma-drugs': { gst: 12, keys: ['Form', 'Packaging', 'Shelf Life', 'Dosage'] },
  'rubber-products': { gst: 18, keys: ['Material', 'Hardness', 'Thickness', 'Usage'] },
  'plastic-products': { gst: 18, keys: ['Material', 'Capacity', 'Color', 'Usage'] },
  'gems-jewellery': { gst: 3, keys: ['Material', 'Purity', 'Weight', 'Polish'] },
  'printing-stationery': { gst: 12, keys: ['Material', 'Size', 'Color', 'GSM'] },
  'oil-gas': { gst: 18, keys: ['Grade', 'Density', 'Packaging', 'Flash Point'] },
  'metals-steel': { gst: 18, keys: ['Grade', 'Thickness', 'Length', 'Finish'] },
  'water-treatment': { gst: 18, keys: ['Capacity', 'Technology', 'Flow Rate', 'Material'] },
  'hvac-refrigeration': { gst: 28, keys: ['Capacity', 'Power', 'Refrigerant', 'Warranty'] },
  'lab-instruments': { gst: 18, keys: ['Accuracy', 'Material', 'Range', 'Warranty'] },
  'leather-products': { gst: 28, keys: ['Leather Type', 'Color', 'Finish', 'Size'] },
  'sports-fitness': { gst: 18, keys: ['Material', 'Weight', 'Size', 'Usage'] },
  'gifts-handicrafts': { gst: 12, keys: ['Material', 'Finish', 'Design', 'Size'] },
  'telecom-equipment': { gst: 18, keys: ['Range', 'Frequency', 'Power', 'Port'] },
  'mining-minerals': { gst: 5, keys: ['Grade', 'Purity', 'Form', 'Hardness'] },
  'timber-wood': { gst: 18, keys: ['Wood Type', 'Thickness', 'Grade', 'Moisture'] },
  'power-generation': { gst: 18, keys: ['Capacity', 'Fuel Type', 'Phase', 'Voltage'] },
  'ayurvedic-herbal': { gst: 5, keys: ['Ingredients', 'Form', 'Shelf Life', 'Packaging'] },
  'glass-ceramics': { gst: 18, keys: ['Thickness', 'Type', 'Usage', 'Finish'] },
  'logistics-handling': { gst: 18, keys: ['Capacity', 'Material', 'Wheels', 'Dimensions'] },
  'marine-ship': { gst: 18, keys: ['Material', 'Grade', 'Capacity', 'Certification'] },
  'waste-recycling': { gst: 18, keys: ['Material', 'Capacity', 'Usage', 'Color'] }, // Dustbin!
  'cosmetics-personal': { gst: 18, keys: ['Form', 'Skin Type', 'Shelf Life', 'Packaging'] },
  'education-training': { gst: 18, keys: ['Material', 'Type', 'Usage', 'Language'] },
};

const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const LOCATIONS = ['Mumbai, MH', 'Pune, MH', 'Delhi, DL', 'Faridabad, HR', 'Bengaluru, KA', 'Chennai, TN', 'Surat, GJ', 'Ahmedabad, GJ', 'Kolkata, WB', 'Ludhiana, PB'];

async function main() {
  const { data: products, error: prodErr } = await supabase.from('products').select('id, title, technical_specifications, sector_id');
  const { data: sectors, error: secErr } = await supabase.from('industry_sectors').select('id, slug');

  if (prodErr || secErr) return console.error("Fetch error:", prodErr || secErr);

  const sectorSlugMap = {};
  sectors.forEach(s => sectorSlugMap[s.id] = s.slug);

  let updated = 0;
  for (const product of products) {
    const slug = sectorSlugMap[product.sector_id];
    const config = SECTOR_CONFIG[slug] || { gst: 18, keys: ['Material', 'Usage', 'Grade', 'Packaging'] }; // safe fallback

    let newSpecs = {};
    config.keys.forEach(k => {
      const options = SPECS[k] || ['Standard', 'Custom'];
      newSpecs[k] = getRandom(options);
    });

    newSpecs['Origin Location'] = getRandom(LOCATIONS);
    newSpecs['GST Rate'] = `${config.gst}%`;
    newSpecs['Minimum Order Quantity'] = 'As per listing';
    newSpecs['Dispatch Time'] = getRandom(['2-3 Days', '1 Week', '10 Days', 'Immediate']);

    const { error: updateErr } = await supabase
      .from('products')
      .update({ technical_specifications: newSpecs })
      .eq('id', product.id);

    if (!updateErr) updated++;
  }

  console.log(`Successfully enriched ${updated}/${products.length} products with accurate specifications!`);
}

main();
