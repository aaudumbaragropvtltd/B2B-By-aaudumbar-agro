// ============================================================================
// B2B INDIA — OFFICIAL GST SLABS & COMMODITY TAX BRACKETS
// ============================================================================
// Standard Official GST Slabs & Special Rates in India:
// 1. 0%  (Nil-Rated / Exempt)
// 2. 0.25% (Special Rate — Rough Precious & Semi-Precious Stones)
// 3. 3%  (Special Rate — Gold, Silver, Bullion & Precious Jewellery)
// 4. 5%  (Lower / Merit Slab)
// 5. 18% (Standard Slab — Default)
// 6. 40% (Luxury & Sin Tax Slab)
// Note: Older 12% & 28% tiers are merged into the 5% and 18% slabs.
// ============================================================================

export const GST_SLABS = [
  {
    rate: 0,
    shortLabel: '0% (Nil-Rated / Exempt)',
    name: 'Nil-Rated / Exempt (0%)',
    category: 'Basic Essentials & Agri',
    description: 'Fresh fruits, vegetables, milk, bread, salt, life-saving medicines, seeds & healthcare',
    fullLabel: '0% — Nil-Rated / Exempt (Fresh Produce, Grains, Milk, Essential Foods)',
    badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  {
    rate: 0.25,
    shortLabel: '0.25% (Special Rate)',
    name: 'Special Rate: Rough Stones (0.25%)',
    category: 'Gems & Stones',
    description: 'Rough precious and semi-precious cut/uncut stones',
    fullLabel: '0.25% — Special Rate: Rough Precious & Semi-Precious Stones',
    badgeColor: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  },
  {
    rate: 3,
    shortLabel: '3% (Precious Metals)',
    name: 'Special Rate: Gold & Jewellery (3%)',
    category: 'Bullion & Jewellery',
    description: 'Gold, silver, platinum, bullion, and precious metal jewellery',
    fullLabel: '3% — Special Rate: Gold, Silver, Bullion & Precious Jewellery',
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  {
    rate: 5,
    shortLabel: '5% (Lower / Merit Slab)',
    name: 'Lower / Merit Slab (5%)',
    category: 'Household Necessities & Spices',
    description: 'Household necessities, packaged foods, edible oils, spices, agricultural tools & textiles',
    fullLabel: '5% — Lower / Merit Slab (Household Necessities, Packaged Foods, Edible Oils, Agri Tools)',
    badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
  },
  {
    rate: 18,
    shortLabel: '18% (Standard Slab)',
    name: 'Standard Slab (18% — Default)',
    category: 'Industrial & Consumer Goods',
    description: 'Default rate for industrial raw materials, machinery, chemicals, electronics & commercial goods',
    fullLabel: '18% — Standard Slab (Default: Industrial Commodities, Machinery, Chemicals, Electronics)',
    badgeColor: 'bg-purple-50 text-purple-800 border-purple-200',
  },
  {
    rate: 40,
    shortLabel: '40% (Luxury & Sin Tax)',
    name: 'Luxury & Sin Tax Slab (40%)',
    category: 'Luxury & Demerit Goods',
    description: 'High-end luxury equipment, premium commercial vehicles, tobacco products & aerated beverages',
    fullLabel: '40% — Luxury & Sin Tax Slab (High-End Luxury Goods, Premium Equipment, Tobacco, Aerated Drinks)',
    badgeColor: 'bg-rose-50 text-rose-800 border-rose-200',
  },
];

/**
 * Returns the matching GST slab object or fallback to 18% standard slab.
 */
export function getGstSlabByRate(rate) {
  const numRate = Number(rate);
  const found = GST_SLABS.find(s => s.rate === numRate);
  if (found) return found;

  // Fallbacks for older 12% or 28% values merged into standard/merit
  if (numRate === 12) return GST_SLABS.find(s => s.rate === 5) || GST_SLABS[3];
  if (numRate === 28) return GST_SLABS.find(s => s.rate === 18) || GST_SLABS[4];

  return GST_SLABS.find(s => s.rate === 18) || GST_SLABS[4];
}

/**
 * Formats GST display string e.g. "18% GST (Standard)"
 */
export function formatGstDisplay(rate) {
  const slab = getGstSlabByRate(rate);
  return slab ? `${slab.rate}% GST (${slab.shortLabel})` : `${rate}% GST`;
}
