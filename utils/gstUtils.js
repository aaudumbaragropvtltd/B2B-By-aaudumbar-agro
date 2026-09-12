// ============================================================================
// B2B INDIA — GST TAX RATE RESOLUTION UTILITY
// ============================================================================
// Accurately determines Indian GST rates (0%, 0.25%, 3%, 5%, 18%, 40%) based on:
// 1. Explicit product metadata / technical specifications
// 2. HSN (Harmonized System of Nomenclature) Code lookup
// 3. Product title & commodity classification keywords
// ============================================================================

import { GST_SLABS, getGstSlabByRate } from '../constants/gstSlabs.js';

/**
 * Determine the accurate GST rate for a given product.
 * @param {object} product - The product object
 * @returns {{ percentage: number, label: string, rateDecimal: number, category?: string }}
 */
export function getProductGstRate(product, defaultRate = 18) {
  const fallbackPercent = Number(defaultRate) || 18;
  if (!product) {
    const slab = getGstSlabByRate(fallbackPercent);
    return { percentage: fallbackPercent, label: `${fallbackPercent}% GST`, rateDecimal: fallbackPercent / 100, category: slab?.category };
  }

  // 1. Check direct specifications / metadata
  let specs = product.technical_specifications || product.specifications || {};
  if (typeof specs === 'string') {
    try { specs = JSON.parse(specs); } catch (e) { specs = {}; }
  }

  const explicitRate = specs.gst_percentage || 
                       product.gst_percentage || 
                       specs['GST Rate'] || 
                       specs['GST Rate (%)'] || 
                       specs['GST (%)'] ||
                       specs.gst_rate;

  if (explicitRate !== undefined && explicitRate !== null && explicitRate !== '') {
    const parsed = parseFloat(String(explicitRate).replace(/[^0-9.]/g, ''));
    if (!isNaN(parsed) && [0, 0.25, 3, 5, 12, 18, 28, 40].includes(parsed)) {
      const slab = getGstSlabByRate(parsed);
      const normalizedRate = slab.rate;
      return {
        percentage: normalizedRate,
        label: `${normalizedRate}% GST${normalizedRate === 0 ? ' (Nil-Rated / Exempt)' : ''}`,
        rateDecimal: normalizedRate / 100,
        category: slab.category
      };
    }
  }

  // 2. Lookup by HSN Code if available
  const hsn = String(product.hsn_code || specs['HSN Code'] || '').trim();
  if (hsn) {
    // 0% GST HSN Codes (Raw agricultural grains, fresh food, unbranded staples)
    if (/^(1006|1001|1005|0713|0709|0804|5201)/.test(hsn)) {
      return { percentage: 0, label: '0% GST (Nil-Rated / Exempt)', rateDecimal: 0, category: 'Basic Essentials & Agri' };
    }
    // 0.25% Special Rate: Rough precious stones
    if (/^(7102|7103)/.test(hsn) && /rough|uncut/i.test(product.title || '')) {
      return { percentage: 0.25, label: '0.25% GST (Rough Stones)', rateDecimal: 0.0025, category: 'Gems & Stones' };
    }
    // 3% Special Rate: Gold, Silver, Bullion & Jewellery
    if (/^(7106|7108|7113|7114)/.test(hsn)) {
      return { percentage: 3, label: '3% GST (Precious Metals)', rateDecimal: 0.03, category: 'Bullion & Jewellery' };
    }
    // 5% GST HSN Codes (Spices, edible oils, sugar, cotton yarn, fabrics, coal, fertilizers)
    if (/^(0904|0909|0910|1507|1508|1514|1701|1702|5205|5208|5402|3101|3102|2701)/.test(hsn)) {
      return { percentage: 5, label: '5% GST (Lower / Merit Slab)', rateDecimal: 0.05, category: 'Household Necessities & Spices' };
    }
    // 40% GST HSN Codes (Luxury goods, premium vehicles, tobacco, pan masala, aerated drinks)
    if (/^(2401|2402|2403|2202|8703)/.test(hsn)) {
      return { percentage: 40, label: '40% GST (Luxury & Sin Tax)', rateDecimal: 0.40, category: 'Luxury & Demerit Goods' };
    }
  }

  // 3. Lookup by Product Title & Category Keywords
  const title = (product.title || '').toLowerCase();
  const desc = (product.description || '').toLowerCase();

  // 0% GST: Raw agricultural commodities & basic food essentials
  if (
    /(\bbasmati\b|\brice\b|\bwheat\b|\bpaddy\b|\bpulses\b|\bdal\b|\braw cotton\b|\bfresh fruit\b|\balphonso\b|\bmango\b|\bvegetable\b|\braw turmeric\b|\bmilk\b|\bbread\b|\bsalt\b)/i.test(title) &&
    !/(oil|powder|cooked|fry|machine|pipe)/i.test(title)
  ) {
    return { percentage: 0, label: '0% GST (Nil-Rated / Exempt)', rateDecimal: 0, category: 'Basic Essentials & Agri' };
  }

  // 0.25% GST: Rough diamonds & uncut gemstones
  if (/(rough diamond|uncut gemstone|rough sapphire|rough emerald|rough ruby)/i.test(title)) {
    return { percentage: 0.25, label: '0.25% GST (Rough Stones)', rateDecimal: 0.0025, category: 'Gems & Stones' };
  }

  // 3% GST: Gold, Silver, Platinum & Bullion
  if (/(gold bar|silver bar|gold coin|silver coin|bullion|gold jewellery|silver jewellery|platinum)/i.test(title)) {
    return { percentage: 3, label: '3% GST (Precious Metals)', rateDecimal: 0.03, category: 'Bullion & Jewellery' };
  }

  // 5% GST: Spices, Jaggery, Edible Oils, Yarn, Fabrics, Basic Sugar, Soaps, Toothpaste
  if (
    /(chilli|turmeric powder|black pepper|cardamom|cumin|coriander|jaggery|groundnut oil|mustard oil|cotton yarn|silk yarn|denim fabric|saree|rayon|kurti|tea|coffee|sugar|soap|toothpaste|edible oil)/i.test(title)
  ) {
    return { percentage: 5, label: '5% GST (Lower / Merit Slab)', rateDecimal: 0.05, category: 'Household Necessities & Spices' };
  }

  // 40% GST: Luxury vehicles, Tobacco, Aerated Drinks, High-end luxury
  if (
    /(tobacco|cigar|cigarette|pan masala|aerated drink|luxury sports car|supercar)/i.test(title)
  ) {
    return { percentage: 40, label: '40% GST (Luxury & Sin Tax)', rateDecimal: 0.40, category: 'Luxury & Demerit Goods' };
  }

  // Default Standard 18% GST rate for standard industrial goods, machinery, chemicals, steel, electronics
  const defaultSlab = getGstSlabByRate(fallbackPercent);
  return {
    percentage: defaultSlab.rate,
    label: `${defaultSlab.rate}% GST (${defaultSlab.shortLabel})`,
    rateDecimal: defaultSlab.rate / 100,
    category: defaultSlab.category
  };
}
