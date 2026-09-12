"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GST_SLABS } from '@/constants/gstSlabs';
import { STATIC_SECTORS } from '@/constants/sectors';

export default function AdminRFQs() {
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingRfq, setEditingRfq] = useState(null);
  const [saving, setSaving] = useState(false);
  const [selectedRfqForDossier, setSelectedRfqForDossier] = useState(null);
  const [sendingEmailQuoteId, setSendingEmailQuoteId] = useState(null);
  const [emailStatusMessage, setEmailStatusMessage] = useState(null);

  useEffect(() => {
    fetchRfqs();
  }, [search]);

  const fetchRfqs = async () => {
    try {
      const res = await fetch(`/api/admin/rfqs?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (res.ok) {
        setRfqs(data.rfqs || []);
        // If an RFQ dossier modal is currently open, refresh its data
        if (selectedRfqForDossier) {
          const updated = (data.rfqs || []).find(r => r.id === selectedRfqForDossier.id);
          if (updated) setSelectedRfqForDossier(updated);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this RFQ? This will also remove any submitted quotes.')) return;
    try {
      setRfqs(prev => prev.filter(r => r.id !== id));
      if (editingRfq?.id === id) setEditingRfq(null);

      const res = await fetch(`/api/admin/rfqs?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        fetchRfqs();
        alert(data.error || 'Failed to delete RFQ');
      }
    } catch (err) {
      fetchRfqs();
      alert('Error: ' + err.message);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/rfqs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rfqId: editingRfq.id,
          updates: {
            status: editingRfq.status,
            product_name: editingRfq.product_name,
            sector: editingRfq.sector || editingRfq.category || 'food-agriculture',
            category: editingRfq.sector || editingRfq.category || 'food-agriculture',
            quantity: editingRfq.quantity,
            target_price: parseFloat(editingRfq.target_price) || 0,
            destination: editingRfq.destination,
            gst_rate: Number(editingRfq.gst_rate) || 18,
          }
        })
      });
      if (res.ok) {
        setEditingRfq(null);
        fetchRfqs();
      } else {
        alert('Failed to update RFQ');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSendEmailToBuyer = async (quoteId, rfqId) => {
    setSendingEmailQuoteId(quoteId);
    setEmailStatusMessage(null);
    try {
      const res = await fetch(`/api/admin/rfqs/${rfqId}/send-quote-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quoteId })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch quotation email');
      }

      const targetEmail = data.recipientEmail || selectedRfqForDossier?.buyer_email || selectedRfqForDossier?.users?.registered_email || 'buyer';
      setEmailStatusMessage({ type: 'success', text: `✓ Quotation email dispatched to buyer (${targetEmail})` });
      
      // Update local state in dossier
      if (selectedRfqForDossier) {
        const updatedQuotes = (selectedRfqForDossier.quotes || []).map(q => {
          if (q.id === quoteId) return { ...q, email_sent_to_buyer: true, email_sent_at: new Date().toISOString() };
          return q;
        });
        setSelectedRfqForDossier({ ...selectedRfqForDossier, quotes: updatedQuotes });
      }
    } catch (err) {
      console.error('Email dispatch error:', err);
      setEmailStatusMessage({ type: 'error', text: err.message || 'Email dispatch failed' });
    } finally {
      setSendingEmailQuoteId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">RFQ & Quotations Oversight</h2>
          <p className="text-slate-500 mt-1 text-sm">
            Monitor buyer requirements, review supplier godown dossiers, and mediate quotation email dispatch to buyers.
          </p>
        </div>
        <div className="w-full md:w-80">
          <input 
            type="text" 
            placeholder="Search by product, buyer, or supplier..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl shadow-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-slate-900 text-sm font-medium"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-bold">
                <th className="px-5 py-4">RFQ Ref</th>
                <th className="px-5 py-4">Requirement</th>
                <th className="px-5 py-4">Quantity & Target</th>
                <th className="px-5 py-4">Buyer Contact Details</th>
                <th className="px-5 py-4 text-center">Supplier Quotes</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Date</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="8" className="p-8 text-center text-slate-500">Loading RFQs & Supplier Quotes...</td></tr>
              ) : rfqs.length === 0 ? (
                <tr><td colSpan="8" className="p-12 text-center text-slate-500">No RFQs found matching your criteria.</td></tr>
              ) : (
                rfqs.map((rfq) => {
                  const quoteCount = rfq.quote_count || rfq.quotes?.length || 0;
                  const buyerPhone = rfq.buyer_phone || rfq.users?.corporate_phone || rfq.users?.phone;
                  const buyerEmail = rfq.buyer_email || rfq.users?.registered_email;

                  return (
                    <tr key={rfq.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4 font-mono text-xs font-bold text-slate-700">
                        #{rfq.id.split('-')[0].toUpperCase()}
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900 text-sm">{rfq.product_name}</div>
                        <div className="text-xs text-slate-500 truncate max-w-xs" title={rfq.destination}>
                          📍 {rfq.destination || 'India'}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs">
                        <div className="font-bold text-slate-900">{rfq.quantity} {rfq.unit}</div>
                        <div className="text-emerald-700 font-bold">₹{Number(rfq.target_price || 0).toLocaleString('en-IN')} / {rfq.unit}</div>
                        <div className="text-[10px] text-blue-700 font-semibold mt-0.5 inline-block bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                          {rfq.gst_rate !== undefined ? rfq.gst_rate : 18}% GST
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs">
                        <div className="font-bold text-slate-900">{rfq.users?.company_name || 'Verified Buyer'}</div>
                        <div className="text-slate-500 truncate max-w-[200px]" title={buyerEmail}>{buyerEmail || 'No email on file'}</div>
                        <div className="mt-1 space-y-0.5">
                          {buyerPhone && (
                            <div className="text-blue-600 font-semibold flex items-center gap-1">
                              <span>📞 {buyerPhone}</span>
                            </div>
                          )}
                          {rfq.buyer_alternate_phone && (
                            <div className="text-emerald-700 font-semibold text-[11px] flex items-center gap-1 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 inline-flex">
                              <span>📱 Alt: {rfq.buyer_alternate_phone}</span>
                            </div>
                          )}
                          {(rfq.buyer_gst || rfq.users?.gst_number) && (
                            <div className="text-slate-600 font-mono text-[10px] flex items-center gap-1 pt-0.5">
                              <span className="text-slate-400">GST:</span>
                              <span className="font-bold text-slate-800">{rfq.buyer_gst || rfq.users?.gst_number}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <button
                          onClick={() => setSelectedRfqForDossier(rfq)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-sm ${
                            quoteCount > 0
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100 hover:scale-105'
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          <span>📩 {quoteCount} {quoteCount === 1 ? 'Quote' : 'Quotes'}</span>
                          <span className="text-[10px] text-emerald-600 font-bold underline">Inspect</span>
                        </button>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          rfq.status === 'open' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          rfq.status === 'closed' ? 'bg-slate-100 text-slate-600 border-slate-300' :
                          rfq.status === 'fulfilled' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                          'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                          {rfq.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-500 whitespace-nowrap">
                        {new Date(rfq.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-5 py-4 text-right space-x-2 whitespace-nowrap">
                        <button 
                          onClick={() => setSelectedRfqForDossier(rfq)}
                          className="text-brand-700 hover:text-brand-900 font-bold text-xs bg-brand-50 hover:bg-brand-100 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                          title="View supplier quotations, phone, email, and godown dossiers"
                        >
                          Dossier ({quoteCount})
                        </button>
                        <button 
                          onClick={() => setEditingRfq(rfq)}
                          className="text-slate-700 hover:text-slate-900 font-bold text-xs bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(rfq.id)}
                          className="text-red-600 hover:text-red-800 font-bold text-xs bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          Delete
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

      {/* Admin Supplier Quotations & Godown Dossier Inspection Modal */}
      <AnimatePresence>
        {selectedRfqForDossier && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white text-slate-900 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden relative"
            >
              {/* Header */}
              <div className="p-6 bg-slate-900 text-white flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 bg-brand-500/20 text-brand-300 border border-brand-400/30 text-[10px] font-bold rounded-full uppercase tracking-wider">
                      Admin Intelligence Dossier
                    </span>
                    <span className="text-xs text-slate-400">Ref #{selectedRfqForDossier.id.slice(0, 8).toUpperCase()}</span>
                  </div>
                  <h3 className="text-2xl font-extrabold text-white">{selectedRfqForDossier.product_name}</h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Requirement: <strong>{selectedRfqForDossier.quantity} {selectedRfqForDossier.unit}</strong> • Target Budget: <strong>₹{Number(selectedRfqForDossier.target_price || 0).toLocaleString('en-IN')}</strong> • Destination: <strong>{selectedRfqForDossier.destination}</strong>
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedRfqForDossier(null);
                    setEmailStatusMessage(null);
                  }}
                  className="text-slate-400 hover:text-white text-2xl font-bold p-1 cursor-pointer"
                >
                  ×
                </button>
              </div>

              {/* Dossier Body */}
              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                {emailStatusMessage && (
                  <div className={`p-3.5 rounded-xl text-xs font-bold flex items-center justify-between ${
                    emailStatusMessage.type === 'success' 
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}>
                    <span>{emailStatusMessage.text}</span>
                    <button onClick={() => setEmailStatusMessage(null)} className="text-slate-400 hover:text-slate-700 ml-2 font-bold">×</button>
                  </div>
                )}

                {/* Buyer Profile & Contact Summary */}
                <div className="bg-brand-50/70 border border-brand-200/80 rounded-2xl p-4.5 text-xs">
                  <div className="font-extrabold text-brand-900 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
                    <span>🏢 Buyer Organization & Direct Contact Profile</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-slate-800">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-semibold">Company Name</span>
                      <strong className="text-slate-900 text-sm block truncate" title={selectedRfqForDossier.users?.company_name}>{selectedRfqForDossier.users?.company_name || 'Verified Buyer'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-semibold">Primary Phone</span>
                      <a href={`tel:${selectedRfqForDossier.buyer_phone || selectedRfqForDossier.users?.corporate_phone}`} className="font-bold text-blue-600 hover:underline text-sm block">
                        📞 {selectedRfqForDossier.buyer_phone || selectedRfqForDossier.users?.corporate_phone || 'On file'}
                      </a>
                      {selectedRfqForDossier.buyer_alternate_phone && (
                        <div className="mt-1">
                          <span className="text-[9px] uppercase font-bold text-emerald-700 block">Alternate Contact</span>
                          <a href={`tel:${selectedRfqForDossier.buyer_alternate_phone}`} className="font-bold text-emerald-700 hover:underline text-xs">
                            📱 {selectedRfqForDossier.buyer_alternate_phone}
                          </a>
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-semibold">Buyer Email ID</span>
                      <a href={`mailto:${selectedRfqForDossier.buyer_email || selectedRfqForDossier.users?.registered_email}`} className="font-bold text-blue-600 hover:underline truncate block text-xs mt-0.5" title={selectedRfqForDossier.buyer_email || selectedRfqForDossier.users?.registered_email}>
                        ✉️ {selectedRfqForDossier.buyer_email || selectedRfqForDossier.users?.registered_email || 'On file'}
                      </a>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-semibold">Buyer GSTIN</span>
                      <span className="font-mono font-bold text-slate-900 block text-xs mt-0.5">
                        {selectedRfqForDossier.buyer_gst || selectedRfqForDossier.users?.gst_number ? (
                          <span className="text-emerald-700">{selectedRfqForDossier.buyer_gst || selectedRfqForDossier.users?.gst_number}</span>
                        ) : (
                          <span className="text-slate-400 font-normal italic">Not Provided</span>
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-semibold">Delivery Destination</span>
                      <span className="font-bold text-slate-900 truncate block text-xs mt-0.5" title={selectedRfqForDossier.destination}>
                        📍 {selectedRfqForDossier.destination || 'India Port / Site'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-base font-extrabold text-slate-900 mb-3 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span>Quoting Suppliers & Confidential Contact Dossiers</span>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full text-xs font-bold">
                        {selectedRfqForDossier.quotes?.length || 0} Quotes Received
                      </span>
                    </span>
                  </h4>

                  {(!selectedRfqForDossier.quotes || selectedRfqForDossier.quotes.length === 0) ? (
                    <div className="py-12 text-center bg-slate-50 rounded-2xl border border-slate-200 p-6">
                      <div className="text-3xl mb-2">⏳</div>
                      <div className="font-bold text-slate-800">No Supplier Quotations Received Yet</div>
                      <div className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                        This requirement has been broadcasted across the marketplace. As suppliers submit quotations, their contact phone number, email ID, and godown address will appear here.
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {selectedRfqForDossier.quotes.map((quote, idx) => {
                        const quantity = Number(selectedRfqForDossier.quantity || 1);
                        const totalDealValue = Number(quote.quoted_price || 0) > 0
                          ? Number(quote.quoted_price)
                          : (Number(quote.price_before_gst || 0) * quantity) + Number(quote.gst_amount || 0);
                        const unitPrice = quantity > 0 ? (totalDealValue / quantity) : totalDealValue;
                        const advance10 = totalDealValue * 0.10;
                        const balance90 = totalDealValue * 0.90;
                        const isEmailSent = quote.email_sent_to_buyer;

                        return (
                          <div 
                            key={quote.id || idx}
                            className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-sm hover:border-brand-400 transition-all space-y-4"
                          >
                            {/* Top Supplier Identity & Price Header */}
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-100">
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-extrabold text-base text-slate-900">{quote.supplier_name}</span>
                                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-full uppercase">
                                    {quote.verification_level || 'Verified Supplier'}
                                  </span>
                                  <span className="text-xs text-slate-400">
                                    • Bid #{idx + 1}
                                  </span>
                                </div>
                                <div className="text-xs text-slate-500 mt-0.5">
                                  Authorized Signatory: <strong>{quote.contact_person}</strong>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-black text-emerald-600">
                                  ₹{Math.round(unitPrice).toLocaleString('en-IN')}
                                </div>
                                <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Quoted Unit Price ({selectedRfqForDossier.unit ? `₹ / ${selectedRfqForDossier.unit}` : '₹ / unit'})</div>
                              </div>
                            </div>

                            {/* Full Supplier Dossier Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                              {/* Contact Dossier */}
                              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-2">
                                <div className="font-bold text-slate-900 uppercase tracking-wider text-[10px] text-brand-700 border-b border-slate-200 pb-1 flex items-center justify-between">
                                  <span>📞 Supplier Direct Contact (Admin Only)</span>
                                  <span className="text-emerald-700 font-bold bg-emerald-100/80 px-2 py-0.5 rounded text-[9px]">Confidential</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-500">Phone / Mobile:</span>
                                  <a href={`tel:${quote.supplier_phone || quote.phone}`} className="font-bold text-blue-600 hover:underline">
                                    {quote.supplier_phone || quote.phone}
                                  </a>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-500">Email ID:</span>
                                  <a href={`mailto:${quote.supplier_email || quote.email}`} className="font-bold text-blue-600 hover:underline truncate max-w-[200px]" title={quote.supplier_email || quote.email}>
                                    {quote.supplier_email || quote.email}
                                  </a>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-500">GSTIN:</span>
                                  <span className="font-mono font-bold text-slate-800">{quote.gstin || 'GST Registered'}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-500">PAN Number:</span>
                                  <span className="font-mono font-bold text-slate-800">{quote.pan || 'PAN Verified'}</span>
                                </div>
                              </div>

                              {/* Godown & Logistics Dossier */}
                              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-2">
                                <div className="font-bold text-slate-900 uppercase tracking-wider text-[10px] text-amber-700 border-b border-slate-200 pb-1 flex items-center gap-1.5">
                                  <span>🏭 Godown / Warehouse Infrastructure</span>
                                </div>
                                <div>
                                  <span className="text-slate-500 block">Warehouse / Godown Address:</span>
                                  <span className="font-semibold text-slate-800 block mt-0.5">
                                    {quote.godown_address || quote.supplier_location || 'Warehouse address on file'}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between pt-1">
                                  <span className="text-slate-500">Dispatch Godown City:</span>
                                  <span className="font-bold text-slate-900">{quote.supplier_location || quote.city || 'Local Hub'}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-500">Est. Transit Time:</span>
                                  <span className="font-bold text-emerald-700">{quote.delivery_days || 7} Days</span>
                                </div>
                              </div>
                            </div>

                            {/* Bidding Breakdown Matrix */}
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                  📊 Deal Financials & Escrow Breakdown
                                </span>
                                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 font-extrabold text-xs">
                                  Order Volume: {selectedRfqForDossier.quantity} {selectedRfqForDossier.unit}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-2 text-xs">
                                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Base Unit Price</span>
                                  <span className="font-bold text-slate-900">₹{Number(quote.price_before_gst || 0).toLocaleString('en-IN')}</span>
                                  <span className="text-[10px] text-slate-400 block">/ {selectedRfqForDossier.unit}</span>
                                </div>
                                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Total GST ({quote.gst_rate || 18}%)</span>
                                  <span className="font-bold text-emerald-700">+₹{Number(quote.gst_amount || 0).toLocaleString('en-IN')}</span>
                                  <span className="text-[10px] text-slate-400 block">Full lot</span>
                                </div>
                                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">
                                    Platform Fee ({quote.category_fee_percent !== undefined ? quote.category_fee_percent : (quote.platform_fee_percent || 3)}%)
                                  </span>
                                  <span className="font-bold text-blue-700">₹{Number(quote.platform_fee || Math.round(totalDealValue * 0.03) || 0).toLocaleString('en-IN')}</span>
                                  <span className="text-[10px] text-blue-600 block">Category commission</span>
                                </div>
                                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">All-In Unit Rate</span>
                                  <span className="font-extrabold text-slate-900">₹{Math.round(unitPrice).toLocaleString('en-IN')}</span>
                                  <span className="text-[10px] text-slate-400 block">/ {selectedRfqForDossier.unit}</span>
                                </div>
                                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">10% Advance</span>
                                  <span className="font-black text-emerald-700">₹{Math.round(advance10).toLocaleString('en-IN')}</span>
                                  <span className="text-[10px] text-emerald-600 block">Lock escrow</span>
                                </div>
                                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">90% on Dock</span>
                                  <span className="font-bold text-slate-900">₹{Math.round(balance90).toLocaleString('en-IN')}</span>
                                  <span className="text-[10px] text-slate-400 block">Gate pass</span>
                                </div>
                                <div className="bg-brand-50/80 p-2.5 rounded-xl border border-brand-200">
                                  <span className="text-brand-800 block text-[10px] uppercase font-extrabold">Total Deal Value</span>
                                  <span className="font-black text-brand-900 text-sm">₹{totalDealValue.toLocaleString('en-IN')}</span>
                                  <span className="text-[10px] text-brand-700 block font-semibold">For {selectedRfqForDossier.quantity} {selectedRfqForDossier.unit}</span>
                                </div>
                              </div>
                            </div>

                            {quote.notes && (
                              <div className="text-xs text-slate-700 bg-amber-50/60 p-3 rounded-xl border border-amber-200 italic">
                                <strong>Supplier Remarks / Terms:</strong> "{quote.notes}"
                              </div>
                            )}

                            {/* Admin Quotation Email Dispatch Control */}
                            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                              <div className="text-xs text-slate-500">
                                {isEmailSent ? (
                                  <span className="inline-flex items-center gap-1.5 text-emerald-700 font-bold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                                    <span>✓ Dispatched to Buyer Email</span>
                                    {quote.email_sent_at && (
                                      <span className="text-[10px] text-emerald-600 font-normal">
                                        ({new Date(quote.email_sent_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })})
                                      </span>
                                    )}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 text-amber-700 font-semibold bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 text-[11px]">
                                    <span>⏳ Pending Admin Email Dispatch</span>
                                  </span>
                                )}
                              </div>

                              <button
                                onClick={() => handleSendEmailToBuyer(quote.id, selectedRfqForDossier.id)}
                                disabled={sendingEmailQuoteId === quote.id}
                                className={`px-5 py-2.5 font-bold rounded-xl text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer ${
                                  isEmailSent
                                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                                    : 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white shadow-orange-600/20 hover:scale-[1.02]'
                                }`}
                              >
                                {sendingEmailQuoteId === quote.id ? (
                                  <>
                                    <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    <span>Sending Email to Buyer...</span>
                                  </>
                                ) : (
                                  <>
                                    <span>📧 {isEmailSent ? 'Resend Quotation Email to Buyer' : 'Send Quotation to Buyer Email'}</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setSelectedRfqForDossier(null);
                    setEmailStatusMessage(null);
                  }}
                  className="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl text-sm hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Close Dossier
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* RFQ Edit Modal */}
      {editingRfq && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-lg"
          >
            <h3 className="text-xl font-bold text-slate-900 mb-4">Edit RFQ Requirement</h3>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Product / Commodity Name</label>
                <input 
                  type="text"
                  value={editingRfq.product_name}
                  onChange={(e) => setEditingRfq({...editingRfq, product_name: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-slate-900 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Industry Sector / Category</label>
                <select
                  value={editingRfq.sector || editingRfq.category || 'food-agriculture'}
                  onChange={(e) => setEditingRfq({...editingRfq, sector: e.target.value, category: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none bg-white font-semibold text-xs sm:text-sm text-slate-900"
                >
                  {STATIC_SECTORS.map((s) => (
                    <option key={s.slug} value={s.slug}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Quantity</label>
                  <input 
                    type="number" 
                    value={editingRfq.quantity} 
                    onChange={(e) => setEditingRfq({...editingRfq, quantity: parseInt(e.target.value) || 1})} 
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-slate-900 font-semibold" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Target Price (₹)</label>
                  <input 
                    type="number" 
                    step="any"
                    value={editingRfq.target_price || ''} 
                    onChange={(e) => setEditingRfq({...editingRfq, target_price: e.target.value})} 
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-slate-900 font-semibold" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Delivery Destination</label>
                <input 
                  type="text" 
                  value={editingRfq.destination || ''} 
                  onChange={(e) => setEditingRfq({...editingRfq, destination: e.target.value})} 
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-slate-900 font-semibold" 
                  placeholder="City, State / Warehouse Location"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">GST Category Slab</label>
                  <select
                    value={editingRfq.gst_rate !== undefined ? editingRfq.gst_rate : 18}
                    onChange={(e) => setEditingRfq({...editingRfq, gst_rate: Number(e.target.value)})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none bg-white font-semibold text-xs sm:text-sm text-slate-900"
                  >
                    {GST_SLABS.map(slab => (
                      <option key={slab.rate} value={slab.rate}>
                        {slab.shortLabel}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Status</label>
                  <select 
                    value={editingRfq.status}
                    onChange={(e) => setEditingRfq({...editingRfq, status: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none bg-white font-semibold text-xs sm:text-sm text-slate-900"
                  >
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                    <option value="fulfilled">Fulfilled</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button 
                  type="button"
                  onClick={() => setEditingRfq(null)}
                  className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
