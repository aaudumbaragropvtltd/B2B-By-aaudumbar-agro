"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Script from 'next/script';
import PostPaymentFlow from '@/components/PostPaymentFlow';
import DualPaymentModal from '@/components/DualPaymentModal';
import FavoriteButton from '@/components/FavoriteButton';
import { getProductGstRate } from '@/utils/gstUtils';

// Agriculture/Commodity sectors that get logistics calculator
const LOGISTICS_ELIGIBLE_SECTORS = ['agriculture', 'food-beverage', 'food_beverage'];
const LOGISTICS_RATE_PER_KG = 2.3; // ₹2.3 per kg

export default function QuotationDock({ product }) {
  const router = useRouter();
  const sectorSlug = product.sector_id?.slug || '';
  const isLogisticsEligible = LOGISTICS_ELIGIBLE_SECTORS.includes(sectorSlug);
  const moq = Number(product.bulk_minimum_order) || 1;
  const unitLabel = product.unit_label || 'units';

  const [quantity, setQuantity] = useState(product.bulk_minimum_order || 1);
  const [weight, setWeight] = useState(product.unit_label === 'kg' ? (product.bulk_minimum_order || 1) : '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState(null);
  
  // New state for inline email feature
  const [buyerEmail, setBuyerEmail] = useState('');
  const [showEmailInput, setShowEmailInput] = useState(false);

  // New state for dual payment modal (Google Pay / UPI QR vs Razorpay)
  const [showDualPaymentModal, setShowDualPaymentModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentData, setPaymentData] = useState(null); // Payment result
  const [paymentOrderId, setPaymentOrderId] = useState(null);

  // Ensure body scroll is always restored when mounting or closing modals
  React.useEffect(() => {
    if (typeof document !== 'undefined') {
      if (!showDualPaymentModal && !showPaymentModal) {
        document.body.style.overflow = 'auto';
        document.documentElement.style.overflow = 'auto';
      }
    }
    return () => {
      if (typeof document !== 'undefined') {
        document.body.style.overflow = 'auto';
        document.documentElement.style.overflow = 'auto';
      }
    };
  }, [showDualPaymentModal, showPaymentModal]);

  // Extract custom GST and Location from enriched specifications
  let specs = {};
  const rawSpecs = product.specifications || product.technical_specifications;
  if (rawSpecs) {
    if (typeof rawSpecs === 'string') {
      try { specs = JSON.parse(rawSpecs); } catch (e) {}
    } else {
      specs = rawSpecs;
    }
  }
  
  // Accurately resolve product GST percentage (e.g. 0% for grains/rice, 5% for spices/oil/yarn, 18% for machinery)
  const gstInfo = getProductGstRate(product);
  const gstRate = gstInfo.rateDecimal;
  const gstRateStr = `${gstInfo.percentage}%`;
  const originLocation = specs['Origin Location'] || product.supplier_id?.city || 'India';

  // Numeric parsed quantity
  const numQuantity = parseFloat(quantity) || 0;
  const isBelowMoq = quantity !== '' && numQuantity > 0 && numQuantity < moq;
  const isBlankQty = quantity === '' || numQuantity <= 0;

  const subtotal = numQuantity * (Number(product.base_price_per_unit) || 0);
  const gst = subtotal * gstRate;
  
  // Logistics cost: ₹2.3 per kg (only for agriculture/food sectors)
  const numWeight = isLogisticsEligible ? (parseFloat(weight) || (product.unit_label === 'kg' ? numQuantity : 0)) : 0;
  const logisticsCost = isLogisticsEligible && numWeight > 0 ? numWeight * LOGISTICS_RATE_PER_KG : 0;
  
  // Total all-inclusive order value for buyer (Commission is taken from supplier base)
  const total = subtotal + gst + logisticsCost;

  // Get supplier email — fallback to a B2B India contact
  const supplierEmail = product.supplier_id?.registered_email || 'quotations@b2bindia.site';
  const supplierName = specs['Supplier Name'] || product.supplier_id?.company_name || 'Verified Supplier';

  const validateOrderQuantity = () => {
    if (isBlankQty || numQuantity < moq) {
      setError(`Minimum order quantity for ${product.title} is ${moq.toLocaleString('en-IN')} ${unitLabel}. Please enter ${moq.toLocaleString('en-IN')} or above to proceed.`);
      return false;
    }
    return true;
  };

  const handleEmailQuotation = async () => {
    if (!validateOrderQuantity()) return;

    if (isLogisticsEligible && (!weight || isNaN(weight) || parseFloat(weight) <= 0)) {
      setError('Please provide the total weight in kg.');
      return;
    }
    
    // First step: show the email input
    if (!showEmailInput) {
      setShowEmailInput(true);
      setError(null);
      return;
    }

    // Second step: validate email and send
    if (!buyerEmail || !buyerEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        buyerEmail,
        product,
        quantity: numQuantity,
        weight: numWeight,
        subtotal,
        gst,
        logisticsCost,
        total,
        supplierName,
        originLocation
      };

      const res = await fetch('/api/quotation/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send quotation');
      }

      setEmailSent(true);
      setShowEmailInput(false);
      setBuyerEmail('');
      setTimeout(() => setEmailSent(false), 5000);
      
    } catch (err) {
      setError(err.message || 'Failed to send quotation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBuyNowClick = () => {
    if (!validateOrderQuantity()) return;
    setError(null);
    const checkoutUrl = `/checkout?productId=${encodeURIComponent(product.id || product.slug)}&quantity=${encodeURIComponent(numQuantity)}${buyerEmail ? `&email=${encodeURIComponent(buyerEmail)}` : ''}`;
    router.push(checkoutUrl);
  };

  const setPresetQuantity = (val) => {
    setQuantity(val);
    if (product.unit_label === 'kg') setWeight(val);
    if (val >= moq) setError(null);
  };

  const addPresetQuantity = (increment) => {
    const nextVal = (numQuantity || 0) + increment;
    setQuantity(nextVal);
    if (product.unit_label === 'kg') setWeight(nextVal);
    if (nextVal >= moq) setError(null);
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:sticky lg:top-24">
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="rounded-2xl bg-white border border-border-subtle p-4 sm:p-6 card-glow"
      >
        {/* Price Display & Favorite Toggle */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 animate-counter-glow">
              ₹{Number(product.base_price_per_unit).toLocaleString('en-IN')}
            </span>
            <span className="text-gray-400 ml-1">/{unitLabel}</span>
          </motion.div>

          <FavoriteButton product={product} size="default" />
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 mb-4 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <span>Min. Order (MOQ):</span>
          <span className="font-bold text-slate-800">{moq.toLocaleString('en-IN')} {unitLabel}</span>
        </div>

        <div className="space-y-4 mb-6">
          {/* Quantity */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-semibold text-gray-800">
                Order Quantity ({unitLabel})
              </label>
              {numQuantity > 0 && (
                <span className="text-xs text-brand-600 font-bold">
                  {numQuantity.toLocaleString('en-IN')} {unitLabel}
                </span>
              )}
            </div>

            <div className="relative">
              <input
                suppressHydrationWarning
                type="number"
                inputMode="numeric"
                value={quantity}
                onChange={(e) => {
                  const val = e.target.value;
                  setQuantity(val);
                  if (product.unit_label === 'kg') setWeight(val);
                  if (val && parseFloat(val) >= moq) {
                    setError(null);
                  }
                }}
                onBlur={() => {
                  if (!quantity || parseFloat(quantity) <= 0) {
                    setQuantity(moq);
                    if (product.unit_label === 'kg') setWeight(moq);
                    setError(null);
                  }
                }}
                min={1}
                placeholder={`e.g. 20000 or ${moq}`}
                className={`w-full px-4 py-2.5 rounded-xl bg-gray-50 border text-gray-900 text-sm font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all ${
                  isBelowMoq ? 'border-amber-400 bg-amber-50/40 text-amber-900' : 'border-gray-200'
                }`}
              />
              {quantity && (
                <button
                  suppressHydrationWarning
                  type="button"
                  onClick={() => {
                    setQuantity('');
                    if (product.unit_label === 'kg') setWeight('');
                  }}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-gray-400 hover:text-gray-600"
                  title="Clear quantity"
                >
                  ✕ Clear
                </button>
              )}
            </div>

            {/* Real-time MOQ Alert */}
            {isBelowMoq && (
              <div className="mt-2 p-2 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-800 text-xs flex items-start gap-1.5">
                <span className="text-sm flex-shrink-0">⚠️</span>
                <div>
                  <span className="font-bold">Below Minimum Order:</span> Minimum order quantity is <strong>{moq.toLocaleString('en-IN')} {unitLabel}</strong>. You can type any number above {moq.toLocaleString('en-IN')}.
                </div>
              </div>
            )}

            {/* Quick Quantity Presets */}
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-gray-400 font-medium mr-1">Quick:</span>
              <button
                suppressHydrationWarning
                type="button"
                onClick={() => setPresetQuantity(moq)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
                  numQuantity === moq
                    ? 'bg-brand-50 border-brand-300 text-brand-700'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                MOQ ({moq >= 1000 ? `${moq / 1000}k` : moq})
              </button>
              <button
                suppressHydrationWarning
                type="button"
                onClick={() => addPresetQuantity(5000)}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                +5,000
              </button>
              <button
                suppressHydrationWarning
                type="button"
                onClick={() => addPresetQuantity(10000)}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                +10,000
              </button>
              <button
                suppressHydrationWarning
                type="button"
                onClick={() => setPresetQuantity(20000)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
                  numQuantity === 20000
                    ? 'bg-brand-50 border-brand-300 text-brand-700'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                20,000 {unitLabel}
              </button>
              <button
                suppressHydrationWarning
                type="button"
                onClick={() => setPresetQuantity(200000)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
                  numQuantity === 200000
                    ? 'bg-brand-50 border-brand-300 text-brand-700'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                2,00,000 {unitLabel}
              </button>
            </div>
          </motion.div>

          {/* Weight — ONLY for agriculture/food sectors */}
          {isLogisticsEligible && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                Total Weight (kg)
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                  🌾 Agri-Commodity Rate
                </span>
              </label>
              <input
                suppressHydrationWarning
                type="number"
                inputMode="numeric"
                step="any"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="e.g. 20000"
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-sm font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:ring-2 focus:ring-brand-500 outline-none transition-all"
              />
              {/* Logistics Rate Info */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-2 p-3 rounded-xl bg-emerald-50 border border-emerald-100"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-lg">🚚</span>
                  <span className="text-xs font-bold text-emerald-800">Agriculture Logistics Calculator</span>
                </div>
                <div className="text-xs text-emerald-700">
                  Rate: <span className="font-bold">₹2.3 - 4 / kg (Location Dependent)</span>
                  {weight && !isNaN(weight) && parseFloat(weight) > 0 && (
                    <span className="ml-2">
                      = <span className="font-extrabold text-emerald-900">
                        ₹{(parseFloat(weight) * LOGISTICS_RATE_PER_KG).toLocaleString('en-IN')}
                      </span> (base estimate)
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-emerald-600 mt-1">
                  ₹2.3 / kg - 4 / kg depending upon location for agriculture & commodity goods
                </p>
              </motion.div>
            </motion.div>
          )}
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-xs font-medium border border-red-100"
          >
            {error}
          </motion.div>
        )}

        {/* Email sent confirmation */}
        {emailSent && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 rounded-lg bg-green-50 text-green-700 text-xs font-medium border border-green-100 flex items-center gap-2"
          >
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Quotation sent successfully! Please check your inbox.
          </motion.div>
        )}

        {/* Estimated Subtotal */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="space-y-2 mb-6 text-sm text-gray-500"
        >
          <div className="flex justify-between">
            <span>Product Subtotal</span>
            <span className="font-medium text-gray-900">₹{subtotal.toLocaleString('en-IN')}</span>
          </div>
          {isLogisticsEligible && weight && parseFloat(weight) > 0 && (
            <div className="flex justify-between">
              <span>Logistics ({parseFloat(weight).toLocaleString('en-IN')} kg)</span>
              <span className="font-medium text-brand-600">₹{logisticsCost.toLocaleString('en-IN')}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>GST ({gstRateStr})</span>
            <span className="font-medium text-gray-900">₹{gst.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between border-t border-gray-100 pt-2">
            <span className="font-bold text-gray-900">Estimated Total</span>
            <span className="font-extrabold text-gray-900">₹{total.toLocaleString('en-IN')}</span>
          </div>
          {!isLogisticsEligible && (
            <p className="text-[10px] italic text-gray-400">Logistics arranged separately for non-commodity sectors. Contact us for freight quotes.</p>
          )}
        </motion.div>

        {/* CTA — Email Quotation */}
        {showEmailInput ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-3"
          >
            <input
              suppressHydrationWarning
              type="email"
              value={buyerEmail}
              onChange={(e) => setBuyerEmail(e.target.value)}
              placeholder="Enter your email address"
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-sm focus:ring-2 focus:ring-brand-500 outline-none transition-all"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                suppressHydrationWarning
                onClick={() => setShowEmailInput(false)}
                className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                suppressHydrationWarning
                onClick={handleEmailQuotation}
                disabled={isSubmitting}
                className="flex-[2] py-3 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 text-white font-semibold shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 transition-all text-sm disabled:opacity-70 flex justify-center items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </>
                ) : (
                  'Send Quotation'
                )}
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="flex gap-2 w-full">
            <motion.button
              suppressHydrationWarning
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleEmailQuotation}
              className="flex-1 py-3.5 rounded-xl bg-gray-100 text-gray-800 font-semibold hover:bg-gray-200 transition-all text-sm flex justify-center items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Quote
            </motion.button>
            <motion.button
              suppressHydrationWarning
              whileHover={!paymentProcessing ? { scale: 1.02 } : {}}
              whileTap={!paymentProcessing ? { scale: 0.98 } : {}}
              onClick={handleBuyNowClick}
              disabled={paymentProcessing}
              className={`flex-[1.5] py-3.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 text-white font-semibold shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 transition-all text-sm flex justify-center items-center gap-2 btn-premium ${paymentProcessing ? 'opacity-70 cursor-wait' : ''}`}
            >
              {paymentProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  Buy Now
                </>
              )}
            </motion.button>
          </div>
        )}
        <div className="text-center mt-3 text-xs text-gray-600 bg-gray-100 p-2 rounded-lg">
          <span className="font-bold text-gray-800">B2B India Trust Core:</span> Buyers pay a 10% advance protection lock upon order confirmation. The remaining 90% balance is payable strictly at the time of loading goods into the truck at our warehouse/godown before departure.
        </div>
      </motion.div>

      {/* Supplier Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-2xl bg-white border border-border-subtle p-4 sm:p-6 hover-lift"
      >
        <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
          Verified Supplier
        </h3>
        <div className="space-y-3 text-sm">
          <div>
            <div className="font-bold text-gray-900 text-base">{supplierName}</div>
            <div className="text-gray-500 text-xs mt-0.5 leading-relaxed">
              <span className="font-semibold text-gray-700">Origin: </span>{originLocation}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="p-3 rounded-xl bg-gray-50 text-center border border-gray-100">
              <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1">Established</div>
              <div className="font-bold text-gray-900">{specs['Year Established'] || product.supplier_id?.year_established || 'N/A'}</div>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 text-center border border-gray-100">
              <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1">Status</div>
              <div className="font-bold text-green-600 capitalize">{product.supplier_id?.status?.replace('_', ' ') || 'Active'}</div>
            </div>
          </div>

          {/* Trade Assurance Badge */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-3 p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100"
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <div>
                <div className="text-xs font-bold text-emerald-800">Trade Assurance</div>
                <div className="text-[10px] text-emerald-600">Escrow protected · On-time delivery guaranteed</div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Dual Payment Modal (Dynamic Google Pay / UPI QR vs Razorpay) */}
      {showDualPaymentModal && (
        <DualPaymentModal
          isOpen={showDualPaymentModal}
          onClose={() => setShowDualPaymentModal(false)}
          product={product}
          totalAmount={total}
          quantity={numQuantity}
          unit={unitLabel}
          supplierName={product.supplier_id?.company_name || 'Verified Supplier'}
          buyerEmail={buyerEmail}
          onPaymentSuccess={(data) => {
            setShowDualPaymentModal(false);
            setPaymentData({
              razorpay_payment_id: data.razorpayPaymentId || data.transactionId || `UPI-${data.utr}`,
              razorpay_order_id: data.razorpayOrderId,
              orderId: data.orderId,
              advanceAmount: data.advancePaid,
              paymentMethod: data.paymentMethod,
            });
            setPaymentOrderId(data.orderId);
            setShowPaymentModal(true);
          }}
        />
      )}

      {/* Payment & Logistics Modal */}
      {showPaymentModal && typeof document !== 'undefined' && (
        require('react-dom').createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPaymentModal(false)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto z-10 rounded-2xl custom-scrollbar"
            >
              <div className="sticky top-3 right-3 sm:top-4 sm:right-4 z-50 flex justify-end pr-3 sm:pr-4 pointer-events-none -mb-12">
                <button 
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="pointer-events-auto inline-flex items-center gap-2 px-4 py-2 bg-slate-900/90 hover:bg-black text-white rounded-full shadow-2xl border border-white/20 backdrop-blur-md transition-all hover:scale-105 active:scale-95 cursor-pointer text-xs font-extrabold"
                  title="Close"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Close</span>
                </button>
              </div>
              <PostPaymentFlow 
                initialPhase={paymentData ? 'success' : 2} 
                product={product}
                quantity={numQuantity}
                unit={unitLabel}
                pricePerUnit={product.base_price_per_unit}
                subtotal={subtotal}
                gst={gst}
                logisticsCost={logisticsCost}
                total={total}
                initialEmail={buyerEmail}
                paymentData={paymentData}
                orderId={paymentOrderId}
                onClose={() => {
                  setShowPaymentModal(false);
                  setPaymentData(null);
                  setPaymentOrderId(null);
                }} 
              />
            </motion.div>
          </div>,
          document.body
        )
      )}

      {/* Razorpay Checkout Script */}
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
    </div>
  );
}
