"use client";

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import RazorpayCheckoutButton from '@/components/RazorpayCheckoutButton';

export default function TestRazorpayPage() {
  const [testAmount, setTestAmount] = useState(100);
  const [paymentResult, setPaymentResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [dismissedNotice, setDismissedNotice] = useState(false);

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 pt-28 pb-16 px-4 max-w-4xl mx-auto w-full">
        <div className="bg-white rounded-3xl p-8 md:p-10 shadow-xl border border-slate-100 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl text-xl">💳</span>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                Razorpay Standard Web Checkout
              </h1>
              <p className="text-slate-500 text-sm font-medium mt-0.5">
                Interactive verification and payment testing environment
              </p>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 mb-6 text-xs text-amber-900 flex items-center gap-3">
            <span className="text-base">ℹ️</span>
            <div>
              <strong className="font-bold">Active Mode:</strong> Live Gateway Connected (<code className="bg-emerald-100/80 text-emerald-950 px-1.5 py-0.5 rounded font-mono font-bold">rzp_live_TbvASSd9EMGeDz</code>). Live payments active.
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Order Amount (₹ INR)
              </label>
              <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-xs">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    min="1"
                    value={testAmount}
                    onChange={(e) => {
                      setTestAmount(Math.max(1, Number(e.target.value) || 1));
                      setPaymentResult(null);
                      setErrorMessage(null);
                      setDismissedNotice(false);
                    }}
                    className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-base"
                  />
                </div>
                <div className="flex gap-2">
                  {[100, 500, 2000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        setTestAmount(amt);
                        setPaymentResult(null);
                        setErrorMessage(null);
                        setDismissedNotice(false);
                      }}
                      className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all ${
                        testAmount === amt
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2">
              <RazorpayCheckoutButton
                amount={testAmount}
                currency="INR"
                name="B2B India Wholesale"
                description={`Escrow Advance Test Order (₹${testAmount})`}
                orderReceipt={`rcpt_demo_${Date.now().toString().slice(-6)}`}
                prefill={{
                  name: 'Demo Wholesale Buyer',
                  email: 'buyer@b2bindia.site',
                  contact: '9876543210',
                }}
                themeColor="#2563eb"
                buttonText="Pay with Razorpay Standard Modal"
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-base rounded-2xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-3 cursor-pointer"
                onSuccess={(res) => {
                  setPaymentResult(res);
                  setErrorMessage(null);
                  setDismissedNotice(false);
                }}
                onError={(err) => {
                  setErrorMessage(err.message || 'Payment initiation or processing failed');
                  setDismissedNotice(false);
                }}
                onDismiss={() => {
                  setDismissedNotice(true);
                }}
              />
            </div>
          </div>

          {/* Dismiss Alert */}
          {dismissedNotice && (
            <div className="mt-6 p-4 rounded-2xl bg-slate-100 border border-slate-200 text-slate-700 text-sm flex items-center gap-2">
              <span>⚠️</span>
              <span>Payment modal was dismissed by the user without completing checkout.</span>
            </div>
          )}

          {/* Error Alert */}
          {errorMessage && (
            <div className="mt-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
              <span className="text-lg">❌</span>
              <div>
                <strong className="font-bold block">Payment Error</strong>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {/* Success Result */}
          {paymentResult && (
            <div className="mt-6 p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">✅</span>
                <h3 className="font-extrabold text-base text-emerald-900">
                  Payment Signature Verified & Confirmed!
                </h3>
              </div>
              <div className="bg-white/80 backdrop-blur rounded-xl p-4 font-mono text-xs text-slate-700 space-y-1.5 border border-emerald-100">
                <div><strong>Payment ID:</strong> {paymentResult.paymentId}</div>
                <div><strong>Order ID:</strong> {paymentResult.orderId}</div>
                <div><strong>Signature:</strong> <span className="break-all">{paymentResult.signature}</span></div>
                <div><strong>Verification Status:</strong> {paymentResult.details?.verified ? 'VERIFIED (HMAC-SHA256 Match)' : 'SUCCESS'}</div>
              </div>
            </div>
          )}
        </div>

        {/* Integration Architecture Card */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm">
          <h2 className="text-lg font-black text-slate-900 mb-4">Architecture & Endpoints</h2>
          <div className="grid md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="font-bold text-slate-900 block mb-1">1. Create Order</span>
              <code className="text-blue-600 font-bold block mb-1">POST /api/create-order</code>
              <p className="text-slate-500">Creates official order via Razorpay REST API with min 100 paise validation.</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="font-bold text-slate-900 block mb-1">2. Standard Modal</span>
              <code className="text-purple-600 font-bold block mb-1">RazorpayCheckoutButton</code>
              <p className="text-slate-500">Injects checkout.js, handles user interaction, dismissals, and failures.</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="font-bold text-slate-900 block mb-1">3. Verify Signature</span>
              <code className="text-emerald-600 font-bold block mb-1">POST /api/verify-payment</code>
              <p className="text-slate-500">Validates HMAC-SHA256 signature using secret key before fulfilling order.</p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
