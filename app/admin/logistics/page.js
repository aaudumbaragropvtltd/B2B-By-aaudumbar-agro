"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminLogisticsPage() {
  const [logistics, setLogistics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState('all'); // 'all' | 'deliver' | 'pickup'
  const [statusFilter, setStatusFilter] = useState('all');

  // Edit / Details Modal State
  const [selectedItem, setSelectedItem] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  
  // Toast
  const [toast, setToast] = useState(null);
  const showToast = (msg, isErr = false) => {
    setToast({ text: msg, isErr });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchLogistics = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/logistics');
      if (!res.ok) throw new Error('Failed to load logistics data');
      const data = await res.json();
      setLogistics(data.logistics || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogistics();
  }, []);

  // Filter valid completed shipments only
  const validLogistics = useMemo(() => {
    return logistics.filter(item => {
      const isFailedOrCancelled = ['cancelled', 'payment_failed', 'quotation_issued', 'unpaid', 'failed'].includes(item.dispatch_status);
      return !isFailedOrCancelled;
    });
  }, [logistics]);

  // Filtered list
  const filteredLogistics = useMemo(() => {
    return validLogistics.filter(item => {
      if (methodFilter !== 'all' && item.delivery_option !== methodFilter) return false;
      if (statusFilter !== 'all' && item.dispatch_status !== statusFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          (item.order_id || '').toLowerCase().includes(q) ||
          (item.tracking_number || '').toLowerCase().includes(q) ||
          (item.product_name || '').toLowerCase().includes(q) ||
          (item.buyer_company || '').toLowerCase().includes(q) ||
          (item.receiver_name || '').toLowerCase().includes(q) ||
          (item.vehicle_number || '').toLowerCase().includes(q) ||
          (item.p1_name || '').toLowerCase().includes(q) ||
          (item.transporter_name || '').toLowerCase().includes(q) ||
          (item.delivery_address || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [validLogistics, methodFilter, statusFilter, searchTerm]);

  // Metrics KPI calculations
  const totalShipments = validLogistics.length;
  const deliveryCount = validLogistics.filter(l => l.delivery_option === 'deliver').length;
  const pickupCount = validLogistics.filter(l => l.delivery_option === 'pickup').length;
  const inTransitCount = validLogistics.filter(l => l.dispatch_status === 'in_transit' || l.dispatch_status === 'out_for_delivery').length;
  const deliveredCount = validLogistics.filter(l => l.dispatch_status === 'delivered' || l.dispatch_status === 'collected' || l.dispatch_status === 'settled').length;

  const openDetails = (item) => {
    setSelectedItem(item);
    setIsEditing(false);
    setEditForm({
      id: item.id,
      delivery_option: item.delivery_option || 'deliver',
      tracking_number: item.tracking_number || '',
      dispatch_status: item.dispatch_status || 'confirmed',
      transporter_name: item.transporter_name || '',
      delivery_address: item.delivery_address || '',
      receiver_name: item.receiver_name || '',
      receiver_phone: item.receiver_phone || '',
      vehicle_number: item.vehicle_number || '',
      delivery_date: item.delivery_date || '',
      arrival_date: item.arrival_date || '',
      p1_name: item.p1_name || '',
      p1_phone: item.p1_phone || '',
      p1_aadhar: item.p1_aadhar || '',
      notes: item.notes || ''
    });
  };

  const openEditWithMode = (item, targetMode) => {
    setSelectedItem(item);
    setIsEditing(true);
    const isTargetPickup = targetMode === 'pickup';
    setEditForm({
      id: item.id,
      delivery_option: targetMode,
      tracking_number: isTargetPickup
        ? (item.tracking_number?.startsWith('AWB-') ? `GATE-PASS-2026-${String(item.id).slice(-4)}` : (item.tracking_number || `GATE-PASS-2026-${String(item.id).slice(-4)}`))
        : (item.tracking_number?.startsWith('GATE-PASS') ? `AWB-IND-${String(item.id).slice(-6)}` : (item.tracking_number || `AWB-IND-${String(item.id).slice(-6)}`)),
      dispatch_status: item.dispatch_status || 'confirmed',
      transporter_name: item.transporter_name || (isTargetPickup ? '' : 'B2B Express Freight Fleet'),
      delivery_address: item.delivery_address || '',
      receiver_name: item.receiver_name || item.buyer_company || '',
      receiver_phone: item.receiver_phone || '',
      vehicle_number: item.vehicle_number || (isTargetPickup ? 'MH-12-TR-9420' : ''),
      delivery_date: item.delivery_date || '7 business days',
      arrival_date: item.arrival_date || new Date().toISOString().split('T')[0],
      p1_name: item.p1_name || item.receiver_name || '',
      p1_phone: item.p1_phone || item.receiver_phone || '',
      p1_aadhar: item.p1_aadhar || '',
      notes: item.notes || ''
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/logistics', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      if (!res.ok) throw new Error('Failed to update logistics details');
      
      showToast('✓ Logistics details updated successfully');
      setLogistics(prev => prev.map(item => item.id === editForm.id ? { ...item, ...editForm } : item));
      if (selectedItem?.id === editForm.id) {
        setSelectedItem(prev => ({ ...prev, ...editForm }));
      }
      setIsEditing(false);
    } catch (err) {
      showToast(err.message || 'Error updating details', true);
    } finally {
      setIsSaving(false);
    }
  };

  const quickStatusUpdate = async (item, newStatus) => {
    try {
      const res = await fetch('/api/admin/logistics', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, dispatch_status: newStatus })
      });
      if (!res.ok) throw new Error('Status update failed');
      showToast(`✓ Order status changed to ${newStatus.replace(/_/g, ' ')}`);
      setLogistics(prev => prev.map(l => l.id === item.id ? { ...l, dispatch_status: newStatus } : l));
    } catch (err) {
      showToast(err.message, true);
    }
  };

  return (
    <div className="space-y-7 max-w-7xl mx-auto">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-2 ${
              toast.isErr ? 'bg-red-600 text-white' : 'bg-slate-900 text-emerald-400 border border-emerald-500/30'
            }`}
          >
            <span>{toast.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-extrabold rounded-full mb-2">
            <span>🚚</span> Fleet & Fulfillment Command Center
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Logistics, Shipments & Gate Pass Manager
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Live pan-India dispatch oversight, factory delivery AWB tracking, driver & vehicle KYC verification, and warehouse gate passes.
          </p>
        </div>

        <button
          onClick={fetchLogistics}
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-all flex items-center gap-2 self-start md:self-auto cursor-pointer"
        >
          <span>🔄</span> Refresh Fleet Data
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Shipments</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{totalShipments}</span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Active trade contracts</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-blue-100 bg-blue-50/20 shadow-sm">
          <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">Factory Delivery</span>
          <span className="text-2xl font-black text-blue-800 mt-1 block">{deliveryCount}</span>
          <span className="text-[10px] text-blue-600 mt-0.5 block">Direct site transit</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-amber-100 bg-amber-50/20 shadow-sm">
          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Self Pickup Passes</span>
          <span className="text-2xl font-black text-amber-800 mt-1 block">{pickupCount}</span>
          <span className="text-[10px] text-amber-600 mt-0.5 block">Warehouse gate passes</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-purple-100 bg-purple-50/20 shadow-sm">
          <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">In Transit Fleet</span>
          <span className="text-2xl font-black text-purple-800 mt-1 block">{inTransitCount}</span>
          <span className="text-[10px] text-purple-600 mt-0.5 block">En route to buyer</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-emerald-100 bg-emerald-50/20 shadow-sm col-span-2 lg:col-span-1">
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Delivered / Completed</span>
          <span className="text-2xl font-black text-emerald-800 mt-1 block">{deliveredCount}</span>
          <span className="text-[10px] text-emerald-600 mt-0.5 block">Escrow 90% cleared</span>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-96">
          <span className="absolute left-3.5 top-3 text-slate-400">🔍</span>
          <input 
            type="text" 
            placeholder="Search by Order ID, AWB, Gate Pass, Vehicle, Buyer, Driver..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600">✕</button>
          )}
        </div>

        {/* Method & Status Switchers */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button 
              onClick={() => setMethodFilter('all')} 
              className={`px-3 py-1.5 rounded-lg transition-all ${methodFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              All Types
            </button>
            <button 
              onClick={() => setMethodFilter('deliver')} 
              className={`px-3 py-1.5 rounded-lg transition-all ${methodFilter === 'deliver' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              🚚 Delivery
            </button>
            <button 
              onClick={() => setMethodFilter('pickup')} 
              className={`px-3 py-1.5 rounded-lg transition-all ${methodFilter === 'pickup' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              🏭 Self-Pickup
            </button>
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none cursor-pointer"
          >
            <option value="all">All Dispatch Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="warehouse_loading">🏭 Warehouse Loading</option>
            <option value="ready_for_pickup">🏢 Ready for Pickup</option>
            <option value="in_transit">🚚 In Transit</option>
            <option value="out_for_delivery">📦 Out for Delivery</option>
            <option value="collected">✅ Collected (Self-Pickup)</option>
            <option value="delivered">✅ Delivered (Direct Delivery)</option>
            <option value="settled">✓ Settled & Complete</option>
          </select>
        </div>
      </div>

      {/* Logistics Shipments Cards Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-500">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
          Loading fleet and shipment records...
        </div>
      ) : filteredLogistics.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
          <span className="text-4xl block mb-2">📦</span>
          <h3 className="text-base font-bold text-slate-900">No Logistics Shipments Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchTerm ? "No shipments matched your search criteria." : "As buyers confirm logistics or warehouse pickups after escrow clearance, they appear here."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredLogistics.map(item => {
            const isPickup = item.delivery_option === 'pickup';
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all p-5 flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 mb-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 ${
                      isPickup ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-blue-100 text-blue-800 border border-blue-200'
                    }`}>
                      <span>{isPickup ? '🏭 Self Warehouse Pickup' : '🚚 Factory Delivery'}</span>
                    </span>
                    <span className="font-mono text-[11px] font-bold text-slate-500">
                      {item.order_id}
                    </span>
                  </div>

                  {/* Product & Quantity */}
                  <h3 className="font-bold text-slate-900 text-sm line-clamp-1 mb-1">
                    {item.product_name}
                  </h3>
                  <div className="text-xs font-semibold text-emerald-700 mb-3">
                    {Number(item.quantity).toLocaleString('en-IN')} {item.unit} • ₹{Number(item.total_amount).toLocaleString('en-IN')} Total Deal
                  </div>

                  {/* Key Logistics Specs */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-2 mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[10px] uppercase font-bold">
                        {isPickup ? 'Gate Pass Number' : 'Tracking AWB'}
                      </span>
                      <span className="font-mono font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {item.tracking_number}
                      </span>
                    </div>

                    {isPickup ? (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 text-[10px] uppercase font-bold">Vehicle No</span>
                          <span className="font-mono font-bold text-slate-800">{item.vehicle_number || 'Pending'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 text-[10px] uppercase font-bold">Driver / Visitor</span>
                          <span className="font-bold text-slate-800 truncate max-w-[140px]">{item.p1_name || 'Driver Designated'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 text-[10px] uppercase font-bold">Arrival Date</span>
                          <span className="font-bold text-amber-700">{item.arrival_date || 'Scheduled'}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 text-[10px] uppercase font-bold">Transporter</span>
                          <span className="font-bold text-slate-800 truncate max-w-[140px]">{item.transporter_name || 'B2B Logistics Fleet'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 text-[10px] uppercase font-bold">Consignee</span>
                          <span className="font-bold text-slate-800 truncate max-w-[140px]">{item.receiver_name || item.buyer_company}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 text-[10px] uppercase font-bold">Delivery Date</span>
                          <span className="font-bold text-blue-700">{item.delivery_date || 'Standard Lead Time'}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Destination / Address preview */}
                  <div className="text-[11px] text-slate-500 line-clamp-1 mb-3">
                    📍 <strong>{isPickup ? 'Pickup:' : 'Ship To:'}</strong> {item.delivery_address || 'Central Warehouse, Maharashtra'}
                  </div>
                </div>

                {/* Status Switcher & Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <select
                      value={item.dispatch_status}
                      onChange={e => quickStatusUpdate(item, e.target.value)}
                      className={`text-[11px] font-extrabold px-2.5 py-1.5 rounded-lg border outline-none cursor-pointer ${
                        item.dispatch_status === 'delivered' || item.dispatch_status === 'collected' || item.dispatch_status === 'settled' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                        item.dispatch_status === 'in_transit' || item.dispatch_status === 'out_for_delivery' ? 'bg-blue-50 text-blue-800 border-blue-300' :
                        item.dispatch_status === 'warehouse_loading' ? 'bg-purple-50 text-purple-800 border-purple-300' :
                        item.dispatch_status === 'ready_for_pickup' ? 'bg-amber-50 text-amber-800 border-amber-300' :
                        'bg-slate-100 text-slate-800 border-slate-300'
                      }`}
                    >
                      <option value="confirmed">● Confirmed</option>
                      <option value="warehouse_loading">● 🏭 Warehouse Loading</option>
                      <option value="ready_for_pickup">● 🏢 Ready for Pickup</option>
                      <option value="in_transit">● 🚚 In Transit</option>
                      <option value="out_for_delivery">● 📦 Out for Delivery</option>
                      <option value="collected">● ✅ Collected</option>
                      <option value="delivered">● ✅ Delivered</option>
                      <option value="settled">● ✓ Settled</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => openEditWithMode(item, isPickup ? 'deliver' : 'pickup')}
                      className={`text-[10px] font-extrabold px-2 py-1.5 rounded-lg border cursor-pointer transition-all ${
                        isPickup
                          ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                          : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                      }`}
                      title={isPickup ? 'Switch shipment to Pan-India Direct Delivery' : 'Switch shipment to Central Godown Self-Pickup'}
                    >
                      {isPickup ? '🔄 To Delivery' : '🔄 To Pickup'}
                    </button>
                  </div>

                  <button
                    onClick={() => openDetails(item)}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <span>🔍</span> Details
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Details & Edit Modal */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 my-auto"
            >
              {/* Modal Header */}
              <div className="px-6 py-5 bg-slate-900 text-white flex justify-between items-center">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-blue-500/20 text-blue-300 text-xs font-bold rounded-full uppercase tracking-wider mb-1">
                    {selectedItem.delivery_option === 'pickup' ? '🏭 Warehouse Gate Pass' : '🚚 Factory Delivery Docket'}
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold">
                    Logistics Dossier: {selectedItem.order_id}
                  </h2>
                </div>
                <button onClick={() => setSelectedItem(null)} className="text-slate-400 hover:text-white p-2 rounded-full cursor-pointer">✕</button>
              </div>

              {/* Modal Body */}
              <div className="p-6 sm:p-7 space-y-5 max-h-[75vh] overflow-y-auto">
                {!isEditing ? (
                  <>
                    {/* Trade & Consignee Summary */}
                    <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                      <div>
                        <span className="text-slate-400 uppercase font-bold text-[10px] block">Buyer Company</span>
                        <span className="font-extrabold text-slate-900 text-sm">{selectedItem.buyer_company}</span>
                        <span className="text-slate-500 block">{selectedItem.buyer_email}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 uppercase font-bold text-[10px] block">Supplier Company</span>
                        <span className="font-extrabold text-slate-900 text-sm">{selectedItem.supplier_company}</span>
                        <span className="text-slate-500 block">Dispatch Hub</span>
                      </div>
                    </div>

                    {/* KYC Driver & Vehicle Details (For Pickup) */}
                    {selectedItem.delivery_option === 'pickup' && (
                      <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl text-xs space-y-3">
                        <span className="font-extrabold text-amber-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                          <span>🪪</span> Authorized Vehicle & Visitor KYC Details
                        </span>
                        <div className="grid grid-cols-2 gap-2 text-slate-800">
                          <div>
                            <span className="text-slate-500 text-[10px] uppercase font-bold block">Vehicle Number:</span>
                            <span className="font-mono font-extrabold text-slate-900 text-sm">{selectedItem.vehicle_number || 'Pending'}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 text-[10px] uppercase font-bold block">Arrival Date:</span>
                            <span className="font-bold text-amber-900">{selectedItem.arrival_date || 'Immediate'}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 text-[10px] uppercase font-bold block">Primary Visitor (P1):</span>
                            <span className="font-bold">{selectedItem.p1_name} ({selectedItem.p1_phone})</span>
                            <span className="text-[10px] font-mono text-slate-500 block">Aadhar: {selectedItem.p1_aadhar || 'Verified'}</span>
                          </div>
                          {selectedItem.p2_name && (
                            <div>
                              <span className="text-slate-500 text-[10px] uppercase font-bold block">Secondary Visitor (P2):</span>
                              <span className="font-bold">{selectedItem.p2_name} ({selectedItem.p2_phone})</span>
                              <span className="text-[10px] font-mono text-slate-500 block">Aadhar: {selectedItem.p2_aadhar || 'Verified'}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Delivery & Transporter Details */}
                    {selectedItem.delivery_option === 'deliver' && (
                      <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl text-xs space-y-3">
                        <span className="font-extrabold text-blue-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                          <span>🚛</span> Transporter & Delivery Address
                        </span>
                        <div className="space-y-1.5 text-slate-800">
                          <div>
                            <span className="text-slate-500 text-[10px] uppercase font-bold block">Destination Address:</span>
                            <span className="font-bold text-slate-900">{selectedItem.delivery_address}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-blue-200/60">
                            <div>
                              <span className="text-slate-500 text-[10px] uppercase font-bold block">Consignee Contact:</span>
                              <span className="font-bold">{selectedItem.receiver_name} ({selectedItem.receiver_phone})</span>
                            </div>
                            <div>
                              <span className="text-slate-500 text-[10px] uppercase font-bold block">Transporter Fleet:</span>
                              <span className="font-bold">{selectedItem.transporter_name}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedItem.notes && (
                      <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 italic border-l-2 border-slate-400">
                        "{selectedItem.notes}"
                      </div>
                    )}

                    <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 flex-wrap">
                      {selectedItem.delivery_option === 'pickup' ? (
                        <button
                          type="button"
                          onClick={() => openEditWithMode(selectedItem, 'deliver')}
                          className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>🔄</span> Switch to Direct Delivery
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openEditWithMode(selectedItem, 'pickup')}
                          className="px-4 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>🔄</span> Switch to Godown Pickup
                        </button>
                      )}
                      <button
                        onClick={() => setIsEditing(true)}
                        className="px-5 py-2.5 bg-slate-900 hover:bg-black text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                      >
                        <span>✏️</span> Edit Fleet & Mode Details
                      </button>
                    </div>
                  </>
                ) : (
                  <form onSubmit={handleUpdate} className="space-y-4 text-xs">
                    {/* Fulfillment Mode Toggle */}
                    <div>
                      <label className="block font-bold text-slate-700 mb-1.5 uppercase text-[10px] tracking-wider">
                        Fulfillment / Delivery Mode
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setEditForm(prev => ({
                            ...prev,
                            delivery_option: 'deliver',
                            tracking_number: prev.tracking_number?.startsWith('GATE-PASS') ? `AWB-IND-${String(prev.id).slice(-6)}` : (prev.tracking_number || `AWB-IND-${String(prev.id).slice(-6)}`),
                            transporter_name: prev.transporter_name || 'B2B Express Freight Fleet',
                            delivery_address: prev.delivery_address || selectedItem?.delivery_address || 'Destination Warehouse Address',
                            delivery_date: prev.delivery_date || '7 business days'
                          }))}
                          className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            editForm.delivery_option === 'deliver'
                              ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          🚚 Pan-India Direct Delivery
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditForm(prev => ({
                            ...prev,
                            delivery_option: 'pickup',
                            tracking_number: prev.tracking_number?.startsWith('AWB-') ? `GATE-PASS-2026-${String(prev.id).slice(-4)}` : (prev.tracking_number || `GATE-PASS-2026-${String(prev.id).slice(-4)}`),
                            vehicle_number: prev.vehicle_number || 'MH-12-TR-9420',
                            arrival_date: prev.arrival_date || new Date().toISOString().split('T')[0],
                            p1_name: prev.p1_name || editForm.receiver_name || selectedItem?.buyer_company || 'Designated Driver',
                            p1_phone: prev.p1_phone || editForm.receiver_phone || '+91-9890000000'
                          }))}
                          className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            editForm.delivery_option === 'pickup'
                              ? 'bg-purple-600 border-purple-600 text-white shadow-sm'
                              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          🏢 Central Godown Pickup
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px]">
                          {editForm.delivery_option === 'pickup' ? 'Gate Pass Number' : 'Tracking AWB Number'}
                        </label>
                        <input 
                          type="text" 
                          value={editForm.tracking_number}
                          onChange={e => setEditForm({ ...editForm, tracking_number: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px]">
                          Dispatch Status
                        </label>
                        <select
                          value={editForm.dispatch_status}
                          onChange={e => setEditForm({ ...editForm, dispatch_status: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                          <option value="confirmed">Confirmed</option>
                          <option value="warehouse_loading">🏭 Warehouse Loading</option>
                          <option value="ready_for_pickup">🏢 Ready for Pickup</option>
                          <option value="in_transit">🚚 In Transit</option>
                          <option value="out_for_delivery">📦 Out for Delivery</option>
                          <option value="collected">✅ Collected (Self-Pickup Complete)</option>
                          <option value="delivered">✅ Delivered (Direct Delivery Complete)</option>
                          <option value="settled">✓ Settled & Complete</option>
                        </select>
                      </div>
                    </div>

                    {/* Direct Delivery Fields */}
                    {editForm.delivery_option === 'deliver' && (
                      <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-3">
                        <div className="text-[11px] font-extrabold uppercase text-blue-900 flex items-center gap-1.5">
                          <span>🚚</span> Direct Delivery & Dispatch Address
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px]">
                            Destination Delivery Address
                          </label>
                          <input 
                            type="text" 
                            value={editForm.delivery_address || ''}
                            onChange={e => setEditForm({ ...editForm, delivery_address: e.target.value })}
                            placeholder="Complete factory/godown destination address"
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px]">
                              Consignee / Receiver Name
                            </label>
                            <input 
                              type="text" 
                              value={editForm.receiver_name || ''}
                              onChange={e => setEditForm({ ...editForm, receiver_name: e.target.value })}
                              placeholder="Name of contact person"
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px]">
                              Receiver Phone Number
                            </label>
                            <input 
                              type="tel" 
                              value={editForm.receiver_phone || ''}
                              onChange={e => setEditForm({ ...editForm, receiver_phone: e.target.value })}
                              placeholder="+91-XXXXXXXXXX"
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px]">
                              Transporter / Carrier
                            </label>
                            <input 
                              type="text" 
                              value={editForm.transporter_name || ''}
                              onChange={e => setEditForm({ ...editForm, transporter_name: e.target.value })}
                              placeholder="e.g. VRL Logistics, Delhivery"
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px]">
                              Estimated Delivery Date
                            </label>
                            <input 
                              type="text" 
                              value={editForm.delivery_date || ''}
                              onChange={e => setEditForm({ ...editForm, delivery_date: e.target.value })}
                              placeholder="e.g. 5-7 business days"
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Godown Self-Pickup Fields */}
                    {editForm.delivery_option === 'pickup' && (
                      <div className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-3">
                        <div className="text-[11px] font-extrabold uppercase text-purple-900 flex items-center gap-1.5">
                          <span>🏢</span> Central Godown Self-Pickup & Driver Verification
                        </div>
                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px]">
                              Godown Arrival Date
                            </label>
                            <input 
                              type="text" 
                              value={editForm.arrival_date || ''}
                              onChange={e => setEditForm({ ...editForm, arrival_date: e.target.value })}
                              placeholder="YYYY-MM-DD or schedule date"
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-purple-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px]">
                              Vehicle / Truck Number
                            </label>
                            <input 
                              type="text" 
                              value={editForm.vehicle_number || ''}
                              onChange={e => setEditForm({ ...editForm, vehicle_number: e.target.value })}
                              placeholder="e.g. MH 12 AB 1234"
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold uppercase text-slate-900 bg-white focus:ring-2 focus:ring-purple-500 outline-none"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px]">
                              Driver Name (P1)
                            </label>
                            <input 
                              type="text" 
                              value={editForm.p1_name || ''}
                              onChange={e => setEditForm({ ...editForm, p1_name: e.target.value })}
                              placeholder="Driver Full Name"
                              className="w-full px-2.5 py-2 rounded-xl border border-slate-300 font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-purple-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px]">
                              Driver Phone
                            </label>
                            <input 
                              type="tel" 
                              value={editForm.p1_phone || ''}
                              onChange={e => setEditForm({ ...editForm, p1_phone: e.target.value })}
                              placeholder="10-digit mobile"
                              className="w-full px-2.5 py-2 rounded-xl border border-slate-300 font-mono font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-purple-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px]">
                              Driver Aadhar
                            </label>
                            <input 
                              type="text" 
                              value={editForm.p1_aadhar || ''}
                              onChange={e => setEditForm({ ...editForm, p1_aadhar: e.target.value })}
                              placeholder="12-digit UID"
                              className="w-full px-2.5 py-2 rounded-xl border border-slate-300 font-mono font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-purple-500 outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px]">
                        Dispatch & Fleet Notes
                      </label>
                      <textarea 
                        rows="2"
                        value={editForm.notes}
                        onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                      />
                    </div>

                    <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 text-slate-600 font-bold hover:text-slate-900 text-xs cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-md cursor-pointer disabled:opacity-50"
                      >
                        {isSaving ? 'Saving...' : '✓ Save Fleet & Mode Changes'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
