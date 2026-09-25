"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function AdminSubscriptionsPage() {
  const [subscribers, setSubscribers] = useState([]);
  const [stats, setStats] = useState({
    total_subscribers: 0,
    paid_subscribers: 0,
    active_subscribers: 0,
    expiring_soon: 0,
    expired_subscribers: 0,
    free_tier_users: 0,
    total_revenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all | active | expiring_soon | expired | free
  const [planFilter, setPlanFilter] = useState('all'); // all | ANNUAL PLAN | FREE TIER

  // Modals
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [selectedUserForGrant, setSelectedUserForGrant] = useState('');
  const [grantPlan, setGrantPlan] = useState('ANNUAL PLAN');
  const [grantDays, setGrantDays] = useState(365);
  const [grantPaymentId, setGrantPaymentId] = useState('');
  const [grantNotes, setGrantNotes] = useState('');
  const [grantLoading, setGrantLoading] = useState(false);

  // Reminder Modal
  const [reminderTarget, setReminderTarget] = useState(null);
  const [reminderLoading, setReminderLoading] = useState(false);

  // Action in progress tracking (e.g. activating a row)
  const [actionInProgress, setActionInProgress] = useState({});

  // Toast
  const [toast, setToast] = useState(null);
  const showToast = (message, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 4500);
  };

  // Live Pricing
  const [currentPricing, setCurrentPricing] = useState(null);

  // Fetch subscriptions from backend
  const fetchSubscriptions = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);
      
      const [res, pricingRes] = await Promise.all([
        fetch('/api/admin/subscriptions'),
        fetch('/api/membership').catch(() => null)
      ]);
      const data = await res.json();
      
      if (data.success) {
        setSubscribers(data.subscribers || []);
        if (data.stats) setStats(data.stats);
      } else {
        showToast(data.error || 'Failed to load subscription data', true);
      }

      if (pricingRes && pricingRes.ok) {
        const pricingData = await pricingRes.json();
        if (pricingData.pricing) setCurrentPricing(pricingData.pricing);
      }
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
      showToast('Network error loading subscriptions', true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  // Handle 1-Click Manual Activation (Annual)
  const handleManualActivate = async (sub, planToActivate = 'ANNUAL PLAN') => {
    const targetDays = planToActivate === 'ANNUAL PLAN' ? 365 : 90;
    const subKey = sub.user_id || sub.email;

    setActionInProgress(prev => ({ ...prev, [subKey]: `activating_${planToActivate}` }));

    try {
      const res = await fetch('/api/admin/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'activate',
          user_id: sub.user_id,
          email: sub.email,
          plan: planToActivate,
          days: targetDays,
          payment_id: `MANUAL-${Date.now().toString().slice(-6)}`,
          notes: `1-Click Manual Activation from Subscriptions Control (${planToActivate})`
        })
      });

      const data = await res.json();
      if (data.success) {
        showToast(data.message || `✓ Activated ${planToActivate}!`);
        await fetchSubscriptions(true);
      } else {
        showToast(data.error || 'Failed to activate subscription', true);
      }
    } catch (err) {
      console.error('Activation error:', err);
      showToast('Error executing activation', true);
    } finally {
      setActionInProgress(prev => {
        const copy = { ...prev };
        delete copy[subKey];
        return copy;
      });
    }
  };

  // Handle Deactivate / Expire
  const handleDeactivate = async (sub) => {
    if (!confirm(`Are you sure you want to deactivate the subscription for "${sub.company_name}"? Their products will be hidden from public listing.`)) {
      return;
    }

    const subKey = sub.user_id || sub.email;
    setActionInProgress(prev => ({ ...prev, [subKey]: 'deactivating' }));

    try {
      const res = await fetch('/api/admin/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'deactivate',
          user_id: sub.user_id,
          email: sub.email,
          notes: 'Manually deactivated by Admin'
        })
      });

      const data = await res.json();
      if (data.success) {
        showToast(data.message || '✓ Subscription deactivated');
        await fetchSubscriptions(true);
      } else {
        showToast(data.error || 'Failed to deactivate', true);
      }
    } catch (err) {
      console.error('Deactivation error:', err);
      showToast('Error deactivating subscription', true);
    } finally {
      setActionInProgress(prev => {
        const copy = { ...prev };
        delete copy[subKey];
        return copy;
      });
    }
  };

  // Handle Send Reminder Email
  const handleSendReminder = async () => {
    if (!reminderTarget) return;

    setReminderLoading(true);
    try {
      const res = await fetch('/api/admin/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_reminder',
          user_id: reminderTarget.user_id,
          email: reminderTarget.email,
          company_name: reminderTarget.company_name,
          plan: reminderTarget.plan !== 'FREE TIER' ? reminderTarget.plan : 'ANNUAL PLAN'
        })
      });

      const data = await res.json();
      if (data.success) {
        showToast(data.message || '✓ Payment reminder sent successfully!');
        setReminderTarget(null);
        await fetchSubscriptions(true);
      } else {
        showToast(data.error || 'Failed to send reminder email', true);
      }
    } catch (err) {
      console.error('Reminder error:', err);
      showToast('Error sending reminder email', true);
    } finally {
      setReminderLoading(false);
    }
  };

  // Submit Grant / Custom Activation Modal
  const handleGrantSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUserForGrant) {
      showToast('Please select a member', true);
      return;
    }

    const selectedSub = subscribers.find(s => s.user_id === selectedUserForGrant || s.email === selectedUserForGrant);
    if (!selectedSub) {
      showToast('Member not found', true);
      return;
    }

    setGrantLoading(true);
    try {
      const res = await fetch('/api/admin/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'activate',
          user_id: selectedSub.user_id,
          email: selectedSub.email,
          plan: grantPlan,
          days: parseInt(grantDays) || (grantPlan === 'ANNUAL PLAN' ? 365 : 90),
          payment_id: grantPaymentId.trim() || `MANUAL-${Date.now().toString().slice(-6)}`,
          notes: grantNotes.trim() || `Manually granted by Admin (${grantPlan})`
        })
      });

      const data = await res.json();
      if (data.success) {
        showToast(data.message || `✓ Activated ${grantPlan}!`);
        setShowGrantModal(false);
        setGrantPaymentId('');
        setGrantNotes('');
        await fetchSubscriptions(true);
      } else {
        showToast(data.error || 'Failed to grant subscription', true);
      }
    } catch (err) {
      console.error('Grant error:', err);
      showToast('Error processing manual subscription', true);
    } finally {
      setGrantLoading(false);
    }
  };

  // Filtered Subscribers
  const filteredSubscribers = useMemo(() => {
    return subscribers.filter(sub => {
      // Search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = (sub.company_name || '').toLowerCase().includes(q);
        const matchContact = (sub.full_name || '').toLowerCase().includes(q);
        const matchEmail = (sub.email || '').toLowerCase().includes(q);
        const matchPhone = (sub.phone || '').toLowerCase().includes(q);
        const matchPayment = (sub.payment_id || '').toLowerCase().includes(q);
        if (!matchName && !matchContact && !matchEmail && !matchPhone && !matchPayment) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'active' && sub.status !== 'active') return false;
        if (statusFilter === 'expiring_soon' && sub.status !== 'expiring_soon') return false;
        if (statusFilter === 'expired' && sub.status !== 'expired') return false;
        if (statusFilter === 'free' && sub.status !== 'free') return false;
      }

      // Plan filter
      if (planFilter !== 'all' && sub.plan !== planFilter) {
        return false;
      }

      return true;
    });
  }, [subscribers, searchTerm, statusFilter, planFilter]);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 text-slate-100 min-h-screen p-4 sm:p-6 lg:p-8 font-sans">
      
      {/* Toast Banner */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-2xl shadow-2xl text-sm font-bold flex items-center gap-3 border ${
              toast.isError 
                ? 'bg-rose-950/90 text-rose-200 border-rose-800' 
                : 'bg-emerald-950/90 text-emerald-200 border-emerald-800'
            }`}
          >
            <span>{toast.isError ? '⚠️' : '✓'}</span>
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-xl shadow-lg shadow-orange-500/20">
                👑
              </span>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Subscription &amp; Membership Desk
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                  Track payment status, monitor expiration deadlines, manually activate subscriptions, and dispatch renewal reminders.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchSubscriptions(true)}
              disabled={refreshing}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold border border-slate-800 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span className={refreshing ? 'animate-spin' : ''}>🔄</span>
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              onClick={() => {
                if (subscribers.length > 0) {
                  setSelectedUserForGrant(subscribers[0].user_id || subscribers[0].email);
                }
                setShowGrantModal(true);
              }}
              className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 rounded-xl text-xs font-black shadow-lg shadow-orange-500/25 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>+</span>
              <span>Manual Plan Activation</span>
            </button>
          </div>
        </div>

        {/* Dynamic Pricing Info Bar with direct link to Settings */}
        <div className="mt-5 p-4 bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <span className="text-xl">💰</span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-black text-white uppercase tracking-wider">
                  Active Annual Supplier Plan Pricing:
                </span>
                <span className="text-xs font-bold text-slate-500 line-through font-mono">
                  ₹{(currentPricing?.originalPrice || 20000).toLocaleString('en-IN')}
                </span>
                <span className="text-xs font-black text-emerald-400 font-mono">
                  Selling Base: ₹{(currentPricing?.baseAmount || 2000).toLocaleString('en-IN')}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  + {currentPricing?.gstRate || 18}% GST
                </span>
                <span className="text-xs font-mono text-slate-400">
                  + {currentPricing?.gatewayFeePercent || 2.5}% RZP Fee
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-black text-xs">
                  = ₹{(currentPricing?.totalPayable || 2429.62).toFixed(2)} All-Inclusive
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                GST and gateway surcharge recalculate dynamically when the selling price is updated in Admin Settings.
              </p>
            </div>
          </div>
          <Link
            href="/admin/settings"
            className="px-4 py-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap self-start sm:self-auto cursor-pointer"
          >
            <span>⚙️ Change Pricing in Admin Settings →</span>
          </Link>
        </div>
      </div>

      {/* KPI Metrics Cards */}
      <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-8">
        {/* Total Subscribers */}
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4 shadow-sm">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Registered</div>
          <div className="text-2xl font-black text-white mt-1">{stats.total_subscribers}</div>
          <div className="text-[10px] text-slate-500 mt-1 font-medium">{stats.paid_subscribers} on paid plans</div>
        </div>

        {/* Active Paid */}
        <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-2xl p-4 shadow-sm">
          <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Active Paid
          </div>
          <div className="text-2xl font-black text-emerald-300 mt-1">{stats.active_subscribers}</div>
          <div className="text-[10px] text-emerald-500/80 mt-1 font-medium">Catalog live &amp; discovering</div>
        </div>

        {/* Expiring Soon */}
        <div className="bg-amber-950/30 border border-amber-800/40 rounded-2xl p-4 shadow-sm">
          <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <span>⚠️</span> Expiring Soon
          </div>
          <div className="text-2xl font-black text-amber-300 mt-1">{stats.expiring_soon}</div>
          <div className="text-[10px] text-amber-500/80 mt-1 font-medium">Within next 14 days</div>
        </div>

        {/* Expired / Free */}
        <div className="bg-rose-950/30 border border-rose-800/40 rounded-2xl p-4 shadow-sm">
          <div className="text-[11px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
            <span>🔴</span> Expired Paid
          </div>
          <div className="text-2xl font-black text-rose-300 mt-1">{stats.expired_subscribers}</div>
          <div className="text-[10px] text-rose-500/80 mt-1 font-medium">Catalogs auto-hidden</div>
        </div>

        {/* Revenue */}
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4 shadow-sm col-span-2 sm:col-span-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active SaaS GMV</div>
          <div className="text-2xl font-black text-amber-400 mt-1">₹{stats.total_revenue.toLocaleString('en-IN')}</div>
          <div className="text-[10px] text-slate-500 mt-1 font-medium">Annual plan membership sum</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="max-w-7xl mx-auto bg-slate-900/80 border border-slate-800 rounded-2xl p-4 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Search by company, name, email, phone, payment ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 focus:outline-none focus:border-orange-500 cursor-pointer"
          >
            <option value="all">All Statuses ({subscribers.length})</option>
            <option value="active">Active Only ({stats.active_subscribers})</option>
            <option value="expiring_soon">Expiring Soon ({stats.expiring_soon})</option>
            <option value="expired">Expired Only ({stats.expired_subscribers})</option>
            <option value="free">Free Tier Only ({stats.free_tier_users})</option>
          </select>

          {/* Plan Filter */}
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 focus:outline-none focus:border-orange-500 cursor-pointer"
          >
            <option value="all">All Plans</option>
            <option value="ANNUAL PLAN">Annual Plan (₹{(currentPricing?.baseAmount || 2000).toLocaleString('en-IN')} / 12 Mo)</option>
            <option value="FREE TIER">Free Tier</option>
          </select>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="max-w-7xl mx-auto bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        {loading ? (
          <div className="py-24 text-center">
            <div className="inline-block w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 text-sm font-semibold mt-4">Loading subscriber records &amp; verified ledger...</p>
          </div>
        ) : filteredSubscribers.length === 0 ? (
          <div className="py-20 text-center px-4">
            <span className="text-4xl">📭</span>
            <h3 className="text-base font-bold text-white mt-3">No matching subscribers found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Try changing your search terms or filters above to view subscriber accounts.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-5 py-4 font-extrabold">Subscriber / Company</th>
                  <th className="px-5 py-4 font-extrabold">Current Plan</th>
                  <th className="px-5 py-4 font-extrabold">Status &amp; Deadline</th>
                  <th className="px-5 py-4 font-extrabold">Payment Ref</th>
                  <th className="px-5 py-4 font-extrabold">Products</th>
                  <th className="px-5 py-4 font-extrabold text-right">Manual Controls &amp; Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredSubscribers.map((sub) => {
                  const subKey = sub.user_id || sub.email;
                  const isActionBusy = actionInProgress[subKey];

                  return (
                    <tr key={sub.id || subKey} className="hover:bg-slate-800/40 transition-colors">
                      {/* Subscriber / Company */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center font-black text-sm text-amber-400 flex-shrink-0 shadow-sm">
                            {sub.company_name?.charAt(0)?.toUpperCase() || 'B'}
                          </div>
                          <div className="min-w-0">
                            <div className="font-extrabold text-white text-sm truncate flex items-center gap-1.5">
                              {sub.company_name}
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                                sub.role === 'supplier' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-sky-500/20 text-sky-300'
                              }`}>
                                {sub.role}
                              </span>
                            </div>
                            <div className="text-slate-400 text-[11px] truncate mt-0.5">
                              {sub.full_name !== 'N/A' && <span className="text-slate-300">{sub.full_name} • </span>}
                              <a href={`mailto:${sub.email}`} className="hover:text-amber-400 transition-colors">{sub.email}</a>
                              {sub.phone !== 'N/A' && <span> • {sub.phone}</span>}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Current Plan */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {sub.plan === 'ANNUAL PLAN' ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-extrabold">
                            <span>👑</span>
                            <span>Annual (₹2,000 / 12 Mo)</span>
                          </div>
                        ) : sub.plan === 'QUARTERLY PLAN' ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[11px] font-extrabold">
                            <span>⏱️</span>
                            <span>Legacy Plan (Pending Annual Upgrade)</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 text-[11px] font-bold">
                            <span>Free Tier</span>
                          </div>
                        )}
                        {sub.payment_method === 'manual_admin' && (
                          <div className="text-[10px] text-slate-400 mt-1 font-medium">
                            ⚙️ Activated Manually by Admin
                          </div>
                        )}
                      </td>

                      {/* Status & Deadline */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          {sub.status === 'active' ? (
                            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-extrabold text-[11px]">
                              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                              Active ({sub.days_left} days left)
                            </span>
                          ) : sub.status === 'expiring_soon' ? (
                            <span className="inline-flex items-center gap-1.5 text-amber-400 font-extrabold text-[11px] animate-pulse">
                              <span>⚠️</span> Expiring Soon ({sub.days_left} days left)
                            </span>
                          ) : sub.status === 'expired' ? (
                            <span className="inline-flex items-center gap-1.5 text-rose-400 font-extrabold text-[11px]">
                              <span>🔴</span> Expired / Suspended
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px] font-semibold">Standard Free Access</span>
                          )}

                          <div className="text-[10px] text-slate-400">
                            <strong>Deadline:</strong> {sub.expires_at_formatted}
                          </div>

                          {sub.last_reminder_sent_at && (
                            <div className="text-[10px] text-cyan-400 font-semibold mt-0.5">
                              ✉️ Reminder sent: {new Date(sub.last_reminder_sent_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Payment Ref */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {sub.payment_id ? (
                          <div>
                            <div className="font-mono text-[11px] font-bold text-slate-200">
                              {sub.payment_id}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {sub.activated_at ? new Date(sub.activated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Paid'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[11px] font-medium">— No payment record —</span>
                        )}
                      </td>

                      {/* Products */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="text-xs font-extrabold text-white">
                          {sub.total_products} Products
                        </div>
                        <div className="text-[10px] mt-0.5">
                          {sub.status === 'expired' ? (
                            <span className="text-rose-400 font-bold">❌ Hidden from site</span>
                          ) : (
                            <span className="text-emerald-400 font-bold">✓ {sub.active_products} Active live</span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {/* 1-Click Activate Annual */}
                          <button
                            onClick={() => handleManualActivate(sub, 'ANNUAL PLAN')}
                            disabled={!!isActionBusy}
                            title="Manually activate or extend for 365 Days (Annual Plan)"
                            className="px-2.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 hover:border-emerald-500/60 rounded-xl font-black text-[11px] transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1"
                          >
                            <span>🌟</span>
                            <span>{isActionBusy === 'activating_ANNUAL PLAN' ? 'Activating...' : '+1yr Annual'}</span>
                          </button>

                          {/* Send Reminder Button */}
                          <button
                            onClick={() => setReminderTarget(sub)}
                            disabled={!!isActionBusy}
                            title="Send payment / renewal reminder email via Nodemailer"
                            className="px-2.5 py-1.5 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 hover:border-sky-500/60 rounded-xl font-black text-[11px] transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1"
                          >
                            <span>✉️</span>
                            <span>Remind</span>
                          </button>

                          {/* Deactivate Button (if active) */}
                          {sub.status === 'active' && (
                            <button
                              onClick={() => handleDeactivate(sub)}
                              disabled={!!isActionBusy}
                              title="Manually deactivate / suspend subscription"
                              className="px-2 py-1.5 bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-800 rounded-xl font-bold text-[11px] transition-all cursor-pointer disabled:opacity-50"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: Grant / Custom Manual Activation */}
      <AnimatePresence>
        {showGrantModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative"
            >
              <button
                onClick={() => setShowGrantModal(false)}
                className="absolute top-5 right-5 text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>

              <div className="flex items-center gap-3 mb-5">
                <span className="w-10 h-10 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center text-xl font-black">
                  ⚡
                </span>
                <div>
                  <h3 className="text-lg font-black text-white">Manual Subscription Activation</h3>
                  <p className="text-xs text-slate-400">Grant or override plan status directly for any user</p>
                </div>
              </div>

              <form onSubmit={handleGrantSubmit} className="space-y-4">
                {/* Select User */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-300 uppercase tracking-wider mb-1.5">
                    Select Subscriber / User
                  </label>
                  <select
                    value={selectedUserForGrant}
                    onChange={(e) => setSelectedUserForGrant(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
                    required
                  >
                    {subscribers.map((u) => (
                      <option key={u.id || u.user_id || u.email} value={u.user_id || u.email}>
                        {u.company_name} ({u.email}) — Currently {u.plan}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Select Plan (Annual Plan Only) */}
                <div className="w-full">
                  <div className="p-3.5 rounded-2xl border bg-emerald-500/10 border-emerald-500/40 text-emerald-300">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-black flex items-center gap-1.5">
                        <span>🌟</span>
                        <span>Annual Plan (12 Months)</span>
                      </div>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold uppercase">Standard Plan</span>
                    </div>
                    <div className="text-[11px] text-slate-300 mt-1">₹{(currentPricing?.baseAmount || 2000).toLocaleString('en-IN')} Base + {currentPricing?.gstRate || 18}% GST (₹{(currentPricing?.totalPayable || 2429.62).toFixed(2)} All-Inclusive) • 365 Days Access</div>
                  </div>
                </div>

                {/* Days Duration Override */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-300 uppercase tracking-wider mb-1.5">
                    Valid Duration (Days from Today)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={grantDays}
                    onChange={(e) => setGrantDays(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
                    required
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Calculated Expiration: {new Date(Date.now() + (parseInt(grantDays) || 365) * 86400000).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>

                {/* Transaction / Reference ID */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-300 uppercase tracking-wider mb-1.5">
                    Payment / UTR / Reference ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. UTR12345678, SBI-NEFT-9988, or Cash Receipt"
                    value={grantPaymentId}
                    onChange={(e) => setGrantPaymentId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500"
                  />
                </div>

                {/* Admin Notes */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-300 uppercase tracking-wider mb-1.5">
                    Admin Reason / Verification Notes
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Offline bank transfer verified by account manager..."
                    value={grantNotes}
                    onChange={(e) => setGrantNotes(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500"
                  />
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowGrantModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={grantLoading}
                    className="px-6 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 rounded-xl text-xs font-black shadow-lg shadow-orange-500/20 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {grantLoading ? 'Activating...' : '✓ Activate Plan Now'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: Send Reminder Email Confirmation */}
      <AnimatePresence>
        {reminderTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative"
            >
              <button
                onClick={() => setReminderTarget(null)}
                className="absolute top-5 right-5 text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>

              <div className="flex items-center gap-3 mb-4">
                <span className="w-10 h-10 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center text-xl font-black">
                  ✉️
                </span>
                <div>
                  <h3 className="text-lg font-black text-white">Send Subscription Reminder Email</h3>
                  <p className="text-xs text-slate-400">Dispatches an official renewal notice via Nodemailer</p>
                </div>
              </div>

              {/* Summary Card */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2 mb-5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Recipient:</span>
                  <span className="font-extrabold text-white">{reminderTarget.email}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Company:</span>
                  <span className="font-bold text-slate-200">{reminderTarget.company_name}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Current Plan:</span>
                  <span className="font-bold text-amber-400">{reminderTarget.plan}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Subscription Deadline:</span>
                  <span className="font-bold text-rose-400">{reminderTarget.expires_at_formatted}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Dispatch Sender:</span>
                  <span className="font-mono text-[11px] text-slate-300">b2bbharat.in@gmail.com</span>
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed mb-6">
                This will send an official, branded HTML email containing direct renewal links, UPI &amp; bank transfer details, and helpdesk contact information to <strong>{reminderTarget.email}</strong>.
              </p>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setReminderTarget(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendReminder}
                  disabled={reminderLoading}
                  className="px-6 py-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white rounded-xl text-xs font-black shadow-lg shadow-sky-500/20 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {reminderLoading ? (
                    <>
                      <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Dispatching Email...</span>
                    </>
                  ) : (
                    <>
                      <span>✉️</span>
                      <span>Send Reminder Email Now</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
