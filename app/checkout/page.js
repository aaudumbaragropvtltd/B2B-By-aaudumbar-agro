// ============================================================================
// CHECKOUT PAGE — UNIFIED RAZORPAY ESCROW GATEWAY
// ============================================================================
// Features:
// - Exclusively uses Razorpay for all payments (UPI, Cards, NetBanking, EMI)
// - Fee calculation:
//     * >= ₹10,00,000: ₹97,640 Escrow Advance + ₹2,360 Platform Fee = Flat ₹1,00,000 (UPI)
//                      Cards / NetBanking: 2.5% + 18% GST (₹2,880.38)
//     * < ₹10,00,000: 10% Base Escrow Advance + Razorpay Transaction Fees
// - Auto-Redirect on verification & AJAX status listener
// ============================================================================

"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Script from 'next/script';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import PostPaymentFlow from '@/components/PostPaymentFlow';
import { getProductGstRate } from '@/utils/gstUtils';
import { calculatePaymentBreakdown } from '@/utils/paymentCalculations';

function CheckoutContent() {
  const searchParams = useSearchParams();
  const productId = searchParams.get('productId') || '47a16ec8-33df-4c91-a5c9-f23a5054bb83';
  const initialQty = searchParams.get('quantity') || '1000';
  const initialEmail = searchParams.get('email') || '';
  const initialOrderId = searchParams.get('orderId') || '';
  const initialQuoteId = searchParams.get('quoteId') || '';
  const initialRfqId = searchParams.get('rfqId') || '';

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(initialQty);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [buyerEmail, setBuyerEmail] = useState(initialEmail);
  const [buyerCompany, setBuyerCompany] = useState('');
  const [paymentOption, setPaymentOption] = useState('upi'); // 'upi' | 'cards'
  const [isProcessingRazorpay, setIsProcessingRazorpay] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [activeOrderId, setActiveOrderId] = useState(initialOrderId);
  const [paymentSuccessData, setPaymentSuccessData] = useState(null);

  // Load authenticated user profile for company name
  useEffect(() => {
    async function loadUser() {
      try {
        const { createClient } = await import('@/services/supabase');
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          if (!buyerEmail && user.email) setBuyerEmail(user.email);
          const { data: profile } = await supabase.from('users').select('company_name, full_name').eq('id', user.id).maybeSingle();
          if (profile?.company_name) {
            setBuyerCompany(profile.company_name);
          }
        }
      } catch (e) {}
    }
    loadUser();
  }, [buyerEmail]);

  // Ensure body scroll is never locked
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'auto';
      document.documentElement.style.overflow = 'auto';
    }
    return () => {
      if (typeof document !== 'undefined') {
        document.body.style.overflow = 'auto';
        document.documentElement.style.overflow = 'auto';
      }
    };
  }, []);

  useEffect(() => {
    async function loadProduct() {
      try {
        setLoading(true);
        const res = await fetch(`/api/products`);
        if (res.ok) {
          const data = await res.json();
          const found = (data.products || []).find((p) => p.id === productId || p.slug === productId);
          if (found) {
            setProduct(found);
          } else {
            const singleRes = await fetch(`/api/products?id=${productId}`);
            if (singleRes.ok) {
              const singleData = await singleRes.json();
              if (singleData.product) setProduct(singleData.product);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching product for checkout:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [productId]);

  const unitPrice = Number(product?.base_price_per_unit) || 148;
  const unitLabel = product?.unit_label || 'kg';
  const gstInfo = product ? getProductGstRate(product) : { percentage: 5, rateDecimal: 0.05 };
  const gstRate = gstInfo.rateDecimal;
  const numQuantity = Number(quantity) || 1000;
  const subtotal = numQuantity * unitPrice;
  const gst = subtotal * gstRate;
  const logisticsCost = 0;
  const totalAmount = subtotal + gst + logisticsCost;

  const breakdown = calculatePaymentBreakdown(totalAmount);
  const isHighValue = breakdown.isHighValue;
  const selectedBreakdown = paymentOption === 'upi' ? breakdown.upi : breakdown.cards;
  const totalPayableNow = selectedBreakdown.totalPayable;
  const baseAdvanceAmount = selectedBreakdown.baseAdvance;
  const totalFeeAmount = selectedBreakdown.totalFee;

  const orderRef = activeOrderId || initialOrderId || initialQuoteId || (productId ? `ORD-${productId.slice(0, 8).toUpperCase()}` : 'ORD-ESCROW');

  // Initialize order reference on client if not provided
  useEffect(() => {
    if (!activeOrderId && !initialOrderId && !initialQuoteId) {
      const generatedRef = `ORD-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      setActiveOrderId(generatedRef);
    }
  }, [activeOrderId, initialOrderId, initialQuoteId]);

  // ── Real-time AJAX Polling for Webhook / Gateway Status Every 3s ──
  useEffect(() => {
    if (!activeOrderId || paymentSuccessData) return;

    const intervalId = setInterval(async () => {
      try {
        const res = await fetch(`/api/payment/status?orderId=${encodeURIComponent(activeOrderId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.paid && data.status === 'PAID') {
            clearInterval(intervalId);
            setPaymentSuccessData({
              paymentMethod: 'razorpay',
              orderId: activeOrderId,
              utr: data.paymentReference || `RZP-AUTO-${Date.now().toString().slice(-6)}`,
              advancePaid: data.advancePaid || totalPayableNow,
              totalContractValue: data.totalContractValue || totalAmount,
              productTitle: product?.title || 'Wholesale Commodity',
              supplierName: product?.supplier_id?.company_name || 'Verified Supplier',
              paymentVerified: true,
            });
          }
        }
      } catch (pollErr) {
        // Silent catch during background poll
      }
    }, 3000);

    return () => clearInterval(intervalId);
  }, [activeOrderId, paymentSuccessData, totalPayableNow, totalAmount, product]);

  // ── Razorpay Payment Trigger ──
  const handlePayRazorpay = async () => {
    setErrorMsg(null);
    setIsProcessingRazorpay(true);

    try {
      let currentOrderId = activeOrderId;
      let rzpKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_live_TbvASSd9EMGeDz';
      let rzpOrderId = null;

      try {
        const checkRes = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            quote: {
              productId: product?.id || productId,
              supplierId: product?.supplier_id?.id || (typeof product?.supplier_id === 'string' ? product?.supplier_id : 'supp-1'),
              quantity: numQuantity,
              unitLabel,
              unitPrice,
              logisticsCost,
              taxRatePercent: gstInfo.percentage,
              taxAmount: gst,
              subtotal,
              totalContractValue: totalAmount,
              advanceRequired10: baseAdvanceAmount,
              deliveryAddress,
              buyerEmail,
            },
            paymentMethod: 'razorpay',
            paymentOption,
          }),
        });
        const checkData = await checkRes.json();
        if (checkRes.ok && checkData.success) {
          currentOrderId = checkData.orderId;
          setActiveOrderId(currentOrderId);
          if (checkData.razorpayKeyId) rzpKey = checkData.razorpayKeyId;
          if (checkData.razorpayOrderId) rzpOrderId = checkData.razorpayOrderId;
        } else {
          currentOrderId = currentOrderId || `ORD-${Date.now().toString().slice(-6)}`;
        }
      } catch (apiErr) {
        currentOrderId = currentOrderId || `ORD-${Date.now().toString().slice(-6)}`;
      }

      // Ensure an official Razorpay Order ID exists so Razorpay provides a cryptographic signature
      if (!rzpOrderId) {
        try {
          const createOrderRes = await fetch('/api/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount: Math.round(totalPayableNow * 100),
              isPaise: true,
              receipt: `rcpt_${(currentOrderId || 'ord').slice(0, 8)}`,
              notes: { order_id: currentOrderId }
            }),
          });
          const createOrderData = await createOrderRes.json();
          if (createOrderRes.ok && (createOrderData.order_id || createOrderData.id)) {
            rzpOrderId = createOrderData.order_id || createOrderData.id;
            if (createOrderData.key_id) rzpKey = createOrderData.key_id;
          }
        } catch (coErr) {
          console.warn('create-order fallback notice:', coErr.message);
        }
      }

      if (typeof window !== 'undefined' && window.Razorpay) {
        const options = {
          key: rzpKey,
          amount: Math.round(totalPayableNow * 100),
          currency: 'INR',
          name: 'B2B India Wholesale Escrow',
          description: `Advance Escrow for ${product?.title || 'Order'} #${currentOrderId?.slice(0, 8)}`,
          order_id: rzpOrderId || undefined,
          prefill: {
            email: buyerEmail || '',
            contact: '',
          },
          theme: { color: '#16a34a' },
          handler: async function (response) {
            try {
              const vRes = await fetch('/api/payment/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  orderId: currentOrderId,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id || rzpOrderId || `order_${currentOrderId}`,
                  razorpay_signature: response.razorpay_signature,
                  amount: totalPayableNow,
                  buyerEmail: buyerEmail,
                  buyerCompanyName: buyerCompany || undefined,
                  productTitle: product?.title || 'Wholesale Commodity',
                  deliveryAddress: deliveryAddress
                }),
              });

              const vData = await vRes.json();

              if (vRes.ok && vData.success) {
                setPaymentSuccessData({
                  paymentMethod: 'razorpay',
                  orderId: currentOrderId,
                  razorpayPaymentId: response.razorpay_payment_id,
                  advancePaid: totalPayableNow,
                  totalContractValue: totalAmount,
                  productTitle: product?.title || 'Wholesale Commodity',
                  supplierName: product?.supplier_id?.company_name || 'Verified Supplier',
                  buyerCompanyName: buyerCompany || vData.buyerCompanyName || undefined,
                  paymentVerified: true,
                  receiptEmailSent: vData.receiptEmailSent || false
                });
              } else {
                setErrorMsg(vData.error || 'Payment signature verification failed. Your payment could not be confirmed.');
              }
            } catch (vErr) {
              console.error('Verification error:', vErr);
              setErrorMsg('Payment verification network error. Please contact support.');
            } finally {
              setIsProcessingRazorpay(false);
            }
          },
          modal: {
            ondismiss: async function () {
              setIsProcessingRazorpay(false);
              try {
                if (currentOrderId) {
                  await fetch('/api/orders/cancel', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      orderId: currentOrderId,
                      reason: 'Payment dismissed/cancelled by user before completion'
                    })
                  });
                }
              } catch (e) {}
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', async (resp) => {
          console.warn('Razorpay payment failed:', resp.error);
          const failReason = resp.error?.description || 'Transaction was declined by bank/gateway.';
          setErrorMsg(`Payment Failed: ${failReason}. Your order was NOT placed.`);
          setIsProcessingRazorpay(false);

          try {
            if (currentOrderId) {
              await fetch('/api/orders/cancel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  orderId: currentOrderId,
                  reason: `Payment failed: ${failReason}`
                })
              });
            }
          } catch (e) {}
        });
        rzp.open();
      } else {
        setErrorMsg('Razorpay payment gateway script could not be loaded. Please refresh the page and retry.');
        setIsProcessingRazorpay(false);
      }
    } catch (err) {
      console.error('Razorpay checkout error:', err);
      setErrorMsg(err.message || 'Razorpay checkout error');
      setIsProcessingRazorpay(false);
    }
  };

  /* ────────────────────────────────────────────────────────────── */
  /*  POST-PAYMENT SUCCESS VIEW                                    */
  /* ────────────────────────────────────────────────────────────── */
  if (paymentSuccessData) {
    return (
      <>
        <Navbar />
        <main suppressHydrationWarning className="min-h-screen pt-24 pb-16 bg-slate-950 text-slate-900">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <PostPaymentFlow
              initialPhase="success"
              product={product}
              quantity={numQuantity}
              unit={unitLabel}
              pricePerUnit={unitPrice}
              subtotal={subtotal}
              gst={gst}
              logisticsCost={logisticsCost}
              total={totalAmount}
              initialEmail={buyerEmail}
              orderId={paymentSuccessData.orderId}
              paymentData={paymentSuccessData}
              onClose={() => (window.location.href = '/orders')}
            />
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main suppressHydrationWarning className="min-h-screen pt-24 pb-20 bg-slate-950 text-slate-100 antialiased selection:bg-brand-500 selection:text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb Header */}
          <div className="mb-6 flex items-center justify-between">
            <Link
              href={productId ? `/directory/product/${productId}` : '/directory'}
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
            >
              <span>←</span> Back to Product Details
            </Link>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-950/80 px-3 py-1.5 rounded-full border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              100% Escrow Protected by Razorpay
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* ── LEFT COLUMN: ORDER SUMMARY & PRODUCT DETAILS (5 COLS) ── */}
            <div className="lg:col-span-5 space-y-6">
              <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-5 shadow-xl">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden">
                    {product?.hero_image_url ? (
                      <img src={product.hero_image_url} alt={product.title} className="w-full h-full object-cover" />
                    ) : (
                      '🌾'
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-brand-500/10 text-brand-400 text-[10px] font-black uppercase tracking-wider mb-1">
                      {product?.quality_grade || 'Export Quality'}
                    </div>
                    <h2 className="text-base font-extrabold text-white leading-tight truncate">
                      {product?.title || 'Wholesale Commodity'}
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Supplier: {product?.supplier_id?.company_name || 'Aaudumbar Agro Pvt Ltd'}
                    </p>
                  </div>
                </div>

                {/* Quantity & Unit Pricing Controls (Locked / Read-Only on Payment Page) */}
                <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-2xl space-y-3 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-medium">Order Quantity:</span>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-xl shadow-inner">
                      <span className="text-[10px] text-emerald-400 font-bold">🔒 Locked Deal</span>
                      <strong className="text-white font-mono text-xs">
                        {Number(quantity).toLocaleString('en-IN')}
                      </strong>
                      <span className="font-bold text-slate-300">{unitLabel}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-medium">Ex-Factory Base Rate:</span>
                    <strong className="text-white font-mono">₹{unitPrice.toLocaleString('en-IN')} / {unitLabel}</strong>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-medium">GST Rate ({gstInfo.percentage}%):</span>
                    <span className="text-slate-300 font-mono">+₹{gst.toLocaleString('en-IN')}</span>
                  </div>

                  <div className="pt-2.5 border-t border-slate-800 flex justify-between items-center text-sm">
                    <span className="font-bold text-slate-200">Total Contract Value:</span>
                    <strong className="text-lg font-black text-white font-mono">
                      ₹{totalAmount.toLocaleString('en-IN')}
                    </strong>
                  </div>
                </div>

                {/* Buyer Details Form */}
                <div suppressHydrationWarning className="space-y-3 pt-2">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Delivery Destination & Contact
                  </label>
                  <input
                    type="email"
                    placeholder="Enter business email for official GST invoice"
                    value={buyerEmail}
                    onChange={(e) => setBuyerEmail(e.target.value)}
                    suppressHydrationWarning
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Enter warehouse delivery destination / city"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    suppressHydrationWarning
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </div>
              </div>

              {/* Escrow Mechanism Explanation Box */}
              <div className="p-5 bg-gradient-to-br from-slate-900 to-slate-950 border border-emerald-500/20 rounded-3xl space-y-3 text-xs">
                <div className="flex items-center gap-2 text-emerald-400 font-black">
                  <span>🔒</span> How B2B India Escrow Protects You
                </div>
                <ul className="space-y-2 text-slate-300 text-[11px] leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">1.</span>
                    <span><strong>Advance Price Lock:</strong> Pay only advance deposit today. Price & allocation locked immediately.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">2.</span>
                    <span><strong>Warehouse Truck Loading Payment:</strong> The remaining 90% balance (₹{breakdown.remainingBalance.toLocaleString('en-IN')}) is payable strictly at the time of loading the goods into the truck at our warehouse/godown before departure.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* ── RIGHT COLUMN: UNIFIED RAZORPAY GATEWAY (7 COLS) ── */}
            <div className="lg:col-span-7 space-y-6">
              <div className="p-6 sm:p-8 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                      <span>💳</span> Razorpay Escrow Gateway
                    </h3>
                    <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full text-[10px] font-black uppercase tracking-wider">
                      Trusted Wholesale Gateway
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Pay securely using Google Pay, PhonePe, Paytm, BHIM UPI, NetBanking, or Corporate Credit Cards.
                  </p>
                </div>

                {/* High-Value Cap Banner (if >= ₹10 Lakhs) */}
                {isHighValue && (
                  <div className="p-4 bg-emerald-950/70 border-2 border-emerald-500/40 rounded-2xl flex items-center gap-3">
                    <div className="text-2xl flex-shrink-0">⭐</div>
                    <div className="text-xs">
                      <div className="font-extrabold text-emerald-300">
                        High-Value Deal Cap Active (&gt; ₹10,00,000)
                      </div>
                      <div className="text-emerald-100/80 text-[11px] mt-0.5">
                        Advance is capped at flat <strong>₹97,640</strong> Escrow Deposit + <strong>₹2,360</strong> UPI Platform Fee (Total: <strong>₹1,00,000</strong>).
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment Option Selector (UPI vs Cards/NetBanking) */}
                <div suppressHydrationWarning className="space-y-3">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Select Razorpay Payment Mode:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Option 1: Razorpay UPI */}
                    <button
                      type="button"
                      onClick={() => setPaymentOption('upi')}
                      suppressHydrationWarning
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                        paymentOption === 'upi'
                          ? 'bg-emerald-950/60 border-emerald-500 ring-2 ring-emerald-500/30 text-white'
                          : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">⚡</span>
                          <span className="font-black text-xs text-white">Razorpay UPI</span>
                        </div>
                        <span className="text-[10px] font-black px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded">
                          {isHighValue ? '₹2,360 Fee' : '2.5% + 18% GST'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-300 space-y-0.5">
                        <div>Google Pay • PhonePe • Paytm • BHIM</div>
                        <div className="text-emerald-400 font-extrabold text-sm font-mono mt-1">
                          Total: ₹{breakdown.upi.totalPayable.toLocaleString('en-IN')}
                        </div>
                      </div>
                    </button>

                    {/* Option 2: Cards / Netbanking */}
                    <button
                      type="button"
                      onClick={() => setPaymentOption('cards')}
                      suppressHydrationWarning
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                        paymentOption === 'cards'
                          ? 'bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/30 text-white'
                          : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">💳</span>
                          <span className="font-black text-xs text-white">Cards / NetBanking</span>
                        </div>
                        <span className="text-[10px] font-black px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 rounded">
                          2.5% + 18% GST
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-300 space-y-0.5">
                        <div>HDFC • SBI • ICICI • Corporate EMI</div>
                        <div className="text-indigo-400 font-extrabold text-sm font-mono mt-1">
                          Total: ₹{breakdown.cards.totalPayable.toLocaleString('en-IN')}
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Error Message & Retry Banner */}
                {errorMsg && (
                  <div className="p-4 bg-rose-950/80 border-2 border-rose-500 rounded-2xl text-xs font-bold text-rose-200 space-y-2.5 shadow-lg shadow-rose-950/40">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-rose-300 font-black text-sm">
                        <span>❌</span>
                        <span>Payment Failed / Declined</span>
                      </div>
                      <span className="text-[10px] font-black uppercase bg-rose-900 text-rose-200 px-2 py-0.5 rounded-full border border-rose-700">
                        Order Not Placed
                      </span>
                    </div>
                    <p className="text-rose-200 leading-relaxed font-medium">
                      {errorMsg}
                    </p>
                    <div className="pt-2 flex flex-wrap items-center gap-2.5 border-t border-rose-900/60">
                      <button
                        type="button"
                        onClick={() => { setErrorMsg(null); handlePayRazorpay(); }}
                        suppressHydrationWarning
                        className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
                      >
                        <span>🔄</span> Retry Payment
                      </button>
                      <button
                        type="button"
                        onClick={() => setErrorMsg(null)}
                        suppressHydrationWarning
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        Change Mode
                      </button>
                    </div>
                  </div>
                )}

                {/* Detailed Transparent Price & Surcharge Breakdown Table */}
                <div className="p-4 sm:p-5 bg-slate-950/90 border border-slate-800 rounded-2xl space-y-3 text-xs">
                  <div className="font-extrabold text-slate-200 flex items-center justify-between pb-2 border-b border-slate-800">
                    <span>Payment Summary Breakdown</span>
                    <span suppressHydrationWarning className="text-[11px] font-mono text-slate-400">Order Ref: #{orderRef.slice(0, 8)}</span>
                  </div>

                  <div className="space-y-2 text-slate-400 text-xs">
                    <div className="flex justify-between">
                      <span>Total Deal Contract Value:</span>
                      <strong className="text-white font-mono">₹{totalAmount.toLocaleString('en-IN')}</strong>
                    </div>

                    <div className="flex justify-between">
                      <span>Advance Escrow Deposit Required:</span>
                      <strong className="text-white font-mono">₹{baseAdvanceAmount.toLocaleString('en-IN')}</strong>
                    </div>

                    <div className="flex justify-between">
                      <span>
                        Razorpay Platform Fee (2.5% + 18% GST):
                      </span>
                      <span className="text-amber-400 font-mono font-bold">
                        +₹{totalFeeAmount.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="flex justify-between text-slate-400 pt-1">
                      <span>Remaining 90% Balance (Payable at Truck Loading at Warehouse/Godown):</span>
                      <span className="font-mono text-slate-200 font-bold">₹{breakdown.remainingBalance.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
                    <div>
                      <span className="text-xs text-slate-400 font-bold block">Total Amount Payable Now:</span>
                      <span className="text-[10px] text-emerald-400 font-medium">Includes 100% Escrow Price Protection</span>
                    </div>
                    <strong className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
                      ₹{totalPayableNow.toLocaleString('en-IN')}
                    </strong>
                  </div>
                </div>

                {/* Primary Razorpay Action Button */}
                <button
                  type="button"
                  onClick={handlePayRazorpay}
                  disabled={isProcessingRazorpay}
                  suppressHydrationWarning
                  className="w-full py-4 px-6 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm sm:text-base rounded-2xl shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2.5 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer disabled:opacity-50"
                >
                  {isProcessingRazorpay ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Connecting to Razorpay Secure Gateway...</span>
                    </>
                  ) : (
                    <>
                      <span>🔒</span>
                      <span>Pay ₹{totalPayableNow.toLocaleString('en-IN')} with Razorpay</span>
                    </>
                  )}
                </button>

                {/* Trust Badges Footer */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400 border-t border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <span className="text-emerald-400">🛡️</span>
                    <span>256-Bit SSL Encryption</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-300">Supported:</span>
                    <span>GPay • PhonePe • Paytm • Cards • NetBanking</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Razorpay Checkout Script */}
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      </main>
    </>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-white flex items-center justify-center font-bold">Loading Razorpay Escrow Checkout...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
