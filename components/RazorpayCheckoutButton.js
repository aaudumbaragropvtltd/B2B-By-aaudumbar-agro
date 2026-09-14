"use client";

// ============================================================================
// RAZORPAY STANDARD WEB CHECKOUT BUTTON COMPONENT
// ============================================================================
// Reusable React component for Razorpay Standard Checkout.
// 1. Loads Razorpay checkout.js script
// 2. Initiates backend order via /api/create-order
// 3. Opens Razorpay popup modal with order details
// 4. Verifies payment signature on backend via /api/verify-payment
// 5. Handles dismiss, success, and payment failures with callbacks
// ============================================================================

import React, { useState, useEffect } from 'react';

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if (window.Razorpay) return resolve(true);

    const existingScript = document.getElementById('razorpay-checkout-script');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true));
      existingScript.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.id = 'razorpay-checkout-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function RazorpayCheckoutButton({
  amount = 100, // in INR (Rupees)
  currency = 'INR',
  name = 'B2B India',
  description = 'Wholesale Escrow Advance',
  orderReceipt = null,
  prefill = {},
  notes = {},
  themeColor = '#ea580c',
  buttonText = 'Pay Securely with Razorpay',
  className = '',
  disabled = false,
  onSuccess,
  onError,
  onDismiss,
  children
}) {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRazorpayScript();
  }, []);

  const handleCheckout = async (e) => {
    if (e) e.preventDefault();
    if (disabled || loading) return;

    setLoading(true);

    try {
      // 1. Ensure Razorpay SDK is loaded
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded || !window.Razorpay) {
        throw new Error('Razorpay SDK failed to load. Please check your internet connection.');
      }

      // 2. Call backend /api/create-order
      const orderRes = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          currency,
          receipt: orderReceipt || `rcpt_${Date.now().toString().slice(-8)}`,
          notes: {
            ...notes,
            product_deal: description,
          },
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData.success) {
        throw new Error(orderData.error || 'Failed to initiate Razorpay order.');
      }

      const keyId = orderData.key_id || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_live_TbvASSd9EMGeDz';

      // 3. Configure Razorpay checkout options
      const options = {
        key: keyId,
        amount: orderData.amount, // in paise
        currency: orderData.currency || 'INR',
        name,
        description,
        order_id: orderData.order_id || orderData.id,
        prefill: {
          name: prefill.name || 'Enterprise Buyer',
          email: prefill.email || 'buyer@domain.in',
          contact: prefill.contact || '9820145678',
          ...prefill,
        },
        notes: {
          ...notes,
          order_id: orderData.order_id,
        },
        theme: {
          color: themeColor,
        },
        handler: async function (response) {
          // 4. Verify payment signature on backend
          try {
            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderId: notes?.internal_order_id || null,
              }),
            });

            const verifyData = await verifyRes.json();

            if (verifyRes.ok && verifyData.success) {
              if (onSuccess) {
                onSuccess({
                  paymentId: response.razorpay_payment_id,
                  orderId: response.razorpay_order_id,
                  signature: response.razorpay_signature,
                  details: verifyData,
                });
              }
            } else {
              const errMsg = verifyData.error || 'Payment signature verification failed.';
              if (onError) onError(new Error(errMsg));
              else alert('Payment verification error: ' + errMsg);
            }
          } catch (vErr) {
            console.error('Payment verification error:', vErr);
            if (onError) onError(vErr);
            else alert('Payment verification network error. Please contact support.');
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            if (onDismiss) onDismiss();
          },
        },
      };

      const rzpInstance = new window.Razorpay(options);
      rzpInstance.on('payment.failed', function (resp) {
        const errorDesc = resp.error?.description || 'Transaction was declined.';
        console.error('Razorpay payment failed:', resp.error);
        if (onError) onError(new Error(errorDesc));
        else alert(`Payment Failed: ${errorDesc}`);
        setLoading(false);
      });

      rzpInstance.open();

    } catch (err) {
      console.error('Checkout error:', err);
      if (onError) onError(err);
      else alert(err.message || 'Payment initiation failed.');
      setLoading(false);
    }
  };

  const defaultClasses = "px-6 py-3.5 bg-gradient-to-r from-brand-600 to-amber-600 hover:from-brand-700 hover:to-amber-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-brand-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <button
      type="button"
      onClick={handleCheckout}
      disabled={disabled || loading}
      className={className || defaultClasses}
    >
      {loading ? (
        <>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span>Opening Razorpay Gateway...</span>
        </>
      ) : (
        children || (
          <>
            <span>⚡</span>
            <span>{buttonText} (₹{Number(amount).toLocaleString('en-IN')})</span>
          </>
        )
      )}
    </button>
  );
}
