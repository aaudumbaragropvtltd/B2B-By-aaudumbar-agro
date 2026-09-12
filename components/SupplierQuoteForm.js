"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GST_SLABS } from '@/constants/gstSlabs';
import { STATIC_SECTORS } from '@/constants/sectors';
import { getCategoryFeePercentage } from '@/utils/commissionUtils';

export default function SupplierQuoteForm({ rfq, quoteToEdit = null, onClose, onSuccess }) {
  const isEditMode = !!quoteToEdit;

  // Initialize sector from quoteToEdit or RFQ or default
  const initialSector = quoteToEdit?.sector || quoteToEdit?.category || rfq?.sector || rfq?.category || rfq?.sector_slug || 'food-agriculture';
  const [selectedSector, setSelectedSector] = useState(initialSector);
  const [categoryFeesMap, setCategoryFeesMap] = useState({});
  const [defaultFee, setDefaultFee] = useState(3.0);
  const [categoryFeePercent, setCategoryFeePercent] = useState(3.0);

  // Supplier quote pricing inputs: compute clean raw supplier rate
  let computedInitialBase = '';
  if (quoteToEdit) {
    if (quoteToEdit.raw_supplier_price !== undefined && quoteToEdit.raw_supplier_price !== null && quoteToEdit.raw_supplier_price !== '') {
      computedInitialBase = String(quoteToEdit.raw_supplier_price);
    } else if (quoteToEdit.price_before_gst) {
      // If price_before_gst was stored with commission, extract the base
      const storedListed = Number(quoteToEdit.price_before_gst);
      const storedFeePercent = Number(quoteToEdit.category_fee_percent || quoteToEdit.platform_fee_percent || 3.0);
      const extractedBase = Math.round((storedListed / (1 + (storedFeePercent / 100))) * 100) / 100;
      computedInitialBase = String(extractedBase);
    }
  }

  const [priceBeforeGst, setPriceBeforeGst] = useState(computedInitialBase);
  const [supplierLocation, setSupplierLocation] = useState(quoteToEdit?.supplier_location || '');
  const [deliveryDays, setDeliveryDays] = useState(quoteToEdit?.delivery_days ? String(quoteToEdit.delivery_days) : '5');
  const [notes, setNotes] = useState(quoteToEdit?.notes || '');
  const [loading, setLoading] = useState(false);

  // Supplier contact details for notifications
  const [supplierPhone, setSupplierPhone] = useState('');
  const [supplierEmail, setSupplierEmail] = useState('');
  const [supplierGst, setSupplierGst] = useState('');

  // GST rate based on quoteToEdit, RFQ or default to 18%
  const [selectedGstRate, setSelectedGstRate] = useState(
    quoteToEdit?.gst_rate !== undefined
      ? Number(quoteToEdit.gst_rate)
      : (rfq?.gst_rate !== undefined && rfq?.gst_rate !== null ? Number(rfq.gst_rate) : 18)
  );

  const [currentUserProfile, setCurrentUserProfile] = useState(null);

  // Auto-fill from supplier profile and load dynamic category fees in background
  useEffect(() => {
    fetch('/api/dashboard/profile')
      .then(res => res.json())
      .then(data => {
        if (data?.profile) {
          setCurrentUserProfile(data.profile);
          setSupplierPhone(data.profile.corporate_phone || data.profile.phone || '');
          setSupplierEmail(data.profile.registered_email || '');
          setSupplierGst(data.profile.gst_number || '');
          
          if (!isEditMode) {
            const validLoc = data.profile.warehouse_address && data.profile.warehouse_address !== 'Pending'
              ? data.profile.warehouse_address
              : (data.profile.city && data.profile.city !== 'Pending' ? data.profile.city : '');
            
            setSupplierLocation(prev => prev && prev !== 'Pending' ? prev : validLoc);
          }
        }
      })
      .catch(err => console.warn('Could not load supplier profile in background:', err.message));

    // Fetch dynamic category platform fees from Admin Settings
    fetch('/api/settings/public')
      .then(res => res.json())
      .then(data => {
        if (data?.settings?.category_platform_fees) {
          const fees = data.settings.category_platform_fees;
          setCategoryFeesMap(fees);
          const fallbackFee = Number(data.settings.default_platform_fee_percent) || 3.0;
          setDefaultFee(fallbackFee);
          const percent = getCategoryFeePercentage(selectedSector, fees, fallbackFee);
          setCategoryFeePercent(percent);
        }
      })
      .catch(() => {});
  }, [isEditMode, selectedSector]);

  // Recalculate fee whenever selectedSector or categoryFeesMap changes
  useEffect(() => {
    if (Object.keys(categoryFeesMap).length > 0) {
      const percent = getCategoryFeePercentage(selectedSector, categoryFeesMap, defaultFee);
      setCategoryFeePercent(percent);
    }
  }, [selectedSector, categoryFeesMap, defaultFee]);

  // Commercial Calculation:
  // Step 1: Supplier Base Price (e.g. ₹173.00)
  // Step 2: Add Dynamic Category Platform Fee % to Base Price -> Listed Base Rate
  // Step 3: Apply GST on the Listed Base Value
  // Step 4: Final Total Deal Amount & Unit Price
  const quantity = Number(rfq?.quantity) || 1;
  const basePerUnit = parseFloat(priceBeforeGst) || 0;
  const feeRateDecimal = categoryFeePercent / 100;
  
  const listedBaseRatePerUnit = basePerUnit > 0 ? (basePerUnit * (1 + feeRateDecimal)) : 0;
  const totalListedBaseGoods = listedBaseRatePerUnit * quantity;
  const totalGst = totalListedBaseGoods * (selectedGstRate / 100);
  const finalTotalAmount = Math.round(totalListedBaseGoods + totalGst);
  
  const platformFeePerUnit = basePerUnit * feeRateDecimal;
  const finalUnitPrice = basePerUnit > 0 ? (finalTotalAmount / quantity) : 0;

  const currentSectorObj = STATIC_SECTORS.find(s => s.slug === selectedSector) || {
    name: selectedSector.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    slug: selectedSector
  };

  const isPoster = Boolean(
    currentUserProfile && (
      (rfq?.buyer_id && (rfq.buyer_id === currentUserProfile.id || rfq.buyer_id === currentUserProfile.firebase_uid)) ||
      (rfq?.buyer_email && currentUserProfile.registered_email && rfq.buyer_email.toLowerCase().trim() === currentUserProfile.registered_email.toLowerCase().trim()) ||
      (rfq?.buyer_phone && (rfq.buyer_phone === currentUserProfile.corporate_phone || rfq.buyer_phone === currentUserProfile.phone_number || rfq.buyer_phone === currentUserProfile.phone))
    )
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isPoster) {
      alert("You cannot submit a quotation for your own RFQ requirement.");
      return;
    }
    if (!priceBeforeGst || !supplierLocation) return;
    
    setLoading(true);
    try {
      const endpoint = `/api/rfq/${rfq.id}/quotes`;
      const method = isEditMode ? 'PUT' : 'POST';
      const payload = {
        ...(isEditMode ? { quoteId: quoteToEdit.id } : {}),
        priceBeforeGst: listedBaseRatePerUnit, // Listed base rate with category fee added
        rawSupplierPrice: basePerUnit,
        gstRate: selectedGstRate,
        gstAmount: totalGst,
        quotedPrice: finalTotalAmount,
        platformFee: platformFeePerUnit * quantity,
        categoryFeePercent,
        sector: selectedSector,
        category: selectedSector,
        supplierLocation,
        deliveryDays: parseInt(deliveryDays, 10),
        notes,
        supplierPhone,
        supplierEmail,
        supplierGst
      };

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        let errText = isEditMode ? 'Failed to update quote' : 'Failed to submit quote';
        try {
          const errData = await response.json();
          errText = errData.error || errText;
        } catch {
          errText = (await response.text()) || errText;
        }
        throw new Error(errText);
      }

      onSuccess();
    } catch (err) {
      alert(err.message || 'Error saving quotation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 my-auto"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-slate-900 text-white">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full uppercase tracking-wider mb-1">
              Direct Deal Negotiation
            </div>
            <h2 className="text-xl font-bold">
              {isEditMode ? '✏️ Edit Submitted Quotation' : 'Submit Quotation'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
              Provide your best price for {rfq.title || rfq.product_name || 'RFQ Requirement'}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-2 rounded-full hover:bg-slate-800 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-7 space-y-5 max-h-[82vh] overflow-y-auto">
          {/* Warning banner if current user is the RFQ poster */}
          {isPoster && (
            <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl text-rose-950 text-xs flex items-start gap-3 shadow-sm">
              <span className="text-2xl flex-shrink-0">🚫</span>
              <div>
                <h4 className="font-black text-rose-950 text-sm">Self-Quotation Restricted</h4>
                <p className="mt-0.5 text-rose-800 font-semibold leading-relaxed">
                  You are the buyer who posted this RFQ requirement. Buyers cannot submit quotations on their own inquiries. Only verified third-party suppliers can quote on your requirement.
                </p>
              </div>
            </div>
          )}

          {/* Buyer & Requirement Intelligence Card */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <span>🏢</span> Buyer & Procurement Intelligence
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                ✓ Verified Buyer
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Buyer Company & Name</span>
                <div className="font-extrabold text-slate-900 text-sm mt-0.5 flex items-center gap-1">
                  <span>👤</span>
                  <span>{rfq.buyer_company || rfq.buyer_name || rfq.users?.company_name || rfq.users?.full_name || 'Enterprise Procurement Buyer'}</span>
                </div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                  ✉️ {rfq.buyer_email || rfq.users?.registered_email || 'procurement@b2bindia.site'}
                </div>
                {(rfq.buyer_phone || rfq.users?.corporate_phone || rfq.users?.phone_number) && (
                  <div className="text-[11px] text-emerald-700 font-bold font-mono mt-0.5">
                    📞 {rfq.buyer_phone || rfq.users?.corporate_phone || rfq.users?.phone_number}
                  </div>
                )}
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Buyer GSTIN & Delivery Address</span>
                <div className="font-mono font-bold text-slate-900 text-xs mt-0.5">
                  GST: <strong className="text-emerald-700">{rfq.buyer_gst || rfq.users?.gst_number || '27AAECR1234F1Z5'}</strong>
                </div>
                <div className="text-slate-700 font-semibold text-xs mt-1 flex items-start gap-1">
                  <span>📍</span>
                  <span>{rfq.destination || rfq.delivery_location || rfq.delivery_address || [rfq.users?.warehouse_address, rfq.users?.city, rfq.users?.state, rfq.users?.pincode].filter(Boolean).join(', ') || 'Delivery at Godown / Pan India'}</span>
                </div>
              </div>
            </div>

            {/* Requirement Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-200/80 text-[11px]">
              <div>
                <span className="text-slate-400 block uppercase font-bold text-[10px]">Requirement</span>
                <span className="font-extrabold text-slate-900">{rfq.quantity?.toLocaleString('en-IN')} {rfq.unit || 'units'}</span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase font-bold text-[10px]">Target Price</span>
                <span className="font-extrabold text-emerald-600">
                  {rfq.target_price ? `₹${Number(rfq.target_price).toLocaleString('en-IN')} / ${rfq.unit || 'unit'}` : 'Market Open'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase font-bold text-[10px]">Buyer Tax Slab</span>
                <span className="font-extrabold text-slate-900">{rfq.gst_rate !== undefined ? rfq.gst_rate : 18}% GST</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Industry Sector / Category (Locked by RFQ Buyer) */}
            <div className="p-3.5 bg-slate-100/90 border border-slate-200 rounded-2xl flex items-center justify-between">
              <div>
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                  Industry Sector / Category (Fixed by RFQ)
                </span>
                <div className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                  <span>🏢</span>
                  <span>{currentSectorObj.name}</span>
                </div>
              </div>
              <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold">
                <span>🔒</span>
                <span>Buyer Specified</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Left Col: Inputs */}
              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Your Net Rate (₹ / {rfq.unit || 'unit'}) <span className="text-red-500 font-bold">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3.5 text-slate-400 font-bold text-base">₹</span>
                    <input 
                      type="number" 
                      required
                      step="any"
                      min="0.01"
                      placeholder="0.00"
                      value={priceBeforeGst}
                      onChange={e => setPriceBeforeGst(e.target.value)}
                      className="w-full pl-8 pr-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-bold text-base"
                    />
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Your base ex-warehouse price before platform fee & GST
                  </span>
                </div>

                {/* GST Category Selection (Supplier Override Enabled) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Applicable GST Slab <span className="text-red-500 font-bold">*</span>
                    </label>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md">
                      {selectedGstRate}% Active
                    </span>
                  </div>
                  <select
                    value={selectedGstRate}
                    onChange={(e) => setSelectedGstRate(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-semibold text-xs sm:text-sm cursor-pointer shadow-sm"
                  >
                    {GST_SLABS.map(slab => (
                      <option key={slab.rate} value={slab.rate}>
                        {slab.fullLabel}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Delivery Time (Days) */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Fulfillment & Delivery Lead Time <span className="text-red-500 font-bold">*</span>
                  </label>
                  <div className="relative">
                    <input 
                      type="number" 
                      required
                      min="1"
                      max="90"
                      placeholder="e.g. 5"
                      value={deliveryDays}
                      onChange={e => setDeliveryDays(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-sm"
                    />
                    <span className="absolute right-4 top-2.5 text-xs text-slate-400 font-semibold">Days</span>
                  </div>
                </div>

                {/* Godown Dispatch Location */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Godown / Dispatch Location <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Pune Central Godown, Maharashtra"
                    value={supplierLocation}
                    onChange={e => setSupplierLocation(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-semibold text-sm"
                  />
                </div>
              </div>

              {/* Right Col: Direct Calculation Preview */}
              <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 flex flex-col justify-between shadow-xl">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-bold text-emerald-400">Direct Deal Calculation</h3>
                    <span className="text-[10px] bg-blue-500/20 text-blue-300 font-bold px-2 py-0.5 rounded-full border border-blue-500/30">
                      {categoryFeePercent}% Platform Fee ({currentSectorObj.name})
                    </span>
                  </div>
                  
                  <div className="space-y-2.5 text-xs sm:text-sm">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                      <div>
                        <span className="text-slate-300 block">
                          Base Goods Value ({quantity.toLocaleString('en-IN')} {rfq.unit || 'units'} × ₹{basePerUnit.toFixed(2)})
                        </span>
                        <span className="text-[10px] text-slate-400">Your net payout ex-warehouse</span>
                      </div>
                      <span className="font-mono text-white font-bold">₹{Math.round(basePerUnit * quantity).toLocaleString('en-IN')}</span>
                    </div>

                    <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                      <div>
                        <span className="text-blue-300 block">
                          + Admin Platform Fee ({categoryFeePercent}%)
                        </span>
                        <span className="text-[10px] text-slate-400">Applied platform fee ({currentSectorObj.name})</span>
                      </div>
                      <span className="font-mono text-blue-400 font-bold">+ ₹{Math.round(platformFeePerUnit * quantity).toLocaleString('en-IN')}</span>
                    </div>

                    <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                      <div>
                        <span className="text-slate-300 block">+ Applicable GST ({selectedGstRate}%)</span>
                        <span className="text-[10px] text-slate-400">Calculated on listed goods value</span>
                      </div>
                      <span className="font-mono text-emerald-400 font-bold">+ ₹{Math.round(totalGst).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-700">
                  <div className="flex justify-between items-end">
                    <span className="text-slate-300 font-semibold text-xs sm:text-sm">Final Total Deal Amount</span>
                    <span className="text-2xl sm:text-3xl font-extrabold text-amber-400">₹{finalTotalAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-400 mt-1.5 pt-1.5 border-t border-slate-800">
                    <span>All-Inclusive Unit Rate to Buyer:</span>
                    <span className="font-bold text-white">₹{finalUnitPrice.toFixed(2)} / {rfq.unit || 'unit'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Additional Terms, Packaging & Notes (Optional)
              </label>
              <textarea 
                rows="2"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. Price valid for 48 hours. Export quality PP bag packaging. COA available."
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none font-medium text-sm"
              ></textarea>
            </div>

            {/* Dynamic Category Platform Commission Notice */}
            <div className="p-3.5 bg-emerald-50/90 border border-emerald-200 rounded-xl text-xs text-emerald-950 flex items-start gap-2.5 shadow-sm">
              <span className="text-base">ℹ️</span>
              <div className="leading-relaxed">
                <strong>Platform Pricing Flow:</strong> When you enter <strong>₹{basePerUnit.toFixed(2)} / {rfq.unit || 'unit'}</strong>, we apply the {categoryFeePercent}% platform fee ({currentSectorObj.name}) to your base rate (giving <strong>₹{listedBaseRatePerUnit.toFixed(2)} / {rfq.unit || 'unit'}</strong>), then apply GST ({selectedGstRate}%) to calculate the final total deal. Your net payout of <strong>₹{basePerUnit.toFixed(2)} / {rfq.unit || 'unit'}</strong> is 100% protected.
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
              <button 
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-gray-600 font-bold hover:text-gray-900 transition-colors text-sm cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={loading || !priceBeforeGst || !supplierLocation || isPoster}
                className={`px-8 py-3 font-extrabold rounded-xl transition-all shadow-lg flex items-center gap-2 text-sm ${
                  isPoster 
                    ? 'bg-slate-400 text-white cursor-not-allowed opacity-60' 
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 cursor-pointer hover:scale-[1.02] active:scale-95'
                }`}
              >
                {isPoster ? '🚫 Quotation Restricted for RFQ Poster' : loading ? (isEditMode ? 'Updating Quote...' : 'Submitting Quote...') : (isEditMode ? '✓ Update Quotation' : 'Submit Quotation to B2B India')}
                {!loading && !isPoster && (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
