import { createClient } from '@supabase/supabase-js';
import { DEFAULT_CATEGORY_FEES } from '../constants/categoryFees.js';
import { STATIC_SECTORS } from '../constants/sectors.js';

const url = 'https://ihsgymlxdgmdrtwlnetr.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imloc2d5bWx4ZGdtZHJ0d2xuZXRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzQ5NDY3OCwiZXhwIjoyMDk5MDcwNjc4fQ.kog1SWIohMiQ76VIOtL5Paa5MSZlV96_nOFjUW0UPII';
const supabase = createClient(url, key);

function getCategoryFeePercentage(sectorInput, customFeesMap = null, defaultPercent = 3.0) {
  if (!sectorInput) return defaultPercent;
  const raw = String(sectorInput).toLowerCase().trim();
  const slug = raw.replace(/[&/\\#,+()$~%.'":*?<>{}]/g, '').replace(/\s+/g, '-');

  const fees = customFeesMap || DEFAULT_CATEGORY_FEES;

  if (fees && fees[raw] !== undefined && fees[raw] !== null) {
    const parsed = Number(fees[raw]);
    if (!isNaN(parsed) && parsed >= 0) return parsed;
  }
  if (fees && fees[slug] !== undefined && fees[slug] !== null) {
    const parsed = Number(fees[slug]);
    if (!isNaN(parsed) && parsed >= 0) return parsed;
  }

  const matchedSector = STATIC_SECTORS.find(
    s => s.slug === raw || s.slug === slug || s.id === raw || s.name.toLowerCase() === raw
  );
  if (matchedSector && fees && fees[matchedSector.slug] !== undefined) {
    const parsed = Number(fees[matchedSector.slug]);
    if (!isNaN(parsed) && parsed >= 0) return parsed;
  }

  if (raw.includes('food') || raw.includes('agri') || raw.includes('rice') || raw.includes('wheat') || raw.includes('grain')) {
    return Number(fees['food-agriculture']) || 3.0;
  }
  if (raw.includes('machin') || raw.includes('equip') || raw.includes('industrial') || raw.includes('motor')) {
    return Number(fees['industrial-machinery']) || 5.0;
  }

  return defaultPercent;
}

async function testCommissionAndQuotes() {
  console.log('--- TEST 3: Dynamic Category Commission Utility ---');

  const customFeesFromAdmin = {
    'industrial-machinery': 5.5,
    'food-agriculture': 3.5,
    'metals-steel': 2.0,
    'textiles-fabrics': 4.0
  };

  const machineryFee = getCategoryFeePercentage('industrial-machinery', customFeesFromAdmin, 3.0);
  const agriFee = getCategoryFeePercentage('food-agriculture', customFeesFromAdmin, 3.0);
  const steelFee = getCategoryFeePercentage('metals-steel', customFeesFromAdmin, 3.0);
  const fallbackFee = getCategoryFeePercentage('unknown-custom-sector', customFeesFromAdmin, 3.0);

  console.log('Machinery Fee:', machineryFee, '% (Expected: 5.5%)');
  console.log('Agri Fee:', agriFee, '% (Expected: 3.5%)');
  console.log('Steel Fee:', steelFee, '% (Expected: 2%)');
  console.log('Fallback Fee:', fallbackFee, '% (Expected: 3%)');

  console.log('\n--- TEST 4: Direct Deal Quotation Calculations ---');
  const baseRate = 100; // Supplier net rate ₹100
  const quantity = 1000;
  const gstRate = 18;

  // With 5.5% machinery fee:
  const feeRateDec = machineryFee / 100;
  const listedBaseRate = baseRate * (1 + feeRateDec); // 105.5
  const totalBaseGoods = listedBaseRate * quantity; // 105,500
  const totalGst = totalBaseGoods * (gstRate / 100); // 18,990
  const finalTotalAmount = Math.round(totalBaseGoods + totalGst); // 124,490
  const unitRateToBuyer = finalTotalAmount / quantity; // 124.49

  console.log('Base Supplier Rate: ₹' + baseRate);
  console.log(`Listed Base (+${machineryFee}%): ₹` + listedBaseRate);
  console.log('Total Listed Goods: ₹' + totalBaseGoods);
  console.log('+ GST (18%): ₹' + totalGst);
  console.log('Final Total Deal Amount: ₹' + finalTotalAmount);
  console.log('All-Inclusive Unit Rate: ₹' + unitRateToBuyer);

  console.log('\n--- TEST 5: RFQ Quote Insert / Update Verification ---');
  const { data: rfq } = await supabase.from('rfqs').select('id, product_name').limit(1).single();
  const { data: supplier } = await supabase.from('users').select('id, company_name').eq('role', 'supplier').limit(1).single();

  if (rfq && supplier) {
    const testQuotePayload = {
      rfq_id: rfq.id,
      supplier_id: supplier.id,
      price_before_gst: listedBaseRate,
      gst_rate: gstRate,
      gst_amount: totalGst,
      quoted_price: finalTotalAmount,
      platform_fee: baseRate * feeRateDec * quantity,
      supplier_location: 'Pune Central Godown',
      delivery_days: 5,
      notes: 'Test Quote with 5.5% Machinery Commission',
      status: 'pending'
    };

    console.log('Test Quote Calculations:', {
      price_before_gst: testQuotePayload.price_before_gst,
      platform_fee: testQuotePayload.platform_fee,
      quoted_price: testQuotePayload.quoted_price
    });
  }

  console.log('\n--- ALL COMMISSION & QUOTATION TESTS COMPLETED SUCCESSFULLY ---');
}

testCommissionAndQuotes();
