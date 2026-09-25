// ============================================================================
// B2B INDIA — DYNAMIC PLATFORM SETTINGS ENGINE
// ============================================================================
// Dual-persistence engine for live business rules, fees, GST, and guardrails.
// Reads/writes to Supabase platform_settings with resilient local JSON fallback.
// ============================================================================

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { STATIC_SECTORS } from '@/constants/sectors';
import { DEFAULT_CATEGORY_FEES } from '@/constants/categoryFees';

const SETTINGS_FILE_PATH = path.join(process.cwd(), 'data', 'platform_settings.json');

export { DEFAULT_CATEGORY_FEES };

export const DEFAULT_PLATFORM_SETTINGS = {
  default_platform_fee_percent: {
    value: 3.0,
    category: 'commercial',
    label: 'Default Wholesale Platform Fee (%)',
    description: 'Fallback platform commission fee applied when category-specific fee is not defined',
  },
  category_platform_fees: {
    value: DEFAULT_CATEGORY_FEES,
    category: 'commercial',
    label: 'Category-Wise Platform Fees (%)',
    description: 'Individual platform fee percentages for all 38 industry sectors applied across RFQs, product additions, and checkout',
  },
  high_value_threshold: {
    value: 1000000,
    category: 'commercial',
    label: 'High-Value Deal Threshold (₹)',
    description: 'Contract value threshold (₹10,00,000) at or above which flat advance rules apply',
  },
  high_value_advance_base: {
    value: 97640,
    category: 'commercial',
    label: 'High-Value Base Advance (₹)',
    description: 'Base advance locked for wholesale deals >= ₹10,00,000',
  },
  high_value_upi_fee: {
    value: 2360,
    category: 'commercial',
    label: 'High-Value UPI Platform Fee (₹)',
    description: 'Flat UPI platform surcharge (making total ₹1,00,000 for UPI checkout)',
  },
  cards_surcharge_rate_percent: {
    value: 2.5,
    category: 'commercial',
    label: 'Cards & NetBanking Surcharge (%)',
    description: 'Razorpay processing fee for Credit/Debit Cards and NetBanking',
  },
  standard_advance_percent: {
    value: 10,
    category: 'commercial',
    label: 'Standard Deal Advance Rate (%)',
    description: 'Advance percentage required for orders below ₹10,00,000',
  },
  default_gst_percent: {
    value: 18,
    category: 'tax',
    label: 'Default GST Rate (%)',
    description: 'Standard Goods & Services Tax rate applicable across general commodities',
  },
  default_min_order_qty: {
    value: 1000,
    category: 'guardrails',
    label: 'Default Minimum Order Quantity (MOQ)',
    description: 'Standard fallback minimum wholesale quantity for new product listings',
  },
  escrow_hold_hours: {
    value: 72,
    category: 'guardrails',
    label: 'Escrow Price Lock Window (Hours)',
    description: 'Duration for which supplier price and allocation is guaranteed after advance booking',
  },
  platform_maintenance_mode: {
    value: false,
    category: 'system',
    label: 'Platform Maintenance Mode',
    description: 'When enabled, displays maintenance banner to non-admin visitors',
  },
  supported_currency: {
    value: 'INR',
    category: 'system',
    label: 'Base Platform Currency',
    description: 'Primary trading currency for settlement ledgers and Razorpay gateway',
  },
  annual_plan_original_price: {
    value: 20000,
    category: 'commercial',
    label: 'Annual Plan Original / Strikethrough Price (₹)',
    description: 'Original list price shown with strikethrough (e.g. ₹20,000) on annual membership cards',
  },
  annual_plan_base_price: {
    value: 2000,
    category: 'commercial',
    label: 'Annual Plan Selling Base Price (₹)',
    description: 'Net selling base price for 12 months supplier membership before GST and gateway charges',
  },
  annual_plan_gst_percent: {
    value: 18,
    category: 'commercial',
    label: 'Annual Plan GST Rate (%)',
    description: 'Goods & Services Tax rate applied to annual membership base price (default 18%)',
  },
  annual_plan_gateway_fee_percent: {
    value: 2.5,
    category: 'commercial',
    label: 'Annual Plan Razorpay Gateway Fee (%)',
    description: 'Payment gateway surcharge percentage applied on subtotal with GST (default 2.5%)',
  }
};

function getSupabaseAdmin() {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }
  return null;
}

function readLocalSettings() {
  try {
    if (!fs.existsSync(path.dirname(SETTINGS_FILE_PATH))) {
      fs.mkdirSync(path.dirname(SETTINGS_FILE_PATH), { recursive: true });
    }
    if (fs.existsSync(SETTINGS_FILE_PATH)) {
      const data = fs.readFileSync(SETTINGS_FILE_PATH, 'utf8');
      if (data && data.trim()) {
        const parsed = JSON.parse(data);
        return { ...DEFAULT_PLATFORM_SETTINGS, ...parsed };
      }
    }
  } catch (err) {
    console.warn('Error reading local settings file:', err.message);
  }
  return DEFAULT_PLATFORM_SETTINGS;
}

function writeLocalSettings(settings) {
  try {
    if (!fs.existsSync(path.dirname(SETTINGS_FILE_PATH))) {
      fs.mkdirSync(path.dirname(SETTINGS_FILE_PATH), { recursive: true });
    }
    const tempPath = `${SETTINGS_FILE_PATH}.${Date.now()}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(settings, null, 2), 'utf8');
    fs.renameSync(tempPath, SETTINGS_FILE_PATH);
    return true;
  } catch (err) {
    try {
      fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(settings, null, 2), 'utf8');
      return true;
    } catch (writeErr) {
      console.error('Error writing local settings file:', writeErr.message);
      return false;
    }
  }
}

/**
 * Get all platform settings.
 */
export async function getAllSettings() {
  const local = readLocalSettings();
  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('platform_settings').select('*');
      if (!error && data && data.length > 0) {
        const dbSettings = { ...local };
        data.forEach((row) => {
          dbSettings[row.key] = {
            value: row.value,
            category: row.category || 'commercial',
            label: row.label || row.key,
            description: row.description || '',
            updated_at: row.updated_at,
          };
        });
        return dbSettings;
      }
    } catch (e) {
      // fallback to local
    }
  }
  return local;
}

/**
 * Get a specific setting value by key.
 */
export async function getSettingValue(key, fallback = null) {
  const all = await getAllSettings();
  if (all[key] !== undefined && all[key].value !== undefined) {
    return all[key].value;
  }
  return fallback !== null ? fallback : DEFAULT_PLATFORM_SETTINGS[key]?.value;
}

/**
 * Get category-specific fee percentage (e.g. 3.0 for food-agriculture, 5.0 for industrial-machinery).
 */
export async function getCategoryFeePercent(sectorSlug) {
  const all = await getAllSettings();
  const categoryFees = all.category_platform_fees?.value || DEFAULT_CATEGORY_FEES;
  const defaultFee = Number(all.default_platform_fee_percent?.value) || 3.0;

  if (sectorSlug && categoryFees[sectorSlug] !== undefined) {
    return Number(categoryFees[sectorSlug]);
  }
  return defaultFee;
}

const SECTOR_UUID_TO_SLUG = {
  'a38a19fe-f62f-49a1-beed-f916ce92f1b2': 'building-construction',
  'cbf4f79c-45cb-409c-806d-6ad6941952b0': 'electronics-electrical',
  '8913986b-4d55-42ce-844a-f62d078ea484': 'industrial-machinery',
  '426a727d-db22-4e7e-a43d-46e3c9d99a8a': 'apparel-garments',
  'a9cec48f-5e57-4433-b93a-c352698b0af8': 'food-agriculture',
  '3d72a92f-d341-4ce3-b123-933475e5760b': 'chemicals-dyes',
  '3bca8dbd-9ddb-4bbc-ab4f-dc2065e17faf': 'medical-healthcare',
  '1671b8c5-88cf-40f6-afe3-e57abbfadd0d': 'furniture-interiors',
  '50c15e6b-8413-4a94-aa88-10b0688afefe': 'packaging-paper',
  '6a094f9d-ffeb-400f-a7c7-21119d570b78': 'automobile-parts',
  'dec2b315-1827-4f1f-bafc-e2d8b0658ee9': 'solar-renewable',
  'ae4aacb8-7e70-4e96-898d-c46b6295724a': 'pipes-fittings',
  '8ed222a9-fb93-4483-96c8-257519d8346f': 'safety-security',
  'e2767a55-1aba-44b3-ac31-929b791272f7': 'textiles-fabrics',
  'e2e6fbcf-7260-44c0-9c72-4fd57d1dabf0': 'pharma-drugs',
  '4d23e777-2fa2-446d-9065-2f59e0746a0d': 'rubber-products',
  '434cc228-0a86-441e-b7f0-816b3ddb5923': 'plastic-products',
  'd6de8aa0-a20f-47c5-b94d-e0376906975e': 'gems-jewellery',
  'be665d7c-02bf-419a-8b1b-e4f71cc1ea86': 'printing-stationery',
  'a913c7bc-1b5b-4962-9553-bbe8dece9f9f': 'oil-gas',
  'acf9f8a2-2e03-47dd-9b65-7e83ef7c4132': 'metals-steel',
  'a48b77ac-f2ca-47ef-ac4f-540e67e17a70': 'water-treatment',
  '40229178-cb7f-4075-bc87-461de02c359a': 'hvac-refrigeration',
  'e4dd0ec1-c885-421c-8a11-631368615f42': 'lab-instruments',
  'd5f7549c-ca13-4aba-bfe4-6a26ef350afe': 'leather-products',
  '8a9aa587-7cbc-463b-89c3-e52df83b9f8b': 'sports-fitness',
  'ef88aba6-9eb0-41f7-a2fe-17d12d6f9f2d': 'gifts-handicrafts',
  'c1c8f912-2a8b-4042-97ca-5b494c3e8778': 'telecom-equipment',
  'd2f2f22a-4691-4057-9f9f-8bb2a4341a38': 'mining-minerals',
  '341774b3-ddb0-43ea-b326-d6c994bebd32': 'timber-wood',
  '77c31ce5-537c-447b-8e4d-b299210346c7': 'power-generation',
  '9d65818e-df5f-4694-8a1d-ae1428453346': 'ayurvedic-herbal',
  '7330cf5c-9fd8-4904-9b13-9256b217f9af': 'glass-ceramics',
  '7fb59b6f-e708-4638-a5af-7136bb320e20': 'logistics-handling',
  '9f52545a-a4da-4f95-9562-e3fb39b640be': 'marine-ship',
  '0f49457d-14ac-4d16-a410-ca24fc2a54ce': 'waste-recycling',
  'f9acceb9-74a9-411d-a670-a0674a1d15a8': 'cosmetics-personal',
  '63295f3a-5559-4d35-8102-b04f4686d1dd': 'education-training'
};

/**
 * Synchronize all database product prices dynamically based on category fees.
 */
export async function syncAllProductPricesWithCategoryFees(customCategoryFees = null, customDefaultFee = null) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;

  try {
    const all = await getAllSettings();
    const categoryFees = customCategoryFees || all.category_platform_fees?.value || DEFAULT_CATEGORY_FEES;
    const defaultFee = customDefaultFee !== null ? Number(customDefaultFee) : (Number(all.default_platform_fee_percent?.value) || 3.0);

    const { data: products, error } = await supabase
      .from('products')
      .select('id, title, base_price_per_unit, technical_specifications, sector_id');

    if (error || !products) return;

    for (const p of products) {
      const specs = p.technical_specifications || {};
      let rawSupplierPrice = specs.supplier_net_price;
      if (rawSupplierPrice === undefined || rawSupplierPrice === null) {
        rawSupplierPrice = Math.round((Number(p.base_price_per_unit) / 1.03) * 100) / 100;
      }
      rawSupplierPrice = Number(rawSupplierPrice);

      const sectorSlug = SECTOR_UUID_TO_SLUG[p.sector_id] || 'food-agriculture';
      const feePercent = categoryFees[sectorSlug] !== undefined ? Number(categoryFees[sectorSlug]) : defaultFee;
      const feeAmount = Math.round(rawSupplierPrice * (feePercent / 100) * 100) / 100;
      const newListedBase = Math.round((rawSupplierPrice + feeAmount) * 100) / 100;

      const updatedSpecs = {
        ...specs,
        supplier_net_price: rawSupplierPrice,
        platform_commission_percent: feePercent,
        platform_fee_per_unit: feeAmount,
      };

      await supabase
        .from('products')
        .update({
          base_price_per_unit: newListedBase,
          technical_specifications: updatedSpecs,
        })
        .eq('id', p.id);
    }
  } catch (err) {
    console.warn('Product price synchronization notice:', err.message);
  }
}

/**
 * Update multiple platform settings at once.
 */
export async function updateSettings(newSettingsMap) {
  const current = readLocalSettings();
  const updated = { ...current };

  for (const [key, val] of Object.entries(newSettingsMap)) {
    if (updated[key]) {
      updated[key] = {
        ...updated[key],
        value: val,
        updated_at: new Date().toISOString(),
      };
    } else {
      updated[key] = {
        value: val,
        category: 'custom',
        label: key,
        description: 'Custom platform setting',
        updated_at: new Date().toISOString(),
      };
    }
  }

  writeLocalSettings(updated);

  // Sync to Supabase if table is present
  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      const upserts = Object.entries(updated).map(([k, item]) => ({
        key: k,
        value: item.value,
        category: item.category,
        label: item.label,
        description: item.description,
        updated_at: new Date().toISOString(),
      }));
      await supabase.from('platform_settings').upsert(upserts);
    } catch (dbErr) {
      console.warn('DB settings sync notice:', dbErr.message);
    }
  }

  // Trigger real-time product price recalculation across all products if platform fees were updated
  if (newSettingsMap.category_platform_fees || newSettingsMap.default_platform_fee_percent !== undefined) {
    await syncAllProductPricesWithCategoryFees(
      newSettingsMap.category_platform_fees || updated.category_platform_fees?.value,
      newSettingsMap.default_platform_fee_percent || updated.default_platform_fee_percent?.value
    );
  }

  return updated;
}

/**
 * Pure calculation function for Annual Plan membership based on settings or defaults.
 */
export function calculateDynamicMembershipPricing(settingsMap = {}, paymentMethod = 'all') {
  const originalPrice = Number(settingsMap?.annual_plan_original_price?.value ?? settingsMap?.annual_plan_original_price ?? 20000);
  const baseAmount = Number(settingsMap?.annual_plan_base_price?.value ?? settingsMap?.annual_plan_base_price ?? 2000);
  const gstRate = Number(settingsMap?.annual_plan_gst_percent?.value ?? settingsMap?.annual_plan_gst_percent ?? 18);
  const gatewayFeePercent = Number(settingsMap?.annual_plan_gateway_fee_percent?.value ?? settingsMap?.annual_plan_gateway_fee_percent ?? 2.5);

  const durationDays = 365;
  const planLabel = 'Annual Plan (12 Months)';
  const activePlan = 'ANNUAL PLAN';

  // 1. GST on Base Subscription (e.g. ₹2,000 * 18% = ₹360.00)
  const gstAmount = parseFloat((baseAmount * (gstRate / 100)).toFixed(2));
  const subtotalWithGst = parseFloat((baseAmount + gstAmount).toFixed(2));

  // 2. Razorpay Gateway Fee (e.g. 2.5% on ₹2,360 = ₹59.00)
  const gatewayFee = parseFloat((subtotalWithGst * (gatewayFeePercent / 100)).toFixed(2));
  
  // 3. GST on Razorpay Fee (e.g. 18% on ₹59.00 = ₹10.62)
  const gstOnGatewayFee = parseFloat((gatewayFee * (gstRate / 100)).toFixed(2));
  const totalGatewaySurcharge = parseFloat((gatewayFee + gstOnGatewayFee).toFixed(2));

  // 4. Total Final Amount to Pay (e.g. ₹2,360 + ₹69.62 = ₹2,429.62)
  const totalPayable = parseFloat((subtotalWithGst + totalGatewaySurcharge).toFixed(2));
  const amountPaise = Math.round(totalPayable * 100);

  const discountPercent = originalPrice > baseAmount ? Math.round(((originalPrice - baseAmount) / originalPrice) * 100) : 0;
  const savingsAmount = originalPrice > baseAmount ? originalPrice - baseAmount : 0;

  return {
    plan: activePlan,
    planLabel,
    durationDays,
    paymentMethod,
    originalPrice,
    baseAmount,
    discountPercent,
    savingsAmount,
    gstRate,
    gstAmount,
    subtotalWithGst,
    gatewayFeePercent,
    gatewayFee,
    gstOnGatewayFee,
    totalGatewaySurcharge,
    totalPayable,
    amountPaise,
    formatted: {
      original: `₹${originalPrice.toLocaleString('en-IN')}`,
      base: `₹${baseAmount.toLocaleString('en-IN')}`,
      gst: `₹${gstAmount.toFixed(2)}`,
      subtotalWithGst: `₹${subtotalWithGst.toFixed(2)}`,
      gatewayFee: `₹${gatewayFee.toFixed(2)} (${gatewayFeePercent}%)`,
      gstOnGatewayFee: `₹${gstOnGatewayFee.toFixed(2)} (${gstRate}% GST on fee)`,
      totalGatewaySurcharge: `₹${totalGatewaySurcharge.toFixed(2)}`,
      totalPayable: `₹${totalPayable.toFixed(2)}`,
    }
  };
}

/**
 * Fetch current platform settings and calculate dynamic membership pricing.
 */
export async function getLiveMembershipPricing(paymentMethod = 'all') {
  const all = await getAllSettings();
  return calculateDynamicMembershipPricing(all, paymentMethod);
}

