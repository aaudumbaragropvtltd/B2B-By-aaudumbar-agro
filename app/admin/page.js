"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import SalesOutreachModal from '@/components/admin/SalesOutreachModal';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  const [allUsers360, setAllUsers360] = useState([]);
  const [globalSearch, setGlobalSearch] = useState('');
  const [selected360User, setSelected360User] = useState(null);
  const [dossierTab, setDossierTab] = useState('profile');

  // Sales Outreach Modal State
  const [outreachOpen, setOutreachOpen] = useState(false);
  const [outreachUser, setOutreachUser] = useState(null);
  const [outreachProduct, setOutreachProduct] = useState(null);
  const [outreachSearchQuery, setOutreachSearchQuery] = useState(null);

  const openOutreach = (user, product = null, searchQuery = null) => {
    setOutreachUser(user || { full_name: 'Prospective Buyer', registered_email: 'buyer@lead.in' });
    setOutreachProduct(product || { title: searchQuery || 'Wholesale Commodity' });
    setOutreachSearchQuery(searchQuery);
    setOutreachOpen(true);
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes] = await Promise.all([
        fetch('/api/admin/dashboard-stats'),
        fetch('/api/admin/all-users')
      ]);
      if (statsRes.ok) {
        const json = await statsRes.json();
        setData(json);
      }
      if (usersRes.ok) {
        const usersJson = await usersRes.json();
        setAllUsers360(Array.isArray(usersJson) ? usersJson : []);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const formatActionName = (action) => {
    switch (action) {
      case 'checkout_order_created':
        return '🛒 Direct Checkout Order Placed';
      case 'registered':
        return '🎉 New Enterprise Registered';
      case 'quote_submitted':
        return '📋 Supplier Quote Submitted';
      case 'rfq_created':
        return '📢 New RFQ Requirement Posted';
      case 'payment_cleared':
        return '💰 10% Escrow Advance Cleared';
      default:
        return `⚡ ${action ? action.replace(/_/g, ' ') : 'System Action'}`;
    }
  };

  const metrics = data?.metrics || {
    totalGMV: 45000000,
    totalPlatformProfit: 1925000,
    orderProfit: 1350000,
    subscriptionProfit: 485000,
    vasProfit: 90000,
    platformRevenue: 1925000,
    activeOrders: 324,
    totalUsers: 1420,
    activeSubscribersCount: 404,
    avgPlatformFeePercent: 3.6,
    protectedSupplierPayout: 43650000
  };

  const profitStreams = data?.profitStreams || [
    {
      id: 'orders',
      name: 'Order Commission & Trade Margin',
      profitINR: metrics.orderProfit || 1350000,
      revenueINR: metrics.totalGMV || 45000000,
      marginPercent: `${metrics.avgPlatformFeePercent}%`,
      icon: '📦',
      color: 'emerald',
      badge: 'Trade Engine',
      description: `Earned from direct wholesale fulfillment and escrow clearance across ${metrics.activeOrders} trade contracts.`,
      link: '/admin/orders'
    },
    {
      id: 'subscriptions',
      name: 'Supplier & Buyer Subscriptions',
      profitINR: metrics.subscriptionProfit || 485000,
      revenueINR: metrics.subscriptionProfit || 485000,
      marginPercent: '100%',
      icon: '👑',
      color: 'amber',
      badge: 'Recurring SaaS',
      description: `Quarterly (₹600) & Annual (₹2,000) memberships unlocking verified catalog listing and priority discovery.`,
      link: '/admin/users'
    },
    {
      id: 'vas',
      name: 'Escrow & RFQ Facilitation',
      profitINR: metrics.vasProfit || 90000,
      revenueINR: (metrics.vasProfit || 90000) * 1.5,
      marginPercent: '66.7%',
      icon: '🛡️',
      color: 'indigo',
      badge: 'Value Added Services',
      description: `Escrow protection guarantee, priority buyer RFQ routing, and verified factory inspection certifications.`,
      link: '/admin/rfqs'
    }
  ];

  const totalProfits = metrics.totalPlatformProfit || (metrics.orderProfit + metrics.subscriptionProfit + (metrics.vasProfit || 0));
  const orderSharePercent = Math.round(((metrics.orderProfit || 1350000) / totalProfits) * 100);
  const subSharePercent = Math.round(((metrics.subscriptionProfit || 485000) / totalProfits) * 100);
  const vasSharePercent = 100 - orderSharePercent - subSharePercent;

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl text-white">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">⚡</span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              Platform Command Center & Financial Hub
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Escrow Settlement Engine Active • Real-Time Monetization Tracking</span>
          </p>
        </div>

        {/* Quick Hub Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/admin/logistics"
            className="px-3.5 py-2 bg-blue-600/30 hover:bg-blue-600 text-blue-200 hover:text-white text-xs font-extrabold rounded-xl border border-blue-500/40 transition-all flex items-center gap-1.5"
          >
            <span>🚚 Fleet & Logistics</span>
          </Link>
          <Link
            href="/admin/settings"
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-all flex items-center gap-1.5"
          >
            <span>🏷️ 38 Category Fees</span>
          </Link>
          <Link
            href="/admin/profit-margins"
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-1.5"
          >
            <span>💰 Profit Margins</span>
          </Link>
          <Link
            href="/admin/orders"
            className="px-3.5 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-extrabold rounded-xl shadow-lg shadow-brand-600/30 transition-all flex items-center gap-1.5"
          >
            <span>📦 All Orders</span>
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 360° MASTER COMPANY & USER INTELLIGENCE SEARCH ENGINE */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-extrabold uppercase tracking-wider">
              <span>🔍</span> 360° Enterprise Intelligence Search
            </div>
            <h2 className="text-base font-black text-slate-900 mt-1">
              Search Any Business, User or Supplier
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-semibold">
            {allUsers360.length} Registered Enterprises Connected
          </span>
        </div>

        <div className="relative">
          <span className="absolute left-4 top-3.5 text-slate-400 text-base">🔍</span>
          <input
            type="text"
            placeholder="Search by Company (e.g. Aaudumbar Agro), Phone, GSTIN, Email, Order ID, Product Title..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            className="w-full pl-11 pr-10 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none transition-all shadow-inner"
          />
          {globalSearch && (
            <button
              onClick={() => setGlobalSearch('')}
              className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-700 text-xs font-bold bg-slate-200 rounded-full w-5 h-5 flex items-center justify-center cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Live Matching 360 Results */}
        {globalSearch.trim() && (
          <div className="mt-4 pt-4 border-t border-slate-100 space-y-2.5">
            <div className="text-[11px] font-bold text-slate-500 flex items-center justify-between">
              <span>Matching Enterprises ({
                allUsers360.filter(u => {
                  const q = globalSearch.toLowerCase();
                  return (
                    (u.company_name || '').toLowerCase().includes(q) ||
                    (u.full_name || '').toLowerCase().includes(q) ||
                    (u.registered_email || '').toLowerCase().includes(q) ||
                    (u.corporate_phone || '').includes(q) ||
                    (u.phone_number || '').includes(q) ||
                    (u.gst_number || '').toLowerCase().includes(q) ||
                    (u.display_id || '').toLowerCase().includes(q) ||
                    (u.products || []).some(p => (p.title || '').toLowerCase().includes(q))
                  );
                }).length
              })</span>
              <span className="text-[10px] text-blue-600">Click any card to open complete 360° Dossier</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
              {allUsers360
                .filter(u => {
                  const q = globalSearch.toLowerCase();
                  return (
                    (u.company_name || '').toLowerCase().includes(q) ||
                    (u.full_name || '').toLowerCase().includes(q) ||
                    (u.registered_email || '').toLowerCase().includes(q) ||
                    (u.corporate_phone || '').includes(q) ||
                    (u.phone_number || '').includes(q) ||
                    (u.gst_number || '').toLowerCase().includes(q) ||
                    (u.display_id || '').toLowerCase().includes(q) ||
                    (u.products || []).some(p => (p.title || '').toLowerCase().includes(q))
                  );
                })
                .slice(0, 6)
                .map(user => (
                  <div
                    key={user.id}
                    onClick={() => {
                      setSelected360User(user);
                      setDossierTab('profile');
                    }}
                    className="p-3.5 bg-slate-50 hover:bg-blue-50/50 border border-slate-200 hover:border-blue-300 rounded-2xl transition-all cursor-pointer flex items-center justify-between gap-3 shadow-sm hover:shadow"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 text-xs sm:text-sm truncate">
                          {user.company_name || user.full_name || 'Enterprise'}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-slate-200 text-slate-700">
                          {user.display_id || user.id.slice(0, 6)}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                        📞 {user.corporate_phone || user.phone_number || 'No Phone'} • ✉️ {user.registered_email}
                      </div>
                      <div className="flex flex-wrap gap-2 text-[10px] text-slate-600 mt-1.5 font-semibold">
                        <span className="bg-white px-2 py-0.5 rounded border border-slate-200">
                          📦 {user.products_count || 0} Products
                        </span>
                        <span className="bg-white px-2 py-0.5 rounded border border-slate-200">
                          💼 {user.total_orders_count || 0} Orders
                        </span>
                        <span className="bg-white px-2 py-0.5 rounded border border-slate-200">
                          📋 {user.rfqs_count || 0} RFQs
                        </span>
                        <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-bold">
                          👑 {user.membership_plan || 'Free'}
                        </span>
                      </div>
                    </div>

                    <button className="px-3 py-1.5 bg-blue-600 text-white font-extrabold text-xs rounded-xl shadow-sm hover:bg-blue-700 flex items-center gap-1 flex-shrink-0">
                      <span>360° Dossier</span> →
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* PRIMARY KPI METRICS GRID: B2B PROFIT FROM ORDERS, SUBSCRIPTIONS & GMV */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        {/* KPI 1: TOTAL B2B INDIA NET PROFIT */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 text-white p-5 sm:p-6 rounded-3xl shadow-xl shadow-emerald-700/20 flex flex-col justify-between relative overflow-hidden"
        >
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-200 bg-white/15 px-2 py-0.5 rounded-md">
                Combined Net Profit
              </span>
              <div className="text-xs font-bold text-emerald-100 mt-1">
                Total B2B Platform Earnings
              </div>
            </div>
            <span className="w-10 h-10 rounded-2xl bg-white/20 text-white flex items-center justify-center font-bold text-lg">
              🏆
            </span>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black tracking-tight">
              {formatCurrency(totalProfits)}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-100 font-bold mt-1.5">
              <span>▲ +16.2%</span>
              <span className="text-emerald-200/80 font-normal">across all revenue streams</span>
            </div>
          </div>
        </motion.div>

        {/* KPI 2: PROFIT EARNED FROM ORDERS (TRADE COMMISSION) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-emerald-200 flex flex-col justify-between relative"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                Orders Commission
              </span>
              <div className="text-xs font-bold text-slate-800 mt-1">
                Profit Earned from Orders
              </div>
            </div>
            <span className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-lg border border-emerald-100">
              📦
            </span>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
              {formatCurrency(metrics.orderProfit)}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium mt-1.5">
              <span className="text-emerald-700 font-bold">Avg {metrics.avgPlatformFeePercent}% Fee</span>
              <span>{metrics.activeOrders} orders fulfilled</span>
            </div>
          </div>
        </motion.div>

        {/* KPI 3: PROFIT EARNED FROM SUBSCRIPTION MODELS */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-amber-200 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md">
                Subscription Models
              </span>
              <div className="text-xs font-bold text-slate-800 mt-1">
                Profit from Subscriptions
              </div>
            </div>
            <span className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-lg border border-amber-100">
              👑
            </span>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
              {formatCurrency(metrics.subscriptionProfit)}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium mt-1.5">
              <span className="text-amber-700 font-bold">₹600 & ₹2,000 Plans</span>
              <span>{metrics.activeSubscribersCount || 404} active members</span>
            </div>
          </div>
        </motion.div>

        {/* KPI 4: TOTAL WHOLESALE TRADE GMV */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-800 bg-blue-100 px-2 py-0.5 rounded-md">
                Gross Contract Value
              </span>
              <div className="text-xs font-bold text-slate-800 mt-1">
                Total Trade GMV Processed
              </div>
            </div>
            <span className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-lg border border-blue-100">
              📈
            </span>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
              {formatCurrency(metrics.totalGMV)}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium mt-1.5">
              <span className="text-blue-700 font-bold">10% Advance Escrow Protected</span>
              <span>38 wholesale sectors</span>
            </div>
          </div>
        </motion.div>

      </div>

      {/* ========================================================================= */}
      {/* PROFIT STREAMS & MONETIZATION BREAKDOWN WIDGET */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                Financial Architecture
              </span>
              <span className="text-xs text-slate-400">• B2B India Margin Models</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 mt-1">
              B2B Monetization & Profit Streams Breakdown
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time revenue split across Wholesale Order Commissions, Membership SaaS Subscriptions, and Value-Added Services.
            </p>
          </div>

          <div className="text-right flex-shrink-0">
            <span className="text-xs text-slate-400 block font-bold">Total Platform Net Retained</span>
            <span className="text-xl font-black text-emerald-700 font-mono">{formatCurrency(totalProfits)}</span>
          </div>
        </div>

        {/* Visual Proportional Profit Contribution Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span>Profit Contribution Share:</span>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Orders ({orderSharePercent}%)</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Subscriptions ({subSharePercent}%)</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> VAS / Escrow ({vasSharePercent}%)</span>
            </div>
          </div>

          <div className="h-3.5 w-full bg-slate-100 rounded-full overflow-hidden flex p-0.5 gap-0.5 border border-slate-200">
            <div 
              style={{ width: `${orderSharePercent}%` }} 
              className="bg-emerald-500 rounded-l-full h-full transition-all duration-500"
              title={`Orders Margin: ${orderSharePercent}%`}
            />
            <div 
              style={{ width: `${subSharePercent}%` }} 
              className="bg-amber-500 h-full transition-all duration-500"
              title={`Subscriptions: ${subSharePercent}%`}
            />
            <div 
              style={{ width: `${vasSharePercent}%` }} 
              className="bg-indigo-500 rounded-r-full h-full transition-all duration-500"
              title={`Value-Added Services: ${vasSharePercent}%`}
            />
          </div>
        </div>

        {/* Stream Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {profitStreams.map((stream) => (
            <div
              key={stream.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                stream.id === 'orders' ? 'bg-emerald-50/40 border-emerald-200' :
                stream.id === 'subscriptions' ? 'bg-amber-50/40 border-amber-200' :
                'bg-indigo-50/40 border-indigo-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">{stream.icon}</span>
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                    stream.id === 'orders' ? 'bg-emerald-100 text-emerald-800' :
                    stream.id === 'subscriptions' ? 'bg-amber-100 text-amber-800' :
                    'bg-indigo-100 text-indigo-800'
                  }`}>
                    {stream.badge}
                  </span>
                </div>

                <h3 className="font-extrabold text-sm text-slate-900">{stream.name}</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{stream.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">Profit Retained:</span>
                  <span className="text-base font-black font-mono text-slate-900">{formatCurrency(stream.profitINR)}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Take Rate / Margin:</span>
                  <span className="font-bold text-slate-700">{stream.marginPercent}</span>
                </div>
                <Link
                  href={stream.link}
                  className="mt-2 block text-center py-2 px-3 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 shadow-sm transition-colors"
                >
                  Manage {stream.name.split(' ')[0]} →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CATEGORY PLATFORM FEES PROFIT CONTRIBUTION BREAKDOWN */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
              Dynamic Commission Matrix
            </span>
            <h2 className="text-lg font-black text-white mt-1">
              Top Category Profit Contributions & Fee Margins
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live commission yields based on your tuned category platform fee percentages.
            </p>
          </div>

          <Link
            href="/admin/settings"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 self-start sm:self-auto transition-colors"
          >
            ⚙️ Edit 38 Category Fees
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
          {(data?.categoryProfitContributions || []).map((cat, i) => (
            <div
              key={cat.slug || i}
              className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-2 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xl">{cat.icon}</span>
                <span className="text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">
                  {cat.fee}% Fee
                </span>
              </div>
              <div>
                <div className="text-xs font-bold text-slate-200 truncate" title={cat.name}>
                  {cat.name}
                </div>
                <div className="text-base font-black text-emerald-400 font-mono mt-0.5">
                  {cat.formattedProfit}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  from {cat.formattedVolume} volume
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two Column Section: Escrow Orders & Pending Verifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Escrow Transactions */}
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Recent Escrow Orders & Profit Yield
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time deals backed by double-entry escrow ledgers.
              </p>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs font-bold text-brand-600 hover:text-brand-800 transition-colors"
            >
              View All Orders →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px]">
                  <th className="px-4 py-3">Transaction ID</th>
                  <th className="px-4 py-3">Product / Deal</th>
                  <th className="px-4 py-3">Order Value</th>
                  <th className="px-4 py-3 text-emerald-700">Platform Profit</th>
                  <th className="px-4 py-3">Escrow Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {(data?.recentTransactions || []).map((t, idx) => (
                  <tr key={t.id || idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-slate-800">
                      {t.transactionId}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900 truncate max-w-[180px]">{t.productName}</div>
                      <div className="text-[11px] text-slate-500 truncate">{t.buyerName}</div>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900 font-mono">
                      {formatCurrency(t.amount)}
                    </td>
                    <td className="px-4 py-3 font-black text-emerald-600 font-mono">
                      +{formatCurrency(t.platformFeeEarned || Math.round(t.amount * 0.03))}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        t.status === 'Settled' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pending Enterprise Verifications */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Verification Queue
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Suppliers awaiting GST check
              </p>
            </div>
            <Link
              href="/admin/users"
              className="text-xs font-bold text-brand-600 hover:text-brand-800"
            >
              Users Data →
            </Link>
          </div>

          <div className="space-y-3">
            {(data?.pendingVerificationUsers || []).map((u) => (
              <div
                key={u.id}
                className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-3 hover:border-brand-300 transition-all"
              >
                <div className="truncate">
                  <div className="font-bold text-xs text-slate-900 truncate">
                    {u.company_name || u.full_name || 'Enterprise'}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {u.city || 'India'} • <span className="capitalize">{u.role}</span>
                  </div>
                </div>

                <button
                  onClick={() => openOutreach(u)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-xl shadow-sm transition-all flex items-center gap-1 flex-shrink-0"
                >
                  <span>⚡</span> Pitch
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sales Outreach WhatsApp Pitch Modal */}
      {outreachOpen && outreachUser && (
        <SalesOutreachModal
          isOpen={outreachOpen}
          onClose={() => setOutreachOpen(false)}
          user={outreachUser}
          product={outreachProduct}
          searchQuery={outreachSearchQuery}
        />
      )}

      {/* 360° MASTER COMPANY INTELLIGENCE DOSSIER MODAL */}
      <AnimatePresence>
        {selected360User && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden my-auto"
            >
              {/* Header */}
              <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-black text-xl flex items-center justify-center shadow-lg">
                    {(selected360User.company_name || selected360User.full_name || 'E').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-black tracking-tight text-white">
                        {selected360User.company_name || selected360User.full_name}
                      </h2>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-blue-300 font-mono font-bold">
                        {selected360User.display_id || selected360User.id.slice(0, 8)}
                      </span>
                    </div>
                    <div className="text-slate-400 text-xs mt-0.5 flex flex-wrap items-center gap-2">
                      <span>Role: <strong className="text-slate-200 uppercase">{selected360User.role || 'buyer'}</strong></span>
                      <span>•</span>
                      <span>Plan: <strong className="text-amber-400">{selected360User.membership_plan || 'FREE TIER'}</strong></span>
                      <span>•</span>
                      <span>GST: <strong className={selected360User.gst_verified ? 'text-emerald-400' : 'text-slate-300'}>{selected360User.gst_number || 'PENDING'}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/users`}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all"
                  >
                    <span>👥</span> User Suite
                  </Link>
                  <button
                    onClick={() => setSelected360User(null)}
                    className="w-9 h-9 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="px-6 bg-slate-100 border-b border-slate-200 flex items-center gap-1.5 flex-shrink-0 overflow-x-auto py-1">
                {[
                  { id: 'profile', label: '👤 Profile & KYC' },
                  { id: 'security', label: `🔐 Auth & Login` },
                  { id: 'subscription', label: `👑 Plan: ${selected360User.membership_plan || 'Free'}` },
                  { id: 'products', label: `📦 Products (${selected360User.products_count || 0})` },
                  { id: 'rfqs', label: `📋 RFQs (${selected360User.rfqs_count || 0})` },
                  { id: 'quotes', label: `📩 Quotes (${selected360User.quotes_count || 0})` },
                  { id: 'orders', label: `💼 Orders (${selected360User.total_orders_count || 0})` },
                  { id: 'payments', label: `💳 Payments (${selected360User.payments?.length || 0})` },
                  { id: 'logistics', label: `🚚 Logistics (${selected360User.logistics_count || 0})` },
                  { id: 'searches', label: `🔍 Searches (${selected360User.searches_count || 0})` }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setDossierTab(tab.id)}
                    className={`py-2 px-3 text-xs font-extrabold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                      dossierTab === tab.id
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-transparent text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Modal Content Body */}
              <div className="p-6 overflow-y-auto flex-1 bg-slate-50 text-slate-800 text-xs space-y-4">
                {/* PROFILE TAB */}
                {dossierTab === 'profile' && (
                  <div className="space-y-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                      <h3 className="text-sm font-black text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
                        <span>🏢</span> Company & Registered Contact Details
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                          <div className="text-slate-400 font-bold text-[10px] uppercase">Company Name</div>
                          <div className="font-extrabold text-slate-900 text-sm mt-0.5">{selected360User.company_name || 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-slate-400 font-bold text-[10px] uppercase">Contact Person</div>
                          <div className="font-bold text-slate-900 mt-0.5">{selected360User.full_name || 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-slate-400 font-bold text-[10px] uppercase">Registered Email</div>
                          <div className="font-mono font-bold text-slate-900 mt-0.5">{selected360User.registered_email || 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-slate-400 font-bold text-[10px] uppercase">Corporate Phone</div>
                          <div className="font-bold text-slate-900 mt-0.5">{selected360User.corporate_phone || selected360User.phone_number || 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-slate-400 font-bold text-[10px] uppercase">WhatsApp Number</div>
                          <div className="font-bold text-emerald-700 mt-0.5">{selected360User.whatsapp_number || 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-slate-400 font-bold text-[10px] uppercase">GSTIN & Compliance</div>
                          <div className="font-mono font-bold text-slate-900 mt-0.5">{selected360User.gst_number || 'PENDING'}</div>
                        </div>
                        <div className="sm:col-span-3">
                          <div className="text-slate-400 font-bold text-[10px] uppercase">Operating Warehouse Address</div>
                          <div className="font-medium text-slate-800 mt-0.5">
                            {selected360User.warehouse_address || 'Unset'} — {selected360User.city || 'Pune'}, {selected360User.state || 'Maharashtra'} {selected360User.pincode || ''}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* AUTH & SECURITY TAB */}
                {dossierTab === 'security' && (
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <h3 className="text-sm font-black text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
                      <span>🔐</span> Login Credentials & Auth Metadata
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <div className="text-slate-400 font-bold text-[10px] uppercase">Auth Provider</div>
                        <div className="font-bold text-slate-900 mt-0.5 capitalize">{selected360User.auth_provider || 'Email'}</div>
                      </div>
                      <div>
                        <div className="text-slate-400 font-bold text-[10px] uppercase">Registration Date</div>
                        <div className="font-bold text-slate-900 mt-0.5">
                          {new Date(selected360User.registration_date || selected360User.created_at || Date.now()).toLocaleString('en-IN')}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-400 font-bold text-[10px] uppercase">Last Login Timestamp</div>
                        <div className="font-bold text-indigo-700 mt-0.5">
                          {selected360User.last_sign_in ? new Date(selected360User.last_sign_in).toLocaleString('en-IN') : 'Recent Active'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* SUBSCRIPTION TAB */}
                {dossierTab === 'subscription' && (
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black text-slate-900">Active Membership Tier</span>
                      <span className="px-3 py-1 bg-amber-100 text-amber-900 font-black rounded-full text-xs">
                        👑 {selected360User.membership_plan || 'FREE TIER'}
                      </span>
                    </div>
                    <p className="text-slate-500">
                      Status: <strong>{selected360User.membership_status || 'Standard Free Tier'}</strong> • 
                      Valid Until: {selected360User.membership_expires_at ? new Date(selected360User.membership_expires_at).toLocaleDateString('en-IN') : 'Lifetime'}
                    </p>
                  </div>
                )}

                {/* PRODUCTS TAB */}
                {dossierTab === 'products' && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-slate-900">Published Products ({selected360User.products_count || 0})</span>
                      <span className="font-bold text-emerald-700">Catalog Valuation: ₹{Number(selected360User.catalog_moq_valuation || 0).toLocaleString('en-IN')}</span>
                    </div>
                    {(!selected360User.products || selected360User.products.length === 0) ? (
                      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
                        📦 No products listed by this user.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {selected360User.products.map(p => (
                          <div key={p.id} className="p-3 bg-white border border-slate-200 rounded-xl">
                            <div className="font-bold text-slate-900 truncate">{p.title}</div>
                            <div className="font-mono text-[10px] text-slate-400 mt-0.5 truncate">ID: {p.id}</div>
                            <div className="font-black text-brand-700 text-xs mt-1">₹{p.base_price_per_unit} / {p.unit_label || 'unit'}</div>
                            <div className="text-[10px] text-slate-500 mt-0.5">MOQ: {p.bulk_minimum_order || 1} • Stock: {p.inventory_count || 0}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* RFQS TAB */}
                {dossierTab === 'rfqs' && (
                  <div className="space-y-2">
                    <div className="font-bold text-slate-900 mb-1">Broadcasted RFQs ({selected360User.rfqs_count || 0})</div>
                    {(!selected360User.rfqs || selected360User.rfqs.length === 0) ? (
                      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
                        📋 No RFQ requirements posted yet.
                      </div>
                    ) : (
                      selected360User.rfqs.map(r => (
                        <div key={r.id} className="p-3 bg-white border border-slate-200 rounded-xl flex justify-between">
                          <div>
                            <div className="font-bold text-slate-900">{r.product_name}</div>
                            <div className="text-slate-500 text-[11px]">Quantity: {r.quantity} {r.unit} • Target: ₹{r.target_price}</div>
                          </div>
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded-full h-fit">{r.status || 'open'}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* QUOTES TAB */}
                {dossierTab === 'quotes' && (
                  <div className="space-y-2">
                    <div className="font-bold text-slate-900 mb-1">Quotations Submitted ({selected360User.quotes_count || 0})</div>
                    {(!selected360User.quotes || selected360User.quotes.length === 0) ? (
                      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
                        📩 No quotations submitted by this user.
                      </div>
                    ) : (
                      selected360User.quotes.map(q => (
                        <div key={q.id} className="p-3 bg-white border border-slate-200 rounded-xl flex justify-between">
                          <div>
                            <div className="font-bold text-slate-900">Quote #{q.id.slice(0, 8)}</div>
                            <div className="text-emerald-700 font-bold text-xs mt-0.5">Quoted: ₹{q.quoted_price} • Days: {q.delivery_days || 5}</div>
                          </div>
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold rounded-full h-fit">{q.status || 'Submitted'}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* ORDERS TAB */}
                {dossierTab === 'orders' && (
                  <div className="space-y-2">
                    <div className="font-bold text-slate-900 mb-1">Trade Orders ({selected360User.total_orders_count || 0})</div>
                    {(!selected360User.orders || selected360User.orders.length === 0) ? (
                      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
                        💼 No trade orders placed or received.
                      </div>
                    ) : (
                      selected360User.orders.map((o, idx) => (
                        <div key={idx} className="p-3 bg-white border border-slate-200 rounded-xl flex justify-between items-center">
                          <div>
                            <div className="font-bold text-slate-900">{o.product_name || `Order #${(o.id || '').slice(0, 8)}`}</div>
                            <div className="text-slate-500 text-[11px]">Advance (10%): ₹{Number(o.advance_paid_10 || o.advance_amount || 0).toLocaleString('en-IN')}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-black text-slate-900">₹{Number(o.total_contract_value || o.total_amount || 0).toLocaleString('en-IN')}</div>
                            <span className="text-[10px] text-emerald-700 font-bold capitalize">{o.current_state || o.order_status || 'in_escrow'}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* PAYMENTS TAB */}
                {dossierTab === 'payments' && (
                  <div className="space-y-2">
                    <div className="font-bold text-slate-900 mb-1">Payments Logged ({selected360User.payments?.length || 0})</div>
                    {(!selected360User.payments || selected360User.payments.length === 0) ? (
                      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
                        💳 No payment records logged.
                      </div>
                    ) : (
                      selected360User.payments.map((p, idx) => (
                        <div key={idx} className="p-3 bg-white border border-slate-200 rounded-xl flex justify-between items-center">
                          <div>
                            <div className="font-mono font-bold text-slate-900">ID: {p.payment_id}</div>
                            <div className="text-[11px] text-slate-500">{p.type} • {p.method}</div>
                          </div>
                          <div className="font-black text-emerald-700 text-sm">₹{Number(p.amount).toLocaleString('en-IN')}</div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* LOGISTICS TAB */}
                {dossierTab === 'logistics' && (
                  <div className="space-y-2">
                    <div className="font-bold text-slate-900 mb-1">Logistics & Gate Passes ({selected360User.logistics_count || 0})</div>
                    {(!selected360User.logistics || selected360User.logistics.length === 0) ? (
                      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
                        🚚 No shipments or gate passes recorded.
                      </div>
                    ) : (
                      selected360User.logistics.map((l, idx) => (
                        <div key={idx} className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                          <div className="flex justify-between font-mono font-bold text-blue-700">
                            <span>{l.tracking_number}</span>
                            <span className="text-[10px] text-slate-600 capitalize">{l.delivery_option}</span>
                          </div>
                          <div className="text-slate-700 text-[11px]">Vehicle: {l.vehicle_number} • Driver: {l.driver_name}</div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* SEARCHES TAB */}
                {dossierTab === 'searches' && (
                  <div className="space-y-3">
                    <div className="font-bold text-slate-900">Procurement Searches ({selected360User.searches_count || 0})</div>
                    {selected360User.top_searches && selected360User.top_searches.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selected360User.top_searches.map((ts, idx) => (
                          <span key={idx} className="px-3 py-1 bg-white border border-amber-300 rounded-xl text-xs font-black text-slate-900 shadow-sm flex items-center gap-1.5">
                            <span>🔍</span> {ts.keyword}
                            <span className="bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-full text-[10px]">{ts.count}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
