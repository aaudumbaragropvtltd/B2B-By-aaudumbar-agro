"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [metrics, setMetrics] = useState({
    totalOrders: 0,
    totalVolumeINR: 0,
    deliveryCount: 0,
    pickupCount: 0,
    inTransitCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'deliver', 'pickup'
  
  // Modals state
  const [viewingOrder, setViewingOrder] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);
  const [invoiceModalOrder, setInvoiceModalOrder] = useState(null);
  const [customBuyerEmail, setCustomBuyerEmail] = useState('');
  const [customBuyerCompanyName, setCustomBuyerCompanyName] = useState('');
  const [customBuyerGstin, setCustomBuyerGstin] = useState('');
  const [customBuyerPhone, setCustomBuyerPhone] = useState('');
  const [customHsnCode, setCustomHsnCode] = useState('1006.30');
  const [customOtherEmail, setCustomOtherEmail] = useState('');
  const [sendingInvoice, setSendingInvoice] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [sendingReceiptId, setSendingReceiptId] = useState(null);
  const [emailNotice, setEmailNotice] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, [search, activeTab]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const url = `/api/admin/orders?search=${encodeURIComponent(search)}&type=${activeTab}`;
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        setOrders(data.orders || []);
        if (data.metrics) setMetrics(data.metrics);
      }
    } catch (err) {
      console.error('Error fetching admin orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text, id) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openInvoiceModal = (order) => {
    setInvoiceModalOrder(order);
    const resolvedEmail = order.buyer_email || order.buyerEmail || order.registered_email || order.email || '';
    const resolvedCompany = order.buyer_company_name || order.company_name || order.buyer_name || '';
    const resolvedGstin = order.buyer_gstin || order.gstin || '27AAACR1234F1Z5';
    const resolvedPhone = order.buyer_phone || order.receiver_phone || order.phone_number || '';
    const resolvedHsn = order.hsn_code || order.hsn || '1006.30';
    
    setCustomBuyerEmail(resolvedEmail);
    setCustomBuyerCompanyName(resolvedCompany);
    setCustomBuyerGstin(resolvedGstin);
    setCustomBuyerPhone(resolvedPhone);
    setCustomHsnCode(resolvedHsn);
    setCustomOtherEmail('');
  };

  const handleSendInvoice = async (e) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    if (!invoiceModalOrder) return;

    const emailTarget = (customBuyerEmail || invoiceModalOrder.buyer_email || invoiceModalOrder.buyerEmail || '').trim();
    if (!emailTarget || !emailTarget.includes('@')) {
      alert('Please enter a valid buyer email address (e.g. buyer@company.com).');
      return;
    }

    try {
      setSendingInvoice(true);
      const res = await fetch('/api/admin/orders/send-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: invoiceModalOrder.id || invoiceModalOrder.transaction_id,
          customEmail: emailTarget,
          buyerCompanyName: customBuyerCompanyName,
          buyerGstin: customBuyerGstin,
          buyerPhone: customBuyerPhone,
          hsnCode: customHsnCode,
          order: invoiceModalOrder
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setEmailNotice(data.message || `✓ Total GST Tax Invoice successfully emailed to ${emailTarget}!`);
        setInvoiceModalOrder(null);
        setTimeout(() => setEmailNotice(null), 8000);
      } else {
        alert(data.error || 'Failed to dispatch total invoice email');
      }
    } catch (err) {
      alert('Error sending invoice email: ' + err.message);
    } finally {
      setSendingInvoice(false);
    }
  };

  const handleSendReceipt = async (order) => {
    try {
      const emailTarget = (order.buyer_email || order.buyerEmail || order.registered_email || order.email || '').trim();
      let emailToSend = emailTarget;
      if (!emailToSend || !emailToSend.includes('@')) {
        emailToSend = prompt('Enter Buyer Email address for 10% Advance Receipt:', order.buyer_email || '');
        if (!emailToSend || !emailToSend.includes('@')) {
          alert('Valid buyer email address is required.');
          return;
        }
      }

      setSendingReceiptId(order.id);
      const res = await fetch('/api/admin/orders/send-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id || order.transaction_id,
          customEmail: emailToSend.trim(),
          hsnCode: order.hsn_code || order.hsn || '1006.30',
          order: order
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setEmailNotice(data.message || `✓ 10% Advance Receipt successfully emailed to ${emailToSend}!`);
        setTimeout(() => setEmailNotice(null), 7000);
      } else {
        alert(data.error || 'Failed to send receipt email');
      }
    } catch (err) {
      alert('Error sending email: ' + err.message);
    } finally {
      setSendingReceiptId(null);
    }
  };

  const handleDelete = async (id, transactionId = null) => {
    if (!id && !transactionId) return;
    if (typeof window !== 'undefined' && !window.confirm('Are you sure you want to permanently delete this order record?')) return;
    
    const targetId = id || transactionId;

    // Close any open modals immediately
    setViewingOrder(null);
    setEditingOrder(null);

    // Optimistically remove from state
    setOrders(prev => prev.filter(o => 
      o.id !== targetId && 
      o.transaction_id !== targetId && 
      (!transactionId || o.transaction_id !== transactionId) &&
      (!id || !o.id || !o.id.startsWith(id))
    ));

    try {
      const res = await fetch(`/api/admin/orders?id=${encodeURIComponent(targetId)}`, { 
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: targetId, orderId: targetId, transactionId })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setEmailNotice(`✓ Order record successfully deleted.`);
        setTimeout(() => setEmailNotice(null), 4000);
      }
      fetchOrders();
    } catch (err) {
      alert('Error deleting order: ' + err.message);
      fetchOrders();
    }
  };

  const openEditModal = (order) => {
    setEditingOrder({
      ...order,
      _original_delivery_option: order.delivery_option || 'deliver'
    });
  };

  const openEditWithMode = (order, targetMode) => {
    const isTargetPickup = targetMode === 'pickup';
    setEditingOrder({
      ...order,
      delivery_option: targetMode,
      _original_delivery_option: order.delivery_option || (isTargetPickup ? 'deliver' : 'pickup'),
      tracking_number: isTargetPickup
        ? (order.tracking_number?.startsWith('AWB-') ? `GATE-PASS-2026-${String(order.id).slice(-4)}` : (order.tracking_number || `GATE-PASS-2026-${String(order.id).slice(-4)}`))
        : (order.tracking_number?.startsWith('GATE-PASS') ? `AWB-IND-${String(order.id).slice(-6)}` : (order.tracking_number || `AWB-IND-${String(order.id).slice(-6)}`)),
      delivery_address: order.delivery_address || order.buyer_location || 'Registered Destination Warehouse',
      receiver_name: order.receiver_name || order.buyer_name || 'Consignee Manager',
      receiver_phone: order.receiver_phone || order.buyer_phone || '',
      transporter_name: order.transporter_name || (isTargetPickup ? '' : 'B2B India Express Freight Fleet'),
      delivery_date: order.delivery_date || '7 business days',
      arrival_date: order.arrival_date || new Date().toISOString().split('T')[0],
      p1_name: order.p1_name || order.buyer_name || 'Designated Driver',
      p1_phone: order.p1_phone || order.buyer_phone || '',
      p1_aadhar: order.p1_aadhar || '',
      vehicle_number: order.vehicle_number || (isTargetPickup ? 'MH-12-TR-9420' : '')
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: editingOrder.id,
          updates: {
            order_status: editingOrder.order_status || editingOrder.status || editingOrder.current_state,
            payment_status: editingOrder.payment_status,
            delivery_option: editingOrder.delivery_option,
            arrival_date: editingOrder.arrival_date || null,
            delivery_date: editingOrder.delivery_date || null,
            delivery_address: editingOrder.delivery_address || null,
            receiver_name: editingOrder.receiver_name || null,
            receiver_phone: editingOrder.receiver_phone || null,
            vehicle_number: editingOrder.vehicle_number || null,
            p1_name: editingOrder.p1_name || null,
            p1_phone: editingOrder.p1_phone || null,
            p1_aadhar: editingOrder.p1_aadhar || null,
            p2_name: editingOrder.p2_name || null,
            p2_phone: editingOrder.p2_phone || null,
            p2_aadhar: editingOrder.p2_aadhar || null,
            transporter_name: editingOrder.transporter_name || null,
            tracking_number: editingOrder.tracking_number || null,
            notes: editingOrder.notes || '',
            supplier_name: editingOrder.supplier_name || editingOrder.supplier_company_name || null,
            supplier_company_name: editingOrder.supplier_company_name || editingOrder.supplier_name || null,
            supplier_contact_person: editingOrder.supplier_contact_person || null,
            supplier_phone: editingOrder.supplier_phone || null,
            supplier_email: editingOrder.supplier_email || null,
            supplier_gstin: editingOrder.supplier_gstin || null,
            supplier_location: editingOrder.supplier_location || null,
            supplier_godown: editingOrder.supplier_godown || null
          }
        })
      });
      if (res.ok) {
        setEditingOrder(null);
        fetchOrders();
      } else {
        alert('Failed to update order');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const getStatusPill = (status) => {
    switch (status) {
      case 'settled':
      case 'completed':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">✓ Settled & Complete</span>;
      case 'collected':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">✅ Collected at Godown</span>;
      case 'delivered':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">🚚 Delivered & Complete</span>;
      case 'price_locked_10':
      case 'confirmed':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">🔒 10% Advance Paid</span>;
      case 'warehouse_loading':
      case 'processing':
      case 'loading':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">🏭 Warehouse Loading</span>;
      case 'in_transit':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200 animate-pulse">🚚 In Transit</span>;
      case 'ready_for_pickup':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">🏢 Ready for Pickup</span>;
      case 'quotation_issued':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-200">📄 Quotation (Unpaid)</span>;
      case 'cancelled':
      case 'payment_failed':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">✕ Payment Failed / Cancelled</span>;
      case 'rerouted':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200">🔄 AI Rerouted</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">⏳ {status || 'Pending'}</span>;
    }
  };

  // Strictly display orders where payment is completed
  const validOrders = useMemo(() => {
    return orders.filter(o => {
      const isFailedOrUnpaid = ['cancelled', 'payment_failed', 'quotation_issued', 'unpaid', 'failed'].includes(o.order_status || o.status) || 
                               o.payment_status === 'Payment Failed / Cancelled' ||
                               o.payment_status === 'payment_failed' ||
                               o.payment_status === 'unpaid';
      return !isFailedOrUnpaid;
    });
  }, [orders]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <span className="p-2 rounded-2xl bg-brand-50 text-brand-700 border border-brand-100 text-xl">📦</span>
            Trade Orders & Logistics Central
          </h1>
          <p className="text-slate-500 mt-1 text-xs sm:text-sm">
            Live overview of buyer orders, transaction IDs, email IDs, delivery schedules, and self-pickup visitor dossiers.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchOrders}
            className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl shadow-sm transition-all text-xs font-bold"
            title="Refresh Orders"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Email Dispatch Success Toast */}
      {emailNotice && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="p-4 bg-emerald-50 border-2 border-emerald-300 text-emerald-900 rounded-2xl text-xs font-bold flex items-center justify-between shadow-sm"
        >
          <div className="flex items-center gap-2">
            <span className="text-base">✉️</span>
            <span>{emailNotice}</span>
          </div>
          <button onClick={() => setEmailNotice(null)} className="text-emerald-700 hover:text-emerald-950 font-black">✕</button>
        </motion.div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Orders */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Orders Placed</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{metrics.totalOrders}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Direct checkout & trade orders</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl font-bold">
            📋
          </div>
        </div>

        {/* Order Volume */}
        <div className="bg-gradient-to-br from-brand-600 to-indigo-700 text-white p-5 rounded-3xl shadow-lg shadow-brand-500/10 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-brand-100">Total Order Volume</div>
            <div className="text-2xl font-black mt-1">₹{(metrics.totalVolumeINR || 0).toLocaleString('en-IN')}</div>
            <div className="text-[11px] text-brand-200 mt-0.5">Escrow-backed transactions</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/20 text-white flex items-center justify-center text-xl font-bold">
            💰
          </div>
        </div>

        {/* Delivery Orders */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Direct Deliveries</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{metrics.deliveryCount}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Scheduled warehouse dispatch</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-bold">
            🚚
          </div>
        </div>

        {/* Pickup Orders */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-purple-600">Self Godown Pickups</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{metrics.pickupCount}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Verified visitor gate passes</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl font-bold">
            🏢
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Filters & Search Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-2xl">
            {[
              { id: 'all', label: `All Orders (${orders.length})` },
              { id: 'deliver', label: `🚚 Delivery` },
              { id: 'pickup', label: `🏢 Self Pickup` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 text-xs">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search by Txn ID, email, receiver, product..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 text-[11px] uppercase tracking-wider font-bold">
                <th className="px-4 py-4">Transaction & Date</th>
                <th className="px-4 py-4">Buyer & Contact Person</th>
                <th className="px-4 py-4">Supplier & Merchant Details</th>
                <th className="px-4 py-4">Logistics & Fulfillment</th>
                <th className="px-4 py-4">Product & Actual Base Rate</th>
                <th className="px-4 py-4 text-right">B2B Earning & GST</th>
                <th className="px-4 py-4 text-right">Total Deal Value</th>
                <th className="px-4 py-4 text-right">Paid vs Pending Balance</th>
                <th className="px-4 py-4 text-center">Status</th>
                <th className="px-4 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="10" className="p-12 text-center text-slate-400 animate-pulse font-medium">
                    Loading orders & logistics data...
                  </td>
                </tr>
              ) : validOrders.length === 0 ? (
                <tr>
                  <td colSpan="10" className="p-12 text-center text-slate-500">
                    <div className="text-3xl mb-2">📦</div>
                    <div className="font-bold text-slate-800 text-base">No confirmed orders found</div>
                    <p className="text-xs text-slate-400 mt-1">Orders with completed advance payment will automatically display here.</p>
                  </td>
                </tr>
              ) : (
                validOrders.map((order) => {
                  const isDeliver = order.delivery_option === 'deliver';
                  const isPickup = order.delivery_option === 'pickup';
                  
                  // Financial math
                  const totalVal = Number(order.total_amount || 0);
                  const isHighVal = totalVal >= 1000000;
                  const advanceVal = Number(order.advance_amount || (isHighVal ? 100000 : totalVal * 0.1));
                  const pendingVal = Number(order.balance_amount || Math.max(0, totalVal - advanceVal));
                  
                  // Base vs Platform Fee vs GST calculation
                  const qty = Number(order.quantity || 1);
                  const rawBaseRate = order.raw_supplier_price || (order.price_per_unit ? (order.price_per_unit / 1.03) : (totalVal / (qty * 1.03 * 1.18)));
                  const totalRawBase = Math.round(rawBaseRate * qty);
                  const platformFeeEarned = order.platform_fee || (isHighVal ? 2360 : Math.round(totalRawBase * 0.03));
                  const gstAmount = Math.round(totalVal - totalRawBase - platformFeeEarned);

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Transaction ID & Date */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                            {order.transaction_id || `TXN-${order.id.slice(0, 8)}`}
                          </span>
                          <button
                            onClick={() => handleCopy(order.transaction_id || order.id, order.id)}
                            className="text-slate-400 hover:text-slate-700 text-xs p-1"
                            title="Copy Transaction ID"
                          >
                            {copiedId === order.id ? '✅' : '📋'}
                          </button>
                        </div>
                        <div className="text-[11px] font-bold text-slate-800 mt-1 flex items-center gap-1">
                          <span>📅 Payment Date:</span>
                          <span className="font-mono text-slate-600">
                            {new Date(order.created_at).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {new Date(order.created_at).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </td>

                      {/* Buyer Name & Contact Info */}
                      <td className="px-4 py-4">
                        <div className="font-extrabold text-slate-900 text-xs flex items-center gap-1">
                          <span>👤</span> {order.buyer_name || order.receiver_name || 'Direct Enterprise Buyer'}
                        </div>
                        <div className="text-xs font-bold text-emerald-700 mt-0.5 flex items-center gap-1">
                          <span>📞</span>
                          <a href={`tel:${order.buyer_phone || order.receiver_phone}`} className="hover:underline font-mono">
                            {order.buyer_phone || order.receiver_phone || '+91 98765 43210'}
                          </a>
                        </div>
                        <div className="text-[11px] text-brand-700 hover:underline mt-0.5 flex items-center gap-1 truncate max-w-[180px]">
                          <span>✉️</span>
                          <a href={`mailto:${order.buyer_email}`}>
                            {order.buyer_email || 'buyer@trade.in'}
                          </a>
                        </div>
                        {(order.delivery_address || order.city) && (
                          <div className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[180px]" title={order.delivery_address}>
                            📍 {order.city || order.delivery_address?.split(',')[0]}
                          </div>
                        )}
                      </td>

                      {/* Supplier & Merchant Details */}
                      <td className="px-4 py-4 min-w-[210px]">
                        <div className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5 truncate max-w-[210px]" title={order.supplier_company_name || order.supplier_name || 'Aaudumbar Agro Pvt. Ltd.'}>
                          <span className="text-sm">🏭</span>
                          <span className="truncate">{order.supplier_company_name || order.supplier_name || 'Aaudumbar Agro Pvt. Ltd.'}</span>
                        </div>
                        <div className="text-[11px] font-semibold text-slate-700 mt-0.5 flex items-center gap-1">
                          <span>👤</span> {order.supplier_contact_person || 'Aditya Patil'}
                        </div>
                        <div className="text-xs font-bold text-emerald-700 mt-0.5 flex items-center gap-1">
                          <span>📞</span>
                          <a href={`tel:${order.supplier_phone || '+91 84088 41998'}`} className="hover:underline font-mono">
                            {order.supplier_phone || '+91 84088 41998'}
                          </a>
                        </div>
                        <div className="text-[11px] text-brand-700 hover:underline mt-0.5 flex items-center gap-1 truncate max-w-[190px]">
                          <span>✉️</span>
                          <a href={`mailto:${order.supplier_email || 'aaudumbaragro@gmail.com'}`} title={order.supplier_email || 'aaudumbaragro@gmail.com'}>
                            {order.supplier_email || 'aaudumbaragro@gmail.com'}
                          </a>
                        </div>
                        <div className="text-[10px] font-mono font-bold text-slate-700 mt-1 flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/80 inline-flex">
                          <span>📋 GST:</span>
                          <span className="text-slate-900">{order.supplier_gstin || '27ABACA6256A1Z2'}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[190px]" title={order.supplier_godown || order.supplier_location || 'Chhatrapati Sambhajinagar, Maharashtra'}>
                          <span>📍</span> {order.supplier_location || order.supplier_godown || 'Chhatrapati Sambhajinagar, Maharashtra'}
                        </div>
                      </td>

                      {/* Logistics & Fulfillment Mode */}
                      <td className="px-4 py-4 min-w-[200px]">
                        {isPickup ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
                              <span>🏢</span> Self-Pickup
                            </span>
                            <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                              <span>📅 Arrival:</span> <span>{order.arrival_date || 'Pending Schedule'}</span>
                            </div>
                            {order.p1_name && (
                              <div className="text-[11px] text-slate-600">
                                Driver: <strong className="text-slate-900">{order.p1_name}</strong> {order.p1_phone && <span className="font-mono text-slate-500">({order.p1_phone})</span>}
                              </div>
                            )}
                            {order.vehicle_number && (
                              <div className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200/60 inline-block">
                                🚚 {order.vehicle_number}
                              </div>
                            )}
                            {order.tracking_number && (
                              <div className="text-[10px] font-mono text-slate-500">
                                🎫 Pass: {order.tracking_number}
                              </div>
                            )}
                            <div className="pt-1">
                              <button
                                type="button"
                                onClick={() => openEditWithMode(order, 'deliver')}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 transition-colors shadow-2xs cursor-pointer"
                                title="Admin: Switch to Pan-India Direct Delivery"
                              >
                                <span>🔄 Switch to Delivery</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-sky-100 text-sky-800 border border-sky-200">
                              <span>🚚</span> Pan-India Delivery
                            </span>
                            <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                              <span>📅 Est:</span> <span>{order.delivery_date || '7 days'}</span>
                            </div>
                            <div className="text-[11px] text-slate-600 truncate max-w-[190px]" title={order.delivery_address}>
                              📍 {order.delivery_address || 'Delivery Address'}
                            </div>
                            {order.receiver_name && (
                              <div className="text-[10px] text-slate-500">
                                Receiver: <strong className="text-slate-700">{order.receiver_name}</strong>
                              </div>
                            )}
                            {order.tracking_number && (
                              <div className="text-[10px] font-mono text-sky-700">
                                📦 AWB: {order.tracking_number}
                              </div>
                            )}
                            <div className="pt-1">
                              <button
                                type="button"
                                onClick={() => openEditWithMode(order, 'pickup')}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition-colors shadow-2xs cursor-pointer"
                                title="Admin: Switch to Central Godown Self-Pickup"
                              >
                                <span>🔄 Switch to Pickup</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Product & Actual Base Rate */}
                      <td className="px-4 py-4">
                        <div className="text-xs font-extrabold text-slate-900 max-w-[180px] truncate" title={order.product_name}>
                          {order.product_name || 'Commercial Commodity'}
                        </div>
                        <div className="text-[11px] text-slate-600 mt-0.5">
                          Qty: <strong className="text-slate-900">{qty.toLocaleString('en-IN')} {order.unit || 'Kg'}</strong>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          Actual Rate: <strong className="text-slate-800">₹{rawBaseRate.toFixed(2)} / {order.unit || 'Kg'}</strong>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Raw Supplier Total: ₹{totalRawBase.toLocaleString('en-IN')}
                        </div>
                      </td>

                      {/* Financial Breakdown (B2B Earning & GST) */}
                      <td className="px-4 py-4 text-right whitespace-nowrap">
                        <div className="inline-block bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-lg text-xs font-black font-mono">
                          💰 B2B Earn: +₹{platformFeeEarned.toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1 font-mono">
                          + GST: ₹{Math.max(0, gstAmount).toLocaleString('en-IN')}
                        </div>
                      </td>

                      {/* Total Deal Value */}
                      <td className="px-4 py-4 text-right whitespace-nowrap">
                        <div className="text-sm font-black text-slate-900 font-mono">
                          ₹{totalVal.toLocaleString('en-IN')}
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">
                          All-inclusive contract
                        </span>
                      </td>

                      {/* Paid vs Pending Balance */}
                      <td className="px-4 py-4 text-right whitespace-nowrap">
                        {order.order_status === 'cancelled' || order.order_status === 'payment_failed' || order.payment_status === 'Payment Failed / Cancelled' ? (
                          <div>
                            <div className="text-xs font-black text-rose-600 font-mono">
                              ❌ Payment Failed
                            </div>
                            <span className="text-[10px] text-rose-500 font-semibold block mt-0.5">
                              ₹0 Advance Received
                            </span>
                          </div>
                        ) : order.order_status === 'quotation_issued' || order.payment_status === 'Quotation Stage (Unpaid)' ? (
                          <div>
                            <div className="text-xs font-black text-slate-600 font-mono">
                              ⏳ Unpaid (Draft)
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                              Awaiting 10% Advance
                            </span>
                          </div>
                        ) : (
                          <div>
                            <div className="text-xs font-black text-emerald-600 font-mono">
                              ✅ Paid: ₹{advanceVal.toLocaleString('en-IN')}
                            </div>
                            <div className="text-xs font-black text-amber-600 font-mono mt-0.5">
                              ⏳ Pending: ₹{pendingVal.toLocaleString('en-IN')}
                            </div>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              (90% on Dock Inspection)
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4 text-center whitespace-nowrap">
                        {getStatusPill(order.order_status || order.status)}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4 text-right whitespace-nowrap space-x-1.5">
                        {['settled', 'completed', 'delivered', 'collected'].includes(order.order_status || order.status) ? (
                          <button
                            onClick={() => openInvoiceModal(order)}
                            className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-black rounded-xl transition-all shadow-sm shadow-emerald-700/20 inline-flex items-center gap-1.5 cursor-pointer animate-pulse hover:animate-none"
                            title="Send Official 100% Settled GST Tax Invoice to Buyer & Supplier Email"
                          >
                            <span>🧾</span>
                            <span>Total Invoice</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => openInvoiceModal(order)}
                            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                            title="Send Total GST Invoice & Settlement"
                          >
                            <span>🧾 Invoice</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleSendReceipt(order)}
                          disabled={sendingReceiptId === order.id}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                          title="Send 10% Amount Paid Receipt to Buyer Email"
                        >
                          {sendingReceiptId === order.id ? 'Sending...' : '📧 10% Receipt'}
                        </button>
                        <button
                          onClick={() => setViewingOrder(order)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                          title="View Full Details Dossier"
                        >
                          👁️ Dossier
                        </button>
                        <button
                          onClick={() => openEditModal(order)}
                          className="px-2.5 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                          title="Edit Order & Logistics Mode"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(order.id || order.transaction_id)}
                          className="px-2 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                          title="Permanently Delete Order Record"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: VIEW FULL ORDER & FINANCIAL BREAKDOWN DOSSIER */}
      {/* ========================================================= */}
      {viewingOrder && (() => {
        const totalVal = Number(viewingOrder.total_amount || 0);
        const isHighVal = totalVal >= 1000000;
        const advanceVal = Number(viewingOrder.advance_amount || (isHighVal ? 100000 : totalVal * 0.1));
        const pendingVal = Number(viewingOrder.balance_amount || Math.max(0, totalVal - advanceVal));
        const qty = Number(viewingOrder.quantity || 1);
        const rawBaseRate = viewingOrder.raw_supplier_price || (viewingOrder.price_per_unit ? (viewingOrder.price_per_unit / 1.03) : (totalVal / (qty * 1.03 * 1.18)));
        const totalRawBase = Math.round(rawBaseRate * qty);
        const platformFeeEarned = viewingOrder.platform_fee || (isHighVal ? 2360 : Math.round(totalRawBase * 0.03));
        const gstAmount = Math.round(totalVal - totalRawBase - platformFeeEarned);

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto space-y-6"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md">
                    Order Financial & Logistics Dossier
                  </span>
                  <h2 className="text-xl font-black text-slate-900 mt-1 flex items-center gap-2 font-mono">
                    {viewingOrder.transaction_id || viewingOrder.id}
                  </h2>
                  <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                    <span>📅 <strong>Date of Payment / Order:</strong> {new Date(viewingOrder.created_at).toLocaleString('en-IN')}</span>
                  </div>
                </div>
                <button
                  onClick={() => setViewingOrder(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 text-lg rounded-xl hover:bg-slate-100 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Complete Financial Breakdown Card */}
              <div className="bg-slate-900 text-white p-5 rounded-3xl space-y-4 shadow-xl border border-slate-800">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <span>💰</span> Exact Financial Breakdown & B2B India Earnings
                  </span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">
                    Escrow Verified
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
                    <span className="text-slate-400 text-[10px] block uppercase font-bold">1. Actual Base Goods</span>
                    <span className="font-mono text-white font-bold text-sm">₹{totalRawBase.toLocaleString('en-IN')}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">₹{rawBaseRate.toFixed(2)} / {viewingOrder.unit || 'Kg'}</span>
                  </div>

                  <div className="bg-emerald-950/40 p-3 rounded-xl border border-emerald-500/40">
                    <span className="text-emerald-400 text-[10px] block uppercase font-bold">2. B2B India Earnings</span>
                    <span className="font-mono text-emerald-300 font-extrabold text-sm">+₹{platformFeeEarned.toLocaleString('en-IN')}</span>
                    <span className="text-[10px] text-emerald-400/80 block mt-0.5">Platform Fee Net Earning</span>
                  </div>

                  <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
                    <span className="text-slate-400 text-[10px] block uppercase font-bold">3. GST Tax Collected</span>
                    <span className="font-mono text-slate-200 font-bold text-sm">+₹{Math.max(0, gstAmount).toLocaleString('en-IN')}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Applicable Tax Flow</span>
                  </div>

                  <div className="bg-brand-950/40 p-3 rounded-xl border border-brand-500/40">
                    <span className="text-amber-400 text-[10px] block uppercase font-bold">4. Total Contract Value</span>
                    <span className="font-mono text-amber-400 font-black text-sm sm:text-base">₹{totalVal.toLocaleString('en-IN')}</span>
                    <span className="text-[10px] text-slate-300 block mt-0.5">Buyer All-Inclusive</span>
                  </div>
                </div>

                {/* Paid vs Pending Split */}
                <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-2 rounded-xl">
                    <span className="text-emerald-400 font-bold">✅ Amount Paid (Advance):</span>
                    <strong className="text-white font-mono text-sm">₹{advanceVal.toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="flex items-center gap-2 bg-amber-950/40 border border-amber-500/30 px-3 py-2 rounded-xl">
                    <span className="text-amber-300 font-bold">⏳ Pending Balance (on Dock):</span>
                    <strong className="text-amber-300 font-mono text-sm">₹{pendingVal.toLocaleString('en-IN')}</strong>
                  </div>
                </div>
              </div>

              {/* Buyer & Customer Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2.5">
                  <div className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <span>👤</span> Buyer / Customer Contact Dossier
                  </div>
                  <div className="text-xs">
                    <span className="text-slate-500 font-medium">Name of Person: </span>
                    <strong className="text-slate-900 font-bold">{viewingOrder.buyer_name || viewingOrder.receiver_name || 'Direct Enterprise Buyer'}</strong>
                  </div>
                  <div className="text-xs">
                    <span className="text-slate-500 font-medium">Contact Phone Number: </span>
                    <a href={`tel:${viewingOrder.buyer_phone || viewingOrder.receiver_phone}`} className="font-mono font-bold text-emerald-700 hover:underline">
                      📞 {viewingOrder.buyer_phone || viewingOrder.receiver_phone || 'N/A'}
                    </a>
                  </div>
                  <div className="text-xs">
                    <span className="text-slate-500 font-medium">Email Address: </span>
                    <a href={`mailto:${viewingOrder.buyer_email}`} className="font-bold text-brand-600 underline">
                      ✉️ {viewingOrder.buyer_email || 'N/A'}
                    </a>
                  </div>
                  <div className="text-xs">
                    <span className="text-slate-500 font-medium">Date of Payment: </span>
                    <span className="font-mono text-slate-800 font-bold">
                      {new Date(viewingOrder.created_at).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2.5">
                  <div className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <span>🏭</span> Supplier & Merchant Details
                  </div>
                  <div className="text-xs">
                    <span className="text-slate-500 font-medium">Company Name: </span>
                    <strong className="text-slate-900 font-bold">{viewingOrder.supplier_company_name || viewingOrder.supplier_name || 'Aaudumbar Agro Pvt. Ltd.'}</strong>
                  </div>
                  <div className="text-xs">
                    <span className="text-slate-500 font-medium">Contact Person: </span>
                    <strong className="text-slate-800">{viewingOrder.supplier_contact_person || 'Aditya Patil'}</strong>
                  </div>
                  <div className="text-xs">
                    <span className="text-slate-500 font-medium">Supplier Phone: </span>
                    <a href={`tel:${viewingOrder.supplier_phone || '+91 84088 41998'}`} className="font-mono font-bold text-emerald-700 hover:underline">
                      📞 {viewingOrder.supplier_phone || '+91 84088 41998'}
                    </a>
                  </div>
                  <div className="text-xs">
                    <span className="text-slate-500 font-medium">Supplier Email: </span>
                    <a href={`mailto:${viewingOrder.supplier_email || 'aaudumbaragro@gmail.com'}`} className="font-bold text-brand-600 underline">
                      ✉️ {viewingOrder.supplier_email || 'aaudumbaragro@gmail.com'}
                    </a>
                  </div>
                  <div className="text-xs">
                    <span className="text-slate-500 font-medium">Supplier GSTIN: </span>
                    <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                      📋 {viewingOrder.supplier_gstin || '27ABACA6256A1Z2'}
                    </span>
                  </div>
                  <div className="text-xs">
                    <span className="text-slate-500 font-medium">Location: </span>
                    <span className="font-semibold text-slate-800">
                      📍 {viewingOrder.supplier_location || 'Chhatrapati Sambhajinagar, Maharashtra'}
                    </span>
                  </div>
                  <div className="text-xs">
                    <span className="text-slate-500 font-medium">Dispatch Godown: </span>
                    <span className="font-semibold text-slate-800">{viewingOrder.supplier_godown || 'Central Godown, Plot 14, MIDC Shendra, Chhatrapati Sambhajinagar'}</span>
                  </div>
                  <div className="text-xs pt-1">
                    <span className="text-slate-500 font-medium">Escrow Status: </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      Advance Locked in Escrow
                    </span>
                  </div>
                </div>
              </div>

            {/* Logistics Dossier */}
            <div className="bg-white p-5 rounded-2xl border-2 border-brand-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="text-xs font-black text-brand-800 uppercase tracking-wider flex items-center gap-1.5">
                  <span>{viewingOrder.delivery_option === 'deliver' ? '🚚 Direct Delivery Logistics Dossier' : '🏢 Central Godown Self-Pickup Dossier'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Security Ref:</span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">
                    {viewingOrder.tracking_number || (viewingOrder.delivery_option === 'pickup' ? 'GATE-PASS-VERIFIED' : 'AWB-IN-TRANSIT')}
                  </span>
                </div>
              </div>

              {viewingOrder.delivery_option === 'deliver' && (
                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="text-slate-500 font-medium">Scheduled Delivery Date:</span>
                      <div className="font-bold text-slate-900 text-sm mt-0.5 flex items-center gap-1.5">
                        <span>📅</span> {viewingOrder.delivery_date || '7 business days'}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">Logistics Transporter:</span>
                      <div className="font-bold text-slate-900 text-sm mt-0.5 flex items-center gap-1.5">
                        <span>🚛</span> {viewingOrder.transporter_name || 'B2B Dedicated Freight Fleet'}
                      </div>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Full Destination Address:</span>
                    <div className="font-semibold text-slate-900 mt-0.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      📍 {viewingOrder.delivery_address || 'Address on file'}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="text-slate-500 font-medium">Authorized Receiver:</span>
                      <div className="font-bold text-slate-900">{viewingOrder.receiver_name || viewingOrder.buyer_name || 'N/A'}</div>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">Receiver Phone Number:</span>
                      <div className="font-mono font-bold text-slate-900">{viewingOrder.receiver_phone || viewingOrder.buyer_phone || 'N/A'}</div>
                    </div>
                  </div>
                </div>
              )}

              {viewingOrder.delivery_option === 'pickup' && (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="text-slate-500 font-medium">Scheduled Arrival at Godown:</span>
                      <div className="font-bold text-slate-900 text-sm mt-0.5 flex items-center gap-1.5">
                        <span>📅</span> {viewingOrder.arrival_date || 'Pending Schedule'}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">Vehicle / Truck Registration No.:</span>
                      <div className="mt-0.5">
                        <span className="font-mono font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg text-xs inline-block">
                          🚚 {viewingOrder.vehicle_number || 'Vehicle Assigned at Gate'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Visitor 1 */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <div className="font-bold text-brand-800 text-[11px] uppercase flex items-center justify-between">
                      <span>Visitor 1 (Primary / Driver)</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">Govt ID Verified</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <span className="text-slate-500 text-[10px]">Name:</span>
                        <div className="font-bold text-slate-900">{viewingOrder.p1_name || 'N/A'}</div>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px]">Mobile:</span>
                        <div className="font-mono font-bold text-slate-900">{viewingOrder.p1_phone || 'N/A'}</div>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px]">Aadhar Card Number:</span>
                        <div className="font-mono font-bold text-slate-900">{viewingOrder.p1_aadhar || 'On File'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Visitor 2 */}
                  {viewingOrder.p2_name && (
                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                      <div className="font-bold text-brand-800 text-[11px] uppercase flex items-center justify-between">
                        <span>Visitor 2 (Secondary / Manager)</span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">Authorized Escort</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <span className="text-slate-500 text-[10px]">Name:</span>
                          <div className="font-bold text-slate-900">{viewingOrder.p2_name}</div>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px]">Mobile:</span>
                          <div className="font-mono font-bold text-slate-900">{viewingOrder.p2_phone || 'N/A'}</div>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px]">Aadhar Card Number:</span>
                          <div className="font-mono font-bold text-slate-900">{viewingOrder.p2_aadhar || 'On File'}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const o = viewingOrder;
                    setViewingOrder(null);
                    openInvoiceModal(o);
                  }}
                  className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <span>🧾</span>
                  <span>Send Total GST Tax Invoice</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSendReceipt(viewingOrder)}
                  disabled={sendingReceiptId === viewingOrder.id}
                  className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <span>✉️</span>
                  <span>{sendingReceiptId === viewingOrder.id ? 'Sending...' : '10% Receipt'}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleDelete(viewingOrder.id, viewingOrder.transaction_id);
                  }}
                  className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  🗑️ Delete Order
                </button>
                <button
                  type="button"
                  onClick={() => setViewingOrder(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                >
                  Close Dossier
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const o = viewingOrder;
                    setViewingOrder(null);
                    openEditModal(o);
                  }}
                  className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  ✏️ Edit Order & Mode
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      );
      })()}

      {/* ========================================================= */}
      {/* MODAL 2: EDIT ORDER & LOGISTICS STATUS */}
      {/* ========================================================= */}
      {editingOrder && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl p-6 sm:p-7 w-full max-w-xl max-h-[92vh] overflow-y-auto space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Update Order & Logistics Dossier</h3>
                <div className="text-xs font-mono text-slate-400 mt-0.5">{editingOrder.transaction_id || editingOrder.id}</div>
              </div>
              <button onClick={() => setEditingOrder(null)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Order Status</label>
                  <select 
                    value={editingOrder.order_status || editingOrder.status || editingOrder.current_state || 'price_locked_10'}
                    onChange={(e) => setEditingOrder({...editingOrder, order_status: e.target.value, status: e.target.value, current_state: e.target.value})}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-xs font-bold bg-white"
                  >
                    <option value="price_locked_10">🔒 10% Advance Paid (Confirmed)</option>
                    <option value="warehouse_loading">🏭 Warehouse Loading (Processing)</option>
                    <option value="ready_for_pickup">🏢 Ready for Godown Pickup</option>
                    <option value="in_transit">🚚 In Transit (Dispatched)</option>
                    <option value="collected">✅ Collected (Self-Pickup Complete)</option>
                    <option value="delivered">✅ Delivered (Direct Delivery Complete)</option>
                    <option value="settled">✅ Settled & Completed (100% Cleared)</option>
                    <option value="quotation_issued">📄 Quotation Issued</option>
                    <option value="cancelled">✕ Cancelled</option>
                    <option value="rerouted">🔄 AI Rerouted</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Payment Status</label>
                  <select 
                    value={editingOrder.payment_status || 'paid_to_escrow'}
                    onChange={(e) => setEditingOrder({...editingOrder, payment_status: e.target.value})}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-xs font-bold bg-white"
                  >
                    <option value="paid_to_escrow">Paid to Escrow (10% Advance)</option>
                    <option value="released_to_supplier">Released to Supplier (100% Cleared)</option>
                    <option value="pending">Pending Payment</option>
                    <option value="refunded">Refunded to Buyer</option>
                  </select>
                </div>
              </div>

              {/* Logistics Mode Switch */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">Logistics / Fulfillment Mode</label>
                  {editingOrder._original_delivery_option && editingOrder.delivery_option !== editingOrder._original_delivery_option && (
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                      ⚡ Mode Changed
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingOrder(prev => ({
                      ...prev,
                      delivery_option: 'deliver',
                      tracking_number: prev.tracking_number?.startsWith('GATE-PASS') ? `AWB-IND-${String(prev.id).slice(-6)}` : (prev.tracking_number || `AWB-IND-${String(prev.id).slice(-6)}`),
                      delivery_address: prev.delivery_address || prev.buyer_location || 'Registered Destination Warehouse',
                      transporter_name: prev.transporter_name || 'B2B India Express Freight Fleet',
                      delivery_date: prev.delivery_date || '7 business days'
                    }))}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      editingOrder.delivery_option === 'deliver'
                        ? 'bg-sky-50 border-sky-500 text-sky-800 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    🚚 Pan-India Delivery
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingOrder(prev => ({
                      ...prev,
                      delivery_option: 'pickup',
                      tracking_number: prev.tracking_number?.startsWith('AWB-') ? `GATE-PASS-2026-${String(prev.id).slice(-4)}` : (prev.tracking_number || `GATE-PASS-2026-${String(prev.id).slice(-4)}`),
                      vehicle_number: prev.vehicle_number || 'MH-12-TR-9420',
                      arrival_date: prev.arrival_date || new Date().toISOString().split('T')[0],
                      p1_name: prev.p1_name || prev.receiver_name || prev.buyer_name || 'Designated Driver',
                      p1_phone: prev.p1_phone || prev.receiver_phone || prev.buyer_phone || ''
                    }))}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      editingOrder.delivery_option === 'pickup'
                        ? 'bg-purple-50 border-purple-500 text-purple-800 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    🏢 Central Godown Self-Pickup
                  </button>
                </div>
              </div>

              {editingOrder._original_delivery_option && editingOrder.delivery_option !== editingOrder._original_delivery_option && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs font-bold flex items-center gap-2">
                  <span>ℹ️</span>
                  <span>
                    Fulfillment mode changed to <strong>{editingOrder.delivery_option === 'pickup' ? 'Central Godown Self-Pickup' : 'Pan-India Direct Delivery'}</strong>. Please verify the logistics fields below before saving.
                  </span>
                </div>
              )}

              {/* Self-Pickup Specific Fields */}
              {editingOrder.delivery_option === 'pickup' && (
                <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-200/80 space-y-3">
                  <div className="text-xs font-extrabold text-purple-900 uppercase">🏢 Godown Self-Pickup Details</div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Arrival Date at Godown</label>
                      <input 
                        type="text" 
                        value={editingOrder.arrival_date || ''} 
                        onChange={(e) => setEditingOrder({...editingOrder, arrival_date: e.target.value})}
                        placeholder="e.g. 2026-09-05" 
                        className="w-full p-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-purple-500 outline-none" 
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Vehicle / Truck No.</label>
                      <input 
                        type="text" 
                        value={editingOrder.vehicle_number || ''} 
                        onChange={(e) => setEditingOrder({...editingOrder, vehicle_number: e.target.value})}
                        placeholder="e.g. MH 12 AB 1234" 
                        className="w-full p-2 text-xs rounded-xl border border-slate-300 bg-white font-mono uppercase font-bold focus:ring-2 focus:ring-purple-500 outline-none" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Driver Name</label>
                      <input 
                        type="text" 
                        value={editingOrder.p1_name || ''} 
                        onChange={(e) => setEditingOrder({...editingOrder, p1_name: e.target.value})}
                        placeholder="Primary Driver" 
                        className="w-full p-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-purple-500 outline-none" 
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Driver Phone</label>
                      <input 
                        type="tel" 
                        value={editingOrder.p1_phone || ''} 
                        onChange={(e) => setEditingOrder({...editingOrder, p1_phone: e.target.value})}
                        placeholder="10-digit mobile" 
                        className="w-full p-2 text-xs font-mono rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-purple-500 outline-none" 
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Driver Aadhar</label>
                      <input 
                        type="text" 
                        value={editingOrder.p1_aadhar || ''} 
                        onChange={(e) => setEditingOrder({...editingOrder, p1_aadhar: e.target.value})}
                        placeholder="12-digit Aadhar" 
                        className="w-full p-2 text-xs font-mono rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-purple-500 outline-none" 
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Delivery Specific Fields */}
              {editingOrder.delivery_option !== 'pickup' && (
                <div className="p-4 bg-sky-50/50 rounded-2xl border border-sky-200/80 space-y-3">
                  <div className="text-xs font-extrabold text-sky-900 uppercase">🚚 Direct Delivery Details</div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Estimated Delivery Date</label>
                      <input 
                        type="text" 
                        value={editingOrder.delivery_date || ''} 
                        onChange={(e) => setEditingOrder({...editingOrder, delivery_date: e.target.value})}
                        placeholder="e.g. 5 business days" 
                        className="w-full p-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-sky-500 outline-none" 
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Transporter / Fleet</label>
                      <input 
                        type="text" 
                        value={editingOrder.transporter_name || ''} 
                        onChange={(e) => setEditingOrder({...editingOrder, transporter_name: e.target.value})}
                        placeholder="e.g. VRL Logistics / Delhivery" 
                        className="w-full p-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-sky-500 outline-none" 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Destination Address</label>
                    <input 
                      type="text" 
                      value={editingOrder.delivery_address || ''} 
                      onChange={(e) => setEditingOrder({...editingOrder, delivery_address: e.target.value})}
                      placeholder="Full Destination Address" 
                      className="w-full p-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-sky-500 outline-none" 
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Receiver Name</label>
                      <input 
                        type="text" 
                        value={editingOrder.receiver_name || ''} 
                        onChange={(e) => setEditingOrder({...editingOrder, receiver_name: e.target.value})}
                        placeholder="Receiver Name" 
                        className="w-full p-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-sky-500 outline-none" 
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Receiver Phone</label>
                      <input 
                        type="tel" 
                        value={editingOrder.receiver_phone || ''} 
                        onChange={(e) => setEditingOrder({...editingOrder, receiver_phone: e.target.value})}
                        placeholder="10-digit mobile" 
                        className="w-full p-2 text-xs font-mono rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-sky-500 outline-none" 
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Supplier & Merchant Information */}
              <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200/80 space-y-3">
                <div className="text-xs font-extrabold text-emerald-900 uppercase flex items-center gap-1.5">
                  <span>🏭</span> Supplier & Merchant Credentials
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Company / Mill Name</label>
                    <input 
                      type="text" 
                      value={editingOrder.supplier_company_name || editingOrder.supplier_name || ''} 
                      onChange={(e) => setEditingOrder({...editingOrder, supplier_company_name: e.target.value, supplier_name: e.target.value})}
                      placeholder="e.g. Aaudumbar Agro Pvt. Ltd." 
                      className="w-full p-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Contact Person</label>
                    <input 
                      type="text" 
                      value={editingOrder.supplier_contact_person || ''} 
                      onChange={(e) => setEditingOrder({...editingOrder, supplier_contact_person: e.target.value})}
                      placeholder="e.g. Aditya Patil" 
                      className="w-full p-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 outline-none" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Supplier Phone</label>
                    <input 
                      type="tel" 
                      value={editingOrder.supplier_phone || ''} 
                      onChange={(e) => setEditingOrder({...editingOrder, supplier_phone: e.target.value})}
                      placeholder="10-digit phone" 
                      className="w-full p-2 text-xs font-mono rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Supplier Email</label>
                    <input 
                      type="email" 
                      value={editingOrder.supplier_email || ''} 
                      onChange={(e) => setEditingOrder({...editingOrder, supplier_email: e.target.value})}
                      placeholder="supplier@company.com" 
                      className="w-full p-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">GSTIN Number</label>
                    <input 
                      type="text" 
                      value={editingOrder.supplier_gstin || ''} 
                      onChange={(e) => setEditingOrder({...editingOrder, supplier_gstin: e.target.value})}
                      placeholder="27ABACA6256A1Z2" 
                      className="w-full p-2 text-xs font-mono uppercase rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 outline-none" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Dispatch Godown / Warehouse Location</label>
                  <input 
                    type="text" 
                    value={editingOrder.supplier_godown || editingOrder.supplier_location || ''} 
                    onChange={(e) => setEditingOrder({...editingOrder, supplier_godown: e.target.value, supplier_location: e.target.value})}
                    placeholder="Full warehouse or mill address" 
                    className="w-full p-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 outline-none" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tracking Number / Gate Pass Reference</label>
                <input 
                  type="text"
                  value={editingOrder.tracking_number || ''}
                  onChange={(e) => setEditingOrder({...editingOrder, tracking_number: e.target.value})}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-xs font-mono"
                  placeholder="e.g. AWB-IND-884920 or GATE-PASS-2026-09"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Internal Admin Notes</label>
                <textarea 
                  rows="2"
                  value={editingOrder.notes || ''}
                  onChange={(e) => setEditingOrder({...editingOrder, notes: e.target.value})}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-xs"
                  placeholder="e.g. Verified by logistics manager, dispatch initiated from Central Godown."
                />
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => {
                    handleDelete(editingOrder.id, editingOrder.transaction_id);
                  }}
                  className="px-3.5 py-2.5 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  🗑️ Delete Order
                </button>
                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={() => setEditingOrder(null)}
                    className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2.5 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-colors disabled:opacity-50 text-xs shadow-sm cursor-pointer"
                  >
                    {saving ? 'Saving...' : 'Save Order Changes'}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: SEND TOTAL GST TAX INVOICE & SETTLEMENT */}
      {/* ========================================================= */}
      {invoiceModalOrder && (() => {
        const totalVal = Number(invoiceModalOrder.total_amount || 0);
        const isHighVal = totalVal >= 1000000;
        const advanceVal = Number(invoiceModalOrder.advance_amount || (isHighVal ? 100000 : totalVal * 0.1));
        const pendingVal = Number(invoiceModalOrder.balance_amount || Math.max(0, totalVal - advanceVal));
        const isSettled = ['settled', 'completed', 'delivered'].includes(invoiceModalOrder.order_status || invoiceModalOrder.status);
        const invoiceRef = `AAPL/INV/2026/${(invoiceModalOrder.transaction_id || invoiceModalOrder.id || '').replace(/[^0-9a-zA-Z]/g, '').slice(-6).toUpperCase() || '884920'}`;

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 w-full max-w-xl max-h-[92vh] overflow-y-auto space-y-5 border border-slate-200"
            >
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full">
                      {isSettled ? '✓ 100% Settled & Complete' : '🧾 Official GST Tax Invoice'}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-500">{invoiceRef}</span>
                  </div>
                  <h2 className="text-xl font-black text-slate-900 mt-1 flex items-center gap-2">
                    Send Total Invoice to Buyer
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Sale from <strong>Aaudumbar Agro Pvt. Ltd.</strong> to <strong className="text-slate-800">{invoiceModalOrder.buyer_name || 'Buyer'}</strong>
                  </p>
                </div>
                <button
                  onClick={() => setInvoiceModalOrder(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 text-lg rounded-xl hover:bg-slate-100 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Bill & Settlement Summary Card */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4 sm:p-5 rounded-2xl space-y-3 shadow-lg">
                <div className="flex items-center justify-between text-xs border-b border-slate-700/80 pb-2">
                  <span className="text-emerald-400 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1">
                    <span>🧾</span> Tax Invoice & Settlement Summary
                  </span>
                  <span className="text-xs font-mono text-slate-300">
                    Grand Total: <strong className="text-white text-sm font-black">₹{totalVal.toLocaleString('en-IN')}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                    <span className="text-slate-400 text-[10px] block font-bold">10% Advance Paid</span>
                    <span className="font-mono text-emerald-400 font-extrabold text-xs sm:text-sm">₹{advanceVal.toLocaleString('en-IN')}</span>
                    <span className="text-[9px] text-emerald-300/80 block mt-0.5">✓ Cleared on Booking</span>
                  </div>
                  <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                    <span className="text-slate-400 text-[10px] block font-bold">90% Dock Balance</span>
                    <span className="font-mono text-emerald-400 font-extrabold text-xs sm:text-sm">₹{pendingVal.toLocaleString('en-IN')}</span>
                    <span className="text-[9px] text-emerald-300/80 block mt-0.5">✓ 100% Reconciled</span>
                  </div>
                  <div className="bg-emerald-950/60 p-2.5 rounded-xl border border-emerald-500/50">
                    <span className="text-emerald-300 text-[10px] block font-bold">Balance Due</span>
                    <span className="font-mono text-white font-black text-xs sm:text-sm">₹0.00</span>
                    <span className="text-[9px] text-emerald-300 block mt-0.5 font-bold">NIL / FULLY PAID</span>
                  </div>
                </div>
              </div>

              {/* Order Specifics */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Product / Commodity:</span>
                  <strong className="text-slate-900">{invoiceModalOrder.product_name}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Billed Quantity:</span>
                  <strong className="text-slate-900">{Number(invoiceModalOrder.quantity || 1).toLocaleString('en-IN')} {invoiceModalOrder.unit || 'Kg'}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Buyer Business / Contact:</span>
                  <strong className="text-slate-900">{invoiceModalOrder.buyer_name || 'Buyer'} ({invoiceModalOrder.buyer_phone || 'On file'})</strong>
                </div>
              </div>

              {/* Both Parties Two-Column Matrix */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Party 1: Seller / Billing Entity */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1.5 text-xs">
                  <div className="text-[11px] font-black text-brand-900 uppercase tracking-wider border-b border-slate-200 pb-1 flex items-center justify-between">
                    <span>🏢 Seller (Party 1)</span>
                    <span className="text-[9px] bg-brand-100 text-brand-800 px-1.5 py-0.5 rounded font-bold">Billed By</span>
                  </div>
                  <div className="font-extrabold text-slate-900 text-sm">Aaudumbar Agro Pvt. Ltd.</div>
                  <div className="text-slate-600 space-y-0.5 pt-1">
                    <div><strong>GSTIN:</strong> <span className="font-mono font-bold text-brand-900 bg-white px-1.5 py-0.5 rounded border border-slate-200">27ABACA6256A1Z2</span></div>
                    <div><strong>Phone:</strong> <span className="font-mono font-bold text-emerald-800">📞 +91 84088 41998</span></div>
                    <div><strong>Email:</strong> b2bbharat.in@gmail.com</div>
                    <div className="text-[10px] text-slate-400">Plot 5, Prerna Nagar, Sambhajinagar</div>
                  </div>
                </div>

                {/* Party 2: Buyer / Billed To Entity */}
                <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200 space-y-1.5 text-xs">
                  <div className="text-[11px] font-black text-emerald-900 uppercase tracking-wider border-b border-emerald-200 pb-1 flex items-center justify-between">
                    <span>👤 Buyer (Party 2)</span>
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">Billed To</span>
                  </div>
                  <div className="font-extrabold text-slate-900 text-sm truncate">{customBuyerCompanyName || 'Buyer Company'}</div>
                  <div className="text-slate-600 space-y-0.5 pt-1">
                    <div><strong>GSTIN:</strong> <span className="font-mono font-bold text-emerald-900 bg-white px-1.5 py-0.5 rounded border border-emerald-200">{customBuyerGstin || '27AAACR1234F1Z5'}</span></div>
                    <div><strong>Phone:</strong> <span className="font-mono font-bold text-emerald-800">📞 {customBuyerPhone || 'On File'}</span></div>
                    <div className="truncate"><strong>Email:</strong> {customBuyerEmail}</div>
                    <div className="text-[10px] text-slate-500 truncate">{invoiceModalOrder.delivery_address || 'Destination on file'}</div>
                  </div>
                </div>
              </div>

              {/* Form to Review & Edit Party 2 Details */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendInvoice(e);
                }}
                className="space-y-3.5 bg-slate-50 p-4 rounded-2xl border border-slate-200"
              >
                <div className="text-xs font-bold text-slate-900 border-b border-slate-200 pb-1">
                  ✏️ Verify & Adjust Buyer (Party 2) Invoice Information:
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Buyer Company Name:
                    </label>
                    <input
                      type="text"
                      required
                      value={customBuyerCompanyName}
                      onChange={(e) => setCustomBuyerCompanyName(e.target.value)}
                      placeholder="e.g. India Agro Traders Pvt Ltd"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Buyer GSTIN Number:
                    </label>
                    <input
                      type="text"
                      required
                      value={customBuyerGstin}
                      onChange={(e) => setCustomBuyerGstin(e.target.value.toUpperCase())}
                      placeholder="e.g. 27AAACR1234F1Z5"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Buyer Contact Phone:
                    </label>
                    <input
                      type="text"
                      required
                      value={customBuyerPhone}
                      onChange={(e) => setCustomBuyerPhone(e.target.value)}
                      placeholder="e.g. 9820145678"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Commodity HSN / SAC Code:
                    </label>
                    <input
                      type="text"
                      required
                      value={customHsnCode}
                      onChange={(e) => setCustomHsnCode(e.target.value)}
                      placeholder="e.g. 1006.30 or 0713"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-brand-900 outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Buyer Email Address (Billed To):
                    </label>
                    <input
                      type="email"
                      required
                      value={customBuyerEmail}
                      onChange={(e) => setCustomBuyerEmail(e.target.value)}
                      placeholder="buyer@domain.com"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Modal Footer CTA */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setInvoiceModalOrder(null)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleSendInvoice(e)}
                    disabled={sendingInvoice}
                    className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-emerald-700/20 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {sendingInvoice ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Sending Tax Invoice to Buyer...</span>
                      </>
                    ) : (
                      <>
                        <span>🧾</span>
                        <span>Send Total Invoice to Buyer</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        );
      })()}
    </div>
  );
}

