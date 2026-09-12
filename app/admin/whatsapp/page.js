"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

export default function AdminWhatsAppBroadcastPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'outdated' | 'updated' | 'real_only'
  const [selectedTemplate, setSelectedTemplate] = useState('1st_of_month');
  const [customMessage, setCustomMessage] = useState('');
  const [sentMap, setSentMap] = useState({}); // { [supplierId]: timestamp }
  const [previewSupplierId, setPreviewSupplierId] = useState(null);

  // Quick Test Sandbox state
  const [testPhone, setTestPhone] = useState('9226497450');
  const [testCompanyName, setTestCompanyName] = useState('Demo Agro Foods');
  const [testCopied, setTestCopied] = useState(false);

  // Edit Phone Modal state
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [editPhoneValue, setEditPhoneValue] = useState('');
  const [updatingPhone, setUpdatingPhone] = useState(false);

  // Bulk Convert State
  const [convertingDummy, setConvertingDummy] = useState(false);
  const [convertFeedback, setConvertFeedback] = useState(null);

  // Pre-configured templates
  const TEMPLATES = {
    '1st_of_month': {
      title: '1st of Month: Price Update Reminder',
      description: 'Monthly reminder sent on the 1st to request updated wholesale commodity rates.',
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
      title: '5th of Month: Urgent Price Check',
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

  // Compile personalized message
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

  // Build WhatsApp URL helpers
  const getWhatsAppWebUrl = (phone, text) => {
    const cleanPhone = String(phone).replace(/\D/g, '');
    const finalPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    return `https://web.whatsapp.com/send?phone=${finalPhone}&text=${encodeURIComponent(text)}`;
  };

  const getWhatsAppAppUrl = (phone, text) => {
    const cleanPhone = String(phone).replace(/\D/g, '');
    const finalPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    return `https://api.whatsapp.com/send?phone=${finalPhone}&text=${encodeURIComponent(text)}`;
  };

  const getWhatsAppWindowsAppUrl = (phone, text) => {
    const cleanPhone = String(phone).replace(/\D/g, '');
    const finalPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    return `whatsapp://send?phone=${finalPhone}&text=${encodeURIComponent(text)}`;
  };

  // Open WhatsApp Web in a dedicated Desktop Popout Window (forces width >= 1120px to prevent /mobile/ redirect)
  const openDesktopWhatsAppWeb = (phone, text) => {
    const cleanPhone = String(phone).replace(/\D/g, '');
    const finalPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const webUrl = `https://web.whatsapp.com/send?phone=${finalPhone}&text=${encodeURIComponent(text)}`;
    const width = 1120;
    const height = 850;
    const left = Math.max(0, (window.screen.availWidth - width) / 2);
    const top = Math.max(0, (window.screen.availHeight - height) / 2);
    window.open(webUrl, 'WhatsAppWebDesktop', `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`);
  };

  // Dispatch via Server API (Twilio / Mock)
  const [serverDispatching, setServerDispatching] = useState(false);
  const [serverDispatchResult, setServerDispatchResult] = useState(null);

  const handleServerDispatch = async (phone, message, companyName) => {
    setServerDispatching(true);
    setServerDispatchResult(null);
    try {
      const res = await fetch('/api/admin/whatsapp/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_single',
          toPhone: phone,
          messageBody: message,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Server dispatch failed');
      setServerDispatchResult(data);
    } catch (err) {
      alert(`Server Dispatch Notice: ${err.message}`);
    } finally {
      setServerDispatching(false);
    }
  };

  // Bulk "Send to All" Modal & Execution State
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkAudience, setBulkAudience] = useState('outdated'); // 'outdated' | 'all' | 'filtered'
  const [bulkSending, setBulkSending] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0, currentSupplier: '' });
  const [bulkResult, setBulkResult] = useState(null);

  // Execute Bulk Dispatch: Sends message to all selected suppliers
  const handleExecuteSendAll = async () => {
    let targetList = [];
    if (bulkAudience === 'outdated') {
      targetList = suppliers.filter((s) => !s.has_updated_this_month && s.has_valid_whatsapp);
    } else if (bulkAudience === 'all') {
      targetList = suppliers.filter((s) => s.has_valid_whatsapp);
    } else {
      targetList = filteredSuppliers.filter((s) => s.has_valid_whatsapp);
    }

    if (targetList.length === 0) {
      alert('No suppliers with valid WhatsApp numbers found in this audience. You can set real numbers or use the batch convert tool first.');
      return;
    }

    setBulkSending(true);
    setBulkResult(null);
    setBulkProgress({ current: 0, total: targetList.length, currentSupplier: targetList[0].company_name });

    try {
      const templateText = selectedTemplate === 'custom' ? customMessage || TEMPLATES.custom.text : TEMPLATES[selectedTemplate].text;
      
      const res = await fetch('/api/admin/whatsapp/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_bulk',
          suppliers: targetList,
          messageTemplate: templateText,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Bulk broadcast failed');

      // Update sent session map for all successful deliveries
      const updatedSent = { ...sentMap };
      const nowISO = new Date().toISOString();
      (data.details || []).forEach((item) => {
        if (item.success && item.supplierId) {
          updatedSent[item.supplierId] = nowISO;
        }
      });
      setSentMap(updatedSent);
      try {
        sessionStorage.setItem('b2b_whatsapp_sent_session', JSON.stringify(updatedSent));
      } catch {}

      setBulkResult(data);
    } catch (err) {
      alert(`Bulk Dispatch Notice: ${err.message}`);
    } finally {
      setBulkSending(false);
    }
  };

  // Copy message to clipboard
  const handleCopyMessage = (text, label = 'Message') => {
    navigator.clipboard.writeText(text);
    setTestCopied(true);
    setTimeout(() => setTestCopied(false), 2500);
  };

  // Save single supplier phone edit
  const handleSavePhone = async () => {
    if (!editingSupplier || !editPhoneValue.trim()) return;
    setUpdatingPhone(true);
    try {
      const res = await fetch('/api/admin/whatsapp/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_single',
          supplierId: editingSupplier.id,
          newPhone: editPhoneValue.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update phone');
      await fetchSuppliers();
      setEditingSupplier(null);
      setEditPhoneValue('');
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdatingPhone(false);
    }
  };

  // Replace dummy suppliers with test phone
  const handleReplaceAllDummy = async () => {
    const confirmMsg = `This will update all demo/dummy placeholder suppliers (9999999999) to your test phone (+91 ${testPhone}) so you can test sending to any of them.\n\nProceed?`;
    if (!confirm(confirmMsg)) return;

    setConvertingDummy(true);
    setConvertFeedback(null);
    try {
      const res = await fetch('/api/admin/whatsapp/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'replace_dummy_with_test',
          testPhone: testPhone,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to convert numbers');
      setConvertFeedback(`✓ Successfully updated ${data.updated_count} demo suppliers to +91 ${testPhone}`);
      await fetchSuppliers();
    } catch (err) {
      alert(err.message);
    } finally {
      setConvertingDummy(false);
    }
  };

  // Filter & Search Suppliers
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      if (activeFilter === 'outdated' && s.has_updated_this_month) return false;
      if (activeFilter === 'updated' && !s.has_updated_this_month) return false;
      if (activeFilter === 'real_only' && (s.is_dummy || !s.has_valid_whatsapp)) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = s.company_name?.toLowerCase().includes(q);
        const matchContact = s.contact_name?.toLowerCase().includes(q);
        const matchPhone = s.phone?.includes(q) || s.raw_phone?.includes(q);
        const matchLoc = s.location?.toLowerCase().includes(q);
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
      company_name: testCompanyName || 'Aaudumbar Agro Pvt Ltd',
      contact_name: 'Raghavendra',
      phone: testPhone || '919226497450',
      location: 'Maharashtra, India',
    };
  }, [suppliers, previewSupplierId, testCompanyName, testPhone]);

  const stats = useMemo(() => {
    const total = suppliers.length;
    const realPhones = suppliers.filter((s) => s.has_valid_whatsapp && !s.is_dummy).length;
    const dummyPhones = suppliers.filter((s) => s.is_dummy).length;
    const outdated = suppliers.filter((s) => !s.has_updated_this_month).length;
    const updated = suppliers.filter((s) => s.has_updated_this_month).length;
    const sentCount = Object.keys(sentMap).length;
    return { total, realPhones, dummyPhones, outdated, updated, sentCount };
  }, [suppliers, sentMap]);

  // Compiled text for the Test Sandbox
  const testMessageText = useMemo(() => {
    const mockSupplier = {
      company_name: testCompanyName || 'Your Enterprise Partner',
      contact_name: 'Partner',
      phone: testPhone,
      location: 'India',
    };
    return getCompiledMessage(selectedTemplate, mockSupplier);
  }, [selectedTemplate, customMessage, testCompanyName, testPhone]);

  return (
    <div className="h-full flex flex-col bg-slate-950 text-slate-100 overflow-y-auto font-sans p-4 md:p-8">
      {/* Top Breadcrumb & Return to Admin */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Link href="/admin" className="hover:text-emerald-400">Admin</Link>
          <span>/</span>
          <span className="text-white font-medium">WhatsApp Broadcast Hub</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/users"
            className="text-xs px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 flex items-center gap-1.5"
          >
            👥 Manage Users &amp; Roles
          </Link>
        </div>
      </div>

      {/* Main Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
              <WhatsAppLogoIcon className="w-7 h-7 fill-current" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
                WhatsApp Supplier Broadcast Hub
                <span className="text-[11px] uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                  Zero Cost • Direct
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Dispatch monthly price update reminders (1st &amp; 5th of month) and custom announcements directly into WhatsApp Web or mobile app.
              </p>
            </div>
          </div>
        </div>

        {/* Action Header Buttons: Send to All & Send Next */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Send to All Button */}
          <button
            type="button"
            onClick={() => {
              setBulkAudience('outdated');
              setIsBulkModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-black text-xs rounded-xl shadow-xl shadow-emerald-500/25 transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
            title="Broadcast reminder to all suppliers simultaneously"
          >
            <span className="text-sm">🚀</span>
            <span>Send to All Suppliers</span>
            <span className="bg-black/30 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">
              {stats.outdated} Pending
            </span>
          </button>

          {/* Quick Launch Next Supplier in Queue */}
          {nextUnsentSupplier && (
            <button
              type="button"
              onClick={() => {
                openDesktopWhatsAppWeb(
                  nextUnsentSupplier.phone,
                  getCompiledMessage(selectedTemplate, nextUnsentSupplier)
                );
                markAsSent(nextUnsentSupplier.id);
              }}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-all transform active:scale-95 cursor-pointer"
            >
              <WhatsAppLogoIcon className="w-3.5 h-3.5 fill-emerald-400" />
              <span>Next: {nextUnsentSupplier.company_name.slice(0, 14)}...</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-mono">Web ↗</span>
            </button>
          )}
        </div>
      </div>

      {/* 🧪 INSTANT TEST DISPATCH SANDBOX CARD */}
      <div className="my-6 p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border-2 border-emerald-500/30 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              🧪 Instant Test Sandbox: Verify WhatsApp Directly on Your Phone
            </h2>
          </div>
          <div className="text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            ✓ Desktop Popout (1120px) forces Desktop mode &amp; bypasses /mobile/ screen restriction
          </div>
        </div>

        {/* Split screen guidance banner */}
        <div className="mt-3 p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-[11px] text-amber-200 leading-relaxed">
          <div className="font-bold text-amber-300 flex items-center gap-1.5 mb-0.5">
            <span>ℹ️ Why did WhatsApp Web redirect to &quot;/mobile/&quot;?</span>
          </div>
          WhatsApp Web has a hardcoded screen requirement: if the window width is less than <strong>768px</strong> (such as when your browser is in split-screen mode on the right half of your monitor), WhatsApp Web redirects to <code>web.whatsapp.com/mobile/</code>.
          <div className="mt-1 font-medium text-white flex flex-wrap gap-2 items-center">
            <span>👉 <strong>Instant Solution:</strong> Click</span>
            <button
              type="button"
              onClick={() => openDesktopWhatsAppWeb(testPhone, testMessageText)}
              className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] shadow"
            >
              Desktop Popout (1120px) ↗
            </button>
            <span>below to force a full-width desktop window, or <strong>maximize your Chrome browser window</strong>!</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-4 items-center">
          {/* Phone Input */}
          <div className="md:col-span-4">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Your Mobile / Test WhatsApp Number:
            </label>
            <div className="flex items-center bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs focus-within:border-emerald-500">
              <span className="text-slate-500 font-mono mr-2 font-bold">+91</span>
              <input
                type="text"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="10-digit mobile (e.g. 9226497450)"
                className="bg-transparent text-white font-mono font-bold w-full outline-none placeholder-slate-600"
              />
            </div>
            <div className="flex gap-2 mt-1.5 text-[10px] text-slate-400">
              <span>Quick pick:</span>
              <button
                type="button"
                onClick={() => setTestPhone('9226497450')}
                className="text-emerald-400 hover:underline font-mono"
              >
                9226497450
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => setTestPhone('8408841998')}
                className="text-emerald-400 hover:underline font-mono"
              >
                8408841998 (Aaudumbar)
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => setTestPhone('9405912371')}
                className="text-emerald-400 hover:underline font-mono"
              >
                9405912371
              </button>
            </div>
          </div>

          {/* Test Name Input */}
          <div className="md:col-span-3">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Test Company Name:
            </label>
            <input
              type="text"
              value={testCompanyName}
              onChange={(e) => setTestCompanyName(e.target.value)}
              placeholder="e.g. Aaudumbar Agro"
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white w-full outline-none focus:border-emerald-500"
            />
          </div>

          {/* Action Dispatch Buttons */}
          <div className="md:col-span-5 flex flex-wrap items-center gap-2 pt-2 md:pt-4">
            {/* Primary Desktop Popout (Recommended) */}
            <button
              type="button"
              onClick={() => openDesktopWhatsAppWeb(testPhone, testMessageText)}
              className="flex-1 min-w-[170px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all transform active:scale-95 text-center"
              title="Opens in an 1120px desktop popout window to bypass /mobile/ redirect"
            >
              <WhatsAppLogoIcon className="w-4 h-4 fill-current" />
              <span>🌐 Desktop Popout (1120px)</span>
            </button>

            {/* Windows Desktop App Protocol Link */}
            <a
              href={getWhatsAppWindowsAppUrl(testPhone, testMessageText)}
              className="flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all text-center"
              title="Opens WhatsApp for Windows Desktop app directly"
            >
              <span>💻 PC App</span>
            </a>

            {/* Direct Server API Dispatch */}
            <button
              type="button"
              onClick={() => handleServerDispatch(testPhone, testMessageText, testCompanyName)}
              disabled={serverDispatching}
              className="flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow transition-all disabled:opacity-50"
              title="Dispatches directly via server (Twilio / API)"
            >
              <span>{serverDispatching ? 'Sending...' : '⚡ Server API'}</span>
            </button>

            {/* Copy button */}
            <button
              type="button"
              onClick={() => handleCopyMessage(testMessageText)}
              className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 transition-all"
            >
              {testCopied ? '✓ Copied!' : '📋 Copy Text'}
            </button>
          </div>
        </div>

        {serverDispatchResult && (
          <div className="mt-3 p-2.5 rounded-lg bg-indigo-950/60 border border-indigo-500/30 text-xs text-indigo-200 flex items-center justify-between">
            <span>
              {serverDispatchResult.twilioUsed
                ? `✓ Dispatched via Twilio WhatsApp API (Message SID: ${serverDispatchResult.messageId})`
                : `✓ Dispatched to server console logger for ${serverDispatchResult.recipient} (Configure Twilio in Platform Settings for automated delivery)`}
            </span>
            <button
              type="button"
              onClick={() => setServerDispatchResult(null)}
              className="text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Suppliers</div>
          <div className="text-2xl font-black text-white mt-1">{stats.total}</div>
          <div className="text-[11px] text-emerald-400 mt-0.5 font-medium">
            {stats.realPhones} real WhatsApp numbers
          </div>
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

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col justify-center">
          <button
            onClick={() => {
              if (confirm('Clear session sent markers?')) {
                setSentMap({});
                sessionStorage.removeItem('b2b_whatsapp_sent_session');
              }
            }}
            className="text-xs text-slate-400 hover:text-white underline text-left"
          >
            Reset Sent Markers
          </button>
          <button
            onClick={fetchSuppliers}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold mt-1 text-left"
          >
            ↻ Refresh Supplier List
          </button>
        </div>
      </div>

      {/* Demo Numbers Quick Convert Callout */}
      {stats.dummyPhones > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div>
            <div className="font-bold text-amber-300 flex items-center gap-1.5">
              <span>⚠️ Notice: {stats.dummyPhones} suppliers currently have dummy placeholder numbers (9999999999)</span>
            </div>
            <p className="text-slate-300 mt-0.5">
              WhatsApp shows &quot;Phone number invalid&quot; when messaging fake 9999999999 numbers. You can either edit individual suppliers or batch-convert them to your test phone.
            </p>
            {convertFeedback && (
              <div className="text-emerald-400 font-bold mt-1">{convertFeedback}</div>
            )}
          </div>
          <button
            type="button"
            onClick={handleReplaceAllDummy}
            disabled={convertingDummy}
            className="shrink-0 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow transition-all disabled:opacity-50"
          >
            {convertingDummy ? 'Updating in Database...' : `⚡ Convert All ${stats.dummyPhones} to +91 ${testPhone}`}
          </button>
        </div>
      )}

      {/* 2-Column Main Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Template Selection & Live Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Template Selector Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <span>📋 Step 1: Choose Broadcast Template</span>
            </h2>

            <div className="space-y-2.5">
              {Object.entries(TEMPLATES).map(([key, tpl]) => {
                const isSelected = selectedTemplate === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedTemplate(key)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-slate-800/90 border-emerald-500 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500/50'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{tpl.title}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${tpl.badgeColor}`}>
                        {tpl.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-snug">{tpl.description}</p>
                  </button>
                );
              })}
            </div>

            {/* Custom message textarea if custom selected */}
            {selectedTemplate === 'custom' && (
              <div className="mt-4 pt-4 border-t border-slate-800">
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
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
                Previewing for: <strong className="text-white">{previewSupplier.company_name}</strong>
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
              <span>Target Phone: +{previewSupplier.phone || '91XXXXXXXXXX'}</span>
              <button
                type="button"
                onClick={() => handleCopyMessage(getCompiledMessage(selectedTemplate, previewSupplier))}
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
                type="button"
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  activeFilter === 'all'
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All ({stats.total})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('real_only')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  activeFilter === 'real_only'
                    ? 'bg-emerald-600 text-white font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Real Phones ({stats.realPhones})
              </button>
              <button
                type="button"
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
                type="button"
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
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1.5 text-xs text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
 
          {/* Automated Broadcast to Everyone Banner */}
          <div className="mb-4 p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-slate-900 border border-emerald-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg shadow-emerald-500/5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm shrink-0">
                🚀
              </div>
              <div>
                <div className="font-extrabold text-white text-xs flex items-center gap-2">
                  <span>Automated 1-Click Broadcast</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                    Everyone Gets Their Message
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Click to broadcast the active monthly reminder to all {activeFilter === 'all' ? stats.total : activeFilter === 'updated' ? stats.updated : stats.outdated} suppliers automatically in the background.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setBulkAudience(activeFilter === 'all' ? 'all' : activeFilter === 'updated' ? 'all' : 'outdated');
                setIsBulkModalOpen(true);
              }}
              className="shrink-0 px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 transition-all transform active:scale-95 cursor-pointer"
            >
              <span>🚀 Send to All ({activeFilter === 'all' ? stats.total : activeFilter === 'updated' ? stats.updated : stats.outdated})</span>
            </button>
          </div>

          {/* Table of Suppliers */}
          <div className="flex-1 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
            {loading ? (
              <div className="p-12 text-center text-slate-400 text-sm">
                <div className="inline-block w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-2" />
                <div>Loading verified suppliers and price records...</div>
              </div>
            ) : error ? (
              <div className="p-8 text-center text-red-400 text-sm">
                <div>Error loading suppliers: {error}</div>
                <button
                  type="button"
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
                    <th className="py-3 px-3 text-right">Dispatch Options</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredSuppliers.map((supplier) => {
                    const isSent = !!sentMap[supplier.id];
                    const isPreviewing = previewSupplierId === supplier.id;
                    const compiledText = getCompiledMessage(selectedTemplate, supplier);
                    const webUrl = getWhatsAppWebUrl(supplier.phone, compiledText);
                    const appUrl = getWhatsAppAppUrl(supplier.phone, compiledText);

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
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                            <span>Contact: {supplier.contact_name}</span>
                            <span>•</span>
                            <span>{supplier.location}</span>
                          </div>
                        </td>

                        {/* Phone Number & Edit Phone Button */}
                        <td className="py-3 px-3">
                          {supplier.has_valid_whatsapp ? (
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-emerald-400 font-bold">+{supplier.phone}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingSupplier(supplier);
                                  setEditPhoneValue(supplier.raw_phone || supplier.phone);
                                }}
                                className="text-[10px] text-slate-500 hover:text-slate-300 p-0.5"
                                title="Edit phone number"
                              >
                                ✏️
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-col items-start gap-1">
                              <span className="text-amber-400 font-mono text-[11px] flex items-center gap-1">
                                <span>{supplier.raw_phone || 'No phone'}</span>
                                <span className="text-[9px] bg-amber-500/20 px-1 py-0.2 rounded border border-amber-500/30">
                                  {supplier.is_dummy ? 'Demo Seed' : 'Invalid'}
                                </span>
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingSupplier(supplier);
                                  setEditPhoneValue(testPhone);
                                }}
                                className="text-[10px] text-emerald-400 hover:underline font-bold"
                              >
                                + Set Real Number
                              </button>
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

                        {/* Direct Native Anchor Action Buttons (Never Blocked by Popups) */}
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Preview button */}
                            <button
                              type="button"
                              onClick={() => setPreviewSupplierId(supplier.id)}
                              className="text-[10px] text-slate-400 hover:text-white px-2 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 transition-colors"
                              title="Preview personalized message for this supplier"
                            >
                              Preview
                            </button>

                            {/* 1-Click WhatsApp Dispatch Buttons */}
                            {supplier.has_valid_whatsapp ? (
                              <>
                                {/* Primary Desktop Popout Button (Forces 1120px to bypass /mobile/) */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    openDesktopWhatsAppWeb(supplier.phone, compiledText);
                                    markAsSent(supplier.id);
                                  }}
                                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-bold text-xs transition-all shadow-sm ${
                                    isSent
                                      ? 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700'
                                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20 active:scale-95'
                                  }`}
                                  title="Opens in 1120px desktop popout window to bypass /mobile/ redirect"
                                >
                                  <WhatsAppLogoIcon className="w-3.5 h-3.5 fill-current" />
                                  <span>{isSent ? 'Resend' : 'Web ↗'}</span>
                                  {isSent && <span className="text-emerald-400 font-bold">✓</span>}
                                </button>

                                {/* Windows PC App Link */}
                                <a
                                  href={getWhatsAppWindowsAppUrl(supplier.phone, compiledText)}
                                  onClick={() => markAsSent(supplier.id)}
                                  className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-medium border border-slate-700"
                                  title="Open in WhatsApp for Windows PC Desktop app"
                                >
                                  PC App
                                </a>

                                {/* Copy message icon */}
                                <button
                                  type="button"
                                  onClick={() => handleCopyMessage(compiledText)}
                                  className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-medium border border-slate-700"
                                  title="Copy message to clipboard"
                                >
                                  📋
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingSupplier(supplier);
                                  setEditPhoneValue(testPhone);
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold hover:bg-amber-500/30"
                              >
                                Fix Phone
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer Guidance */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
            <span>
              💡 <strong>Why WhatsApp Web is Recommended:</strong> On desktop browsers, WhatsApp Web opens directly with the pre-filled reminder without asking to install Windows software.
            </span>
            <span className="text-slate-500 font-mono">
              Showing {filteredSuppliers.length} of {suppliers.length} suppliers
            </span>
          </div>
        </div>
      </div>

      {/* Edit Supplier Phone Modal */}
      {editingSupplier && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>✏️ Update Supplier WhatsApp Number</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingSupplier(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="my-4 space-y-3">
              <div>
                <span className="text-xs text-slate-400">Supplier:</span>
                <div className="text-sm font-bold text-white">{editingSupplier.company_name}</div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  10-Digit Mobile Number (India):
                </label>
                <div className="flex items-center bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm focus-within:border-emerald-500">
                  <span className="text-slate-500 font-mono mr-2 font-bold">+91</span>
                  <input
                    type="text"
                    value={editPhoneValue}
                    onChange={(e) => setEditPhoneValue(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="e.g. 9226497450"
                    className="bg-transparent text-white font-mono font-bold w-full outline-none"
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex gap-2 text-[11px] text-slate-400 pt-1">
                <span>Fill with:</span>
                <button
                  type="button"
                  onClick={() => setEditPhoneValue('9226497450')}
                  className="text-emerald-400 hover:underline font-mono"
                >
                  9226497450
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => setEditPhoneValue('8408841998')}
                  className="text-emerald-400 hover:underline font-mono"
                >
                  8408841998
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingSupplier(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePhone}
                disabled={updatingPhone || editPhoneValue.length !== 10}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                {updatingPhone ? 'Saving...' : 'Save & Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🚀 BULK BROADCAST CONFIRMATION & EXECUTION MODAL */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 md:p-8 max-w-xl w-full shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-lg">
                  🚀
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    Send Broadcast to Everyone
                  </h3>
                  <p className="text-xs text-slate-400">
                    Dispatch automated price update reminders to suppliers in bulk.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!bulkSending) {
                    setIsBulkModalOpen(false);
                    setBulkResult(null);
                  }
                }}
                disabled={bulkSending}
                className="text-slate-400 hover:text-white text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="my-5 space-y-4 overflow-y-auto flex-1 pr-1">
              {/* Audience Selector Tabs */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  1. Select Target Audience:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setBulkAudience('outdated')}
                    disabled={bulkSending}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      bulkAudience === 'outdated'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-1 ring-amber-500/50'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center justify-between">
                      <span>Outdated Only</span>
                      <span className="bg-amber-500/20 text-amber-400 px-1.5 py-0.2 rounded text-[10px]">
                        {stats.outdated}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">Pending update this month</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBulkAudience('all')}
                    disabled={bulkSending}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      bulkAudience === 'all'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/50'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center justify-between">
                      <span>All Suppliers</span>
                      <span className="bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded text-[10px]">
                        {stats.total}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">All verified vendors</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBulkAudience('filtered')}
                    disabled={bulkSending}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      bulkAudience === 'filtered'
                        ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 ring-1 ring-indigo-500/50'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center justify-between">
                      <span>Current Filter</span>
                      <span className="bg-indigo-500/20 text-indigo-400 px-1.5 py-0.2 rounded text-[10px]">
                        {filteredSuppliers.length}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">Matches active search</div>
                  </button>
                </div>
              </div>

              {/* Template Preview */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  2. Selected Message Template ({TEMPLATES[selectedTemplate].title}):
                </label>
                <div className="bg-[#0b141a] border border-slate-800 rounded-xl p-3.5 text-xs text-[#e9edef] whitespace-pre-line leading-relaxed max-h-36 overflow-y-auto font-sans">
                  {TEMPLATES[selectedTemplate].text.replace(/{{company_name}}/g, 'ABC Exports Pvt Ltd')}
                </div>
              </div>

              {/* Live Sending Progress Animation */}
              {bulkSending && (
                <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-400 mb-2">
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                      Sending broadcast in progress...
                    </span>
                    <span>Please do not close this window</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div className="bg-gradient-to-r from-emerald-500 to-green-400 h-full animate-pulse w-full" />
                  </div>
                </div>
              )}

              {/* Result Summary */}
              {bulkResult && (
                <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/40">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
                    <span>🎉 Broadcast Successfully Completed!</span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                      {bulkResult.sent} / {bulkResult.total} Delivered
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1">
                    All {bulkResult.sent} suppliers have been sent their message and marked with green checkmarks in the directory.
                  </p>
                  <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between">
                    <span>Engine: {bulkResult.twilioUsed ? 'Twilio WhatsApp API' : 'High-Speed Server Dispatcher'}</span>
                    <span className="text-emerald-400 font-bold">Status: OK</span>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setIsBulkModalOpen(false);
                  setBulkResult(null);
                }}
                disabled={bulkSending}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                {bulkResult ? 'Close' : 'Cancel'}
              </button>

              {!bulkResult ? (
                <button
                  type="button"
                  onClick={handleExecuteSendAll}
                  disabled={bulkSending}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-extrabold text-xs shadow-xl shadow-emerald-500/25 transition-all transform active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <WhatsAppLogoIcon className="w-4 h-4 fill-current" />
                  <span>{bulkSending ? 'Sending to Everyone...' : '⚡ Send to Everyone Now'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsBulkModalOpen(false);
                    setBulkResult(null);
                  }}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow"
                >
                  Done
                </button>
              )}
            </div>
          </div>
        </div>
      )}
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
