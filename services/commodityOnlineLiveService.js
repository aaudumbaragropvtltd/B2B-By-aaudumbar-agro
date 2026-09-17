// ============================================================================
// COMMODITYONLINE LIVE SCRAPER & MANDI INTELLIGENCE SERVICE
// ============================================================================
// Direct live scraper & caching engine for https://www.commodityonline.com/mandiprices
// Provides access to:
// - All 498+ commodities listed on CommodityOnline
// - Dynamic state lists per commodity
// - Dynamic APMC Mandi, market, and village lists per state
// - Live Mandi price tables (Min, Max, Modal price, Arrival Date, Variety, District)
// ============================================================================

import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Memory cache with TTL
const cache = new Map();
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes cache for live rates

// Path to pre-extracted commodities catalog
const CATALOG_PATH = path.join(process.cwd(), 'data', 'commodityonline_catalog.json');

/**
 * Execute curl to fetch CommodityOnline pages or AJAX endpoints
 */
export function fetchFromCommodityOnline(url, isAjax = false) {
  const args = [
    '-s',
    '--max-time', '10',
    '-A', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    '-H', 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
  ];
  if (isAjax) {
    args.push('-H', 'X-Requested-With: XMLHttpRequest');
  }
  args.push(url);

  try {
    return execFileSync('curl.exe', args, { encoding: 'utf-8', timeout: 12000 });
  } catch (err) {
    console.warn(`[CommodityOnline] Fetch warning for ${url}:`, err.message);
    return null;
  }
}

/**
 * Load all 498 commodities
 */
export function getAllCommodities() {
  try {
    if (fs.existsSync(CATALOG_PATH)) {
      const data = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf-8'));
      if (data.commodities && Array.isArray(data.commodities)) {
        return data.commodities;
      }
    }
  } catch (e) {
    console.warn('[CommodityOnline] Error reading catalog file:', e.message);
  }

  // Fallback core staples if file is unreadable
  return [
    { slug: 'turmeric', name: 'Turmeric (Haldi)' },
    { slug: 'chilli-red', name: 'Red Chilli (Mirchi)' },
    { slug: 'cummin-seedjeera', name: 'Cumin Seeds (Jeera)' },
    { slug: 'coriander-leaves', name: 'Coriander (Dhania)' },
    { slug: 'soyabean', name: 'Soyabean' },
    { slug: 'mustard', name: 'Mustard Seeds (Sarson)' },
    { slug: 'black-pepper', name: 'Black Pepper' },
    { slug: 'cardamoms', name: 'Cardamom' },
    { slug: 'wheat', name: 'Wheat' },
    { slug: 'paddy-basmati', name: 'Basmati Rice (Paddy)' },
    { slug: 'onion', name: 'Onion' },
    { slug: 'garlic', name: 'Garlic' },
    { slug: 'cotton', name: 'Cotton (Kapas)' },
    { slug: 'bengal-gramgramwhole', name: 'Chana (Bengal Gram)' },
    { slug: 'groundnut', name: 'Groundnut (Peanut)' },
    { slug: 'maize', name: 'Maize (Corn)' }
  ];
}

/**
 * Fetch states where a commodity is traded
 */
export function getStatesForCommodity(commoditySlug) {
  if (!commoditySlug || commoditySlug === 'all') {
    return [
      { slug: 'all', name: 'All States' },
      { slug: 'maharashtra', name: 'Maharashtra' },
      { slug: 'gujarat', name: 'Gujarat' },
      { slug: 'rajasthan', name: 'Rajasthan' },
      { slug: 'madhya-pradesh', name: 'Madhya Pradesh' },
      { slug: 'andhra-pradesh', name: 'Andhra Pradesh' },
      { slug: 'telangana', name: 'Telangana' },
      { slug: 'karnataka', name: 'Karnataka' },
      { slug: 'tamil-nadu', name: 'Tamil Nadu' },
      { slug: 'uttar-pradesh', name: 'Uttar Pradesh' },
      { slug: 'punjab', name: 'Punjab' },
      { slug: 'haryana', name: 'Haryana' },
      { slug: 'bihar', name: 'Bihar' },
      { slug: 'west-bengal', name: 'West Bengal' },
      { slug: 'kerala', name: 'Kerala' },
      { slug: 'odisha', name: 'Odisha' }
    ];
  }

  const cacheKey = `states_${commoditySlug}`;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  const url = `https://www.commodityonline.com/mandiprices?commodity=${encodeURIComponent(commoditySlug)}`;
  const html = fetchFromCommodityOnline(url, true);

  if (html) {
    const stateMatches = [...html.matchAll(/<option[^>]*value=["']([^"']*)["'][^>]*>([^<]+)<\/option>/gi)]
      .filter(m => m[1])
      .map(m => ({ slug: m[1], name: m[2].trim() }));

    if (stateMatches.length > 0) {
      cache.set(cacheKey, stateMatches);
      return stateMatches;
    }
  }

  return [
    { slug: 'all', name: 'All States' },
    { slug: 'maharashtra', name: 'Maharashtra' },
    { slug: 'gujarat', name: 'Gujarat' },
    { slug: 'madhya-pradesh', name: 'Madhya Pradesh' },
    { slug: 'telangana', name: 'Telangana' },
    { slug: 'andhra-pradesh', name: 'Andhra Pradesh' }
  ];
}

/**
 * Fetch markets/mandis/villages for a commodity and state
 */
export function getMarketsForCommodityAndState(commoditySlug, stateSlug) {
  if (!commoditySlug || !stateSlug || stateSlug === 'all') {
    return [{ slug: 'all', name: 'All Markets' }];
  }

  const cacheKey = `markets_${commoditySlug}_${stateSlug}`;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  const url = `https://www.commodityonline.com/mandiprices?commodity=${encodeURIComponent(commoditySlug)}&state=${encodeURIComponent(stateSlug)}`;
  const html = fetchFromCommodityOnline(url, true);

  if (html) {
    const marketMatches = [...html.matchAll(/<option[^>]*value=["']([^"']*)["'][^>]*>([^<]+)<\/option>/gi)]
      .filter(m => m[1])
      .map(m => ({ slug: m[1], name: m[2].trim() }));

    if (marketMatches.length > 0) {
      cache.set(cacheKey, marketMatches);
      return marketMatches;
    }
  }

  return [{ slug: 'all', name: 'All Markets' }];
}

/**
 * Parse Mandi HTML table rows into clean structured data
 */
function parseMandiTables(html, fallbackCommodity = '', fallbackState = '') {
  const records = [];
  if (!html) return records;

  const tableMatches = [...html.matchAll(/<table[^>]*>([\s\S]*?)<\/table>/gi)];

  for (const table of tableMatches) {
    const rows = [...table[1].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
    if (rows.length < 2) continue;

    const headers = [...rows[0][1].matchAll(/<(?:td|th)[^>]*>([\s\S]*?)<\/(?:td|th)>/gi)]
      .map(c => c[1].replace(/<[^>]+>/g, '').trim().toLowerCase().replace(/\s+/g, ' '));

    const isFullTable = headers.some(h => h.includes('commodity')) && headers.some(h => h.includes('market') || h.includes('avg price'));
    const isMarketTable = headers.some(h => h.includes('market')) && headers.some(h => h.includes('price'));

    if (isFullTable) {
      for (let r = 1; r < rows.length; r++) {
        const cells = [...rows[r][1].matchAll(/<(?:td|th)[^>]*>([\s\S]*?)<\/(?:td|th)>/gi)]
          .map(c => c[1].replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' '));

        if (cells.length >= 8) {
          const commodity = cells[0] || fallbackCommodity || 'Agri Commodity';
          const arrivalDate = cells[1] || 'Today';
          const variety = cells[2] || 'Standard';
          const state = cells[3] || fallbackState || '';
          const district = cells[4] || '';
          const market = cells[5] || '';
          const minStr = cells[6] || '';
          const maxStr = cells[7] || '';
          const modalStr = cells[8] || cells[7] || cells[6] || '';

          const extractNum = (str) => {
            const m = str.replace(/,/g, '').match(/\d+(\.\d+)?/);
            return m ? parseFloat(m[0]) : 0;
          };

          const minPrice = extractNum(minStr);
          const maxPrice = extractNum(maxStr);
          const modalPrice = extractNum(modalStr);
          const pricePerKg = modalPrice > 0 ? parseFloat((modalPrice / 100).toFixed(2)) : 0;

          records.push({
            commodity,
            arrivalDate,
            variety,
            state,
            district,
            market,
            minPrice,
            maxPrice,
            modalPrice,
            pricePerKg,
            unit: 'Quintal',
            rawMinPrice: minStr,
            rawMaxPrice: maxStr,
            rawModalPrice: modalStr
          });
        }
      }
      if (records.length > 0) break;
    } else if (isMarketTable && records.length === 0) {
      for (let r = 1; r < rows.length; r++) {
        const cells = [...rows[r][1].matchAll(/<(?:td|th)[^>]*>([\s\S]*?)<\/(?:td|th)>/gi)]
          .map(c => c[1].replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' '));

        if (cells.length >= 3) {
          const market = cells[0];
          const variety = cells[1] || 'Standard';
          const priceText = cells[2] || '';
          const dateText = cells[3] || 'Today';

          // Extract prices from formats like: ₹157.1/Kg (₹151.2-₹163) or Rs 15500
          const matchPerKg = priceText.match(/₹\s*(\d+(?:\.\d+)?)\/Kg/i);
          const matchRange = priceText.match(/₹\s*(\d+(?:\.\d+)?)\s*-\s*₹\s*(\d+(?:\.\d+)?)/i);

          let pricePerKg = matchPerKg ? parseFloat(matchPerKg[1]) : 0;
          let minPrice = 0;
          let maxPrice = 0;
          let modalPrice = 0;

          if (matchRange) {
            minPrice = Math.round(parseFloat(matchRange[1]) * 100);
            maxPrice = Math.round(parseFloat(matchRange[2]) * 100);
          }

          if (pricePerKg > 0) {
            modalPrice = Math.round(pricePerKg * 100);
            if (!minPrice) minPrice = modalPrice;
            if (!maxPrice) maxPrice = modalPrice;
          } else {
            const num = priceText.replace(/,/g, '').match(/\d+(\.\d+)?/);
            modalPrice = num ? parseFloat(num[0]) : 0;
            pricePerKg = parseFloat((modalPrice / 100).toFixed(2));
            minPrice = modalPrice;
            maxPrice = modalPrice;
          }

          const formatCap = (s) => s ? s.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : '';

          records.push({
            commodity: formatCap(fallbackCommodity) || 'Commodity',
            arrivalDate: dateText,
            variety,
            state: formatCap(fallbackState) || '',
            district: '',
            market,
            minPrice,
            maxPrice,
            modalPrice,
            pricePerKg,
            unit: 'Quintal',
            rawMinPrice: `₹${minPrice.toLocaleString('en-IN')}`,
            rawMaxPrice: `₹${maxPrice.toLocaleString('en-IN')}`,
            rawModalPrice: `₹${modalPrice.toLocaleString('en-IN')}`
          });
        }
      }
    }
  }

  return records;
}

/**
 * Fetch live Mandi rates for a commodity, state, and market
 */
export async function getLiveRates({ commodity = 'all', state = 'all', market = 'all', refresh = false }) {
  const cacheKey = `rates_${commodity}_${state}_${market}`;
  if (!refresh && cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }
  }

  let targetUrl = 'https://www.commodityonline.com/mandiprices';
  if (commodity && commodity !== 'all') {
    if (state && state !== 'all') {
      if (market && market !== 'all') {
        targetUrl = `https://www.commodityonline.com/mandiprices/${encodeURIComponent(commodity)}/${encodeURIComponent(state)}/${encodeURIComponent(market)}`;
      } else {
        targetUrl = `https://www.commodityonline.com/mandiprices/${encodeURIComponent(commodity)}/${encodeURIComponent(state)}`;
      }
    } else {
      targetUrl = `https://www.commodityonline.com/mandiprices/${encodeURIComponent(commodity)}`;
    }
  }

  const html = fetchFromCommodityOnline(targetUrl, false);
  let parsedRecords = parseMandiTables(html, commodity, state);

  // If parsed records are empty (e.g. market has no arrivals today), fallback to commodity level
  if (parsedRecords.length === 0 && (state !== 'all' || market !== 'all')) {
    const fallbackUrl = `https://www.commodityonline.com/mandiprices/${encodeURIComponent(commodity)}`;
    const fallbackHtml = fetchFromCommodityOnline(fallbackUrl, false);
    parsedRecords = parseMandiTables(fallbackHtml, commodity, '');
  }

  // If still empty, fetch the root mandi prices page
  if (parsedRecords.length === 0) {
    const homeHtml = fetchFromCommodityOnline('https://www.commodityonline.com/mandiprices', false);
    parsedRecords = parseMandiTables(homeHtml, '', '');
  }

  const result = {
    source: 'CommodityOnline & APMC Agmarknet',
    sourceUrl: targetUrl,
    totalRecords: parsedRecords.length,
    commodity,
    state,
    market,
    lastUpdated: new Date().toISOString(),
    records: parsedRecords
  };

  cache.set(cacheKey, { timestamp: Date.now(), data: result });
  return result;
}
