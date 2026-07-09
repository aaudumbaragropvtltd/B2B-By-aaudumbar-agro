"use client";
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function OrderLifecycleTracker() {
  const [orders, setOrders] = useState([
    { id: "T-8092", product: "Organic Turmeric Grade-A", qty: "10,000 kg", stage: "price_locked", total: "₹16,500" },
    { id: "M-4412", product: "Industrial Cotton Yarn", qty: "5,500 kg", stage: "settled", total: "₹92,000" }
  ]);

  const stagesMatrix = ['quotation', 'price_locked', 'loading', 'settled'];

  return (
    <div className="min-h-screen bg-[#05070f] text-white p-8 pt-24">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight">Active Escrow Contracts</h1>
        <p className="text-slate-400 text-sm mt-1">Real-time status tracking for cross-industry trades</p>

        <div className="space-y-6 mt-10">
          {orders.map((order) => {
            const currentStageIdx = stagesMatrix.indexOf(order.stage);

            return (
              <motion.div 
                layout 
                key={order.id} 
                className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl backdrop-blur-md"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div>
                    <span className="text-xs font-mono text-indigo-400 font-semibold">{order.id}</span>
                    <h3 className="text-lg font-bold tracking-tight mt-0.5">{order.product}</h3>
                    <p className="text-xs text-slate-400 mt-1">Volume: {order.qty} | Value: {order.total}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${
                      order.stage === 'settled' ? 'bg-emerald-950 text-emerald-400 border border-emerald-900' : 'bg-indigo-950 text-indigo-400 border border-indigo-900'
                    }`}>
                      Stage: {order.stage.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Status Progress Bar Components */}
                <div className="relative w-full h-1.5 bg-slate-950 rounded-full overflow-hidden mb-4">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentStageIdx + 1) / stagesMatrix.length) * 100}%` }}
                    transition={{ duration: 1, ease: "easeInOut" }}
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 via-blue-500 to-emerald-400 rounded-full"
                  />
                </div>

                <div className="grid grid-cols-4 text-center text-[10px] md:text-xs font-mono text-slate-500 font-semibold uppercase tracking-wider">
                  {stagesMatrix.map((stg, i) => (
                    <span key={stg} className={i <= currentStageIdx ? "text-indigo-400" : ""}>
                      {stg.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
