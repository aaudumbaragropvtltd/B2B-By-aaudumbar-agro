'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import SalesOutreachModal from '@/components/admin/SalesOutreachModal';

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'successful', 'failed', 'pending'
  const [searchQuery, setSearchQuery] = useState('');
  const [metrics, setMetrics] = useState({
    totalSuccessfulVolume: 0,
    successfulCount: 0,
    totalFailedVolume: 0,
    failedCount: 0,
    totalPendingVolume: 0,
    pendingCount: 0
  });

  // Manual payment modal state
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [manualForm, setManualForm] = useState({
    userId: '',
    orderId: '',
    amount: '',
    paymentMethod: 'NEFT / RTGS Bank Transfer',
    status: 'successful',
    transactionReference: '',
    paymentType: 'manual_settlement',
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
        amount: '',
        paymentMethod: 'NEFT / RTGS Bank Transfer',
        status: 'successful',
        transactionReference: '',
        paymentType: 'manual_settlement',
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
    return company.includes(q) || email.includes(q) || phone.includes(q) || ref.includes(q) || id.includes(q);
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
            Real-time tracking of buyer payments, escrow advances, dock settlements, and transaction statuses.
          </p>
        </div>

        <div className="flex items-center gap-3">
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Successful Payments */}
        <div className="bg-gradient-to-br from-emerald-500 to-green-700 text-white rounded-3xl p-6 shadow-lg shadow-emerald-500/10 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-emerald-100 text-xs font-bold uppercase tracking-wider">Total Volume Paid</div>
              <div className="text-3xl font-black mt-1">
                ₹{(metrics?.totalSuccessfulVolume ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
            </div>
            <span className="p-2.5 rounded-2xl bg-white/15 text-white text-xl">✅</span>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-emerald-100 font-medium">
            <span className="font-bold bg-white/20 px-2 py-0.5 rounded-full">{metrics?.successfulCount ?? 0}</span>
            <span>Successful transactions settled</span>
          </div>
        </div>

        {/* Failed Payments */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-rose-600 text-xs font-bold uppercase tracking-wider">Failed Transactions</div>
              <div className="text-3xl font-black text-slate-900 mt-1">
                ₹{(metrics?.totalFailedVolume ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
            </div>
            <span className="p-2.5 rounded-2xl bg-rose-50 text-rose-600 text-xl border border-rose-100">⚠️</span>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-rose-700 font-medium">
            <span className="font-bold bg-rose-100 px-2 py-0.5 rounded-full text-rose-800">{metrics?.failedCount ?? 0}</span>
            <span>Failed payments — requires sales follow-up</span>
          </div>
        </div>

        {/* Pending Settlements */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-amber-600 text-xs font-bold uppercase tracking-wider">Pending / In-Flight</div>
              <div className="text-3xl font-black text-slate-900 mt-1">
                ₹{(metrics?.totalPendingVolume ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
            </div>
            <span className="p-2.5 rounded-2xl bg-amber-50 text-amber-600 text-xl border border-amber-100">⏳</span>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-amber-700 font-medium">
            <span className="font-bold bg-amber-100 px-2 py-0.5 rounded-full text-amber-800">{metrics?.pendingCount ?? 0}</span>
            <span>Awaiting escrow or webhook clearance</span>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Filters & Search */}
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-2xl">
            {[
              { id: 'all', label: 'All Payments' },
              { id: 'successful', label: 'Successful', color: 'text-emerald-700' },
              { id: 'failed', label: 'Failed', color: 'text-rose-700' },
              { id: 'pending', label: 'Pending', color: 'text-amber-700' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
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
              placeholder="Search by buyer, phone, ref..."
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
                <th className="py-4 px-5">Buyer / Payer</th>
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
                    Loading payments...
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-500">
                    <div className="text-3xl mb-2">💳</div>
                    <div className="font-bold text-slate-800">No payment records found</div>
                    <div className="text-xs text-slate-400 mt-1">
                      Transactions will automatically appear as buyers make payments or when recorded manually.
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => {
                  const buyer = p.users;
                  const rawPhone = buyer?.whatsapp_number || buyer?.corporate_phone || '';
                  const cleanPhone = rawPhone.replace(/[^0-9]/g, '');

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
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

                      {/* Buyer Details */}
                      <td className="py-4 px-5">
                        {buyer ? (
                          <div>
                            <div className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                              <span>{buyer.company_name || 'Individual Buyer'}</span>
                              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-mono">
                                {buyer.display_id || buyer.id.substring(0, 8)}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500">{buyer.registered_email}</div>
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
                            <span className="text-slate-400 italic text-xs">Guest / Direct Pay</span>
                            <div className="text-[10px] text-slate-400 font-mono">ID: {p.user_id ? p.user_id.substring(0, 8) : 'N/A'}</div>
                          </div>
                        )}
                      </td>

                      {/* Payment Type */}
                      <td className="py-4 px-5">
                        <span className="font-bold text-slate-800 text-xs">
                          {formatPaymentType(p.payment_type)}
                        </span>
                        {p.order_id && (
                          <div className="text-[11px] text-brand-600 font-mono mt-0.5">
                            Order #{p.order_id.substring(0, 8)}
                          </div>
                        )}
                      </td>

                      {/* Method & Ref */}
                      <td className="py-4 px-5">
                        <div className="font-semibold text-slate-700 text-xs">{p.payment_method || 'Razorpay'}</div>
                        <div className="text-[10px] text-slate-400 font-mono truncate max-w-[140px]" title={p.transaction_reference}>
                          {p.transaction_reference || 'N/A'}
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        <span className="text-sm font-black text-slate-900">
                          ₹{Number(p.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-5 text-center whitespace-nowrap">
                        {getStatusBadge(p.status, p.failure_reason)}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        {buyer ? (
                          <button
                            type="button"
                            onClick={() => {
                              setOutreachUser(buyer);
                              setOutreachOpen(true);
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 flex items-center gap-1 ml-auto ${
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
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Amount in INR (₹) *
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 50000"
                  value={manualForm.amount}
                  onChange={(e) => setManualForm({ ...manualForm, amount: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

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
                  placeholder="e.g. Verified by Accounts Dept against HDFC current account statement"
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
