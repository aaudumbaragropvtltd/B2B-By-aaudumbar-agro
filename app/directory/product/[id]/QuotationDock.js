"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function QuotationDock({ product }) {
  const [quantity, setQuantity] = useState(product.bulk_minimum_order);
  const [weight, setWeight] = useState(product.unit_label === 'kg' ? product.bulk_minimum_order : '');
  const [distance, setDistance] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quoteResult, setQuoteResult] = useState(null);
  const [error, setError] = useState(null);

  const subtotal = quantity * product.base_price_per_unit;
  const gst = subtotal * 0.18;
  const total = subtotal + gst;

  const handleGetQuote = async () => {
    if (!weight || isNaN(weight) || parseFloat(weight) <= 0) {
      setError('Please provide the total weight in kg.');
      return;
    }
    if (!distance || isNaN(distance) || parseFloat(distance) <= 0) {
      setError('Please provide distance in km.');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch('/api/quotation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          buyerId: 'dummy-buyer-id-for-testing', // Replace with real auth user later
          productId: product.id,
          quantity: quantity,
          weightKg: parseFloat(weight),
          distanceKm: parseFloat(distance),
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate quotation');
      }
      
      setQuoteResult(data.quotation);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="rounded-2xl bg-white border border-border-subtle p-6 sticky top-24"
      >
        {quoteResult ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-lg text-gray-900">Quotation Ready</h3>
              <span className="px-2 py-1 bg-success-50 text-success-700 text-xs font-bold rounded-full border border-success-200">
                Valid for {quoteResult.validForHours}h
              </span>
            </div>
            
            <div className="space-y-2 text-sm bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div className="flex justify-between">
                <span className="text-gray-500">Base Cost</span>
                <span className="font-medium">₹{quoteResult.subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Logistics ({quoteResult.distanceKm} km)</span>
                <span className="font-medium">₹{quoteResult.logisticsCost.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">GST (18%)</span>
                <span className="font-medium">₹{quoteResult.taxAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between mt-2">
                <span className="font-bold text-gray-900">Total Contract Value</span>
                <span className="font-extrabold text-gray-900">₹{quoteResult.totalContractValue.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-brand-600 bg-brand-50 p-2 rounded-lg mt-2 border border-brand-100">
                <span className="font-medium">10% Advance (Lock Fee)</span>
                <span className="font-bold">₹{quoteResult.advanceRequired10.toLocaleString('en-IN')}</span>
              </div>
            </div>
            
            <button
              onClick={() => setQuoteResult(null)}
              className="w-full py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-colors text-sm"
            >
              Modify Details
            </button>
            <button
              className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 text-white font-semibold shadow-md hover:shadow-lg transition-all active:scale-95 text-sm"
            >
              Pay 10% Advance & Lock
            </button>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <span className="text-3xl font-extrabold text-gray-900">
                ₹{Number(product.base_price_per_unit).toLocaleString('en-IN')}
              </span>
              <span className="text-gray-400 ml-1">/{product.unit_label}</span>
            </div>

            <div className="text-xs text-gray-400 mb-4">
              Min. Order: {product.bulk_minimum_order} {product.unit_label}
            </div>

            <div className="space-y-4 mb-6">
              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Quantity ({product.unit_label})
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => {
                    const newQty = Math.max(product.bulk_minimum_order, Number(e.target.value));
                    setQuantity(newQty);
                    if (product.unit_label === 'kg') setWeight(newQty);
                  }}
                  min={product.bulk_minimum_order}
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              {/* Weight */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Total Weight (kg)</label>
                <input
                  type="number"
                  step="any"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="e.g. 14000"
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-sm focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                />
              </div>

              {/* Distance */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Distance (km)</label>
                <input
                  type="number"
                  step="any"
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                  placeholder="e.g. 300"
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-sm focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                />
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-xs font-medium border border-red-100">
                {error}
              </div>
            )}

            {/* Estimated Subtotal */}
            <div className="space-y-2 mb-6 text-sm text-gray-500">
              <div className="flex justify-between">
                <span>Product Subtotal</span>
                <span className="font-medium text-gray-900">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <p className="text-[10px] italic">Logistics & Taxes calculated upon quote request.</p>
            </div>

            {/* CTA */}
            <button
              onClick={handleGetQuote}
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 text-white font-semibold shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 transition-all active:scale-95 text-sm disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Calculating...
                </>
              ) : (
                'Request Instant Quotation →'
              )}
            </button>
            <p className="text-center text-[10px] text-gray-400 mt-3">
              Escrow-protected · 10% advance locks price
            </p>
          </>
        )}
      </motion.div>

      {/* Supplier Card */}
      <div className="rounded-2xl bg-white border border-border-subtle p-6">
        <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-success-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
          Verified Supplier
        </h3>
        <div className="space-y-3 text-sm">
          <div>
            <div className="font-bold text-gray-900 text-base">{product.supplier_id?.company_name || 'Verified Supplier'}</div>
            <div className="text-gray-500 text-xs mt-0.5">{product.supplier_id?.city || 'India'}, {product.supplier_id?.state || ''}</div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="p-3 rounded-xl bg-gray-50 text-center border border-gray-100">
              <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1">Established</div>
              <div className="font-bold text-gray-900">{product.supplier_id?.year_established || 'N/A'}</div>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 text-center border border-gray-100">
              <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1">Status</div>
              <div className="font-bold text-success-600 capitalize">{product.supplier_id?.status?.replace('_', ' ') || 'Active'}</div>
            </div>
          </div>
          
          {product.supplier_id?.gst_number && (
            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
              <span className="text-gray-500">GSTIN</span>
              <span className="font-mono font-medium text-gray-900">{product.supplier_id.gst_number}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
