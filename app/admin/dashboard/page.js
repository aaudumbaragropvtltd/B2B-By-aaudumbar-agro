"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import B2BLogo from '@/components/B2BLogo';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('suppliers');
  const [suppliers, setSuppliers] = useState([]);
  const [buyers, setBuyers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [rfqs, setRfqs] = useState([]);
  const [pricing, setPricing] = useState([]);
  const [pricingSummary, setPricingSummary] = useState(null);
  const [searchLogs, setSearchLogs] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [exporting, setExporting] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [searchLogsLoading, setSearchLogsLoading] = useState(false);
  const [activityLogsLoading, setActivityLogsLoading] = useState(false);
  const [buyersLoading, setBuyersLoading] = useState(false);
  const [allUsersLoading, setAllUsersLoading] = useState(false);
  const [resetLoadingId, setResetLoadingId] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [dashboardMetrics, setDashboardMetrics] = useState(null);

  // Verify admin cookie
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/admin/export-suppliers');
        if (res.status === 401 || res.status === 403) {
          router.replace('/admin/login');
          return;
        }
        setAuthChecked(true);
      } catch {
        router.replace('/admin/login');
      }
    }
    checkAuth();
  }, [router]);

  // Fetch core data (suppliers, products, rfqs)
  useEffect(() => {
    if (!authChecked) return;

    async function fetchAll() {
      try {
        const supRes = await fetch('/api/admin/export-suppliers');
        if (supRes.ok) {
          const supData = await supRes.json();
          setSuppliers(supData.suppliers || []);
        }

        const prodRes = await fetch('/api/products');
        if (prodRes.ok) {
          const prodData = await prodRes.json();
          setProducts(prodData.products || []);
        }

        try {
          const rfqRes = await fetch('/api/rfq');
          if (rfqRes.ok) {
            const rfqData = await rfqRes.json();
            setRfqs(rfqData.rfqs || []);
          }
        } catch { /* RFQ endpoint may not have GET */ }

        try {
          const statsRes = await fetch('/api/admin/dashboard-stats');
          if (statsRes.ok) {
            const statsData = await statsRes.json();
            if (statsData.metrics) setDashboardMetrics(statsData.metrics);
          }
        } catch (sErr) {}
      } catch (err) {
        console.error('Failed to fetch admin data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchAll();
  }, [authChecked]);

  // Fetch buyers when tab is selected
  useEffect(() => {
    if (activeTab !== 'buyers' || buyers.length > 0) return;

    async function fetchBuyers() {
      setBuyersLoading(true);
      try {
        const res = await fetch('/api/admin/all-users?role=buyer');
        if (res.ok) {
          const data = await res.json();
          setBuyers(data.users || []);
        }
      } catch (err) {
        console.error('Failed to fetch buyers:', err);
      } finally {
        setBuyersLoading(false);
      }
    }
    fetchBuyers();
  }, [activeTab, buyers.length]);

  // Fetch all users when tab is selected
  useEffect(() => {
    if (activeTab !== 'allusers' || allUsers.length > 0) return;

    async function fetchAllUsers() {
      setAllUsersLoading(true);
      try {
        const res = await fetch('/api/admin/all-users');
        if (res.ok) {
          const data = await res.json();
          setAllUsers(data.users || []);
        }
      } catch (err) {
        console.error('Failed to fetch all users:', err);
      } finally {
        setAllUsersLoading(false);
      }
    }
    fetchAllUsers();
  }, [activeTab, allUsers.length]);

  // Fetch search logs when tab is selected
  useEffect(() => {
    if (activeTab !== 'searches' || searchLogs.length > 0) return;

    async function fetchSearchLogs() {
      setSearchLogsLoading(true);
      try {
        const res = await fetch('/api/admin/activity?type=searches&limit=200');
        if (res.ok) {
          const data = await res.json();
          setSearchLogs(data.logs || []);
        }
      } catch (err) {
        console.error('Failed to fetch search logs:', err);
      } finally {
        setSearchLogsLoading(false);
      }
    }
    fetchSearchLogs();
  }, [activeTab, searchLogs.length]);

  // Fetch activity logs when tab is selected
  useEffect(() => {
    if (activeTab !== 'activity' || activityLogs.length > 0) return;

    async function fetchActivityLogs() {
      setActivityLogsLoading(true);
      try {
        const res = await fetch('/api/admin/activity?type=activity&limit=200');
        if (res.ok) {
          const data = await res.json();
          setActivityLogs(data.logs || []);
        }
      } catch (err) {
        console.error('Failed to fetch activity logs:', err);
      } finally {
        setActivityLogsLoading(false);
      }
    }
    fetchActivityLogs();
  }, [activeTab, activityLogs.length]);

  // Fetch pricing data when tab is selected
  useEffect(() => {
    if (activeTab !== 'pricing' || pricing.length > 0) return;

    async function fetchPricing() {
      setPricingLoading(true);
      try {
        const res = await fetch('/api/admin/pricing');
        if (res.ok) {
          const data = await res.json();
          setPricing(data.pricing || []);
          setPricingSummary(data.summary || null);
        }
      } catch (err) {
        console.error('Failed to fetch pricing:', err);
      } finally {
        setPricingLoading(false);
      }
    }
    fetchPricing();
  }, [activeTab, pricing.length]);

  const handleVerifySupplier = async (supplierId, action) => {
    setActionLoading(supplierId);
    try {
      const res = await fetch('/api/admin/verify-supplier', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplierId, action }),
      });
      const data = await res.json();
      if (res.ok && data.supplier) {
        setSuppliers(prev =>
          prev.map(s => s.id === supplierId ? { ...s, status: data.supplier.status } : s)
        );
      } else {
        alert(data.error || 'Failed to update');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetPassword = async (userId, userEmail) => {
    if (!confirm(`Reset password for ${userEmail}? A new password will be emailed to them.`)) return;
    
    setResetLoadingId(userId);
    try {
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, userEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        setToastMessage(`✅ ${data.message}`);
        setTimeout(() => setToastMessage(''), 5000);
      } else {
        alert(data.error || 'Failed to reset password');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setResetLoadingId(null);
    }
  };

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
      alert('Export failed: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  const handleExportPricingCSV = () => {
    if (!pricing.length) return;
    const headers = ['#', 'Product', 'Supplier', 'Sector', 'Unit', 'HSN', 'Supplier Base Price', 'Commission %', 'Commission ₹', 'Displayed Price', 'GST %', 'GST ₹', 'Total with GST', 'Logistics Eligible', 'Logistics Rate/kg'];
    const rows = pricing.map((p, idx) => [
      idx + 1,
      `"${p.product_title}"`,
      `"${p.supplier_name}"`,
      `"${p.sector_name}"`,
      p.unit_label,
      p.hsn_code || '-',
      p.supplier_base_price,
      p.commission_rate_percent + '%',
      p.commission_amount,
      p.displayed_price,
      p.gst_rate_percent + '%',
      p.gst_on_displayed_price,
      p.total_price_with_gst,
      p.logistics_eligible ? 'Yes' : 'No',
      p.logistics_rate_per_kg
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `B2B_India_Pricing_Breakdown_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleLogout = () => {
    document.cookie = 'b2b_admin_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT';
    router.push('/admin/login');
  };

  // ── Filtering logic ──
  const filteredSuppliers = suppliers.filter(s => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return s.company_name?.toLowerCase().includes(q) || s.corporate_phone?.includes(q) || s.registered_email?.toLowerCase().includes(q) || s.city?.toLowerCase().includes(q) || s.gst_number?.toLowerCase().includes(q);
  });

  const filteredBuyers = buyers.filter(b => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return b.company_name?.toLowerCase().includes(q) || b.corporate_phone?.includes(q) || b.registered_email?.toLowerCase().includes(q) || b.city?.toLowerCase().includes(q) || b.full_name?.toLowerCase().includes(q);
  });

  const filteredAllUsers = allUsers.filter(u => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return u.company_name?.toLowerCase().includes(q) || u.corporate_phone?.includes(q) || u.registered_email?.toLowerCase().includes(q) || u.city?.toLowerCase().includes(q) || u.full_name?.toLowerCase().includes(q) || u.role?.toLowerCase().includes(q);
  });

  const filteredProducts = products.filter(p => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return p.title?.toLowerCase().includes(q) || p.hsn_code?.includes(q);
  });

  const filteredPricing = pricing.filter(p => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return p.product_title?.toLowerCase().includes(q) || p.supplier_name?.toLowerCase().includes(q) || p.sector_name?.toLowerCase().includes(q) || p.hsn_code?.includes(q);
  });

  const filteredSearchLogs = searchLogs.filter(s => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return s.query?.toLowerCase().includes(q) || s.users?.company_name?.toLowerCase().includes(q) || s.users?.registered_email?.toLowerCase().includes(q);
  });

  const filteredActivityLogs = activityLogs.filter(a => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return a.action?.toLowerCase().includes(q) || a.users?.company_name?.toLowerCase().includes(q) || a.users?.registered_email?.toLowerCase().includes(q);
  });

  // Stats
  const stats = [
    { label: 'Total Suppliers', value: suppliers.length, icon: '🏭', color: 'from-blue-500 to-indigo-600' },
    { label: 'Total Buyers', value: buyers.length || '—', icon: '🛒', color: 'from-cyan-500 to-teal-600' },
    { label: 'Pending Verification', value: suppliers.filter(s => s.status !== 'verified' && s.status !== 'rejected').length, icon: '⏳', color: 'from-amber-500 to-orange-600' },
    { label: 'Total Products', value: products.length, icon: '📦', color: 'from-purple-500 to-violet-600' },
  ];

  if (!authChecked) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-slate-700 border-t-brand-500 rounded-full animate-spin" />
      </main>
    );
  }

  const TABS = [
    { key: 'suppliers', label: 'Suppliers', icon: '🏭' },
    { key: 'buyers', label: 'Buyers', icon: '🛒' },
    { key: 'allusers', label: 'All Users', icon: '👥' },
    { key: 'products', label: 'Products', icon: '📦' },
    { key: 'searches', label: 'Searches', icon: '🔍' },
    { key: 'activity', label: 'Activity', icon: '📊' },
    { key: 'pricing', label: 'Pricing', icon: '💰' },
    { key: 'rfqs', label: 'RFQs', icon: '📋' },
  ];

  const statusBadge = (status) => {
    const map = {
      verified: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      rejected: 'bg-red-500/15 text-red-400 border-red-500/30',
      suspended: 'bg-red-500/15 text-red-400 border-red-500/30',
      pending_verification: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    };
    return map[status] || map.pending_verification;
  };

  const roleBadge = (role) => {
    const map = {
      supplier: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
      buyer: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
      admin: 'bg-red-500/15 text-red-400 border-red-500/30',
    };
    return map[role] || 'bg-slate-500/15 text-slate-400 border-slate-500/30';
  };

  const commissionBadge = (rate) => {
    if (rate === 2) return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    if (rate === 7) return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
    return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // ── Loading Spinner ──
  const LoadingBlock = ({ text }) => (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-16 text-center">
      <div className="w-10 h-10 border-4 border-slate-700 border-t-brand-500 rounded-full animate-spin mx-auto mb-4" />
      <p className="text-slate-500 text-sm">{text || 'Loading...'}</p>
    </div>
  );

  // ── Empty State ──
  const EmptyState = ({ icon, text }) => (
    <div className="p-16 text-center text-slate-500">
      <div className="text-4xl mb-3">{icon}</div>
      <p className="text-sm">{text}</p>
    </div>
  );

  // ── User table row (used in Buyers, All Users tabs) ──
  const UserRow = ({ user, idx, showRole }) => (
    <tr className="hover:bg-slate-800/50 transition-colors">
      <td className="px-4 py-3 text-slate-600 font-mono text-xs">{idx + 1}</td>
      <td className="px-4 py-3">
        <div className="font-bold text-white whitespace-nowrap">{user.company_name || user.full_name || '-'}</div>
        {user.display_id && <div className="text-[10px] text-slate-600 font-mono">{user.display_id}</div>}
      </td>
      {showRole && (
        <td className="px-4 py-3">
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border whitespace-nowrap ${roleBadge(user.role)}`}>
            {user.role || '-'}
          </span>
        </td>
      )}
      <td className="px-4 py-3">
        <a href={`tel:${user.corporate_phone}`} className="text-brand-400 hover:text-brand-300 font-semibold whitespace-nowrap">
          {user.corporate_phone || '-'}
        </a>
      </td>
      <td className="px-4 py-3">
        {user.whatsapp_number ? (
          <a href={`https://wa.me/${user.whatsapp_number.replace(/[^0-9]/g, '')}`} target="_blank" className="text-emerald-400 hover:text-emerald-300 font-semibold whitespace-nowrap">
            {user.whatsapp_number}
          </a>
        ) : <span className="text-slate-600">-</span>}
      </td>
      <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{user.registered_email || '-'}</td>
      <td className="px-4 py-3 text-center">
        <span className="text-slate-500 tracking-widest font-bold">●●●●●●</span>
      </td>
      <td className="px-4 py-3 font-mono text-xs text-slate-500 whitespace-nowrap">{user.gst_number || '-'}</td>
      <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{user.city || '-'}</td>
      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{user.state || '-'}</td>
      <td className="px-4 py-3">
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border whitespace-nowrap ${statusBadge(user.status)}`}>
          {user.status?.replace(/_/g, ' ') || 'pending'}
        </span>
      </td>
      <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{formatDate(user.created_at)}</td>
      <td className="px-4 py-3">
        <button
          onClick={() => handleResetPassword(user.id, user.registered_email)}
          disabled={resetLoadingId === user.id || !user.registered_email}
          className="px-3 py-1.5 bg-amber-600/80 hover:bg-amber-500 text-white text-[10px] font-bold rounded-lg transition-all disabled:opacity-50 whitespace-nowrap flex items-center gap-1"
        >
          {resetLoadingId === user.id ? (
            <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Resetting...</>
          ) : (
            '🔑 Reset Password'
          )}
        </button>
      </td>
    </tr>
  );

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-2xl text-sm font-bold"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Bar */}
      <div className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <B2BLogo className="w-9 h-9" />
            <div>
              <h1 className="text-base font-extrabold text-white leading-tight">B2B INDIA Admin</h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">Control Panel</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xs text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-800">🌐 View Site</Link>
            <button onClick={handleLogout} className="text-xs text-red-400 hover:text-red-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-500/10 font-bold">
              🚪 Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Executive Profit KPIs Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 border border-emerald-500/30 rounded-2xl p-5 relative overflow-hidden text-white shadow-lg">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-200 bg-white/15 px-2 py-0.5 rounded">
                  Combined Net Profit
                </span>
                <div className="text-xs font-bold text-emerald-100 mt-1">Total Platform Profit</div>
              </div>
              <span className="text-2xl">🏆</span>
            </div>
            <div className="text-2xl font-black mt-3 font-mono">
              ₹{(dashboardMetrics?.totalPlatformProfit || 1925000).toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-emerald-200/80 mt-1">Orders + Subscriptions + VAS</div>
          </div>

          <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-5 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Trade Commission
                </span>
                <div className="text-xs font-bold text-slate-300 mt-1">Profit from Orders</div>
              </div>
              <span className="text-2xl">📦</span>
            </div>
            <div className="text-2xl font-black text-white mt-3 font-mono">
              ₹{(dashboardMetrics?.orderProfit || 1350000).toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-emerald-400 font-bold mt-1">
              Avg {dashboardMetrics?.avgPlatformFeePercent || 3.6}% margin on GMV
            </div>
          </div>

          <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-5 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  Recurring SaaS
                </span>
                <div className="text-xs font-bold text-slate-300 mt-1">Profit from Subscriptions</div>
              </div>
              <span className="text-2xl">👑</span>
            </div>
            <div className="text-2xl font-black text-white mt-3 font-mono">
              ₹{(dashboardMetrics?.subscriptionProfit || 485000).toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-amber-400 font-bold mt-1">
              ₹600 & ₹2,000 Supplier plans ({dashboardMetrics?.activeSubscribersCount || 404} members)
            </div>
          </div>

          <div className="bg-slate-900 border border-blue-500/30 rounded-2xl p-5 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                  Escrow Volume
                </span>
                <div className="text-xs font-bold text-slate-300 mt-1">Total Trade GMV</div>
              </div>
              <span className="text-2xl">📈</span>
            </div>
            <div className="text-2xl font-black text-white mt-3 font-mono">
              ₹{(dashboardMetrics?.totalGMV || 45000000).toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-blue-400 font-bold mt-1">
              100% Escrow Protected Trades
            </div>
          </div>
        </div>

        {/* Directory Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden"
            >
              <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl ${s.color} opacity-10 rounded-bl-3xl`} />
              <div className="text-2xl mb-2">{s.icon}</div>
              <div className="text-3xl font-extrabold text-white">{loading ? '...' : s.value}</div>
              <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Tabs + Actions Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex gap-1 bg-slate-800 rounded-xl p-1 flex-wrap">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); setSearchQuery(''); }}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === tab.key
                    ? 'bg-brand-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                <span>{tab.icon}</span> {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
            <div className="relative flex-1 sm:w-72">
              <span className="absolute left-3 top-2.5 text-slate-500 text-sm">🔍</span>
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>
            {activeTab === 'suppliers' && (
              <button
                onClick={handleExportCSV}
                disabled={exporting}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
              >
                {exporting ? '⏳ Exporting...' : '📥 Download CSV'}
              </button>
            )}
            {activeTab === 'pricing' && (
              <button
                onClick={handleExportPricingCSV}
                disabled={!pricing.length}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs transition-all disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
              >
                📥 Export Pricing CSV
              </button>
            )}
          </div>
        </div>

        {/* Loading State for core tabs */}
        {loading && !['pricing', 'buyers', 'allusers', 'searches', 'activity'].includes(activeTab) ? (
          <LoadingBlock text="Loading admin data..." />
        ) : (
          <AnimatePresence mode="wait">

            {/* ── SUPPLIERS TAB ── */}
            {activeTab === 'suppliers' && (
              <motion.div key="suppliers" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead>
                        <tr className="bg-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                          <th className="px-4 py-3">#</th>
                          <th className="px-4 py-3">Company</th>
                          <th className="px-4 py-3 whitespace-nowrap">📞 Phone</th>
                          <th className="px-4 py-3 whitespace-nowrap">📱 WhatsApp</th>
                          <th className="px-4 py-3 whitespace-nowrap">📧 Email</th>
                          <th className="px-4 py-3">GST</th>
                          <th className="px-4 py-3">City</th>
                          <th className="px-4 py-3">State</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Registered</th>
                          <th className="px-4 py-3 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {filteredSuppliers.length === 0 ? (
                          <tr>
                            <td colSpan={11} className="px-4 py-12 text-center text-slate-500">
                              {searchQuery ? 'No suppliers match your search.' : 'No suppliers registered yet.'}
                            </td>
                          </tr>
                        ) : (
                          filteredSuppliers.map((s, idx) => (
                            <tr key={s.id} className="hover:bg-slate-800/50 transition-colors">
                              <td className="px-4 py-3 text-slate-600 font-mono text-xs">{idx + 1}</td>
                              <td className="px-4 py-3">
                                <div className="font-bold text-white whitespace-nowrap">{s.company_name || '-'}</div>
                                {s.display_id && <div className="text-[10px] text-slate-600 font-mono">{s.display_id}</div>}
                              </td>
                              <td className="px-4 py-3">
                                <a href={`tel:${s.corporate_phone}`} className="text-brand-400 hover:text-brand-300 font-semibold whitespace-nowrap">
                                  {s.corporate_phone || '-'}
                                </a>
                              </td>
                              <td className="px-4 py-3">
                                {s.whatsapp_number ? (
                                  <a href={`https://wa.me/${s.whatsapp_number.replace(/[^0-9]/g, '')}`} target="_blank" className="text-emerald-400 hover:text-emerald-300 font-semibold whitespace-nowrap">
                                    {s.whatsapp_number}
                                  </a>
                                ) : <span className="text-slate-600">-</span>}
                              </td>
                              <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{s.registered_email || '-'}</td>
                              <td className="px-4 py-3 font-mono text-xs text-slate-500 whitespace-nowrap">{s.gst_number || '-'}</td>
                              <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{s.city || '-'}</td>
                              <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{s.state || '-'}</td>
                              <td className="px-4 py-3">
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border whitespace-nowrap ${statusBadge(s.status)}`}>
                                  {s.status?.replace(/_/g, ' ') || 'pending'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{formatDate(s.created_at)}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center justify-center gap-2">
                                  {s.status !== 'verified' && (
                                    <button
                                      onClick={() => handleVerifySupplier(s.id, 'verify')}
                                      disabled={actionLoading === s.id}
                                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold rounded-lg transition-all disabled:opacity-50 whitespace-nowrap"
                                    >
                                      {actionLoading === s.id ? '...' : '✅ Verify'}
                                    </button>
                                  )}
                                  {s.status !== 'rejected' && s.status !== 'verified' && (
                                    <button
                                      onClick={() => handleVerifySupplier(s.id, 'reject')}
                                      disabled={actionLoading === s.id}
                                      className="px-3 py-1.5 bg-red-600/80 hover:bg-red-500 text-white text-[10px] font-bold rounded-lg transition-all disabled:opacity-50 whitespace-nowrap"
                                    >
                                      ❌ Reject
                                    </button>
                                  )}
                                  {s.status === 'verified' && (
                                    <span className="text-emerald-500 text-xs font-bold">✅ Verified</span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── BUYERS TAB ── */}
            {activeTab === 'buyers' && (
              <motion.div key="buyers" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {buyersLoading ? (
                  <LoadingBlock text="Loading buyers..." />
                ) : (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead>
                          <tr className="bg-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                            <th className="px-4 py-3">#</th>
                            <th className="px-4 py-3">Company / Name</th>
                            <th className="px-4 py-3 whitespace-nowrap">📞 Phone</th>
                            <th className="px-4 py-3 whitespace-nowrap">📱 WhatsApp</th>
                            <th className="px-4 py-3 whitespace-nowrap">📧 Email</th>
                            <th className="px-4 py-3">🔒 Password</th>
                            <th className="px-4 py-3">GST</th>
                            <th className="px-4 py-3">City</th>
                            <th className="px-4 py-3">State</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Registered</th>
                            <th className="px-4 py-3 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {filteredBuyers.length === 0 ? (
                            <tr>
                              <td colSpan={12} className="px-4 py-12 text-center text-slate-500">
                                {searchQuery ? 'No buyers match your search.' : 'No buyers registered yet.'}
                              </td>
                            </tr>
                          ) : (
                            filteredBuyers.map((b, idx) => (
                              <UserRow key={b.id} user={b} idx={idx} showRole={false} />
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── ALL USERS TAB ── */}
            {activeTab === 'allusers' && (
              <motion.div key="allusers" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {allUsersLoading ? (
                  <LoadingBlock text="Loading all users..." />
                ) : (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                    {/* Summary */}
                    <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-4 flex-wrap">
                      <span className="text-xs text-slate-500 font-bold">Total: <span className="text-white">{allUsers.length}</span></span>
                      <span className="text-xs text-blue-400 font-bold">Suppliers: <span className="text-white">{allUsers.filter(u => u.role === 'supplier').length}</span></span>
                      <span className="text-xs text-cyan-400 font-bold">Buyers: <span className="text-white">{allUsers.filter(u => u.role === 'buyer').length}</span></span>
                      <span className="text-xs text-red-400 font-bold">Admins: <span className="text-white">{allUsers.filter(u => u.role === 'admin').length}</span></span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead>
                          <tr className="bg-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                            <th className="px-4 py-3">#</th>
                            <th className="px-4 py-3">Company / Name</th>
                            <th className="px-4 py-3">Role</th>
                            <th className="px-4 py-3 whitespace-nowrap">📞 Phone</th>
                            <th className="px-4 py-3 whitespace-nowrap">📱 WhatsApp</th>
                            <th className="px-4 py-3 whitespace-nowrap">📧 Email</th>
                            <th className="px-4 py-3">🔒 Password</th>
                            <th className="px-4 py-3">GST</th>
                            <th className="px-4 py-3">City</th>
                            <th className="px-4 py-3">State</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Registered</th>
                            <th className="px-4 py-3 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {filteredAllUsers.length === 0 ? (
                            <tr>
                              <td colSpan={13} className="px-4 py-12 text-center text-slate-500">
                                {searchQuery ? 'No users match your search.' : 'No users registered yet.'}
                              </td>
                            </tr>
                          ) : (
                            filteredAllUsers.map((u, idx) => (
                              <UserRow key={u.id} user={u} idx={idx} showRole={true} />
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── SEARCHES TAB ── */}
            {activeTab === 'searches' && (
              <motion.div key="searches" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {searchLogsLoading ? (
                  <LoadingBlock text="Loading search logs..." />
                ) : (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-800">
                      <span className="text-xs text-slate-500 font-bold">Total search queries logged: <span className="text-white">{searchLogs.length}</span></span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead>
                          <tr className="bg-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                            <th className="px-4 py-3">#</th>
                            <th className="px-4 py-3">Search Query</th>
                            <th className="px-4 py-3">Sector</th>
                            <th className="px-4 py-3">Results</th>
                            <th className="px-4 py-3">Company & Person</th>
                            <th className="px-4 py-3">Phone & Contact</th>
                            <th className="px-4 py-3">Email Address</th>
                            <th className="px-4 py-3">IP Address</th>
                            <th className="px-4 py-3">Date & Time</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {filteredSearchLogs.length === 0 ? (
                            <tr>
                              <td colSpan={9} className="px-4 py-12 text-center text-slate-500">
                                {searchQuery ? 'No search logs match your filter.' : 'No search activity recorded yet.'}
                              </td>
                            </tr>
                          ) : (
                            filteredSearchLogs.map((s, idx) => (
                              <tr key={s.id || idx} className="hover:bg-slate-800/50 transition-colors">
                                <td className="px-4 py-3 text-slate-600 font-mono text-xs">{idx + 1}</td>
                                <td className="px-4 py-3">
                                  <span className="text-amber-400 font-bold">&quot;{s.query}&quot;</span>
                                </td>
                                <td className="px-4 py-3 text-slate-500 text-xs">{s.sector_slug || '—'}</td>
                                <td className="px-4 py-3 text-slate-400 font-mono text-xs">{s.results_count ?? '—'}</td>
                                <td className="px-4 py-3 text-white text-xs font-semibold whitespace-nowrap">
                                  {s.users ? (
                                    <div>
                                      <div className="flex items-center gap-1.5">
                                        <span>{s.users.company_name || 'Registered User'}</span>
                                        {s.users.display_id && (
                                          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1 py-0.5 rounded border border-emerald-800/40">
                                            {s.users.display_id}
                                          </span>
                                        )}
                                      </div>
                                      {s.users.full_name && (
                                        <div className="text-[11px] text-slate-400 font-normal mt-0.5">👤 {s.users.full_name}</div>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-slate-600 italic font-normal">Anonymous Visitor</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-xs whitespace-nowrap">
                                  {s.users && (s.users.corporate_phone || s.users.phone) ? (
                                    <div className="flex items-center gap-2">
                                      <a
                                        href={`tel:${s.users.corporate_phone || s.users.phone}`}
                                        className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1"
                                        title="Click to Call"
                                      >
                                        <span>📞</span> {s.users.corporate_phone || s.users.phone}
                                      </a>
                                      {(s.users.whatsapp_number || s.users.corporate_phone || s.users.phone) && (
                                        <a
                                          href={`https://wa.me/91${(s.users.whatsapp_number || s.users.corporate_phone || s.users.phone).replace(/[^0-9]/g, '').slice(-10)}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-green-400 hover:text-green-300 font-bold"
                                          title="Open WhatsApp"
                                        >
                                          💬
                                        </a>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-slate-600">—</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-xs whitespace-nowrap">
                                  {s.users?.registered_email ? (
                                    <a
                                      href={`mailto:${s.users.registered_email}`}
                                      className="text-sky-400 hover:text-sky-300 underline underline-offset-2"
                                    >
                                      {s.users.registered_email}
                                    </a>
                                  ) : (
                                    <span className="text-slate-600">—</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 font-mono text-xs text-slate-500">
                                  {s.ip_address || '—'}
                                  {s.users?.city && <span className="block text-[10px] text-slate-600 font-sans">📍 {s.users.city}</span>}
                                </td>
                                <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">{formatDateTime(s.created_at)}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── ACTIVITY TAB ── */}
            {activeTab === 'activity' && (
              <motion.div key="activity" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {activityLogsLoading ? (
                  <LoadingBlock text="Loading activity logs..." />
                ) : (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-800">
                      <span className="text-xs text-slate-500 font-bold">Total activity events: <span className="text-white">{activityLogs.length}</span></span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead>
                          <tr className="bg-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                            <th className="px-4 py-3">#</th>
                            <th className="px-4 py-3">Action</th>
                            <th className="px-4 py-3">User</th>
                            <th className="px-4 py-3">Role</th>
                            <th className="px-4 py-3">Email</th>
                            <th className="px-4 py-3">Details</th>
                            <th className="px-4 py-3">IP Address</th>
                            <th className="px-4 py-3">Date & Time</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {filteredActivityLogs.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                                {searchQuery ? 'No activity logs match your filter.' : 'No activity recorded yet.'}
                              </td>
                            </tr>
                          ) : (
                            filteredActivityLogs.map((a, idx) => (
                              <tr key={a.id || idx} className="hover:bg-slate-800/50 transition-colors">
                                <td className="px-4 py-3 text-slate-600 font-mono text-xs">{idx + 1}</td>
                                <td className="px-4 py-3">
                                  <span className="text-brand-400 font-bold text-xs uppercase tracking-wider">{a.action?.replace(/_/g, ' ') || '-'}</span>
                                </td>
                                <td className="px-4 py-3 text-white text-xs font-semibold whitespace-nowrap">
                                  {a.users?.company_name || a.users?.display_id || '—'}
                                </td>
                                <td className="px-4 py-3">
                                  {a.users?.role && (
                                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider border ${roleBadge(a.users.role)}`}>
                                      {a.users.role}
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">{a.users?.registered_email || '—'}</td>
                                <td className="px-4 py-3 text-slate-500 text-xs max-w-[200px] truncate">
                                  {a.details ? JSON.stringify(a.details).slice(0, 80) : '—'}
                                </td>
                                <td className="px-4 py-3 font-mono text-xs text-slate-600">{a.ip_address || '—'}</td>
                                <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{formatDateTime(a.created_at)}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── PRODUCTS TAB ── */}
            {activeTab === 'products' && (
              <motion.div key="products" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead>
                        <tr className="bg-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                          <th className="px-4 py-3">#</th>
                          <th className="px-4 py-3">Product Title</th>
                          <th className="px-4 py-3">Supplier</th>
                          <th className="px-4 py-3">Sector</th>
                          <th className="px-4 py-3">Price</th>
                          <th className="px-4 py-3">Stock</th>
                          <th className="px-4 py-3">HSN</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {filteredProducts.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="px-4 py-12 text-center text-slate-500">
                              {searchQuery ? 'No products match your search.' : 'No products listed yet.'}
                            </td>
                          </tr>
                        ) : (
                          filteredProducts.map((p, idx) => (
                            <tr key={p.id} className="hover:bg-slate-800/50 transition-colors">
                              <td className="px-4 py-3 text-slate-600 font-mono text-xs">{idx + 1}</td>
                              <td className="px-4 py-3">
                                <div className="font-bold text-white line-clamp-1 max-w-[250px]">{p.title}</div>
                              </td>
                              <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{p.supplier_id?.company_name || '-'}</td>
                              <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">{p.sector_id?.name || '-'}</td>
                              <td className="px-4 py-3 text-emerald-400 font-bold whitespace-nowrap">₹{p.base_price_per_unit}/{p.unit_label}</td>
                              <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{p.inventory_count || '-'}</td>
                              <td className="px-4 py-3 font-mono text-xs text-slate-500">{p.hsn_code || '-'}</td>
                              <td className="px-4 py-3">
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${p.is_active ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                                  {p.is_active ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <Link href={`/directory/product/${p.id}`} target="_blank" className="text-brand-400 hover:text-brand-300 text-xs font-bold">
                                  👁️ View
                                </Link>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── PRICING & COMMISSION TAB ── */}
            {activeTab === 'pricing' && (
              <motion.div key="pricing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {/* Pricing Summary Cards */}
                {pricingSummary && (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-amber-500 to-orange-600 opacity-10 rounded-bl-3xl" />
                      <div className="text-2xl mb-2">📊</div>
                      <div className="text-3xl font-extrabold text-white">{pricingSummary.totalProducts}</div>
                      <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">Products Tracked</div>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-emerald-500 to-green-600 opacity-10 rounded-bl-3xl" />
                      <div className="text-2xl mb-2">💰</div>
                      <div className="text-2xl font-extrabold text-emerald-400">₹{Number(pricingSummary.totalCommission).toLocaleString('en-IN')}</div>
                      <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">Total Commission (per unit)</div>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-blue-500 to-indigo-600 opacity-10 rounded-bl-3xl" />
                      <div className="text-2xl mb-2">🏛️</div>
                      <div className="text-2xl font-extrabold text-blue-400">₹{Number(pricingSummary.totalGst).toLocaleString('en-IN')}</div>
                      <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">Total GST (per unit)</div>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-purple-500 to-violet-600 opacity-10 rounded-bl-3xl" />
                      <div className="text-2xl mb-2">📈</div>
                      <div className="text-3xl font-extrabold text-purple-400">{pricingSummary.avgCommissionRate}%</div>
                      <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">Avg Commission Rate</div>
                    </div>
                  </div>
                )}

                {/* Commission Rate Legend */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Commission Rate Legend</h3>
                  <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                      <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                      <span className="text-xs text-emerald-400 font-bold">2% — Agriculture & Food</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 rounded-lg border border-blue-500/20">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span className="text-xs text-blue-400 font-bold">5% — General / Others</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 rounded-lg border border-purple-500/20">
                      <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                      <span className="text-xs text-purple-400 font-bold">7% — Textile & Apparel</span>
                    </div>
                  </div>
                </div>

                {/* Pricing Table */}
                {pricingLoading ? (
                  <LoadingBlock text="Loading pricing breakdown..." />
                ) : (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead>
                          <tr className="bg-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                            <th className="px-3 py-3">#</th>
                            <th className="px-3 py-3">Product</th>
                            <th className="px-3 py-3">Supplier</th>
                            <th className="px-3 py-3">Sector</th>
                            <th className="px-3 py-3 whitespace-nowrap">Unit</th>
                            <th className="px-3 py-3 whitespace-nowrap text-right">Supplier Base ₹</th>
                            <th className="px-3 py-3 whitespace-nowrap text-center">Commission %</th>
                            <th className="px-3 py-3 whitespace-nowrap text-right">Commission ₹</th>
                            <th className="px-3 py-3 whitespace-nowrap text-right">Displayed ₹</th>
                            <th className="px-3 py-3 whitespace-nowrap text-center">GST %</th>
                            <th className="px-3 py-3 whitespace-nowrap text-right">GST ₹</th>
                            <th className="px-3 py-3 whitespace-nowrap text-right">Total with GST ₹</th>
                            <th className="px-3 py-3 whitespace-nowrap text-center">Logistics</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {filteredPricing.length === 0 ? (
                            <tr>
                              <td colSpan={13} className="px-4 py-12 text-center text-slate-500">
                                {searchQuery ? 'No pricing data matches your search.' : 'No pricing data available.'}
                              </td>
                            </tr>
                          ) : (
                            filteredPricing.map((p, idx) => (
                              <tr key={p.id || idx} className="hover:bg-slate-800/50 transition-colors">
                                <td className="px-3 py-3 text-slate-600 font-mono text-xs">{idx + 1}</td>
                                <td className="px-3 py-3">
                                  <div className="font-bold text-white line-clamp-1 max-w-[200px] text-xs">{p.product_title}</div>
                                  {p.hsn_code && <div className="text-[10px] text-slate-600 font-mono">HSN: {p.hsn_code}</div>}
                                </td>
                                <td className="px-3 py-3 text-slate-400 whitespace-nowrap text-xs">{p.supplier_name}</td>
                                <td className="px-3 py-3 text-slate-500 whitespace-nowrap text-xs">{p.sector_name}</td>
                                <td className="px-3 py-3 text-slate-400 text-xs">{p.unit_label}</td>
                                <td className="px-3 py-3 text-right font-mono text-xs text-amber-400 font-bold whitespace-nowrap">
                                  ₹{Number(p.supplier_base_price).toLocaleString('en-IN')}
                                </td>
                                <td className="px-3 py-3 text-center">
                                  <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider border whitespace-nowrap ${commissionBadge(p.commission_rate_percent)}`}>
                                    {p.commission_rate_percent}%
                                  </span>
                                </td>
                                <td className="px-3 py-3 text-right font-mono text-xs text-emerald-400 font-bold whitespace-nowrap">
                                  +₹{Number(p.commission_amount).toLocaleString('en-IN')}
                                </td>
                                <td className="px-3 py-3 text-right font-mono text-xs text-white font-extrabold whitespace-nowrap">
                                  ₹{Number(p.displayed_price).toLocaleString('en-IN')}
                                </td>
                                <td className="px-3 py-3 text-center text-slate-400 text-xs font-bold">
                                  {p.gst_rate_percent}%
                                </td>
                                <td className="px-3 py-3 text-right font-mono text-xs text-blue-400 whitespace-nowrap">
                                  +₹{Number(p.gst_on_displayed_price).toLocaleString('en-IN')}
                                </td>
                                <td className="px-3 py-3 text-right font-mono text-xs text-yellow-400 font-extrabold whitespace-nowrap">
                                  ₹{Number(p.total_price_with_gst).toLocaleString('en-IN')}
                                </td>
                                <td className="px-3 py-3 text-center">
                                  {p.logistics_eligible ? (
                                    <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
                                      🚚 ₹{p.logistics_rate_per_kg}/kg
                                    </span>
                                  ) : (
                                    <span className="text-slate-600 text-xs">—</span>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── RFQS TAB ── */}
            {activeTab === 'rfqs' && (
              <motion.div key="rfqs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                  {rfqs.length === 0 ? (
                    <EmptyState icon="📋" text="No RFQs submitted yet." />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead>
                          <tr className="bg-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                            <th className="px-4 py-3">#</th>
                            <th className="px-4 py-3">Product</th>
                            <th className="px-4 py-3">Quantity</th>
                            <th className="px-4 py-3">Buyer</th>
                            <th className="px-4 py-3">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {rfqs.map((r, idx) => (
                            <tr key={r.id || idx} className="hover:bg-slate-800/50">
                              <td className="px-4 py-3 text-slate-600 font-mono text-xs">{idx + 1}</td>
                              <td className="px-4 py-3 text-white font-bold">{r.product_name || r.title || '-'}</td>
                              <td className="px-4 py-3 text-slate-400">{r.quantity} {r.unit || ''}</td>
                              <td className="px-4 py-3 text-slate-400">{r.buyer_name || r.contact_name || '-'}</td>
                              <td className="px-4 py-3 text-slate-500 text-xs">{formatDate(r.created_at)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        )}

        {/* Footer */}
        <div className="text-center text-[10px] text-slate-700 py-4">
          B2B INDIA Admin Panel — Confidential. All actions are logged.
        </div>
      </div>
    </main>
  );
}
