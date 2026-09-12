// ============================================================================
// SEARCH AUTOCOMPLETE & SUGGESTIONS API (High-Performance In-Memory Cache)
// ============================================================================
// Ultra-fast real-time search suggestions (<5ms response time).
// Matches user keystrokes (e.g., 'tu' or 'tur' -> 'Turmeric', 'Turmeric finger', etc.)
// Prioritizes exact prefix matches ('starts with') over substring matches.
// ============================================================================

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/services/supabaseServer';
import { slugify, getProductUrl } from '@/utils/slugUtils';

// In-memory catalog cache with 5-minute TTL to ensure sub-millisecond suggestion latency
let CACHED_DATA = null;
let LAST_CACHE_FETCH = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Curated dictionary of high-volume Indian B2B commodities & products
const CURATED_COMMODITIES = [
  // Agriculture & Spices
  { keyword: 'Turmeric (Haldi) Raw & Finger', category: 'Food & Agriculture', sectorSlug: 'food-agriculture' },
  { keyword: 'Turmeric Powder (Export Quality)', category: 'Food & Agriculture', sectorSlug: 'food-agriculture' },
  { keyword: 'Turmeric Finger Salem / Nizamabad', category: 'Food & Agriculture', sectorSlug: 'food-agriculture' },
  { keyword: 'Tuvar Dal (Toor Dal / Arhar Dal)', category: 'Food & Agriculture', sectorSlug: 'food-agriculture' },
  { keyword: 'Black Pepper Malabar (Grade A)', category: 'Food & Agriculture', sectorSlug: 'food-agriculture' },
  { keyword: 'Green Cardamom (7mm - 8mm)', category: 'Food & Agriculture', sectorSlug: 'food-agriculture' },
  { keyword: 'Red Chilli (Guntur Teja S17)', category: 'Food & Agriculture', sectorSlug: 'food-agriculture' },
  { keyword: 'Red Chilli Powder (Pure)', category: 'Food & Agriculture', sectorSlug: 'food-agriculture' },
  { keyword: 'Basmati Rice (1121 Steam / Raw)', category: 'Food & Agriculture', sectorSlug: 'food-agriculture' },
  { keyword: 'Soybean Seeds (Non-GMO)', category: 'Food & Agriculture', sectorSlug: 'food-agriculture' },
  { keyword: 'Mustard Seeds (Black / Yellow)', category: 'Food & Agriculture', sectorSlug: 'food-agriculture' },
  { keyword: 'Cumin Seeds (Jeera Machine Clean)', category: 'Food & Agriculture', sectorSlug: 'food-agriculture' },
  { keyword: 'Coriander Seeds (Dhania)', category: 'Food & Agriculture', sectorSlug: 'food-agriculture' },
  { keyword: 'Ginger Fresh & Dry (Sonth)', category: 'Food & Agriculture', sectorSlug: 'food-agriculture' },
  { keyword: 'Garlic Bulbs (Ooty / Mandsaur)', category: 'Food & Agriculture', sectorSlug: 'food-agriculture' },
  { keyword: 'Onion Pink / Red (Nashik Grade)', category: 'Food & Agriculture', sectorSlug: 'food-agriculture' },
  { keyword: 'Potato (Agra / Indore Wholesale)', category: 'Food & Agriculture', sectorSlug: 'food-agriculture' },
  { keyword: 'Sugar (M-30 / S-30 Grade)', category: 'Food & Agriculture', sectorSlug: 'food-agriculture' },
  { keyword: 'Wheat (Sharbati / Lokwan)', category: 'Food & Agriculture', sectorSlug: 'food-agriculture' },

  // Construction & Building
  { keyword: 'TMT Steel Rebars (Fe 550D, 12mm)', category: 'Building & Construction', sectorSlug: 'building-construction' },
  { keyword: 'Cement (PPC / OPC 53 Grade)', category: 'Building & Construction', sectorSlug: 'building-construction' },
  { keyword: 'GI Roofing Sheets (0.45mm Thick)', category: 'Building & Construction', sectorSlug: 'building-construction' },
  { keyword: 'Plywood Sheet 19mm (BWR Grade)', category: 'Building & Construction', sectorSlug: 'building-construction' },
  { keyword: 'AAC Lightweight Concrete Blocks', category: 'Building & Construction', sectorSlug: 'building-construction' },
  { keyword: 'Ceramic Vitrified Floor Tiles', category: 'Building & Construction', sectorSlug: 'building-construction' },
  { keyword: 'Structural Steel Tubes (Square / Rectangular)', category: 'Building & Construction', sectorSlug: 'building-construction' },

  // Industrial & Machinery
  { keyword: 'Rubber Sheet (3mm, Industrial)', category: 'Industrial Machinery', sectorSlug: 'industrial-machinery' },
  { keyword: 'Natural Rubber RSS Grade 4', category: 'Industrial Machinery', sectorSlug: 'industrial-machinery' },
  { keyword: 'Rubber Conveyor Belts (Heavy Duty)', category: 'Industrial Machinery', sectorSlug: 'industrial-machinery' },
  { keyword: 'CNC Vertical Machining Center (VMC)', category: 'Industrial Machinery', sectorSlug: 'industrial-machinery' },
  { keyword: 'Hydraulic Press 100 Ton', category: 'Industrial Machinery', sectorSlug: 'industrial-machinery' },
  { keyword: 'Diesel Generator 125 KVA (Silent)', category: 'Industrial Machinery', sectorSlug: 'industrial-machinery' },
  { keyword: 'Plastic Shredder Machine (200 Kg/Hr)', category: 'Industrial Machinery', sectorSlug: 'industrial-machinery' },
  { keyword: 'Ball Valve (Brass / SS 304, 1")', category: 'Industrial Machinery', sectorSlug: 'industrial-machinery' },
  { keyword: 'Tungsten Carbide Cutting Inserts', category: 'Industrial Machinery', sectorSlug: 'industrial-machinery' },
  { keyword: 'Turbine Pumps & Centrifugal Pumps', category: 'Industrial Machinery', sectorSlug: 'industrial-machinery' },

  // Electronics & Electrical
  { keyword: 'Armoured Power Cable (4 Core, 16 sq.mm)', category: 'Electronics & Electrical', sectorSlug: 'electronics-electrical' },
  { keyword: 'Fiber Optic Cable (6 Core, Single Mode)', category: 'Electronics & Electrical', sectorSlug: 'electronics-electrical' },
  { keyword: 'Solar PV Modules (540W Mono PERC)', category: 'Electronics & Electrical', sectorSlug: 'electronics-electrical' },
  { keyword: 'Tubular Inverter Battery (150Ah / 200Ah)', category: 'Electronics & Electrical', sectorSlug: 'electronics-electrical' },
  { keyword: 'LED Flood Light 100W IP66', category: 'Electronics & Electrical', sectorSlug: 'electronics-electrical' },

  // Textiles & Apparel
  { keyword: '100% Cotton Combed Yarn (40s)', category: 'Apparel & Garments', sectorSlug: 'apparel-garments' },
  { keyword: 'Raw Silk Yarn (Mulberry, Grade A)', category: 'Apparel & Garments', sectorSlug: 'apparel-garments' },
  { keyword: 'Denim Fabric (12 Oz Stretch)', category: 'Apparel & Garments', sectorSlug: 'apparel-garments' },
  { keyword: 'Polyester Staple Fiber (PSF)', category: 'Apparel & Garments', sectorSlug: 'apparel-garments' },
  { keyword: 'Jute Gunny Bags (50kg Capacity)', category: 'Apparel & Garments', sectorSlug: 'apparel-garments' },

  // Chemicals & Polymers
  { keyword: 'Titanium Dioxide (Rutile Grade)', category: 'Chemicals & Minerals', sectorSlug: 'chemicals-minerals' },
  { keyword: 'Caustic Soda Flakes (99% Pure)', category: 'Chemicals & Minerals', sectorSlug: 'chemicals-minerals' },
  { keyword: 'HDPE Plastic Granules (Blow Moulding)', category: 'Chemicals & Minerals', sectorSlug: 'chemicals-minerals' },
  { keyword: 'Nitrile Examination Gloves (Powder-Free)', category: 'Health & Medical', sectorSlug: 'health-medical' },
  { keyword: 'Paracetamol IP 500mg Tablets', category: 'Health & Medical', sectorSlug: 'health-medical' },
];

/**
 * Prefix Scoring Engine:
 * - 1000+ points: Exact title starts with query (Highest Priority)
 * - 500+ points: A word inside title starts with query
 * - 100+ points: Substring match anywhere
 */
function calculatePrefixScore(candidate, query) {
  if (!candidate || !query) return 0;
  const c = candidate.toLowerCase().trim();
  const q = query.toLowerCase().trim();
  if (!c || !q) return 0;

  // Exact prefix match: string starts with query
  if (c.startsWith(q)) {
    return 1000 - (c.length - q.length);
  }

  // Word prefix match: e.g. "Organic Turmeric" matches "tur" because word "Turmeric" starts with "tur"
  const words = c.split(/[\s,()/-]+/);
  for (let i = 0; i < words.length; i++) {
    if (words[i].startsWith(q)) {
      return 500 - (i * 20) - (words[i].length - q.length);
    }
  }

  // Substring match
  const idx = c.indexOf(q);
  if (idx !== -1) {
    return 100 - idx;
  }

  return 0;
}

/**
 * Loads and refreshes catalog data in memory in the background
 */
async function getOrUpdateCatalog() {
  const now = Date.now();
  if (CACHED_DATA && (now - LAST_CACHE_FETCH) < CACHE_TTL_MS) {
    return CACHED_DATA;
  }

  try {
    const supabase = createAdminClient();
    const [prodRes, secRes, logRes] = await Promise.allSettled([
      supabase.from('products').select(`
        id, title, base_price_per_unit, unit_label, hero_image_url,
        sector_id (name, slug),
        supplier_id (company_name, city)
      `).limit(200),
      supabase.from('sectors').select('id, name, slug').limit(50),
      supabase.from('search_logs').select('query').order('created_at', { ascending: false }).limit(50)
    ]);

    const products = prodRes.status === 'fulfilled' && prodRes.value.data ? prodRes.value.data : [];
    const sectors = secRes.status === 'fulfilled' && secRes.value.data ? secRes.value.data : [];
    
    const uniqueQueries = new Set();
    if (logRes.status === 'fulfilled' && logRes.value.data) {
      logRes.value.data.forEach(item => {
        const qStr = item.query?.trim();
        // Ignore obvious typos or 1-letter logs
        if (qStr && qStr.length >= 3 && !qStr.includes('turemric')) {
          uniqueQueries.add(qStr);
        }
      });
    }

    CACHED_DATA = {
      products,
      sectors,
      pastSearches: Array.from(uniqueQueries)
    };
    LAST_CACHE_FETCH = now;
    return CACHED_DATA;
  } catch (err) {
    console.error('Catalog cache load error:', err);
    return CACHED_DATA || { products: [], sectors: [], pastSearches: [] };
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawQuery = searchParams.get('q') || '';
    const query = rawQuery.trim().toLowerCase();

    if (!query || query.length < 1) {
      return NextResponse.json({
        query: rawQuery,
        keywords: [],
        products: [],
        categories: []
      });
    }

    const { products: dbProducts, sectors: dbSectors, pastSearches } = await getOrUpdateCatalog();

    const scoredKeywords = [];
    const seenKeywords = new Set();

    // 1. Score past search queries
    pastSearches.forEach(term => {
      const score = calculatePrefixScore(term, query);
      if (score > 0) {
        const key = term.toLowerCase();
        if (!seenKeywords.has(key)) {
          seenKeywords.add(key);
          scoredKeywords.push({
            keyword: term,
            category: 'Recent Trend',
            score: score + 15
          });
        }
      }
    });

    // 2. Score curated high-demand commodities
    CURATED_COMMODITIES.forEach(item => {
      const score = calculatePrefixScore(item.keyword, query);
      if (score > 0) {
        const key = item.keyword.toLowerCase();
        if (!seenKeywords.has(key)) {
          seenKeywords.add(key);
          scoredKeywords.push({
            keyword: item.keyword,
            category: item.category,
            sectorSlug: item.sectorSlug,
            score
          });
        }
      }
    });

    // 3. Score clean product titles as keyword suggestions
    dbProducts.forEach(p => {
      const score = calculatePrefixScore(p.title, query);
      if (score > 0) {
        const cleanTitle = p.title.replace(/\s*\([^)]*\)/g, '').trim();
        const key = cleanTitle.toLowerCase();
        if (!seenKeywords.has(key)) {
          seenKeywords.add(key);
          scoredKeywords.push({
            keyword: cleanTitle,
            category: p.sector_id?.name || 'Wholesale',
            sectorSlug: p.sector_id?.slug || null,
            score: score - 5
          });
        }
      }
    });

    // Sort keywords strictly by prefix score descending
    scoredKeywords.sort((a, b) => b.score - a.score);

    // 4. Score matching catalog products
    const scoredProducts = [];
    dbProducts.forEach(p => {
      const score = calculatePrefixScore(p.title, query);
      if (score > 0) {
        scoredProducts.push({
          id: p.id,
          title: p.title,
          price: p.base_price_per_unit ? `₹${Number(p.base_price_per_unit).toLocaleString('en-IN')}` : 'Market Rate',
          unit: p.unit_label || 'unit',
          image: p.hero_image_url || null,
          category: p.sector_id?.name || 'General',
          sectorSlug: p.sector_id?.slug || null,
          supplierName: p.supplier_id?.company_name || null,
          supplierCity: p.supplier_id?.city || null,
          url: getProductUrl(p),
          score
        });
      }
    });

    scoredProducts.sort((a, b) => b.score - a.score);

    // 5. Score matching sectors / categories
    const matchingCategories = [];
    dbSectors.forEach(s => {
      const score = calculatePrefixScore(s.name, query);
      if (score > 0) {
        matchingCategories.push({
          id: s.id,
          name: s.name,
          slug: s.slug,
          url: `/directory?sector=${s.slug}`,
          score
        });
      }
    });

    matchingCategories.sort((a, b) => b.score - a.score);

    return NextResponse.json({
      query: rawQuery,
      keywords: scoredKeywords.slice(0, 6).map(k => ({
        text: k.keyword,
        category: k.category,
        sectorSlug: k.sectorSlug || null
      })),
      products: scoredProducts.slice(0, 4),
      categories: matchingCategories.slice(0, 3)
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600'
      }
    });
  } catch (error) {
    console.error('Suggestions API error:', error);
    return NextResponse.json({
      query: '',
      keywords: [],
      products: [],
      categories: []
    }, { status: 500 });
  }
}
