"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { STATIC_SECTORS } from '@/constants/sectors';

export default function ProfitMarginViewer() {
  const [products, setProducts] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSector, setSelectedSector] = useState('all');
  
  // Interactive Simulator State
  const [simProduct, setSimProduct] = useState(null);
  const [simQty, setSimQty] = useState(1000);
  const [copiedId, setCopiedId] = useState(null);

  const fetchMarginData = async () => {
    setLoading(true);
    try {
      let url = `/api/admin/profit-margins?sector=${encodeURIComponent(selectedSector)}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.products) {
          setProducts(data.products);
          setKpis(data.kpis);
          if (!simProduct && data.products.length > 0) {
            setSimProduct(data.products[0]);
            setSimQty(data.products[0].moq || 1000);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load profit margin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarginData();
  }, [selectedSector, search]);

  const handleExportCSV = () => {
    if (!products.length) return;
    const headers = [
      'Product ID',
      'Title',
      'Category',
      'Supplier',
      'Unit',
      'Actual Base Rate (INR)',
      'Platform Fee (%)',
      'Platform Fee Amount (INR)',
      'GST (%)',
      'GST Amount (INR)',
      'Final Listed Price (INR)',
      'MOQ',
      'B2B India Earning at MOQ (INR)',
      'Total Order Value at MOQ (INR)',
      'Advance Required (INR)',
      'Pending Balance at Dock (INR)'
    ];

    const rows = products.map((p) => [
      p.id,
      `"${p.title.replace(/"/g, '""')}"`,
      `"${p.categoryName}"`,
      `"${p.supplierName}"`,
      p.unitLabel,
      p.rawBasePrice,
      p.platformFeePercent,
      p.platformFeePerUnit,
      p.gstPercent,
      p.gstAmountPerUnit,
      p.finalListedPrice,
      p.moq,
      p.totalB2BEarnings,
      p.totalGrossOrderValue,
      p.advanceAmount,
      p.pendingDockAmount
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `b2b_india_profit_margins_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopy = (text, id) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Simulator calculation
  const simBaseTotal = simProduct ? Math.round(simProduct.rawBasePrice * simQty) : 0;
  const simB2BEarnings = simProduct ? Math.round(simProduct.platformFeePerUnit * simQty) : 0;
  const simGstTotal = simProduct ? Math.round(simProduct.gstAmountPerUnit * simQty) : 0;
  const simGrandTotal = simProduct ? Math.round(simProduct.finalListedPrice * simQty) : 0;
  const simIsHighValue = simGrandTotal >= 1000000;
  const simAdvance = simIsHighValue ? 100000 : Math.round(simGrandTotal * 0.1);
  const simPendingDock = Math.max(0, simGrandTotal - simAdvance);

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">💰</span>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              Catalog Profit Margins & Financial Intelligence
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Complete financial breakdown for all prelisted and active catalog products: Raw Base Rate + Platform Commission + GST = B2B India Earnings & Total Buyer Deal Value.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={fetchMarginData}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <span>🔄 Refresh</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all cursor-pointer"
          >
            <span>📥 Export to CSV / Excel</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {kpis && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Projected B2B Earnings */}
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-5 rounded-3xl shadow-lg shadow-emerald-500/10 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-100">
                Projected B2B Net Earnings (@ MOQ)
              </span>
              <span className="text-xl">💰</span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black">₹{kpis.totalProjectedB2BEarnings.toLocaleString('en-IN')}</div>
              <div className="text-[11px] text-emerald-100 mt-0.5">Platform commission revenue from catalog</div>
            </div>
          </div>

          {/* Total Catalog Order Volume */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Gross Catalog Deal Value
              </span>
              <span className="text-xl">📦</span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-white">₹{kpis.totalProjectedOrderVolume.toLocaleString('en-IN')}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Total across {kpis.totalProductsCount} wholesale listings</div>
            </div>
          </div>

          {/* Supplier Payouts */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">
                Protected Supplier Base Payout
              </span>
              <span className="text-xl">🏭</span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-white">₹{kpis.totalSupplierPayouts.toLocaleString('en-IN')}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">100% Guaranteed base manufacturer payout</div>
            </div>
          </div>

          {/* Average Platform Margin */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400">
                Average Category Fee
              </span>
              <span className="text-xl">🏷️</span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-white">{kpis.avgFeePercent}%</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Dynamically tuned across 38 sectors</div>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Deal & Profit Simulator */}
      {simProduct && (
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <span className="px-2.5 py-0.5 bg-brand-500/20 text-brand-400 rounded-full text-[10px] font-black uppercase tracking-wider border border-brand-500/30">
                Live Deal Profit Simulator
              </span>
              <h2 className="text-base font-black text-white mt-1">
                Simulate Order Deal Value & B2B India Earnings
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-bold">Select Product:</span>
              <select
                value={simProduct.id}
                onChange={(e) => {
                  const found = products.find((p) => p.id === e.target.value);
                  if (found) {
                    setSimProduct(found);
                    setSimQty(found.moq || 1000);
                  }
                }}
                className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white outline-none cursor-pointer max-w-xs truncate"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.categoryName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
            {/* Quantity Input */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
              <label className="text-xs font-bold text-slate-400 block uppercase">
                Simulated Quantity ({simProduct.unitLabel})
              </label>
              <input
                type="number"
                min="1"
                step="100"
                value={simQty}
                onChange={(e) => setSimQty(Math.max(1, Number(e.target.value) || 1))}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-lg font-mono font-black text-white outline-none focus:ring-2 focus:ring-brand-500"
              />
              <span className="text-[10px] text-slate-500 block">
                MOQ: {simProduct.moq} {simProduct.unitLabel}
              </span>
            </div>

            {/* Base Supplier Payout */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-slate-400 text-xs font-bold block uppercase">1. Raw Supplier Payout</span>
              <div className="text-lg font-black text-slate-200">₹{simBaseTotal.toLocaleString('en-IN')}</div>
              <span className="text-[10px] text-slate-500 block">
                ₹{simProduct.rawBasePrice} / {simProduct.unitLabel} (100% Protected)
              </span>
            </div>

            {/* B2B Platform Fee */}
            <div className="bg-emerald-950/40 p-4 rounded-2xl border border-emerald-500/40 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-emerald-400 text-xs font-black block uppercase">
                  2. B2B India Earnings
                </span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                  {simProduct.platformFeePercent}% Fee
                </span>
              </div>
              <div className="text-xl font-black text-emerald-400">₹{simB2BEarnings.toLocaleString('en-IN')}</div>
              <span className="text-[10px] text-emerald-300/80 block">
                +₹{simProduct.platformFeePerUnit} / {simProduct.unitLabel} platform margin
              </span>
            </div>

            {/* Total Grand Value */}
            <div className="bg-brand-950/40 p-4 rounded-2xl border border-brand-500/40 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-amber-400 text-xs font-black block uppercase">
                  3. Total Contract Value
                </span>
                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                  +{simProduct.gstPercent}% GST
                </span>
              </div>
              <div className="text-xl font-black text-amber-400">₹{simGrandTotal.toLocaleString('en-IN')}</div>
              <span className="text-[10px] text-slate-300 block">
                Buyer rate: ₹{simProduct.finalListedPrice} / {simProduct.unitLabel}
              </span>
            </div>
          </div>

          {/* Payment Split Bar */}
          <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 font-bold rounded-md">
                💳 {simIsHighValue ? 'Flat ₹1,00,000 Advance' : '10% Advance Deposit'}
              </span>
              <strong className="text-white font-mono font-bold">₹{simAdvance.toLocaleString('en-IN')}</strong>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 font-bold rounded-md">
                🚚 Remaining 90% at Loading Dock
              </span>
              <strong className="text-white font-mono font-bold">₹{simPendingDock.toLocaleString('en-IN')}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search by product, category, HSN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold outline-none focus:ring-2 focus:ring-brand-500"
          />
          <span className="absolute left-2.5 top-2 text-slate-500">🔍</span>
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-2 text-slate-500 hover:text-white">
              ✕
            </button>
          )}
        </div>

        {/* Sector Filter */}
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar">
          <span className="text-slate-400 font-bold whitespace-nowrap">Filter Sector:</span>
          <select
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold outline-none cursor-pointer"
          >
            <option value="all">All 38 Categories</option>
            {STATIC_SECTORS.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Margin Breakdown Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider font-bold">
                <th className="px-5 py-4">Product Details</th>
                <th className="px-4 py-4">Category / Sector</th>
                <th className="px-4 py-4 text-right">Actual Base Rate</th>
                <th className="px-4 py-4 text-right">Platform Fee</th>
                <th className="px-4 py-4 text-right">GST Rate</th>
                <th className="px-4 py-4 text-right">Final Listed Rate</th>
                <th className="px-4 py-4 text-center">MOQ</th>
                <th className="px-5 py-4 text-right">💰 B2B Earning (@ MOQ)</th>
                <th className="px-5 py-4 text-right">Total Order Value (@ MOQ)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan="9" className="p-16 text-center text-slate-400 animate-pulse font-medium">
                    Calculating catalog profit margins & category fee breakdowns...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="9" className="p-16 text-center text-slate-500">
                    <div className="text-3xl mb-2">📋</div>
                    <div className="font-bold text-white text-sm">No products match your filter</div>
                    <p className="text-xs text-slate-500 mt-1">Try resetting the category filter or search query.</p>
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => {
                      setSimProduct(p);
                      setSimQty(p.moq || 1000);
                    }}
                    className={`hover:bg-slate-800/60 transition-colors cursor-pointer ${
                      simProduct?.id === p.id ? 'bg-slate-800/80 border-l-4 border-l-brand-500' : ''
                    }`}
                  >
                    {/* Product Name & Thumbnail */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.heroImageUrl}
                          alt={p.title}
                          className="w-10 h-10 rounded-xl object-cover border border-slate-800 bg-slate-950 flex-shrink-0"
                        />
                        <div>
                          <div className="font-extrabold text-white text-xs max-w-xs truncate" title={p.title}>
                            {p.title}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                            {p.hsnCode && <span>HSN: {p.hsnCode}</span>}
                            <span>• {p.qualityGrade}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-semibold text-[10px] border border-slate-700">
                        {p.categoryName}
                      </span>
                    </td>

                    {/* Actual Base Rate */}
                    <td className="px-4 py-4 text-right whitespace-nowrap font-mono font-bold text-slate-200">
                      ₹{p.rawBasePrice.toFixed(2)}
                      <span className="text-[10px] text-slate-500 block font-normal">/{p.unitLabel}</span>
                    </td>

                    {/* Platform Fee */}
                    <td className="px-4 py-4 text-right whitespace-nowrap">
                      <div className="font-mono font-bold text-emerald-400">
                        +₹{p.platformFeePerUnit.toFixed(2)}
                      </div>
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-300 px-1.5 py-0.2 rounded font-bold">
                        {p.platformFeePercent}% Fee
                      </span>
                    </td>

                    {/* GST Rate */}
                    <td className="px-4 py-4 text-right whitespace-nowrap">
                      <div className="font-mono text-slate-300">
                        +₹{p.gstAmountPerUnit.toFixed(2)}
                      </div>
                      <span className="text-[10px] text-slate-500 font-bold">
                        {p.gstPercent}% GST
                      </span>
                    </td>

                    {/* Final Listed Rate */}
                    <td className="px-4 py-4 text-right whitespace-nowrap font-mono font-black text-amber-400">
                      ₹{p.finalListedPrice.toFixed(2)}
                      <span className="text-[10px] text-slate-400 block font-normal">All-inclusive</span>
                    </td>

                    {/* MOQ */}
                    <td className="px-4 py-4 text-center whitespace-nowrap font-mono text-slate-300 font-bold">
                      {p.moq.toLocaleString('en-IN')} {p.unitLabel}
                    </td>

                    {/* B2B Earning @ MOQ */}
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 font-mono font-black border border-emerald-500/30 text-xs inline-block">
                        +₹{p.totalB2BEarnings.toLocaleString('en-IN')}
                      </span>
                    </td>

                    {/* Total Order Value @ MOQ */}
                    <td className="px-5 py-4 text-right whitespace-nowrap font-mono font-black text-white text-xs">
                      ₹{p.totalGrossOrderValue.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
