'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import SalesOutreachModal from '@/components/admin/SalesOutreachModal';

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'subscriptions', 'orders', 'successful', 'failed', 'pending'
  const [searchQuery, setSearchQuery] = useState('');
  const [metrics, setMetrics] = useState({
    totalSuccessfulVolume: 0,
    successfulCount: 0,
    totalFailedVolume: 0,
    failedCount: 0,
    totalPendingVolume: 0,
    pendingCount: 0,
    totalSubscriptionVolume: 0,
    subscriptionCount: 0,
    totalOrderVolume: 0,
    orderCount: 0
  });

  // Manual payment modal state
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [manualForm, setManualForm] = useState({
    userId: '',
    orderId: '',
    amount: '708',
    paymentMethod: 'NEFT / RTGS Bank Transfer',
    status: 'successful',
    transactionReference: '',
    paymentType: 'supplier_subscription_quarterly',
    notes: ''
  });
  const [submittingManual, setSubmittingManual] = useState(false);

  // Outreach Modal State
  const [outreachOpen, setOutreachOpen] = useState(false);
  const [outreachUser, setOutreachUser] = useState(null);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const url = activeTab === 'all' 
        ? '/api/admin/payments' 
        : `/api/admin/payments?status=${activeTab}`;
      const res = await fetch(url);
      if (!res.ok) {
        if (res.status === 403) throw new Error('Forbidden: You do not have admin access.');
        throw new Error('Failed to fetch payments');
      }
      const data = await res.json();
      setPayments(data.payments || []);
      if (data.metrics) setMetrics(data.metrics);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [activeTab]);

  const handleRecordManualPayment = async (e) => {
    e.preventDefault();
    setSubmittingManual(true);
    try {
      const res = await fetch('/api/admin/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(manualForm)
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to record payment');
      }
      setManualModalOpen(false);
      setManualForm({
        userId: '',
        orderId: '',
        amount: '708',
        paymentMethod: 'NEFT / RTGS Bank Transfer',
        status: 'successful',
        transactionReference: '',
        paymentType: 'supplier_subscription_quarterly',
        notes: ''
      });
      fetchPayments();
    } catch (err) {
      alert(`Error recording payment: ${err.message}`);
    } finally {
      setSubmittingManual(false);
    }
  };

  const getStatusBadge = (status, reason) => {
    switch (status) {
      case 'successful':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Successful
          </span>
        );
      case 'failed':
        return (
          <div className="flex flex-col items-start gap-0.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              Failed
            </span>
            {reason && (
              <span className="text-[11px] text-rose-600 font-medium max-w-[180px] truncate" title={reason}>
                {reason}
              </span>
            )}
          </div>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            Pending
          </span>
        );
      case 'refunded':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
            Refunded
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
            {status || 'Unknown'}
          </span>
        );
    }
  };

  const formatPaymentType = (type) => {
    if (!type) return 'Direct Escrow';
    if (type === 'supplier_subscription') return 'Supplier Subscription';
    if (type === 'advance_10_percent') return '10% Advance Escrow';
    return type
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  // Filter payments by search query
  const filteredPayments = payments.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const company = p.users?.company_name?.toLowerCase() || '';
    const email = p.users?.registered_email?.toLowerCase() || '';
    const phone = p.users?.corporate_phone?.toLowerCase() || '';
    const ref = p.transaction_reference?.toLowerCase() || '';
    const id = p.id?.toLowerCase() || '';
    const plan = p.plan?.toLowerCase() || '';
    const orderId = p.order_id?.toLowerCase() || '';
    return company.includes(q) || email.includes(q) || phone.includes(q) || ref.includes(q) || id.includes(q) || plan.includes(q) || orderId.includes(q);
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 text-xl">💳</span>
            Payments & Settlement Hub
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time tracking of buyer escrow advances, supplier subscription payments, and platform transactions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/subscriptions"
            className="px-3.5 py-2.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
          >
            <span>⭐</span> Manage Subscriptions
          </Link>
          <button
            onClick={() => setManualModalOpen(true)}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-2 transition-all active:scale-95"
          >
            <span>➕</span> Record Offline Payment
          </button>
          <button
            onClick={fetchPayments}
            className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl shadow-sm transition-all"
            title="Refresh payments"
          >
            🔄
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Volume Settled */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-800 text-white rounded-3xl p-5 shadow-lg shadow-emerald-600/10 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-emerald-100 text-xs font-bold uppercase tracking-wider">Total Volume Paid</div>
              <div className="text-2xl font-black mt-1">
                ₹{(metrics?.totalSuccessfulVolume ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
            </div>
            <span className="p-2.5 rounded-2xl bg-white/15 text-white text-lg">✅</span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-emerald-100 font-medium">
            <span className="font-bold bg-white/20 px-2 py-0.5 rounded-full">{metrics?.successfulCount ?? 0}</span>
            <span>All settlements combined</span>
          </div>
        </div>

        {/* Supplier Subscriptions Volume */}
        <div 
          onClick={() => setActiveTab('subscriptions')}
          className={`cursor-pointer transition-all rounded-3xl p-5 border relative overflow-hidden ${
            activeTab === 'subscriptions' 
              ? 'bg-purple-900 text-white border-purple-800 shadow-lg shadow-purple-900/20' 
              : 'bg-white hover:border-purple-300 border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex justify-between items-start">
            <div>
              <div className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${activeTab === 'subscriptions' ? 'text-purple-200' : 'text-purple-700'}`}>
                <span>⭐</span> Subscriptions Paid
              </div>
              <div className={`text-2xl font-black mt-1 ${activeTab === 'subscriptions' ? 'text-white' : 'text-slate-900'}`}>
                ₹{(metrics?.totalSubscriptionVolume ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
            </div>
            <span className={`p-2.5 rounded-2xl text-lg ${activeTab === 'subscriptions' ? 'bg-white/20 text-white' : 'bg-purple-50 text-purple-700 border border-purple-100'}`}>
              👑
            </span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs font-medium">
            <span className={`font-bold px-2 py-0.5 rounded-full ${activeTab === 'subscriptions' ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-800'}`}>
              {metrics?.subscriptionCount ?? 0}
            </span>
            <span className={activeTab === 'subscriptions' ? 'text-purple-200' : 'text-slate-500'}>
              Active supplier memberships
            </span>
          </div>
        </div>

        {/* Trade Orders Escrow */}
        <div 
          onClick={() => setActiveTab('orders')}
          className={`cursor-pointer transition-all rounded-3xl p-5 border relative overflow-hidden ${
            activeTab === 'orders' 
              ? 'bg-blue-900 text-white border-blue-800 shadow-lg shadow-blue-900/20' 
              : 'bg-white hover:border-blue-300 border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex justify-between items-start">
            <div>
              <div className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${activeTab === 'orders' ? 'text-blue-200' : 'text-blue-700'}`}>
                <span>📦</span> Trade Escrow (10%)
              </div>
              <div className={`text-2xl font-black mt-1 ${activeTab === 'orders' ? 'text-white' : 'text-slate-900'}`}>
                ₹{(metrics?.totalOrderVolume ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
            </div>
            <span className={`p-2.5 rounded-2xl text-lg ${activeTab === 'orders' ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-700 border border-blue-100'}`}>
              🤝
            </span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs font-medium">
            <span className={`font-bold px-2 py-0.5 rounded-full ${activeTab === 'orders' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-800'}`}>
              {metrics?.orderCount ?? 0}
            </span>
            <span className={activeTab === 'orders' ? 'text-blue-200' : 'text-slate-500'}>
              Locked contracts & advances
            </span>
          </div>
        </div>

        {/* Pending & Attention Needed */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-amber-600 text-xs font-bold uppercase tracking-wider">Pending / Attention</div>
              <div className="text-2xl font-black text-slate-900 mt-1">
                ₹{((metrics?.totalPendingVolume ?? 0) + (metrics?.totalFailedVolume ?? 0)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
            </div>
            <span className="p-2.5 rounded-2xl bg-amber-50 text-amber-600 text-lg border border-amber-100">⏳</span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-amber-700 font-medium">
            <span className="font-bold bg-amber-100 px-2 py-0.5 rounded-full text-amber-800">
              {(metrics?.pendingCount ?? 0) + (metrics?.failedCount ?? 0)}
            </span>
            <span>Awaiting clearance or follow-up</span>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Filters & Search */}
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Category & Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-2xl">
            {[
              { id: 'all', label: 'All Payments', count: metrics?.successfulCount },
              { id: 'subscriptions', label: '⭐ Subscriptions', count: metrics?.subscriptionCount, badgeColor: 'bg-purple-200 text-purple-900' },
              { id: 'orders', label: '📦 Trade Escrow', count: metrics?.orderCount, badgeColor: 'bg-blue-200 text-blue-900' },
              { id: 'successful', label: 'Successful' },
              { id: 'pending', label: 'Pending', count: metrics?.pendingCount, badgeColor: 'bg-amber-200 text-amber-900' },
              { id: 'failed', label: 'Failed', count: metrics?.failedCount, badgeColor: 'bg-rose-200 text-rose-900' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${tab.badgeColor || 'bg-slate-200 text-slate-800'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-sm">
              🔍
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search buyer, supplier, plan, ref..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Payments Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-4 px-5">Date & Time</th>
                <th className="py-4 px-5">Party (Buyer / Supplier)</th>
                <th className="py-4 px-5">Payment Purpose</th>
                <th className="py-4 px-5">Method & Ref</th>
                <th className="py-4 px-5 text-right">Amount</th>
                <th className="py-4 px-5 text-center">Status</th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400 animate-pulse">
                    Loading payments and subscription records...
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-500">
                    <div className="text-3xl mb-2">💳</div>
                    <div className="font-bold text-slate-800">No payment records found</div>
                    <div className="text-xs text-slate-400 mt-1">
                      Transactions will automatically appear as buyers make escrow payments or suppliers subscribe to plans.
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => {
                  const party = p.users;
                  const isSubscription = p.payment_type === 'supplier_subscription';
                  const rawPhone = party?.whatsapp_number || party?.corporate_phone || '';
                  const cleanPhone = rawPhone.replace(/[^0-9]/g, '');

                  return (
                    <tr 
                      key={p.id} 
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isSubscription ? 'bg-purple-50/20' : ''
                      }`}
                    >
                      {/* Date */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        <div className="font-bold text-slate-900 text-xs">
                          {new Date(p.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {new Date(p.created_at).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </td>

                      {/* Party (Buyer / Supplier) */}
                      <td className="py-4 px-5">
                        {party ? (
                          <div>
                            <div className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                              <span>{party.company_name || 'Individual Party'}</span>
                              {isSubscription ? (
                                <span className="text-[9px] bg-purple-100 text-purple-800 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider border border-purple-200">
                                  SUPPLIER
                                </span>
                              ) : (
                                <span className="text-[9px] bg-blue-100 text-blue-800 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider border border-blue-200">
                                  BUYER
                                </span>
                              )}
                              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-mono">
                                {party.display_id || (party.id && party.id.substring(0, 8))}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500">{party.registered_email}</div>
                            {rawPhone && (
                              <div className="flex items-center gap-2 mt-1">
                                <a
                                  href={`tel:${rawPhone}`}
                                  className="text-[11px] font-semibold text-emerald-700 hover:underline flex items-center gap-0.5"
                                >
                                  📞 {rawPhone}
                                </a>
                                {cleanPhone && (
                                  <a
                                    href={`https://wa.me/91${cleanPhone.slice(-10)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[10px] bg-green-50 text-green-700 font-bold px-1.5 py-0.5 rounded hover:bg-green-100 transition-colors"
                                  >
                                    💬 WA
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            <span className="text-slate-400 italic text-xs">Direct / Guest Settlement</span>
                            <div className="text-[10px] text-slate-400 font-mono">ID: {p.user_id ? p.user_id.substring(0, 8) : 'N/A'}</div>
                          </div>
                        )}
                      </td>

                      {/* Payment Purpose */}
                      <td className="py-4 px-5">
                        {isSubscription ? (
                          <div className="flex flex-col items-start gap-1">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-purple-100 text-purple-900 border border-purple-200">
                              <span>⭐</span>
                              <span>SUPPLIER SUBSCRIPTION</span>
                            </span>
                            <div className="font-extrabold text-slate-900 text-xs flex items-center gap-1">
                              <span>{p.plan || 'QUARTERLY PLAN'}</span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-medium">
                              {p.plan === 'ANNUAL PLAN' ? '12 Months Access Pass' : '3 Months Access Pass'}
                            </span>
                          </div>
                        ) : (
                          <div>
                            <span className="font-bold text-slate-800 text-xs">
                              {formatPaymentType(p.payment_type)}
                            </span>
                            {p.order_id && (
                              <Link
                                href={`/admin/orders?search=${p.order_id.substring(0, 8)}`}
                                className="block text-[11px] text-emerald-700 hover:underline font-mono font-semibold mt-0.5"
                              >
                                Order #{p.order_id.substring(0, 8)}
                              </Link>
                            )}
                            {p.trade_orders?.product?.title && (
                              <div className="text-[11px] text-slate-500 truncate max-w-[170px]" title={p.trade_orders.product.title}>
                                {p.trade_orders.product.title}
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Method & Ref */}
                      <td className="py-4 px-5">
                        <div className="font-semibold text-slate-700 text-xs">{p.payment_method || 'Razorpay Gateway'}</div>
                        <div className="text-[10px] text-slate-500 font-mono font-medium truncate max-w-[150px]" title={p.transaction_reference}>
                          {p.transaction_reference || 'N/A'}
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        <span className="text-sm font-black text-slate-900">
                          ₹{Number(p.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                        <div className="text-[10px] text-slate-400 font-medium">
                          {isSubscription ? 'Incl. 18% GST' : '10% Advance Escrow'}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-5 text-center whitespace-nowrap">
                        {getStatusBadge(p.status, p.failure_reason)}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {isSubscription ? (
                            <Link
                              href="/admin/subscriptions"
                              className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-purple-800 bg-purple-100 hover:bg-purple-200 transition-colors"
                              title="View and manage subscription plan"
                            >
                              Plan ↗
                            </Link>
                          ) : null}

                          {party ? (
                            <button
                              type="button"
                              onClick={() => {
                                setOutreachUser(party);
                                setOutreachOpen(true);
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 flex items-center gap-1 ${
                                p.status === 'failed'
                                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              }`}
                              title={p.status === 'failed' ? 'Reach out to help complete payment' : 'Send receipt confirmation on WhatsApp'}
                            >
                              <span>⚡</span>
                              {p.status === 'failed' ? 'Assist' : 'Outreach'}
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400 italic">-</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Payment Entry Modal */}
      {manualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>➕</span> Record Offline / Manual Payment
              </h3>
              <button
                type="button"
                onClick={() => setManualModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordManualPayment} className="space-y-4 mt-5">
              {/* Payment Type */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Payment Category & Purpose *
                </label>
                <select
                  value={manualForm.paymentType}
                  onChange={(e) => {
                    const val = e.target.value;
                    let autoAmt = manualForm.amount;
                    if (val === 'supplier_subscription_quarterly') autoAmt = '708';
                    if (val === 'supplier_subscription_annual') autoAmt = '2360';
                    setManualForm({ ...manualForm, paymentType: val, amount: autoAmt });
                  }}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value="supplier_subscription_quarterly">⭐ Supplier Subscription (Quarterly Plan - ₹708)</option>
                  <option value="supplier_subscription_annual">⭐ Supplier Subscription (Annual Plan - ₹2,360)</option>
                  <option value="advance_10_percent">📦 Trade Order Advance (10% Escrow)</option>
                  <option value="manual_settlement">General Platform Settlement / Commission</option>
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Amount in INR (₹) *
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 708"
                  value={manualForm.amount}
                  onChange={(e) => setManualForm({ ...manualForm, amount: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {/* Order ID or User info */}
              {manualForm.paymentType === 'advance_10_percent' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Trade Order ID (UUID) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 7320c7be-4aa0-4ea8-80b8-1d2fd897a3a8"
                    value={manualForm.orderId}
                    onChange={(e) => setManualForm({ ...manualForm, orderId: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Supplier Email or User ID *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. supplier@example.com or user UUID"
                    value={manualForm.userId}
                    onChange={(e) => setManualForm({ ...manualForm, userId: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Status
                  </label>
                  <select
                    value={manualForm.status}
                    onChange={(e) => setManualForm({ ...manualForm, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                  >
                    <option value="successful">Successful</option>
                    <option value="pending">Pending Clearance</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Payment Method
                  </label>
                  <select
                    value={manualForm.paymentMethod}
                    onChange={(e) => setManualForm({ ...manualForm, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                  >
                    <option value="NEFT / RTGS Bank Transfer">NEFT / RTGS Transfer</option>
                    <option value="Direct UPI">Direct UPI</option>
                    <option value="Bank Cheque / Draft">Bank Cheque / Draft</option>
                    <option value="Cash Deposit">Cash Deposit</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Transaction Reference / UTR Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. UTR123498765432 or CHEQUE#890"
                  value={manualForm.transactionReference}
                  onChange={(e) => setManualForm({ ...manualForm, transactionReference: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Internal Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Verified by Accounts Dept against HDFC statement"
                  value={manualForm.notes}
                  onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setManualModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingManual}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm"
                >
                  {submittingManual ? 'Saving...' : 'Save Payment Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Outreach Modal */}
      {outreachOpen && outreachUser && (
        <SalesOutreachModal
          isOpen={outreachOpen}
          onClose={() => setOutreachOpen(false)}
          user={outreachUser}
        />
      )}
    </div>
  );
}
