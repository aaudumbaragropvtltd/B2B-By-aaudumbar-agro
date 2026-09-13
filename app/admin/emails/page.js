"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

export default function AdminEmailBroadcastPage() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    validEmails: 0,
    suppliers: 0,
    buyers: 0,
    outdated: 0,
    updated: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'suppliers' | 'buyers' | 'outdated' | 'updated'
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  // Template & Custom Composer
  const [selectedTemplate, setSelectedTemplate] = useState('1st_of_month');
  const [customSubject, setCustomSubject] = useState('');
  const [customBody, setCustomBody] = useState('');
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewSubject, setPreviewSubject] = useState('');
  const [previewDevice, setPreviewDevice] = useState('desktop'); // 'desktop' | 'mobile'

  // Gemini AI Studio
  const [aiGoal, setAiGoal] = useState('price_reminder');
  const [aiLanguage, setAiLanguage] = useState('english');
  const [aiTone, setAiTone] = useState('professional');
  const [aiCustomPrompt, setAiCustomPrompt] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiError, setAiError] = useState(null);

  // Test Email Sandbox
  const [testEmail, setTestEmail] = useState('b2bbharat.in@gmail.com');
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Cron Run State
  const [triggeringCron, setTriggeringCron] = useState(false);
  const [cronFeedback, setCronFeedback] = useState(null);

  // Bulk Dispatch Modal
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkAudience, setBulkAudience] = useState('all'); // 'all' | 'suppliers' | 'buyers' | 'outdated' | 'selected'
  const [bulkSending, setBulkSending] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
  const [bulkResult, setBulkResult] = useState(null);

  const TEMPLATES = {
    '1st_of_month': {
      id: '1st_of_month',
      title: '🌾 1st of Month: Wholesale Price Update Reminder',
      description: 'Monthly reminder sent on the 1st to request updated wholesale commodity rates across all categories.',
      badge: '1st of Month',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      defaultSubject: '🌾 [1st of Month Reminder] Update Your Wholesale Prices & Catalog | B2B India',
    },
    '5th_of_month': {
      id: '5th_of_month',
      title: '🚨 5th of Month: Urgent Price Verification & RFQ Protection',
      description: 'Urgent follow-up for suppliers who haven’t yet refreshed rates this month. Protects active quote matching.',
      badge: '5th of Month',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      defaultSubject: '🚨 [Urgent: 5th of Month] Confirm Your Active Spot Rates Today | B2B India',
    },
    'buyer_demand': {
      id: 'buyer_demand',
      title: '📢 High Buyer Demand & Bulk Purchase Notice',
      description: 'Notifies suppliers that verified institutional buyers are placing bulk purchase requests with 10% advance escrow.',
      badge: 'Demand Bulletin',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
      defaultSubject: '📢 [High Buyer Demand] Verified Institutional Purchase Orders Active in Mandis | B2B India',
    },
    'custom': {
      id: 'custom',
      title: '✨ Gemini AI & Custom Broadcast Campaign',
      description: 'Compose custom announcements manually or generate dynamically with Google Gemini AI.',
      badge: '✨ Gemini AI',
      badgeColor: 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-300 border-purple-500/30',
      defaultSubject: 'Important Trade Update from B2B India Marketplace',
    },
  };

  // Fetch users & stats
  useEffect(() => {
    fetchUsers();
  }, []);

  // Update preview whenever template or custom fields change
  useEffect(() => {
    updateLivePreview();
  }, [selectedTemplate, customSubject, customBody]);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/emails/users');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch users');
      setUsers(data.users || []);
      setStats(data.stats || {});
      setSelectedUserIds((data.users || []).map((u) => u.id));
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateLivePreview = async () => {
    try {
      const res = await fetch('/api/admin/emails/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'preview',
          templateKey: selectedTemplate,
          customSubject,
          customBody,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPreviewHtml(data.html || '');
        setPreviewSubject(data.subject || '');
      }
    } catch (err) {
      console.error('Preview error:', err);
    }
  };

  // Generate Email using Gemini AI
  const handleGenerateAiEmail = async () => {
    setAiGenerating(true);
    setAiError(null);
    setAiResult(null);
    try {
      const res = await fetch('/api/admin/emails/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal: aiGoal,
          language: aiLanguage,
          tone: aiTone,
          customPrompt: aiCustomPrompt,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to synthesize email with Gemini AI');

      setAiResult(data);
      if (data.subject) setCustomSubject(data.subject);
      if (data.body) setCustomBody(data.body);
      setSelectedTemplate('custom');
    } catch (err) {
      console.error('Gemini error:', err);
      setAiError(err.message);
    } finally {
      setAiGenerating(false);
    }
  };

  // Send Single Test Email
  const handleSendTestEmail = async () => {
    if (!testEmail || !testEmail.includes('@')) {
      alert('Please enter a valid test email address.');
      return;
    }
    setSendingTest(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/admin/emails/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_test',
          testEmail,
          templateKey: selectedTemplate,
          customSubject,
          customBody,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send test email');
      setTestResult(data);
    } catch (err) {
      alert(`Test Email Error: ${err.message}`);
    } finally {
      setSendingTest(false);
    }
  };

  // Trigger Cron Directly
  const handleTriggerCron = async (forceCycle) => {
    const cycleName = forceCycle === '1st' ? '1st of Month Reminder' : '5th of Month Urgent Check';
    if (!confirm(`Trigger the automated ${cycleName} email campaign immediately for all eligible users?`)) return;

    setTriggeringCron(true);
    setCronFeedback(null);
    try {
      const res = await fetch(`/api/cron/email-reminders?force=${forceCycle}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Cron run failed');
      setCronFeedback(data);
    } catch (err) {
      alert(`Cron Trigger Error: ${err.message}`);
    } finally {
      setTriggeringCron(false);
    }
  };

  // Send Bulk Email to All Users Simultaneously
  const handleExecuteSendAll = async () => {
    let targetList = [];
    if (bulkAudience === 'all') {
      targetList = users.filter((u) => u.has_valid_email);
    } else if (bulkAudience === 'suppliers') {
      targetList = users.filter((u) => u.role === 'supplier' && u.has_valid_email);
    } else if (bulkAudience === 'buyers') {
      targetList = users.filter((u) => u.role === 'buyer' && u.has_valid_email);
    } else if (bulkAudience === 'outdated') {
      targetList = users.filter((u) => u.role === 'supplier' && !u.has_updated_this_month && u.has_valid_email);
    } else {
      targetList = users.filter((u) => selectedUserIds.includes(u.id) && u.has_valid_email);
    }

    if (targetList.length === 0) {
      alert('No users with valid email addresses found in the selected audience.');
      return;
    }

    setBulkSending(true);
    setBulkResult(null);
    setBulkProgress({ current: 0, total: targetList.length });

    try {
      const res = await fetch('/api/admin/emails/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_bulk',
          recipients: targetList,
          templateKey: selectedTemplate,
          customSubject,
          customBody,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Bulk dispatch failed');
      setBulkResult(data);
    } catch (err) {
      alert(`Bulk Email Notice: ${err.message}`);
    } finally {
      setBulkSending(false);
    }
  };

  // Filtered users list
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (activeFilter === 'suppliers' && u.role !== 'supplier') return false;
      if (activeFilter === 'buyers' && u.role !== 'buyer') return false;
      if (activeFilter === 'outdated' && (u.role !== 'supplier' || u.has_updated_this_month)) return false;
      if (activeFilter === 'updated' && (u.role !== 'supplier' || !u.has_updated_this_month)) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = u.name?.toLowerCase().includes(q);
        const matchCompany = u.company_name?.toLowerCase().includes(q);
        const matchEmail = u.email?.toLowerCase().includes(q);
        const matchLoc = u.location?.toLowerCase().includes(q);
        if (!matchName && !matchCompany && !matchEmail && !matchLoc) return false;
      }
      return true;
    });
  }, [users, activeFilter, searchQuery]);

  return (
    <div className="min-h-full w-full bg-slate-950 text-slate-100 font-sans p-4 md:p-8 space-y-6">
      {/* Top Breadcrumb & Hub Switcher */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Link href="/admin" className="hover:text-emerald-400">Admin</Link>
          <span>/</span>
          <span className="text-white font-medium">Email Broadcast Hub</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/whatsapp"
            className="text-xs px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 flex items-center gap-1.5"
          >
            <span>💬</span>
            <span>Switch to WhatsApp Broadcast</span>
          </Link>
          <Link
            href="/admin/users"
            className="text-xs px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 flex items-center gap-1.5"
          >
            <span>👥</span>
            <span>Users Directory</span>
          </Link>
        </div>
      </div>

      {/* Main Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-500/10 text-xl">
            📧
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              Email Supplier &amp; Buyer Broadcast Hub
              <span className="text-[11px] uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                Gmail SMTP Active
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Automated reminders on the 1st and 5th of every month to all suppliers, plus 1-click simultaneous email dispatch to all registered users.
            </p>
          </div>
        </div>

        {/* Action Header Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Primary Action: Send to All Simultaneously */}
          <button
            type="button"
            onClick={() => {
              setBulkAudience('all');
              setIsBulkModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-700 hover:from-indigo-600 hover:to-purple-700 text-white font-black text-xs rounded-xl shadow-xl shadow-indigo-500/25 transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
          >
            <span className="text-sm">🚀</span>
            <span>Send Email to All Users</span>
            <span className="bg-black/30 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">
              {stats.validEmails} Targets
            </span>
          </button>

          {/* Trigger 1st of Month */}
          <button
            type="button"
            onClick={() => handleTriggerCron('1st')}
            disabled={triggeringCron}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs rounded-xl border border-slate-700 transition-all disabled:opacity-50"
            title="Dispatch 1st of month price update reminder now"
          >
            <span>🌾 Run 1st Reminder</span>
          </button>

          {/* Trigger 5th of Month */}
          <button
            type="button"
            onClick={() => handleTriggerCron('5th')}
            disabled={triggeringCron}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs rounded-xl border border-slate-700 transition-all disabled:opacity-50"
            title="Dispatch 5th of month urgent price verification now"
          >
            <span>🚨 Run 5th Urgent Check</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Users</div>
          <div className="text-2xl font-black text-white mt-1">{stats.total}</div>
          <div className="text-[11px] text-emerald-400 mt-0.5 font-medium">{stats.validEmails} valid emails</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Suppliers</div>
          <div className="text-2xl font-black text-indigo-300 mt-1">{stats.suppliers}</div>
          <div className="text-[11px] text-indigo-400/80 mt-0.5">Active merchants</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs font-semibold text-purple-400 uppercase tracking-wider">Buyers</div>
          <div className="text-2xl font-black text-purple-300 mt-1">{stats.buyers}</div>
          <div className="text-[11px] text-purple-400/80 mt-0.5">Procurement heads</div>
        </div>

        <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-4">
          <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            Outdated Rates
          </div>
          <div className="text-2xl font-black text-amber-300 mt-1">{stats.outdated}</div>
          <div className="text-[11px] text-amber-400/80 mt-0.5">Need 1st/5th reminder</div>
        </div>

        <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-4">
          <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Updated Rates</div>
          <div className="text-2xl font-black text-emerald-300 mt-1">{stats.updated}</div>
          <div className="text-[11px] text-emerald-400/80 mt-0.5">Fresh for {new Date().toLocaleString('en-US', { month: 'short' })}</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col justify-center">
          <div className="text-[11px] text-slate-400">SMTP Provider:</div>
          <div className="text-xs font-bold text-emerald-400 truncate mt-0.5">b2bbharat.in@gmail.com</div>
          <button
            onClick={fetchUsers}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold mt-1 text-left"
          >
            ↻ Refresh Users
          </button>
        </div>
      </div>

      {/* Automated 1st & 5th Cron Schedule Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300 text-lg shrink-0">
              ⏰
            </div>
            <div>
              <div className="text-xs font-black text-white flex items-center gap-2">
                <span>Automated Monthly Reminder Schedule (1st &amp; 5th)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                  Cron Endpoint: /api/cron/email-reminders
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                • <strong>1st of every month:</strong> Dispatches monthly price &amp; catalog update reminders to all suppliers.<br/>
                • <strong>5th of every month:</strong> Automatically filters suppliers who haven&apos;t refreshed rates and sends urgent verification warnings.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleTriggerCron('1st')}
              className="px-3 py-1.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 text-xs font-bold border border-emerald-500/40"
            >
              Run 1st Reminder Now
            </button>
            <button
              type="button"
              onClick={() => handleTriggerCron('5th')}
              className="px-3 py-1.5 rounded-xl bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 text-xs font-bold border border-amber-500/40"
            >
              Run 5th Urgent Now
            </button>
          </div>
        </div>

        {cronFeedback && (
          <div className="mt-3 p-2.5 rounded-xl bg-indigo-950 border border-indigo-500/40 text-xs text-indigo-200 flex items-center justify-between">
            <span>
              ✓ Cron executed successfully for <strong>{cronFeedback.cycle}</strong> (Day {cronFeedback.dayOfMonth}): Dispatched to {cronFeedback.sent} users.
            </span>
            <button type="button" onClick={() => setCronFeedback(null)} className="text-slate-400 hover:text-white">✕</button>
          </div>
        )}
      </div>

      {/* Main 2-Column Workspace: Left (Templates & AI), Right (Live HTML Email Preview) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Template Selector Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <span>📋 Step 1: Choose Email Template</span>
            </h2>

            <div className="space-y-2.5">
              {Object.entries(TEMPLATES).map(([key, tpl]) => {
                const isSelected = selectedTemplate === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setSelectedTemplate(key);
                      if (key === '1st_of_month') setCustomSubject(tpl.defaultSubject);
                      else if (key === '5th_of_month') setCustomSubject(tpl.defaultSubject);
                      else if (key === 'buyer_demand') setCustomSubject(tpl.defaultSubject);
                    }}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-slate-800/90 border-indigo-500 shadow-md shadow-indigo-500/10 ring-1 ring-indigo-500/50'
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

            {/* Custom Gemini AI Box */}
            {selectedTemplate === 'custom' && (
              <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
                {/* Gemini Generator Trigger */}
                <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/30 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                      <span>✨</span>
                      <span>Google Gemini AI Composer</span>
                    </span>
                    <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30">
                      AI Assist
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Goal:</label>
                      <select
                        value={aiGoal}
                        onChange={(e) => setAiGoal(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-xs text-white"
                      >
                        <option value="price_reminder">Price Reminder</option>
                        <option value="urgent_price_check">Urgent 5th Check</option>
                        <option value="demand_inquiry">Buyer Demand Alert</option>
                        <option value="festive_offer">Festive Bulk Discount</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Language:</label>
                      <select
                        value={aiLanguage}
                        onChange={(e) => setAiLanguage(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-xs text-white"
                      >
                        <option value="english">English (Standard)</option>
                        <option value="hindi">हिंदी (Hindi)</option>
                        <option value="marathi">मराठी (Marathi)</option>
                      </select>
                    </div>
                  </div>

                  <textarea
                    value={aiCustomPrompt}
                    onChange={(e) => setAiCustomPrompt(e.target.value)}
                    placeholder="Specific instructions (e.g. mention festive surge in Basmati rice &amp; spices)..."
                    rows={2}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white placeholder-slate-500"
                  />

                  <button
                    type="button"
                    onClick={handleGenerateAiEmail}
                    disabled={aiGenerating}
                    className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow transition-all disabled:opacity-50"
                  >
                    {aiGenerating ? 'Synthesizing with Gemini AI...' : '✨ Generate Email with Gemini AI'}
                  </button>
                </div>

                {/* Custom Subject & Body */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Email Subject Line:</label>
                  <input
                    type="text"
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    placeholder="e.g. 🌾 Special Commodity Price Update | B2B India"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-medium focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Email Body Content:</label>
                  <textarea
                    value={customBody}
                    onChange={(e) => setCustomBody(e.target.value)}
                    placeholder="Type your custom email message here..."
                    rows={5}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 🧪 Instant Test Email Sandbox Card */}
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950/40 border border-indigo-500/30 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <span>🧪 Test Email Sandbox</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">Verify in Your Inbox</span>
            </div>

            <div className="mt-3 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Send Test Preview To:
                </label>
                <div className="flex items-center bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs focus-within:border-indigo-500">
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="e.g. yourname@gmail.com"
                    className="bg-transparent text-white font-mono w-full outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSendTestEmail}
                  disabled={sendingTest}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
                >
                  {sendingTest ? 'Sending Test Email via Gmail SMTP...' : '⚡ Send Test Email Now'}
                </button>
                <button
                  type="button"
                  onClick={() => setTestEmail('b2bbharat.in@gmail.com')}
                  className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700"
                >
                  Set Admin Email
                </button>
              </div>

              {testResult && (
                <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-xs text-emerald-200">
                  ✓ {testResult.note}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Live Responsive HTML Email Preview (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
            {/* Preview Toolbar */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Live Responsive HTML Email Preview
                </span>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setPreviewDevice('desktop')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    previewDevice === 'desktop'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🖥️ Desktop (600px)
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('mobile')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    previewDevice === 'mobile'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  📱 Mobile (375px)
                </button>
              </div>
            </div>

            {/* Subject preview */}
            <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-bold uppercase text-[10px]">Subject:</span>
                <span className="text-white font-bold">{previewSubject || TEMPLATES[selectedTemplate]?.defaultSubject}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-bold uppercase text-[10px]">From:</span>
                <span className="text-emerald-400 font-mono">B2B India Trade Desk &lt;b2bbharat.in@gmail.com&gt;</span>
              </div>
            </div>

            {/* Rendered HTML in iframe */}
            <div className="mt-4 flex justify-center bg-[#f1f5f9] p-4 rounded-xl border border-slate-700/60 overflow-hidden min-h-[540px]">
              <iframe
                srcDoc={previewHtml}
                title="Live HTML Email Preview"
                className={`border-0 rounded-xl transition-all shadow-xl bg-white ${
                  previewDevice === 'mobile' ? 'w-[375px] h-[640px]' : 'w-full max-w-[600px] h-[640px]'
                }`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Users & Directory Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        {/* Table Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs gap-1">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeFilter === 'all' ? 'bg-indigo-600 text-white font-bold shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Users ({stats.total})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('suppliers')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeFilter === 'suppliers' ? 'bg-indigo-600 text-white font-bold shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Suppliers ({stats.suppliers})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('buyers')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeFilter === 'buyers' ? 'bg-indigo-600 text-white font-bold shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Buyers ({stats.buyers})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('outdated')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeFilter === 'outdated' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-amber-400/80 hover:text-amber-300'
              }`}
            >
              🚨 Outdated Rates ({stats.outdated})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('updated')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeFilter === 'updated' ? 'bg-emerald-600 text-white font-bold shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              ✓ Updated ({stats.updated})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search user, company, or email..."
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-full sm:w-64"
            />
          </div>
        </div>

        {/* Directory Table */}
        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 text-[10px] uppercase">
              <tr>
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectedUserIds.length === filteredUsers.length && filteredUsers.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedUserIds(filteredUsers.map((u) => u.id));
                      else setSelectedUserIds([]);
                    }}
                    className="rounded bg-slate-900 border-slate-700 text-indigo-600"
                  />
                </th>
                <th className="py-3 px-4">Company &amp; Contact</th>
                <th className="py-3 px-4">Email Address</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Monthly Status</th>
                <th className="py-3 px-4 text-right">Direct Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No users matching the current search criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isChecked = selectedUserIds.includes(user.id);
                  return (
                    <tr key={user.id} className="hover:bg-slate-900/40">
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedUserIds([...selectedUserIds, user.id]);
                            else setSelectedUserIds(selectedUserIds.filter((id) => id !== user.id));
                          }}
                          className="rounded bg-slate-900 border-slate-700 text-indigo-600"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-white">{user.company_name}</div>
                        <div className="text-[10px] text-slate-400">{user.name} • {user.location}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">
                        {user.email}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          user.role === 'supplier'
                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                            : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {user.role === 'supplier' ? (
                          user.has_updated_this_month ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                              <span>✓</span>
                              <span>Updated this Month</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 font-semibold">
                              <span>⚠️</span>
                              <span>Needs 1st/5th Reminder</span>
                            </span>
                          )
                        ) : (
                          <span className="text-[11px] text-slate-400">Active Buyer</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setTestEmail(user.email);
                            handleSendTestEmail();
                          }}
                          className="px-3 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 text-[11px] font-bold border border-indigo-500/40"
                        >
                          Send Email ↗
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🚀 SEND EMAIL TO ALL USERS SIMULTANEOUSLY MODAL */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-indigo-500/40 rounded-3xl p-6 md:p-8 max-w-xl w-full shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300 text-xl shadow">
                  🚀
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    Send Email to All Users Simultaneously
                  </h3>
                  <p className="text-xs text-slate-400">
                    Bulk dispatch via verified Gmail SMTP server.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBulkModalOpen(false)}
                className="text-slate-400 hover:text-white text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <div className="my-4 space-y-4 text-xs text-slate-300">
              {/* Audience selection */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-2">
                  Select Target Audience:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'all', label: `All Users (${stats.total})`, desc: 'Suppliers & Buyers' },
                    { id: 'suppliers', label: `Suppliers (${stats.suppliers})`, desc: 'All registered suppliers' },
                    { id: 'outdated', label: `Outdated Rates (${stats.outdated})`, desc: 'Pending 1st/5th update' },
                    { id: 'buyers', label: `Buyers Only (${stats.buyers})`, desc: 'Verified wholesale buyers' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setBulkAudience(item.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        bulkAudience === item.id
                          ? 'bg-indigo-900/40 border-indigo-400 ring-1 ring-indigo-400 text-white font-bold'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-400'
                      }`}
                    >
                      <div className="text-xs">{item.label}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{item.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Template summary */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Active Template:</span>
                  <span className="font-bold text-emerald-400">{TEMPLATES[selectedTemplate]?.title}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Subject:</span>
                  <span className="font-bold text-white truncate max-w-[280px]">
                    {customSubject || TEMPLATES[selectedTemplate]?.defaultSubject}
                  </span>
                </div>
              </div>

              {/* Progress animation */}
              {bulkSending && (
                <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/40 animate-in fade-in space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-indigo-400">
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                      Simultaneous email dispatch in progress...
                    </span>
                    <span>Please do not close window</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full animate-pulse w-full" />
                  </div>
                </div>
              )}

              {/* Result summary */}
              {bulkResult && (
                <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/40 space-y-2 text-xs">
                  <div className="flex items-center justify-between font-bold text-emerald-400">
                    <span>🎉 Bulk Dispatch Complete!</span>
                    <span className="bg-emerald-500/20 px-2 py-0.5 rounded text-[10px]">
                      {bulkResult.sent} Sent / {bulkResult.failed} Failed
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px]">
                    All {bulkResult.sent} emails have been delivered to user inboxes via Gmail SMTP.
                  </p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setIsBulkModalOpen(false);
                  setBulkResult(null);
                }}
                disabled={bulkSending}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                {bulkResult ? 'Close' : 'Cancel'}
              </button>

              {!bulkResult && (
                <button
                  type="button"
                  onClick={handleExecuteSendAll}
                  disabled={bulkSending}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
                >
                  {bulkSending ? 'Transmitting Emails...' : '🚀 Confirm & Send to All Users'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
