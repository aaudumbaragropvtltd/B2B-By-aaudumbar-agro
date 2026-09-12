"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import LocationCascadeSelector from '@/components/LocationCascadeSelector';
import { GST_SLABS } from '@/constants/gstSlabs';
import { STATIC_SECTORS } from '@/constants/sectors';

export default function SmartRFQForm({ onClose, productId = null, rfqToEdit = null }) {
  const isEditMode = !!rfqToEdit;
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Extract contact metadata from notes if present in rfqToEdit
  let initialGst = '';
  let initialPhone = '';
  let initialAltPhone = '';
  let initialGstRate = rfqToEdit?.gst_rate ? String(rfqToEdit.gst_rate) : '18';
  let initialNotes = rfqToEdit?.notes || '';
  let initialSector = rfqToEdit?.sector || rfqToEdit?.category || rfqToEdit?.sector_slug || 'food-agriculture';

  if (rfqToEdit?.notes && rfqToEdit.notes.includes('<!--CONTACT_META:')) {
    try {
      const match = rfqToEdit.notes.match(/<!--CONTACT_META:(.*?)-->/);
      if (match && match[1]) {
        const meta = JSON.parse(match[1]);
        if (meta.gst) initialGst = meta.gst;
        if (meta.phone) initialPhone = meta.phone;
        if (meta.alt_phone) initialAltPhone = meta.alt_phone;
        if (meta.gst_rate !== undefined) initialGstRate = String(meta.gst_rate);
        if (meta.sector || meta.category) initialSector = meta.sector || meta.category;
      }
      initialNotes = rfqToEdit.notes.replace(/<!--CONTACT_META:.*?-->/g, '').trim();
    } catch (e) {}
  }

  const [formData, setFormData] = useState({
    product: rfqToEdit?.product_name || rfqToEdit?.commodity || '',
    sector: initialSector,
    quantity: rfqToEdit?.quantity ? String(rfqToEdit.quantity) : '',
    unit: rfqToEdit?.unit || 'Tons',
    targetPrice: rfqToEdit?.target_price ? String(rfqToEdit.target_price) : '',
    deadline: rfqToEdit?.deadline ? new Date(rfqToEdit.deadline).toISOString().split('T')[0] : '',
    destinationState: '',
    destinationCity: '',
    destinationVillage: '',
    destinationCustomVillage: '',
    destinationFacility: '',
    destination: rfqToEdit?.destination || '',
    notes: initialNotes,
    buyerEmail: rfqToEdit?.buyer_email || '',
    buyerPhone: rfqToEdit?.buyer_phone || initialPhone || '',
    buyerAlternatePhone: rfqToEdit?.buyer_alternate_phone || initialAltPhone || '',
    buyerGst: initialGst || '',
    gstRate: initialGstRate || '18',
  });

  const [errorMsg, setErrorMsg] = useState('');

  // Auto-fill buyer contact & GST info from database profile and load category platform fees
  useEffect(() => {
    if (!isEditMode) {
      fetch('/api/dashboard/profile')
        .then(res => res.json())
        .then(data => {
          if (data?.profile) {
            setFormData(prev => ({
              ...prev,
              buyerEmail: prev.buyerEmail || data.profile.registered_email || '',
              buyerPhone: prev.buyerPhone || data.profile.corporate_phone || data.profile.phone || '',
              buyerGst: prev.buyerGst || data.profile.gst_number || '',
              destination: prev.destination || data.profile.warehouse_address || (data.profile.city ? `${data.profile.city}, ${data.profile.state}` : '')
            }));
          }
        })
        .catch(err => console.warn('Could not prefill RFQ buyer profile:', err.message));
    }
  }, [isEditMode]);

  const handleNext = () => { setErrorMsg(''); setStep(prev => prev + 1); };
  const handleBack = () => { setErrorMsg(''); setStep(prev => prev - 1); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const payload = {
        ...(isEditMode ? { id: rfqToEdit.id } : {}),
        productName: formData.product,
        sector: formData.sector,
        category: formData.sector,
        quantity: parseInt(formData.quantity, 10),
        unit: formData.unit,
        targetPrice: parseFloat(formData.targetPrice),
        destination: formData.destination,
        deadline: formData.deadline || null,
        notes: formData.notes,
        buyerEmail: formData.buyerEmail,
        buyerPhone: formData.buyerPhone,
        buyerAlternatePhone: formData.buyerAlternatePhone,
        buyerGst: formData.buyerGst,
        gstRate: Number(formData.gstRate) || 18,
        catalogProductId: productId
      };

      const response = await fetch('/api/rfq', {
        method: isEditMode ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        if (response.status === 401) {
          throw new Error('Please log in to save requirement.');
        }
        throw new Error(errorData?.error || (isEditMode ? 'Failed to update RFQ' : 'Failed to submit RFQ'));
      }
      
      setStep(4);
    } catch (error) {
      console.error(error);
      setErrorMsg(error.message || 'Error saving RFQ. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white text-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden relative max-h-[90vh] overflow-y-auto"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 transition-colors z-10 cursor-pointer"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex flex-col md:flex-row">
          {/* Sidebar Progress */}
          <div className="w-full md:w-1/3 bg-slate-900 text-white p-6 md:p-8">
            <h2 className="text-xl font-bold mb-6 md:mb-8">{isEditMode ? '✏️ Edit RFQ' : 'Smart RFQ'}</h2>
            <ul className="space-y-4 md:space-y-6">
              {[
                { num: 1, label: 'Commodity Details' },
                { num: 2, label: 'Logistics & Contact' },
                { num: 3, label: 'Review' }
              ].map(item => (
                <li key={item.num} className="flex items-center gap-3">
                  <span className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-colors ${
                    step >= item.num ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-500'
                  }`}>
                    {step > item.num ? '✓' : item.num}
                  </span>
                  <span className={`text-sm font-medium ${step >= item.num ? 'text-white' : 'text-slate-500'}`}>
                    {item.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Form Content */}
          <div className="w-full md:w-2/3 p-6 md:p-8 text-slate-900">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">
                    {isEditMode ? 'Edit Commodity Details' : 'What do you need?'}
                  </h3>
                  <div className="space-y-5">
                    {/* Sector / Category Dropdown */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Industry Category / Sector <span className="text-red-500 font-bold">*</span>
                      </label>
                      <select 
                        value={formData.sector}
                        onChange={e => setFormData({...formData, sector: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-semibold cursor-pointer"
                      >
                        {STATIC_SECTORS.map((sector) => (
                          <option key={sector.slug} value={sector.slug} className="text-slate-900 bg-white">
                            {sector.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Product Name / Commodity <span className="text-red-500 font-bold">*</span>
                      </label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. Basmati Rice 1121 or TMT Steel Bars"
                        value={formData.product}
                        onChange={e => setFormData({...formData, product: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-semibold"
                      />
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Quantity <span className="text-red-500 font-bold">*</span>
                        </label>
                        <input 
                          type="number" 
                          required
                          placeholder="e.g. 500"
                          value={formData.quantity}
                          onChange={e => setFormData({...formData, quantity: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-semibold"
                        />
                      </div>
                      <div className="w-1/3">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Unit <span className="text-red-500 font-bold">*</span>
                        </label>
                        <select 
                          value={formData.unit}
                          onChange={e => setFormData({...formData, unit: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-semibold cursor-pointer"
                        >
                          <option value="Tons" className="text-slate-900 bg-white">Tons</option>
                          <option value="Quintals" className="text-slate-900 bg-white">Quintals</option>
                          <option value="Kg" className="text-slate-900 bg-white">Kg</option>
                          <option value="Units" className="text-slate-900 bg-white">Units</option>
                          <option value="Pieces" className="text-slate-900 bg-white">Pieces</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="mt-8 flex justify-end">
                    <button 
                      onClick={handleNext}
                      disabled={!formData.product || !formData.quantity}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Continue
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Logistics, Contact & GST</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Target Price (Per {formData.unit})</label>
                      <div className="relative">
                        <span className="absolute left-4 top-3.5 text-gray-500 font-bold">₹</span>
                        <input 
                          type="number" 
                          placeholder="e.g. 8500"
                          value={formData.targetPrice}
                          onChange={e => setFormData({...formData, targetPrice: e.target.value})}
                          className="w-full pl-8 pr-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-semibold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Your Email</label>
                        <input 
                          type="email" 
                          placeholder="name@company.com"
                          value={formData.buyerEmail}
                          onChange={e => setFormData({...formData, buyerEmail: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">WhatsApp / Phone</label>
                        <input 
                          type="tel" 
                          placeholder="+91 9876543210"
                          value={formData.buyerPhone}
                          onChange={e => setFormData({...formData, buyerPhone: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm font-semibold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Alternate Phone (Optional)</label>
                        <input 
                          type="tel" 
                          placeholder="+91 9123456780"
                          value={formData.buyerAlternatePhone}
                          onChange={e => setFormData({...formData, buyerAlternatePhone: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center justify-between">
                          <span>GST Number / GSTIN</span>
                          {formData.buyerGst && <span className="text-emerald-600 font-bold text-[10px]">✓ Profile Saved</span>}
                        </label>
                        <input 
                          type="text" 
                          maxLength={15}
                          placeholder="e.g. 27AAAAA0000A1Z5"
                          value={formData.buyerGst}
                          onChange={e => setFormData({...formData, buyerGst: e.target.value.toUpperCase()})}
                          className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-mono font-semibold text-sm uppercase"
                        />
                      </div>
                    </div>

                    {/* GST Category Selection */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                        <span>
                          Applicable GST Category / Rate Slab <span className="text-red-500 font-bold">*</span>
                        </span>
                        <span className="text-blue-600 font-semibold text-[11px] normal-case">Suppliers can adjust if incorrect</span>
                      </label>
                      <select
                        value={formData.gstRate}
                        onChange={e => setFormData({...formData, gstRate: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-semibold text-sm cursor-pointer shadow-sm"
                      >
                        {GST_SLABS.map(slab => (
                          <option key={slab.rate} value={slab.rate}>
                            {slab.fullLabel}
                          </option>
                        ))}
                      </select>
                      <p className="text-[11px] text-slate-500 mt-1">
                        💡 <em>Select your estimated GST slab (0%, 0.25%, 3%, 5%, 18%, 40%). If the commodity falls into another tax bracket, quoting suppliers can adjust this rate directly in their proposal.</em>
                      </p>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                      <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-2">
                        <span>📍</span> Delivery Destination Territory &amp; Location
                      </div>

                      <LocationCascadeSelector
                        state={formData.destinationState}
                        city={formData.destinationCity}
                        village={formData.destinationVillage}
                        customVillage={formData.destinationCustomVillage}
                        showFullAddressPreview={true}
                        labels={{
                          state: 'Delivery State *',
                          city: 'Delivery City / District *',
                          village: 'Village / Taluka / Mandi Area *',
                          customVillage: 'Enter Custom Village / Yard Name *',
                        }}
                        onLocationChange={(loc) => {
                          const facility = formData.destinationFacility || '';
                          const formatted = [facility, loc.formattedAddress].filter(Boolean).join(', ');
                          setFormData(prev => ({
                            ...prev,
                            destinationState: loc.state,
                            destinationCity: loc.city,
                            destinationVillage: loc.village,
                            destinationCustomVillage: loc.customVillage,
                            destination: formatted || loc.formattedAddress,
                          }));
                        }}
                      />

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Facility / Warehouse / Port Name (Optional)
                        </label>
                        <input
                          type="text"
                          value={formData.destinationFacility}
                          onChange={(e) => {
                            const facility = e.target.value;
                            const villagePart = formData.destinationCustomVillage || formData.destinationVillage;
                            const territory = [villagePart, formData.destinationCity, formData.destinationState].filter(Boolean).join(', ');
                            const formatted = [facility, territory].filter(Boolean).join(', ');
                            setFormData(prev => ({
                              ...prev,
                              destinationFacility: facility,
                              destination: formatted,
                            }));
                          }}
                          placeholder="e.g. Plot No. 12, APMC Yard / Logistics Hub"
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Needed By Date</label>
                      <input 
                        type="date" 
                        value={formData.deadline}
                        onChange={e => setFormData({...formData, deadline: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-semibold cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="mt-8 flex justify-between">
                    <button onClick={handleBack} className="px-6 py-3 text-gray-600 font-medium hover:text-gray-900 cursor-pointer">Back</button>
                    <button 
                      onClick={handleNext}
                      disabled={!formData.targetPrice || !formData.destination || !formData.buyerEmail || !formData.buyerPhone}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Review RFQ
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">
                    {isEditMode ? 'Review & Save Changes' : 'Review & Broadcast'}
                  </h3>
                  <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 mb-6">
                    <div className="grid grid-cols-2 gap-y-3.5 text-xs sm:text-sm">
                      <div>
                        <span className="block text-blue-600/70 font-semibold mb-0.5">Product</span>
                        <span className="font-bold text-gray-900">{formData.product}</span>
                      </div>
                      <div>
                        <span className="block text-blue-600/70 font-semibold mb-0.5">Industry Sector</span>
                        <span className="font-bold text-slate-900">
                          {STATIC_SECTORS.find(s => s.slug === formData.sector)?.name || formData.sector}
                        </span>
                      </div>
                      <div>
                        <span className="block text-blue-600/70 font-semibold mb-0.5">Quantity</span>
                        <span className="font-bold text-gray-900">{formData.quantity} {formData.unit}</span>
                      </div>
                      <div>
                        <span className="block text-blue-600/70 font-semibold mb-0.5">Target Price</span>
                        <span className="font-bold text-emerald-600">₹{formData.targetPrice} / {formData.unit}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="block text-blue-600/70 font-semibold mb-0.5">Applicable GST Slab</span>
                        <span className="font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-lg text-xs">
                          {formData.gstRate}% GST (Supplier Modifiable)
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="block text-blue-600/70 font-semibold mb-0.5">Delivery Destination</span>
                        <span className="font-bold text-gray-900">{formData.destination}</span>
                      </div>
                      <div className="col-span-2 pt-2 border-t border-blue-200/60 grid grid-cols-3 gap-2">
                        <div>
                          <span className="block text-blue-600/70 font-semibold mb-0.5">Email</span>
                          <span className="font-bold text-gray-900 truncate block">{formData.buyerEmail}</span>
                        </div>
                        <div>
                          <span className="block text-blue-600/70 font-semibold mb-0.5">Phone Contact</span>
                          <span className="font-bold text-gray-900 block">
                            {formData.buyerPhone} {formData.buyerAlternatePhone ? `(Alt: ${formData.buyerAlternatePhone})` : ''}
                          </span>
                        </div>
                        <div>
                          <span className="block text-blue-600/70 font-semibold mb-0.5">GSTIN Number</span>
                          <span className="font-mono font-bold text-gray-900 block">
                            {formData.buyerGst || 'Not Specified'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Additional Notes (Optional)</label>
                    <textarea 
                      rows="3"
                      value={formData.notes}
                      onChange={e => setFormData({...formData, notes: e.target.value})}
                      placeholder="e.g. Export quality packaging required..."
                      className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none font-medium"
                    ></textarea>
                  </div>

                  {errorMsg && (
                    <div className="mb-4 p-3.5 bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-xl flex items-center gap-2">
                      <svg className="w-5 h-5 flex-shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <div className="mt-8 flex justify-between">
                    <button onClick={handleBack} className="px-6 py-3 text-gray-600 font-medium hover:text-gray-900 cursor-pointer">Back</button>
                    <button 
                      onClick={handleSubmit}
                      disabled={loading}
                      className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors shadow-lg shadow-slate-900/20 disabled:opacity-50 cursor-pointer flex items-center gap-2"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>{isEditMode ? 'Saving...' : 'Broadcasting...'}</span>
                        </>
                      ) : (
                        <span>{isEditMode ? '✓ Save Changes' : 'Broadcast to Suppliers'}</span>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div key="step4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                    ✓
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {isEditMode ? 'Requirement Updated!' : 'Requirement Broadcasted!'}
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto text-sm">
                    {isEditMode 
                      ? `Your RFQ for ${formData.product} has been updated successfully.` 
                      : `Your RFQ for ${formData.product} (${formData.quantity} ${formData.unit}) has been broadcasted to verified suppliers across India.`}
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                      href="/dashboard/rfqs"
                      onClick={onClose}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-md text-sm"
                    >
                      View in RFQ Dashboard
                    </Link>
                    <button
                      onClick={onClose}
                      className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-xl transition-colors text-sm cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
