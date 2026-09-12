"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import SalesOutreachModal from '@/components/admin/SalesOutreachModal';
import LocationCascadeSelector from '@/components/LocationCascadeSelector';

export default function AdminWarehouses() {
  const [warehouses, setWarehouses] = useState([]);
  const [metrics, setMetrics] = useState({
    totalProducts: 0,
    totalWarehouses: 0,
    uniqueStates: 0,
    totalInventoryUnits: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState('all');
  const [selectedSector, setSelectedSector] = useState('all');

  // Edit Modal State
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sales Outreach Modal
  const [outreachOpen, setOutreachOpen] = useState(false);
  const [outreachUser, setOutreachUser] = useState(null);
  const [outreachProduct, setOutreachProduct] = useState(null);

  const fetchWarehouses = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/warehouses');
      if (!res.ok) {
        if (res.status === 403) throw new Error('Forbidden: You do not have admin access.');
        throw new Error('Failed to fetch warehouses');
      }
      const data = await res.json();
      setWarehouses(data.warehouses || []);
      if (data.metrics) setMetrics(data.metrics);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const openEditModal = (item) => {
    setEditingItem(item);
    setEditForm({
      supplier_id: item.supplier_id,
      product_id: item.product_id,
      company_name: item.company_name,
      product_name: item.product_name,
      warehouse_address: item.warehouse_address || '',
      city: item.city === '-' ? '' : item.city,
      state: item.state === '-' ? '' : item.state,
      pincode: item.pincode || '',
      inventory_count: item.inventory_count || 0
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/warehouses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      if (!res.ok) throw new Error('Failed to update warehouse details');
      
      setEditingItem(null);
      fetchWarehouses();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openOutreach = (item) => {
    setOutreachUser({
      id: item.supplier_id,
      company_name: item.company_name,
      registered_email: item.registered_email,
      corporate_phone: item.corporate_phone,
      whatsapp_number: item.whatsapp_number,
      city: item.city,
      state: item.state
    });
    setOutreachProduct({
      id: item.product_id,
      title: item.product_name,
      base_price_per_unit: item.price_per_unit,
      unit_label: item.unit_label,
      bulk_minimum_order: item.moq
    });
    setOutreachOpen(true);
  };

  // Get distinct list of states & sectors
  const stateOptions = Array.from(new Set(warehouses.map(w => w.state).filter(s => s && s !== '-'))).sort();
  const sectorOptions = Array.from(new Set(warehouses.map(w => w.sector_name).filter(Boolean))).sort();

  // Filtered dataset
  const filteredWarehouses = warehouses.filter((item) => {
    if (selectedState !== 'all' && item.state?.toLowerCase() !== selectedState.toLowerCase()) return false;
    if (selectedSector !== 'all' && item.sector_name?.toLowerCase() !== selectedSector.toLowerCase()) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchProduct = item.product_name?.toLowerCase().includes(q);
      const matchCompany = item.company_name?.toLowerCase().includes(q);
      const matchAddress = item.warehouse_address?.toLowerCase().includes(q);
      const matchCity = item.city?.toLowerCase().includes(q);
      const matchState = item.state?.toLowerCase().includes(q);
      const matchEmail = item.registered_email?.toLowerCase().includes(q);
      const matchPhone = item.corporate_phone?.includes(q) || item.whatsapp_number?.includes(q);
      return matchProduct || matchCompany || matchAddress || matchCity || matchState || matchEmail || matchPhone;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-80 gap-3">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-brand-600 rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-slate-500">Loading supplier warehouse & product inventory...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-3xl mx-auto text-center bg-rose-50 text-rose-700 rounded-3xl border border-rose-200">
        <h3 className="text-xl font-bold mb-2">Access Denied</h3>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>🏬</span> Supplier Warehouses & Product Inventory
          </h2>
          <p className="text-slate-500 mt-1 text-sm">
            Complete mapping of all products listed on the platform with their verified supplier company names and exact physical warehouse addresses.
          </p>
        </div>
        <button
          onClick={fetchWarehouses}
          className="self-start sm:self-auto px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-2"
        >
          <span>🔄</span> Refresh Warehouses
        </button>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-800 text-white rounded-3xl p-5 shadow-lg shadow-blue-500/10">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-blue-100 text-xs font-bold uppercase tracking-wider">Total Products Mapped</div>
              <div className="text-3xl font-black mt-1">{metrics.totalProducts}</div>
            </div>
            <span className="p-2.5 rounded-2xl bg-white/15 text-white text-xl">📦</span>
          </div>
          <div className="mt-3 text-xs text-blue-100 font-medium">
            Active product listings with physical hubs
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">Active Warehouses</div>
              <div className="text-3xl font-black text-slate-900 mt-1">{metrics.totalWarehouses}</div>
            </div>
            <span className="p-2.5 rounded-2xl bg-slate-100 text-slate-700 text-xl">🏭</span>
          </div>
          <div className="mt-3 text-xs text-slate-500 font-medium">
            Verified supplier enterprise hubs
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">States Covered</div>
              <div className="text-3xl font-black text-emerald-600 mt-1">{metrics.uniqueStates}</div>
            </div>
            <span className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600 text-xl">📍</span>
          </div>
          <div className="mt-3 text-xs text-slate-500 font-medium">
            Pan-India supply chain presence
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Stock Count</div>
              <div className="text-3xl font-black text-amber-600 mt-1">
                {(metrics.totalInventoryUnits || 0).toLocaleString('en-IN')}
              </div>
            </div>
            <span className="p-2.5 rounded-2xl bg-amber-50 text-amber-600 text-xl">📊</span>
          </div>
          <div className="mt-3 text-xs text-slate-500 font-medium">
            Aggregated units in warehouse storage
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* State Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700">
            <span>📍 State:</span>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="bg-transparent text-slate-900 font-bold focus:outline-none cursor-pointer"
            >
              <option value="all">All States ({stateOptions.length})</option>
              {stateOptions.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          {/* Sector Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700">
            <span>🏷️ Sector:</span>
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="bg-transparent text-slate-900 font-bold focus:outline-none cursor-pointer"
            >
              <option value="all">All Sectors ({sectorOptions.length})</option>
              {sectorOptions.map((sec) => (
                <option key={sec} value={sec}>{sec}</option>
              ))}
            </select>
          </div>

          {(selectedState !== 'all' || selectedSector !== 'all' || searchTerm) && (
            <button
              onClick={() => {
                setSelectedState('all');
                setSelectedSector('all');
                setSearchTerm('');
              }}
              className="px-3 py-1.5 text-xs text-rose-600 hover:text-rose-800 font-bold hover:bg-rose-50 rounded-xl transition-colors"
            >
              ✕ Reset Filters
            </button>
          )}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-auto md:min-w-[280px]">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search product, company, warehouse address, phone..."
            className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <span className="absolute left-3 top-2.5 text-xs text-slate-400">🔍</span>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-2 text-xs text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Warehouse Inventory Master Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-bold">
                <th className="py-4 px-5">Product Details</th>
                <th className="py-4 px-5">Supplier & Company</th>
                <th className="py-4 px-5">Physical Warehouse Address</th>
                <th className="py-4 px-5">Supplier Contact</th>
                <th className="py-4 px-5 text-right">Price & MOQ</th>
                <th className="py-4 px-5 text-center">Stock</th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredWarehouses.map((item) => {
                const cleanPhone = (item.whatsapp_number || item.corporate_phone || '').replace(/[^0-9]/g, '');
                const mapQuery = encodeURIComponent([item.warehouse_address, item.city, item.state, item.pincode].filter(Boolean).join(', '));

                return (
                  <motion.tr
                    key={item.product_id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    {/* Product Details */}
                    <td className="py-4 px-5 max-w-[260px]">
                      <div className="flex items-center gap-3">
                        {item.hero_image_url ? (
                          <img
                            src={item.hero_image_url}
                            alt={item.product_name}
                            className="w-12 h-12 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-lg flex-shrink-0">
                            📦
                          </div>
                        )}
                        <div className="min-w-0">
                          <Link
                            href={`/directory/product/${item.product_id}`}
                            target="_blank"
                            className="font-extrabold text-slate-900 text-xs hover:text-brand-600 transition-colors block truncate"
                            title={item.product_name}
                          >
                            {item.product_name}
                          </Link>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span className="text-[10px] bg-brand-50 text-brand-700 font-bold px-1.5 py-0.5 rounded">
                              {item.sector_name}
                            </span>
                            {item.quality_grade && (
                              <span className="text-[10px] bg-slate-100 text-slate-600 font-medium px-1.5 py-0.5 rounded">
                                {item.quality_grade}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Company Name */}
                    <td className="py-4 px-5">
                      <div className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                        <span>{item.company_name}</span>
                        <span className="text-[10px] text-green-600 bg-green-50 px-1.5 py-0.2 rounded font-bold border border-green-200">
                          Verified
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        GST: {item.gst_number || 'N/A'}
                      </div>
                    </td>

                    {/* Warehouse Address */}
                    <td className="py-4 px-5 max-w-[280px]">
                      <div className="font-bold text-slate-900 text-xs flex items-start gap-1">
                        <span className="text-sm flex-shrink-0 mt-0.5">📍</span>
                        <span className="leading-snug">
                          {item.warehouse_address || `${item.city}, ${item.state}`}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium mt-1 pl-4">
                        {[item.city, item.state].filter(Boolean).join(', ')} {item.pincode ? `PIN: ${item.pincode}` : ''}
                      </div>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-bold mt-1.5 pl-4"
                      >
                        <span>🗺️</span> Open Google Map
                      </a>
                    </td>

                    {/* Supplier Contact */}
                    <td className="py-4 px-5">
                      <div className="text-xs font-semibold text-slate-700">{item.registered_email}</div>
                      <div className="flex items-center gap-2 mt-1.5">
                        {item.corporate_phone && (
                          <a
                            href={`tel:${item.corporate_phone}`}
                            className="text-[11px] font-bold text-slate-700 hover:text-brand-600 flex items-center gap-1"
                          >
                            📞 {item.corporate_phone}
                          </a>
                        )}
                        {cleanPhone && (
                          <a
                            href={`https://wa.me/91${cleanPhone.slice(-10)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] bg-green-50 text-green-700 font-bold px-2 py-0.5 rounded-lg hover:bg-green-100 transition-colors border border-green-200"
                          >
                            💬 WhatsApp
                          </a>
                        )}
                      </div>
                    </td>

                    {/* Price & MOQ */}
                    <td className="py-4 px-5 text-right whitespace-nowrap">
                      <div className="text-sm font-black text-slate-900">
                        ₹{item.price_per_unit.toLocaleString('en-IN')}
                        <span className="text-slate-400 font-normal text-xs">/{item.unit_label}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        MOQ: <span className="font-bold text-slate-700">{item.moq.toLocaleString('en-IN')} {item.unit_label}</span>
                      </div>
                    </td>

                    {/* Stock */}
                    <td className="py-4 px-5 text-center whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        item.inventory_count > 1000
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : item.inventory_count > 0
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {item.inventory_count.toLocaleString('en-IN')} {item.unit_label}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openOutreach(item)}
                          className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all active:scale-95 flex items-center gap-1"
                          title="Pitch deal via WhatsApp"
                        >
                          <span>⚡</span> Deal
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors flex items-center gap-1"
                          title="Edit Warehouse Address & Stock"
                        >
                          <span>✏️</span> Edit
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>

          {filteredWarehouses.length === 0 && (
            <div className="p-12 text-center text-slate-500">
              <div className="text-3xl mb-2">🏬</div>
              <div className="font-bold text-base text-slate-800">No warehouse records found</div>
              <p className="text-xs text-slate-500 mt-1">Try adjusting your state or search query filter.</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Warehouse & Inventory Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Edit Warehouse: {editingItem.company_name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update physical warehouse address and available inventory for {editingItem.product_name}.
                </p>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-slate-900 p-1 rounded-full"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  disabled
                  value={editForm.product_name}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Physical Warehouse / Factory Address
                </label>
                <textarea
                  rows={3}
                  value={editForm.warehouse_address}
                  onChange={(e) => setEditForm({ ...editForm, warehouse_address: e.target.value })}
                  placeholder="e.g. Plot No. 200, Ghatkopar Industrial Estate, Faridabad"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  required
                />
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <LocationCascadeSelector
                  state={editForm.state}
                  city={editForm.city}
                  village={editForm.village || ''}
                  customVillage={editForm.custom_village || ''}
                  pincode={editForm.pincode}
                  showPincode={true}
                  showFullAddressPreview={true}
                  onLocationChange={(loc) => {
                    setEditForm(prev => ({
                      ...prev,
                      state: loc.state,
                      city: loc.city,
                      village: loc.village,
                      custom_village: loc.customVillage,
                      pincode: loc.pincode,
                    }));
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Available Warehouse Stock ({editingItem.unit_label})
                </label>
                <input
                  type="number"
                  value={editForm.inventory_count}
                  onChange={(e) => setEditForm({ ...editForm, inventory_count: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-md shadow-brand-500/20 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Warehouse Details'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* WhatsApp Sales Outreach Modal */}
      {outreachOpen && outreachUser && (
        <SalesOutreachModal
          isOpen={outreachOpen}
          onClose={() => setOutreachOpen(false)}
          user={outreachUser}
          product={outreachProduct}
        />
      )}
    </div>
  );
}
