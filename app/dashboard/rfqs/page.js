"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Script from 'next/script';
import SupplierQuoteForm from '@/components/SupplierQuoteForm';
import SmartRFQForm from '@/components/SmartRFQForm';
import DualPaymentModal from '@/components/DualPaymentModal';
import PostPaymentFlow from '@/components/PostPaymentFlow';
import Breadcrumbs from '@/components/Breadcrumbs';
import { STATIC_SECTORS } from '@/constants/sectors';

export default function RFQDashboard() {
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  
  // Toggle between buyer view (My RFQs) and supplier view (Marketplace)
  const [viewRole, setViewRole] = useState('buyer');
  
  // Logistics Flow Modal state
  const [logisticsFlowData, setLogisticsFlowData] = useState(null);
  
  const [selectedRfq, setSelectedRfq] = useState(null);
  const [editingQuote, setEditingQuote] = useState(null);
  const [editingQuoteRfq, setEditingQuoteRfq] = useState(null);
  const [showNewRFQForm, setShowNewRFQForm] = useState(false);
  const [editingRfq, setEditingRfq] = useState(null);
  const [viewingQuotesRfq, setViewingQuotesRfq] = useState(null);
  const [quotesList, setQuotesList] = useState([]);
  const [loadingQuotes, setLoadingQuotes] = useState(false);

  // Buy Now Checkout states
  const [checkoutData, setCheckoutData] = useState(null); // { quote, rfq }
  const [dualPaymentData, setDualPaymentData] = useState(null);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [processingBuyNow, setProcessingBuyNow] = useState(false);
  const [buyNowSuccess, setBuyNowSuccess] = useState(null);

  useEffect(() => {
    // Fetch user profile
    fetch('/api/dashboard/profile')
      .then(res => res.json())
      .then(data => {
        if (data.profile) {
          setProfile(data.profile);
          if (data.profile.warehouse_address) {
            setDeliveryAddress(data.profile.warehouse_address);
          }
          // Default to supplier view for suppliers, buyer view for buyers/others
          if (data.profile.role === 'supplier') {
            setViewRole('supplier');
          } else {
            setViewRole('buyer');
          }
        }
      })
      .catch(err => console.error('Error fetching profile in RFQ dashboard:', err));
  }, []);

  const fetchRfqs = async (currentView) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/rfq?view=${currentView}`);
      if (response.ok) {
        const data = await response.json();
        setRfqs(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Failed to fetch RFQs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile) {
      fetchRfqs(viewRole);
    }
  }, [profile, viewRole]);

  const handleQuoteSuccess = () => {
    setSelectedRfq(null);
    alert("Quotation sent successfully!");
    fetchRfqs(viewRole);
  };

  const handleViewQuotes = async (rfq) => {
    setViewingQuotesRfq(rfq);
    setLoadingQuotes(true);
    setQuotesList([]);
    try {
      const res = await fetch(`/api/rfq/${rfq.id}/quotes`);
      if (res.ok) {
        const data = await res.json();
        setQuotesList(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to load quotes for RFQ:', err);
    } finally {
      setLoadingQuotes(false);
    }
  };

  const handleExecuteBuyNow = (e) => {
    e.preventDefault();
    if (!checkoutData) return;
    try {
      setDualPaymentData({
        quote: checkoutData.quote,
        rfq: checkoutData.rfq,
        deliveryAddress: deliveryAddress || checkoutData.rfq.destination,
      });
      setCheckoutData(null);
    } catch (err) {
      console.error('Buy Now error:', err);
      alert(err.message || 'Payment processing error');
      setProcessingBuyNow(false);
    }
  };

  if (loading && !profile) {
    return (
      <div className="p-8 flex justify-center mt-20">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const isBuyerView = viewRole === 'buyer';

  return (
    <div className="px-4 sm:px-8 pb-16 pt-28 max-w-7xl mx-auto min-h-screen bg-slate-50">
      {/* Top Header & View Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <Breadcrumbs
            items={[
              { label: 'Dashboard', href: '/dashboard' },
              { label: isBuyerView ? 'My Broadcasted Requirements' : 'Live RFQ Marketplace' }
            ]}
            className="mb-1.5"
          />
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {isBuyerView ? 'My Broadcasted Requirements' : 'Live RFQ Marketplace'}
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            {isBuyerView 
              ? 'Manage your bulk procurement requests and review quotes from verified suppliers across India.' 
              : 'Browse live buyer buy leads across 38 industrial sectors and submit your competitive quotes.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* View Role Switcher */}
          <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
            <button
              onClick={() => setViewRole('buyer')}
              className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${viewRole === 'buyer' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
            >
              📋 My Posted RFQs
            </button>
            <button
              onClick={() => setViewRole('supplier')}
              className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${viewRole === 'supplier' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
            >
              🏪 Marketplace RFQs
            </button>
          </div>

          <button
            onClick={() => setShowNewRFQForm(true)}
            className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>+ Broadcast New RFQ</span>
          </button>
        </div>
      </div>

      {/* RFQ Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
           <div className="col-span-full py-20 text-center text-slate-500">
             <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
             Loading requirements...
           </div>
        ) : rfqs.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              {isBuyerView ? "No Broadcasted Requirements Found" : "No Open Marketplace RFQs"}
            </h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">
              {isBuyerView 
                ? "You haven't broadcasted any procurement requests yet. Submit one in 60 seconds to receive competitive bids."
                : "There are no open requirements in the marketplace matching this filter."}
            </p>
            {isBuyerView && (
              <button
                onClick={() => setShowNewRFQForm(true)}
                className="px-6 py-3 bg-brand-600 text-white font-bold rounded-xl shadow-md hover:bg-brand-700 transition-all text-sm"
              >
                + Broadcast Your First RFQ
              </button>
            )}
          </div>
        ) : (
          rfqs.map(rfq => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              key={rfq.id} 
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${rfq.status === 'open' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-700'}`}>
                      ● {rfq.status}
                    </div>
                    {rfq.sector && (
                      <div className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold rounded-full">
                        {STATIC_SECTORS.find(s => s.slug === rfq.sector)?.name || rfq.sector}
                      </div>
                    )}
                    {isBuyerView && (
                      <div className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${
                        (rfq.quotes_count || 0) > 0 
                          ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse' 
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {(rfq.quotes_count || 0) > 0 ? `📩 ${rfq.quotes_count} Quote${rfq.quotes_count > 1 ? 's' : ''}` : '⏳ 0 Quotes'}
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-slate-400">
                    {rfq.created_at ? new Date(rfq.created_at).toLocaleDateString() : 'Active'}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-slate-900 mb-1">{rfq.product_name}</h3>
                    {rfq.users && (
                  <div className="text-xs text-slate-500 mb-4 flex flex-wrap items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span className="font-semibold text-slate-800">{rfq.users.company_name || 'Verified Buyer'}</span>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold rounded-full tracking-wider inline-flex items-center gap-1">
                      <span>✓ GST VERIFIED BUYER</span>
                    </span>
                    {(rfq.users.city || rfq.users.location) && (
                      <span className="text-slate-400">• {rfq.users.city || rfq.users.location}, {rfq.users.state}</span>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-4">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Quantity</div>
                    <div className="font-bold text-slate-900 text-sm">{rfq.quantity} {rfq.unit || 'units'}</div>
                  </div>
                  <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                    <div className="text-[10px] font-semibold text-emerald-600/70 uppercase tracking-wider mb-0.5">Target Price</div>
                    <div className="font-bold text-emerald-700 text-sm">₹{Number(rfq.target_price || 0).toLocaleString('en-IN')} / {rfq.unit || 'unit'}</div>
                  </div>
                  <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                    <div className="text-[10px] font-semibold text-blue-600/70 uppercase tracking-wider mb-0.5">GST Slab</div>
                    <div className="font-bold text-blue-700 text-sm">{rfq.gst_rate !== undefined ? rfq.gst_rate : 18}% GST</div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 sm:col-span-2">
                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Destination</div>
                    <div className="font-bold text-slate-900 text-sm truncate" title={rfq.destination}>{rfq.destination || 'Not Specified'}</div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Deadline</div>
                    <div className="font-bold text-slate-900 text-sm">{rfq.deadline ? new Date(rfq.deadline).toLocaleDateString() : 'Immediate'}</div>
                  </div>
                </div>

                {rfq.notes && (
                  <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl mb-4 italic border-l-2 border-slate-300">
                    "{rfq.notes}"
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2">
                {isBuyerView ? (
                  <>
                    <button 
                      onClick={() => setEditingRfq(rfq)}
                      className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer text-sm"
                      title="Edit RFQ Requirement"
                    >
                      <span>✏️</span> Edit
                    </button>
                    <button 
                      onClick={() => handleViewQuotes(rfq)}
                      className={`flex-1 py-3 font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer text-sm ${
                        (rfq.quotes_count || 0) > 0 
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20' 
                          : 'bg-slate-900 hover:bg-slate-800 text-white'
                      }`}
                    >
                      <span>
                        {(rfq.quotes_count || 0) > 0 
                          ? `View Received Quotes (${rfq.quotes_count})` 
                          : 'View Received Quotes'}
                      </span>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                ) : (
                  (() => {
                    const isOwnRfq = Boolean(
                      profile && (
                        (rfq.buyer_id && (rfq.buyer_id === profile.id || rfq.buyer_id === profile.firebase_uid)) ||
                        (rfq.buyer_email && profile.registered_email && rfq.buyer_email.toLowerCase().trim() === profile.registered_email.toLowerCase().trim()) ||
                        (rfq.buyer_phone && (rfq.buyer_phone === profile.corporate_phone || rfq.buyer_phone === profile.phone_number || rfq.buyer_phone === profile.phone))
                      )
                    );

                    return isOwnRfq ? (
                      <button 
                        onClick={() => {
                          setViewRole('buyer');
                          handleViewQuotes(rfq);
                        }}
                        className="w-full py-3 bg-slate-900 hover:bg-black text-amber-300 font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm border border-slate-700"
                      >
                        <span>🔒 Your RFQ Requirement • View Quotes ({rfq.quotes_count || 0})</span>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    ) : (
                      <button 
                        onClick={() => setSelectedRfq(rfq)}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer text-sm"
                      >
                        <span>Submit Quotation</span>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </button>
                    );
                  })()
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Supplier Quotation Modal */}
      <AnimatePresence>
        {(selectedRfq || editingQuoteRfq) && (
          <SupplierQuoteForm 
            rfq={editingQuoteRfq || selectedRfq} 
            quoteToEdit={editingQuote}
            onClose={() => {
              setSelectedRfq(null);
              setEditingQuote(null);
              setEditingQuoteRfq(null);
            }} 
            onSuccess={() => {
              setSelectedRfq(null);
              setEditingQuote(null);
              setEditingQuoteRfq(null);
              alert(editingQuote ? "Quotation updated successfully!" : "Quotation sent successfully!");
              fetchRfqs(viewRole);
            }}
          />
        )}
      </AnimatePresence>

      {/* Broadcast New RFQ Modal */}
      <AnimatePresence>
        {showNewRFQForm && (
          <SmartRFQForm 
            onClose={() => {
              setShowNewRFQForm(false);
              fetchRfqs(viewRole);
            }} 
          />
        )}
      </AnimatePresence>

      {/* Edit RFQ Modal */}
      <AnimatePresence>
        {editingRfq && (
          <SmartRFQForm 
            rfqToEdit={editingRfq}
            onClose={() => {
              setEditingRfq(null);
              fetchRfqs(viewRole);
            }} 
          />
        )}
      </AnimatePresence>

      {/* Buyer Received Quotes Modal */}
      <AnimatePresence>
        {viewingQuotesRfq && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white text-slate-900 rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden relative max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">Received Quotations</span>
                  <h2 className="text-xl font-extrabold text-gray-900">{viewingQuotesRfq.product_name}</h2>
                  <p className="text-xs text-gray-500">Requirement: {viewingQuotesRfq.quantity} {viewingQuotesRfq.unit} • Target: ₹{viewingQuotesRfq.target_price}</p>
                </div>
                <button 
                  onClick={() => setViewingQuotesRfq(null)}
                  className="text-gray-400 hover:text-gray-700 text-2xl font-bold p-2 cursor-pointer"
                >
                  ×
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                {loadingQuotes ? (
                  <div className="py-12 text-center text-gray-500">
                    <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
                    Fetching received supplier bids...
                  </div>
                ) : quotesList.length === 0 ? (
                  <div className="py-12 text-center bg-slate-50 rounded-2xl p-6">
                    <div className="text-3xl mb-2">⏳</div>
                    <h4 className="font-bold text-gray-900 mb-1">Awaiting Supplier Quotes</h4>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto">
                      Your requirement is actively broadcasted in the marketplace. Verified suppliers matching this product are notified and their bids will appear here.
                    </p>
                  </div>
                ) : (
                  quotesList.map((quote) => {
                    const qty = Number(viewingQuotesRfq.quantity || 1);
                    const totalPayable = Number(quote.quoted_price || 0) > 0
                      ? Number(quote.quoted_price)
                      : (Number(quote.price_before_gst || 0) * qty) + Number(quote.gst_amount || 0);
                    const unitPrice = qty > 0 ? (totalPayable / qty) : totalPayable;
                    const advance10 = Math.round(totalPayable * 0.10);
                    const remaining90 = totalPayable - advance10;

                    return (
                      <div key={quote.id} className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-gray-900 text-base">{quote.users?.company_name || 'Verified Supplier'}</span>
                              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold rounded-full tracking-wider inline-flex items-center gap-1">
                                <span>✓ GST VERIFIED SUPPLIER</span>
                              </span>
                              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold rounded-full">
                                {quote.gst_rate !== undefined ? quote.gst_rate : (viewingQuotesRfq.gst_rate || 18)}% GST Applied
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              Dispatch From: <strong>{quote.supplier_location || 'Warehouse'}</strong> • Est. Delivery: <strong>{quote.delivery_days || 7} days</strong>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-extrabold text-emerald-600">
                              ₹{Math.round(unitPrice).toLocaleString('en-IN')}
                            </div>
                            <div className="text-[10px] text-gray-400">All-Inclusive Final Unit Price ({viewingQuotesRfq.unit ? `₹ / ${viewingQuotesRfq.unit}` : '₹ / unit'})</div>
                          </div>
                        </div>

                        {/* Financial Matrix */}
                        <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs mb-3">
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Total Value</span>
                            <span className="font-bold text-slate-900">₹{totalPayable.toLocaleString('en-IN')}</span>
                          </div>
                          <div>
                            <span className="text-amber-600 block text-[10px] uppercase font-semibold">10% Advance</span>
                            <span className="font-bold text-amber-700">₹{advance10.toLocaleString('en-IN')}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-semibold">90% on Dock</span>
                            <span className="font-bold text-slate-900">₹{remaining90.toLocaleString('en-IN')}</span>
                          </div>
                        </div>

                        {quote.notes && (
                          <div className="text-xs text-gray-600 bg-slate-50 p-2.5 rounded-lg mb-3 italic border-l-2 border-slate-300">
                            "{quote.notes}"
                          </div>
                        )}

                        <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-gray-100">
                          {quote.supplier_id === profile?.id && quote.status !== 'accepted' && (
                            <button
                              onClick={() => {
                                setViewingQuotesRfq(null);
                                setEditingQuoteRfq(viewingQuotesRfq);
                                setEditingQuote(quote);
                              }}
                              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <span>✏️</span> Edit My Quote
                            </button>
                          )}
                          {quote.status === 'accepted' || viewingQuotesRfq.status === 'fulfilled' ? (
                            <div className="flex items-center gap-2">
                              <span className="px-3 py-2 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-extrabold rounded-xl flex items-center gap-1.5">
                                <span>🔒 Escrow Contract Active</span>
                              </span>
                              <Link
                                href="/orders"
                                className="px-5 py-2.5 bg-slate-900 hover:bg-black text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
                              >
                                <span>📦 View in Orders</span>
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                              </Link>
                            </div>
                          ) : (
                            /* PRIMARY BUY NOW BUTTON */
                            <button
                              onClick={() => {
                                setCheckoutData({ quote, rfq: viewingQuotesRfq });
                              }}
                              className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold rounded-xl text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-95"
                            >
                              <span>⚡ Buy Now (Lock 10% Advance: ₹{advance10.toLocaleString('en-IN')})</span>
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                <button
                  onClick={() => setViewingQuotesRfq(null)}
                  className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-xl text-sm transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Buy Now Escrow Checkout Modal */}
      <AnimatePresence>
        {checkoutData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white text-slate-900 rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden relative"
            >
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold rounded-full uppercase tracking-wider">
                      🛡️ 10% Advance Escrow Protected Trade
                    </span>
                    <h3 className="text-xl font-extrabold text-white mt-2">Instant Order Checkout</h3>
                    <p className="text-xs text-slate-300">Lock the trade contract with 10% advance deposit.</p>
                  </div>
                  <button
                    onClick={() => setCheckoutData(null)}
                    className="text-slate-400 hover:text-white text-2xl font-bold p-1 cursor-pointer"
                  >
                    ×
                  </button>
                </div>
              </div>

              <form onSubmit={handleExecuteBuyNow} className="p-6 space-y-5">
                {/* Order Summary Box */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-sm space-y-2.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Commodity:</span>
                    <span className="font-bold text-slate-900">{checkoutData.rfq.product_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Order Quantity:</span>
                    <span className="font-bold text-slate-900">{checkoutData.rfq.quantity} {checkoutData.rfq.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Supplier:</span>
                    <span className="font-bold text-slate-900">{checkoutData.quote.users?.company_name || 'Verified Supplier'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Dispatch Godown:</span>
                    <span className="font-bold text-slate-900">{checkoutData.quote.supplier_location || 'Warehouse'}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-2">
                    <span className="text-slate-500">Total Contract Value:</span>
                    <span className="font-bold text-slate-900">
                      ₹{(Number(checkoutData.quote.quoted_price || 0) > 0
                        ? Number(checkoutData.quote.quoted_price)
                        : (Number(checkoutData.quote.price_before_gst || 0) * Number(checkoutData.rfq.quantity || 1)) + Number(checkoutData.quote.gst_amount || 0)
                      ).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between text-base border-t border-slate-200 pt-2 text-emerald-700 font-extrabold">
                    <span>10% Advance Payable Now:</span>
                    <span>
                      ₹{Math.round((Number(checkoutData.quote.quoted_price || 0) > 0
                        ? Number(checkoutData.quote.quoted_price)
                        : (Number(checkoutData.quote.price_before_gst || 0) * Number(checkoutData.rfq.quantity || 1)) + Number(checkoutData.quote.gst_amount || 0)
                      ) * 0.10).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Delivery Address */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Delivery Warehouse Destination
                  </label>
                  <input
                    type="text"
                    required
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Enter full delivery warehouse address / port destination"
                    className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium"
                  />
                </div>

                {/* Trust guarantee banner */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-emerald-800">
                  <span className="text-lg">🔒</span>
                  <div>
                    <strong>Escrow Protection Active:</strong> Your 10% advance is held securely in escrow and only released to the supplier once goods are loaded and verified on dock.
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setCheckoutData(null)}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={processingBuyNow}
                    className="flex-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-sm transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {processingBuyNow ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Securing Escrow Contract...</span>
                      </>
                    ) : (
                      <>
                        <span>🔒 Lock & Pay 10% Advance</span>
                        <span>
                          (₹{Math.round((Number(checkoutData.quote.quoted_price || 0) > 0
                            ? Number(checkoutData.quote.quoted_price)
                            : (Number(checkoutData.quote.price_before_gst || 0) * Number(checkoutData.rfq.quantity || 1)) + Number(checkoutData.quote.gst_amount || 0)
                          ) * 0.10).toLocaleString('en-IN')})
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Dual Payment Modal (Dynamic Google Pay / UPI QR vs Razorpay) */}
      {dualPaymentData && (
        <DualPaymentModal
          isOpen={!!dualPaymentData}
          onClose={() => setDualPaymentData(null)}
          product={{ title: dualPaymentData.rfq.commodity || dualPaymentData.rfq.sector_id?.name || 'Bulk RFQ Trade Contract' }}
          totalAmount={
            Number(dualPaymentData.quote.quoted_price || 0) > 0
              ? Number(dualPaymentData.quote.quoted_price)
              : (Number(dualPaymentData.quote.price_before_gst || 0) * Number(dualPaymentData.rfq.quantity || 1)) + Number(dualPaymentData.quote.gst_amount || 0)
          }
          quantity={dualPaymentData.rfq.quantity}
          unit={dualPaymentData.rfq.unit}
          supplierName={dualPaymentData.quote.supplier?.company_name || 'Verified Supplier'}
          rfqId={dualPaymentData.rfq.id}
          quoteId={dualPaymentData.quote.id}
          deliveryAddress={dualPaymentData.deliveryAddress}
          onPaymentSuccess={(data) => {
            const totalDealValue = Number(dualPaymentData.quote.quoted_price || 0) > 0
              ? Number(dualPaymentData.quote.quoted_price)
              : (Number(dualPaymentData.quote.price_before_gst || 0) * Number(dualPaymentData.rfq.quantity || 1)) + Number(dualPaymentData.quote.gst_amount || 0);

            const logisticsPayload = {
              product: { title: dualPaymentData.rfq.commodity || dualPaymentData.rfq.product_name || dualPaymentData.rfq.sector_id?.name || 'Bulk RFQ Trade Contract' },
              quantity: dualPaymentData.rfq.quantity || 1000,
              unit: dualPaymentData.rfq.unit || 'Kg',
              pricePerUnit: Math.round(totalDealValue / (Number(dualPaymentData.rfq.quantity) || 1)),
              subtotal: totalDealValue,
              gst: 0,
              logisticsCost: 0,
              total: totalDealValue,
              initialEmail: dualPaymentData.buyerEmail,
              orderId: data.orderId,
              isMandatory: true,
              paymentData: {
                razorpay_payment_id: data.razorpayPaymentId || data.transactionId || data.utr,
                razorpay_order_id: data.razorpayOrderId,
                orderId: data.orderId,
                advanceAmount: data.advancePaid,
              }
            };

            setDualPaymentData(null);
            setLogisticsFlowData(logisticsPayload);
            fetchRfqs(viewRole);
          }}
        />
      )}

      {/* Logistics Selection Modal (Post-Payment Flow) */}
      {logisticsFlowData && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto z-10 rounded-3xl custom-scrollbar"
          >
            {!logisticsFlowData.isMandatory && (
              <div className="sticky top-3 right-3 sm:top-4 sm:right-4 z-50 flex justify-end pr-3 sm:pr-4 pointer-events-none -mb-12">
                <button 
                  type="button"
                  onClick={() => setLogisticsFlowData(null)}
                  className="pointer-events-auto inline-flex items-center gap-2 px-4 py-2 bg-slate-900/90 hover:bg-black text-white rounded-full shadow-2xl border border-white/20 backdrop-blur-md transition-all hover:scale-105 active:scale-95 cursor-pointer text-xs font-extrabold"
                  title="Close"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Close</span>
                </button>
              </div>
            )}
            <PostPaymentFlow 
              initialPhase={2} 
              product={logisticsFlowData.product}
              quantity={logisticsFlowData.quantity}
              unit={logisticsFlowData.unit}
              pricePerUnit={logisticsFlowData.pricePerUnit}
              subtotal={logisticsFlowData.subtotal}
              gst={logisticsFlowData.gst}
              logisticsCost={logisticsFlowData.logisticsCost}
              total={logisticsFlowData.total}
              initialEmail={logisticsFlowData.initialEmail}
              orderId={logisticsFlowData.orderId}
              paymentData={logisticsFlowData.paymentData}
              onClose={() => {
                setLogisticsFlowData(null);
                window.location.href = '/orders';
              }} 
            />
          </motion.div>
        </div>
      )}

      {/* Razorpay Checkout Script */}
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
    </div>
  );
}
