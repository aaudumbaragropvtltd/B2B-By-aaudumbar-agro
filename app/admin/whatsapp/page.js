"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

export default function AdminWhatsAppBroadcastPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('outdated'); // 'outdated' | 'all' | 'updated'
  const [selectedTemplate, setSelectedTemplate] = useState('1st_of_month');
  const [customMessage, setCustomMessage] = useState('');
  const [sentMap, setSentMap] = useState({}); // { [supplierId]: timestamp }
  const [previewSupplierId, setPreviewSupplierId] = useState(null);

  // Pre-configured templates
  const TEMPLATES = {
    '1st_of_month': {
      title: '1st of Month: Price Update Reminder',
      description: 'Monthly reminder sent on the 1st to request updated commodity rates.',
      badge: '1st of Month',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      text: `Namaste {{company_name}}! 🌾

Greetings from B2B India! It's the beginning of the month — kindly review and update your wholesale commodity prices on your portal.

Keeping your prices updated ensures verified bulk buyers receive accurate rates and keeps your catalog at the top of buyer inquiries.

👉 Update your prices here: https://b2bindia.site/dashboard/products

Thank you for your partnership!
— Team B2B India (Aaudumbar Agro Pvt. Ltd.)`,
    },
    '5th_of_month': {
      title: '5th of Month: Follow-up Reminder',
      description: 'Follow-up for suppliers who have not yet refreshed their rates this month.',
      badge: '5th of Month',
      badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      text: `Namaste {{company_name}}! 🌾

This is a gentle follow-up from B2B India.

We noticed your wholesale product prices haven't been updated yet for this month. Please update your rates today so your catalog remains active and highlighted for incoming Request for Quotations (RFQs).

👉 Update your prices now: https://b2bindia.site/dashboard/products

(If you have already updated your prices recently, thank you so much!)
— Team B2B India (Aaudumbar Agro Pvt. Ltd.)`,
    },
    custom: {
      title: 'Custom Announcement',
      description: 'Compose your own custom broadcast message for all or filtered suppliers.',
      badge: 'Custom',
      badgeColor: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
      text: customMessage || `Namaste {{company_name}}! 🌾\n\nImportant update from B2B India:\n\n[Write your message here]\n\nAccess your dashboard: https://b2bindia.site/dashboard\n— Team B2B India`,
    },
  };

  // Fetch suppliers list
  useEffect(() => {
    fetchSuppliers();
    // Load sent history from sessionStorage if available
    try {
      const savedSent = sessionStorage.getItem('b2b_whatsapp_sent_session');
      if (savedSent) setSentMap(JSON.parse(savedSent));
    } catch {}
  }, []);

  const fetchSuppliers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/whatsapp/suppliers');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch suppliers');
      setSuppliers(data.suppliers || []);
      if (data.suppliers?.length > 0) {
        setPreviewSupplierId(data.suppliers[0].id);
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Compile personalized message for a specific supplier
  const getCompiledMessage = (templateKey, supplier) => {
    if (!supplier) return '';
    const baseText = templateKey === 'custom' ? customMessage || TEMPLATES.custom.text : TEMPLATES[templateKey].text;
    return baseText
      .replace(/{{company_name}}/g, supplier.company_name || 'Partner')
      .replace(/{{contact_name}}/g, supplier.contact_name || 'Partner')
      .replace(/{{phone}}/g, supplier.phone || '')
      .replace(/{{location}}/g, supplier.location || 'India')
      .replace(/{{portal_url}}/g, 'https://b2bindia.site/dashboard/products');
  };

  // Mark supplier as sent
  const markAsSent = (supplierId) => {
    const updated = { ...sentMap, [supplierId]: new Date().toISOString() };
    setSentMap(updated);
    try {
      sessionStorage.setItem('b2b_whatsapp_sent_session', JSON.stringify(updated));
    } catch {}
  };

  // Trigger 1-Click WhatsApp
  const handleSendWhatsApp = (supplier) => {
    if (!supplier.has_valid_whatsapp) {
      alert(`Invalid phone number: ${supplier.raw_phone || 'No phone'}. Please edit the supplier's phone in Users Data.`);
      return;
    }
    const message = getCompiledMessage(selectedTemplate, supplier);
    const encodedText = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${supplier.phone}?text=${encodedText}`;

    // Open WhatsApp Web/App
    window.open(whatsappUrl, '_blank');
    markAsSent(supplier.id);
  };

  // Copy message to clipboard
  const handleCopyMessage = (supplier) => {
    const message = getCompiledMessage(selectedTemplate, supplier);
    navigator.clipboard.writeText(message);
    alert(`Message copied to clipboard for ${supplier.company_name}!`);
  };

  // Filter & Search Suppliers
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      // 1. Audience filter
      if (activeFilter === 'outdated' && s.has_updated_this_month) return false;
      if (activeFilter === 'updated' && !s.has_updated_this_month) return false;

      // 2. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = s.company_name.toLowerCase().includes(q);
        const matchContact = s.contact_name.toLowerCase().includes(q);
        const matchPhone = s.phone.includes(q) || s.raw_phone.includes(q);
        const matchLoc = s.location.toLowerCase().includes(q);
        if (!matchName && !matchContact && !matchPhone && !matchLoc) return false;
      }

      return true;
    });
  }, [suppliers, activeFilter, searchQuery]);

  // Next unsent supplier in queue
  const nextUnsentSupplier = useMemo(() => {
    return filteredSuppliers.find((s) => !sentMap[s.id] && s.has_valid_whatsapp);
  }, [filteredSuppliers, sentMap]);

  // Preview Supplier
  const previewSupplier = useMemo(() => {
    return suppliers.find((s) => s.id === previewSupplierId) || suppliers[0] || {
      company_name: 'Example Agro Foods Ltd.',
      contact_name: 'Rajesh Kumar',
      phone: '918408841998',
      location: 'Maharashtra, India',
    };
  }, [suppliers, previewSupplierId]);

  const stats = useMemo(() => {
    const total = suppliers.length;
    const withPhone = suppliers.filter((s) => s.has_valid_whatsapp).length;
    const outdated = suppliers.filter((s) => !s.has_updated_this_month).length;
    const updated = suppliers.filter((s) => s.has_updated_this_month).length;
    const sentCount = Object.keys(sentMap).length;
    return { total, withPhone, outdated, updated, sentCount };
  }, [suppliers, sentMap]);

  return (
    <div className="h-full flex flex-col bg-slate-950 text-slate-100 overflow-y-auto font-sans p-6 md:p-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <WhatsAppLogoIcon className="w-6 h-6 fill-current" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                WhatsApp Supplier Broadcast Hub
                <span className="text-xs uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                  1-Click Direct
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Dispatch monthly price update reminders (1st &amp; 5th of month) and announcements directly to suppliers&apos; WhatsApp with zero API fees.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Launch Next Button */}
        {nextUnsentSupplier && (
          <button
            onClick={() => handleSendWhatsApp(nextUnsentSupplier)}
            className="flex items-center gap-2.5 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition-all transform active:scale-95"
          >
            <WhatsAppLogoIcon className="w-5 h-5 fill-current" />
            <span>Send Next: {nextUnsentSupplier.company_name.slice(0, 18)}...</span>
            <span className="text-xs bg-black/20 px-2 py-0.5 rounded-md">🚀</span>
          </button>
        )}
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 my-6">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Suppliers</div>
          <div className="text-2xl font-black text-white mt-1">{stats.total}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">{stats.withPhone} valid WhatsApp numbers</div>
        </div>

        <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-4">
          <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            Outdated Prices
          </div>
          <div className="text-2xl font-black text-amber-300 mt-1">{stats.outdated}</div>
          <div className="text-[11px] text-amber-400/80 mt-0.5">Need 5th follow-up reminder</div>
        </div>

        <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-4">
          <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Updated This Month
          </div>
          <div className="text-2xl font-black text-emerald-300 mt-1">{stats.updated}</div>
          <div className="text-[11px] text-emerald-400/80 mt-0.5">Active fresh pricing</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Sent This Session</div>
          <div className="text-2xl font-black text-indigo-300 mt-1">{stats.sentCount}</div>
          <div className="text-[11px] text-indigo-400/80 mt-0.5">Completed chats</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 col-span-2 md:col-span-1 flex flex-col justify-center">
          <button
            onClick={() => {
              if (confirm('Clear session sent markers?')) {
                setSentMap({});
                sessionStorage.removeItem('b2b_whatsapp_sent_session');
              }
            }}
            className="text-xs text-slate-400 hover:text-white border border-slate-700 hover:border-slate-600 rounded-xl py-2 px-3 transition-colors text-center"
          >
            Reset Sent Markers
          </button>
        </div>
      </div>

      {/* Main Workspace: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Template Selection & Live Preview (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Template Picker */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center justify-between">
              <span>Select Reminder Template</span>
              <span className="text-[10px] text-slate-400 font-normal">Auto-inserts supplier details</span>
            </h3>

            <div className="space-y-3">
              {Object.entries(TEMPLATES).map(([key, tpl]) => {
                const isSelected = selectedTemplate === key;
                return (
                  <div
                    key={key}
                    onClick={() => setSelectedTemplate(key)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-slate-800/90 border-emerald-500 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500/50'
                        : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-white">{tpl.title}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tpl.badgeColor}`}>
                        {tpl.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{tpl.description}</p>
                  </div>
                );
              })}
            </div>

            {/* Custom Message Editor (if selected) */}
            {selectedTemplate === 'custom' && (
              <div className="mt-4 pt-4 border-t border-slate-800">
                <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                  Custom Message Content:
                </label>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Type custom announcement message here..."
                  rows={6}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-[10px] text-slate-400 mr-1 self-center">Insert tag:</span>
                  {['{{company_name}}', '{{contact_name}}', '{{portal_url}}'].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setCustomMessage((prev) => (prev ? `${prev} ${tag}` : tag))}
                      className="text-[10px] px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 font-mono"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Live WhatsApp Chat Bubble Preview */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Live WhatsApp Chat Preview
              </span>
              <span className="text-[11px] text-slate-400">
                Showing for: <strong className="text-white">{previewSupplier.company_name}</strong>
              </span>
            </div>

            {/* WhatsApp Chat Container */}
            <div className="bg-[#0b141a] rounded-xl p-4 border border-slate-800/80 relative overflow-hidden">
              <div className="max-w-[92%] bg-[#005c4b] text-[#e9edef] rounded-2xl rounded-tr-sm p-3.5 shadow text-xs whitespace-pre-line leading-relaxed font-sans border border-[#025142]">
                {getCompiledMessage(selectedTemplate, previewSupplier)}
                <div className="text-[9px] text-emerald-200/60 text-right mt-2 flex items-center justify-end gap-1">
                  <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="text-emerald-300">✓✓</span>
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
              <span>Recipient: +{previewSupplier.phone || '91XXXXXXXXXX'}</span>
              <button
                onClick={() => handleCopyMessage(previewSupplier)}
                className="text-emerald-400 hover:underline font-medium"
              >
                Copy Preview Text
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Suppliers Directory & Dispatch Queue (7 cols) */}
        <div className="lg:col-span-7 flex flex-col bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
          {/* Filter Tabs & Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
            {/* Filter Pills */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setActiveFilter('outdated')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  activeFilter === 'outdated'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Outdated ({stats.outdated})
              </button>
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  activeFilter === 'all'
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All Suppliers ({stats.total})
              </button>
              <button
                onClick={() => setActiveFilter('updated')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  activeFilter === 'updated'
                    ? 'bg-slate-800 text-white font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Updated ({stats.updated})
              </button>
            </div>

            {/* Search Box */}
            <div className="relative flex-1 sm:max-w-xs">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search company, phone..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1.5 text-xs text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Table of Suppliers */}
          <div className="flex-1 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
            {loading ? (
              <div className="p-12 text-center text-slate-400 text-sm">
                <div className="inline-block w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-2" />
                <div>Loading suppliers and price records...</div>
              </div>
            ) : error ? (
              <div className="p-8 text-center text-red-400 text-sm">
                <div>Error loading suppliers: {error}</div>
                <button
                  onClick={fetchSuppliers}
                  className="mt-3 px-3 py-1 bg-red-500/20 text-red-300 rounded-lg border border-red-500/30 text-xs"
                >
                  Retry
                </button>
              </div>
            ) : filteredSuppliers.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                No suppliers match your current filter or search criteria.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider sticky top-0 z-10">
                  <tr>
                    <th className="py-3 px-3">Supplier / Company</th>
                    <th className="py-3 px-3">WhatsApp Number</th>
                    <th className="py-3 px-3">Price Status</th>
                    <th className="py-3 px-3 text-right">1-Click Dispatch</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredSuppliers.map((supplier) => {
                    const isSent = !!sentMap[supplier.id];
                    const isPreviewing = previewSupplierId === supplier.id;

                    return (
                      <tr
                        key={supplier.id}
                        className={`hover:bg-slate-900/50 transition-colors ${
                          isPreviewing ? 'bg-emerald-950/20' : ''
                        }`}
                      >
                        {/* Company Info */}
                        <td className="py-3 px-3">
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span>{supplier.company_name}</span>
                            {supplier.verification_level === 'Diamond' && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
                                💎 Diamond
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                            <span>Contact: {supplier.contact_name}</span>
                            <span>•</span>
                            <span>{supplier.location}</span>
                          </div>
                        </td>

                        {/* Phone Number */}
                        <td className="py-3 px-3">
                          {supplier.has_valid_whatsapp ? (
                            <div className="font-mono text-emerald-400 flex items-center gap-1">
                              <span>+{supplier.phone}</span>
                            </div>
                          ) : (
                            <div className="text-rose-400 font-mono flex items-center gap-1">
                              <span>{supplier.raw_phone || 'No phone'}</span>
                              <span className="text-[9px] bg-rose-500/20 px-1 rounded">Invalid</span>
                            </div>
                          )}
                        </td>

                        {/* Price Status */}
                        <td className="py-3 px-3">
                          {supplier.has_updated_this_month ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              Updated ({supplier.product_count} items)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                              Pending Update
                            </span>
                          )}
                        </td>

                        {/* 1-Click Action Buttons */}
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Preview button */}
                            <button
                              type="button"
                              onClick={() => setPreviewSupplierId(supplier.id)}
                              className="text-[10px] text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 transition-colors"
                              title="Preview personalized message for this supplier"
                            >
                              Preview
                            </button>

                            {/* 1-Click WhatsApp Button */}
                            <button
                              type="button"
                              onClick={() => handleSendWhatsApp(supplier)}
                              disabled={!supplier.has_valid_whatsapp}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all shadow-sm ${
                                isSent
                                  ? 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700'
                                  : supplier.has_valid_whatsapp
                                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20 active:scale-95'
                                  : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                              }`}
                            >
                              <WhatsAppLogoIcon className="w-3.5 h-3.5 fill-current" />
                              <span>{isSent ? 'Resend' : 'Send'}</span>
                              {isSent && <span className="text-emerald-400 font-bold">✓</span>}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer Info / Reminder Notes */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
            <span>
              💡 <strong>How it works:</strong> Clicking <strong>Send</strong> opens WhatsApp Web with the pre-filled personalized reminder for that supplier. Zero API fees.
            </span>
            <span className="text-slate-500 font-mono">
              Showing {filteredSuppliers.length} of {suppliers.length} suppliers
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Inline SVG Icon for WhatsApp
function WhatsAppLogoIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}
