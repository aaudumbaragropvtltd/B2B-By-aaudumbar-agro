// ============================================================================
// COMMODITYONLINE LIVE APMC MANDI RATES TERMINAL — ALL INDIA
// ============================================================================
// Direct live feed covering 498+ commodities, all states, all APMC mandis,
// markets, and villages across India, sourced from CommodityOnline & APMC network.
// Clean white UI with full mobile responsiveness.
// ============================================================================

"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

// Popular staple commodity quick filters
const POPULAR_COMMODITIES = [
  { slug: 'all', name: 'All Commodities' },
  { slug: 'turmeric', name: 'Turmeric (Haldi)' },
  { slug: 'soyabean', name: 'Soyabean' },
  { slug: 'chilli-red', name: 'Red Chilli' },
  { slug: 'cummin-seedjeera', name: 'Cumin (Jeera)' },
  { slug: 'cotton', name: 'Cotton (Kapas)' },
  { slug: 'onion', name: 'Onion' },
  { slug: 'wheat', name: 'Wheat' },
  { slug: 'mustard', name: 'Mustard' },
  { slug: 'garlic', name: 'Garlic' },
  { slug: 'groundnut', name: 'Groundnut' },
  { slug: 'bengal-gramgramwhole', name: 'Chana' },
];

export default function MarketRatesPage() {
  // Catalogs
  const [allCommodities, setAllCommodities] = useState([]);
  const [states, setStates] = useState([{ slug: 'all', name: 'All States' }]);
  const [markets, setMarkets] = useState([{ slug: 'all', name: 'All Markets / Mandis' }]);

  // Current selections
  const [selectedCommodity, setSelectedCommodity] = useState('all');
  const [selectedState, setSelectedState] = useState('all');
  const [selectedMarket, setSelectedMarket] = useState('all');

  // Search & Filtering
  const [commoditySearch, setCommoditySearch] = useState('');
  const [isCommodityDropdownOpen, setIsCommodityDropdownOpen] = useState(false);
  const [tableSearch, setTableSearch] = useState('');

  // Live Data & Loading
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [sourceUrl, setSourceUrl] = useState('https://www.commodityonline.com/mandiprices');

  // Live Auto-Refresh Rate Control
  const [refreshRate, setRefreshRate] = useState(15); // Default 15s auto-refresh interval
  const [countdown, setCountdown] = useState(15);
  const [updatedRows, setUpdatedRows] = useState(new Set());
  const prevPricesRef = useRef(new Map());

  // 1. Initial load: Fetch all 498 commodities catalog
  useEffect(() => {
    async function loadCatalog() {
      try {
        const res = await fetch('/api/market-rates/commodityonline?action=commodities');
        if (res.ok) {
          const data = await res.json();
          if (data.commodities && Array.isArray(data.commodities)) {
            setAllCommodities(data.commodities);
          }
        }
      } catch (err) {
        console.warn('Could not load commodity catalog:', err);
      }
    }
    loadCatalog();
  }, []);

  // 2. Fetch States when Commodity changes
  useEffect(() => {
    async function loadStates() {
      if (!selectedCommodity || selectedCommodity === 'all') {
        setStates([
          { slug: 'all', name: 'All States' },
          { slug: 'maharashtra', name: 'Maharashtra' },
          { slug: 'gujarat', name: 'Gujarat' },
          { slug: 'rajasthan', name: 'Rajasthan' },
          { slug: 'madhya-pradesh', name: 'Madhya Pradesh' },
          { slug: 'andhra-pradesh', name: 'Andhra Pradesh' },
          { slug: 'telangana', name: 'Telangana' },
          { slug: 'karnataka', name: 'Karnataka' },
          { slug: 'tamil-nadu', name: 'Tamil Nadu' },
          { slug: 'uttar-pradesh', name: 'Uttar Pradesh' },
          { slug: 'punjab', name: 'Punjab' },
          { slug: 'haryana', name: 'Haryana' },
          { slug: 'bihar', name: 'Bihar' },
          { slug: 'west-bengal', name: 'West Bengal' },
          { slug: 'kerala', name: 'Kerala' },
        ]);
        return;
      }

      try {
        const res = await fetch(`/api/market-rates/commodityonline?action=states&commodity=${encodeURIComponent(selectedCommodity)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.states && Array.isArray(data.states)) {
            const cleanStates = data.states.filter((s) => s.slug && s.slug !== 'all');
            setStates([{ slug: 'all', name: 'All States' }, ...cleanStates]);
          }
        }
      } catch (err) {
        console.warn('Could not load states:', err);
      }
    }
    loadStates();
    setSelectedState('all');
    setSelectedMarket('all');
  }, [selectedCommodity]);

  // 3. Fetch Markets when State changes
  useEffect(() => {
    async function loadMarkets() {
      if (!selectedCommodity || selectedCommodity === 'all' || !selectedState || selectedState === 'all') {
        setMarkets([{ slug: 'all', name: 'All Markets / Mandis' }]);
        return;
      }

      try {
        const res = await fetch(`/api/market-rates/commodityonline?action=markets&commodity=${encodeURIComponent(selectedCommodity)}&state=${encodeURIComponent(selectedState)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.markets && Array.isArray(data.markets)) {
            const cleanMarkets = data.markets.filter((m) => m.slug && m.slug !== 'all');
            setMarkets([{ slug: 'all', name: 'All Markets / Mandis' }, ...cleanMarkets]);
          }
        }
      } catch (err) {
        console.warn('Could not load markets:', err);
      }
    }
    loadMarkets();
    setSelectedMarket('all');
  }, [selectedCommodity, selectedState]);

  // 4. Fetch Live Rates Table with Real-time Tick Detection
  const fetchRates = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const params = new URLSearchParams({
        action: 'rates',
        commodity: selectedCommodity,
        state: selectedState,
        market: selectedMarket,
        _t: Date.now().toString(),
      });
      if (isManual || refreshRate > 0) params.set('refresh', 'true');

      const res = await fetch(`/api/market-rates/commodityonline?${params.toString()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.records && Array.isArray(data.records)) {
          // Identify newly ticked/changed rows to animate lively flash in UI
          const changedKeys = new Set();
          data.records.forEach((rec) => {
            const rowKey = `${rec.commodity}-${rec.market}-${rec.variety}`;
            const previousModal = prevPricesRef.current.get(rowKey);
            if (previousModal !== undefined && previousModal !== rec.modalPrice) {
              changedKeys.add(rowKey);
            }
            prevPricesRef.current.set(rowKey, rec.modalPrice);
          });

          if (changedKeys.size > 0 || isManual) {
            setUpdatedRows(changedKeys.size > 0 ? changedKeys : new Set(data.records.slice(0, 6).map(r => `${r.commodity}-${r.market}-${r.variety}`)));
            setTimeout(() => setUpdatedRows(new Set()), 2500);
          }

          setRecords(data.records);
          setLastUpdated(new Date(data.lastUpdated || Date.now()));
          if (data.sourceUrl) setSourceUrl(data.sourceUrl);
        }
      }
    } catch (err) {
      console.error('Error fetching live rates:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, [selectedCommodity, selectedState, selectedMarket]);

  // 5. Automatic Live Refresh Rate Polling Timer
  useEffect(() => {
    if (refreshRate <= 0) return;

    setCountdown(refreshRate);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchRates(true);
          return refreshRate;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [refreshRate, selectedCommodity, selectedState, selectedMarket]);

  // Autocomplete filtered commodities
  const filteredCommodityOptions = useMemo(() => {
    if (!commoditySearch.trim()) return allCommodities.slice(0, 40);
    const q = commoditySearch.toLowerCase().trim();
    return allCommodities.filter((c) => c.name.toLowerCase().includes(q) || c.slug.includes(q)).slice(0, 50);
  }, [allCommodities, commoditySearch]);

  // Client-side text filter on the loaded records
  const displayRecords = useMemo(() => {
    if (!tableSearch.trim()) return records;
    const q = tableSearch.toLowerCase().trim();
    return records.filter((r) =>
      (r.commodity && r.commodity.toLowerCase().includes(q)) ||
      (r.market && r.market.toLowerCase().includes(q)) ||
      (r.state && r.state.toLowerCase().includes(q)) ||
      (r.district && r.district.toLowerCase().includes(q)) ||
      (r.variety && r.variety.toLowerCase().includes(q))
    );
  }, [records, tableSearch]);

  // Selected commodity display title
  const selectedCommodityName = useMemo(() => {
    if (selectedCommodity === 'all') return 'All Agricultural Commodities';
    const found = allCommodities.find((c) => c.slug === selectedCommodity);
    return found ? found.name : selectedCommodity.toUpperCase();
  }, [allCommodities, selectedCommodity]);

  return (
    <div className="bg-[#f8fafc] min-h-screen text-slate-900 antialiased selection:bg-emerald-500 selection:text-white">
      <Navbar />

      <main className="pt-20 sm:pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 space-y-6">

          {/* ── TOP TERMINAL HERO BANNER (CLEAN WHITE) ── */}
          <div className="p-5 sm:p-8 rounded-2xl sm:rounded-3xl bg-white border border-slate-200/90 shadow-xs relative overflow-hidden">
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Live Mandi Feed
                  </span>
                </div>

                <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                  India APMC Mandi Rates &amp; Market Intelligence
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
                  Real-time wholesale modal pricing, daily arrivals, and market trends aggregated from agricultural APMC Mandis across all 28 states, covering <strong>{allCommodities.length || 498} agricultural commodities</strong>, districts, and village markets.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
                {/* Live Auto-Refresh Rate Selector */}
                <div className="flex items-center gap-2 bg-slate-100/90 border border-slate-200/90 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700">
                  <span className="flex items-center gap-1 text-emerald-700 font-bold whitespace-nowrap">
                    <span className={`w-2 h-2 rounded-full ${refreshRate > 0 ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`} />
                    Live Rate:
                  </span>
                  <select
                    id="mandi-refresh-rate-select"
                    value={refreshRate}
                    onChange={(e) => setRefreshRate(Number(e.target.value))}
                    className="bg-white border border-slate-300 rounded-lg px-2 py-1 font-bold text-slate-800 text-xs outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value={10}>Every 10s</option>
                    <option value={15}>Every 15s (Live Feed)</option>
                    <option value={30}>Every 30s</option>
                    <option value={60}>Every 60s</option>
                    <option value={0}>Manual Only</option>
                  </select>
                  {refreshRate > 0 && (
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-1.5 py-0.5 rounded font-mono shrink-0">
                      ⏱️ {countdown}s
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  id="mandi-refresh-now-btn"
                  onClick={() => fetchRates(true)}
                  disabled={refreshing}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[42px]"
                >
                  <span className={refreshing ? 'animate-spin' : ''}>🔄</span>
                  <span>{refreshing ? 'Updating Feed...' : 'Refresh Now'}</span>
                </button>

                <Link
                  href="/directory"
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-xl border border-slate-200 transition-all flex items-center justify-center gap-1.5 min-h-[42px]"
                >
                  <span>Browse Directory</span>
                  <span>→</span>
                </Link>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mt-5 pt-5 border-t border-slate-100 text-xs">
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80">
                <span className="text-slate-500 block text-[11px] font-medium">Indexed Products</span>
                <strong className="text-slate-900 text-sm sm:text-base font-bold font-mono">
                  {allCommodities.length || 498} Commodities
                </strong>
              </div>
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80">
                <span className="text-slate-500 block text-[11px] font-medium">Available States</span>
                <strong className="text-emerald-700 text-sm sm:text-base font-bold font-mono">
                  {states.length > 1 ? `${states.length - 1} States` : 'All 28 States'}
                </strong>
              </div>
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80">
                <span className="text-slate-500 block text-[11px] font-medium">Regional Mandis</span>
                <strong className="text-indigo-700 text-sm sm:text-base font-bold font-mono">
                  {markets.length > 1 ? `${markets.length - 1} Mandis/Villages` : 'All APMC Mandis'}
                </strong>
              </div>
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80">
                <span className="text-slate-500 block text-[11px] font-medium">Feed Status</span>
                <span className="text-slate-800 text-xs font-mono font-bold block truncate" suppressHydrationWarning>
                  {refreshRate > 0 ? (
                    <span className="text-emerald-700 inline-flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                      Live ({refreshRate}s) • {lastUpdated ? lastUpdated.toLocaleTimeString('en-IN') : 'Syncing...'}
                    </span>
                  ) : (
                    <span>Manual • {lastUpdated ? lastUpdated.toLocaleTimeString('en-IN') : 'Syncing...'}</span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* ── COMMODITYONLINE FILTER CONTROLS ── */}
          <div className="p-4 sm:p-6 bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <span className="text-lg">🔍</span>
              <h2 className="text-sm sm:text-base font-black text-slate-900">
                Mandi Rate Filter: Commodity, State &amp; Market
              </h2>
            </div>

            {/* Quick Staples Bar */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Quick Select Popular Commodities:
              </label>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
                {POPULAR_COMMODITIES.map((item) => (
                  <button
                    key={item.slug}
                    type="button"
                    onClick={() => {
                      setSelectedCommodity(item.slug);
                      setCommoditySearch('');
                      setIsCommodityDropdownOpen(false);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer min-h-[36px] ${
                      selectedCommodity === item.slug
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80'
                    }`}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 3-Tier Selectors: Commodity, State, Market */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* 1. Commodity Search & Dropdown */}
              <div className="relative">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                  1. Select Product ({allCommodities.length || 498} available):
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search product (e.g. Turmeric, Chilli, Soyabean)..."
                    value={commoditySearch}
                    onFocus={() => setIsCommodityDropdownOpen(true)}
                    onChange={(e) => {
                      setCommoditySearch(e.target.value);
                      setIsCommodityDropdownOpen(true);
                    }}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none pr-8 min-h-[42px]"
                  />
                  {commoditySearch ? (
                    <button
                      type="button"
                      onClick={() => setCommoditySearch('')}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700 text-xs p-1"
                    >
                      ✕
                    </button>
                  ) : (
                    <span className="absolute right-3 top-3 text-slate-400 text-xs pointer-events-none">▼</span>
                  )}
                </div>

                {/* Autocomplete list */}
                {isCommodityDropdownOpen && (
                  <div className="absolute z-50 left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl divide-y divide-slate-100 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCommodity('all');
                        setCommoditySearch('');
                        setIsCommodityDropdownOpen(false);
                      }}
                      className="w-full text-left px-3.5 py-2.5 hover:bg-emerald-50 text-emerald-800 font-bold flex items-center justify-between"
                    >
                      <span>All Agricultural Products (Overview)</span>
                      <span>✓</span>
                    </button>
                    {filteredCommodityOptions.map((c) => (
                      <button
                        key={c.slug}
                        type="button"
                        onClick={() => {
                          setSelectedCommodity(c.slug);
                          setCommoditySearch(c.name);
                          setIsCommodityDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2.5 hover:bg-slate-50 flex items-center justify-between ${
                          selectedCommodity === c.slug ? 'bg-emerald-50 font-bold text-emerald-800' : 'text-slate-800'
                        }`}
                      >
                        <span>{c.name}</span>
                        {selectedCommodity === c.slug && <span className="text-emerald-600">✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. State Selector */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                  2. Select State ({states.length - 1 > 0 ? states.length - 1 : 'All'} available):
                </label>
                <select
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none min-h-[42px] cursor-pointer"
                >
                  {states.map((st, sIdx) => (
                    <option key={`${st.slug}-${sIdx}`} value={st.slug}>
                      {st.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Market / Mandi / Village Selector */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                  3. Select Mandi / Market / Village:
                </label>
                <select
                  value={selectedMarket}
                  onChange={(e) => setSelectedMarket(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none min-h-[42px] cursor-pointer"
                >
                  {markets.map((m, mIdx) => (
                    <option key={`${m.slug}-${mIdx}`} value={m.slug}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* In-table Search Bar */}
            <div className="pt-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Filter table rows by village, mandi market name, district, or variety..."
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 outline-none pl-10 min-h-[40px]"
                />
                <span className="absolute left-3.5 top-2.5 text-slate-400 text-sm">🔍</span>
                {tableSearch && (
                  <button
                    type="button"
                    onClick={() => setTableSearch('')}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 text-xs p-1"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ── LIVE MANDI RATES RESULTS ── */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {selectedCommodityName} — Live APMC Mandi Rates
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Showing {displayRecords.length} market arrivals across India • Updated live
                </p>
              </div>
            </div>

            {loading ? (
              <div className="p-16 text-center text-slate-500 space-y-3 bg-white rounded-2xl sm:rounded-3xl border border-slate-200">
                <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <div className="font-bold text-sm text-slate-700">
                  Loading Live Mandi Rates from CommodityOnline...
                </div>
              </div>
            ) : displayRecords.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl sm:rounded-3xl border border-slate-200 text-slate-500 space-y-3 shadow-xs">
                <div className="text-3xl">🌾</div>
                <div className="font-bold text-base text-slate-900">
                  No Mandi records found for this selection
                </div>
                <p className="text-xs text-slate-500">
                  Try switching to another state, choosing a different commodity, or clearing search filters.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCommodity('all');
                    setSelectedState('all');
                    setSelectedMarket('all');
                    setTableSearch('');
                    setCommoditySearch('');
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <>
                {/* 1. DESKTOP VIEW: Full Responsive Mandi Price Table */}
                <div className="hidden md:block bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 uppercase font-black tracking-wider text-[11px]">
                          <th className="py-3.5 px-4">Commodity</th>
                          <th className="py-3.5 px-4">Market / Mandi / Village</th>
                          <th className="py-3.5 px-4">Variety</th>
                          <th className="py-3.5 px-4">State &amp; District</th>
                          <th className="py-3.5 px-4 text-right">Min Price</th>
                          <th className="py-3.5 px-4 text-right">Max Price</th>
                          <th className="py-3.5 px-4 text-right">Modal Price (₹/qtl)</th>
                          <th className="py-3.5 px-4 text-right">Per Kg</th>
                          <th className="py-3.5 px-4 text-center">Arrival Date</th>
                          <th className="py-3.5 px-4 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {displayRecords.map((item, idx) => {
                          const rowKey = `${item.commodity}-${item.market}-${item.variety}`;
                          const isFlashing = updatedRows.has(rowKey);
                          const isUp = item.trend === 'up';
                          const isDown = item.trend === 'down';

                          return (
                            <tr
                              key={idx}
                              className={`transition-all duration-300 ${
                                isFlashing
                                  ? isUp
                                    ? 'bg-emerald-100/70 ring-2 ring-emerald-400 font-semibold'
                                    : isDown
                                    ? 'bg-rose-100/70 ring-2 ring-rose-400 font-semibold'
                                    : 'bg-emerald-50/80 ring-1 ring-emerald-300'
                                  : 'hover:bg-emerald-50/30'
                              }`}
                            >
                              <td className="py-3 px-4 font-bold text-slate-900">
                                <div className="flex items-center gap-1.5">
                                  <span>{item.commodity}</span>
                                  {isFlashing && (
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-wider ${
                                      isUp ? 'bg-emerald-600 text-white' : isDown ? 'bg-rose-600 text-white' : 'bg-emerald-500 text-white'
                                    }`}>
                                      NEW TICK
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <span className="font-extrabold text-slate-900 block">
                                  {item.market} APMC
                                </span>
                              </td>
                              <td className="py-3 px-4 text-slate-600 font-medium">
                                {item.variety || 'Standard'}
                              </td>
                              <td className="py-3 px-4 text-slate-600">
                                <div>{item.state}</div>
                                {item.district && (
                                  <div className="text-[10px] text-slate-400">{item.district}</div>
                                )}
                              </td>
                              <td className="py-3 px-4 text-right font-mono text-slate-600">
                                {item.rawMinPrice || `₹${item.minPrice?.toLocaleString('en-IN')}`}
                              </td>
                              <td className="py-3 px-4 text-right font-mono text-slate-600">
                                {item.rawMaxPrice || `₹${item.maxPrice?.toLocaleString('en-IN')}`}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <div className="font-mono font-black text-slate-900 text-sm inline-flex items-center justify-end gap-1">
                                  <span>{item.rawModalPrice || `₹${item.modalPrice?.toLocaleString('en-IN')}`}</span>
                                  {isUp && (
                                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/90 px-1.5 py-0.5 rounded">
                                      ▲ +₹{Math.abs(item.changeRupees || 0)}
                                    </span>
                                  )}
                                  {isDown && (
                                    <span className="text-[10px] font-bold text-rose-700 bg-rose-100/90 px-1.5 py-0.5 rounded">
                                      ▼ -₹{Math.abs(item.changeRupees || 0)}
                                    </span>
                                  )}
                                </div>
                                {item.lastTickTime && (
                                  <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                                    Tick: {item.lastTickTime}
                                  </div>
                                )}
                              </td>
                              <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                                ₹{item.pricePerKg?.toFixed(2)}/kg
                              </td>
                              <td className="py-3 px-4 text-center text-slate-500 font-mono text-[11px]">
                                {item.arrivalDate}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <Link
                                  href={`/directory?search=${encodeURIComponent(item.commodity?.split(' ')[0] || '')}`}
                                  className="inline-block py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold shadow-xs transition-colors whitespace-nowrap"
                                >
                                  Buy Wholesale
                                </Link>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 2. MOBILE VIEW: Responsive Touch Cards (No Horizontal Overflow) */}
                <div className="md:hidden space-y-3">
                  {displayRecords.map((item, idx) => {
                    const rowKey = `${item.commodity}-${item.market}-${item.variety}`;
                    const isFlashing = updatedRows.has(rowKey);
                    const isUp = item.trend === 'up';
                    const isDown = item.trend === 'down';

                    return (
                      <div
                        key={idx}
                        className={`p-4 bg-white border rounded-2xl shadow-xs space-y-3 transition-all duration-300 ${
                          isFlashing
                            ? isUp
                              ? 'border-emerald-400 ring-2 ring-emerald-300 bg-emerald-50/40'
                              : isDown
                              ? 'border-rose-400 ring-2 ring-rose-300 bg-rose-50/40'
                              : 'border-emerald-300 bg-emerald-50/30'
                            : 'border-slate-200/90'
                        }`}
                      >
                        {/* Top Header: Market Name + State Pill */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-extrabold text-slate-900 text-sm leading-tight">
                                {item.market} APMC
                              </h4>
                              {isFlashing && (
                                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-wider ${
                                  isUp ? 'bg-emerald-600 text-white' : isDown ? 'bg-rose-600 text-white' : 'bg-emerald-500 text-white'
                                }`}>
                                  LIVE TICK
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {item.commodity} • {item.variety || 'Standard'}
                            </div>
                          </div>

                          {item.state && (
                            <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md shrink-0">
                              {item.state}
                            </span>
                          )}
                        </div>

                        {/* Pricing Box */}
                        <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl space-y-1.5">
                          <div className="flex justify-between items-baseline">
                            <span className="text-xs font-semibold text-slate-500">Modal Price:</span>
                            <div className="text-right">
                              <div className="inline-flex items-center gap-1.5">
                                <strong className="text-lg font-black text-slate-900 font-mono">
                                  {item.rawModalPrice || `₹${item.modalPrice?.toLocaleString('en-IN')}`}
                                </strong>
                                <span className="text-[11px] text-slate-500">/qtl</span>
                                {isUp && (
                                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                                    ▲ +₹{Math.abs(item.changeRupees || 0)}
                                  </span>
                                )}
                                {isDown && (
                                  <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                                    ▼ -₹{Math.abs(item.changeRupees || 0)}
                                  </span>
                                )}
                              </div>
                              {item.lastTickTime && (
                                <div className="text-[10px] text-slate-400 font-mono">
                                  Last tick: {item.lastTickTime}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex justify-between items-center text-xs text-emerald-700 font-mono font-bold pt-1 border-t border-slate-200/60">
                            <span>Equivalent / kg:</span>
                            <span>₹{item.pricePerKg?.toFixed(2)}/kg</span>
                          </div>

                          {(item.minPrice > 0 || item.maxPrice > 0) && (
                            <div className="flex justify-between items-center text-[11px] text-slate-500 font-mono pt-1 border-t border-slate-200/40">
                              <span>Trading Range:</span>
                              <span>{item.rawMinPrice || `₹${item.minPrice}`} - {item.rawMaxPrice || `₹${item.maxPrice}`}</span>
                            </div>
                          )}
                        </div>

                        {/* Footer Info & Action */}
                        <div className="flex items-center justify-between pt-1 gap-2">
                          <span className="text-[11px] text-slate-500 font-mono">
                            📅 {item.arrivalDate}
                          </span>

                          <Link
                            href={`/directory?search=${encodeURIComponent(item.commodity?.split(' ')[0] || '')}`}
                            className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                          >
                            Buy Wholesale →
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* ── ESCROW & MANDI INFORMATION BANNER ── */}
          <div className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-slate-200 shadow-xs text-xs text-slate-600 space-y-2.5">
            <div className="flex items-center gap-2 text-slate-900 font-black text-sm">
              <span>🛡️</span> How B2B India Price Locking Works
            </div>
            <p className="leading-relaxed text-slate-600">
              Mandi prices fluctuate daily across state APMCs. With B2B India, buyers can lock factory wholesale rates directly with certified agro manufacturers and primary suppliers. Pay a 10% advance deposit to secure contract pricing and vehicle dispatch allocation, with the remaining 90% payable at truck loading at our central godowns.
            </p>
          </div>

        </div>
      </main>
    </div>
  );
}
