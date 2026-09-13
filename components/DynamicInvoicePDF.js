"use client";
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function DynamicInvoicePDF({ invoiceData }) {
  const [invoiceId, setInvoiceId] = useState('');
  useEffect(() => { 
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setInvoiceId(`INV-${Date.now()}`); 
  }, []);

  const data = invoiceData || {
    invoiceId: invoiceId || 'INV-0000000',
    orderId: "OR-9284-A",
    commodityName: "Organic Bulk Turmeric",
    grossAmount: 185000.00,
    platformFee: 2000.00,
    supplierPayout: 183000.00,
    accommodationApplied: true
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-2xl mx-auto bg-white border border-gray-200 rounded-2xl shadow-2xl relative overflow-hidden"
    >
      {/* Top accent bar — Navy → Orange → Green */}
      <div className="h-1.5" style={{ background: 'linear-gradient(90deg, #1B3A5C, #E8792B, #4A8C3F)' }} />
      
      {/* Header */}
      <div className="px-8 pt-6 pb-5 flex justify-between items-start" style={{ background: 'linear-gradient(135deg, #1B3A5C 0%, #234b73 100%)' }}>
        <div>
          <h2 className="text-xl font-black text-white tracking-wider">B2B INDIA</h2>
          <p className="text-[10px] font-bold tracking-widest uppercase mt-0.5" style={{ color: '#E8792B' }}>by Aaudumbar Agro Pvt. Ltd.</p>
          <p className="text-[11px] text-white/50 mt-2">Plot No. 5, Prerna Nagar, Garkheda Parisar</p>
          <p className="text-[11px] text-white/50">Chhatrapati Sambhajinagar 431009, Maharashtra</p>
        </div>
        <div className="text-right">
          <div className="inline-block px-4 py-1.5 rounded-md text-[10px] font-extrabold tracking-widest uppercase text-white" style={{ background: '#E8792B' }}>
            INVOICE
          </div>
          <div className="font-mono text-xs text-white/60 mt-2">{data.invoiceId}</div>
          <div className="font-mono text-[11px] text-white/50 mt-0.5">{new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>
      </div>

      {/* Body */}
      <div className="px-8 py-6 space-y-4">
        {/* Order Details */}
        <div className="grid grid-cols-2 gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/50">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Order ID</div>
            <div className="font-mono text-sm font-bold" style={{ color: '#1B3A5C' }}>{data.orderId}</div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Product</div>
            <div className="text-sm font-semibold text-gray-800">{data.commodityName}</div>
          </div>
        </div>
        
        {data.accommodationApplied && (
          <div className="p-3 rounded-xl flex justify-between items-center text-xs font-medium border" style={{ background: '#4A8C3F10', borderColor: '#4A8C3F30', color: '#4A8C3F' }}>
            <span>🏨 Early Arrival Hotel Perk Activated</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase text-white" style={{ background: '#4A8C3F' }}>Covered by Platform</span>
          </div>
        )}

        {/* Financial Breakdown */}
        <div className="border border-gray-100 rounded-xl overflow-hidden">
          <div className="flex justify-between items-center px-5 py-3 border-b border-gray-100">
            <span className="text-sm text-gray-500">Gross Contract Amount</span>
            <span className="text-sm font-bold text-gray-900">₹{data.grossAmount.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between items-center px-5 py-3 border-b border-gray-100 bg-gray-50/30">
            <span className="text-sm text-gray-500">Platform Processing Fee (Fixed ₹2/kg)</span>
            <span className="text-sm font-bold text-red-500">− ₹{data.platformFee.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between items-center px-5 py-4" style={{ background: '#1B3A5C' }}>
            <span className="text-sm font-bold text-white">Supplier Net Payout</span>
            <span className="text-lg font-extrabold" style={{ color: '#E8792B' }}>₹{data.supplierPayout.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-8 py-4 border-t border-gray-100 flex items-center justify-between">
        <div className="text-[10px] text-gray-400 font-medium">GSTIN: 27ABACA6256A1Z2</div>
        <div className="text-[10px] font-mono text-gray-400">Verified via B2B India Escrow Ledger</div>
      </div>

      {/* Bottom accent bar */}
      <div className="h-1" style={{ background: 'linear-gradient(90deg, #1B3A5C, #E8792B, #4A8C3F)' }} />
    </motion.div>
  );
}
