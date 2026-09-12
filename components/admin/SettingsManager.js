"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { STATIC_SECTORS } from '@/constants/sectors';
import { DEFAULT_CATEGORY_FEES } from '@/constants/categoryFees';

const TABS = [
  { id: 'commercial', label: 'Commercial & Fees', icon: '💰' },
  { id: 'categories', label: '38 Category Platform Fees', icon: '🏷️' },
  { id: 'tax', label: 'Tax & GST Rules', icon: '🏛️' },
  { id: 'guardrails', label: 'Escrow & MOQs', icon: '🛡️' },
  { id: 'storage', label: 'Cloudinary CDN Storage', icon: '☁️' },
  { id: 'system', label: 'System & Maintenance', icon: '⚙️' },
];

export default function SettingsManager() {
  const [settings, setSettings] = useState({});
  const [formValues, setFormValues] = useState({});
  const [categoryFees, setCategoryFees] = useState(DEFAULT_CATEGORY_FEES);
  const [searchCategory, setSearchCategory] = useState('');
  const [bulkFeeInput, setBulkFeeInput] = useState('');
  const [activeTab, setActiveTab] = useState('commercial');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // Cloudinary CDN Storage State
  const [cloudinaryStatus, setCloudinaryStatus] = useState(null);
  const [checkingCloudinary, setCheckingCloudinary] = useState(false);
  const [testUploadLoading, setTestUploadLoading] = useState(false);
  const [testUploadResult, setTestUploadResult] = useState(null);

  const fetchCloudinaryStatus = async () => {
    setCheckingCloudinary(true);
    try {
      const res = await fetch('/api/admin/cloudinary');
      const data = await res.json();
      setCloudinaryStatus(data);
    } catch (err) {
      setCloudinaryStatus({ configured: false, error: err.message });
    } finally {
      setCheckingCloudinary(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'storage') {
      fetchCloudinaryStatus();
    }
  }, [activeTab]);

  const handleTestUpload = async () => {
    setTestUploadLoading(true);
    setTestUploadResult(null);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 250;
      const ctx = canvas.getContext('2d');
      // Background gradient
      const grad = ctx.createLinearGradient(0, 0, 400, 250);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(1, '#064e3b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 400, 250);
      // Badge
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.roundRect(120, 50, 160, 40, 8);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('B2B BHARAT', 200, 75);
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('Cloudinary CDN Test Asset', 200, 135);
      ctx.font = '12px sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(new Date().toISOString(), 200, 175);

      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      const testFile = new File([blob], `cdn_test_${Date.now()}.png`, { type: 'image/png' });

      const formData = new FormData();
      formData.append('file', testFile);
      formData.append('bucket', 'products');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      setTestUploadResult(data);
      if (data.success) {
        showToast(data.provider === 'cloudinary' ? '✅ Image offloaded to Cloudinary CDN!' : 'ℹ️ Image saved via local fallback.');
      } else {
        showToast(data.error || 'Test upload failed', 'error');
      }
    } catch (err) {
      setTestUploadResult({ error: err.message });
      showToast('Upload test error: ' + err.message, 'error');
    } finally {
      setTestUploadLoading(false);
    }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setSettings(data.settings);
          const initialValues = {};
          Object.entries(data.settings).forEach(([k, item]) => {
            initialValues[k] = item.value;
          });
          setFormValues(initialValues);

          if (initialValues.category_platform_fees) {
            setCategoryFees({ ...DEFAULT_CATEGORY_FEES, ...initialValues.category_platform_fees });
          }
        }
      }
    } catch (err) {
      showToast('Error loading platform settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (key, value) => {
    setFormValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleCategoryFeeChange = (slug, value) => {
    const num = value === '' ? '' : parseFloat(value);
    const updated = {
      ...categoryFees,
      [slug]: num,
    };
    setCategoryFees(updated);
    setFormValues((prev) => ({
      ...prev,
      category_platform_fees: updated,
    }));
  };

  const handleApplyBulkFee = (rate) => {
    const val = parseFloat(rate);
    if (isNaN(val) || val < 0) {
      showToast('Please enter a valid percentage number', 'error');
      return;
    }
    const updated = {};
    STATIC_SECTORS.forEach((s) => {
      updated[s.slug] = val;
    });
    setCategoryFees(updated);
    setFormValues((prev) => ({
      ...prev,
      category_platform_fees: updated,
    }));
    showToast(`Set all 38 categories to ${val}%! Click "Save Changes Live" to apply.`);
  };

  const handleResetDefaultCategoryFees = () => {
    setCategoryFees(DEFAULT_CATEGORY_FEES);
    setFormValues((prev) => ({
      ...prev,
      category_platform_fees: DEFAULT_CATEGORY_FEES,
    }));
    showToast('Reset 38 categories to recommended industry rates! Click "Save Changes Live" to apply.');
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...formValues,
        category_platform_fees: categoryFees,
      };

      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('✅ Category fees & business rules updated live across the entire website!');
        setSettings(data.settings);
      } else {
        showToast(data.error || 'Failed to save settings', 'error');
      }
    } catch (err) {
      showToast('Network error while saving settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const filteredSectors = STATIC_SECTORS.filter((s) =>
    s.name.toLowerCase().includes(searchCategory.toLowerCase()) ||
    s.slug.toLowerCase().includes(searchCategory.toLowerCase())
  );

  const currentTabKeys = Object.keys(settings).filter(
    (k) => settings[k]?.category === activeTab && k !== 'category_platform_fees'
  );

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚙️</span>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              Dynamic Platform Settings & Category Commission Rules
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Control commercial fees, category-specific platform % across all 38 sectors, GST rates, and maintenance toggles live without redeploying code.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto"
        >
          <span>{saving ? '⏳ Saving Live...' : '💾 Save Changes Live'}</span>
        </button>
      </div>

      {/* Toast Alert */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-2xl text-xs font-black shadow-xl flex items-center justify-between ${
            toast.type === 'error'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
          }`}
        >
          <span>{toast.msg}</span>
          <button onClick={() => setToast(null)} className="text-slate-400 hover:text-white">✕</button>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-3 overflow-x-auto custom-scrollbar">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 space-y-3">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="text-xs font-bold">Loading Platform Business Rules...</div>
        </div>
      ) : activeTab === 'categories' ? (
        /* ─── TAB: 38 CATEGORY PLATFORM FEES MATRIX ─── */
        <div className="space-y-6">
          {/* Controls Banner */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-black text-white flex items-center gap-2">
                  <span>🏷️</span> 38 Wholesale Industry Categories Platform Fees
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Applied dynamically when suppliers submit quotations on RFQs, during Add Product calculations, and in live checkout breakdowns.
                </p>
              </div>

              {/* Quick Search */}
              <div className="relative w-full md:w-72">
                <input
                  type="text"
                  placeholder="Search 38 categories..."
                  value={searchCategory}
                  onChange={(e) => setSearchCategory(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white outline-none focus:ring-2 focus:ring-brand-500"
                />
                {searchCategory && (
                  <button
                    onClick={() => setSearchCategory('')}
                    className="absolute right-3 top-2 text-slate-500 hover:text-white text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Batch Helper Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-800 text-xs">
              <span className="text-slate-400 font-bold">Quick Actions:</span>
              <button
                type="button"
                onClick={() => handleApplyBulkFee(3)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold transition-all cursor-pointer"
              >
                Set All to 3%
              </button>
              <button
                type="button"
                onClick={() => handleApplyBulkFee(5)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold transition-all cursor-pointer"
              >
                Set All to 5%
              </button>
              <div className="flex items-center gap-1.5 ml-auto">
                <input
                  type="number"
                  step="0.1"
                  placeholder="Custom %"
                  value={bulkFeeInput}
                  onChange={(e) => setBulkFeeInput(e.target.value)}
                  className="w-24 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleApplyBulkFee(bulkFeeInput)}
                  className="px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold transition-all cursor-pointer"
                >
                  Apply All
                </button>
                <button
                  type="button"
                  onClick={handleResetDefaultCategoryFees}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl font-bold transition-all cursor-pointer"
                >
                  Reset Defaults
                </button>
              </div>
            </div>
          </div>

          {/* 38 Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSectors.map((sector) => {
              const currentFee = categoryFees[sector.slug] !== undefined ? categoryFees[sector.slug] : 3.0;
              const feeNumber = Number(currentFee) || 0;

              return (
                <div
                  key={sector.slug}
                  className="p-4 bg-slate-900 border border-slate-800 rounded-2xl hover:border-slate-700 transition-all flex flex-col justify-between gap-3 group shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-[10px] font-bold">
                          #{sector.id}
                        </span>
                        <h3 className="font-extrabold text-xs text-white group-hover:text-brand-400 transition-colors">
                          {sector.name}
                        </h3>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono block mt-1">
                        slug: {sector.slug}
                      </span>
                    </div>

                    <span className="px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20 text-[10px] font-black uppercase">
                      {feeNumber}% Fee
                    </span>
                  </div>

                  {/* Input and Quick Controls */}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleCategoryFeeChange(sector.slug, Math.max(0, Math.round((feeNumber - 0.5) * 10) / 10))}
                        className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center"
                      >
                        -
                      </button>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={currentFee}
                          onChange={(e) => handleCategoryFeeChange(sector.slug, e.target.value)}
                          className="w-20 px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-center text-xs font-mono font-bold text-emerald-400 outline-none focus:ring-2 focus:ring-brand-500"
                        />
                        <span className="absolute right-2 top-1.5 text-slate-500 text-xs font-bold pointer-events-none">%</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCategoryFeeChange(sector.slug, Math.round((feeNumber + 0.5) * 10) / 10)}
                        className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>

                    {/* Live preview */}
                    <span className="text-[10px] text-slate-400 font-mono">
                      ₹10k $\rightarrow$ <strong className="text-emerald-400">+₹{(10000 * (feeNumber / 100)).toFixed(0)}</strong>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Floating Save Button Bar */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-3xl flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Showing <strong>{filteredSectors.length}</strong> of <strong>38</strong> wholesale industry categories
            </span>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-xs rounded-2xl shadow-xl shadow-emerald-600/30 flex items-center gap-2 transition-all cursor-pointer"
            >
              <span>{saving ? '⏳ Saving Category Fees...' : '💾 Apply 38 Category Fees Live'}</span>
            </button>
          </div>
        </div>
      ) : activeTab === 'storage' ? (
        /* ─── TAB: CLOUDINARY CDN MEDIA STORAGE ─── */
        <div className="space-y-6">
          {/* Status & Overview Banner */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">☁️</span>
                  <h2 className="text-lg font-black text-white">
                    Cloudinary Media CDN & Storage Offloading
                  </h2>
                  {checkingCloudinary ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[11px] font-bold animate-pulse">
                      Checking status...
                    </span>
                  ) : cloudinaryStatus?.connected ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-black flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      CDN Connected ({cloudinaryStatus.cloudName})
                    </span>
                  ) : cloudinaryStatus?.configured ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-[11px] font-black">
                      ⚠️ Connection Error: {cloudinaryStatus.error}
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-black">
                      ⏳ API Keys Pending in .env.local
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  Offloads product images, catalog PDFs, inspection videos, and hero banners to Cloudinary CDN so Supabase remains strictly dedicated to structured SQL data.
                </p>
              </div>

              <button
                type="button"
                onClick={fetchCloudinaryStatus}
                disabled={checkingCloudinary}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 self-start md:self-auto"
              >
                <span>🔄</span>
                <span>Refresh Status</span>
              </button>
            </div>
          </div>

          {/* Architecture Split: Supabase vs Cloudinary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-slate-900 border border-emerald-500/20 rounded-3xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-xl">
                  🗄️
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">Supabase PostgreSQL</h3>
                  <span className="text-[11px] text-emerald-400 font-bold uppercase tracking-wider">
                    Structured Relational Data Only
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Stores lean, highly indexed database tables: user accounts, product titles, prices, orders, escrow milestones, and RFQ quotations. Keeps the database fast and prevents free-tier storage limits from being exhausted.
              </p>
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Stored format:</span>
                <span className="font-mono text-emerald-400 font-bold">SQL rows &amp; CDN URL strings</span>
              </div>
            </div>

            <div className="p-6 bg-slate-900 border border-sky-500/20 rounded-3xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-xl">
                  ☁️
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">Cloudinary Global CDN</h3>
                  <span className="text-[11px] text-sky-400 font-bold uppercase tracking-wider">
                    High-Volume Unstructured Media
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Stores heavy media taking massive disk space: multi-angle product photography, quality inspection videos, supplier PDFs, and dynamic banner slides. Automatically optimizes images to next-gen WebP/AVIF.
              </p>
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Dedicated Folders:</span>
                <span className="font-mono text-sky-400 font-bold">b2b-bharat/products, videos</span>
              </div>
            </div>
          </div>

          {/* Interactive Test Upload Section */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <span>⚡</span> Live Test Media Upload
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Generates an on-the-fly graphic asset and tests upload pipeline through <code className="text-brand-400">/api/upload</code>.
                </p>
              </div>

              <button
                type="button"
                onClick={handleTestUpload}
                disabled={testUploadLoading}
                className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-600/30 transition-all cursor-pointer flex items-center gap-2"
              >
                <span>{testUploadLoading ? '⏳ Uploading...' : '🚀 Test Media Upload Now'}</span>
              </button>
            </div>

            {testUploadResult && (
              <div className="mt-4 p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    <span>{testUploadResult.success ? '✅' : '❌'}</span>
                    <span>Test Result: {testUploadResult.message || (testUploadResult.success ? 'Success' : 'Error')}</span>
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300">
                    Provider: {testUploadResult.provider || 'unknown'}
                  </span>
                </div>

                {testUploadResult.url && (
                  <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                    <img
                      src={testUploadResult.url}
                      alt="Uploaded asset preview"
                      className="w-44 h-28 object-cover rounded-xl border border-slate-800 shadow"
                    />
                    <div className="flex-1 space-y-1 text-xs">
                      <div className="text-slate-400">
                        Asset URL:
                        <a
                          href={testUploadResult.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-brand-400 hover:underline block truncate font-mono mt-0.5"
                        >
                          {testUploadResult.url}
                        </a>
                      </div>
                      {testUploadResult.size && (
                        <div className="text-slate-500 font-mono text-[11px]">
                          Size: {(testUploadResult.size / 1024).toFixed(1)} KB • Bucket: {testUploadResult.bucket}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Environment Variables Reference Card */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <span>🔑</span> Cloudinary Environment Setup (.env.local)
            </h3>
            <p className="text-xs text-slate-400">
              Obtain your Cloud Name, API Key, and API Secret from your{' '}
              <a
                href="https://console.cloudinary.com/"
                target="_blank"
                rel="noreferrer"
                className="text-brand-400 hover:underline font-bold"
              >
                Cloudinary Dashboard
              </a>{' '}
              and place them into <code className="text-slate-200">.env.local</code>:
            </p>
            <pre className="p-4 bg-slate-950 border border-slate-800 rounded-2xl font-mono text-xs text-emerald-400 overflow-x-auto">
{`# Cloudinary Media CDN Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name`}
            </pre>
          </div>
        </div>
      ) : (
        /* ─── STANDARD SETTINGS TABS ─── */
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {currentTabKeys.map((key) => {
              const item = settings[key];
              const val = formValues[key];
              const isBool = typeof item.value === 'boolean';
              const isNum = typeof item.value === 'number';

              return (
                <div
                  key={key}
                  className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-3 shadow-sm hover:border-slate-700 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-white uppercase tracking-wider">
                        {item.label || key}
                      </label>
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 font-mono text-[10px]">
                        {key}
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-2">
                    {isBool ? (
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleChange(key, !val)}
                          className={`w-14 h-8 rounded-full transition-colors relative cursor-pointer ${
                            val ? 'bg-emerald-600' : 'bg-slate-800'
                          }`}
                        >
                          <span
                            className={`w-6 h-6 rounded-full bg-white absolute top-1 transition-transform ${
                              val ? 'left-7' : 'left-1'
                            }`}
                          />
                        </button>
                        <span className="text-xs font-bold text-slate-300">
                          {val ? 'Active / Enabled' : 'Inactive / Disabled'}
                        </span>
                      </div>
                    ) : (
                      <input
                        type={isNum ? 'number' : 'text'}
                        step={isNum ? 'any' : undefined}
                        value={val !== undefined ? val : ''}
                        onChange={(e) =>
                          handleChange(
                            key,
                            isNum ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value
                          )
                        }
                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm font-mono font-bold text-white focus:ring-2 focus:ring-brand-500 outline-none"
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* If on commercial tab, also show link to 38 categories */}
          {activeTab === 'commercial' && (
            <div className="p-5 bg-gradient-to-r from-brand-900/40 via-slate-900 to-slate-900 border border-brand-500/30 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
                  <span>🏷️</span> Manage Individual Fees for All 38 Categories
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Set specific percentage rates per sector (e.g. Agriculture: 3%, Industrial Machinery: 5%, Metals: 2.5%).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('categories')}
                className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-brand-600/30 cursor-pointer whitespace-nowrap"
              >
                Open 38 Categories Matrix →
              </button>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-xs rounded-2xl shadow-xl shadow-emerald-600/30 flex items-center gap-2 transition-all cursor-pointer"
            >
              <span>{saving ? '⏳ Applying Changes...' : '💾 Apply All Business Rules Live'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
