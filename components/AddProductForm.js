"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { STATIC_SECTORS } from '@/constants/sectors';
import LocationCascadeSelector from '@/components/LocationCascadeSelector';
import { GST_SLABS } from '@/constants/gstSlabs';

export default function AddProductForm({ onClose, productToEdit = null }) {
  const isEditMode = !!productToEdit;

  const [loading, setLoading] = useState(false);
  const [sectors, setSectors] = useState(STATIC_SECTORS);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const getInitialCustomSpecs = (prod) => {
    if (!prod?.technical_specifications) return [{ key: '', value: '' }];
    const standardKeys = [
      'brand_name', 'model_no', 'packaging_type', 'form_state',
      'lead_time_days', 'sample_available', 'location', 'gst_percentage'
    ];
    const specs = [];
    Object.entries(prod.technical_specifications).forEach(([k, v]) => {
      if (!standardKeys.includes(k) && typeof v !== 'object') {
        specs.push({ key: k.replace(/_/g, ' '), value: String(v) });
      }
    });
    return specs.length > 0 ? specs : [{ key: '', value: '' }];
  };

  const [formData, setFormData] = useState({
    title: productToEdit?.title || '',
    brand_name: productToEdit?.technical_specifications?.brand_name || '',
    model_no: productToEdit?.technical_specifications?.model_no || '',
    sector_id: productToEdit?.sector_id?.slug || productToEdit?.sector_id?.id || productToEdit?.sector_id || 'food-agriculture',
    description: productToEdit?.description || '',
    base_price_per_unit: productToEdit?.base_price_per_unit !== undefined ? String(productToEdit.base_price_per_unit) : '',
    unit_label: productToEdit?.unit_label || 'kg',
    bulk_minimum_order: productToEdit?.bulk_minimum_order !== undefined ? String(productToEdit.bulk_minimum_order) : '1000',
    inventory_count: productToEdit?.inventory_count !== undefined ? String(productToEdit.inventory_count) : '5000',
    hsn_code: productToEdit?.hsn_code || '',
    gst_percentage: '18',
    quality_grade: productToEdit?.quality_grade || 'A Grade / Export Quality',
    packaging_type: productToEdit?.technical_specifications?.packaging_type || 'Jute Bag / HDPE Bag',
    form_state: productToEdit?.technical_specifications?.form_state || 'Solid',
    lead_time_days: productToEdit?.technical_specifications?.lead_time_days || '5',
    sample_available: productToEdit?.technical_specifications?.sample_available || 'Yes',
    hero_image_url: productToEdit?.hero_image_url || '',
    gallery_image_urls: productToEdit?.gallery_image_urls || [],
    location: {
      village: productToEdit?.technical_specifications?.location?.village || '',
      city: productToEdit?.technical_specifications?.location?.city || '',
      district: productToEdit?.technical_specifications?.location?.district || '',
      state: productToEdit?.technical_specifications?.location?.state || ''
    },
    custom_specs: getInitialCustomSpecs(productToEdit)
  });

  // Up to 5 product images state: { id, url, preview, isUploading }
  const [imageList, setImageList] = useState(() => {
    if (!productToEdit) return [];
    const images = [];
    if (productToEdit.hero_image_url) {
      images.push({
        id: 'hero-1',
        url: productToEdit.hero_image_url,
        preview: productToEdit.hero_image_url,
        isUploading: false
      });
    }
    if (Array.isArray(productToEdit.gallery_image_urls)) {
      productToEdit.gallery_image_urls.forEach((url, i) => {
        if (url && url !== productToEdit.hero_image_url) {
          images.push({
            id: `gallery-${i}`,
            url: url,
            preview: url,
            isUploading: false
          });
        }
      });
    }
    return images.slice(0, 5);
  });
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [categoryFeesMap, setCategoryFeesMap] = useState({});

  useEffect(() => {
    async function fetchSectorsAndSettings() {
      try {
        const [sectorsRes, settingsRes] = await Promise.all([
          fetch('/api/sectors').catch(() => null),
          fetch('/api/settings/public').catch(() => null)
        ]);

        if (sectorsRes && sectorsRes.ok) {
          const data = await sectorsRes.json();
          if (data.sectors && data.sectors.length > 0) {
            setSectors(data.sectors);
            if (!productToEdit) {
              setFormData(prev => ({ ...prev, sector_id: data.sectors[0].slug }));
            }
          }
        }

        if (settingsRes && settingsRes.ok) {
          const settingsData = await settingsRes.json();
          if (settingsData.settings?.category_platform_fees) {
            setCategoryFeesMap(settingsData.settings.category_platform_fees);
          }
        }
      } catch (err) {
        console.error('Failed to fetch sectors/settings, using static fallbacks', err);
      }
    }
    fetchSectorsAndSettings();
  }, [productToEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (['village', 'city', 'district', 'state'].includes(name)) {
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          [name]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // ── Custom Specifications Handling ──
  const handleCustomSpecChange = (index, field, value) => {
    const updated = [...formData.custom_specs];
    updated[index][field] = value;
    setFormData(prev => ({ ...prev, custom_specs: updated }));
  };

  const addCustomSpecRow = () => {
    setFormData(prev => ({
      ...prev,
      custom_specs: [...prev.custom_specs, { key: '', value: '' }]
    }));
  };

  const removeCustomSpecRow = (index) => {
    const updated = formData.custom_specs.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, custom_specs: updated }));
  };

  // ── Multi-Image handling (Max 5 Pictures) ──
  const processImageFiles = async (files) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);

    const currentCount = imageList.length;
    const availableSlots = 5 - currentCount;

    if (availableSlots <= 0) {
      setError('Maximum 5 pictures allowed per product listing.');
      return;
    }

    if (fileArray.length > availableSlots) {
      setError(`You can only add ${availableSlots} more image(s). Only the first ${availableSlots} will be uploaded.`);
    }

    const filesToProcess = fileArray.slice(0, availableSlots);
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

    for (const file of filesToProcess) {
      if (!validTypes.includes(file.type)) {
        setError(`Skipped ${file.name}: invalid file type (allowed JPEG, PNG, WebP, GIF)`);
        continue;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError(`Skipped ${file.name}: image exceeds 5MB size limit`);
        continue;
      }

      const tempId = Math.random().toString(36).substring(2, 9);
      const localPreview = URL.createObjectURL(file);

      setImageList(prev => {
        const nextList = [...prev, { id: tempId, url: '', preview: localPreview, isUploading: true }];
        return nextList.slice(0, 5);
      });

      try {
        const uploadData = new FormData();
        uploadData.append('file', file);
        uploadData.append('bucket', 'product-images');

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: uploadData,
        });

        if (!res.ok) {
          const errJson = await res.json();
          throw new Error(errJson.error || 'Upload failed');
        }

        const data = await res.json();
        setImageList(prev => prev.map(item => item.id === tempId ? { ...item, url: data.url, isUploading: false } : item));
      } catch (err) {
        console.error('Image upload failed', err);
        setError(`Failed to upload ${file.name}: ${err.message}`);
        setImageList(prev => prev.filter(item => item.id !== tempId));
      }
    }
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files) {
      processImageFiles(files);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files) {
      processImageFiles(files);
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    setImageList(prev => prev.filter((_, i) => i !== indexToRemove));
  };

  const handleSetCoverImage = (indexToCover) => {
    setImageList(prev => {
      if (indexToCover < 0 || indexToCover >= prev.length) return prev;
      const target = prev[indexToCover];
      const rest = prev.filter((_, i) => i !== indexToCover);
      return [target, ...rest];
    });
  };

  const handleAddCustomUrl = () => {
    if (!customUrlInput || !customUrlInput.trim()) return;
    const url = customUrlInput.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      setError('Please enter a valid HTTP or HTTPS image URL');
      return;
    }
    if (imageList.length >= 5) {
      setError('Maximum 5 pictures allowed per product listing.');
      return;
    }
    const tempId = Math.random().toString(36).substring(2, 9);
    setImageList(prev => [...prev, { id: tempId, url: url, preview: url, isUploading: false }]);
    setCustomUrlInput('');
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if any image is still uploading
    if (imageList.some(img => img.isUploading)) {
      setError('Please wait for all images to finish uploading.');
      return;
    }

    setLoading(true);
    setError(null);

    // Extract valid uploaded CDN URLs from imageList (prevent raw Base64 from ever reaching Supabase)
    const finalUrls = imageList
      .map(img => img.url)
      .filter(u => typeof u === 'string' && u.trim().length > 0 && !u.startsWith('data:image'));

    const payload = {
      ...(isEditMode ? { id: productToEdit.id } : {}),
      ...formData,
      hero_image_url: finalUrls[0] || formData.hero_image_url || '',
      gallery_image_urls: finalUrls.slice(0, 5),
    };

    try {
      const res = await fetch('/api/products', {
        method: isEditMode ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || (isEditMode ? 'Failed to update product' : 'Failed to add product'));
      }
      
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
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
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span>{isEditMode ? '✏️' : '🏭'}</span> {isEditMode ? 'Edit Product Listing' : 'List New B2B Product (IndiaMART Standard)'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isEditMode ? 'Update technical specifications, pricing, stock, and photos for your listing.' : 'Fill out specifications, pricing, stock, and location for buyers.'}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-2 rounded-full hover:bg-slate-800"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar flex-1 space-y-8">
          {success ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-5 animate-bounce">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              </div>
              <h3 className="text-3xl font-extrabold text-gray-900 mb-2">Product Successfully Listed!</h3>
              <p className="text-gray-500 max-w-md">Your product is now live in the B2B catalog with full technical specifications for verified buyers.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-semibold border border-red-100 flex items-center gap-3">
                  <span>⚠️</span> {error}
                </div>
              )}

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
                      placeholder="e.g. Turmeric Double Polish Fingers 100 Ton / 1121 Basmati Rice"
                      value={formData.title}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none transition-all text-sm font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Trade Sector / Category *</label>
                    <select
                      name="sector_id"
                      value={formData.sector_id}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none transition-all text-sm bg-white font-medium"
                    >
                      {sectors.map(s => (
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
                      value={formData.brand_name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none transition-all text-sm font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Product Description & Trade Terms</label>
                  <textarea 
                    name="description"
                    rows="3"
                    placeholder="Provide details about quality grade, processing method, moisture content, or packaging specs..."
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none transition-all text-sm resize-none"
                  ></textarea>
                </div>
              </div>

              {/* ── SECTION 2: PRICING, MOQ & TAXATION ── */}
              <div className="bg-slate-50/70 p-5 sm:p-6 rounded-2xl border border-slate-100 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span> 2. Pricing, MOQ & Taxation
                  </h3>
                  <span className="text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 inline-flex items-center gap-1 w-fit">
                    🛡️ 3% Platform Fee Charged on Base Price
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Your Base Price (What You Receive) *
                    </label>
                    <p className="text-[10px] text-gray-500 mb-2">Enter your net ex-factory price before 3% fee & tax.</p>
                    <div className="relative">
                      <span className="absolute left-4 top-3 text-gray-500 font-bold text-sm">₹</span>
                      <input 
                        type="number" 
                        name="base_price_per_unit"
                        required
                        min="0"
                        step="0.01"
                        placeholder="e.g. 200"
                        value={formData.base_price_per_unit}
                        onChange={handleChange}
                        className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none font-bold text-emerald-600 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Unit Label *</label>
                    <p className="text-[10px] text-gray-500 mb-2">Trade pricing unit of measurement.</p>
                    <select
                      name="unit_label"
                      value={formData.unit_label}
                      onChange={handleChange}
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
                    <p className="text-[10px] text-gray-500 mb-2">Minimum lot required to purchase.</p>
                    <input 
                      type="number" 
                      name="bulk_minimum_order"
                      required
                      min="1"
                      placeholder="1000"
                      value={formData.bulk_minimum_order}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none text-sm font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">HSN Code</label>
                    <input 
                      type="text" 
                      name="hsn_code"
                      placeholder="e.g. 09103020"
                      value={formData.hsn_code}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none text-sm font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">GST Rate (%) *</label>
                    <select
                      name="gst_percentage"
                      value={formData.gst_percentage}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none text-sm bg-white font-medium"
                    >
                      {GST_SLABS.map(slab => (
                        <option key={slab.rate} value={slab.rate}>
                          {slab.fullLabel}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Total Available Stock</label>
                    <input 
                      type="number" 
                      name="inventory_count"
                      min="0"
                      placeholder="50000"
                      value={formData.inventory_count}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none text-sm font-medium"
                    />
                  </div>
                </div>

                {/* Dynamic Category Platform Fee & Live Commercial Calculation Card */}
                {(() => {
                  const selectedSectorSlug = formData.sector_id || 'food-agriculture';
                  const categoryFeePercent = categoryFeesMap[selectedSectorSlug] !== undefined 
                    ? Number(categoryFeesMap[selectedSectorSlug]) 
                    : 3.0;
                  const categoryFeeDecimal = categoryFeePercent / 100;
                  const basePrice = parseFloat(formData.base_price_per_unit || 0);
                  const platformFeeAmount = basePrice * categoryFeeDecimal;
                  const priceWithFee = basePrice * (1 + categoryFeeDecimal);
                  const gstPercentage = parseFloat(formData.gst_percentage || 0);
                  const gstAmount = priceWithFee * (gstPercentage / 100);
                  const finalListedPrice = priceWithFee + gstAmount;
                  const moqCount = parseInt(formData.bulk_minimum_order, 10) || 1;
                  const totalMoqValue = Math.round(finalListedPrice * moqCount);

                  return (
                    <div className="mt-4 p-5 rounded-2xl bg-slate-900 text-white border border-slate-800 space-y-3.5 shadow-lg">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                            <span>🏷️</span> Live Pricing & Category Commission Calculation
                          </span>
                        </div>
                        <span className="text-[11px] bg-blue-500/20 text-blue-300 font-bold px-2.5 py-0.5 rounded-full border border-blue-500/30">
                          {categoryFeePercent}% Platform Fee ({sectors.find(s => s.slug === selectedSectorSlug)?.name || selectedSectorSlug})
                        </span>
                      </div>

                      {/* Policy banner */}
                      <div className="bg-slate-800/90 rounded-xl p-3 border border-slate-700/80 text-xs text-slate-300 flex items-start gap-2.5">
                        <span className="text-base">📢</span>
                        <div>
                          <strong>Category Fee Notice:</strong> A <strong>{categoryFeePercent}% platform fee</strong> applies for this category. Your product is listed in the wholesale catalog with this {categoryFeePercent}% fee added (+ GST), ensuring your net payout of <strong>₹{basePrice.toFixed(2)} / {formData.unit_label}</strong> is 100% protected.
                        </div>
                      </div>

                      {/* Breakdown Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                        <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/60">
                          <span className="text-slate-400 block text-[10px] uppercase font-semibold">Your Net Base Rate</span>
                          <span className="font-mono text-white font-bold text-sm sm:text-base">₹{basePrice.toFixed(2)}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">What you receive / {formData.unit_label}</span>
                        </div>
                        <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/60">
                          <span className="text-blue-400 block text-[10px] uppercase font-semibold">+ {categoryFeePercent}% Category Fee</span>
                          <span className="font-mono text-blue-400 font-bold text-sm sm:text-base">+ ₹{platformFeeAmount.toFixed(2)}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">B2B India Platform Fee</span>
                        </div>
                        <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/60">
                          <span className="text-emerald-400 block text-[10px] uppercase font-semibold">+ GST ({formData.gst_percentage}%)</span>
                          <span className="font-mono text-emerald-400 font-bold text-sm sm:text-base">
                            + ₹{gstAmount.toFixed(2)}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">Applicable Tax</span>
                        </div>
                        <div className="bg-emerald-950/40 p-3 rounded-xl border border-emerald-600/40">
                          <span className="text-amber-400 block text-[10px] uppercase font-bold">Catalog Listed Price</span>
                          <span className="font-mono text-amber-400 font-extrabold text-base sm:text-lg">
                            ₹{finalListedPrice.toFixed(2)}
                          </span>
                          <span className="text-[10px] text-slate-300 block mt-0.5">Buyer Sees (All-Inclusive)</span>
                        </div>
                      </div>

                      {/* Summary Bar */}
                      <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs text-slate-400 gap-2">
                        <div>
                          Total Order Value at MOQ ({formData.bulk_minimum_order || 1} {formData.unit_label}):{' '}
                          <strong className="text-white text-sm font-mono">
                            ₹{totalMoqValue.toLocaleString('en-IN')}
                          </strong>
                        </div>
                        <div className="text-emerald-400 font-semibold flex items-center gap-1 text-[11px]">
                          <span>🛡️</span> 100% Escrow & Dock Inspection Guaranteed
                        </div>
                      </div>
                    </div>
                  );
                })()}
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
                      value={formData.quality_grade}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none text-sm font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Packaging Type</label>
                    <input 
                      type="text" 
                      name="packaging_type"
                      placeholder="e.g. 50kg Jute Bag / HDPE Drums"
                      value={formData.packaging_type}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none text-sm font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Physical Form / State</label>
                    <select
                      name="form_state"
                      value={formData.form_state}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none text-sm bg-white font-medium"
                    >
                      <option value="Solid">Solid / Fingers / Raw</option>
                      <option value="Powder">Powder</option>
                      <option value="Liquid">Liquid / Solvent</option>
                      <option value="Granules">Granules / Pellets</option>
                      <option value="Fabric">Fabric / Textile</option>
                      <option value="Component">Machinery / Part</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Fulfillment Lead Time (Days)</label>
                    <input 
                      type="number" 
                      name="lead_time_days"
                      placeholder="5"
                      value={formData.lead_time_days}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none text-sm font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Paid Sample Available?</label>
                    <select
                      name="sample_available"
                      value={formData.sample_available}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none text-sm bg-white font-medium"
                    >
                      <option value="Yes">Yes (Sample Offered)</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                </div>

                {/* Dynamic Custom Specs (e.g. Curcumin Content: 2.5%, Purity: 99%, Voltage: 415V) */}
                <div className="pt-3 border-t border-slate-200">
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Custom Category Specifications (e.g. Curcumin 2.5%, Purity 99%, Voltage 415V)
                    </label>
                    <button
                      type="button"
                      onClick={addCustomSpecRow}
                      className="text-xs font-bold text-brand-600 hover:text-brand-800 bg-brand-50 px-3 py-1.5 rounded-lg border border-brand-200"
                    >
                      + Add Attribute Row
                    </button>
                  </div>

                  <div className="space-y-3">
                    {formData.custom_specs.map((spec, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <input 
                          type="text" 
                          placeholder="Attribute Name (e.g. Curcumin Content)"
                          value={spec.key}
                          onChange={(e) => handleCustomSpecChange(idx, 'key', e.target.value)}
                          className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                        />
                        <input 
                          type="text" 
                          placeholder="Value (e.g. 2.5% / 99% Pure)"
                          value={spec.value}
                          onChange={(e) => handleCustomSpecChange(idx, 'value', e.target.value)}
                          className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                        />
                        {formData.custom_specs.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeCustomSpecRow(idx)}
                            className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── SECTION 4: STOCKYARD / ORIGIN LOCATION ── */}
              <div className="bg-slate-50/70 p-5 sm:p-6 rounded-2xl border border-slate-100 space-y-4">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-600"></span> 4. Stockyard / Origin Location
                </h3>

                <LocationCascadeSelector
                  state={formData.location.state}
                  city={formData.location.city}
                  village={formData.location.village}
                  customVillage={formData.location.customVillage || ''}
                  showFullAddressPreview={true}
                  labels={{
                    state: 'Origin State *',
                    city: 'Origin City / District *',
                    village: 'Origin Village / Taluka / APMC Mandi *',
                    customVillage: 'Enter Custom Village / Farm Location *',
                  }}
                  onLocationChange={(loc) => {
                    setFormData(prev => ({
                      ...prev,
                      location: {
                        ...prev.location,
                        state: loc.state,
                        city: loc.city,
                        district: loc.city,
                        village: loc.finalVillage,
                        customVillage: loc.customVillage,
                      }
                    }));
                  }}
                />
              </div>

              {/* ── SECTION 5: PRODUCT MEDIA UPLOAD (UP TO 5 PICTURES) ── */}
              <div className="bg-slate-50/70 p-5 sm:p-6 rounded-2xl border border-slate-100 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span> 5. Product Pictures & Gallery (Max 5 Photos)
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${
                      imageList.length === 5 
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                        : imageList.length > 0
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'bg-gray-100 text-gray-600 border border-gray-200'
                    }`}>
                      📸 {imageList.length} / 5 Photos Added
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed">
                  Upload up to 5 high-resolution photos of your product from different angles (packaging, material texture, factory stockyard). The first image will be your <strong>Main Catalogue Cover Photo</strong>.
                </p>

                {/* Uploaded Images Grid */}
                {imageList.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-1">
                    {imageList.map((item, idx) => (
                      <div 
                        key={item.id || idx} 
                        className={`relative rounded-xl overflow-hidden bg-white border-2 aspect-square flex flex-col group shadow-sm transition-all ${
                          idx === 0 
                            ? 'border-brand-500 ring-2 ring-brand-500/20' 
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <img 
                          src={item.preview || item.url} 
                          alt={`Product photo ${idx + 1}`} 
                          className="w-full h-full object-cover"
                        />

                        {/* Uploading Overlay */}
                        {item.isUploading && (
                          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white p-2">
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mb-1" />
                            <span className="text-[10px] font-semibold">Uploading...</span>
                          </div>
                        )}

                        {/* Badges & Actions */}
                        <div className="absolute top-1.5 left-1.5 right-1.5 flex items-center justify-between pointer-events-none">
                          {idx === 0 ? (
                            <span className="bg-brand-600 text-white text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded shadow-md pointer-events-auto">
                              ⭐ Cover
                            </span>
                          ) : (
                            <span className="bg-black/60 backdrop-blur-xs text-white text-[9px] font-medium px-1.5 py-0.5 rounded">
                              #{idx + 1}
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleRemoveImage(idx); }}
                            className="bg-red-500 hover:bg-red-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs shadow-md transition-colors pointer-events-auto"
                            title="Remove this photo"
                          >
                            ✕
                          </button>
                        </div>

                        {/* Set as Cover button for non-cover images */}
                        {idx > 0 && !item.isUploading && (
                          <button
                            type="button"
                            onClick={() => handleSetCoverImage(idx)}
                            className="absolute bottom-0 inset-x-0 bg-slate-900/80 hover:bg-brand-600 text-white text-[10px] font-bold py-1 text-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-xs"
                          >
                            Set as Cover
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Drag & Drop Upload Zone (if < 5 images) */}
                {imageList.length < 5 && (
                  <div 
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
                      isDragging ? 'border-brand-500 bg-brand-50/50' : 'border-gray-300 hover:border-brand-400 bg-white'
                    }`}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      multiple
                      className="hidden"
                    />

                    <div className="space-y-2">
                      <div className="w-12 h-12 bg-brand-50 text-brand-600 rounded-full flex items-center justify-center mx-auto text-2xl">
                        📸
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-800">
                          Click to select photos or drag & drop here
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Upload up to {5 - imageList.length} more photo{5 - imageList.length > 1 ? 's' : ''} (PNG, JPG, WebP • Max 5MB each)
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Direct Image URL input helper */}
                {imageList.length < 5 && (
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <label className="block text-xs font-semibold text-gray-600">
                      OR add photo by web URL:
                    </label>
                    <div className="flex gap-2">
                      <input 
                        type="url" 
                        placeholder="https://images.unsplash.com/... or CDN link"
                        value={customUrlInput}
                        onChange={(e) => setCustomUrlInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomUrl(); } }}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomUrl}
                        className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-colors whitespace-nowrap"
                      >
                        + Add Photo URL
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold shadow-lg shadow-brand-500/25 transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50 text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {isEditMode ? 'Saving Changes...' : 'Publishing Product...'}
                    </>
                  ) : (
                    <>{isEditMode ? '✓ Save Changes' : '🚀 Publish B2B Listing'}</>
                  )}
                </button>
              </div>

            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
