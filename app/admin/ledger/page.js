'use client';

import React, { useState, useEffect } from 'react';

export default function AdminLedger() {
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLedger();
  }, []);

  const fetchLedger = async () => {
    try {
      const res = await fetch('/api/admin/ledger');
      const data = await res.json();
      if (Array.isArray(data)) {
        setLedger(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getEntryTypeColor = (type) => {
    switch (type) {
      case 'platform_commission': return 'bg-purple-100 text-purple-700';
      case 'advance_10_percent': return 'bg-blue-100 text-blue-700';
      case 'dock_final_90_percent': return 'bg-indigo-100 text-indigo-700';
      case 'supplier_payout': return 'bg-emerald-100 text-emerald-700';
      case 'refund_buyer': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const formatEntryType = (type) => {
    if (!type) return 'Unknown';
    return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  // Calculate totals
  const totalCommission = ledger.filter(l => l.entry_type === 'platform_commission').reduce((sum, l) => sum + Number(l.amount), 0);
  const totalProcessed = ledger.filter(l => ['advance_10_percent', 'dock_final_90_percent'].includes(l.entry_type)).reduce((sum, l) => sum + Number(l.amount), 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Platform Financial Ledger</h1>
          <p className="text-slate-500 mt-1">Immutable audit trail of all capital movements and commissions.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-slate-500 text-sm font-medium mb-1">Total Volume Processed</h3>
          <div className="text-3xl font-extrabold text-slate-900">₹{totalProcessed.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
          <p className="text-xs text-emerald-600 mt-2 font-medium flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
            Live from Postgres
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-slate-500 text-sm font-medium mb-1">Total Platform Commission</h3>
          <div className="text-3xl font-extrabold text-purple-600">₹{totalCommission.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
          <p className="text-xs text-purple-600 mt-2 font-medium bg-purple-50 inline-block px-2 py-0.5 rounded-full">
            Realized Revenue
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-slate-500 text-sm font-medium mb-1">Total Transactions</h3>
          <div className="text-3xl font-extrabold text-slate-900">{ledger.length}</div>
          <p className="text-xs text-slate-400 mt-2">Recorded movements</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date & Time</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Entry Type</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">From</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">To</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Amount</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ledger.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50 transition-colors text-sm">
                  <td className="p-4 text-slate-500 whitespace-nowrap">
                    {new Date(entry.created_at).toLocaleString('en-IN', {
                      dateStyle: 'medium', timeStyle: 'short'
                    })}
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full uppercase tracking-wider ${getEntryTypeColor(entry.entry_type)}`}>
                      {formatEntryType(entry.entry_type)}
                    </span>
                    <div className="text-xs text-slate-400 mt-1 line-clamp-1 max-w-[200px]" title={entry.description}>
                      {entry.description}
                    </div>
                  </td>
                  <td className="p-4">
                    {entry.from_entity ? (
                      <div>
                        <div className="font-medium text-slate-900">{entry.from_entity.company_name}</div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider">{entry.from_entity.role}</div>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">B2B India Platform</span>
                    )}
                  </td>
                  <td className="p-4">
                    {entry.to_entity ? (
                      <div>
                        <div className="font-medium text-slate-900">{entry.to_entity.company_name}</div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider">{entry.to_entity.role}</div>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">B2B India Platform</span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <span className={`font-bold ${entry.entry_type === 'platform_commission' ? 'text-purple-600' : 'text-slate-900'}`}>
                      ₹{Number(entry.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </td>
                  <td className="p-4 text-right text-slate-500 font-mono text-xs">
                    {entry.payment_reference ? entry.payment_reference.substring(0, 12) + '...' : '-'}
                  </td>
                </tr>
              ))}
              {ledger.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-slate-500">
                    No ledger entries found. Transactions will appear here as orders progress.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
