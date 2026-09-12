"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function AdminSuppliersPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    async function fetchSuppliers() {
      try {
        const res = await fetch('/api/admin/export-suppliers');
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to fetch suppliers');
        }
        const data = await res.json();
        setSuppliers(data.suppliers || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    if (user) {
      fetchSuppliers();
    }
  }, [user]);

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/admin/export-suppliers?format=csv');
      if (!res.ok) throw new Error('Export failed');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `B2B_India_Suppliers_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to export: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  const filtered = suppliers.filter(s => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.company_name?.toLowerCase().includes(q) ||
      s.corporate_phone?.includes(q) ||
      s.registered_email?.toLowerCase().includes(q) ||
      s.city?.toLowerCase().includes(q) ||
      s.state?.toLowerCase().includes(q) ||
      s.gst_number?.toLowerCase().includes(q)
    );
  });

  if (authLoading || !user) {
    return (
      <main className="flex-1 pt-24 pb-16 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 pt-24 pb-16 bg-gray-50 min-h-screen">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 flex items-center gap-3">
                  <span className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center text-lg">🏭</span>
                  Registered Suppliers Directory
                </h1>
                <p className="text-sm text-gray-500 mt-1 ml-[52px]">
                  Admin view — {suppliers.length} suppliers registered on B2B India
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Link 
                  href="/dashboard" 
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors"
                >
                  ← Dashboard
                </Link>
                <button
                  onClick={handleExportCSV}
                  disabled={exporting || suppliers.length === 0}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all hover:scale-[1.01] text-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {exporting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>📥 Download Excel (CSV)</>
                  )}
                </button>
              </div>
            </div>
          </motion.div>

          {/* Search Bar */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <span className="absolute left-4 top-3 text-gray-400">🔍</span>
              <input
                type="text"
                placeholder="Search by company name, phone, email, city, GST..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>
            <div className="text-sm text-gray-500 flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl font-medium whitespace-nowrap">
              Showing: <span className="font-bold text-slate-900">{filtered.length}</span> of {suppliers.length}
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-2xl text-sm font-semibold border border-red-100 mb-6 flex items-center gap-2">
              ⚠️ {error}
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="bg-white p-16 rounded-2xl text-center border border-gray-100">
              <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-500 text-sm">Loading supplier directory...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white p-16 rounded-2xl text-center border border-gray-100">
              <div className="text-5xl mb-4">📭</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Suppliers Found</h3>
              <p className="text-sm text-gray-500">
                {searchQuery ? 'Try a different search query.' : 'No suppliers have registered yet.'}
              </p>
            </div>
          ) : (
            /* Supplier Table */
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="bg-slate-900 text-white text-xs uppercase tracking-wider">
                      <th className="px-4 py-4 font-bold">#</th>
                      <th className="px-4 py-4 font-bold whitespace-nowrap">Company Name</th>
                      <th className="px-4 py-4 font-bold whitespace-nowrap">📞 Phone</th>
                      <th className="px-4 py-4 font-bold whitespace-nowrap">📱 WhatsApp</th>
                      <th className="px-4 py-4 font-bold whitespace-nowrap">📧 Email</th>
                      <th className="px-4 py-4 font-bold whitespace-nowrap">GST Number</th>
                      <th className="px-4 py-4 font-bold whitespace-nowrap">📍 City</th>
                      <th className="px-4 py-4 font-bold whitespace-nowrap">State</th>
                      <th className="px-4 py-4 font-bold whitespace-nowrap">Pincode</th>
                      <th className="px-4 py-4 font-bold whitespace-nowrap">Status</th>
                      <th className="px-4 py-4 font-bold whitespace-nowrap">Registered</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtered.map((s, idx) => {
                      const statusColor = s.status === 'verified' 
                        ? 'bg-emerald-100 text-emerald-700'
                        : s.status === 'rejected' 
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700';
                      
                      return (
                        <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3.5 text-gray-400 font-mono text-xs">{idx + 1}</td>
                          <td className="px-4 py-3.5">
                            <div className="font-bold text-gray-900 whitespace-nowrap">{s.company_name || '-'}</div>
                            {s.display_id && <div className="text-[10px] text-gray-400 font-mono mt-0.5">{s.display_id}</div>}
                          </td>
                          <td className="px-4 py-3.5">
                            <a href={`tel:${s.corporate_phone}`} className="font-semibold text-brand-600 hover:text-brand-800 whitespace-nowrap">
                              {s.corporate_phone || '-'}
                            </a>
                          </td>
                          <td className="px-4 py-3.5">
                            {s.whatsapp_number ? (
                              <a 
                                href={`https://wa.me/${s.whatsapp_number.replace(/[^0-9]/g, '')}`} 
                                target="_blank"
                                className="font-semibold text-emerald-600 hover:text-emerald-800 whitespace-nowrap"
                              >
                                {s.whatsapp_number}
                              </a>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5">
                            <a href={`mailto:${s.registered_email}`} className="text-gray-700 hover:text-brand-600 whitespace-nowrap">
                              {s.registered_email || '-'}
                            </a>
                          </td>
                          <td className="px-4 py-3.5 font-mono text-xs text-gray-600 whitespace-nowrap">{s.gst_number || '-'}</td>
                          <td className="px-4 py-3.5 whitespace-nowrap text-gray-700 font-medium">{s.city || '-'}</td>
                          <td className="px-4 py-3.5 whitespace-nowrap text-gray-600">{s.state || '-'}</td>
                          <td className="px-4 py-3.5 whitespace-nowrap text-gray-500 font-mono text-xs">{s.pincode || '-'}</td>
                          <td className="px-4 py-3.5">
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider whitespace-nowrap ${statusColor}`}>
                              {s.status?.replace(/_/g, ' ') || 'pending'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap text-gray-500 text-xs">
                            {s.created_at ? new Date(s.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Footer Note */}
          <div className="mt-6 text-center text-xs text-gray-400">
            Data exported from B2B India platform registered suppliers only. Confidential — Admin use only.
          </div>

        </div>
      </main>
    </>
  );
}
