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
      <div className="rounded-2xl bg-white border border-border-subtle p-5 animate-pulse space-y-3">
        <div className="h-4 bg-slate-200 rounded w-1/3" />
        <div className="h-10 bg-slate-100 rounded-xl" />
        <div className="h-20 bg-slate-50 rounded-xl" />
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
      transition={{ duration: 0.4 }}
      className="rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white p-5 sm:p-6 border border-slate-800 shadow-xl space-y-5"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
            <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-1.5">
              <span>📊 Live APMC Mandi Benchmark Rates</span>
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Benchmarked against major wholesale APMCs across India
          </p>
        </div>

        <a
          href={mandiData.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] text-brand-400 hover:text-brand-300 font-bold bg-brand-500/10 px-2.5 py-1 rounded-full border border-brand-500/20 transition-colors w-fit"
          title="View source on CommodityOnline"
        >
          <span>Source: CommodityOnline</span>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>

      {/* Price Comparison Callout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
        <div className="space-y-1">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            B2B India Factory Rate
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
            ₹{ourPrice.toLocaleString('en-IN')}<span className="text-xs text-slate-400 font-normal"> / {product.unit_label || 'kg'}</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Direct ex-warehouse / manufacturer
          </div>
        </div>

        <div className="space-y-1 sm:border-l sm:border-slate-800 sm:pl-4">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Mandi Modal Average</span>
            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${mandiData.trend === 'up' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
              {mandiData.trend === 'up' ? '▲' : '▼'} {Math.abs(mandiData.change)}% Today
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-mono">
            ₹{Math.round(mandiModalPricePerKg).toLocaleString('en-IN')}<span className="text-xs text-slate-400 font-normal"> / kg</span>
            <span className="text-xs text-slate-400 block sm:inline sm:ml-2 font-mono">
              (₹{mandiData.nationalModalPrice.toLocaleString('en-IN')}/qtl)
            </span>
          </div>
          <div className="text-[11px] text-slate-400">
            Weighted modal average across major APMCs
          </div>
        </div>
      </div>

      {/* Savings Callout Banner */}
      {isLowerThanMandi && (
        <div className="p-3 bg-emerald-950/50 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-emerald-300 font-medium">
            <span className="text-base">🏷️</span>
            <span>
              Direct Wholesale Deal: <strong>Save ₹{diffPerKg.toFixed(2)}/kg ({percentDiff}%)</strong> vs APMC Mandi average!
            </span>
          </div>
          <span className="text-[10px] uppercase font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">
            Best Value
          </span>
        </div>
      )}

      {/* APMC Mandis Table */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs font-bold text-slate-300">
          <span>Regional APMC Mandi Breakdown ({mandiData.mandis?.length || 0} Mandis):</span>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-brand-400 hover:text-brand-300 underline font-semibold text-[11px] cursor-pointer"
          >
            {expanded ? 'Show Less' : 'View All Mandis'}
          </button>
        </div>

        <div className="space-y-2">
          {(expanded ? mandiData.mandis : mandiData.mandis.slice(0, 3)).map((m, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 bg-slate-950/60 hover:bg-slate-950 border border-slate-800/80 rounded-xl text-xs transition-colors"
            >
              <div>
                <div className="font-extrabold text-white flex items-center gap-1.5">
                  <span>{m.market} APMC</span>
                  <span className="text-[10px] font-normal text-slate-400">({m.state})</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Variety: <span className="text-slate-300 font-medium">{m.variety}</span> • Volume: {m.arrivals}
                </div>
              </div>

              <div className="text-right">
                <div className="font-mono font-black text-white text-sm">
                  ₹{m.modalPrice.toLocaleString('en-IN')}<span className="text-[10px] text-slate-400 font-normal">/qtl</span>
                </div>
                <div className="text-[11px] font-mono text-emerald-400">
                  ₹{m.pricePerKg.toFixed(2)}/kg
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Market Commentary */}
      {mandiData.marketSummary && (
        <div className="p-3 bg-slate-950/40 border border-slate-800/80 rounded-xl text-[11px] text-slate-400 leading-relaxed">
          <strong className="text-slate-300">Market Insight: </strong>
          {mandiData.marketSummary}
        </div>
      )}

      {/* Footer Navigation */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800 text-xs">
        <span className="text-[11px] text-slate-400">
          Updated live today from CommodityOnline &amp; APMC Agmarknet
        </span>
        <Link
          href="/market-rates"
          className="text-brand-400 hover:text-brand-300 font-bold flex items-center gap-1"
        >
          <span>Open Full Mandi Rates Terminal</span>
          <span>→</span>
        </Link>
      </div>
    </motion.div>
  );
}
