// ============================================================================
// B2B INDIA — DYNAMIC COMMISSION & PLATFORM FEE UTILITY
// ============================================================================
// Resolves platform fee percentages across all 38 industry categories.
// ============================================================================

import { DEFAULT_CATEGORY_FEES } from '../constants/categoryFees.js';
import { STATIC_SECTORS } from '../constants/sectors.js';

/**
 * Get the platform fee percentage for a given sector slug or name (e.g. 3.0 for 3%, 5.0 for 5%).
 * @param {string} sectorInput - The sector slug, name or ID (e.g., 'food-agriculture', 'Food & Agriculture')
 * @param {object} customFeesMap - Optional dynamic category fees map from settings
 * @param {number} defaultPercent - Fallback fee percentage
 * @returns {number} Fee percentage (e.g. 3.0 or 5.0)
 */
export function getCategoryFeePercentage(sectorInput, customFeesMap = null, defaultPercent = 3.0) {
  if (!sectorInput) return defaultPercent;
  const raw = String(sectorInput).toLowerCase().trim();
  const slug = raw.replace(/[&/\\#,+()$~%.'":*?<>{}]/g, '').replace(/\s+/g, '-');

  const fees = customFeesMap || DEFAULT_CATEGORY_FEES;

  // 1. Direct slug match
  if (fees && fees[raw] !== undefined && fees[raw] !== null) {
    const parsed = Number(fees[raw]);
    if (!isNaN(parsed) && parsed >= 0) return parsed;
  }
  if (fees && fees[slug] !== undefined && fees[slug] !== null) {
    const parsed = Number(fees[slug]);
    if (!isNaN(parsed) && parsed >= 0) return parsed;
  }

  // 2. Match via STATIC_SECTORS
  const matchedSector = STATIC_SECTORS.find(
    s => s.slug === raw || s.slug === slug || s.id === raw || s.name.toLowerCase() === raw
  );
  if (matchedSector && fees && fees[matchedSector.slug] !== undefined) {
    const parsed = Number(fees[matchedSector.slug]);
    if (!isNaN(parsed) && parsed >= 0) return parsed;
  }

  // 3. Common aliases
  if (raw.includes('food') || raw.includes('agri') || raw.includes('rice') || raw.includes('wheat') || raw.includes('grain')) {
    return Number(fees['food-agriculture']) || 3.0;
  }
  if (raw.includes('textile') || raw.includes('fabric') || raw.includes('yarn') || raw.includes('garment') || raw.includes('apparel')) {
    return Number(fees['textiles-fabrics'] || fees['apparel-garments']) || 3.5;
  }
  if (raw.includes('machin') || raw.includes('equip') || raw.includes('industrial') || raw.includes('motor')) {
    return Number(fees['industrial-machinery']) || 5.0;
  }
  if (raw.includes('steel') || raw.includes('metal') || raw.includes('iron') || raw.includes('tmt')) {
    return Number(fees['metals-steel']) || 2.5;
  }
  if (raw.includes('solar') || raw.includes('renew') || raw.includes('pv') || raw.includes('inverter')) {
    return Number(fees['solar-renewable']) || 3.0;
  }
  if (raw.includes('plastic') || raw.includes('polymer') || raw.includes('hdpe') || raw.includes('pvc')) {
    return Number(fees['plastic-products']) || 3.0;
  }
  if (raw.includes('pharma') || raw.includes('drug') || raw.includes('med')) {
    return Number(fees['pharma-drugs'] || fees['medical-healthcare']) || 4.0;
  }

  return defaultPercent;
}

/**
 * Get the commission rate as a decimal (e.g. 0.03 for 3%, 0.05 for 5%).
 */
export function getCommissionRate(sectorSlug, customFeesMap = null) {
  const percent = getCategoryFeePercentage(sectorSlug, customFeesMap);
  return percent / 100;
}

/**
 * Apply category commission to a base price.
 * @param {number} basePrice - The raw supplier base price
 * @param {string} sectorSlug - The sector slug
 * @param {object} customFeesMap - Optional custom settings fees map
 * @returns {number} Price with commission applied
 */
export function applyCommission(basePrice, sectorSlug, customFeesMap = null) {
  const rate = getCommissionRate(sectorSlug, customFeesMap);
  return Math.round(Number(basePrice) * (1 + rate) * 100) / 100;
}

/**
 * Get human-readable commission label (e.g., "3%", "5%").
 */
export function getCommissionLabel(sectorSlug, customFeesMap = null) {
  const percent = getCategoryFeePercentage(sectorSlug, customFeesMap);
  return `${percent}%`;
}
