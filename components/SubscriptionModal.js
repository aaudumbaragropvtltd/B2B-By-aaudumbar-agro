// ============================================================================
// SUBSCRIPTION MODAL — POST-LOGIN / POST-SIGNUP PURCHASE PANEL
// ============================================================================
// Shows automatically after a user logs in or registers if they don't have
// an active subscription. Fully closeable. Features:
//   • Annual Plan with Razorpay checkout (UPI, Cards, NetBanking)
//   • Meta Ads promotion add-on feature highlight
//   • Animated premium design with glassmorphism aesthetics
// ============================================================================

"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Script from 'next/script';

// ── Feature set for the Annual Plan ──
const PLAN_FEATURES = [
  { icon: '📦', title: 'Unlimited Product Listings', desc: 'List all your wholesale products with full catalog visibility' },
  { icon: '🔍', title: 'Verified Supplier Badge', desc: 'Show up with a trust badge across the B2B India marketplace' },
  { icon: '📋', title: 'Instant RFQ Notifications', desc: 'Receive real-time buyer RFQs matching your categories' },
  { icon: '💬', title: 'Priority Quote Access', desc: 'Respond to buyer requests before free-tier suppliers' },
  { icon: '📊', title: 'Analytics Dashboard', desc: 'Track catalog performance, views, and inquiry rates' },
  { icon: '🔒', title: 'Escrow-Protected Deals', desc: '10%+90% milestone-based escrow on every transaction' },
  { icon: '🧾', title: 'GST Invoice Generation', desc: 'Auto-generate tax-compliant invoices for every sale' },
  {
    icon: '📣',
    title: 'Meta Ads Promotion',
    desc: 'We create & run Facebook + Instagram ads for your products — reaching 50K+ buyers',
    highlight: true,
  },
];

const STATS = [
  { value: '12,400+', label: 'Verified Suppliers' },
  { value: '₹2,400Cr', label: 'Monthly GMV' },
  { value: '287+', label: 'Cities Covered' },
];

export default function SubscriptionModal({ isOpen, onClose, userEmail = '', companyName = '' }) {
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [pricing, setPricing] = useState(null);
  const [razorpayOrderId, setRazorpayOrderId] = useState(null);
  const [razorpayKeyId, setRazorpayKeyId] = useState(null);
  const [prefill, setPrefill] = useState({});
  const [isLoadingOrder, setIsLoadingOrder] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [activeFeatureIdx, setActiveFeatureIdx] = useState(null);
  // Expired subscription info — set when user's previous plan has lapsed
  const [expiredInfo, setExpiredInfo] = useState(null); // { expiresAtFormatted, previousPlan }
  // Mobile tab state: 'checkout' (default, direct access to renewal/pay) | 'benefits'
  const [mobileTab, setMobileTab] = useState('checkout');

  // Prevent body scroll when modal is open and reset mobile tab
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setMobileTab('checkout');
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Auto-cycle feature highlights
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setActiveFeatureIdx((prev) => {
        const next = (prev === null ? 0 : prev + 1) % PLAN_FEATURES.length;
        return next;
      });
    }, 2500);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Fetch pricing when modal opens — also auto-close if user already has a paid plan
  const fetchPricing = useCallback(async () => {
    try {
      const res = await fetch('/api/membership', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setPricing(data.pricing);
        const mem = data?.membership;
        // Guard: if user already has an active paid subscription, close without showing
        const hasPaidPlan = mem?.canUpload === true && mem?.plan !== 'FREE TIER' && !mem?.isExpired;
        if (hasPaidPlan) {
          onClose?.('already_subscribed');
          return;
        }
        // Capture expired plan details so we can show the renewal message
        if (mem?.isExpired === true) {
          setExpiredInfo({
            expiresAtFormatted: mem.expiresAtFormatted || 'recently',
            previousPlan: mem.previousPlan || mem.rawPlan || 'Annual Plan',
          });
        } else {
          setExpiredInfo(null);
        }
      }
    } catch { /* silent */ }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) fetchPricing();
  }, [isOpen, fetchPricing]);


  // Create Razorpay order
  const createOrder = useCallback(async () => {
    setIsLoadingOrder(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/membership', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'ANNUAL PLAN', paymentMethod }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create payment order');
      setRazorpayOrderId(data.razorpayOrderId);
      setRazorpayKeyId(data.razorpayKeyId);
      setPrefill(data.prefill || {});
      setPricing(data.pricing);
      return data;
    } catch (err) {
      setErrorMsg(err.message || 'Payment initialization failed. Please try again.');
      return null;
    } finally {
      setIsLoadingOrder(false);
    }
  }, [paymentMethod]);

  // Verify payment after Razorpay callback
  const verifyPayment = useCallback(async (paymentData) => {
    setIsVerifying(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/membership', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify',
          plan: 'ANNUAL PLAN',
          ...paymentData,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Payment verification failed');
      setSuccessMsg(data.message || '🎉 Subscription activated successfully!');
      setTimeout(() => {
        onClose?.('activated');
      }, 2200);
    } catch (err) {
      setErrorMsg(err.message || 'Payment verification failed. Please contact support.');
    } finally {
      setIsVerifying(false);
    }
  }, [onClose]);

  // Launch Razorpay checkout
  const handleCheckout = useCallback(async () => {
    setErrorMsg('');
    const orderData = await createOrder();
    if (!orderData) return;

    if (!scriptLoaded || typeof window.Razorpay === 'undefined') {
      setErrorMsg('Payment gateway not loaded yet. Please wait a moment and try again.');
      return;
    }

    const options = {
      key: orderData.razorpayKeyId,
      amount: orderData.amountPaise,
      currency: 'INR',
      name: 'B2B India',
      description: 'Annual Supplier Membership — 12 Months',
      order_id: orderData.razorpayOrderId,
      prefill: {
        name: companyName || orderData.prefill?.name || '',
        email: userEmail || orderData.prefill?.email || '',
        contact: orderData.prefill?.contact || '',
      },
      theme: { color: '#16a34a' },
      modal: {
        ondismiss: () => setErrorMsg(''),
      },
      handler: async (response) => {
        await verifyPayment({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        });
      },
    };

    try {
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (resp) => {
        setErrorMsg(`Payment failed: ${resp.error?.description || 'Unknown error'}. Please try again.`);
      });
      rzp.open();
    } catch (err) {
      setErrorMsg('Failed to open payment gateway. Please refresh and try again.');
    }
  }, [createOrder, scriptLoaded, companyName, userEmail, verifyPayment]);

  const basePrice = pricing?.baseAmount ?? 2000;
  const gstAmount = pricing?.gstAmount ?? 360;
  const totalPayable = pricing?.totalPayable ?? 2420;
  const originalPrice = 20000;

  if (!isOpen) return null;

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setScriptLoaded(true)}
        strategy="lazyOnload"
      />

      <AnimatePresence>
        {isOpen && (
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto"
            style={{ backgroundColor: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(8px)' }}
          >
            {/* Backdrop click to close */}
            <div className="fixed inset-0" onClick={() => onClose?.('dismissed')} />

            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-4xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col lg:flex-row max-h-[92vh] sm:max-h-[90vh] overflow-y-auto lg:overflow-hidden my-auto z-10"
              onClick={(e) => e.stopPropagation()}
            >
              {/* ── Close Button ── */}
              <button
                type="button"
                onClick={() => onClose?.('dismissed')}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 z-30 w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-black/25 text-white/90 border border-white/20 lg:bg-white/90 lg:text-gray-600 lg:border-gray-200 lg:hover:text-gray-900 lg:hover:bg-white flex items-center justify-center shadow-md transition-all cursor-pointer active:scale-95"
                title="Close"
                aria-label="Close subscription modal"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>

              {/* ── MOBILE HEADER & TAB SWITCHER (Visible ONLY on < lg screens) ── */}
              <div
                className="block lg:hidden relative p-4 text-white flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #052e16 0%, #14532d 50%, #166534 100%)',
                }}
              >
                {/* Brand row */}
                <div className="flex items-center gap-2 mb-2 pr-10">
                  <div className="w-7 h-7 rounded-lg bg-emerald-400/20 border border-emerald-400/30 flex items-center justify-center text-sm">
                    🌱
                  </div>
                  <span className="text-emerald-300 font-bold text-xs tracking-wide">B2B INDIA</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-400/20 border border-emerald-400/30 text-emerald-200 font-medium">
                    {expiredInfo ? 'Renewal Required' : 'Annual Membership'}
                  </span>
                </div>

                <h2 className="text-lg sm:text-xl font-extrabold text-white leading-tight mb-1 pr-8">
                  {expiredInfo ? (
                    <>Renew Your <span className="text-red-300">Membership</span></>
                  ) : (
                    <>Unlock Full <span className="text-emerald-300">Supplier Access</span></>
                  )}
                </h2>
                <p className="text-emerald-100/75 text-xs leading-relaxed mb-3">
                  {expiredInfo
                    ? 'Your catalog is hidden from buyers. Renew now to restore full visibility.'
                    : 'Connect with verified bulk buyers across 287+ Indian cities.'}
                </p>

                {/* Mobile Tab Switcher */}
                <div className="flex rounded-xl bg-black/25 p-1 gap-1 border border-white/10">
                  <button
                    type="button"
                    onClick={() => setMobileTab('checkout')}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
                      mobileTab === 'checkout'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-white/80 hover:text-white'
                    }`}
                  >
                    💳 {expiredInfo ? 'Renew & Pay' : 'Plan & Checkout'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobileTab('benefits')}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
                      mobileTab === 'benefits'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-white/80 hover:text-white'
                    }`}
                  >
                    ✨ All Benefits ({PLAN_FEATURES.length})
                  </button>
                </div>
              </div>

              {/* ── DESKTOP LEFT PANEL: Full Branding, Features & Stats (Visible ONLY on lg+ screens) ── */}
              <div
                className="hidden lg:flex lg:w-[44%] flex-shrink-0 relative overflow-hidden flex-col p-8 justify-between"
                style={{
                  background: 'linear-gradient(135deg, #052e16 0%, #14532d 40%, #166534 70%, #15803d 100%)',
                }}
              >
                {/* Radial glow & subtle grid pattern */}
                <div
                  className="absolute inset-0 opacity-30 pointer-events-none"
                  style={{
                    background: 'radial-gradient(ellipse at 30% 50%, rgba(134,239,172,0.25) 0%, transparent 70%)',
                  }}
                />
                <div
                  className="absolute inset-0 opacity-[0.04] pointer-events-none"
                  style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
                    backgroundSize: '36px 36px',
                  }}
                />

                <div className="relative z-10 flex flex-col h-full">
                  {/* Logo area */}
                  <div className="mb-5">
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-400/20 border border-emerald-400/30 flex items-center justify-center">
                        <span className="text-lg">🌱</span>
                      </div>
                      <span className="text-emerald-300 font-bold text-sm tracking-wide">B2B INDIA</span>
                    </div>
                    <h2 className="text-2xl xl:text-3xl font-extrabold text-white leading-tight mb-2">
                      {expiredInfo ? (
                        <>Renew Your<br /><span className="text-red-300">Membership Now</span></>
                      ) : (
                        <>Unlock Your Full<br /><span className="text-emerald-300">Supplier Potential</span></>
                      )}
                    </h2>
                    <p className="text-emerald-100/70 text-xs xl:text-sm leading-relaxed">
                      {expiredInfo
                        ? 'Your products are hidden from buyers. Renewing restores your full catalog visibility instantly.'
                        : 'Join India\'s most trusted B2B platform and start connecting with verified bulk buyers instantly.'}
                    </p>
                  </div>

                  {/* Features list */}
                  <div className="flex-1 space-y-2 mb-5 overflow-y-auto pr-1" style={{ maxHeight: '280px' }}>
                    {PLAN_FEATURES.map((feat, i) => (
                      <motion.div
                        key={i}
                        animate={{
                          backgroundColor: activeFeatureIdx === i
                            ? 'rgba(255,255,255,0.12)'
                            : feat.highlight
                              ? 'rgba(251,191,36,0.08)'
                              : 'rgba(255,255,255,0.04)',
                        }}
                        transition={{ duration: 0.4 }}
                        className={`flex items-start gap-3 p-2.5 xl:p-3 rounded-xl border transition-colors ${
                          feat.highlight
                            ? 'border-amber-400/30'
                            : activeFeatureIdx === i
                              ? 'border-emerald-400/30'
                              : 'border-white/[0.08]'
                        }`}
                      >
                        <span className="text-base flex-shrink-0 mt-0.5">{feat.icon}</span>
                        <div>
                          <div className={`text-xs font-bold leading-tight ${feat.highlight ? 'text-amber-300' : 'text-white'}`}>
                            {feat.title}
                            {feat.highlight && (
                              <span className="ml-1.5 px-1.5 py-0.5 text-[9px] bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full font-bold uppercase tracking-wide">
                                FREE ADD-ON
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-white/50 mt-0.5 leading-relaxed">{feat.desc}</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Trust stats row */}
                  <div className="grid grid-cols-3 gap-2 pt-4 border-t border-white/10">
                    {STATS.map((s) => (
                      <div key={s.label} className="text-center">
                        <div className="text-sm xl:text-base font-extrabold text-emerald-300">{s.value}</div>
                        <div className="text-[10px] text-white/40 mt-0.5 leading-tight">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── MOBILE BENEFITS VIEW (Shown when mobileTab === 'benefits' on < lg screens) ── */}
              <div className={`${mobileTab === 'benefits' ? 'flex flex-col' : 'hidden'} lg:hidden p-4 sm:p-5 bg-gray-50 flex-1`}>
                <div className="mb-3">
                  <h3 className="text-base font-bold text-gray-900 mb-1">Included in Annual Membership</h3>
                  <p className="text-xs text-gray-500">Everything you get for 12 months with verified supplier status</p>
                </div>

                <div className="space-y-2 mb-4">
                  {PLAN_FEATURES.map((feat, i) => (
                    <div
                      key={i}
                      className={`flex items-start gap-2.5 p-3 rounded-xl border ${
                        feat.highlight
                          ? 'bg-amber-50/80 border-amber-300'
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <span className="text-lg flex-shrink-0">{feat.icon}</span>
                      <div>
                        <div className={`text-xs font-bold ${feat.highlight ? 'text-amber-900' : 'text-gray-900'}`}>
                          {feat.title}
                          {feat.highlight && (
                            <span className="ml-1.5 px-1.5 py-0.5 text-[9px] bg-amber-200 text-amber-900 rounded-full font-bold uppercase">
                              Free Add-on
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-gray-600 mt-0.5 leading-relaxed">{feat.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-2 p-3 bg-white rounded-xl border border-gray-200 text-center mb-4">
                  {STATS.map((s) => (
                    <div key={s.label}>
                      <div className="text-sm font-extrabold text-emerald-700">{s.value}</div>
                      <div className="text-[10px] text-gray-500">{s.label}</div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setMobileTab('checkout')}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow cursor-pointer transition-colors"
                >
                  ← Continue to Checkout (₹{Math.round(totalPayable).toLocaleString('en-IN')})
                </button>
              </div>

              {/* ── RIGHT PANEL: Pricing & Checkout (Always on Desktop, Tab 1 on Mobile) ── */}
              <div className={`${mobileTab === 'checkout' ? 'flex flex-col' : 'hidden'} lg:flex lg:flex-col flex-1 p-4 sm:p-6 lg:p-8 lg:overflow-y-auto bg-white`}>

                {/* Expired alert banner — shown only when previous plan has lapsed */}
                {expiredInfo && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 rounded-xl sm:rounded-2xl border-2 border-red-300 bg-gradient-to-r from-red-50 to-orange-50 p-3 sm:p-4"
                  >
                    <div className="flex items-start gap-2.5 sm:gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-red-100 border border-red-200 flex items-center justify-center flex-shrink-0 text-base sm:text-xl">
                        ⚠️
                      </div>
                      <div>
                        <div className="text-xs sm:text-sm font-extrabold text-red-800 mb-0.5 sm:mb-1">
                          Subscription Expired on {expiredInfo.expiresAtFormatted}
                        </div>
                        <p className="text-[11px] sm:text-xs text-red-700 leading-relaxed">
                          Your products are currently <strong>hidden from the website</strong>. Renew your membership now to immediately restore all your existing product catalog listings live!
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Section header */}
                <div className="mb-4">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Annual Plan — Exclusive Launch Price
                  </div>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900 leading-tight">
                    {expiredInfo ? 'Renew Your Membership' : 'Activate Your Membership'}
                  </h3>
                  <p className="text-gray-500 text-xs sm:text-sm mt-0.5">
                    {companyName ? `Welcome back, ${companyName}! ` : ''}
                    {expiredInfo
                      ? 'Renew now to instantly restore all your product listings.'
                      : 'Get full platform access for 12 months.'}
                  </p>
                </div>

                {/* Quick perks row on mobile checkout tab */}
                <div className="grid grid-cols-2 gap-1.5 text-[11px] mb-4 lg:hidden">
                  <div className="flex items-center gap-1.5 bg-amber-50 rounded-lg px-2.5 py-1.5 border border-amber-200 text-amber-900 font-semibold">
                    <span>📣</span>
                    <span className="truncate">Meta Ads Free Add-on</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-emerald-50 rounded-lg px-2.5 py-1.5 border border-emerald-200 text-emerald-900 font-semibold">
                    <span>📦</span>
                    <span className="truncate">Unlimited Listings</span>
                  </div>
                </div>

                {/* Pricing card */}
                <div className="rounded-xl sm:rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50/60 to-white p-3.5 sm:p-4 mb-4 relative overflow-hidden">
                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold uppercase tracking-wider shadow">
                    90% OFF
                  </div>
                  <div className="flex items-end gap-3 mb-3">
                    <div>
                      <div className="text-xs text-gray-400 font-medium line-through">
                        ₹{originalPrice.toLocaleString('en-IN')} / year
                      </div>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-3xl sm:text-4xl font-extrabold text-gray-900">
                          ₹{basePrice.toLocaleString('en-IN')}
                        </span>
                        <span className="text-gray-500 text-xs sm:text-sm font-medium">/year</span>
                      </div>
                    </div>
                  </div>

                  {/* Price breakdown */}
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-gray-500">
                      <span>Base membership fee</span>
                      <span className="font-semibold text-gray-700">₹{basePrice.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>GST (18%)</span>
                      <span className="font-semibold text-gray-700">₹{gstAmount.toLocaleString('en-IN')}</span>
                    </div>
                    {pricing?.gatewayFee > 0 && (
                      <div className="flex justify-between text-gray-500">
                        <span>Gateway fee (2.5%)</span>
                        <span className="font-semibold text-gray-700">
                          ₹{Math.round(pricing.gatewayFee).toLocaleString('en-IN')}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-gray-900 pt-1.5 border-t border-gray-200">
                      <span>Total payable</span>
                      <span className="text-emerald-700 text-sm sm:text-base font-extrabold">
                        ₹{Math.round(totalPayable).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Meta Ads highlight box */}
                <div className="rounded-xl sm:rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-3 sm:p-3.5 mb-4">
                  <div className="flex items-start gap-2.5 sm:gap-3">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                        <span className="text-xs sm:text-sm font-bold text-gray-900">Meta Ads Promotion Included</span>
                        <span className="px-1.5 py-0.5 bg-amber-200 text-amber-800 text-[9px] font-bold rounded-full uppercase">
                          Free Add-on
                        </span>
                      </div>
                      <p className="text-[11px] sm:text-xs text-gray-600 leading-relaxed">
                        Our team creates and runs <strong>Facebook &amp; Instagram ads</strong> promoting
                        your products to 50,000+ buyers across India at no extra cost.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Payment method toggle */}
                <div className="mb-4">
                  <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                    Payment Method
                  </label>
                  <div className="flex rounded-xl bg-gray-100 p-1 gap-1">
                    {[
                      { key: 'upi', label: '⚡ UPI / Netbanking' },
                      { key: 'cards', label: '💳 Cards' },
                    ].map(({ key, label }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setPaymentMethod(key)}
                        className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                          paymentMethod === key
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Error / Success messages */}
                <AnimatePresence mode="wait">
                  {errorMsg && (
                    <motion.div
                      key="error"
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="mb-3 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold flex items-start gap-2"
                    >
                      <span className="text-base flex-shrink-0">⚠️</span>
                      <span>{errorMsg}</span>
                    </motion.div>
                  )}
                  {successMsg && (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="mb-3 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-800 font-bold text-center"
                    >
                      {successMsg}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Primary CTA */}
                <button
                  id="subscription-activate-btn"
                  type="button"
                  disabled={isLoadingOrder || isVerifying || !!successMsg}
                  onClick={handleCheckout}
                  className={`w-full py-3.5 sm:py-4 px-4 rounded-xl sm:rounded-2xl text-white font-bold text-sm sm:text-base shadow-lg transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 mb-3 ${
                    expiredInfo
                      ? 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 shadow-red-500/30'
                      : 'bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-500 hover:to-green-600 shadow-emerald-500/30'
                  }`}
                >
                  {isLoadingOrder || isVerifying ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {isVerifying ? 'Verifying Payment...' : 'Preparing Checkout...'}
                    </>
                  ) : successMsg ? (
                    '✅ Membership Activated!'
                  ) : expiredInfo ? (
                    <>
                      <span>🔄</span>
                      <span>Renew Annual Plan — ₹{Math.round(totalPayable).toLocaleString('en-IN')}</span>
                    </>
                  ) : (
                    <>
                      <span>🚀</span>
                      <span>Activate Annual Plan — ₹{Math.round(totalPayable).toLocaleString('en-IN')}</span>
                    </>
                  )}
                </button>

                {/* Skip / Later link */}
                <div className="text-center space-y-2.5 pb-1">
                  <button
                    id="subscription-skip-btn"
                    type="button"
                    onClick={() => onClose?.('dismissed')}
                    className="text-xs text-gray-500 hover:text-gray-700 transition-colors cursor-pointer underline underline-offset-2 py-1"
                  >
                    I&apos;ll subscribe later — Continue to dashboard
                  </button>
                  <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[10px] text-gray-400">
                    <div className="flex items-center gap-1">
                      <span>🔒</span> Secured by Razorpay
                    </div>
                    <div className="flex items-center gap-1">
                      <span>🛡️</span> RBI Licensed Gateway
                    </div>
                    <div className="flex items-center gap-1">
                      <span>✅</span> GST Invoice Provided
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
