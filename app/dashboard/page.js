// ============================================================================
// DASHBOARD PAGE
// ============================================================================
// Role-based dashboard with different views for Buyer, Supplier, and Admin.
// Includes high-fidelity Settings panel for Password, Verification, Favorites, and History.
// ============================================================================

"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

// ── Demo dashboard data ──
const DEMO_STATS = {
  buyer: [
    { label: 'Active Orders', value: '12', icon: '📦', change: '+3 this week' },
    { label: 'Pending Quotes', value: '5', icon: '📋', change: '2 expiring' },
    { label: 'Total Spent', value: '₹14.2L', icon: '💰', change: '+₹3.1L this month' },
    { label: 'Suppliers Used', value: '8', icon: '🏭', change: '2 new' },
  ],
  supplier: [
    { label: 'Active Listings', value: '24', icon: '📦', change: '3 stale' },
    { label: 'Incoming Orders', value: '7', icon: '📥', change: '+2 today' },
    { label: 'Revenue', value: '₹28.5L', icon: '💰', change: '+₹8.2L this month' },
    { label: 'Verification', value: 'Active', icon: '✅', change: 'GST Verified' },
  ],
};

const DEMO_ORDERS = [
  { id: 'ORD-B2B-001', product: 'HDPE Granules (25 Tons)', supplier: 'Reliance Polymers', status: 'price_locked_10', value: '₹28,75,000', date: '2026-06-25' },
  { id: 'ORD-B2B-002', product: 'Armoured Cable (2km)', supplier: 'Polycab India', status: 'warehouse_loading', value: '₹96,00,000', date: '2026-06-24' },
  { id: 'ORD-B2B-003', product: 'CNC Turning Centre', supplier: 'Ace Micromatic', status: 'quotation_issued', value: '₹45,00,000', date: '2026-06-27' },
  { id: 'ORD-B2B-004', product: 'Cashew W240 (5 Tons)', supplier: 'Milan Dry Fruits', status: 'settled', value: '₹46,00,000', date: '2026-06-20' },
];

const STATUS_MAP = {
  quotation_issued: { label: 'Quotation', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  price_locked_10: { label: '10% Locked', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  warehouse_loading: { label: 'Loading', color: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
  settled: { label: 'Settled', color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
  rerouted: { label: 'Rerouted', color: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
};

const DEMO_FAVORITES = [
  { id: 'fav-1', product: 'Industrial Grade HDPE Granules', supplier: 'Reliance Polymers', price: '₹115/kg' },
  { id: 'fav-2', product: 'Drip Irrigation System Kit', supplier: 'Jain Irrigation', price: '₹45,000/kit' },
];

const DEMO_HISTORY = [
  { id: 'hist-1', product: 'Three-Phase Electric Motor 5HP', date: '2 hours ago' },
  { id: 'hist-2', product: 'Mild Steel Rebars (TMT)', date: '1 day ago' },
];

export default function DashboardPage() {
  const [role, setRole] = useState('buyer');
  const [activeTab, setActiveTab] = useState('overview');
  const stats = DEMO_STATS[role] || DEMO_STATS.buyer;

  return (
      <main className="flex-1 pt-24 pb-16 bg-surface-elevated min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header & Role Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">Dashboard</h1>
              <p className="text-gray-500 mt-1">Manage your B2B trading workspace.</p>
            </div>

            <div className="flex rounded-xl bg-white border border-border-subtle p-1 shadow-sm">
              {['buyer', 'supplier'].map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
                    role === r
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {r} View
                </button>
              ))}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-2 border-b border-gray-200 mb-8 overflow-x-auto no-scrollbar">
            {['overview', 'orders', 'settings'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 px-4 text-sm font-semibold capitalize transition-colors relative whitespace-nowrap ${
                  activeTab === tab ? 'text-brand-600' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <motion.div 
                    layoutId="activeTabIndicator" 
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600" 
                  />
                )}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* ── OVERVIEW TAB ── */}
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {stats.map((stat, i) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="rounded-2xl bg-white border border-border-subtle p-5 shadow-sm hover:shadow-md transition-all"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-2xl">{stat.icon}</span>
                        <span className="text-[10px] text-gray-400 font-medium bg-gray-50 px-2 py-1 rounded-full">{stat.change}</span>
                      </div>
                      <div className="text-2xl font-extrabold text-foreground">{stat.value}</div>
                      <div className="text-xs text-gray-500 mt-1 font-medium">{stat.label}</div>
                    </motion.div>
                  ))}
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Link href="/directory" className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-6 shadow-md hover:-translate-y-1 transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform">
                      <span className="text-8xl">🔍</span>
                    </div>
                    <span className="text-2xl mb-3 block text-white/90">🔍</span>
                    <h3 className="font-bold text-white text-lg">Browse Directory</h3>
                    <p className="text-brand-100 text-sm mt-1">Find verified suppliers across 38 sectors</p>
                  </Link>
                  <Link href="/dashboard" onClick={(e) => { e.preventDefault(); setActiveTab('orders'); }} className="rounded-2xl bg-white border border-border-subtle p-6 hover:shadow-md hover:-translate-y-1 transition-all group">
                    <span className="text-2xl mb-3 block">📊</span>
                    <h3 className="font-bold text-foreground group-hover:text-brand-700 transition-colors">Order History</h3>
                    <p className="text-xs text-gray-400 mt-1">Track all trades and escrow settlements</p>
                  </Link>
                  <Link href="/dashboard" onClick={(e) => { e.preventDefault(); setActiveTab('settings'); }} className="rounded-2xl bg-white border border-border-subtle p-6 hover:shadow-md hover:-translate-y-1 transition-all group">
                    <span className="text-2xl mb-3 block">⚙️</span>
                    <h3 className="font-bold text-foreground group-hover:text-brand-700 transition-colors">Account Settings</h3>
                    <p className="text-xs text-gray-400 mt-1">Manage security, verification, and preferences</p>
                  </Link>
                </div>
              </motion.div>
            )}

            {/* ── ORDERS TAB ── */}
            {activeTab === 'orders' && (
              <motion.div
                key="orders"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="rounded-2xl bg-white border border-border-subtle overflow-hidden shadow-sm">
                  <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                      <svg className="w-5 h-5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                      All Transactions
                    </h2>
                  </div>
                  <div className="divide-y divide-border-subtle">
                    {DEMO_ORDERS.map((order, i) => {
                      const statusInfo = STATUS_MAP[order.status] || STATUS_MAP.quotation_issued;
                      return (
                        <div key={order.id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                          <div className={`w-3 h-3 rounded-full ${statusInfo.dot} flex-shrink-0`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-foreground">{order.id}</span>
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${statusInfo.color} uppercase tracking-wider`}>
                                {statusInfo.label}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 mt-1 truncate">
                              {order.product} <span className="text-gray-300 mx-1">|</span> {order.supplier}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-base font-extrabold text-foreground">{order.value}</div>
                            <div className="text-xs text-gray-400 mt-0.5">{order.date}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── SETTINGS TAB ── */}
            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
              >
                {/* Left Column: Verification & Security */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Verification Status Card */}
                  <div className="bg-white rounded-2xl shadow-sm border border-border-subtle overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                      <h3 className="font-bold text-lg text-gray-900">Corporate Verification</h3>
                      <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold flex items-center gap-1.5 uppercase tracking-wide">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                        In-Review
                      </span>
                    </div>
                    <div className="p-6">
                      <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                        Your GST and PAN documentation is currently being reviewed by our compliance team. Full platform trading capabilities will unlock upon approval.
                      </p>
                      
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-success-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          <div>
                            <div className="text-sm font-bold text-gray-900">Email Verification</div>
                            <div className="text-xs text-gray-500">Verified on Jun 28, 2026</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-success-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          <div>
                            <div className="text-sm font-bold text-gray-900">Mobile OTP</div>
                            <div className="text-xs text-gray-500">Verified on Jun 28, 2026</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-amber-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          <div>
                            <div className="text-sm font-bold text-gray-900">GST Registration</div>
                            <div className="text-xs text-amber-600 font-medium">Pending manual verification</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Security / Change Password */}
                  <div className="bg-white rounded-2xl shadow-sm border border-border-subtle overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-100">
                      <h3 className="font-bold text-lg text-gray-900">Security</h3>
                    </div>
                    <div className="p-6">
                      <form className="space-y-4 max-w-md">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Current Password</label>
                          <input type="password" placeholder="••••••••" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none text-sm transition-shadow" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1.5">New Password</label>
                          <input type="password" placeholder="••••••••" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none text-sm transition-shadow" />
                        </div>
                        <div className="pt-2">
                          <button type="button" className="px-5 py-2.5 bg-gray-900 hover:bg-black text-white text-sm font-semibold rounded-xl shadow-sm transition-colors">
                            Update Password
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>

                {/* Right Column: Favorites & History */}
                <div className="space-y-6">
                  
                  {/* Favorites */}
                  <div className="bg-white rounded-2xl shadow-sm border border-border-subtle overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                      <span className="text-lg">⭐</span>
                      <h3 className="font-bold text-gray-900">Saved Products</h3>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {DEMO_FAVORITES.map((fav) => (
                        <div key={fav.id} className="p-4 hover:bg-gray-50 transition-colors">
                          <div className="text-sm font-bold text-gray-900 line-clamp-1">{fav.product}</div>
                          <div className="flex justify-between items-center mt-1">
                            <div className="text-xs text-gray-500">{fav.supplier}</div>
                            <div className="text-xs font-bold text-brand-600">{fav.price}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 border-t border-gray-100 bg-gray-50/50 text-center">
                      <button className="text-xs font-semibold text-brand-600 hover:text-brand-800">View All Favorites →</button>
                    </div>
                  </div>

                  {/* Browsing History */}
                  <div className="bg-white rounded-2xl shadow-sm border border-border-subtle overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                      <span className="text-lg">🕒</span>
                      <h3 className="font-bold text-gray-900">Browsing History</h3>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {DEMO_HISTORY.map((hist) => (
                        <div key={hist.id} className="p-4 hover:bg-gray-50 transition-colors">
                          <div className="text-sm font-medium text-gray-800 line-clamp-1">{hist.product}</div>
                          <div className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">{hist.date}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </main>
  );
}

