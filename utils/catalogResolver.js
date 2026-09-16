// ============================================================================
// B2B INDIA — UNIFIED CATALOG RESOLVER
// ============================================================================
// Unified resolution for products, sectors, and suppliers across both
// Supabase database and static fallback catalogs.
// Supports human-readable SEO slugs (e.g. /directory/product/rubber-sheet-3mm-industrial)
// as well as direct UUID and case-insensitive keyword lookups.
// ============================================================================

import { PRODUCTS as STATIC_PRODUCTS_LIST, CATEGORIES, SUPPLIER as DEFAULT_SUPPLIER } from '../data/products.js';
import { STATIC_SECTORS } from '../constants/sectors.js';
import { DEFAULT_CATEGORY_FEES } from '../constants/categoryFees.js';
import { getCategoryFeePercentage } from './commissionUtils.js';
import { slugify, getProductSlug, getProductUrl } from './slugUtils.js';

export { slugify, getProductSlug, getProductUrl };

export const DEMO_FALLBACK_PRODUCTS = [
  {
    id: 'demo-1',
    title: 'Drip Irrigation System Kit (1 Hectare)',
    description: 'Complete drip irrigation system for 1 hectare coverage with inline drippers, main lines, sub-mains, laterals, and filtration unit. High durability UV-treated LLDPE pipes with sand and disc filtration.',
    base_price_per_unit: 46818,
    unit_label: 'kit',
    bulk_minimum_order: 10,
    quality_grade: 'Premium',
    hsn_code: '84248990',
    certifications: ['ISO 9001:2015', 'BIS IS 12786', 'CE Certified'],
    technical_specifications: {
      coverage_area: '1 hectare',
      dripper_spacing_cm: 30,
      flow_rate_lph: 4,
      pipe_material: 'LLDPE',
      filtration: 'Sand + Disc',
      pressure_rating_bar: 2.5,
    },
    hero_image_url: 'https://images.unsplash.com/photo-1592982537447-6f2a6a0c8b39?w=1200',
    gallery_image_urls: [
      'https://images.unsplash.com/photo-1592982537447-6f2a6a0c8b39?w=1200',
      'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=1200',
      'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1200',
      'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1200'
    ],
    is_stale: false,
    supplier_id: { id: 's1', company_name: 'Jain Irrigation Systems Ltd', city: 'Jalgaon', state: 'Maharashtra', geo_lat: 21.0077, geo_lng: 75.5626 },
    sector_id: { name: 'Agricultural Products, Equipment & Machines', slug: 'agriculture' }
  },
  {
    id: 'demo-2',
    title: 'Three-Phase Electric Motor 5HP',
    description: 'Industrial grade 5HP three-phase electric induction motor suitable for heavy continuous machinery, submersible pumps, conveyors, and industrial compressors.',
    base_price_per_unit: 13388,
    unit_label: 'piece',
    bulk_minimum_order: 5,
    quality_grade: 'Industrial',
    hsn_code: '85015210',
    certifications: ['ISO 9001:2015', 'CE Certified', 'BIS Approved'],
    technical_specifications: { power: '5 HP / 3.7 kW', voltage: '415V', phase: '3 Phase', speed: '1440 RPM', insulation: 'Class F' },
    hero_image_url: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=1200',
    gallery_image_urls: [
      'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=1200',
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1200',
      'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=1200'
    ],
    is_stale: false,
    supplier_id: { id: 's2', company_name: 'Bharat Motors Pvt Ltd', city: 'Pune', state: 'Maharashtra', geo_lat: 18.5204, geo_lng: 73.8567 },
    sector_id: { name: 'Electronics & Electrical Equipment', slug: 'electronics-electrical' }
  },
  {
    id: 'p2',
    title: 'Agricultural Submersible Pumping Kit (5HP)',
    description: 'High-efficiency submersible pump designed for deep borewells, agricultural irrigation, and industrial dewatering.',
    base_price_per_unit: 40055,
    unit_label: 'unit',
    bulk_minimum_order: 2,
    quality_grade: 'Industrial',
    hsn_code: '84137010',
    certifications: ['ISO 9001:2015', 'ISI Marked'],
    technical_specifications: { power: '5 HP', head: '100m', phase: '3 Phase', outlet_size: '2.5 inch' },
    hero_image_url: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=1200',
    gallery_image_urls: [
      'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=1200',
      'https://images.unsplash.com/photo-1592982537447-6f2a6a0c8b39?w=1200'
    ],
    is_stale: false,
    supplier_id: { id: 's1', company_name: 'Jain Irrigation Systems Ltd', city: 'Jalgaon', state: 'Maharashtra', geo_lat: 21.0077, geo_lng: 75.5626 },
    sector_id: { name: 'Agricultural Products, Equipment & Machines', slug: 'agriculture' }
  },
  {
    id: 'p3',
    title: 'High-Yield Hybrid Tomato Seeds (Arka Rakshak)',
    description: 'Triple disease resistant hybrid tomato seeds, suitable for long-distance transport with firm fruit firmness and high yield.',
    base_price_per_unit: 1248,
    unit_label: 'packet',
    bulk_minimum_order: 50,
    quality_grade: 'Premium',
    hsn_code: '12099140',
    certifications: ['NSSO Certified'],
    technical_specifications: { yield: '90-100 tons/hectare', duration: '140 days', resistance: 'ToLCV, BW, EB' },
    hero_image_url: 'https://images.unsplash.com/photo-1592921870789-04563d55041c?w=1200',
    gallery_image_urls: [
      'https://images.unsplash.com/photo-1592921870789-04563d55041c?w=1200',
      'https://images.unsplash.com/photo-1592982537447-6f2a6a0c8b39?w=1200'
    ],
    is_stale: false,
    supplier_id: { id: 's1', company_name: 'Jain Irrigation Systems Ltd', city: 'Jalgaon', state: 'Maharashtra', geo_lat: 21.0077, geo_lng: 75.5626 },
    sector_id: { name: 'Agricultural Products, Equipment & Machines', slug: 'agriculture' }
  },
  {
    id: 'p4',
    title: 'Premium Selvedge Denim Fabric (12oz Indigo)',
    description: 'Authentic ring-spun selvedge denim fabric, perfect for premium jeans and fashion apparel.',
    base_price_per_unit: 928,
    unit_label: 'meter',
    bulk_minimum_order: 500,
    quality_grade: 'Premium',
    hsn_code: '52094200',
    certifications: ['Oeko-Tex Standard 100', 'GOTS'],
    technical_specifications: { weight: '12 oz', width: '32 inches', material: '100% Cotton' },
    hero_image_url: 'https://images.unsplash.com/photo-1565084888279-aca607ecce0c?w=1200',
    gallery_image_urls: [
      'https://images.unsplash.com/photo-1565084888279-aca607ecce0c?w=1200',
      'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=1200'
    ],
    is_stale: false,
    supplier_id: { id: 's3', company_name: 'Arvind Mills Ltd', city: 'Ahmedabad', state: 'Gujarat', geo_lat: 23.0225, geo_lng: 72.5714 },
    sector_id: { name: 'Apparel & Fashion Accessories', slug: 'apparel-fashion' }
  },
  {
    id: 'p7',
    title: 'High-Tensile Hex Bolt Set (Grade 10.9, M10)',
    description: 'Heavy-duty hex bolts for automotive and industrial machinery with corrosion-resistant zinc trivalent plating.',
    base_price_per_unit: 155,
    unit_label: 'kg',
    bulk_minimum_order: 50,
    quality_grade: 'Automotive OEM',
    hsn_code: '73181500',
    certifications: ['ISO/TS 16949'],
    technical_specifications: { size: 'M10', grade: '10.9', finish: 'Zinc Plated' },
    hero_image_url: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=1200',
    gallery_image_urls: [
      'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=1200',
      'https://images.unsplash.com/photo-1504917595217-d4bf805b48e6?w=1200'
    ],
    is_stale: false,
    supplier_id: { id: 's4', company_name: 'Sundram Fasteners Ltd', city: 'Chennai', state: 'Tamil Nadu', geo_lat: 13.0827, geo_lng: 80.2707 },
    sector_id: { name: 'Automobile Parts & Accessories', slug: 'automobile-parts' }
  },
];

const SUPPLIER_BY_CATEGORY = {
  'building-construction': { id: '4cd41f3d-9df5-4c26-a0d2-acfee02ee9af', company_name: 'UltraTech Cement', city: 'Mumbai', state: 'Maharashtra', geo_lat: 19.076, geo_lng: 72.8777 },
  'metals-alloys': { id: 'ccbc1c96-b165-4afa-87af-fb9a82571c03', company_name: 'Tata Steel Ltd', city: 'Jamshedpur', state: 'Jharkhand', geo_lat: 22.8046, geo_lng: 86.2029 },
  'electronics-electrical': { id: '1d1fb33d-8485-4271-b201-3ff2f0690438', company_name: 'Polycab India Ltd', city: 'Mumbai', state: 'Maharashtra', geo_lat: 19.076, geo_lng: 72.8777 },
  'apparel-garments': { id: '28a27773-226e-427d-835d-7c8d5e3036a8', company_name: 'Arvind Mills Ltd', city: 'Ahmedabad', state: 'Gujarat', geo_lat: 23.0225, geo_lng: 72.5714 },
  'textiles-fabrics': { id: '28a27773-226e-427d-835d-7c8d5e3036a8', company_name: 'Arvind Mills Ltd', city: 'Ahmedabad', state: 'Gujarat', geo_lat: 23.0225, geo_lng: 72.5714 },
  'food-agriculture': { id: '114f0006-bdd3-430d-95ba-0f9df91aa7eb', company_name: 'Aaudumbar Agro', city: 'Chhatrapati Sambhajinagar', state: 'Maharashtra', geo_lat: 19.8762, geo_lng: 75.3433 },
  'grains-cereals': { id: '5b1eee7b-7aea-4926-bb15-503779e62c58', company_name: 'Himalayan Agri Exports', city: 'Karnal', state: 'Haryana', geo_lat: 29.6857, geo_lng: 76.9905 },
  'agricultural-machines': { id: '289357d9-4214-4aca-8452-5b578a812397', company_name: 'Jain Irrigation Systems Ltd', city: 'Jalgaon', state: 'Maharashtra', geo_lat: 21.0077, geo_lng: 75.5626 },
  'industrial-machinery': { id: 'bc09a874-61f8-416b-8115-d14011382a9e', company_name: 'Jyoti CNC Automation', city: 'Rajkot', state: 'Gujarat', geo_lat: 22.3039, geo_lng: 70.8022 },
  'chemicals-dyes': { id: 'bf79d26b-1e7c-4132-8a27-28886395dee0', company_name: 'Pidilite Industries', city: 'Mumbai', state: 'Maharashtra', geo_lat: 19.076, geo_lng: 72.8777 },
  'medical-healthcare': { id: '3bf5b8ca-c730-4674-a2b2-b5e9a8a2d9fe', company_name: 'Poly Medicure Ltd', city: 'Faridabad', state: 'Haryana', geo_lat: 28.4089, geo_lng: 77.3178 },
  'ayurvedic-herbal': { id: '6751b2de-2e22-45f4-bc21-561da57f5566', company_name: 'Dabur Industrial', city: 'Ghaziabad', state: 'UP', geo_lat: 28.6692, geo_lng: 77.4538 },
  'automobile-parts': { id: 'b09ec205-1e0e-45bc-9e87-62d0eb31c0e9', company_name: 'Sundram Fasteners Ltd', city: 'Chennai', state: 'Tamil Nadu', geo_lat: 13.0827, geo_lng: 80.2707 },
  'security-telecom': { id: 'fdc86fa7-5fbd-4efd-b88f-fb314514f93e', company_name: 'HCL Infosystems', city: 'Noida', state: 'UP', geo_lat: 28.5355, geo_lng: 77.3910 },
};

function resolveSupplierByProductTitle(title, category) {
  const t = (title || '').toLowerCase();
  if (t.includes('tmt') || t.includes('steel') || t.includes('gi wire') || t.includes('ms angle') || t.includes('aluminium ingot') || t.includes('metal')) {
    return SUPPLIER_BY_CATEGORY['metals-alloys'];
  }
  if (t.includes('cement') || t.includes('concrete') || t.includes('tiles') || t.includes('brick') || t.includes('aac block') || t.includes('river sand') || t.includes('plywood') || t.includes('glass sheet') || t.includes('mdf board')) {
    return SUPPLIER_BY_CATEGORY['building-construction'];
  }
  if (t.includes('cable') || t.includes('wire') || t.includes('mcb') || t.includes('transformer') || t.includes('led bulb') || t.includes('headlight') || t.includes('solar street') || t.includes('solar panel') || t.includes('solar inverter') || t.includes('split ac') || t.includes('electric motor') || t.includes('switches')) {
    return SUPPLIER_BY_CATEGORY['electronics-electrical'];
  }
  if (t.includes('glove') || t.includes('syringe') || t.includes('mask') || t.includes('blood pressure') || t.includes('oximeter') || t.includes('hospital bed') || t.includes('surgical') || t.includes('paracetamol') || t.includes('omeprazole') || t.includes('vitamin c') || t.includes('microscope') || t.includes('sanitizer')) {
    return SUPPLIER_BY_CATEGORY['medical-healthcare'];
  }
  if (t.includes('denim') || t.includes('fabric') || t.includes('cotton') || t.includes('yarn') || t.includes('saree') || t.includes('trouser') || t.includes('t-shirt') || t.includes('kurti') || t.includes('uniform') || t.includes('bed sheet') || t.includes('silk') || t.includes('leather')) {
    return SUPPLIER_BY_CATEGORY['apparel-garments'];
  }
  if (t.includes('irrigation') || t.includes('hdpe pipe') || t.includes('pvc pipe') || t.includes('cpvc pipe') || t.includes('gi pipe') || t.includes('submersible pump') || t.includes('water tank') || t.includes('drip')) {
    return SUPPLIER_BY_CATEGORY['agricultural-machines'];
  }
  if (t.includes('machine') || t.includes('lathe') || t.includes('press') || t.includes('shredder') || t.includes('milling') || t.includes('grinding') || t.includes('compressor') || t.includes('pallet truck') || t.includes('welding') || t.includes('generator') || t.includes('conveyor') || t.includes('treatment plant') || t.includes('water softener') || t.includes('ro water')) {
    return SUPPLIER_BY_CATEGORY['industrial-machinery'];
  }
  if (t.includes('resin') || t.includes('adhesive') || t.includes('bopp') || t.includes('caustic soda') || t.includes('acid') || t.includes('ipa') || t.includes('calcium carbonate') || t.includes('bentonite') || t.includes('lubricant') || t.includes('rubber') || t.includes('granules') || t.includes('dyes') || t.includes('bitumen') || t.includes('carton') || t.includes('paper cup') || t.includes('stretch wrap') || t.includes('bubble wrap') || t.includes('copier paper')) {
    return SUPPLIER_BY_CATEGORY['chemicals-dyes'];
  }
  if (t.includes('neem') || t.includes('face wash') || t.includes('ashwagandha') || t.includes('tulsi') || t.includes('aloe vera') || t.includes('hair oil') || t.includes('turmeric powder')) {
    return SUPPLIER_BY_CATEGORY['ayurvedic-herbal'];
  }
  if (t.includes('valve') || t.includes('gasket') || t.includes('tyre') || t.includes('battery') || t.includes('brake pad') || t.includes('oil filter') || t.includes('engine oil') || t.includes('safety helmet') || t.includes('safety shoes') || t.includes('fire extinguisher')) {
    return SUPPLIER_BY_CATEGORY['automobile-parts'];
  }
  if (t.includes('cctv') || t.includes('network switch') || t.includes('ups') || t.includes('whiteboard') || t.includes('epabx') || t.includes('printer') || t.includes('weighing scale') || t.includes('ph meter')) {
    return SUPPLIER_BY_CATEGORY['security-telecom'];
  }
  if (t.includes('rice') || t.includes('atta') || t.includes('wheat') || t.includes('cashew')) {
    return SUPPLIER_BY_CATEGORY['grains-cereals'];
  }

  return SUPPLIER_BY_CATEGORY[category] || SUPPLIER_BY_CATEGORY['food-agriculture'];
}

/**
 * Normalizes static products from data/products.js into full product model
 */
function normalizeStaticProduct(p) {
  const categoryObj = CATEGORIES.find(c => c.id === p.category) || { name: p.category || 'General', id: p.category };
  const resolvedSupplier = p.supplier || p.supplier_id || resolveSupplierByProductTitle(p.name || p.title, p.category);
  const heroImg = p.image || p.hero_image_url || 'https://images.unsplash.com/photo-1592982537447-6f2a6a0c8b39?w=800';
  const gallery = Array.isArray(p.gallery_image_urls) && p.gallery_image_urls.length > 0
    ? p.gallery_image_urls.slice(0, 5)
    : (Array.isArray(p.images) && p.images.length > 0 ? p.images.slice(0, 5) : [heroImg]);
  
  const rawBase = Number(p.price || p.base_price_per_unit || 100);
  const feePercent = getCategoryFeePercentage(categoryObj.id);
  const feeAmount = Math.round(rawBase * (feePercent / 100) * 100) / 100;
  const listedPrice = Math.round((rawBase + feeAmount) * 100) / 100;
  const title = p.name || p.title;

  return {
    id: p.id,
    slug: slugify(title),
    title: title,
    description: p.description || `Premium quality ${title} available for wholesale and bulk procurement on B2B India. Verified factory supply with GST invoice and escrow protection.`,
    base_price_per_unit: listedPrice,
    raw_supplier_price: rawBase,
    unit_label: p.unit || p.unit_label || 'unit',
    bulk_minimum_order: p.moq ? parseInt(p.moq) || 10 : (p.bulk_minimum_order || 10),
    quality_grade: p.badge || p.quality_grade || 'Standard',
    hero_image_url: heroImg,
    gallery_image_urls: gallery,
    is_stale: false,
    supplier_id: resolvedSupplier,
    sector_id: {
      name: categoryObj.name,
      slug: categoryObj.id || p.category,
    },
    technical_specifications: {
      'Category': categoryObj.name,
      'Verified Manufacturer': resolvedSupplier.company_name,
      'Location': `${resolvedSupplier.city}, ${resolvedSupplier.state}`,
      'Minimum Order': `${p.moq || p.bulk_minimum_order || 10} ${p.unit || p.unit_label || 'units'}`,
      'Quality Assurance': p.badge || 'Trade Assurance Verified',
      'Supply Ability': 'Pan-India Bulk Supply',
      supplier_net_price: rawBase,
      platform_commission_percent: feePercent,
      platform_fee_per_unit: feeAmount,
    }
  };
}

/**
 * Helper to match a product within an array across multiple criteria:
 * 1. Exact ID match (UUID or string ID)
 * 2. Exact slug match
 * 3. Exact case-insensitive title match
 * 4. Prefix slug match (e.g. "rubber-sheet" -> "rubber-sheet-3mm-industrial")
 * 5. Prefix title match
 * 6. Contains slug match
 */
function findProductInList(list, cleanId, targetSlug) {
  if (!Array.isArray(list) || list.length === 0) return null;

  // 1. By exact ID match
  let match = list.find((p) => String(p.id).toLowerCase() === cleanId.toLowerCase());
  if (match) return match;

  if (!targetSlug) return null;

  // 2. By exact slug match
  match = list.find((p) => slugify(p.title || p.name) === targetSlug);
  if (match) return match;

  // 3. By exact title match (case-insensitive)
  match = list.find((p) => (p.title || p.name || '').toLowerCase() === cleanId.toLowerCase());
  if (match) return match;

  // 4. By prefix slug match (e.g. "rubber-sheet" matches "rubber-sheet-3mm-industrial")
  match = list.find((p) => slugify(p.title || p.name).startsWith(targetSlug + '-'));
  if (match) return match;

  // 5. By prefix title match (e.g. "Rubber sheet" matches "Rubber Sheet (3mm, Industrial)")
  match = list.find((p) => (p.title || p.name || '').toLowerCase().startsWith(cleanId.toLowerCase()));
  if (match) return match;

  // 6. By contains slug match
  match = list.find((p) => slugify(p.title || p.name).includes(targetSlug));
  if (match) return match;

  // 7. By vernacular commodity alias match (e.g. "haldi" -> matches "Turmeric")
  const COMMODITY_ALIASES = {
    haldi: 'turmeric',
    turmeric: 'turmeric',
    jeera: 'cumin',
    cumin: 'cumin',
    mirchi: 'chilli',
    chilli: 'chilli',
    chili: 'chilli',
    elaichi: 'cardamom',
    cardamom: 'cardamom',
    chawal: 'rice',
    basmati: 'rice',
    kapas: 'cotton',
    cotton: 'cotton',
    gehu: 'wheat',
    wheat: 'wheat',
    dhania: 'coriander',
    coriander: 'coriander',
    sarson: 'mustard',
    mustard: 'mustard',
    soya: 'soybean',
    soyabean: 'soybean',
    soybean: 'soybean',
    chini: 'sugar',
    sugar: 'sugar',
    saria: 'steel',
    tmt: 'steel',
    cement: 'cement',
    solar: 'solar',
  };

  const aliasKey = COMMODITY_ALIASES[targetSlug];
  if (aliasKey) {
    match = list.find((p) => {
      const pTitle = (p.title || p.name || '').toLowerCase();
      const pSlug = slugify(p.title || p.name);
      return pTitle.includes(aliasKey) || pSlug.includes(aliasKey);
    });
    if (match) return match;
  }

  return null;
}

/**
 * Fetch a single product by ID or human-readable Slug (Supabase + Static Catalog)
 */
export async function getProductById(idOrSlug) {
  if (!idOrSlug) return null;

  let cleanId = String(idOrSlug).trim();
  try {
    cleanId = decodeURIComponent(cleanId).trim();
  } catch (e) {
    // keep raw string
  }

  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId);
  const targetSlug = slugify(cleanId);

  // 1. Try Supabase
  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      
      // If it's a valid UUID, search by exact primary key first
      if (isUUID) {
        const { data, error } = await supabase
          .from('products')
          .select(`
            *,
            supplier_id (id, company_name, city, state, warehouse_address, pincode, status, year_established, gst_number, geo_lat, geo_lng),
            sector_id (name, slug)
          `)
          .eq('id', cleanId)
          .single();
          
        if (!error && data) {
          return { ...data, slug: getProductSlug(data) };
        }
      }

      // If not UUID or UUID query had no result, fetch all active products to match by slug/title
      const { data: allDbProducts, error: dbErr } = await supabase
        .from('products')
        .select(`
          *,
          supplier_id (id, company_name, city, state, warehouse_address, pincode, status, year_established, gst_number, geo_lat, geo_lng),
          sector_id (name, slug)
        `)
        .eq('is_active', true)
        .limit(1000);

      if (!dbErr && allDbProducts && allDbProducts.length > 0) {
        const found = findProductInList(allDbProducts, cleanId, targetSlug);
        if (found) {
          return { ...found, slug: getProductSlug(found) };
        }
      }
    }
  } catch (e) {
    // Continue to fallback
  }

  // 2. Try DEMO_FALLBACK_PRODUCTS
  const demoFound = findProductInList(DEMO_FALLBACK_PRODUCTS, cleanId, targetSlug);
  if (demoFound) return { ...demoFound, slug: getProductSlug(demoFound) };

  // 3. Try STATIC_PRODUCTS_LIST from data/products.js
  const staticFound = findProductInList(STATIC_PRODUCTS_LIST, cleanId, targetSlug);
  if (staticFound) {
    const norm = normalizeStaticProduct(staticFound);
    return { ...norm, slug: getProductSlug(norm) };
  }

  // 4. Default Mock Product if ID not found
  const formattedTitle = cleanId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    id: cleanId,
    slug: targetSlug || cleanId,
    title: `Wholesale Industrial Product (${formattedTitle})`,
    description: `High-grade verified product (${formattedTitle}) available for bulk commercial procurement on B2B India. Direct manufacturer pricing and pan-India logistics.`,
    base_price_per_unit: 4500,
    unit_label: 'unit',
    bulk_minimum_order: 10,
    quality_grade: 'Premium',
    hero_image_url: 'https://images.unsplash.com/photo-1592982537447-6f2a6a0c8b39?w=800',
    gallery_image_urls: ['https://images.unsplash.com/photo-1592982537447-6f2a6a0c8b39?w=800'],
    is_stale: false,
    is_fallback_mock: true,
    supplier_id: { id: 's1', company_name: 'Aaudumbar Agro', city: 'Chhatrapati Sambhajinagar', state: 'Maharashtra', geo_lat: 19.8762, geo_lng: 75.3433 },
    sector_id: { name: 'Building & Construction', slug: 'building-construction' },
  };
}

/**
 * Fetch all available products for sitemap indexing and directory catalogs
 */
export async function getAllProducts() {
  const allProducts = [];

  // Try fetching from Supabase
  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      
      const { data, error } = await supabase
        .from('products')
        .select(`
          id, title, base_price_per_unit, unit_label, bulk_minimum_order, quality_grade, hero_image_url, updated_at,
          sector_id (name, slug),
          supplier_id (id, company_name, city, state)
        `)
        .eq('is_active', true)
        .limit(1000);

      if (!error && data && data.length > 0) {
        allProducts.push(...data.map(p => ({ ...p, slug: getProductSlug(p) })));
      }
    }
  } catch (e) {
    // Continue
  }

  // Add all static catalog products
  STATIC_PRODUCTS_LIST.forEach(p => {
    if (!allProducts.some(existing => existing.id === p.id)) {
      const norm = normalizeStaticProduct(p);
      allProducts.push({ ...norm, slug: getProductSlug(norm) });
    }
  });

  // Add demo products
  DEMO_FALLBACK_PRODUCTS.forEach(p => {
    if (!allProducts.some(existing => existing.id === p.id)) {
      allProducts.push({ ...p, slug: getProductSlug(p) });
    }
  });

  return allProducts;
}

/**
 * Get related products for internal linking and PageRank distribution
 */
export async function getRelatedProducts(currentProductId, sectorSlug, limit = 4) {
  const all = await getAllProducts();
  return all
    .filter(p => p.id !== currentProductId && (p.sector_id?.slug === sectorSlug || !sectorSlug))
    .slice(0, limit);
}

/**
 * Fetch all 38 sectors
 */
export function getAllSectors() {
  return STATIC_SECTORS;
}

