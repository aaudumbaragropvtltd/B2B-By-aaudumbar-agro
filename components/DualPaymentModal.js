// ============================================================================
// RAZORPAY ESCROW MODAL — UNIFIED GATEWAY POPUP
// ============================================================================
// Clean, modern modal exclusively offering Razorpay checkout (UPI, Cards, NetBanking).
// Implements:
//   * >= ₹10 Lakhs: ₹97,640 Base Escrow + ₹2,360 Platform Fee (₹1,00,000 Total)
//   * < ₹10 Lakhs: 10% Base Escrow + Gateway Fees
// ============================================================================

"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Script from 'next/script';
import {
  calculateAdvanceAmount,
  calculatePaymentBreakdown,
} from '@/utils/paymentCalculations';

export default function DualPaymentModal({
  isOpen = false,
  onClose,
  product = null,
  totalAmount = 0,
  quantity = 1,
  unit = 'kg',
  orderId = null,
  quoteId = null,
  rfqId = null,
  supplierName = 'Verified Supplier',
  buyerEmail = '',
  deliveryAddress = '',
  onPaymentSuccess,
}) {
  const [paymentOption, setPaymentOption] = useState('upi'); // 'upi' | 'cards'
  const [isProcessingRazorpay, setIsProcessingRazorpay] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState(orderId);
  const [errorMsg, setErrorMsg] = useState(null);

  const numTotal = Number(totalAmount) || 0;
  const breakdown = calculatePaymentBreakdown(numTotal);
  const isHighValue = breakdown.isHighValue;
  const selectedBreakdown = paymentOption === 'upi' ? breakdown.upi : breakdown.cards;
  const totalPayableNow = selectedBreakdown.totalPayable;
  const baseAdvanceAmount = selectedBreakdown.baseAdvance;
  const totalFeeAmount = selectedBreakdown.totalFee;

  const productTitle = product?.title || product?.product_name || product?.name || 'Wholesale Commodity Trade';
  const orderRef = activeOrderId || orderId || quoteId || (product?.id ? `ORD-${product.id.slice(0, 8).toUpperCase()}` : 'ORD-ESCROW');

  useEffect(() => {
    if (orderId) setActiveOrderId(orderId);
  }, [orderId]);

  // Real-time AJAX status polling
  useEffect(() => {
    if (!isOpen || !activeOrderId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/payment/status?orderId=${encodeURIComponent(activeOrderId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.paid && data.status === 'PAID') {
            clearInterval(interval);
            onPaymentSuccess?.({
              paymentMethod: 'razorpay',
              orderId: activeOrderId,
              utr: data.paymentReference || `RZP-AUTO-${Date.now().toString().slice(-6)}`,
              advancePaid: data.advancePaid || totalPayableNow,
              totalContractValue: numTotal,
              productTitle,
              supplierName,
              paymentVerified: true,
            });
            onClose();
          }
        }
      } catch (e) {}
    }, 3000);

    return () => clearInterval(interval);
  }, [isOpen, activeOrderId, totalPayableNow, numTotal, productTitle, supplierName, onPaymentSuccess, onClose]);

  // Handle body scroll when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
      document.documentElement.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
      document.documentElement.style.overflow = 'auto';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // -------------------------------------------------------------
  // RAZORPAY CHECKOUT TRIGGER
  // -------------------------------------------------------------
  const handlePayRazorpay = async () => {
    setErrorMsg(null);

    // Authentication Guard
    try {
      const { createClient } = await import('@/services/supabase');
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setErrorMsg('Authentication Required: Please sign in or register before completing wholesale payment.');
        if (typeof window !== 'undefined') {
          const currentUrl = window.location.pathname + window.location.search;
          window.location.href = `/login?redirect=${encodeURIComponent(currentUrl)}&reason=checkout`;
        }
        return;
      }
    } catch (e) {}

    setIsProcessingRazorpay(true);

    try {
      let currentOrderId = activeOrderId;
      let rzpKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_live_TbvASSd9EMGeDz';
      let rzpOrderId = null;

      // 1. Initialize order via /api/checkout if needed
      if (!currentOrderId && rfqId && quoteId) {
        const rfqRes = await fetch(`/api/rfq/${rfqId}/buy-now`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quoteId, deliveryAddress }),
        });
        const rfqData = await rfqRes.json();
        if (rfqRes.ok) {
          currentOrderId = rfqData.orderId;
          setActiveOrderId(currentOrderId);
        }
      }

      const checkoutRes = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quote: {
            productId: product?.id || 'prod-custom',
            supplierId: product?.supplier_id?.id || (typeof product?.supplier_id === 'string' ? product?.supplier_id : 'supp-1'),
            quantity: Number(quantity) || 1,
            unitLabel: unit,
            unitPrice: product?.base_price_per_unit || Math.round(numTotal / (quantity || 1)),
            logisticsCost: 0,
            taxRatePercent: 5,
            taxAmount: 0,
            subtotal: numTotal,
            totalContractValue: numTotal,
            advanceRequired10: baseAdvanceAmount,
            deliveryAddress,
            buyerEmail,
          },
          paymentMethod: 'razorpay',
          paymentOption,
        }),
      });

      const checkoutData = await checkoutRes.json();
      if (checkoutRes.ok && checkoutData.success) {
        currentOrderId = checkoutData.orderId || currentOrderId;
        if (checkoutData.razorpayKeyId) rzpKey = checkoutData.razorpayKeyId;
        if (checkoutData.razorpayOrderId) rzpOrderId = checkoutData.razorpayOrderId;
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
          amount: Math.round(totalPayableNow * 100), // Amount in paise
          currency: 'INR',
          name: 'B2B India Wholesale Escrow',
          description: `Advance Escrow — ${productTitle}`,
          order_id: rzpOrderId || undefined,
          prefill: checkoutData.prefill || { email: buyerEmail },
          theme: { color: '#16a34a' },
          handler: async function (response) {
            try {
              const vRes = await fetch('/api/payment/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  orderId: currentOrderId,
                  razorpay_order_id: response.razorpay_order_id || rzpOrderId || `order_${currentOrderId}`,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  amount: totalPayableNow,
                  buyerEmail: buyerEmail,
                  productTitle: productTitle,
                  deliveryAddress: deliveryAddress
                }),
              });

              const vData = await vRes.json();

              if (vRes.ok && vData.success) {
                onPaymentSuccess?.({
                  paymentMethod: 'razorpay',
                  orderId: currentOrderId,
                  razorpayPaymentId: response.razorpay_payment_id,
                  advancePaid: totalPayableNow,
                  baseAdvance: baseAdvanceAmount,
                  gatewayFee: totalFeeAmount,
                  totalContractValue: numTotal,
                  productTitle,
                  supplierName,
                  paymentVerified: true,
                  receiptEmailSent: vData.receiptEmailSent || false
                });
              } else {
                setErrorMsg(vData.error || 'Payment signature verification failed. Please try again.');
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
        rzp.on('payment.failed', async function (resp) {
          console.warn('Razorpay payment failed:', resp.error);
          const failReason = resp.error?.description || 'Transaction was declined by bank or gateway.';
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
      console.error('Razorpay payment error:', err);
      setErrorMsg(err.message || 'Payment processing error');
      setIsProcessingRazorpay(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
      />

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        data-modal-scroll="true"
        className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10 my-auto text-slate-100 max-h-[92vh] flex flex-col overscroll-contain"
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-xl">
              🛡️
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base sm:text-lg">
                10% Advance Escrow Price Protection
              </h3>
              <p className="text-xs text-slate-400">
                {productTitle} • {Number(quantity).toLocaleString('en-IN')} {unit}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
          {/* Deal Value Overview Card */}
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">
                Total Deal Contract Value
              </span>
              <strong className="text-xl sm:text-2xl font-black text-white font-mono">
                ₹{numTotal.toLocaleString('en-IN')}
              </strong>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">Balance on Delivery</span>
              <span className="text-xs text-slate-300 font-mono font-bold">
                ₹{breakdown.remainingBalance.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* High-Value Cap Notice (if >= 10 Lakhs) */}
          {isHighValue && (
            <div className="p-3.5 bg-emerald-950/70 border border-emerald-500/40 rounded-xl flex items-center gap-2.5 text-xs text-emerald-300">
              <span className="text-lg flex-shrink-0">⭐</span>
              <div>
                <strong>High-Value Deal Cap:</strong> Flat ₹97,640 Escrow Deposit + ₹2,360 UPI Platform Fee (Total: <strong>₹1,00,000</strong>).
              </div>
            </div>
          )}

          {/* Payment Mode Selector */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Choose Payment Method:
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setPaymentOption('upi')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                  paymentOption === 'upi'
                    ? 'bg-emerald-950/70 border-emerald-500 ring-2 ring-emerald-500/30 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-xs text-white flex items-center gap-1.5">
                    <span>⚡</span> Razorpay UPI
                  </span>
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    {isHighValue ? '₹2,360 Fee' : '2.5% + 18% GST'}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400">GPay • PhonePe • Paytm • BHIM</div>
                <div className="text-emerald-400 font-black text-xs font-mono">
                  ₹{breakdown.upi.totalPayable.toLocaleString('en-IN')}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentOption('cards')}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                  paymentOption === 'cards'
                    ? 'bg-indigo-950/70 border-indigo-500 ring-2 ring-indigo-500/30 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-xs text-white flex items-center gap-1.5">
                    <span>💳</span> Cards / NetBanking
                  </span>
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                    2.5% + 18% GST
                  </span>
                </div>
                <div className="text-[10px] text-slate-400">HDFC • SBI • ICICI • EMI</div>
                <div className="text-indigo-400 font-black text-xs font-mono">
                  ₹{breakdown.cards.totalPayable.toLocaleString('en-IN')}
                </div>
              </button>
            </div>
          </div>

          {/* Error Notice & Retry */}
          {errorMsg && (
            <div className="p-3.5 bg-rose-950/90 border-2 border-rose-500 rounded-2xl text-xs font-bold text-rose-200 space-y-2 shadow-md shadow-rose-950/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-rose-300 font-extrabold text-xs">
                  <span>❌</span>
                  <span>Payment Failed / Declined</span>
                </div>
                <span className="text-[9px] font-black uppercase bg-rose-900 text-rose-200 px-2 py-0.5 rounded-full">
                  Order Not Confirmed
                </span>
              </div>
              <p className="text-rose-200 text-[11px] leading-relaxed font-medium">
                {errorMsg}
              </p>
              <div className="pt-1.5 flex items-center gap-2 border-t border-rose-900/60">
                <button
                  type="button"
                  onClick={() => { setErrorMsg(null); handleRazorpayPay(); }}
                  className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-extrabold cursor-pointer transition-all"
                >
                  🔄 Retry Payment
                </button>
                <button
                  type="button"
                  onClick={() => setErrorMsg(null)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Breakdown Summary */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2 text-xs text-slate-400">
            <div className="flex justify-between">
              <span>Advance Escrow Deposit:</span>
              <strong className="text-white font-mono">₹{baseAdvanceAmount.toLocaleString('en-IN')}</strong>
            </div>
            <div className="flex justify-between">
              <span>Gateway & Platform Fee:</span>
              <span className="text-amber-400 font-mono font-bold">+₹{totalFeeAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 pt-1">
              <span>Remaining 90% Balance:</span>
              <span className="font-mono text-slate-300 font-bold">₹{breakdown.remainingBalance.toLocaleString('en-IN')} (At Truck Loading)</span>
            </div>
            <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-sm font-black text-white">
              <span>Total Payable Now (10% Advance):</span>
              <span className="text-xl text-emerald-400 font-mono">₹{totalPayableNow.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Modal Footer & CTA Button */}
        <div className="p-5 sm:p-6 border-t border-slate-800 bg-slate-900/90 space-y-2.5">
          <button
            type="button"
            onClick={handlePayRazorpay}
            disabled={isProcessingRazorpay}
            className="w-full py-3.5 px-5 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {isProcessingRazorpay ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Opening Razorpay Gateway...</span>
              </>
            ) : (
              <>
                <span>🔒</span>
                <span>Pay ₹{totalPayableNow.toLocaleString('en-IN')} with Razorpay</span>
              </>
            )}
          </button>
          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500">
            <span>🛡️ 256-Bit Bank Grade Security</span>
            <span>•</span>
            <span>Razorpay Verified Partner</span>
          </div>
        </div>

        {/* Razorpay Checkout Script */}
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      </motion.div>
    </div>
  );
}
