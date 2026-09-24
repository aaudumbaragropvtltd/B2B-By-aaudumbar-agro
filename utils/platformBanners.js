// ============================================================================
// B2B INDIA — DYNAMIC CMS BANNERS ENGINE
// ============================================================================
// Dual-persistence engine for homepage hero slides, promos, and sector banners.
// Reads/writes to Supabase platform_banners with local JSON fallback.
// ============================================================================

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const BANNERS_FILE_PATH = path.join(process.cwd(), 'data', 'platform_banners.json');

export function optimizeBannerImageUrl(url, width = 1000, height = null) {
  if (!url || typeof url !== 'string') return url;
  if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
    // High-compression WebP for mobile and tablet to resolve Lighthouse image delivery audit
    const format = width <= 1080 ? 'f_webp' : 'f_auto';
    const qualityParam = width <= 640 ? 'q_45' : (width <= 1080 ? 'q_50' : 'q_auto:eco');
    const sizeParam = height ? `c_fill,g_auto,w_${width},h_${height}` : `w_${width}`;
    if (url.includes('/upload/f_auto') || url.includes('/upload/f_webp') || url.includes('/upload/c_fill')) {
      return url.replace(/\/upload\/(?:f_auto|f_webp|c_fill)(?:,[^,/]+)*?\//, `/upload/${sizeParam},${format},${qualityParam}/`);
    }
    return url.replace('/upload/', `/upload/${sizeParam},${format},${qualityParam}/`);
  }
  return url;
}

export const DEFAULT_BANNERS = [
  {
    id: 'banner-1',
    title: 'India’s Verified B2B Wholesale Marketplace',
    subtitle: 'Direct ex-factory bulk procurement with 10% Advance Escrow Protection, dock inspections, and automated GST billing.',
    badge_text: '10% Advance Escrow',
    hero_image_url: 'https://res.cloudinary.com/pjsh8sfp/image/upload/f_auto,q_auto,w_1000/v1789108422/b2b-bharat/banners/1789108417666_ChatGPT_Image_Sep_11__2026__12.jpg',
    cta_text: 'Explore 38+ Wholesale Sectors',
    cta_link: '/directory',
    sector_slug: 'all',
    display_order: 1,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'banner-2',
    title: 'APMC Mandi Direct Agro & Spice Sourcing',
    subtitle: 'Connect directly with certified agricultural aggregators in Nashik, Erode, Unjha, and Guntur with daily live mandi rates.',
    badge_text: 'Live Mandi Intelligence',
    hero_image_url: 'https://res.cloudinary.com/pjsh8sfp/image/upload/f_auto,q_auto,w_1000/v1789108587/b2b-bharat/banners/1789108583730_ChatGPT_Image_Sep_11__2026__12.jpg',
    cta_text: 'View Live Mandi Rates',
    cta_link: '/market-rates',
    sector_slug: 'food-agriculture',
    display_order: 2,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'banner-3',
    title: 'Heavy Industrial & Raw Materials Exchange',
    subtitle: 'Bulk TMT steel, polymers, textile fabrics, and chemicals with verified factory lab certificates and dock logistics.',
    badge_text: 'Verified Industrial Hub',
    hero_image_url: 'https://res.cloudinary.com/pjsh8sfp/image/upload/f_auto,q_auto,w_1000/v1789108718/b2b-bharat/banners/1789108715249_ChatGPT_Image_Sep_11__2026__12.jpg',
    cta_text: 'Post Enterprise RFQ',
    cta_link: '/#rfq-form',
    sector_slug: 'metals-mining',
    display_order: 3,
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

const BANNER_CONFIG_ACTION = 'platform_banners_config';

function getSupabaseAdmin() {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }
  return null;
}

function readLocalBanners() {
  try {
    if (!fs.existsSync(path.dirname(BANNERS_FILE_PATH))) {
      fs.mkdirSync(path.dirname(BANNERS_FILE_PATH), { recursive: true });
    }
    if (fs.existsSync(BANNERS_FILE_PATH)) {
      const data = fs.readFileSync(BANNERS_FILE_PATH, 'utf8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    // Read error or read-only filesystem on serverless
  }
  // Initialize default
  writeLocalBanners(DEFAULT_BANNERS);
  return DEFAULT_BANNERS;
}

function writeLocalBanners(banners) {
  try {
    if (!fs.existsSync(path.dirname(BANNERS_FILE_PATH))) {
      fs.mkdirSync(path.dirname(BANNERS_FILE_PATH), { recursive: true });
    }
    fs.writeFileSync(BANNERS_FILE_PATH, JSON.stringify(banners, null, 2), 'utf8');
    return true;
  } catch (err) {
    // Graceful fallback for read-only serverless filesystems
    return false;
  }
}

/**
 * Load banners from Supabase (platform_banners table or activity_logs config store).
 */
async function getSupabaseBanners() {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  // 1. Try public.platform_banners table
  try {
    const { data, error } = await supabase
      .from('platform_banners')
      .select('*')
      .order('display_order', { ascending: true });
    if (!error && Array.isArray(data) && data.length > 0) {
      return data;
    }
  } catch (e) {}

  // 2. Fallback to Supabase activity_logs table (persistent store across all environments)
  try {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('details')
      .eq('action', BANNER_CONFIG_ACTION)
      .order('created_at', { ascending: false })
      .limit(1);

    if (!error && data && data.length > 0 && Array.isArray(data[0].details?.banners)) {
      return data[0].details.banners;
    }
  } catch (e) {}

  return null;
}

/**
 * Persist banners to Supabase (platform_banners table and activity_logs config store).
 */
async function saveSupabaseBanners(banners) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;

  // 1. Try public.platform_banners table if present
  try {
    const { error: pbErr } = await supabase.from('platform_banners').select('id').limit(1);
    if (!pbErr) {
      for (const b of banners) {
        await supabase.from('platform_banners').upsert([b], { onConflict: 'id' });
      }
    }
  } catch (e) {}

  // 2. Persist to activity_logs
  try {
    const { data: existing } = await supabase
      .from('activity_logs')
      .select('id')
      .eq('action', BANNER_CONFIG_ACTION)
      .order('created_at', { ascending: false });

    const payload = {
      action: BANNER_CONFIG_ACTION,
      details: { banners, updated_at: new Date().toISOString() },
      created_at: new Date().toISOString(),
    };

    if (existing && existing.length > 0) {
      await supabase
        .from('activity_logs')
        .update(payload)
        .eq('id', existing[0].id);

      if (existing.length > 1) {
        const extraIds = existing.slice(1).map((r) => r.id);
        await supabase.from('activity_logs').delete().in('id', extraIds);
      }
    } else {
      await supabase.from('activity_logs').insert([payload]);
    }
  } catch (e) {
    console.warn('Notice: banners sync to Supabase activity_logs failed:', e.message);
  }
}

/**
 * Get all active banners ordered by display_order.
 */
export async function getActiveBanners(sectorSlug = null) {
  const all = await getAllBanners();
  return all
    .filter((b) => b.is_active === true || b.is_active === 'true' || b.is_active === 1)
    .filter((b) => !sectorSlug || !b.sector_slug || b.sector_slug === 'all' || b.sector_slug === sectorSlug)
    .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
}

/**
 * Get all banners for Admin CMS.
 */
export async function getAllBanners() {
  // 1. Try Supabase first (Supabase holds the live truth across serverless instances)
  const dbBanners = await getSupabaseBanners();
  if (dbBanners && dbBanners.length > 0) {
    return dbBanners.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  }

  // 2. Fallback to local JSON file
  const local = readLocalBanners();
  return local.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
}

/**
 * Create a new banner slide.
 */
export async function createBanner(bannerData) {
  const banners = await getAllBanners();
  const newBanner = {
    id: bannerData.id || `banner-${Date.now()}`,
    title: bannerData.title || 'New Wholesale Promotion',
    subtitle: bannerData.subtitle || '',
    badge_text: bannerData.badge_text || 'Featured Deal',
    hero_image_url: bannerData.hero_image_url || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=2000&q=80',
    cta_text: bannerData.cta_text || 'Explore Deals',
    cta_link: bannerData.cta_link || '/directory',
    sector_slug: bannerData.sector_slug || 'all',
    display_order: Number(bannerData.display_order) || banners.length + 1,
    is_active: bannerData.is_active !== undefined ? Boolean(bannerData.is_active) : true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  banners.push(newBanner);
  writeLocalBanners(banners);
  await saveSupabaseBanners(banners);

  return newBanner;
}

/**
 * Update an existing banner slide.
 */
export async function updateBanner(id, bannerData) {
  const banners = await getAllBanners();
  const index = banners.findIndex((b) => b.id === id);
  if (index === -1) {
    throw new Error(`Banner with ID ${id} not found`);
  }

  const updatedBanner = {
    ...banners[index],
    ...bannerData,
    id, // Keep existing ID
    updated_at: new Date().toISOString(),
  };

  banners[index] = updatedBanner;

  writeLocalBanners(banners);
  await saveSupabaseBanners(banners);

  return updatedBanner;
}

/**
 * Delete a banner slide.
 */
export async function deleteBanner(id) {
  const banners = await getAllBanners();
  const filtered = banners.filter((b) => b.id !== id);

  writeLocalBanners(filtered);
  await saveSupabaseBanners(filtered);

  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      await supabase.from('platform_banners').delete().eq('id', id);
    } catch (e) {}
  }

  return true;
}

// ============================================================================
// CATEGORY & SECTOR HERO BANNERS ENGINE
// ============================================================================

const SECTOR_BANNERS_FILE_PATH = path.join(process.cwd(), 'data', 'sector_banners.json');

export const DEFAULT_SECTOR_HEROES = {
  'building-construction': {
    name: 'Building & Construction',
    hero_image_url: 'https://images.unsplash.com/photo-1541888087405-eb81f5f242d5?w=1600',
    subtitle: 'Source bulk cement, structural TMT steel, architectural tiles, sanitaryware, and heavy earthmoving machinery.',
    badge_text: 'Verified Construction Hub'
  },
  'electronics-electrical': {
    name: 'Electronics & Electrical',
    hero_image_url: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=1600',
    subtitle: 'Industrial grade switchgear, distribution transformers, control panels, HT/LT copper cables, and semiconductor components.',
    badge_text: 'BIS & ISO Certified'
  },
  'industrial-machinery': {
    name: 'Industrial Machinery & Equipment',
    hero_image_url: 'https://images.unsplash.com/photo-1565043666747-69f6646db940?w=1600',
    subtitle: 'CNC lathes, high-precision hydraulic presses, industrial pumps, gearboxes, and automated manufacturing lines.',
    badge_text: 'Factory Direct Sourcing'
  },
  'apparel-garments': {
    name: 'Apparel & Garments',
    hero_image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1600',
    subtitle: 'Ready-made woven garments, knitwear, institutional uniforms, and textile manufacturing from Tirupur and Surat.',
    badge_text: 'Export Quality Garments'
  },
  'food-agriculture': {
    name: 'Food & Agriculture',
    hero_image_url: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1600',
    subtitle: 'Certified APMC mandi grains, export-grade spices, organic pulses, fresh agro commodities, and cold-chain produce.',
    badge_text: 'APMC & FSSAI Certified'
  },
  'chemicals-dyes': {
    name: 'Chemicals, Dyes & Solvents',
    hero_image_url: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=1600',
    subtitle: 'Industrial solvents, organic chemical intermediates, reactive dyes, pigments, and bulk specialty formulations.',
    badge_text: 'MSDS Verified Chemicals'
  },
  'medical-healthcare': {
    name: 'Medical & Healthcare',
    hero_image_url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1600',
    subtitle: 'Hospital diagnostic equipment, sterile surgical consumables, PPE, monitoring devices, and pharmaceutical supplies.',
    badge_text: 'CDSCO & CE Approved'
  },
  'furniture-interiors': {
    name: 'Furniture & Interior Products',
    hero_image_url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1600',
    subtitle: 'Modular commercial office furniture, solid wood fit-outs, acoustic interior panels, and luxury turnkey fittings.',
    badge_text: 'Commercial Interiors'
  },
  'packaging-paper': {
    name: 'Packaging Materials & Paper',
    hero_image_url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1600',
    subtitle: 'Corrugated 3/5-ply shipping boxes, kraft liner paper, flexible barrier pouches, and biodegradable packaging solutions.',
    badge_text: 'Bulk Packaging Supply'
  },
  'automobile-parts': {
    name: 'Automobile Parts & Accessories',
    hero_image_url: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=1600',
    subtitle: 'Precision automotive forgings, friction brakes, transmission gears, EV battery packs, and commercial fleet spares.',
    badge_text: 'IATF 16949 Verified'
  },
  'solar-renewable': {
    name: 'Solar & Renewable Energy',
    hero_image_url: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=1600',
    subtitle: 'Monocrystalline solar PV modules, grid-tie central inverters, lithium energy storage systems, and rooftop structures.',
    badge_text: 'MNRE & ALMM Approved'
  },
  'pipes-fittings': {
    name: 'Pipes, Valves & Fittings',
    hero_image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1600',
    subtitle: 'Seamless carbon steel pipes, industrial ball & butterfly valves, ductile iron fittings, and HDPE conduits.',
    badge_text: 'IBR & API Certified'
  },
  'safety-security': {
    name: 'Safety & Security Equipment',
    hero_image_url: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=1600',
    subtitle: 'Industrial PPE safety shoes, fall protection harnesses, fire suppression hydrants, and IP surveillance cameras.',
    badge_text: 'OSHA & EN Certified'
  },
  'textiles-fabrics': {
    name: 'Textiles, Yarn & Fabrics',
    hero_image_url: 'https://images.unsplash.com/photo-1599643478524-fb66f70d00f6?w=1600',
    subtitle: 'Combed cotton yarn, polyester textured filament, denim fabrics, jacquard weaves, and technical industrial textiles.',
    badge_text: 'Textile Mill Direct'
  },
  'pharma-drugs': {
    name: 'Pharmaceutical & Drug Intermediates',
    hero_image_url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=1600',
    subtitle: 'Active pharmaceutical ingredients (APIs), excipients, sterile injectable vials, and regulatory drug intermediates.',
    badge_text: 'WHO-GMP Compliant'
  },
  'rubber-products': {
    name: 'Rubber & Rubber Products',
    hero_image_url: 'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?w=1600',
    subtitle: 'High-tensile industrial conveyor belts, hydraulic hoses, Viton gaskets, automotive molded seals, and silicone sheets.',
    badge_text: 'Industrial Rubber Line'
  },
  'plastic-products': {
    name: 'Plastic Products & Moulding',
    hero_image_url: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=1600',
    subtitle: 'Custom plastic injection moulding, HDPE drums, polymer masterbatches, engineering granules, and acrylic sheets.',
    badge_text: 'Polymer & Moulding Hub'
  },
  'gems-jewellery': {
    name: 'Gems, Jewellery & Precious Metals',
    hero_image_url: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1600',
    subtitle: 'Hallmarked gold & silver bullion, certified loose diamonds, precision gemstones, and casting equipment.',
    badge_text: 'BIS Hallmarked Sourcing'
  },
  'printing-stationery': {
    name: 'Printing & Stationery',
    hero_image_url: 'https://images.unsplash.com/photo-1562654501-a0ccc0fc3fb1?w=1600',
    subtitle: 'High-speed commercial offset printing, security stationery, coated art paper, and packaging print plates.',
    badge_text: 'Commercial Press Direct'
  },
  'oil-gas': {
    name: 'Oil, Gas & Petroleum Products',
    hero_image_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600',
    subtitle: 'Refined industrial lubricants, bitumen VG-30/40, furnace oils, base oils, and refinery process hydrocarbons.',
    badge_text: 'Petroleum Bulk Terminal'
  },
  'metals-steel': {
    name: 'Iron, Steel & Metal Products',
    hero_image_url: 'https://images.unsplash.com/photo-1504917595217-d4bf805b48e6?w=1600',
    subtitle: 'Hot rolled coils, cold rolled sheets, stainless steel 304/316 tubes, aluminum ingots, and brass billets.',
    badge_text: 'Primary Steel Mills'
  },
  'water-treatment': {
    name: 'Water Treatment & Purification',
    hero_image_url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1600',
    subtitle: 'Industrial reverse osmosis (RO) plants, ultrafiltration membranes, effluent treatment chemicals, and dosing pumps.',
    badge_text: 'Zero Liquid Discharge'
  },
  'hvac-refrigeration': {
    name: 'HVAC & Refrigeration',
    hero_image_url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=1600',
    subtitle: 'Central air-cooled chillers, cold storage refrigeration compressors, ducting ventilation, and cooling towers.',
    badge_text: 'Cold Chain & Climate'
  },
  'lab-instruments': {
    name: 'Laboratory & Scientific Instruments',
    hero_image_url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=1600',
    subtitle: 'Spectrophotometers, analytical laboratory balances, autoclaves, laminar flow hoods, and glassware.',
    badge_text: 'NABL Calibrated Instruments'
  },
  'leather-products': {
    name: 'Leather Products & Accessories',
    hero_image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1600',
    subtitle: 'Finished full-grain tanned leather hides, industrial safety gloves, footwear components, and leather goods.',
    badge_text: 'Tannery Direct Supply'
  },
  'sports-fitness': {
    name: 'Sports, Fitness & Outdoor',
    hero_image_url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1600',
    subtitle: 'Commercial gym fitness equipment, synthetic turf flooring, tournament balls, and outdoor athletic gear.',
    badge_text: 'Institutional Sports Hub'
  },
  'gifts-handicrafts': {
    name: 'Gift Articles & Handicrafts',
    hero_image_url: 'https://images.unsplash.com/photo-1606744824163-985d376605aa?w=1600',
    subtitle: 'Handmade brass artware, Moradabad metal crafts, corporate executive gifts, and artisan home decor.',
    badge_text: 'Indian Artisan Handicrafts'
  },
  'telecom-equipment': {
    name: 'Telecom & Communication Equipment',
    hero_image_url: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=1600',
    subtitle: 'Fiber optic cabling, 5G wireless base station transceivers, network routers, and telecom tower hardware.',
    badge_text: 'TEC Certified Telecom'
  },
  'mining-minerals': {
    name: 'Mining & Mineral Processing',
    hero_image_url: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=1600',
    subtitle: 'Industrial quartz silica, limestone powder, bentonite clay, bauxite, and heavy crushing jaw equipment.',
    badge_text: 'Minehead Direct Supply'
  },
  'timber-wood': {
    name: 'Timber, Plywood & Wood Products',
    hero_image_url: 'https://images.unsplash.com/photo-1546484396-fb3fc6f95f98?w=1600',
    subtitle: 'Marine grade BWR/BWP plywood, teak logs, MDF/HDF engineered boards, and structural timber framing.',
    badge_text: 'FSC Certified Timber'
  },
  'power-generation': {
    name: 'Power Generation & Transmission',
    hero_image_url: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=1600',
    subtitle: 'Silent diesel generator sets (DG sets), HT transmission porcelain insulators, step-down substations, and AVRs.',
    badge_text: 'Heavy Power Infrastructure'
  },
  'ayurvedic-herbal': {
    name: 'Ayurvedic & Herbal Products',
    hero_image_url: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=1600',
    subtitle: 'Standardized herbal extracts, raw botanical herbs, essential oils, and AYUSH certified contract formulations.',
    badge_text: 'AYUSH Certified Herbs'
  },
  'glass-ceramics': {
    name: 'Glass & Ceramics',
    hero_image_url: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=1600',
    subtitle: 'Architectural toughened glass, vitrified ceramic floor tiles, laboratory silica glassware, and refractory ceramics.',
    badge_text: 'Morbi Ceramic Cluster'
  },
  'logistics-handling': {
    name: 'Logistics & Material Handling',
    hero_image_url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1600',
    subtitle: 'Hydraulic pallet trucks, electric stackers, industrial dock levelers, heavy warehouse racking, and conveyors.',
    badge_text: 'Material Handling Line'
  },
  'marine-ship': {
    name: 'Marine & Ship Equipment',
    hero_image_url: 'https://images.unsplash.com/photo-1516738901171-8eb4fc13bd20?w=1600',
    subtitle: 'Marine diesel engine propulsion spares, anchor chains, navigational radars, life rafts, and deck winches.',
    badge_text: 'IMO & SOLAS Certified'
  },
  'waste-recycling': {
    name: 'Waste Management & Recycling',
    hero_image_url: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=1600',
    subtitle: 'High-speed scrap metal balers, PET bottle recycling shredders, municipal composters, and incinerators.',
    badge_text: 'CPCB Compliant Recycling'
  },
  'cosmetics-personal': {
    name: 'Cosmetics & Personal Care',
    hero_image_url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1600',
    subtitle: 'Private label cosmetic formulation bases, organic carrier oils, cosmetic containers, and personal care active ingredients.',
    badge_text: 'GMP Certified Personal Care'
  },
  'education-training': {
    name: 'Education & Training Supplies',
    hero_image_url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1600',
    subtitle: 'Interactive smart boards, institutional classroom furniture, STEM vocational laboratory trainers, and school kits.',
    badge_text: 'Institutional Education Line'
  }
};

function readLocalSectorBanners() {
  try {
    if (!fs.existsSync(path.dirname(SECTOR_BANNERS_FILE_PATH))) {
      fs.mkdirSync(path.dirname(SECTOR_BANNERS_FILE_PATH), { recursive: true });
    }
    if (fs.existsSync(SECTOR_BANNERS_FILE_PATH)) {
      const data = fs.readFileSync(SECTOR_BANNERS_FILE_PATH, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.warn('Error reading sector banners file:', err.message);
  }
  // Initialize default
  writeLocalSectorBanners(DEFAULT_SECTOR_HEROES);
  return DEFAULT_SECTOR_HEROES;
}

function writeLocalSectorBanners(bannersMap) {
  try {
    if (!fs.existsSync(path.dirname(SECTOR_BANNERS_FILE_PATH))) {
      fs.mkdirSync(path.dirname(SECTOR_BANNERS_FILE_PATH), { recursive: true });
    }
    fs.writeFileSync(SECTOR_BANNERS_FILE_PATH, JSON.stringify(bannersMap, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing sector banners file:', err.message);
    return false;
  }
}

/**
 * Get all sector hero banners for Admin CMS / Directory.
 */
export async function getAllSectorBanners() {
  const local = readLocalSectorBanners();
  const merged = { ...DEFAULT_SECTOR_HEROES, ...local };

  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('industry_sectors')
        .select('slug, name, hero_image_url, description, badge_text');
      if (!error && data && data.length > 0) {
        data.forEach(s => {
          if (s.slug) {
            merged[s.slug] = {
              ...(merged[s.slug] || {}),
              name: s.name || merged[s.slug]?.name || s.slug,
              hero_image_url: s.hero_image_url || merged[s.slug]?.hero_image_url,
              subtitle: s.description || merged[s.slug]?.subtitle,
              badge_text: s.badge_text || merged[s.slug]?.badge_text,
            };
          }
        });
      }
    } catch (e) {}
  }

  return merged;
}

/**
 * Get a specific sector hero banner info.
 */
export async function getSectorBanner(slug) {
  if (!slug) return null;
  const normalized = slug.toLowerCase().replace(/_/g, '-');
  const all = await getAllSectorBanners();
  
  if (all[normalized]) return { slug: normalized, ...all[normalized] };
  if (normalized === 'agriculture' && all['food-agriculture']) {
    return { slug: 'agriculture', ...all['food-agriculture'] };
  }
  
  return {
    slug: normalized,
    name: normalized.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    hero_image_url: DEFAULT_SECTOR_HEROES['building-construction'].hero_image_url,
    subtitle: 'Source verified bulk supplies directly from Indian manufacturers with escrow protection, factory pricing, and pan-India logistics.',
    badge_text: 'Verified Wholesale Sourcing'
  };
}

/**
 * Update a sector banner (hero_image_url, subtitle, badge_text, name).
 */
export async function updateSectorBanner(slug, data) {
  if (!slug) throw new Error('Sector slug is required');
  const normalized = slug.toLowerCase().replace(/_/g, '-');
  const local = readLocalSectorBanners();

  local[normalized] = {
    ...(DEFAULT_SECTOR_HEROES[normalized] || {}),
    ...(local[normalized] || {}),
    ...data,
    updated_at: new Date().toISOString(),
  };

  writeLocalSectorBanners(local);

  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      await supabase
        .from('industry_sectors')
        .update({
          hero_image_url: local[normalized].hero_image_url,
          description: local[normalized].subtitle || local[normalized].description,
          badge_text: local[normalized].badge_text,
        })
        .eq('slug', normalized);
    } catch (e) {}
  }

  return local[normalized];
}

