"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { STATIC_SECTORS } from '@/constants/sectors';

export default function AdminCatalog() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Full Edit Modal State
  const [editingProduct, setEditingProduct] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '',
    brand_name: '',
    model_no: '',
    sector_id: 'food-agriculture',
    description: '',
    base_price_per_unit: '',
    unit_label: 'kg',
    bulk_minimum_order: '1000',
    inventory_count: '5000',
    hsn_code: '',
    gst_percentage: '18',
    quality_grade: 'A Grade / Export Quality',
    packaging_type: 'Jute Bag / HDPE Bag',
    form_state: 'Solid',
    lead_time_days: '5',
    sample_available: 'Yes',
    hero_image_url: '',
    approval_status: 'approved',
    rejection_reason: '',
    location: {
      village: '',
      city: '',
      district: '',
      state: ''
    },
    custom_specs: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleProductImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, WebP)');
      return;
    }

    setUploadingImage(true);
    try {
      const data = new FormData();
      data.append('file', file);
      data.append('bucket', 'product-images');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: data,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to upload product image');
      }

      setEditForm(prev => ({
        ...prev,
        hero_image_url: json.secure_url || json.url,
      }));
    } catch (err) {
      console.error('Product image upload error:', err);
      alert(err.message || 'Image upload failed');
    } finally {
      setUploadingImage(false);
    }
  };

  const fetchCatalog = async () => {
    try {
      const res = await fetch('/api/admin/catalog');
      if (!res.ok) throw new Error('Failed to fetch catalog');
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCatalog(); }, []);

  const openEditModal = (product) => {
    setEditingProduct(product);

    // Extract specs
    let specs = product.technical_specifications || product.specifications || {};
    if (typeof specs === 'string') {
      try { specs = JSON.parse(specs); } catch (e) { specs = {}; }
    }

    const loc = specs.stock_yard_location || {};

    // Extract custom dynamic specs (everything not standard)
    const standardKeys = [
      'stock_yard_location', 'gst_percentage', 'Brand Name', 'Model / Style No',
      'Quality / Grade', 'Packaging Type', 'Physical Form', 'Fulfillment Lead Time',
      'Sample Offered', 'supplier_net_price', 'platform_commission_percent', 'platform_fee_per_unit'
    ];

    const customSpecsArr = [];
    Object.keys(specs).forEach(key => {
      if (!standardKeys.includes(key) && typeof specs[key] === 'string') {
        customSpecsArr.push({ key, value: specs[key] });
      }
    });

    if (customSpecsArr.length === 0) {
      customSpecsArr.push({ key: '', value: '' });
    }

    // Use supplier_net_price if available, otherwise reverse 3% commission to get raw base price
    const netBase = specs.supplier_net_price !== undefined 
      ? specs.supplier_net_price 
      : (product.base_price_per_unit ? (Number(product.base_price_per_unit) / 1.03).toFixed(2) : '');

    setEditForm({
      productId: product.id,
      title: product.title || '',
      brand_name: specs['Brand Name'] || '',
      model_no: specs['Model / Style No'] || '',
      sector_id: product.sector_id?.slug || product.sector_id?.id || 'food-agriculture',
      description: product.description || '',
      base_price_per_unit: netBase.toString(),
      unit_label: product.unit_label || product.unit_type || 'kg',
      bulk_minimum_order: (product.bulk_minimum_order || 1000).toString(),
      inventory_count: (product.inventory_count || 5000).toString(),
      hsn_code: product.hsn_code || '',
      gst_percentage: (specs.gst_percentage || '18').toString(),
      quality_grade: specs['Quality / Grade'] || product.quality_grade || 'A Grade / Export Quality',
      packaging_type: specs['Packaging Type'] || 'Jute Bag / HDPE Bag',
      form_state: specs['Physical Form'] || 'Solid',
      lead_time_days: (specs['Fulfillment Lead Time'] || '5').replace(/[^0-9]/g, '') || '5',
      sample_available: specs['Sample Offered'] || 'Yes',
      hero_image_url: product.hero_image_url || '',
      approval_status: product.approval_status || 'approved',
      rejection_reason: product.rejection_reason || '',
      location: {
        village: loc.village || '',
        city: loc.city || '',
        district: loc.district || '',
        state: loc.state || ''
      },
      custom_specs: customSpecsArr
    });
  };

  const closeEditModal = () => {
    setEditingProduct(null);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    if (['village', 'city', 'district', 'state'].includes(name)) {
      setEditForm(prev => ({
        ...prev,
        location: {
          ...prev.location,
          [name]: value
        }
      }));
    } else {
      setEditForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleCustomSpecChange = (index, field, value) => {
    const updated = [...editForm.custom_specs];
    updated[index][field] = value;
    setEditForm(prev => ({ ...prev, custom_specs: updated }));
  };

  const addCustomSpecRow = () => {
    setEditForm(prev => ({
      ...prev,
      custom_specs: [...prev.custom_specs, { key: '', value: '' }]
    }));
  };

  const removeCustomSpecRow = (index) => {
    const updated = editForm.custom_specs.filter((_, i) => i !== index);
    setEditForm(prev => ({ ...prev, custom_specs: updated }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/catalog', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update product');
      }
      
      closeEditModal();
      fetchCatalog(); // Refresh data
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (productId, status, reason = '') => {
    try {
      const res = await fetch('/api/admin/catalog', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, status, reason })
      });
      if (!res.ok) throw new Error('Failed to update product');
      fetchCatalog(); // refresh
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteProduct = async (productId, title = 'this product') => {
    if (!confirm(`Are you sure you want to permanently delete "${title}" from the catalog? This action cannot be undone.`)) return;
    try {
      setProducts(prev => prev.filter(p => p.id !== productId));
      if (editingProduct?.id === productId) closeEditModal();

      const res = await fetch(`/api/admin/catalog?id=${encodeURIComponent(productId)}`, {
        method: 'DELETE'
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        fetchCatalog();
        alert(data.error || 'Failed to delete product');
      }
    } catch (err) {
      fetchCatalog();
      alert('Error deleting product: ' + err.message);
    }
  };

  // Filtered products
  const filteredProducts = products.filter(p => {
    const matchesStatus = statusFilter === 'all' || p.approval_status === statusFilter;
    const matchesSearch = !searchTerm || 
      p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.users?.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.users?.registered_email?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Derived pricing for edit modal
  const basePriceNum = parseFloat(editForm.base_price_per_unit) || 0;
  const platformFeeNum = basePriceNum * 0.03;
  const taxableNum = basePriceNum + platformFeeNum;
  const gstRateNum = parseFloat(editForm.gst_percentage) || 0;
  const gstAmountNum = taxableNum * (gstRateNum / 100);
  const listedPriceNum = taxableNum + gstAmountNum;
  const lotValueNum = Math.round(listedPriceNum * (parseInt(editForm.bulk_minimum_order, 10) || 1));

  if (loading) return <div className="p-8 text-center text-slate-500 font-semibold">Loading catalog data...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Catalog Oversight</h2>
          <p className="text-slate-500 mt-1 text-sm">
            Review, edit full specifications, adjust 3% pricing, and approve or reject product listings globally.
          </p>
        </div>

        {/* Search & Filters */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <input 
            type="text" 
            placeholder="Search by title or supplier..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 w-full sm:w-64"
          />
          <select 
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl font-semibold border border-red-200">{error}</div>}

      {/* Catalog Table */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">Product Details & Specs</th>
                <th className="px-6 py-4">Supplier</th>
                <th className="px-6 py-4">Listed Price (Incl. 3% Fee)</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredProducts.map((product) => {
                let specs = product.technical_specifications || product.specifications || {};
                if (typeof specs === 'string') {
                  try { specs = JSON.parse(specs); } catch (e) { specs = {}; }
                }

                return (
                  <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 max-w-sm">
                      <div className="flex items-start gap-3">
                        {product.hero_image_url && (
                          <img 
                            src={product.hero_image_url} 
                            alt={product.title} 
                            className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0 mt-0.5" 
                          />
                        )}
                        <div>
                          <div className="font-extrabold text-slate-900">{product.title}</div>
                          <div className="text-xs text-slate-500 line-clamp-2 mt-0.5">{product.description}</div>
                          <div className="text-[11px] text-emerald-700 font-semibold mt-1">
                            {product.sector_id?.name || 'Sector'} • MOQ: {product.bulk_minimum_order || 1} {product.unit_label || 'units'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{product.users?.company_name || 'Supplier'}</div>
                      <div className="text-xs text-slate-500">{product.users?.registered_email}</div>
                      {product.users?.corporate_phone && (
                        <div className="text-xs text-slate-500">📞 {product.users.corporate_phone}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono">
                      <div className="font-extrabold text-emerald-600 text-base">
                        ₹{Number(product.base_price_per_unit).toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        / {product.unit_label || product.unit_type || 'kg'} (Incl. 3% Platform Fee)
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider inline-flex items-center gap-1
                        ${product.approval_status === 'approved' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                          product.approval_status === 'rejected' ? 'bg-red-100 text-red-800 border border-red-200' :
                          'bg-amber-100 text-amber-800 border border-amber-200'}`}
                      >
                        {product.approval_status || 'pending'}
                      </span>
                      {product.rejection_reason && (
                        <div className="text-xs text-red-500 mt-1 max-w-[160px] truncate" title={product.rejection_reason}>
                          Reason: {product.rejection_reason}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-2 justify-end items-center">
                        {product.approval_status === 'pending' && (
                          <>
                            <button 
                              onClick={() => handleStatusChange(product.id, 'approved')}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                            >
                              Approve
                            </button>
                            <button 
                              onClick={() => {
                                const reason = prompt("Enter reason for rejection:");
                                if (reason) handleStatusChange(product.id, 'rejected', reason);
                              }}
                              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {product.approval_status !== 'pending' && (
                          <button
                            onClick={() => handleStatusChange(product.id, 'pending')}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                          >
                            Reset Status
                          </button>
                        )}
                        <button 
                          onClick={() => openEditModal(product)}
                          className="px-3.5 py-1.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-extrabold transition-all shadow-sm cursor-pointer flex items-center gap-1"
                        >
                          <span>✏️ Edit Full Specs</span>
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id, product.title)}
                          className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                          title="Delete Product"
                        >
                          <span>🗑️</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-12 text-center text-slate-500">
                    No products matching your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comprehensive Full Specs Edit Modal (Same as Add Product Form) */}
      <AnimatePresence>
        {editingProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-gray-900/60 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl my-4 sm:my-8 overflow-hidden relative border border-gray-100 flex flex-col max-h-[92vh]"
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-slate-900 text-white shrink-0">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-full uppercase tracking-wider mb-1">
                    Admin Catalog Editor
                  </div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <span>✏️</span> Edit Product: {editingProduct.title}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Updates sync immediately with the main website directory, search indexes, and buyer quotes.
                  </p>
                </div>
                <button 
                  onClick={closeEditModal}
                  className="text-slate-400 hover:text-white transition-colors p-2 rounded-full hover:bg-slate-800 cursor-pointer text-xl font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Scrollable Form Body */}
              <form onSubmit={handleUpdate} className="p-6 sm:p-8 overflow-y-auto custom-scrollbar flex-1 space-y-8">
                
                {/* ── SECTION 1: BASIC COMMERCIAL DETAILS ── */}
                <div className="bg-slate-50/70 p-5 sm:p-6 rounded-2xl border border-slate-100 space-y-5">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-brand-600"></span> 1. Basic Commercial Details
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Product Title *</label>
                      <input 
                        type="text" 
                        name="title"
                        required
                        value={editForm.title}
                        onChange={handleFormChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none transition-all text-sm font-bold text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Trade Sector / Category *</label>
                      <select
                        name="sector_id"
                        value={editForm.sector_id}
                        onChange={handleFormChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none transition-all text-sm bg-white font-medium"
                      >
                        {STATIC_SECTORS.map(s => (
                          <option key={s.id || s.slug} value={s.slug}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Brand / Manufacturer Name</label>
                      <input 
                        type="text" 
                        name="brand_name"
                        placeholder="e.g. Aaudumbar Agro / Own Brand"
                        value={editForm.brand_name}
                        onChange={handleFormChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none transition-all text-sm font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Product Description & Trade Terms</label>
                    <textarea 
                      name="description"
                      rows="4"
                      placeholder="Provide details about quality grade, processing method, moisture content, or packaging specs..."
                      value={editForm.description}
                      onChange={handleFormChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none transition-all text-sm resize-none font-normal"
                    ></textarea>
                  </div>
                </div>

                {/* ── SECTION 2: PRICING, MOQ & TAXATION (WITH LIVE 3% PLATFORM FEE CALCULATION) ── */}
                <div className="bg-slate-50/70 p-5 sm:p-6 rounded-2xl border border-slate-100 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-600"></span> 2. Pricing, MOQ & Taxation
                    </h3>
                    <span className="text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 inline-flex items-center gap-1 w-fit">
                      🛡️ 3% Platform Fee Auto-Applied to Base
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                        Supplier Net Base Price (What Supplier Receives) *
                      </label>
                      <p className="text-[10px] text-gray-500 mb-2">Enter ex-factory price before 3% fee & tax.</p>
                      <div className="relative">
                        <span className="absolute left-4 top-3 text-gray-500 font-bold text-sm">₹</span>
                        <input 
                          type="number" 
                          name="base_price_per_unit"
                          required
                          min="0"
                          step="0.01"
                          placeholder="e.g. 200"
                          value={editForm.base_price_per_unit}
                          onChange={handleFormChange}
                          className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-emerald-600 text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Unit Label *</label>
                      <p className="text-[10px] text-gray-500 mb-2">Pricing unit of measurement.</p>
                      <select
                        name="unit_label"
                        value={editForm.unit_label}
                        onChange={handleFormChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none text-sm bg-white font-medium"
                      >
                        <option value="kg">kg (Kilogram)</option>
                        <option value="Quintal">Quintal (100 kg)</option>
                        <option value="Ton">Ton (1,000 kg)</option>
                        <option value="Piece">Piece / Unit</option>
                        <option value="Meter">Meter</option>
                        <option value="Litre">Litre</option>
                        <option value="Box">Box / Carton</option>
                        <option value="Set">Set / Kit</option>
                        <option value="Pack">Pack / Bundle</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Bulk Minimum Order (MOQ) *</label>
                      <p className="text-[10px] text-gray-500 mb-2">Minimum lot to order.</p>
                      <input 
                        type="number" 
                        name="bulk_minimum_order"
                        required
                        min="1"
                        placeholder="1000"
                        value={editForm.bulk_minimum_order}
                        onChange={handleFormChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none text-sm font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">HSN Code</label>
                      <input 
                        type="text" 
                        name="hsn_code"
                        placeholder="e.g. 09103020"
                        value={editForm.hsn_code}
                        onChange={handleFormChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none text-sm font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">GST Rate (%) *</label>
                      <select
                        name="gst_percentage"
                        value={editForm.gst_percentage}
                        onChange={handleFormChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none text-sm bg-white font-medium"
                      >
                        <option value="0">0% (Exempted)</option>
                        <option value="5">5% GST</option>
                        <option value="12">12% GST</option>
                        <option value="18">18% GST (Standard)</option>
                        <option value="28">28% GST</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Total Available Stock</label>
                      <input 
                        type="number" 
                        name="inventory_count"
                        min="0"
                        placeholder="50000"
                        value={editForm.inventory_count}
                        onChange={handleFormChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none text-sm font-medium"
                      />
                    </div>
                  </div>

                  {/* 3% Platform Fee & Live Commercial Calculation Card */}
                  <div className="mt-4 p-5 rounded-2xl bg-slate-900 text-white border border-slate-800 space-y-3.5 shadow-lg">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                          <span>🏷️</span> Live Pricing & Commission Calculation
                        </span>
                      </div>
                      <span className="text-[11px] bg-blue-500/20 text-blue-300 font-bold px-2.5 py-0.5 rounded-full border border-blue-500/30">
                        3% Platform Fee Model
                      </span>
                    </div>

                    {/* Breakdown Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                      <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/60">
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Supplier Net Base</span>
                        <span className="font-mono text-white font-bold text-sm sm:text-base">₹{basePriceNum.toFixed(2)}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Supplier Payout / {editForm.unit_label}</span>
                      </div>
                      <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/60">
                        <span className="text-blue-400 block text-[10px] uppercase font-semibold">+ 3% Platform Fee</span>
                        <span className="font-mono text-blue-400 font-bold text-sm sm:text-base">+ ₹{platformFeeNum.toFixed(2)}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">B2B India Platform Fee</span>
                      </div>
                      <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/60">
                        <span className="text-emerald-400 block text-[10px] uppercase font-semibold">+ GST ({gstRateNum}%)</span>
                        <span className="font-mono text-emerald-400 font-bold text-sm sm:text-base">
                          + ₹{gstAmountNum.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Applicable Tax</span>
                      </div>
                      <div className="bg-emerald-950/40 p-3 rounded-xl border border-emerald-600/40">
                        <span className="text-amber-400 block text-[10px] uppercase font-bold">Catalog Listed Price</span>
                        <span className="font-mono text-amber-400 font-extrabold text-base sm:text-lg">
                          ₹{listedPriceNum.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-slate-300 block mt-0.5">Buyer Sees (All-Inclusive)</span>
                      </div>
                    </div>

                    {/* Summary Bar */}
                    <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs text-slate-400 gap-2">
                      <div>
                        Total Order Value at MOQ ({editForm.bulk_minimum_order || 1} {editForm.unit_label}):{' '}
                        <strong className="text-white text-sm font-mono">
                          ₹{lotValueNum.toLocaleString('en-IN')}
                        </strong>
                      </div>
                      <div className="text-emerald-400 font-medium text-[11px] flex items-center gap-1">
                        <span>✓ 10% Advance Escrow Protected Trade</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── SECTION 3: TECHNICAL & PHYSICAL SPECIFICATIONS ── */}
                <div className="bg-slate-50/70 p-5 sm:p-6 rounded-2xl border border-slate-100 space-y-5">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-600"></span> 3. Technical & Physical Specifications
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Quality / Grade</label>
                      <input 
                        type="text" 
                        name="quality_grade"
                        placeholder="e.g. Export Quality / Double Polish / A Grade"
                        value={editForm.quality_grade}
                        onChange={handleFormChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none text-sm font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Packaging Type</label>
                      <input 
                        type="text" 
                        name="packaging_type"
                        placeholder="e.g. 50kg Jute Bag / HDPE Drums"
                        value={editForm.packaging_type}
                        onChange={handleFormChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none text-sm font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Physical Form / State</label>
                      <select
                        name="form_state"
                        value={editForm.form_state}
                        onChange={handleFormChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none text-sm bg-white font-medium"
                      >
                        <option value="Solid">Solid / Fingers / Raw</option>
                        <option value="Liquid">Liquid / Oil / Solution</option>
                        <option value="Powder">Powder / Dust / Micronized</option>
                        <option value="Granules">Granules / Pellets / Flakes</option>
                        <option value="Gas">Gas / Cylinder</option>
                        <option value="Other">Other Custom Format</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Fulfillment Lead Time (Days)</label>
                      <input 
                        type="number" 
                        name="lead_time_days"
                        min="1"
                        placeholder="5"
                        value={editForm.lead_time_days}
                        onChange={handleFormChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none text-sm font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Paid Sample Available?</label>
                      <select
                        name="sample_available"
                        value={editForm.sample_available}
                        onChange={handleFormChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none text-sm bg-white font-medium"
                      >
                        <option value="Yes">Yes (Sample Offered)</option>
                        <option value="No">No (Bulk Direct Only)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Model / Style No</label>
                      <input 
                        type="text" 
                        name="model_no"
                        placeholder="e.g. 1401 / STD-2026"
                        value={editForm.model_no}
                        onChange={handleFormChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none text-sm font-medium"
                      />
                    </div>
                  </div>

                  {/* Dynamic Custom Specs */}
                  <div className="pt-4 border-t border-slate-200 space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Custom Category Specifications (e.g. Processing Type, Grain Length, Moisture Content)
                      </label>
                      <button
                        type="button"
                        onClick={addCustomSpecRow}
                        className="text-xs font-bold text-brand-600 hover:text-brand-800 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <span>+ Add Attribute Row</span>
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {editForm.custom_specs.map((spec, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <input 
                            type="text" 
                            placeholder="Attribute Name (e.g. Grain Length)"
                            value={spec.key}
                            onChange={(e) => handleCustomSpecChange(index, 'key', e.target.value)}
                            className="w-1/2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500 outline-none font-medium"
                          />
                          <input 
                            type="text" 
                            placeholder="Value (e.g. Extra Long / Max 12.5%)"
                            value={spec.value}
                            onChange={(e) => handleCustomSpecChange(index, 'value', e.target.value)}
                            className="w-1/2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500 outline-none font-medium"
                          />
                          {editForm.custom_specs.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeCustomSpecRow(index)}
                              className="text-red-500 hover:text-red-700 p-2 text-base cursor-pointer"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ── SECTION 4: STOCKYARD / WAREHOUSE LOCATION ── */}
                <div className="bg-slate-50/70 p-5 sm:p-6 rounded-2xl border border-slate-100 space-y-5">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-600"></span> 4. Stockyard / Warehouse Location
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">City *</label>
                      <input 
                        type="text" 
                        name="city"
                        placeholder="e.g. Sangli / Navi Mumbai / Karnal"
                        value={editForm.location.city}
                        onChange={handleFormChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none text-sm font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">District</label>
                      <input 
                        type="text" 
                        name="district"
                        placeholder="e.g. Sangli / Karnal"
                        value={editForm.location.district}
                        onChange={handleFormChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none text-sm font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">State *</label>
                      <input 
                        type="text" 
                        name="state"
                        placeholder="e.g. Maharashtra / Haryana"
                        value={editForm.location.state}
                        onChange={handleFormChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none text-sm font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Village / APMC Market</label>
                      <input 
                        type="text" 
                        name="village"
                        placeholder="e.g. APMC Market Yard / Taraori"
                        value={editForm.location.village}
                        onChange={handleFormChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none text-sm font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* ── SECTION 5: PRODUCT IMAGE & APPROVAL STATUS ── */}
                <div className="bg-slate-50/70 p-5 sm:p-6 rounded-2xl border border-slate-100 space-y-5">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span> 5. Product Image & Approval Status
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Product Cover Image</label>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <label className={`cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                            uploadingImage ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-brand-50 text-brand-700 hover:bg-brand-100 border border-brand-200'
                          }`}>
                            <span>{uploadingImage ? '⏳ Uploading to Cloud...' : '📁 Upload Photo from Computer'}</span>
                            <input 
                              type="file" 
                              accept="image/png,image/jpeg,image/webp" 
                              onChange={handleProductImageUpload} 
                              disabled={uploadingImage} 
                              className="hidden" 
                            />
                          </label>
                          {editForm.hero_image_url && (
                            <button 
                              type="button" 
                              onClick={() => setEditForm(p => ({ ...p, hero_image_url: '' }))}
                              className="text-xs font-semibold text-rose-500 hover:text-rose-700"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        <input 
                          type="url" 
                          name="hero_image_url"
                          placeholder="OR paste Image URL (https://...)"
                          value={editForm.hero_image_url}
                          onChange={handleFormChange}
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none text-xs font-mono"
                        />
                        {editForm.hero_image_url && (
                          <div className="mt-2">
                            <img 
                              src={editForm.hero_image_url} 
                              alt="Preview" 
                              className="w-24 h-24 rounded-xl object-cover border border-slate-200 shadow-sm" 
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Listing Approval Status</label>
                        <select
                          name="approval_status"
                          value={editForm.approval_status}
                          onChange={handleFormChange}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none text-sm bg-white font-bold"
                        >
                          <option value="approved">Approved (Live on Marketplace)</option>
                          <option value="pending">Pending Review</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>

                      {editForm.approval_status === 'rejected' && (
                        <div>
                          <label className="block text-xs font-bold text-red-700 uppercase tracking-wider mb-2">Rejection Reason</label>
                          <input 
                            type="text" 
                            name="rejection_reason"
                            placeholder="e.g. Incomplete specifications or invalid HSN"
                            value={editForm.rejection_reason}
                            onChange={handleFormChange}
                            className="w-full px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-red-900 focus:ring-2 focus:ring-red-500 outline-none text-sm font-medium"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Modal Footer Buttons */}
                <div className="flex justify-between items-center gap-3 pt-4 border-t border-gray-200 shrink-0">
                  <button 
                    type="button"
                    onClick={() => handleDeleteProduct(editingProduct.id, editingProduct.title)}
                    className="px-4 py-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs sm:text-sm transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <span>🗑️</span> Delete Product
                  </button>
                  <div className="flex items-center gap-3">
                    <button 
                      type="button"
                      onClick={closeEditModal}
                      className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-sm transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50 flex items-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-95"
                    >
                      {isSubmitting ? 'Saving Specifications...' : '💾 Save & Publish to Main Website'}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
