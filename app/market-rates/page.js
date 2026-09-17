// ============================================================================
// LIVE COMMODITY MARKET INTELLIGENCE TERMINAL — ALL MARKETS
// ============================================================================
// Real-time APMC Mandi commodity rates across India.
// Sourced from CommodityOnline, APMC Agmarknet, and Gemini AI Analysis.
// ============================================================================

"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

const CATEGORIES = [
  'All Categories',
  'Spices & Herbs',
  'Grains & Cereals',
  'Pulses & Oilseeds',
  'Vegetables & Fruits',
  'Commercial Crops',
];

export default function MarketRatesPage() {
  const [commodities, setCommodities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedState, setSelectedState] = useState('All States');
  const [searchQuery, setSearchQuery] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [expandedCardId, setExpandedCardId] = useState(null);

  const fetchRates = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      const url = isManual ? '/api/market-rates/live?refresh=true' : '/api/market-rates/live';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.commodities && Array.isArray(data.commodities)) {
          setCommodities(data.commodities);
          setLastUpdated(new Date(data.lastUpdated || Date.now()));
        }
      }
    } catch (err) {
      console.error('Error loading market rates:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRates();
    const interval = setInterval(() => fetchRates(), 45000);
    return () => clearInterval(interval);
  }, []);

  // Filter logic
  const states = ['All States', ...Array.from(new Set(commodities.map((c) => c.state).filter(Boolean)))];

  const filteredCommodities = commodities.filter((item) => {
    const matchesCategory =
      selectedCategory === 'All Categories' || item.category === selectedCategory;
    const matchesState = selectedState === 'All States' || item.state === selectedState;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      item.name.toLowerCase().includes(q) ||
      (item.market && item.market.toLowerCase().includes(q)) ||
      (item.state && item.state.toLowerCase().includes(q)) ||
      (item.grade && item.grade.toLowerCase().includes(q));

    return matchesCategory && matchesState && matchesSearch;
  });

  // Calculate market stats
  const gainers = commodities.filter((c) => c.trend === 'up').length;
  const losers = commodities.filter((c) => c.trend === 'down').length;

  const toggleExpand = (id) => {
    setExpandedCardId(expandedCardId === id ? null : id);
  };

  return (
    <>
      <Navbar />

      <main className="min-h-screen pt-24 pb-20 bg-slate-950 text-slate-100 antialiased selection:bg-brand-500 selection:text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* ── TOP TERMINAL HERO BANNER ── */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    Live Mandi Feed
                  </span>
                  <a
                    href="https://www.commodityonline.com/mandiprices/turmeric"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold hover:bg-indigo-500/30 transition-colors flex items-center gap-1"
                  >
                    <span>Source: CommodityOnline &amp; APMC Network</span>
                    <span className="text-[10px]">↗</span>
                  </a>
                </div>
                <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                  India APMC Commodity Rates Terminal
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
                  Real-time wholesale modal pricing, daily arrivals, and 24h market trends aggregated from <strong>CommodityOnline</strong> and agricultural APMC Mandis across India.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => fetchRates(true)}
                  disabled={refreshing}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <span className={refreshing ? 'animate-spin' : ''}>🔄</span>
                  <span>{refreshing ? 'Updating Mandis...' : 'Refresh Live Rates'}</span>
                </button>

                <Link
                  href="/directory"
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-all flex items-center gap-1.5"
                >
                  <span>Browse Product Directory</span>
                  <span>→</span>
                </Link>
              </div>
            </div>

            {/* Live Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800 text-xs">
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                <span className="text-slate-400 block text-[11px]">Tracked Commodities</span>
                <strong className="text-white text-base font-mono">{commodities.length} Agricultural Staples</strong>
              </div>
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                <span className="text-slate-400 block text-[11px]">Bullish Trends</span>
                <strong className="text-emerald-400 text-base font-mono">▲ {gainers} Commodities</strong>
              </div>
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                <span className="text-slate-400 block text-[11px]">Bearish Trends</span>
                <strong className="text-rose-400 text-base font-mono">▼ {losers} Commodities</strong>
              </div>
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                <span className="text-slate-400 block text-[11px]">Feed Timestamp</span>
                <span className="text-slate-200 text-xs font-mono font-bold block truncate" suppressHydrationWarning>
                  {lastUpdated ? lastUpdated.toLocaleTimeString('en-IN') : 'Synchronizing...'}
                </span>
              </div>
            </div>
          </div>

          {/* ── SEARCH & FILTER CONTROLS ── */}
          <div className="space-y-4">
            {/* Category Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                      : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search & State Filter Row */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-8 relative">
                <input
                  type="text"
                  placeholder="Search commodity (e.g. Turmeric, Chilli, Soyabean, Nizamabad, Jeera, Wheat)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-brand-500 outline-none pl-10"
                />
                <span className="absolute left-3.5 top-3.5 text-slate-500 text-sm">🔍</span>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-white text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="sm:col-span-4">
                <select
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-white focus:ring-2 focus:ring-brand-500 outline-none cursor-pointer"
                >
                  {states.map((st) => (
                    <option key={st} value={st} className="bg-slate-900 text-white">
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ── COMMODITY GRID CARDS ── */}
          {loading ? (
            <div className="p-16 text-center text-slate-400 space-y-3">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <div className="font-bold text-sm">Loading Live CommodityOnline Mandi Rates...</div>
            </div>
          ) : filteredCommodities.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/60 rounded-3xl border border-slate-800 text-slate-400 space-y-3">
              <div className="text-3xl">🌾</div>
              <div className="font-bold text-base text-white">No commodities found matching your filter</div>
              <p className="text-xs">Try searching for a different commodity or reset your filters.</p>
              <button
                onClick={() => {
                  setSelectedCategory('All Categories');
                  setSelectedState('All States');
                  setSearchQuery('');
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredCommodities.map((item) => {
                const isUp = item.trend === 'up';
                const isExpanded = expandedCardId === item.id;
                const mandisList = item.mandis || [];

                return (
                  <motion.div
                    key={item.id || item.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-5 sm:p-6 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl shadow-xl flex flex-col justify-between gap-4 transition-all hover:shadow-2xl hover:-translate-y-0.5 group"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] font-extrabold uppercase tracking-wider">
                          {item.category}
                        </span>
                        <div
                          className={`px-2.5 py-0.5 rounded-full text-xs font-black flex items-center gap-1 ${
                            isUp
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          <span>{isUp ? '▲' : '▼'}</span>
                          <span>{Math.abs(item.change)}%</span>
                        </div>
                      </div>

                      {/* Title & Market */}
                      <h3 className="text-lg font-black text-white leading-tight group-hover:text-emerald-400 transition-colors">
                        {item.name}
                      </h3>
                      <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                        <span>📍</span>
                        <span className="font-semibold text-slate-300">{item.market}</span>
                        {item.state && <span className="text-slate-500">({item.state})</span>}
                      </div>

                      {item.grade && (
                        <div className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
                          <span className="text-slate-500">Spec:</span>
                          <span className="font-medium text-slate-300">{item.grade}</span>
                        </div>
                      )}

                      {/* Pricing Block */}
                      <div className="mt-4 p-3.5 bg-slate-950/80 border border-slate-800/80 rounded-2xl space-y-2">
                        <div className="flex justify-between items-baseline">
                          <span className="text-slate-400 text-xs font-medium">Modal Price:</span>
                          <div className="text-right">
                            <strong className="text-xl font-black text-white font-mono">
                              ₹{Number(item.price).toLocaleString('en-IN')}
                            </strong>
                            <span className="text-[11px] text-slate-400 ml-1">/{item.unit.replace('per ', '')}</span>
                          </div>
                        </div>

                        {item.pricePerKg && (
                          <div className="flex justify-between items-center text-xs text-emerald-400 font-mono font-bold">
                            <span>Per Kg Equivalent:</span>
                            <span>₹{Number(item.pricePerKg).toFixed(2)}/kg</span>
                          </div>
                        )}

                        {item.minPrice && item.maxPrice && (
                          <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1 border-t border-slate-900 font-mono">
                            <span>Trading Range:</span>
                            <span>₹{Number(item.minPrice).toLocaleString('en-IN')} - ₹{Number(item.maxPrice).toLocaleString('en-IN')}</span>
                          </div>
                        )}

                        {item.volume && (
                          <div className="flex justify-between items-center text-[11px] text-slate-500 font-mono">
                            <span>Daily Arrivals:</span>
                            <span className="text-slate-400">{item.volume}</span>
                          </div>
                        )}
                      </div>

                      {/* Regional Mandi Breakdown Accordion */}
                      {mandisList.length > 0 && (
                        <div className="mt-3">
                          <button
                            type="button"
                            onClick={() => toggleExpand(item.id)}
                            className="w-full py-1.5 px-3 bg-slate-950/60 hover:bg-slate-950 rounded-xl text-[11px] font-bold text-slate-300 border border-slate-800/80 flex items-center justify-between transition-colors cursor-pointer"
                          >
                            <span>APMC Mandi Breakdown ({mandisList.length})</span>
                            <span className="text-brand-400">{isExpanded ? '▲ Hide' : '▼ View Mandis'}</span>
                          </button>

                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-2 space-y-1.5 overflow-hidden"
                              >
                                {mandisList.map((m, mIdx) => (
                                  <div
                                    key={mIdx}
                                    className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/60 flex items-center justify-between text-[11px]"
                                  >
                                    <div>
                                      <div className="font-bold text-white">{m.market} ({m.state})</div>
                                      <div className="text-[10px] text-slate-400">{m.variety}</div>
                                    </div>
                                    <div className="text-right font-mono">
                                      <div className="font-extrabold text-white">₹{m.modalPrice.toLocaleString('en-IN')}/qtl</div>
                                      <div className="text-[10px] text-emerald-400">₹{m.pricePerKg.toFixed(2)}/kg</div>
                                    </div>
                                  </div>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 flex items-center gap-2">
                      <Link
                        href={`/directory?search=${encodeURIComponent(item.name.split(' ')[0])}`}
                        className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all text-center cursor-pointer shadow-md shadow-emerald-600/20"
                      >
                        <span>Buy Wholesale</span>
                        <span>→</span>
                      </Link>

                      {item.sourceUrl && (
                        <a
                          href={item.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors"
                          title="View on CommodityOnline"
                        >
                          Source ↗
                        </a>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* ── ESCROW & MANDI INFORMATION BANNER ── */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-xs text-slate-400 space-y-3">
            <div className="flex items-center gap-2 text-white font-black text-sm">
              <span>🛡️</span> How B2B India Commodity Price Locking Works
            </div>
            <p className="leading-relaxed text-slate-300">
              Mandi prices fluctuate daily across state APMCs. With B2B India, buyers can lock wholesale rates directly with certified agro manufacturers and suppliers. Pay a 10% advance deposit to secure contract pricing and vehicle dispatch allocation, with the remaining 90% payable at truck loading at our central godowns.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
