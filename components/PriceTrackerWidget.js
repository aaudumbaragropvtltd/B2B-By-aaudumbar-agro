"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

const INITIAL_COMMODITIES = [
  { id: 'turmeric', name: 'Turmeric (Haldi)', market: 'Nizamabad APMC', price: 14650, unit: 'per Quintal', change: 1.8, trend: 'up' },
  { id: 'red-chilli', name: 'Red Chilli (Teja)', market: 'Guntur APMC', price: 18400, unit: 'per Quintal', change: 2.4, trend: 'up' },
  { id: 'cumin-seeds', name: 'Cumin Seeds (Jeera)', market: 'Unjha APMC', price: 28600, unit: 'per Quintal', change: 3.2, trend: 'up' },
  { id: 'soyabean', name: 'Soyabean (Yellow)', market: 'Indore Mandi', price: 4720, unit: 'per Quintal', change: -0.6, trend: 'down' },
];

export default function PriceTrackerWidget() {
  const [commodities, setCommodities] = useState(INITIAL_COMMODITIES);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isLive, setIsLive] = useState(false);

  // Fetch live rates from Gemini API endpoint
  useEffect(() => {
    async function fetchLiveRates() {
      try {
        const res = await fetch('/api/market-rates/live');
        if (res.ok) {
          const data = await res.json();
          if (data.commodities && Array.isArray(data.commodities)) {
            setCommodities(data.commodities.slice(0, 4));
            setLastUpdated(new Date(data.lastUpdated || Date.now()));
            setIsLive(true);
          }
        }
      } catch (err) {
        console.warn('Live rates fetch notice:', err.message);
      }
    }

    fetchLiveRates();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchLiveRates();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 overflow-hidden hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📈</span>
            <h2 className="text-lg font-black text-gray-900 tracking-tight">
              Live Mandi Commodity Rates
            </h2>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              CommodityOnline APMC
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1" suppressHydrationWarning>
            Source: CommodityOnline • Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString('en-IN') : 'Just now'}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {commodities.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-3 rounded-2xl bg-gray-50/60 hover:bg-emerald-50/40 transition-all border border-gray-100/80 hover:border-emerald-200"
          >
            <div>
              <h3 className="font-extrabold text-sm text-gray-900 leading-tight">
                {item.name}
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5">
                {item.market ? `${item.market} • ` : ''}{item.unit}
              </p>
            </div>

            <div className="text-right">
              <AnimatePresence mode="popLayout">
                <motion.div
                  key={item.price}
                  initial={{ y: -6, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 6, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="font-mono font-black text-sm text-gray-900"
                >
                  ₹{Number(item.price).toLocaleString('en-IN')}
                </motion.div>
              </AnimatePresence>

              <div
                className={`text-[11px] font-extrabold flex items-center justify-end gap-1 mt-0.5 ${
                  item.trend === 'up' ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                <span>{item.trend === 'up' ? '▲' : '▼'}</span>
                <span>{Math.abs(item.change)}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Link
        href="/market-rates"
        className="w-full mt-5 py-3 px-4 text-xs font-extrabold text-brand-600 bg-brand-50 hover:bg-brand-100 hover:text-brand-700 rounded-2xl transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center group"
      >
        <span>View All Markets & APMC Mandis</span>
        <span className="group-hover:translate-x-0.5 transition-transform">→</span>
      </Link>
    </div>
  );
}
