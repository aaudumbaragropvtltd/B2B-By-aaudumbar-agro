'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TABLES = [
  { id: 'users', label: '👥 users', desc: 'User Profiles, Added Products & Search History' },
  { id: 'logistics', label: '🚚 logistics', desc: 'Shipments, Tracking AWBs & Gate Passes' },
  { id: 'trade_orders', label: '💼 trade_orders', desc: 'B2B Trade Transactions' },
  { id: 'payments', label: '💳 payments', desc: '10% Escrow & Gateway Payments' },
  { id: 'products', label: '📦 products', desc: 'Marketplace Product Listings' },
  { id: 'warehouses', label: '🏭 warehouses', desc: 'Warehouse Hubs & Locations' },
  { id: 'rfqs', label: '📋 rfqs', desc: 'Buyer Request For Quotations' },
  { id: 'rfq_quotes', label: '🏷️ rfq_quotes', desc: 'Supplier RFQ Quotes' },
  { id: 'platform_ledger', label: '📊 platform_ledger', desc: 'Platform Financial Ledger' },
  { id: 'industry_sectors', label: '🏷️ industry_sectors', desc: 'Sector Classifications' },
  { id: 'search_logs', label: '🔍 search_logs', desc: 'Search Queries & Buyer Intent' },
  { id: 'conversations', label: '💬 conversations', desc: 'Direct B2B Chat Threads' },
  { id: 'messages', label: '✉️ messages', desc: 'Chat Messages & Logs' },
  { id: 'activity_logs', label: '⚡ activity_logs', desc: 'System Events & Security Audit' }
];

export default function DatabaseManager() {
  const [activeTable, setActiveTable] = useState('users');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [formData, setFormData] = useState({});
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg, isErr = false) => {
    setToastMessage({ text: msg, isError: isErr });
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    fetchData();
  }, [activeTable]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/database?table=${activeTable}`);
      if (!res.ok) throw new Error('Failed to fetch table records from live database');
      const json = await res.json();
      setData(Array.isArray(json) ? json : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (record = null) => {
    setEditingRecord(record);
    if (record) {
      const formatted = {};
      for (const key in record) {
        if (typeof record[key] === 'object' && record[key] !== null) {
          formatted[key] = JSON.stringify(record[key], null, 2);
        } else {
          formatted[key] = record[key] !== null ? String(record[key]) : '';
        }
      }
      setFormData(formatted);
    } else {
      const emptyForm = {};
      if (data.length > 0) {
        Object.keys(data[0]).forEach(key => {
          if (key !== 'id' && key !== 'created_at' && key !== 'updated_at') {
            emptyForm[key] = '';
          }
        });
      }
      setFormData(emptyForm);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRecord(null);
    setFormData({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const method = editingRecord ? 'PUT' : 'POST';
      const payload = {
        table: activeTable,
        data: formData
      };
      if (editingRecord) {
        payload.id = editingRecord.id;
      }

      const res = await fetch('/api/admin/database', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        let errText = 'Failed to save record to live database';
        try {
          const errData = await res.json();
          errText = errData.error || errText;
        } catch {
          errText = (await res.text()) || errText;
        }
        throw new Error(errText);
      }

      showToast('✓ Record updated and saved to live database successfully!');
      await fetchData();
      handleCloseModal();
    } catch (err) {
      showToast(`Error saving: ${err.message}`, true);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to permanently delete this record from the live PostgreSQL database?')) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/database?table=${activeTable}&id=${id}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to delete record');
      }

      showToast('✓ Record deleted from live database.');
      await fetchData();
    } catch (err) {
      showToast(`Error deleting: ${err.message}`, true);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = data.filter(row => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return Object.values(row).some(v => 
      v !== null && v !== undefined && String(v).toLowerCase().includes(q)
    );
  });

  const columns = data.length > 0 ? Object.keys(data[0]) : [];

  const formatHeader = (col) => {
    return col
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-4.5rem)] bg-slate-50 border-t border-slate-200 font-sans">
      {/* Toast Alert */}
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

      {/* Sidebar Navigation */}
      <div className="w-full lg:w-72 bg-white border-r border-slate-200 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-slate-100 bg-slate-900 text-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-400">Database Schema</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">12 Tables</span>
          </div>
          <h2 className="font-extrabold text-base text-white mt-1">Live Database Tables</h2>
        </div>

        <nav className="p-2 space-y-1 overflow-y-auto flex-1">
          {TABLES.map(table => (
            <button
              key={table.id}
              onClick={() => { setActiveTable(table.id); setSearchTerm(''); }}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex flex-col gap-0.5 ${
                activeTable === table.id
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-900/20'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <span>{table.label}</span>
                {activeTable === table.id && <span className="text-[10px] text-emerald-200">Active</span>}
              </div>
              <span className={`text-[10px] font-normal ${activeTable === table.id ? 'text-brand-100' : 'text-slate-400'}`}>
                {table.desc}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Table Header & Search Bar */}
        <div className="p-5 bg-white border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-800 uppercase tracking-wide">
                Live PostgreSQL
              </span>
              <span className="text-slate-400 text-xs font-semibold">{data.length} Records</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 capitalize mt-0.5">
              {activeTable.replace('_', ' ')}
            </h1>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <input
                type="text"
                placeholder="Search records in table..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
              />
              <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <button
              onClick={fetchData}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              title="Refresh table data"
            >
              🔄
            </button>

            <button
              onClick={() => handleOpenModal()}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all cursor-pointer whitespace-nowrap"
            >
              + Add Record
            </button>
          </div>
        </div>

        {/* Table Body */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 bg-slate-50">
          {error && (
            <div className="bg-rose-50 text-rose-700 p-4 rounded-2xl mb-4 text-xs font-bold border border-rose-200">
              {error}
            </div>
          )}

          {loading && data.length === 0 ? (
            <div className="text-center text-slate-500 py-16">
              <div className="inline-block w-8 h-8 border-4 border-slate-200 border-t-brand-600 rounded-full animate-spin mb-3"></div>
              <div className="text-xs font-bold">Querying live database records...</div>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center text-slate-500 py-16 bg-white rounded-2xl shadow-sm border border-slate-200">
              <div className="text-3xl mb-2">📄</div>
              <div className="text-sm font-bold">No records found matching criteria.</div>
            </div>
          ) : (
            <div className="bg-white shadow-sm rounded-2xl border border-slate-200/80 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 text-left border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                    <tr>
                      {columns.map(col => (
                        <th key={col} className="px-4 py-3.5 whitespace-nowrap">
                          {formatHeader(col)}
                        </th>
                      ))}
                      <th className="px-4 py-3.5 text-right whitespace-nowrap">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100 text-xs font-medium text-slate-700">
                    {filteredData.map((row, i) => (
                      <tr key={row.id || i} className="hover:bg-slate-50/70 transition-colors">
                        {columns.map(col => {
                          const val = row[col];
                          const strVal = String(val ?? '');

                          return (
                            <td key={col} className="px-4 py-3.5 whitespace-nowrap max-w-xs truncate">
                              {/* 1. User & Business / Company Names */}
                              {col === 'user_and_business' || col === 'company_name' || col === 'buyer_company_name' || col === 'supplier_company_name' || col === 'sender_company_name' ? (
                                <span className="font-bold text-slate-900 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg text-xs inline-flex items-center gap-1.5">
                                  <span>🏢</span> {strVal || 'Verified Business'}
                                </span>
                              ) : col === 'contact_person' || col === 'full_name' || col === 'buyer_person_name' || col === 'supplier_person_name' || col === 'sender_person_name' ? (
                                <span className="font-semibold text-slate-800 inline-flex items-center gap-1">
                                  <span>👤</span> {strVal || '-'}
                                </span>
                              ) : col === 'phone_number' || col === 'buyer_phone' || col === 'supplier_phone' || col === 'sender_phone' || col === 'corporate_phone' ? (
                                strVal && strVal !== '-' && strVal !== 'Not provided' ? (
                                  <a href={`tel:${strVal.replace(/[^0-9+]/g, '')}`} className="font-bold text-emerald-700 hover:underline inline-flex items-center gap-1 text-xs">
                                    <span>📞</span> {strVal}
                                  </a>
                                ) : (
                                  <span className="text-slate-400 italic">No phone</span>
                                )
                              ) : col === 'email' || col === 'registered_email' || col === 'buyer_email' || col === 'supplier_email' || col === 'sender_email' ? (
                                strVal && strVal !== '-' ? (
                                  <a href={`mailto:${strVal}`} className="font-semibold text-brand-600 hover:underline inline-flex items-center gap-1 text-xs font-mono">
                                    <span>✉️</span> {strVal}
                                  </a>
                                ) : (
                                  <span className="text-slate-400 italic">No email</span>
                                )
                              ) : col === 'products_added' ? (
                                <span className="font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg text-xs inline-flex items-center gap-1">
                                  <span>📦</span> {strVal}
                                </span>
                              ) : col === 'search_history' || col === 'search_query' || col === 'query' ? (
                                <span className="font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg text-xs inline-flex items-center gap-1">
                                  <span>🔍</span> {strVal}
                                </span>
                              ) : col === 'location' || col === 'destination' || col === 'warehouse_address' || col === 'buyer_location' || col === 'supplier_location' ? (
                                <span className="text-slate-700 text-xs inline-flex items-center gap-1">
                                  <span>📍</span> {strVal}
                                </span>
                              ) : col === 'gst_number' || col === 'buyer_gst' || col === 'supplier_gst' ? (
                                <span className="font-mono text-[11px] font-bold text-slate-800 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                                  GST: {strVal}
                                </span>
                              ) : col === 'role' || col === 'user_role' ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-indigo-100 text-indigo-800">
                                  {String(strVal).toUpperCase()}
                                </span>
                              ) : col === 'status' || col === 'order_status' || col === 'gst_status' ? (
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                  String(strVal).toLowerCase().includes('active') || String(strVal).toLowerCase().includes('verified') || String(strVal).toLowerCase().includes('approved')
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-slate-100 text-slate-700'
                                }`}>
                                  {String(strVal).toUpperCase()}
                                </span>
                              ) : (
                                <span>{strVal}</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="px-4 py-3.5 whitespace-nowrap text-right text-xs font-bold">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenModal(row)}
                              className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs cursor-pointer"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => handleDelete(row.id)}
                              className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs cursor-pointer"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit / Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black text-white">
                  {editingRecord ? `Edit ${activeTable} Record` : `Add New ${activeTable} Record`}
                </h3>
                <p className="text-slate-300 text-xs mt-0.5">Direct Live PostgreSQL synchronization</p>
              </div>
              <button onClick={handleCloseModal} className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {Object.keys(formData).map(key => (
                <div key={key}>
                  <label className="block text-slate-700 font-bold mb-1 uppercase tracking-wider text-[10px]">
                    {formatHeader(key)}
                  </label>
                  {(key === 'id' || key === 'created_at' || key === 'updated_at') ? (
                    <input
                      type="text"
                      disabled
                      value={formData[key]}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-slate-100 text-slate-500 font-mono text-xs cursor-not-allowed"
                    />
                  ) : (key === 'role' || key === 'user_role') ? (
                    <select
                      value={String(formData[key] || 'buyer').toLowerCase()}
                      onChange={(e) => setFormData({ ...formData, [key]: e.target.value.toLowerCase() })}
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:bg-white text-xs font-semibold text-slate-900 bg-white cursor-pointer"
                    >
                      <option value="buyer">Buyer</option>
                      <option value="supplier">Supplier</option>
                      <option value="both">Both (Buyer & Supplier)</option>
                      <option value="admin">Admin</option>
                    </select>
                  ) : (activeTable === 'users' && key === 'status') ? (
                    <select
                      value={String(formData[key] || 'active').toLowerCase()}
                      onChange={(e) => setFormData({ ...formData, [key]: e.target.value.toLowerCase() })}
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:bg-white text-xs font-semibold text-slate-900 bg-white cursor-pointer"
                    >
                      <option value="active">Active</option>
                      <option value="pending_verification">Pending Verification</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={formData[key]}
                      onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                      className="w-full border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:bg-white text-xs font-semibold text-slate-900"
                    />
                  )}
                </div>
              ))}
            </form>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md cursor-pointer"
              >
                {loading ? 'Saving...' : '✓ Save to Live Database'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
