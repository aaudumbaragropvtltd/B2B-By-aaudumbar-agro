"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function MandiBenchmarkCard({ product }) {
  const [mandiData, setMandiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    async function loadMandiRates() {
      if (!product?.title) return;
      try {
        setLoading(true);
        const res = await fetch(`/api/market-rates/live?commodity=${encodeURIComponent(product.title)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.commodity) {
            setMandiData(data.commodity);
          }
        }
      } catch (err) {
        console.warn('Could not load mandi benchmark for product:', err);
      } finally {
        setLoading(false);
      }
    }

    loadMandiRates();
  }, [product?.title]);

  if (loading) {
    return (
      <div className="rounded-2xl sm:rounded-3xl bg-white border border-slate-200 p-4 sm:p-6 animate-pulse space-y-3 shadow-xs">
        <div className="h-4 bg-slate-200 rounded-md w-1/3" />
        <div className="h-14 bg-slate-100 rounded-2xl" />
        <div className="h-20 bg-slate-50 rounded-2xl" />
      </div>
    );
  }

  // Only render for commodities with matching Mandi benchmarks
  if (!mandiData) return null;

  const ourPrice = Number(product.base_price_per_unit) || 0;
  const mandiModalPricePerKg = mandiData.pricePerKg || (mandiData.nationalModalPrice / 100);
  const diffPerKg = mandiModalPricePerKg - ourPrice;
  const isLowerThanMandi = diffPerKg > 0;
  const percentDiff = Math.abs(Number(((diffPerKg / mandiModalPricePerKg) * 100).toFixed(1)));

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-2xl sm:rounded-3xl bg-white text-slate-900 p-4 sm:p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow space-y-4 sm:space-y-5 overflow-hidden"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 sm:pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse ring-4 ring-emerald-100" />
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
              <span>📊 Live APMC Mandi Benchmark Rates</span>
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Benchmarked against major wholesale APMCs across India
          </p>
        </div>

        <a
          href={mandiData.sourceUrl || 'https://www.commodityonline.com/mandiprices/turmeric'}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[11px] text-indigo-700 hover:text-indigo-800 font-bold bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 px-3 py-1 rounded-full transition-colors w-fit self-start sm:self-auto"
          title="View source on CommodityOnline"
        >
          <span>Source: CommodityOnline</span>
          <span className="text-[10px]">↗</span>
        </a>
      </div>

      {/* Price Comparison Callout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 border border-slate-200/80 shadow-xs">
        <div className="space-y-1">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            B2B India Factory Rate
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono">
            ₹{ourPrice.toLocaleString('en-IN')}<span className="text-xs text-slate-500 font-normal"> / {product.unit_label || 'kg'}</span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Direct ex-warehouse / manufacturer rate
          </div>
        </div>

        <div className="space-y-1 pt-3 sm:pt-0 sm:border-l sm:border-slate-200 sm:pl-4 border-t border-slate-100 sm:border-t-0">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Mandi Modal Average</span>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${mandiData.trend === 'up' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
              {mandiData.trend === 'up' ? '▲' : '▼'} {Math.abs(mandiData.change)}% Today
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
            ₹{Math.round(mandiModalPricePerKg).toLocaleString('en-IN')}<span className="text-xs text-slate-500 font-normal"> / kg</span>
            <span className="text-xs text-slate-500 block sm:inline sm:ml-2 font-mono font-medium">
              (₹{mandiData.nationalModalPrice.toLocaleString('en-IN')}/qtl)
            </span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Weighted modal average across major APMCs
          </div>
        </div>
      </div>

      {/* Savings Callout Banner */}
      {isLowerThanMandi && (
        <div className="p-3 sm:p-3.5 bg-emerald-50 border border-emerald-200/90 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-start sm:items-center gap-2 text-emerald-900 font-medium leading-relaxed">
            <span className="text-base leading-none">🏷️</span>
            <span>
              Direct Wholesale Deal: <strong>Save ₹{diffPerKg.toFixed(2)}/kg ({percentDiff}%)</strong> vs APMC Mandi average!
            </span>
          </div>
          <span className="text-[10px] uppercase font-black tracking-wider bg-emerald-600 text-white px-2.5 py-1 rounded-full w-fit self-start sm:self-auto shadow-xs">
            Best Value
          </span>
        </div>
      )}

      {/* APMC Mandis Breakdown */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
          <span>Regional APMC Mandi Breakdown ({mandiData.mandis?.length || 0} Mandis):</span>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-emerald-700 hover:text-emerald-800 font-bold text-xs py-1 px-2.5 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
          >
            {expanded ? '▲ Show Less' : '▼ View All Mandis'}
          </button>
        </div>

        <div className="space-y-2">
          {(expanded ? mandiData.mandis : mandiData.mandis.slice(0, 3)).map((m, idx) => (
            <div
              key={idx}
              className="p-3 bg-slate-50/80 hover:bg-slate-100/90 border border-slate-200/70 rounded-xl text-xs transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div className="min-w-0">
                <div className="font-extrabold text-slate-900 flex items-center gap-1.5 flex-wrap">
                  <span className="truncate">{m.market} APMC</span>
                  <span className="text-[10px] font-medium text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200/60">
                    {m.state}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Variety: <span className="text-slate-700 font-semibold">{m.variety}</span> • Volume: {m.arrivals}
                </div>
              </div>

              <div className="flex sm:flex-col justify-between sm:text-right sm:items-end items-center border-t border-slate-200/50 sm:border-t-0 pt-1.5 sm:pt-0">
                <div className="font-mono font-black text-slate-900 text-sm sm:text-base">
                  ₹{m.modalPrice.toLocaleString('en-IN')}<span className="text-[10px] text-slate-500 font-normal">/qtl</span>
                </div>
                <div className="text-[11px] font-mono font-bold text-emerald-700">
                  ₹{m.pricePerKg.toFixed(2)}/kg
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Market Commentary */}
      {mandiData.marketSummary && (
        <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-[11px] text-amber-950 leading-relaxed">
          <strong className="text-amber-900 font-bold">Market Insight: </strong>
          {mandiData.marketSummary}
        </div>
      )}

      {/* Footer Navigation */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2.5 border-t border-slate-100 text-xs">
        <span className="text-[11px] text-slate-500 text-center sm:text-left">
          Updated live from CommodityOnline &amp; APMC Agmarknet
        </span>
        <Link
          href="/market-rates"
          className="text-emerald-700 hover:text-emerald-800 font-extrabold flex items-center gap-1 hover:underline text-xs"
        >
          <span>Open Full Mandi Rates Terminal</span>
          <span>→</span>
        </Link>
      </div>
    </motion.div>
  );
}
