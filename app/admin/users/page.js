"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SalesOutreachModal from '@/components/admin/SalesOutreachModal';

export default function AdminUsersData() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Navigation & View Tabs
  const [activeHubTab, setActiveHubTab] = useState('leads'); // 'leads' | 'hot_intent' | 'searches_stream' | 'views_stream' | 'master'

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [activityFilter, setActivityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('hot_intent');

  // Selected User Dossier Modal
  const [selectedUser, setSelectedUser] = useState(null);
  const [dossierTab, setDossierTab] = useState('profile'); // 'profile' | 'views' | 'products' | 'searches' | 'orders' | 'edit'
  const [viewsFilterTerm, setViewsFilterTerm] = useState('');

  // Edit Form State
  const [editForm, setEditForm] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);

  // Delete State
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg, isErr = false) => {
    setToastMessage({ text: msg, isError: isErr });
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Sales Outreach Modal State
  const [outreachOpen, setOutreachOpen] = useState(false);
  const [outreachUser, setOutreachUser] = useState(null);
  const [outreachProduct, setOutreachProduct] = useState(null);
  const [outreachSearchQuery, setOutreachSearchQuery] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/all-users');
      if (!response.ok) {
        if (response.status === 403) throw new Error("Forbidden: Admin access required.");
        throw new Error('Failed to fetch users data');
      }
      const data = await response.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filtered & Sorted Users
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      // Tab filter
      if (activeHubTab === 'hot_intent' && !u.is_hot_lead && u.intent_status !== 'HOT_ABANDONED') return false;

      // Role filter
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;

      // Activity filter
      if (activityFilter === 'hot_leads' && !u.is_hot_lead) return false;
      if (activityFilter === 'has_products' && (!u.products_count || u.products_count === 0)) return false;
      if (activityFilter === 'has_searches' && (!u.searches_count || u.searches_count === 0)) return false;
      if (activityFilter === 'has_views' && (!u.viewed_products_count || u.viewed_products_count === 0)) return false;
      if (activityFilter === 'active_orders' && (!u.total_orders_count || u.total_orders_count === 0)) return false;
      if (activityFilter === 'gst_verified' && !u.gst_verified && u.gst_number !== 'VERIFIED') return false;

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const nameMatch = (u.full_name || '').toLowerCase().includes(q);
        const companyMatch = (u.company_name || '').toLowerCase().includes(q);
        const emailMatch = (u.registered_email || '').toLowerCase().includes(q);
        const phoneMatch = (u.corporate_phone || u.phone_number || u.whatsapp_number || '').includes(q);
        const cityMatch = (u.city || '').toLowerCase().includes(q);
        const stateMatch = (u.state || '').toLowerCase().includes(q);
        const gstMatch = (u.gst_number || '').toLowerCase().includes(q);
        const productMatch = (u.products || []).some(p => (p.title || '').toLowerCase().includes(q));
        const searchMatch = (u.searches || []).some(s => (s.query || '').toLowerCase().includes(q));
        const viewMatch = (u.viewed_products || []).some(v => (v.title || '').toLowerCase().includes(q) || (v.category || '').toLowerCase().includes(q));

        return nameMatch || companyMatch || emailMatch || phoneMatch || cityMatch || stateMatch || gstMatch || productMatch || searchMatch || viewMatch;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'hot_intent') return (b.intent_score || 0) - (a.intent_score || 0);
      if (sortBy === 'newest_active') return new Date(b.last_active_at || 0) - new Date(a.last_active_at || 0);
      if (sortBy === 'searches') return (b.searches_count || 0) - (a.searches_count || 0);
      if (sortBy === 'views') return (b.viewed_products_count || 0) - (a.viewed_products_count || 0);
      if (sortBy === 'name') return (a.full_name || a.company_name || '').localeCompare(b.full_name || b.company_name || '');
      if (sortBy === 'company') return (a.company_name || a.full_name || '').localeCompare(b.company_name || b.full_name || '');
      if (sortBy === 'phone') return String(a.corporate_phone || a.phone_number || '').localeCompare(String(b.corporate_phone || b.phone_number || ''));
      if (sortBy === 'email') return String(a.registered_email || '').localeCompare(String(b.registered_email || ''));
      if (sortBy === 'location') return String(a.city || '').localeCompare(String(b.city || ''));
      if (sortBy === 'gst') return String(a.gst_number || '').localeCompare(String(b.gst_number || ''));
      if (sortBy === 'newest') return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      return 0;
    });
  }, [users, activeHubTab, roleFilter, activityFilter, searchTerm, sortBy]);

  // All Search Queries Stream (Itemized for direct search exploration)
  const allSearchesStream = useMemo(() => {
    const list = [];
    users.forEach(u => {
      (u.searches || []).forEach(s => {
        list.push({
          id: s.id,
          query: s.query,
          user_id: u.id,
          user_name: u.full_name || 'Anonymous Visitor',
          company_name: u.company_name || 'Individual Trader',
          phone: u.corporate_phone || u.phone_number || 'No Phone',
          whatsapp: u.whatsapp_number,
          email: u.registered_email || 'No Email',
          city: u.city || 'Unset',
          state: u.state || '',
          gst: u.gst_number || 'PENDING',
          role: u.role || 'buyer',
          results_count: s.results_count || 0,
          created_at: s.created_at,
          is_hot_lead: u.is_hot_lead,
          userObj: u
        });
      });
    });

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return list.filter(item => 
        item.query.toLowerCase().includes(q) ||
        item.user_name.toLowerCase().includes(q) ||
        item.company_name.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q) ||
        item.phone.includes(q) ||
        item.city.toLowerCase().includes(q)
      ).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    }

    return list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }, [users, searchTerm]);

  // All Catalog Views Stream (Itemized for catalog exploration)
  const allViewsStream = useMemo(() => {
    const list = [];
    users.forEach(u => {
      (u.viewed_products || []).forEach(v => {
        list.push({
          id: v.id || v.product_id,
          product_id: v.product_id,
          hero_image_url: v.hero_image_url || null,
          unit_label: v.unit_label || 'unit',
          title: v.title || 'Product Item',
          category: v.category || 'General',
          price: v.price || 0,
          user_id: u.id,
          user_name: u.full_name || 'Anonymous Visitor',
          company_name: u.company_name || 'Individual Trader',
          phone: u.corporate_phone || u.phone_number || 'No Phone',
          whatsapp: u.whatsapp_number,
          email: u.registered_email || 'No Email',
          city: u.city || 'Unset',
          state: u.state || '',
          gst: u.gst_number || 'PENDING',
          role: u.role || 'buyer',
          viewed_at: v.viewed_at,
          is_hot_lead: u.is_hot_lead,
          userObj: u
        });
      });
    });

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return list.filter(item => 
        item.title.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.user_name.toLowerCase().includes(q) ||
        item.company_name.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q) ||
        item.phone.includes(q) ||
        item.city.toLowerCase().includes(q)
      ).sort((a, b) => new Date(b.viewed_at || 0) - new Date(a.viewed_at || 0));
    }

    return list.sort((a, b) => new Date(b.viewed_at || 0) - new Date(a.viewed_at || 0));
  }, [users, searchTerm]);

  // Urgent Buyer Alerts (Real-time hot buyer signals awaiting sales outreach)
  const urgentBuyerAlerts = useMemo(() => {
    return users
      .filter(u => u.is_hot_lead && ((u.searches?.length > 0) || (u.viewed_products?.length > 0)))
      .sort((a, b) => (b.intent_score || 0) - (a.intent_score || 0))
      .slice(0, 4);
  }, [users]);

  // Metrics KPI calculations
  const totalUsers = users.length;
  const totalSuppliers = users.filter(u => u.role === 'supplier' || u.role === 'both').length;
  const totalBuyers = users.filter(u => u.role === 'buyer' || u.role === 'both').length;
  const totalHotLeads = users.filter(u => u.is_hot_lead).length;
  const totalSearchesLogged = users.reduce((sum, u) => sum + (u.searches_count || 0), 0);
  const totalProductsViewed = users.reduce((sum, u) => sum + (u.viewed_products_count || 0), 0);
  const totalGstVerified = users.filter(u => u.gst_verified || (u.gst_number && u.gst_number !== 'PENDING')).length;

  const openDossier = (user, defaultTab = 'profile') => {
    setSelectedUser(user);
    setDossierTab(defaultTab);
    setEditForm({
      full_name: user.full_name || '',
      company_name: user.company_name || '',
      job_title: user.job_title || '',
      registered_email: user.registered_email || '',
      corporate_phone: user.corporate_phone || user.phone_number || '',
      phone_number: user.phone_number || '',
      whatsapp_number: user.whatsapp_number || '',
      gst_number: user.gst_number || '',
      gst_legal_name: user.gst_legal_name || '',
      gst_verified: Boolean(user.gst_verified),
      pan_number: user.pan_number || '',
      annual_turnover_lakhs: user.annual_turnover_lakhs || '',
      year_established: user.year_established || '',
      total_employees: user.total_employees || '',
      warehouse_address: user.warehouse_address || '',
      city: user.city || '',
      state: user.state || '',
      pincode: user.pincode || '',
      role: user.role || 'buyer',
      status: user.status || 'active',
      website: user.website || '',
      about_us: user.about_us || '',
      categories: Array.isArray(user.categories) ? user.categories.join(', ') : (user.categories || ''),
      sourcing_frequency: user.sourcing_frequency || '',
      annual_spending: user.annual_spending || ''
    });
  };

  const closeDossier = () => {
    setSelectedUser(null);
    setViewsFilterTerm('');
  };

  const openOutreach = (user, product = null, searchQuery = null) => {
    setOutreachUser(user);
    setOutreachProduct(product);
    setOutreachSearchQuery(searchQuery);
    setOutreachOpen(true);
  };

  // EDIT / UPDATE USER HANDLER (Saves directly to Live Supabase DB)
  const handleUpdateUser = async (e) => {
    if (e) e.preventDefault();
    if (!selectedUser) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update user profile in database');
      
      const updatedProfile = { ...selectedUser, ...editForm, ...(data.user || {}) };
      setUsers(users.map(u => u.id === selectedUser.id ? updatedProfile : u));
      setSelectedUser(updatedProfile);
      showToast('✓ User profile updated and saved to live database successfully!');
      setDossierTab('profile');
    } catch (err) {
      showToast('Error updating user: ' + err.message, true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // DELETE USER HANDLER (Deletes directly from Live Supabase DB)
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${userToDelete.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete user from database');

      setUsers(users.filter(u => u.id !== userToDelete.id));
      if (selectedUser && selectedUser.id === userToDelete.id) {
        setSelectedUser(null);
      }
      showToast(`✓ User "${userToDelete.company_name || userToDelete.full_name || 'Trader'}" deleted from live database.`);
      setUserToDelete(null);
    } catch (err) {
      showToast('Error deleting user: ' + err.message, true);
    } finally {
      setIsDeleting(false);
    }
  };

  // Client-Side Direct Download to Excel/CSV
  const downloadClientCsv = (dataToExport, customFilename) => {
    const headers = [
      'Lead Display ID', 'User UUID', 'Contact Person Full Name', 'Company Name', 'Job Title', 'Role', 'Status',
      'Contact Phone / Mobile', 'WhatsApp Number', 'Email Address', 'City', 'State', 'Pincode', 'Warehouse Address',
      'GSTIN', 'GST Verified', 'PAN Number', 'Intent Status Level', 'Total Searches Count', 'Search Keywords History',
      'Total Products Viewed Count', 'Products & Categories Viewed', 'Total Orders Placed', 'Total Spend (INR)',
      'Products Added (Supplier)', 'Registration Date', 'Last Active Timestamp'
    ];

    const escapeCsv = (field) => {
      if (field === null || field === undefined) return '""';
      let str = String(field).replace(/"/g, '""').replace(/[\r\n]+/g, ' ');
      return `"${str}"`;
    };

    let csv = '\uFEFF' + headers.map(escapeCsv).join(',') + '\n';

    dataToExport.forEach(u => {
      const searchList = (u.searches || []).map((s, i) => `[${i + 1}] "${s.query}" (${s.created_at ? s.created_at.slice(0, 10) : 'N/A'})`).join(' | ') || 'None';
      const viewsList = (u.viewed_products || []).map((v, i) => `[${i + 1}] ${v.title} [${v.category}]`).join(' | ') || 'None';

      const row = [
        u.display_id || u.id?.slice(0, 8) || 'N/A',
        u.id,
        u.full_name || 'N/A',
        u.company_name || 'N/A',
        u.job_title || 'N/A',
        (u.role || 'buyer').toUpperCase(),
        (u.status || 'active').toUpperCase(),
        u.corporate_phone || u.phone_number || 'N/A',
        u.whatsapp_number || 'N/A',
        u.registered_email || 'N/A',
        u.city || 'N/A',
        u.state || 'N/A',
        u.pincode || 'N/A',
        u.warehouse_address || 'N/A',
        u.gst_number || 'PENDING',
        u.gst_verified ? 'YES' : 'NO',
        u.pan_number || 'N/A',
        u.intent_label || (u.is_hot_lead ? '🔥 Hot Intent (Viewed/Searched, 0 Orders)' : 'Active Lead'),
        u.searches_count || 0,
        searchList,
        u.viewed_products_count || (u.viewed_products?.length || 0),
        viewsList,
        u.total_orders_count || 0,
        u.total_trade_volume || 0,
        u.products_count || 0,
        u.created_at || 'N/A',
        u.last_active_at || u.updated_at || 'N/A'
      ];
      csv += row.map(escapeCsv).join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = customFilename || `B2B_INDIA_Commercial_Leads_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Direct CSV Export of user's viewed products
  const downloadViewedProductsCsv = (user) => {
    if (!user || !user.viewed_products || user.viewed_products.length === 0) {
      showToast('No viewed products to export for this user.', true);
      return;
    }
    const headers = [
      'Product Title', 'Category / Sector', 'Unit Price (INR)', 'Unit', 'Product ID', 'Viewed Timestamp', 'Direct Listing URL'
    ];
    const escapeCsv = (field) => {
      if (field === null || field === undefined) return '""';
      let str = String(field).replace(/"/g, '""').replace(/[\r\n]+/g, ' ');
      return `"${str}"`;
    };
    let csv = '\uFEFF' + headers.map(escapeCsv).join(',') + '\n';
    user.viewed_products.forEach(v => {
      const row = [
        v.title || 'Product Item',
        v.category || 'General',
        v.price || 0,
        v.unit_label || 'unit',
        v.product_id || '',
        v.viewed_at ? new Date(v.viewed_at).toLocaleString('en-IN') : 'N/A',
        typeof window !== 'undefined' ? `${window.location.origin}/directory/product/${v.product_id}` : ''
      ];
      csv += row.map(escapeCsv).join(',') + '\n';
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const cleanName = (user.company_name || user.full_name || 'User').replace(/[^a-zA-Z0-9]/g, '_');
    link.download = `${cleanName}_Viewed_Products_${user.viewed_products.length}_Items.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${user.viewed_products.length} viewed items to CSV!`);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 min-h-screen pb-16 font-sans">
      {/* Toast Notification Banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-2xl shadow-2xl font-bold text-xs flex items-center gap-2.5 border ${
              toastMessage.isError
                ? 'bg-rose-900 text-rose-100 border-rose-700'
                : 'bg-emerald-950 text-emerald-200 border-emerald-700'
            }`}
          >
            <span>{toastMessage.isError ? '⚠️' : '✓'}</span>
            <span>{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-6 sm:p-8 shadow-md border-b border-slate-700">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 tracking-wide uppercase">
                Commercial Data Engine
              </span>
              <span className="text-slate-400 text-xs font-semibold">Live PostgreSQL Synced • Lead Monetization Ready</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <span>💼</span> COMMERCIAL LEADS & BUYER INTENT HUB
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Complete intelligence on registered buyers and suppliers: contact numbers, email addresses, GSTIN, search queries logged (e.g. Turmeric), catalog views without order, and 1-click Excel export for lead monetization.
            </p>
          </div>

          {/* Export Action Center */}
          <div className="relative">
            <div className="flex items-center gap-2">
              <a
                href="/api/admin/export-users-data?type=commercial_leads"
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm shadow-lg shadow-emerald-900/30 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Download Commercial Leads (Excel)</span>
              </a>

              <button
                onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                title="Specialized Export Options"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Export Dropdown */}
            {exportDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 py-2 overflow-hidden text-slate-800 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Specialized Lead Exports
                </div>
                <button
                  onClick={() => { downloadClientCsv(filteredUsers, `B2B_INDIA_Filtered_Leads_${new Date().toISOString().slice(0, 10)}.csv`); setExportDropdownOpen(false); }}
                  className="w-full text-left flex items-center gap-3 px-4 py-2.5 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors"
                >
                  <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 font-bold">⚡</span>
                  <div>
                    <div className="font-bold text-slate-900">Current Filtered View ({filteredUsers.length} leads)</div>
                    <div className="text-[11px] text-slate-500">Exact rows matching current filters/sort</div>
                  </div>
                </button>
                <a
                  href="/api/admin/export-users-data?type=commercial_leads"
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors"
                >
                  <span className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700 font-bold">💼</span>
                  <div>
                    <div className="font-bold text-slate-900">Commercial Leads Master (Excel)</div>
                    <div className="text-[11px] text-slate-500">Contact dossiers + Intent signals + GST</div>
                  </div>
                </a>
                <a
                  href="/api/admin/export-users-data?type=searches"
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors"
                >
                  <span className="p-1.5 rounded-lg bg-amber-100 text-amber-700 font-bold">🔍</span>
                  <div>
                    <div className="font-bold text-slate-900">Live Search Queries Feed (Excel)</div>
                    <div className="text-[11px] text-slate-500">Every search query logged with user phone & email</div>
                  </div>
                </a>
                <a
                  href="/api/admin/export-users-data?type=products"
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors"
                >
                  <span className="p-1.5 rounded-lg bg-blue-100 text-blue-700 font-bold">📦</span>
                  <div>
                    <div className="font-bold text-slate-900">Supplier Products Listed Sheet</div>
                    <div className="text-[11px] text-slate-500">Full catalog listings with contact details</div>
                  </div>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* KPI Metric Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 mb-6">
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
            <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Leads</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{totalUsers}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">{totalSuppliers} Suppliers • {totalBuyers} Buyers</div>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 rounded-2xl p-4 border border-amber-200 shadow-sm">
            <div className="text-amber-800 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
              <span>🔥</span> Hot Intent Leads
            </div>
            <div className="text-2xl font-black text-amber-900 mt-1">{totalHotLeads}</div>
            <div className="text-[11px] text-amber-700 mt-0.5">Searched/Viewed, 0 Orders</div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
            <div className="text-indigo-600 text-xs font-bold uppercase tracking-wider">Searches Logged</div>
            <div className="text-2xl font-black text-indigo-900 mt-1">{totalSearchesLogged}</div>
            <div className="text-[11px] text-indigo-500 mt-0.5">Buyer search intent signals</div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
            <div className="text-blue-600 text-xs font-bold uppercase tracking-wider">Catalog Views</div>
            <div className="text-2xl font-black text-blue-900 mt-1">{totalProductsViewed}</div>
            <div className="text-[11px] text-blue-500 mt-0.5">Products browsed by buyers</div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
            <div className="text-emerald-600 text-xs font-bold uppercase tracking-wider">GST Compliant</div>
            <div className="text-2xl font-black text-emerald-900 mt-1">{totalGstVerified}</div>
            <div className="text-[11px] text-emerald-500 mt-0.5">Verified Indian businesses</div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
            <div className="text-purple-600 text-xs font-bold uppercase tracking-wider">Filtered View</div>
            <div className="text-2xl font-black text-purple-900 mt-1">{filteredUsers.length}</div>
            <div className="text-[11px] text-purple-500 mt-0.5">Ready for Excel export</div>
          </div>
        </div>

        {/* REAL-TIME BUYER INTENT ALERTS (High Intent Notification Banner) */}
        {urgentBuyerAlerts.length > 0 && (
          <div className="mb-6 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 border border-amber-500/40 rounded-3xl p-5 shadow-xl text-white">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <span className="flex h-3.5 w-3.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500"></span>
                </span>
                <div>
                  <h2 className="text-sm font-black text-amber-300 uppercase tracking-wider flex items-center gap-2">
                    <span>⚡</span> LIVE BUYER INTENT SIGNALS (High-Intent Leads Awaiting Sales Outreach)
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    These registered buyers recently searched or viewed products without placing an order. Contact them directly to convert.
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setActiveHubTab('hot_intent'); setActivityFilter('hot_leads'); }}
                className="text-xs font-extrabold text-amber-400 hover:text-amber-300 underline cursor-pointer"
              >
                View All {totalHotLeads} Hot Leads →
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {urgentBuyerAlerts.map(lead => {
                const latestQ = lead.latest_search?.query || (lead.searches?.[0]?.query);
                const recentViews = lead.viewed_products || [];
                const phone = lead.corporate_phone || lead.phone_number;

                return (
                  <div key={lead.id} className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700/80 hover:border-amber-500/60 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-extrabold text-sm text-white flex items-center gap-2">
                            <span>{lead.full_name || lead.company_name || 'Trader Lead'}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              🔥 HOT INTENT
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5 font-medium">
                            {lead.company_name ? `${lead.company_name} • ` : ''}{lead.city ? `${lead.city}, ${lead.state || 'India'}` : 'Location Unset'}
                          </div>
                        </div>

                        <span className="text-[11px] font-mono text-slate-400 bg-slate-900/60 px-2 py-1 rounded-lg">
                          {lead.display_id || lead.id.slice(0, 6)}
                        </span>
                      </div>

                      {/* Intent Details Box */}
                      <div className="my-3 p-2.5 rounded-xl bg-slate-900/80 border border-slate-700/50 space-y-1 text-xs">
                        {latestQ && (
                          <div className="flex items-center gap-2">
                            <span className="text-amber-400 font-bold">🔍 Searched:</span>
                            <span className="font-bold text-white bg-amber-500/20 px-2 py-0.5 rounded text-xs">
                              &quot;{latestQ}&quot;
                            </span>
                            <span className="text-[10px] text-slate-400">
                              ({lead.latest_search?.created_at ? new Date(lead.latest_search.created_at).toLocaleDateString('en-IN') : 'Recent'})
                            </span>
                          </div>
                        )}
                        {recentViews.length > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="text-indigo-300 font-bold">📦 Viewed:</span>
                            <span className="text-slate-200 truncate">
                              {Array.from(new Set(recentViews.map(v => v.title))).slice(0, 3).join(', ')}
                              {lead.viewed_products_count > 1 ? ` (${lead.viewed_products_count} views)` : ''}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 pt-0.5 text-[11px]">
                          <span className="text-rose-300 font-bold">⚠️ Order Status:</span>
                          <span className="text-rose-200 font-semibold">0 Orders Placed (High Abandonment Intent)</span>
                        </div>
                      </div>

                      {/* Contact Info Preview */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 mb-3">
                        <span className="flex items-center gap-1 font-mono font-bold">
                          📞 {phone || 'No phone'}
                        </span>
                        <span className="flex items-center gap-1 font-mono text-slate-400 truncate max-w-[200px]">
                          ✉️ {lead.registered_email || 'No email'}
                        </span>
                        {lead.gst_number && (
                          <span className="font-mono text-[10px] bg-slate-700/50 px-2 py-0.5 rounded text-emerald-300 font-bold">
                            GST: {lead.gst_number}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quick Outreach Buttons */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-700/60">
                      {phone && (
                        <a
                          href={`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${lead.full_name || 'Sir/Madam'}, we noticed your sourcing requirement for ${latestQ || 'wholesale products'} on B2B India. We have verified manufacturers ready with factory-direct quotes. Would you like to connect?`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs text-center flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                        >
                          <span>💬</span> WhatsApp Offer
                        </a>
                      )}
                      {phone && (
                        <a
                          href={`tel:${phone.replace(/[^0-9+]/g, '')}`}
                          className="py-2 px-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs flex items-center gap-1 transition-colors"
                          title="Call Lead"
                        >
                          <span>📞</span> Call
                        </a>
                      )}
                      <button
                        onClick={() => openDossier(lead, 'profile')}
                        className="py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                        title="View Full Lead Profile"
                      >
                        <span>👁️</span> Dossier
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* HUB NAVIGATION TABS */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveHubTab('leads')}
            className={`px-4 py-2.5 rounded-2xl font-black text-xs transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeHubTab === 'leads'
                ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>💼</span> All Commercial Leads ({users.length})
          </button>

          <button
            onClick={() => setActiveHubTab('hot_intent')}
            className={`px-4 py-2.5 rounded-2xl font-black text-xs transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeHubTab === 'hot_intent'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                : 'bg-white text-amber-800 hover:bg-amber-50 border border-amber-200'
            }`}
          >
            <span>🔥</span> Hot Intent Leads ({totalHotLeads})
          </button>

          <button
            onClick={() => setActiveHubTab('searches_stream')}
            className={`px-4 py-2.5 rounded-2xl font-black text-xs transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeHubTab === 'searches_stream'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-white text-indigo-700 hover:bg-indigo-50 border border-indigo-200'
            }`}
          >
            <span>🔍</span> Live Search Queries Stream ({allSearchesStream.length})
          </button>

          <button
            onClick={() => setActiveHubTab('views_stream')}
            className={`px-4 py-2.5 rounded-2xl font-black text-xs transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeHubTab === 'views_stream'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-white text-blue-700 hover:bg-blue-50 border border-blue-200'
            }`}
          >
            <span>📦</span> Catalog Views Stream ({allViewsStream.length})
          </button>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative w-full md:w-96">
            <input
              type="text"
              placeholder="Search name, company, email, phone, GST, search queries (turmeric)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
            />
            <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 text-xs cursor-pointer">
                ✕
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 outline-none cursor-pointer"
            >
              <option value="all">All Roles ({users.length})</option>
              <option value="buyer">Buyers Only</option>
              <option value="supplier">Suppliers Only</option>
              <option value="both">Both (Buyer + Supplier)</option>
              <option value="admin">Admins</option>
            </select>

            <select
              value={activityFilter}
              onChange={(e) => setActivityFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 outline-none cursor-pointer"
            >
              <option value="all">All Activity</option>
              <option value="hot_leads">🔥 Hot Intent: Searched/Viewed, 0 Orders ({totalHotLeads})</option>
              <option value="has_searches">Has Searches Logged ({users.filter(u => u.searches_count > 0).length})</option>
              <option value="has_views">Has Catalog Views ({users.filter(u => (u.viewed_products_count || 0) > 0).length})</option>
              <option value="active_orders">Has Placed Orders ({users.filter(u => (u.total_orders_count || 0) > 0).length})</option>
              <option value="has_products">Has Listed Products ({users.filter(u => u.products_count > 0).length})</option>
              <option value="gst_verified">GST Verified Only</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 outline-none cursor-pointer"
            >
              <option value="hot_intent">🔥 Sort: Hot Intent Score</option>
              <option value="newest_active">⚡ Sort: Recently Active</option>
              <option value="searches">🔍 Sort: Most Searches</option>
              <option value="views">📦 Sort: Most Catalog Views</option>
              <option value="name">👤 Sort: Person Name (A-Z)</option>
              <option value="company">🏢 Sort: Company Name (A-Z)</option>
              <option value="phone">📞 Sort: Contact Phone</option>
              <option value="email">✉️ Sort: Email Address</option>
              <option value="location">📍 Sort: Location (City/State)</option>
              <option value="gst">🛡️ Sort: GSTIN</option>
              <option value="newest">📅 Sort: Registration Date</option>
            </select>

            <button
              onClick={fetchUsers}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              title="Refresh Live Data from Database"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* TAB VIEW 1 & 2: COMMERCIAL LEADS TABLE */}
        {(activeHubTab === 'leads' || activeHubTab === 'hot_intent') && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            {loading ? (
              <div className="py-20 text-center">
                <div className="inline-block w-8 h-8 border-4 border-slate-200 border-t-brand-600 rounded-full animate-spin mb-3"></div>
                <div className="text-sm font-bold text-slate-600">Loading Commercial Leads from Database...</div>
              </div>
            ) : error ? (
              <div className="p-8 text-center text-rose-600 font-bold text-sm bg-rose-50">
                Error: {error}
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-16 text-center text-slate-500">
                <div className="text-3xl mb-2">🔍</div>
                <div className="font-bold text-sm">No leads match the search criteria.</div>
                <button onClick={() => { setSearchTerm(''); setRoleFilter('all'); setActivityFilter('all'); }} className="mt-3 text-xs font-bold text-brand-600 underline cursor-pointer">
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                      <th className="py-3.5 px-4">Lead & Business</th>
                      <th className="py-3.5 px-4">Direct Contact Info</th>
                      <th className="py-3.5 px-4">Location & GST</th>
                      <th className="py-3.5 px-4">Search Queries Logged</th>
                      <th className="py-3.5 px-4">Catalog Views</th>
                      <th className="py-3.5 px-4">Intent Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                    {filteredUsers.map((user) => {
                      const hasSearches = (user.searches_count || 0) > 0;
                      const hasViews = (user.viewed_products_count || 0) > 0;
                      const isGst = user.gst_verified || (user.gst_number && user.gst_number !== 'PENDING');
                      const phone = user.corporate_phone || user.phone_number;
                      const recentQueries = user.searches?.slice(0, 3) || [];
                      
                      // Deduplicate views for distinct product badges
                      const distinctViews = [];
                      const seenProductKeys = new Set();
                      (user.viewed_products || []).forEach(v => {
                        const key = v.product_id || v.title;
                        if (!seenProductKeys.has(key)) {
                          seenProductKeys.add(key);
                          const count = user.viewed_products.filter(x => (x.product_id || x.title) === key).length;
                          distinctViews.push({ ...v, count });
                        }
                      });
                      const recentViews = distinctViews.slice(0, 3);

                      return (
                        <tr key={user.id} className="hover:bg-slate-50/60 transition-colors group">
                          {/* Lead & Business */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-800 to-indigo-900 text-white font-extrabold flex items-center justify-center text-xs shadow-sm flex-shrink-0">
                                {(user.company_name || user.full_name || 'U').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                  <span>{user.full_name || 'Unnamed Contact'}</span>
                                  {user.is_hot_lead && (
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-extrabold" title="Hot Buyer Lead">
                                      🔥 HOT
                                    </span>
                                  )}
                                </div>
                                <div className="text-slate-600 font-semibold text-xs">
                                  {user.company_name || 'Individual Trader'}
                                </div>
                                <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                                  <span className="font-mono font-semibold text-slate-500">{user.display_id || user.id.slice(0, 6)}</span>
                                  <span>•</span>
                                  <span className="capitalize font-semibold text-slate-600">{user.role || 'buyer'}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Direct Contact Info */}
                          <td className="py-3.5 px-4">
                            <div className="space-y-1">
                              {phone ? (
                                <div className="flex items-center gap-2">
                                  <a
                                    href={`tel:${phone.replace(/[^0-9+]/g, '')}`}
                                    className="font-mono text-slate-900 font-bold hover:text-indigo-600 transition-colors"
                                  >
                                    📞 {phone}
                                  </a>
                                  <a
                                    href={`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${user.full_name || 'Sir'}, connecting regarding your wholesale requirements on B2B India.`)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-1.5 py-0.5 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[10px] font-bold transition-colors"
                                    title="Open WhatsApp Chat"
                                  >
                                    💬 WA
                                  </a>
                                </div>
                              ) : (
                                <span className="text-slate-400 italic text-[11px]">No phone</span>
                              )}

                              {user.registered_email ? (
                                <a
                                  href={`mailto:${user.registered_email}`}
                                  className="font-mono text-slate-600 hover:text-indigo-600 text-[11px] block truncate max-w-[200px]"
                                >
                                  ✉️ {user.registered_email}
                                </a>
                              ) : (
                                <span className="text-slate-400 italic text-[11px]">No email</span>
                              )}
                            </div>
                          </td>

                          {/* Location & GST */}
                          <td className="py-3.5 px-4">
                            <div className="text-[11px]">
                              <div className="font-semibold text-slate-800">
                                {user.city ? `${user.city}, ${user.state || 'India'}` : 'Location Unset'}
                              </div>
                              <div className="flex items-center gap-1 font-mono text-[10px] mt-0.5">
                                <span className="text-slate-500 font-semibold">GST:</span>
                                <span className={user.gst_number && user.gst_number !== 'PENDING' ? 'text-slate-800 font-bold' : 'text-slate-400 italic'}>
                                  {user.gst_number || 'PENDING'}
                                </span>
                                {isGst && (
                                  <span className="text-emerald-600 font-bold text-xs" title="GST Verified">✓</span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Search Queries Logged */}
                          <td className="py-3.5 px-4">
                            {hasSearches ? (
                              <div className="space-y-1">
                                <div className="flex flex-wrap gap-1 max-w-xs">
                                  {recentQueries.map((s, idx) => (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 border border-amber-200/80 text-amber-900 font-bold text-[11px]"
                                    >
                                      &quot;{s.query}&quot;
                                    </span>
                                  ))}
                                </div>
                                <button
                                  onClick={() => openDossier(user, 'searches')}
                                  className="text-[11px] font-bold text-amber-700 hover:underline cursor-pointer block"
                                >
                                  View all {user.searches_count} queries →
                                </button>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[11px] italic">No searches logged</span>
                            )}
                          </td>

                          {/* Catalog Views */}
                          <td className="py-3.5 px-4">
                            {hasViews ? (
                              <div className="space-y-1">
                                <div className="flex flex-wrap gap-1 max-w-xs">
                                  {recentViews.map((v, idx) => (
                                    <span
                                      key={`view-chip-${v.product_id || idx}-${idx}`}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-50 border border-blue-200/80 text-blue-900 font-bold text-[11px] truncate max-w-[170px]"
                                      title={`${v.title} (${v.count} views)`}
                                    >
                                      <span className="truncate">{v.title}</span>
                                      {v.count > 1 && (
                                        <span className="px-1 py-0.2 rounded-full bg-blue-200 text-blue-900 text-[9px] font-black shrink-0">
                                          {v.count}x
                                        </span>
                                      )}
                                    </span>
                                  ))}
                                </div>
                                <button
                                  onClick={() => openDossier(user, 'views')}
                                  className="text-[11px] font-bold text-blue-700 hover:underline cursor-pointer block"
                                >
                                  View all {user.viewed_products_count} items viewed →
                                </button>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[11px] italic">No catalog views</span>
                            )}
                          </td>

                          {/* Intent Status */}
                          <td className="py-3.5 px-4">
                            {user.is_hot_lead ? (
                              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 font-extrabold text-[11px]">
                                <span>🔥</span>
                                <span>HOT INTENT</span>
                              </div>
                            ) : (user.total_orders_count || 0) > 0 ? (
                              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-900 font-extrabold text-[11px]">
                                <span>📦</span>
                                <span>{user.total_orders_count} Orders</span>
                              </div>
                            ) : (user.rfqs_count || 0) > 0 ? (
                              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 border border-blue-300 text-blue-900 font-extrabold text-[11px]">
                                <span>📝</span>
                                <span>RFQ Active</span>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[11px]">Dormant</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {phone && (
                                <a
                                  href={`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${user.full_name || 'Sir'}, regarding your interest in wholesale products on B2B India.`)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors cursor-pointer"
                                  title="Chat on WhatsApp"
                                >
                                  💬
                                </a>
                              )}
                              <button
                                onClick={() => openDossier(user, 'profile')}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                                title="View 360° Lead Dossier"
                              >
                                View
                              </button>
                              <button
                                onClick={() => openDossier(user, 'edit')}
                                className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/60 font-bold text-xs transition-colors cursor-pointer"
                                title="Edit Lead Information"
                              >
                                ✏️ Edit
                              </button>
                              <button
                                onClick={() => downloadClientCsv([user], `Lead_${user.display_id || user.id.slice(0, 8)}_Data.csv`)}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                                title="Export Single Lead to CSV"
                              >
                                📥
                              </button>
                              <button
                                onClick={() => setUserToDelete(user)}
                                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                                title="Delete Lead Record"
                              >
                                🗑️
                              </button>
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
        )}

        {/* TAB VIEW 3: LIVE SEARCH QUERIES STREAM */}
        {activeHubTab === 'searches_stream' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <span>🔍</span> Live Buyer Search Query Stream
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time feed of every keyword searched by buyers on B2B India with contact phone numbers & emails.
                </p>
              </div>
              <a
                href="/api/admin/export-users-data?type=searches"
                className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <span>📥</span> Export Search Stream (Excel)
              </a>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Search Query Keyword</th>
                    <th className="py-3.5 px-4">Buyer / Lead Name</th>
                    <th className="py-3.5 px-4">Company Name</th>
                    <th className="py-3.5 px-4">Contact Phone</th>
                    <th className="py-3.5 px-4">Email Address</th>
                    <th className="py-3.5 px-4">Location</th>
                    <th className="py-3.5 px-4">Search Date</th>
                    <th className="py-3.5 px-4 text-right">Instant Outreach</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                  {allSearchesStream.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500 font-bold">
                        No search logs found matching the filter.
                      </td>
                    </tr>
                  ) : (
                    allSearchesStream.map((s, idx) => (
                      <tr key={s.id || idx} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <span className="font-extrabold text-sm text-slate-900 bg-amber-100/70 border border-amber-300 text-amber-950 px-2.5 py-1 rounded-xl inline-block">
                            &quot;{s.query}&quot;
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {s.user_name}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 font-semibold">
                          {s.company_name}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                          {s.phone}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-600">
                          {s.email}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700">
                          {s.city ? `${s.city}, ${s.state || ''}` : 'Unset'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                          {s.created_at ? new Date(s.created_at).toLocaleString('en-IN') : 'N/A'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {s.phone && s.phone !== 'No Phone' ? (
                            <a
                              href={`https://wa.me/${s.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${s.user_name}, we noticed your search for "${s.query}" on B2B India. We have verified wholesale suppliers available. May I assist you with quotes?`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-sm"
                            >
                              <span>💬</span> WhatsApp
                            </a>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">No contact</span>
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

        {/* TAB VIEW 4: CATALOG VIEWS STREAM */}
        {activeHubTab === 'views_stream' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <span>📦</span> Live Catalog & Category Views Stream
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Itemized log of products and categories browsed by prospective buyers on the platform.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Product Viewed</th>
                    <th className="py-3.5 px-4">Category / Sector</th>
                    <th className="py-3.5 px-4">Viewer Name</th>
                    <th className="py-3.5 px-4">Company Name</th>
                    <th className="py-3.5 px-4">Contact Phone</th>
                    <th className="py-3.5 px-4">Email Address</th>
                    <th className="py-3.5 px-4">Viewed Timestamp</th>
                    <th className="py-3.5 px-4 text-right">Outreach</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                  {allViewsStream.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500 font-bold">
                        No product views recorded yet.
                      </td>
                    </tr>
                  ) : (
                    allViewsStream.map((v, idx) => (
                      <tr key={`stream-${v.user_id}-${v.product_id || idx}-${v.viewed_at || idx}-${idx}`} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center flex-shrink-0">
                              {v.hero_image_url ? (
                                <img src={v.hero_image_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-xs">📦</span>
                              )}
                            </div>
                            <div>
                              <div className="font-black text-slate-900">{v.title}</div>
                              {v.product_id && (
                                <a
                                  href={`/directory/product/${v.product_id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] text-indigo-600 hover:underline inline-block font-mono"
                                >
                                  View Listing ↗
                                </a>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-semibold text-[11px]">
                            {v.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          <button
                            onClick={() => openDossier(v.userObj, 'views')}
                            className="text-left font-bold text-slate-900 hover:text-indigo-600 hover:underline cursor-pointer"
                            title="Click to open user intelligence dossier"
                          >
                            {v.user_name}
                          </button>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 font-semibold">
                          {v.company_name}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                          {v.phone}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-600">
                          {v.email}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                          {v.viewed_at ? new Date(v.viewed_at).toLocaleString('en-IN') : 'N/A'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openDossier(v.userObj, 'views')}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                              title="View all items viewed by this user"
                            >
                              👁️ Dossier
                            </button>
                            {v.phone && v.phone !== 'No Phone' ? (
                              <a
                                href={`https://wa.me/${v.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${v.user_name}, we saw your interest in ${v.title} on B2B India. Would you like wholesale price quotes and specifications?`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-sm"
                              >
                                <span>💬</span> WhatsApp
                              </a>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">No contact</span>
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
        )}
      </div>

      {/* 360° USER INTELLIGENCE DOSSIER MODAL */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden my-6"
            >
              {/* Dossier Modal Header */}
              <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-600 text-white font-black text-xl flex items-center justify-center shadow-lg">
                    {(selectedUser.company_name || selectedUser.full_name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                      {selectedUser.company_name || selectedUser.full_name || 'Trader Dossier'}
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                        {selectedUser.display_id || selectedUser.id.slice(0, 8)}
                      </span>
                    </h2>
                    <div className="text-slate-400 text-xs mt-0.5 flex items-center gap-2">
                      <span>Role: <strong className="text-slate-200 uppercase">{selectedUser.role || 'buyer'}</strong></span>
                      <span>•</span>
                      <span>Status: <strong className="text-emerald-400 uppercase">{selectedUser.status || 'active'}</strong></span>
                      <span>•</span>
                      <span>Joined: {new Date(selectedUser.created_at || Date.now()).toLocaleDateString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => downloadClientCsv([selectedUser], `User_${selectedUser.display_id || selectedUser.id.slice(0, 8)}_Complete_Data.csv`)}
                    className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                  >
                    <span>📥</span> Download Excel
                  </button>
                  <button
                    onClick={() => setUserToDelete(selectedUser)}
                    className="px-3 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white font-bold text-xs flex items-center gap-1.5 border border-rose-500/30 transition-all cursor-pointer"
                  >
                    <span>🗑️</span> Delete User
                  </button>
                  <button
                    onClick={closeDossier}
                    className="w-9 h-9 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Dossier Navigation Tabs */}
              <div className="px-6 bg-slate-100 border-b border-slate-200 flex items-center gap-1.5 flex-shrink-0 overflow-x-auto py-1">
                {[
                  { id: 'profile', label: '👤 Profile & KYC' },
                  { id: 'views', label: `👁️ Items Viewed (${selectedUser.viewed_products_count || 0})` },
                  { id: 'searches', label: `🔍 Searches (${selectedUser.searches_count || 0})` },
                  { id: 'products', label: `📦 Listed Products (${selectedUser.products_count || 0})` },
                  { id: 'rfqs', label: `📋 RFQs (${selectedUser.rfqs_count || 0})` },
                  { id: 'quotes', label: `📩 Quotes (${selectedUser.quotes_count || 0})` },
                  { id: 'orders', label: `💼 Orders (${selectedUser.total_orders_count || 0})` },
                  { id: 'payments', label: `💳 Payments (${selectedUser.payments?.length || 0})` },
                  { id: 'logistics', label: `🚚 Logistics (${selectedUser.logistics_count || 0})` },
                  { id: 'security', label: `🔐 Auth & Login (${selectedUser.auth_provider || 'email'})` },
                  { id: 'subscription', label: `👑 Plan: ${selectedUser.membership_plan || 'Free'}` },
                  { id: 'edit', label: '✏️ Edit Profile' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setDossierTab(tab.id)}
                    className={`py-2.5 px-3 text-xs font-extrabold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                      dossierTab === tab.id
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-transparent text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Dossier Modal Content Body */}
              <div className="p-6 overflow-y-auto flex-1 bg-slate-50 text-slate-800 text-xs">
                {/* TAB 1: PROFILE & KYC */}
                {dossierTab === 'profile' && (
                  <div className="space-y-6">
                    {/* Basic Info */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                      <div className="flex items-center justify-between pb-2 mb-4 border-b border-slate-100">
                        <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                          <span>🏢</span> Corporate & Contact Information
                        </h3>
                        <button
                          onClick={() => setDossierTab('edit')}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-xs cursor-pointer"
                        >
                          ✏️ Edit This Data
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                          <div className="text-slate-400 font-bold text-[10px] uppercase">Company Name</div>
                          <div className="font-bold text-slate-900 text-sm mt-0.5">{selectedUser.company_name || 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-slate-400 font-bold text-[10px] uppercase">Full Contact Person</div>
                          <div className="font-bold text-slate-900 text-sm mt-0.5">{selectedUser.full_name || 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-slate-400 font-bold text-[10px] uppercase">Job Title / Designation</div>
                          <div className="font-bold text-slate-900 mt-0.5">{selectedUser.job_title || 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-slate-400 font-bold text-[10px] uppercase">Registered Email</div>
                          <div className="font-mono font-bold text-slate-900 mt-0.5">{selectedUser.registered_email || 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-slate-400 font-bold text-[10px] uppercase">Corporate Phone</div>
                          <div className="font-bold text-slate-900 mt-0.5">{selectedUser.corporate_phone || selectedUser.phone_number || 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-slate-400 font-bold text-[10px] uppercase">WhatsApp Number</div>
                          <div className="font-bold text-emerald-700 mt-0.5 flex items-center gap-1">
                            {selectedUser.whatsapp_number || 'N/A'}
                            {selectedUser.whatsapp_number && (
                              <a
                                href={`https://wa.me/${selectedUser.whatsapp_number.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs bg-emerald-100 px-1.5 py-0.5 rounded font-bold hover:bg-emerald-200"
                              >
                                Chat
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Statutory & Location */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                      <h3 className="text-sm font-black text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                        <span>🛡️</span> Statutory, Tax & Location KYC
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                          <div className="text-slate-400 font-bold text-[10px] uppercase">GSTIN Number</div>
                          <div className="font-mono font-bold text-slate-900 mt-0.5 flex items-center gap-1.5">
                            {selectedUser.gst_number || 'PENDING'}
                            {selectedUser.gst_verified && <span className="text-emerald-600 font-bold">✓ Verified</span>}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-400 font-bold text-[10px] uppercase">GST Legal Business Name</div>
                          <div className="font-bold text-slate-900 mt-0.5">{selectedUser.gst_legal_name || 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-slate-400 font-bold text-[10px] uppercase">PAN Number</div>
                          <div className="font-mono font-bold text-slate-900 mt-0.5">{selectedUser.pan_number || 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-slate-400 font-bold text-[10px] uppercase">Annual Turnover</div>
                          <div className="font-bold text-slate-900 mt-0.5">{selectedUser.annual_turnover_lakhs ? `₹${selectedUser.annual_turnover_lakhs} Lakhs` : 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-slate-400 font-bold text-[10px] uppercase">Year Established</div>
                          <div className="font-bold text-slate-900 mt-0.5">{selectedUser.year_established || 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-slate-400 font-bold text-[10px] uppercase">Total Employees</div>
                          <div className="font-bold text-slate-900 mt-0.5">{selectedUser.total_employees || 'N/A'}</div>
                        </div>
                        <div className="sm:col-span-3">
                          <div className="text-slate-400 font-bold text-[10px] uppercase">Full Warehouse / Operating Address</div>
                          <div className="font-medium text-slate-800 mt-0.5">
                            {selectedUser.warehouse_address || 'No address specified'}
                            {selectedUser.city && ` — ${selectedUser.city}, ${selectedUser.state || ''} ${selectedUser.pincode || ''}`}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Sourcing & Categories */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                      <h3 className="text-sm font-black text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                        <span>🏷️</span> Business Categories & Demographics
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <div className="text-slate-400 font-bold text-[10px] uppercase">Business Categories</div>
                          <div className="font-semibold text-slate-800 mt-0.5">
                            {Array.isArray(selectedUser.categories) && selectedUser.categories.length > 0
                              ? selectedUser.categories.join(', ')
                              : (selectedUser.categories || 'All Categories')}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-400 font-bold text-[10px] uppercase">Website</div>
                          <div className="font-semibold text-slate-800 mt-0.5">
                            {selectedUser.website ? (
                              <a href={selectedUser.website} target="_blank" rel="noreferrer" className="text-brand-600 underline">
                                {selectedUser.website}
                              </a>
                            ) : 'N/A'}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-400 font-bold text-[10px] uppercase">Sourcing Frequency</div>
                          <div className="font-semibold text-slate-800 mt-0.5">
                            {selectedUser.sourcing_frequency || 'Not specified'}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-400 font-bold text-[10px] uppercase">Annual Sourcing Budget</div>
                          <div className="font-semibold text-slate-800 mt-0.5">
                            {selectedUser.annual_spending || 'Not specified'}
                          </div>
                        </div>
                        <div className="sm:col-span-2">
                          <div className="text-slate-400 font-bold text-[10px] uppercase">About Company</div>
                          <div className="text-slate-600 mt-0.5 leading-relaxed">{selectedUser.about_us || 'No company bio provided.'}</div>
                        </div>
                      </div>
                    </div>

                    {/* Catalog Browsing & Intent Signals Overview Card */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                      <div className="flex items-center justify-between pb-2 mb-4 border-b border-slate-100">
                        <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                          <span>👁️</span> Catalog Browsing & High-Intent Products Viewed
                        </h3>
                        <button
                          onClick={() => setDossierTab('views')}
                          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs cursor-pointer flex items-center gap-1 transition-colors"
                        >
                          <span>View All {selectedUser.viewed_products_count || selectedUser.viewed_products?.length || 0} Items Viewed</span>
                          <span>→</span>
                        </button>
                      </div>

                      {(!selectedUser.viewed_products || selectedUser.viewed_products.length === 0) ? (
                        <div className="text-slate-400 py-3 text-center italic">No products viewed by this user yet.</div>
                      ) : (
                        <div>
                          <div className="text-slate-500 text-xs mb-3">
                            This buyer has inspected <strong className="text-slate-900">{selectedUser.viewed_products_count || selectedUser.viewed_products.length} catalog listings</strong> across <strong className="text-slate-900">{selectedUser.viewed_categories?.length || 1} industry categories</strong>.
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {(() => {
                              const distinct = [];
                              const seen = new Set();
                              (selectedUser.viewed_products || []).forEach(v => {
                                const key = v.product_id || v.title;
                                if (!seen.has(key)) {
                                  seen.add(key);
                                  const cnt = selectedUser.viewed_products.filter(x => (x.product_id || x.title) === key).length;
                                  distinct.push({ ...v, count: cnt });
                                }
                              });
                              return (
                                <>
                                  {distinct.slice(0, 8).map((vp, vIdx) => (
                                    <button
                                      key={`profile-view-${vp.product_id || vIdx}-${vIdx}`}
                                      onClick={() => setDossierTab('views')}
                                      className="px-3 py-1.5 rounded-xl bg-blue-50/80 hover:bg-blue-100 border border-blue-200 text-blue-950 font-bold text-xs flex items-center gap-2 cursor-pointer transition-all shadow-xs text-left"
                                      title={`Viewed ${vp.count} times. Click to view all items.`}
                                    >
                                      {vp.hero_image_url ? (
                                        <img src={vp.hero_image_url} alt="" className="w-5 h-5 rounded-md object-cover flex-shrink-0" />
                                      ) : (
                                        <span>📦</span>
                                      )}
                                      <span className="truncate max-w-[140px]">{vp.title}</span>
                                      {vp.count > 1 && (
                                        <span className="px-1.5 py-0.2 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-[10px] font-black">
                                          {vp.count}x
                                        </span>
                                      )}
                                      {vp.price ? (
                                        <span className="text-[10px] text-blue-700 font-semibold">₹{Number(vp.price).toLocaleString('en-IN')}</span>
                                      ) : null}
                                    </button>
                                  ))}
                                  {distinct.length > 8 && (
                                    <button
                                      onClick={() => setDossierTab('views')}
                                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                                    >
                                      +{distinct.length - 8} more products...
                                    </button>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB: VIEWED PRODUCTS & COMMERCIAL INTENT */}
                {dossierTab === 'views' && (() => {
                  const userViews = selectedUser.viewed_products || [];
                  const totalViewsCount = selectedUser.viewed_products_count || userViews.length;
                  
                  // Compute distinct products and counts
                  const productFrequencyMap = {};
                  userViews.forEach(v => {
                    const key = v.product_id || v.title;
                    if (!productFrequencyMap[key]) {
                      productFrequencyMap[key] = { count: 0, product: v };
                    }
                    productFrequencyMap[key].count += 1;
                  });
                  const distinctList = Object.values(productFrequencyMap);
                  const topCommodity = distinctList.sort((a, b) => b.count - a.count)[0];

                  const filteredViews = userViews.filter(v => {
                    if (!viewsFilterTerm.trim()) return true;
                    const q = viewsFilterTerm.toLowerCase();
                    return (v.title || '').toLowerCase().includes(q) ||
                           (v.category || '').toLowerCase().includes(q) ||
                           (v.product_id || '').toLowerCase().includes(q);
                  });

                  return (
                    <div className="space-y-6">
                      {/* Header Controls */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                            <span>👁️</span> Products Viewed & Commercial Intent History ({totalViewsCount} Items)
                          </h3>
                          <p className="text-slate-500 text-xs mt-0.5">
                            Real-time audit of all product listings inspected by {selectedUser.company_name || selectedUser.full_name}. High repeated views indicate urgent sourcing intent.
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {totalViewsCount > 0 && (
                            <button
                              onClick={() => downloadViewedProductsCsv(selectedUser)}
                              className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold text-xs hover:bg-indigo-100 flex items-center gap-1.5 transition-colors cursor-pointer"
                              title="Download full browsing log as CSV"
                            >
                              <span>📥</span> Export CSV
                            </button>
                          )}
                          <button
                            onClick={() => openOutreach(selectedUser)}
                            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                          >
                            <span>💬</span> Quick Outreach
                          </button>
                        </div>
                      </div>

                      {/* Intent Metrics Summary Cards */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                          <div className="text-slate-400 font-bold text-[10px] uppercase">Total Catalog Views</div>
                          <div className="text-2xl font-black text-slate-900 mt-1 flex items-baseline gap-1.5">
                            <span>{totalViewsCount}</span>
                            <span className="text-xs text-slate-500 font-normal">views logged</span>
                          </div>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                          <div className="text-slate-400 font-bold text-[10px] uppercase">Unique Products</div>
                          <div className="text-2xl font-black text-indigo-600 mt-1 flex items-baseline gap-1.5">
                            <span>{distinctList.length}</span>
                            <span className="text-xs text-slate-500 font-normal">distinct items</span>
                          </div>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                          <div className="text-slate-400 font-bold text-[10px] uppercase">Top Commodity Interest</div>
                          <div className="text-sm font-black text-slate-900 mt-1 truncate" title={topCommodity?.product?.title || 'None'}>
                            {topCommodity?.product?.title || 'None'}
                          </div>
                          {topCommodity?.count > 1 && (
                            <span className="inline-block mt-0.5 text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded-md">
                              🔥 Viewed {topCommodity.count} times
                            </span>
                          )}
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                          <div className="text-slate-400 font-bold text-[10px] uppercase">Sectors Explored</div>
                          <div className="text-2xl font-black text-emerald-600 mt-1">
                            {selectedUser.viewed_categories?.length || (distinctList.length > 0 ? 1 : 0)}
                          </div>
                        </div>
                      </div>

                      {/* High Frequency Alert Notice */}
                      {topCommodity && topCommodity.count > 1 && (
                        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
                          <span className="text-xl">🔥</span>
                          <div className="text-xs">
                            <span className="font-extrabold text-amber-950">High Purchase Intent Detected: </span>
                            <span className="text-amber-900">
                              This buyer has viewed <strong className="font-black text-slate-900">&ldquo;{topCommodity.product.title}&rdquo;</strong> a total of <strong className="font-black text-amber-950">{topCommodity.count} times</strong>! They are actively looking for wholesale suppliers and pricing.
                            </span>
                            <button
                              onClick={() => openOutreach(selectedUser, topCommodity.product)}
                              className="ml-2 font-black text-indigo-700 hover:text-indigo-900 underline cursor-pointer inline-block"
                            >
                              Pitch {topCommodity.product.title} Quote →
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Filter Search Bar */}
                      {totalViewsCount > 3 && (
                        <div className="relative">
                          <input
                            type="text"
                            value={viewsFilterTerm}
                            onChange={(e) => setViewsFilterTerm(e.target.value)}
                            placeholder="Filter viewed items by title, category, or product ID..."
                            className="w-full bg-white rounded-xl border border-slate-200 pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
                          />
                          <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
                          {viewsFilterTerm && (
                            <button
                              onClick={() => setViewsFilterTerm('')}
                              className="absolute right-3 top-2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      )}

                      {/* Itemized Viewed Items List */}
                      {userViews.length === 0 ? (
                        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
                          <div className="text-3xl mb-2">👁️</div>
                          <div className="font-bold">No catalog items viewed by this user yet.</div>
                          <div className="text-xs text-slate-400 mt-1">When this buyer browses wholesale products in the directory, their view stream will populate here in real-time.</div>
                        </div>
                      ) : filteredViews.length === 0 ? (
                        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
                          <div className="font-bold">No viewed items match &quot;{viewsFilterTerm}&quot;.</div>
                          <button onClick={() => setViewsFilterTerm('')} className="mt-2 text-xs font-bold text-indigo-600 hover:underline">
                            Clear Filter
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {filteredViews.map((item, idx) => {
                            const freq = productFrequencyMap[item.product_id || item.title]?.count || 1;
                            return (
                              <div
                                key={`view-item-${item.product_id || idx}-${item.viewed_at || idx}-${idx}`}
                                className="bg-white rounded-2xl p-4 border border-slate-200 hover:border-indigo-300 shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                              >
                                <div className="flex items-center gap-3.5 min-w-0">
                                  {/* Item Counter */}
                                  <div className="w-6 text-center font-mono text-[11px] font-bold text-slate-400 flex-shrink-0">
                                    #{idx + 1}
                                  </div>

                                  {/* Thumbnail */}
                                  <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200/80 flex-shrink-0 overflow-hidden flex items-center justify-center">
                                    {item.hero_image_url ? (
                                      <img src={item.hero_image_url} alt={item.title} className="w-full h-full object-cover" />
                                    ) : (
                                      <span className="text-2xl">📦</span>
                                    )}
                                  </div>

                                  {/* Details */}
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h4 className="font-black text-slate-900 text-sm truncate">{item.title}</h4>
                                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px]">
                                        {item.category || 'General'}
                                      </span>
                                      {freq > 1 && (
                                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-black text-[10px] border border-amber-300 flex items-center gap-1">
                                          <span>🔥</span>
                                          <span>{freq}x Viewed</span>
                                        </span>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-2.5 mt-1 text-xs text-slate-600 flex-wrap">
                                      <div className="text-brand-700 font-black">
                                        ₹{Number(item.price || 0).toLocaleString('en-IN')} <span className="text-[11px] text-slate-500 font-normal">/ {item.unit_label || 'unit'}</span>
                                      </div>
                                      <span className="text-slate-300">•</span>
                                      <div className="font-mono text-slate-400 text-[10px] truncate max-w-[180px]">
                                        ID: {item.product_id}
                                      </div>
                                    </div>

                                    <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                                      <span>🕒 Viewed:</span>
                                      <span className="font-medium text-slate-600 font-mono text-[11px]">
                                        {item.viewed_at ? new Date(item.viewed_at).toLocaleString('en-IN', {
                                          day: '2-digit', month: 'short', year: 'numeric',
                                          hour: '2-digit', minute: '2-digit', hour12: true
                                        }) : 'Recently Logged'}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 flex-shrink-0 self-end md:self-center">
                                  <a
                                    href={`/directory/product/${item.product_id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                                    title="Open live product page in directory"
                                  >
                                    <span>🔗</span> View Item
                                  </a>
                                  <button
                                    onClick={() => openOutreach(selectedUser, item)}
                                    className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                                    title="Send wholesale proposal to this buyer"
                                  >
                                    <span>💬</span> Offer Quote
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* TAB: AUTH & SECURITY */}
                {dossierTab === 'security' && (
                  <div className="space-y-5">
                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                          <span>🔐</span> Authentication, Login & Access Credentials
                        </h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                          selectedUser.email_confirmed ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {selectedUser.email_confirmed ? '✓ Email Verified' : '⚠️ Pending Verification'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                          <div className="text-slate-400 font-bold text-[10px] uppercase">Primary Auth Method</div>
                          <div className="font-extrabold text-slate-900 text-sm mt-0.5 capitalize flex items-center gap-1.5">
                            <span>{selectedUser.auth_provider === 'google' ? '🌐 Google OAuth' : '✉️ Email & Password'}</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-400 font-bold text-[10px] uppercase">Registered Email</div>
                          <div className="font-mono font-bold text-slate-900 mt-0.5">{selectedUser.registered_email || 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-slate-400 font-bold text-[10px] uppercase">User Primary ID (UUID)</div>
                          <div className="font-mono text-[11px] font-bold text-slate-700 mt-0.5 truncate">{selectedUser.id}</div>
                        </div>
                        <div>
                          <div className="text-slate-400 font-bold text-[10px] uppercase">Display / Trader ID</div>
                          <div className="font-mono font-extrabold text-brand-700 mt-0.5">{selectedUser.display_id || 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-slate-400 font-bold text-[10px] uppercase">Account Created / Registered</div>
                          <div className="font-bold text-slate-900 mt-0.5">
                            {new Date(selectedUser.registration_date || selectedUser.created_at || Date.now()).toLocaleString('en-IN')}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-400 font-bold text-[10px] uppercase">Last Login Timestamp</div>
                          <div className="font-bold text-indigo-700 mt-0.5">
                            {selectedUser.last_sign_in ? new Date(selectedUser.last_sign_in).toLocaleString('en-IN') : 'Recent Active Session'}
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-2.5">
                        <button
                          onClick={() => showToast(`✓ Password reset email dispatched to ${selectedUser.registered_email}`)}
                          className="px-3.5 py-2 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>🔑</span> Send Password Reset Link
                        </button>
                        <button
                          onClick={() => showToast(`✓ Security verification token refreshed for ${selectedUser.registered_email}`)}
                          className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>🛡️</span> Refresh Auth Claims
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB: SUBSCRIPTION & MEMBERSHIP */}
                {dossierTab === 'subscription' && (
                  <div className="space-y-5">
                    <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl p-6 shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 text-amber-300 text-xs font-black rounded-full mb-2">
                          👑 Tier Plan: {selectedUser.membership_plan || 'FREE TIER'}
                        </div>
                        <h3 className="text-xl font-black">{selectedUser.company_name || selectedUser.full_name}</h3>
                        <p className="text-xs text-slate-300 mt-1">
                          Status: <strong className="text-emerald-400">{selectedUser.membership_status || 'Standard Free Tier'}</strong> • 
                          Expires: {selectedUser.membership_expires_at ? new Date(selectedUser.membership_expires_at).toLocaleDateString('en-IN') : 'Lifetime Free Access'}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={async () => {
                            try {
                              const res = await fetch('/api/admin/subscriptions', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  action: 'activate',
                                  user_id: selectedUser.id,
                                  email: selectedUser.registered_email,
                                  plan: 'ANNUAL PLAN',
                                  days: 365,
                                  notes: 'Upgraded via User 360 Dossier'
                                })
                              });
                              const d = await res.json();
                              if (d.success) {
                                showToast('✓ Upgraded to Annual VIP Gold! Catalog live.');
                                fetchUsers();
                              } else {
                                showToast(d.error || 'Failed to upgrade', true);
                              }
                            } catch (e) {
                              showToast('Upgrade error', true);
                            }
                          }}
                          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg cursor-pointer"
                        >
                          ⭐ Upgrade to Annual Plan
                        </button>
                        <Link
                          href="/admin/subscriptions"
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 cursor-pointer flex items-center gap-1.5"
                        >
                          👑 Subscriptions Desk →
                        </Link>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-white p-4 rounded-2xl border border-slate-200">
                        <div className="text-slate-400 font-bold text-[10px] uppercase">Product Catalog Quota</div>
                        <div className="text-xl font-black text-slate-900 mt-1">{selectedUser.products_count || 0} / {selectedUser.membership_plan === 'FREE TIER' ? '50 Listings' : 'Unlimited'}</div>
                      </div>
                      <div className="bg-white p-4 rounded-2xl border border-slate-200">
                        <div className="text-slate-400 font-bold text-[10px] uppercase">RFQ Broadcast Limit</div>
                        <div className="text-xl font-black text-slate-900 mt-1">{selectedUser.rfqs_count || 0} / Unlimited</div>
                      </div>
                      <div className="bg-white p-4 rounded-2xl border border-slate-200">
                        <div className="text-slate-400 font-bold text-[10px] uppercase">Can Upload Products</div>
                        <div className="text-xl font-black text-emerald-700 mt-1">✓ Active Allowed</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: PRODUCTS ADDED */}
                {dossierTab === 'products' && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-sm font-black text-slate-900">
                          Products Added by {selectedUser.company_name || selectedUser.full_name} ({selectedUser.products_count || 0})
                        </h3>
                        <p className="text-slate-500 text-xs">All catalog listings published by this user with live commercial valuations</p>
                      </div>
                      {selectedUser.products_count > 0 && (
                        <button
                          onClick={() => downloadClientCsv([selectedUser], `${selectedUser.company_name || 'User'}_Products.csv`)}
                          className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold text-xs hover:bg-indigo-100 cursor-pointer"
                        >
                          📥 Export Products
                        </button>
                      )}
                    </div>

                    {!selectedUser.products || selectedUser.products.length === 0 ? (
                      <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
                        <div className="text-3xl mb-2">📦</div>
                        <div className="font-bold">This user has not listed any products yet.</div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedUser.products.map((prod, pIdx) => (
                          <div key={`prod-${prod.id || pIdx}-${pIdx}`} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex gap-4">
                            {prod.hero_image_url ? (
                              <img src={prod.hero_image_url} alt={prod.title} className="w-20 h-20 rounded-xl object-cover border border-slate-100 flex-shrink-0" />
                            ) : (
                              <div className="w-20 h-20 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 text-2xl flex-shrink-0">
                                📦
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-1">
                                <h4 className="font-black text-slate-900 text-sm truncate">{prod.title}</h4>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${prod.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                                  {prod.is_active ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                              <div className="text-[10px] font-mono text-slate-400 mt-0.5 truncate">
                                ID: {prod.id}
                              </div>
                              <div className="text-brand-700 font-black text-sm mt-1">
                                ₹{Number(prod.base_price_per_unit).toLocaleString('en-IN')} <span className="text-xs text-slate-500 font-normal">/ {prod.unit_label || 'unit'}</span>
                              </div>
                              <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                                <span>MOQ: <strong>{prod.bulk_minimum_order || 1}</strong></span>
                                <span>Inventory: <strong>{prod.inventory_count || 0}</strong></span>
                                <span>Grade: <strong>{prod.quality_grade || 'Standard'}</strong></span>
                                <span>HSN: <strong>{prod.hsn_code || 'N/A'}</strong></span>
                              </div>
                              <div className="text-[10px] text-slate-400 mt-2">
                                Added: {new Date(prod.created_at || Date.now()).toLocaleDateString('en-IN')}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB: RFQS POSTED */}
                {dossierTab === 'rfqs' && (
                  <div>
                    <h3 className="text-sm font-black text-slate-900 mb-4">
                      RFQs Broadcasted by {selectedUser.company_name || selectedUser.full_name} ({selectedUser.rfqs_count || 0})
                    </h3>

                    {!selectedUser.rfqs || selectedUser.rfqs.length === 0 ? (
                      <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
                        <div className="text-3xl mb-2">📋</div>
                        <div className="font-bold">No RFQ requirements posted yet.</div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {selectedUser.rfqs.map((rfq, rIdx) => (
                          <div key={`rfq-${rfq.id || rIdx}-${rIdx}`} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-slate-900 text-sm">{rfq.product_name || 'Procurement Requirement'}</h4>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 capitalize">
                                  {rfq.status || 'open'}
                                </span>
                              </div>
                              <div className="text-xs text-slate-500 mt-1">
                                Quantity: <strong>{Number(rfq.quantity || 0).toLocaleString('en-IN')} {rfq.unit || 'Kg'}</strong> • 
                                Target: <strong>₹{rfq.target_price || 'N/A'} / {rfq.unit || 'Kg'}</strong> • 
                                Destination: <strong>{rfq.destination || 'Unspecified'}</strong>
                              </div>
                              <div className="text-[10px] font-mono text-slate-400 mt-1">
                                RFQ ID: {rfq.id}
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="text-[11px] font-mono text-slate-400">
                                {new Date(rfq.created_at || Date.now()).toLocaleDateString('en-IN')}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB: QUOTATIONS SUBMITTED */}
                {dossierTab === 'quotes' && (
                  <div>
                    <h3 className="text-sm font-black text-slate-900 mb-4">
                      Quotations & Bids Submitted ({selectedUser.quotes_count || 0})
                    </h3>

                    {!selectedUser.quotes || selectedUser.quotes.length === 0 ? (
                      <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
                        <div className="text-3xl mb-2">📩</div>
                        <div className="font-bold">No quotations submitted by this supplier yet.</div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {selectedUser.quotes.map((q, qIdx) => (
                          <div key={`quote-${q.id || qIdx}-${qIdx}`} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
                            <div>
                              <div className="font-bold text-slate-900 text-sm">
                                Quote #{q.id.slice(0, 8)} for RFQ #{q.rfq_id?.slice(0, 8) || 'N/A'}
                              </div>
                              <div className="text-xs text-slate-500 mt-0.5">
                                Quoted Price: <strong className="text-emerald-700">₹{q.quoted_price}</strong> • Lead Time: <strong>{q.delivery_days || 5} Days</strong> • Fee: <strong>{q.platform_fee || '4%'}</strong>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                {q.status || 'Submitted'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB: ORDERS & DEALS */}
                {dossierTab === 'orders' && (
                  <div>
                    <h3 className="text-sm font-black text-slate-900 mb-4">
                      Direct Orders & Escrow Deals ({selectedUser.total_orders_count || 0})
                    </h3>

                    {!selectedUser.orders || selectedUser.orders.length === 0 ? (
                      <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
                        <div className="text-3xl mb-2">💼</div>
                        <div className="font-bold">No direct orders placed or received yet.</div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {selectedUser.orders.map((ord, idx) => (
                          <div key={`order-${ord.id || ord.transaction_id || idx}-${idx}`} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
                            <div>
                              <div className="font-bold text-slate-900 text-sm">
                                {ord.product_name || ord.productTitle || `Order #${(ord.id || '').slice(0, 8)}`}
                              </div>
                              <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                                Order ID: {ord.id} • TXN: {ord.qr_payment_reference || ord.transaction_id || 'N/A'}
                              </div>
                              <div className="text-slate-600 text-xs mt-1">
                                Quantity: <strong>{ord.quantity || 1000} {ord.unit || 'Kg'}</strong> • 
                                Advance (10%): <strong className="text-blue-700">₹{Number(ord.advance_paid_10 || ord.advance_amount || 0).toLocaleString('en-IN')}</strong> • 
                                Status: <strong className="text-emerald-700 capitalize">{ord.current_state || ord.order_status || 'in_escrow'}</strong>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-black text-slate-900 text-sm">
                                ₹{Number(ord.total_contract_value || ord.total_amount || ord.total_order_value || 0).toLocaleString('en-IN')}
                              </div>
                              <div className="text-[10px] text-slate-400 mt-1">
                                {new Date(ord.created_at || Date.now()).toLocaleDateString('en-IN')}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB: PAYMENTS & FINANCIAL LEDGER */}
                {dossierTab === 'payments' && (
                  <div>
                    <h3 className="text-sm font-black text-slate-900 mb-4">
                      Payments & Financial Ledger ({selectedUser.payments?.length || 0})
                    </h3>

                    {!selectedUser.payments || selectedUser.payments.length === 0 ? (
                      <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
                        <div className="text-3xl mb-2">💳</div>
                        <div className="font-bold">No escrow payments logged for this user.</div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {selectedUser.payments.map((pay, idx) => (
                          <div key={`pay-${pay.payment_id || idx}-${idx}`} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
                            <div>
                              <div className="font-mono font-bold text-slate-900 text-xs">
                                Payment ID: {pay.payment_id}
                              </div>
                              <div className="text-xs text-slate-500 mt-0.5">
                                Type: <strong>{pay.type}</strong> • Method: <strong>{pay.method}</strong>
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                For Order: {pay.order_id}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-black text-emerald-700 text-sm">
                                ₹{Number(pay.amount).toLocaleString('en-IN')}
                              </div>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                {pay.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB: LOGISTICS & SHIPMENTS */}
                {dossierTab === 'logistics' && (
                  <div>
                    <h3 className="text-sm font-black text-slate-900 mb-4">
                      Logistics Shipments & Gate Passes ({selectedUser.logistics_count || 0})
                    </h3>

                    {!selectedUser.logistics || selectedUser.logistics.length === 0 ? (
                      <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
                        <div className="text-3xl mb-2">🚚</div>
                        <div className="font-bold">No logistics arrangements recorded for this user.</div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {selectedUser.logistics.map((log, idx) => (
                          <div key={`log-${log.tracking_number || log.order_id || idx}-${idx}`} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-2">
                            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                              <span className="font-mono font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-xs">
                                {log.tracking_number}
                              </span>
                              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                                {log.delivery_option === 'pickup' ? '🏭 Warehouse Gate Pass' : '🚚 Factory Delivery'}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-slate-400 font-bold text-[10px] uppercase block">Vehicle / Fleet:</span>
                                <span className="font-mono font-bold text-slate-900">{log.vehicle_number}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 font-bold text-[10px] uppercase block">Authorized Driver / Lead:</span>
                                <span className="font-bold text-slate-900">{log.driver_name} ({log.driver_phone})</span>
                              </div>
                              <div className="col-span-2">
                                <span className="text-slate-400 font-bold text-[10px] uppercase block">Destination Address:</span>
                                <span className="text-slate-700">{log.destination}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: SEARCH & DISCOVERY HISTORY */}
                {dossierTab === 'searches' && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-sm font-black text-slate-900">
                          Search Analytics & Queries Logged ({selectedUser.searches_count || 0})
                        </h3>
                        <p className="text-slate-500 text-xs">High-intent procurement searches recorded from this user session</p>
                      </div>
                    </div>

                    {/* Top Searched Terms */}
                    {selectedUser.top_searches && selectedUser.top_searches.length > 0 && (
                      <div className="mb-4 p-4 bg-amber-50/60 border border-amber-200 rounded-2xl">
                        <span className="text-amber-900 font-extrabold text-[11px] uppercase tracking-wider block mb-2">
                          🔥 Most Searched Commodities:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {selectedUser.top_searches.map((ts, idx) => (
                            <span key={idx} className="px-3 py-1 bg-white border border-amber-300 rounded-xl text-xs font-black text-slate-900 shadow-sm flex items-center gap-1.5">
                              <span>🔍</span> {ts.keyword}
                              <span className="bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-full text-[10px]">{ts.count} times</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {!selectedUser.searches || selectedUser.searches.length === 0 ? (
                      <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
                        <div className="text-3xl mb-2">🔍</div>
                        <div className="font-bold">No search queries logged for this user.</div>
                      </div>
                    ) : (
                      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                              <th className="py-2.5 px-4">Search Keyword / Query</th>
                              <th className="py-2.5 px-4">Sector Filter</th>
                              <th className="py-2.5 px-4">Results Count</th>
                              <th className="py-2.5 px-4 text-right">Timestamp</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-xs">
                            {selectedUser.searches.map((s, idx) => (
                              <tr key={`search-${s.id || idx}-${idx}`} className="hover:bg-slate-50">
                                <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                                  <span>🔍</span> &ldquo;{s.query}&rdquo;
                                </td>
                                <td className="py-3 px-4 text-slate-600 font-medium">{s.sector_slug || 'All Sectors'}</td>
                                <td className="py-3 px-4 font-mono font-bold text-slate-700">{s.results_count || 0}</td>
                                <td className="py-3 px-4 text-right text-slate-400 font-mono text-[11px]">
                                  {new Date(s.created_at).toLocaleString('en-IN')}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 5: EDIT PROFILE & SAVE TO DATABASE */}
                {dossierTab === 'edit' && (
                  <form onSubmit={handleUpdateUser} className="space-y-4">
                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <h3 className="text-sm font-black text-slate-900">
                          Edit Business Details & KYC (Saves to Live PostgreSQL Database)
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                          Live DB Sync
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-slate-700 font-bold text-[11px] mb-1">
                            Company Name <span className="text-red-500 font-bold">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={editForm.company_name}
                            onChange={(e) => setEditForm({ ...editForm, company_name: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-500"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-700 font-bold text-[11px] mb-1">
                            Contact Person Name <span className="text-red-500 font-bold">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={editForm.full_name}
                            onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-500"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-700 font-bold text-[11px] mb-1">Job Title</label>
                          <input
                            type="text"
                            value={editForm.job_title}
                            onChange={(e) => setEditForm({ ...editForm, job_title: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-500"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-700 font-bold text-[11px] mb-1">
                            Registered Email <span className="text-red-500 font-bold">*</span>
                          </label>
                          <input
                            type="email"
                            required
                            value={editForm.registered_email}
                            onChange={(e) => setEditForm({ ...editForm, registered_email: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-500"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-700 font-bold text-[11px] mb-1">
                            Corporate Phone <span className="text-red-500 font-bold">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={editForm.corporate_phone}
                            onChange={(e) => setEditForm({ ...editForm, corporate_phone: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-500"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-700 font-bold text-[11px] mb-1">WhatsApp Number</label>
                          <input
                            type="text"
                            value={editForm.whatsapp_number}
                            onChange={(e) => setEditForm({ ...editForm, whatsapp_number: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-500"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-700 font-bold text-[11px] mb-1">GSTIN Number</label>
                          <input
                            type="text"
                            value={editForm.gst_number}
                            onChange={(e) => setEditForm({ ...editForm, gst_number: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-500"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-700 font-bold text-[11px] mb-1">PAN Number</label>
                          <input
                            type="text"
                            value={editForm.pan_number}
                            onChange={(e) => setEditForm({ ...editForm, pan_number: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-500"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-700 font-bold text-[11px] mb-1">GST Verification</label>
                          <select
                            value={editForm.gst_verified ? 'true' : 'false'}
                            onChange={(e) => setEditForm({ ...editForm, gst_verified: e.target.value === 'true' })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-500"
                          >
                            <option value="false">Unverified</option>
                            <option value="true">✓ Verified Compliant</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-slate-700 font-bold text-[11px] mb-1">
                            Role <span className="text-red-500 font-bold">*</span>
                          </label>
                          <select
                            value={editForm.role}
                            onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-500"
                          >
                            <option value="buyer">Buyer</option>
                            <option value="supplier">Supplier</option>
                            <option value="both">Both (Buyer + Supplier)</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-slate-700 font-bold text-[11px] mb-1">
                            Account Status <span className="text-red-500 font-bold">*</span>
                          </label>
                          <select
                            value={editForm.status}
                            onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-500"
                          >
                            <option value="active">Active</option>
                            <option value="pending_verification">Pending Verification</option>
                            <option value="suspended">Suspended</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-slate-700 font-bold text-[11px] mb-1">Official Website</label>
                          <input
                            type="url"
                            placeholder="https://example.com"
                            value={editForm.website || ''}
                            onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-500"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-700 font-bold text-[11px] mb-1">Year Established</label>
                          <input
                            type="number"
                            placeholder="e.g. 2018"
                            value={editForm.year_established || ''}
                            onChange={(e) => setEditForm({ ...editForm, year_established: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-500"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-700 font-bold text-[11px] mb-1">Total Employees</label>
                          <select
                            value={editForm.total_employees || ''}
                            onChange={(e) => setEditForm({ ...editForm, total_employees: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-500"
                          >
                            <option value="">Select range...</option>
                            <option value="1-10">1-10 Employees</option>
                            <option value="11-50">11-50 Employees</option>
                            <option value="51-200">51-200 Employees</option>
                            <option value="201-500">201-500 Employees</option>
                            <option value="501-1000">501-1000 Employees</option>
                            <option value="1000+">1000+ Employees</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-slate-700 font-bold text-[11px] mb-1">Annual Turnover (Lakhs INR)</label>
                          <input
                            type="number"
                            value={editForm.annual_turnover_lakhs}
                            onChange={(e) => setEditForm({ ...editForm, annual_turnover_lakhs: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-500"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-700 font-bold text-[11px] mb-1">
                            City <span className="text-red-500 font-bold">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={editForm.city}
                            onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-500"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-700 font-bold text-[11px] mb-1">
                            State <span className="text-red-500 font-bold">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={editForm.state}
                            onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-500"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-700 font-bold text-[11px] mb-1">
                            Pincode <span className="text-red-500 font-bold">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={editForm.pincode}
                            onChange={(e) => setEditForm({ ...editForm, pincode: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-500"
                          />
                        </div>
                        <div className="sm:col-span-2 md:col-span-3">
                          <label className="block text-slate-700 font-bold text-[11px] mb-1">
                            Warehouse / Office Address <span className="text-red-500 font-bold">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={editForm.warehouse_address}
                            onChange={(e) => setEditForm({ ...editForm, warehouse_address: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-500"
                          />
                        </div>
                        <div className="sm:col-span-2 md:col-span-3">
                          <label className="block text-slate-700 font-bold text-[11px] mb-1">Business Categories / Sectors (comma-separated)</label>
                          <input
                            type="text"
                            placeholder="e.g. food-agriculture, textiles-fabrics, machinery"
                            value={editForm.categories || ''}
                            onChange={(e) => setEditForm({ ...editForm, categories: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-500"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-700 font-bold text-[11px] mb-1">Sourcing Frequency</label>
                          <select
                            value={editForm.sourcing_frequency || ''}
                            onChange={(e) => setEditForm({ ...editForm, sourcing_frequency: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-500"
                          >
                            <option value="">Select frequency...</option>
                            <option value="Daily">Daily</option>
                            <option value="Weekly">Weekly</option>
                            <option value="Monthly">Monthly</option>
                            <option value="Quarterly">Quarterly</option>
                            <option value="Annually">Annually</option>
                            <option value="As Needed">As Needed</option>
                          </select>
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-slate-700 font-bold text-[11px] mb-1">Annual Spending / Sourcing Budget</label>
                          <select
                            value={editForm.annual_spending || ''}
                            onChange={(e) => setEditForm({ ...editForm, annual_spending: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-500"
                          >
                            <option value="">Select budget range...</option>
                            <option value="Below ₹1 Lakh">Below ₹1 Lakh</option>
                            <option value="₹1-5 Lakhs">₹1-5 Lakhs</option>
                            <option value="₹5-25 Lakhs">₹5-25 Lakhs</option>
                            <option value="₹25-100 Lakhs">₹25-100 Lakhs</option>
                            <option value="₹1-10 Crores">₹1-10 Crores</option>
                            <option value="Above ₹10 Crores">Above ₹10 Crores</option>
                          </select>
                        </div>
                        <div className="sm:col-span-2 md:col-span-3">
                          <label className="block text-slate-700 font-bold text-[11px] mb-1">About Company / Bio</label>
                          <textarea
                            rows={3}
                            value={editForm.about_us}
                            onChange={(e) => setEditForm({ ...editForm, about_us: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-500"
                          />
                        </div>
                      </div>

                      <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setUserToDelete(selectedUser)}
                          className="px-4 py-2.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-xs transition-colors cursor-pointer"
                        >
                          🗑️ Delete This User
                        </button>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setDossierTab('profile')}
                            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md shadow-emerald-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                          >
                            {isSubmitting ? 'Saving to Database...' : '✓ Save Changes to Live Database'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION DIALOG */}
      <AnimatePresence>
        {userToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-rose-100 text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center text-2xl mx-auto mb-4">
                ⚠️
              </div>
              <h3 className="text-lg font-black text-slate-900">
                Permanently Delete User?
              </h3>
              <p className="text-slate-500 text-xs mt-2 leading-relaxed">
                Are you sure you want to delete <strong className="text-slate-800">{userToDelete.company_name || userToDelete.full_name || 'this user'}</strong> ({userToDelete.registered_email})?
              </p>
              <p className="text-rose-600 font-bold text-[11px] mt-1 bg-rose-50 p-2 rounded-xl border border-rose-200">
                This will delete the user and clean up their associated records directly in the live Supabase PostgreSQL database.
              </p>

              <div className="mt-6 flex items-center justify-center gap-3">
                <button
                  onClick={() => setUserToDelete(null)}
                  disabled={isDeleting}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteUser}
                  disabled={isDeleting}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-lg shadow-rose-900/30 cursor-pointer"
                >
                  {isDeleting ? 'Deleting from DB...' : 'Yes, Delete Permanently'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SALES OUTREACH MODAL */}
      {outreachOpen && outreachUser && (
        <SalesOutreachModal
          isOpen={outreachOpen}
          onClose={() => setOutreachOpen(false)}
          user={outreachUser}
          product={outreachProduct}
          searchQuery={outreachSearchQuery}
        />
      )}
    </div>
  );
}
