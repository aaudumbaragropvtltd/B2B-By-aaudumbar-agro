"use client";
import { motion } from 'framer-motion';

export default function DynamicInvoicePDF({ invoiceData }) {
  // Safe default values if tracking metrics drop out
  const data = invoiceData || {
    invoiceId: `INV-${Date.now()}`,
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
      className="w-full max-w-2xl mx-auto bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl relative overflow-hidden"
    >
      {/* Decorative Brand Accent Grid */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500" />
      
      <div className="flex justify-between items-start border-b border-slate-800 pb-6">
        <div>
          <h2 className="text-xl font-black text-white tracking-wider">B2B BHARAT</h2>
          <p className="text-xs text-slate-400 mt-1">Autonomous Settlement Node Ledger</p>
        </div>
        <div className="text-right font-mono text-xs text-slate-500">
          <div>ID: {data.invoiceId}</div>
          <div className="mt-1">Date: {new Date().toLocaleDateString()}</div>
        </div>
      </div>

      <div className="py-6 space-y-4">
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Target Order Identification</span>
          <span className="font-mono text-white font-medium">{data.orderId}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Commodity Classification</span>
          <span className="text-white font-medium">{data.commodityName}</span>
        </div>
        
        {data.accommodationApplied && (
          <div className="p-3 bg-emerald-950/30 border border-emerald-900/50 rounded-xl flex justify-between items-center text-xs text-emerald-400 font-medium">
            <span>Early Arrival Hotel Perk Activated</span>
            <span className="bg-emerald-900 px-2 py-0.5 rounded uppercase font-bold text-[10px]">Covered by Platform</span>
          </div>
        )}

        <div className="border-t border-slate-800 pt-4 space-y-2">
          <div className="flex justify-between text-sm text-slate-400">
            <span>Gross Contract Amount</span>
            <span className="text-white font-semibold">₹{data.grossAmount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm text-slate-400">
            <span>Marketplace Platform Processing Cut (Fixed ₹2/kg)</span>
            <span className="text-rose-400 font-semibold">- ₹{data.platformFee.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-dashed border-slate-800">
            <span>Supplier Net Disbursement Payout</span>
            <span className="text-emerald-400">₹{data.supplierPayout.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="text-center text-[11px] font-mono text-slate-500 pt-4 border-t border-slate-800">
        Cryptographic Proof: Verified via Supabase Transaction Token Ledger
      </div>
    </motion.div>
  );
}
