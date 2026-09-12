"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import DualPaymentModal from '@/components/DualPaymentModal';
import PostPaymentFlow from '@/components/PostPaymentFlow';
import Breadcrumbs from '@/components/Breadcrumbs';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/services/supabase';

export default function OrdersPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [buyerEmail, setBuyerEmail] = useState('');
  const [orders, setOrders] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'quotes', 'orders'
  const [bookingQuoteId, setBookingQuoteId] = useState(null);
  const [paymentQuote, setPaymentQuote] = useState(null);
  const [bookSuccessModal, setBookSuccessModal] = useState(null);
  
  // Logistics Setup Modal state
  const [logisticsModalOrder, setLogisticsModalOrder] = useState(null);
  
  // Read-only Logistics Pass Viewer Modal state
  const [viewLogisticsPassOrder, setViewLogisticsPassOrder] = useState(null);

  // Resend Receipt Modal state
  const [receiptModalOrder, setReceiptModalOrder] = useState(null);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccessMsg, setSendSuccessMsg] = useState(null);
  const [sendErrorMsg, setSendErrorMsg] = useState(null);

  // Direct Total GST Tax Invoice state
  const [sendingInvoiceId, setSendingInvoiceId] = useState(null);
  const [invoiceToast, setInvoiceToast] = useState(null);

  // Spam banner dismiss state
  const [dismissSpamBanner, setDismissSpamBanner] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock background body and html scroll when any modal is open so only the modal can scroll
  useEffect(() => {
    const isModalOpen = Boolean(
      logisticsModalOrder ||
      viewLogisticsPassOrder ||
      receiptModalOrder ||
      paymentQuote ||
      bookSuccessModal
    );

    if (isModalOpen) {
      const originalHtmlOverflow = document.documentElement.style.overflow;
      const originalBodyOverflow = document.body.style.overflow;
      const originalBodyTouchAction = document.body.style.touchAction;
      const originalBodyPaddingRight = document.body.style.paddingRight;

      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
      if (scrollBarWidth > 0) {
        document.body.style.paddingRight = `${scrollBarWidth}px`;
      }

      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';

      // Intercept wheel and touchmove events outside or at boundaries of the active modal container
      // to guarantee the background site NEVER scrolls, while allowing smooth scroll strictly inside the modal
      const handlePreventBackgroundScroll = (e) => {
        const scrollableContainer = e.target.closest('[data-modal-scroll="true"]');
        if (!scrollableContainer) {
          e.preventDefault();
          return;
        }

        // Inside the modal: prevent scroll chaining to the background when hitting top or bottom boundaries
        if (e.type === 'wheel') {
          const { scrollTop, scrollHeight, clientHeight } = scrollableContainer;
          const isAtTop = scrollTop <= 0 && e.deltaY < 0;
          const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1 && e.deltaY > 0;
          if (isAtTop || isAtBottom) {
            e.preventDefault();
          }
        }
      };

      window.addEventListener('wheel', handlePreventBackgroundScroll, { passive: false });
      window.addEventListener('touchmove', handlePreventBackgroundScroll, { passive: false });

      return () => {
        document.documentElement.style.overflow = originalHtmlOverflow;
        document.body.style.overflow = originalBodyOverflow;
        document.body.style.touchAction = originalBodyTouchAction;
        document.body.style.paddingRight = originalBodyPaddingRight;
        window.removeEventListener('wheel', handlePreventBackgroundScroll);
        window.removeEventListener('touchmove', handlePreventBackgroundScroll);
      };
    }
  }, [logisticsModalOrder, viewLogisticsPassOrder, receiptModalOrder, paymentQuote, bookSuccessModal]);

  useEffect(() => {
    if (!authLoading) {
      const activeEmail = (user?.email || profile?.registered_email || '')?.toLowerCase()?.trim();
      if (activeEmail) {
        setBuyerEmail(activeEmail);
        if (typeof window !== 'undefined') {
          localStorage.setItem('b2b_buyer_email', activeEmail);
        }
      } else {
        setBuyerEmail('');
        if (typeof window !== 'undefined') {
          localStorage.removeItem('b2b_buyer_email');
        }
      }
    }
  }, [user, profile, authLoading]);

  useEffect(() => {
    if (!authLoading && mounted) {
      fetchOrders();
    }
  }, [search, buyerEmail, authLoading, mounted]);

  const fetchOrders = async (emailOverride) => {
    try {
      setLoading(true);
      const emailToUse = emailOverride !== undefined
        ? emailOverride
        : (buyerEmail || user?.email || profile?.registered_email || '');

      const queryParams = new URLSearchParams();
      if (search) queryParams.set('search', search);
      if (emailToUse) queryParams.set('email', emailToUse);

      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const headers = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const res = await fetch(`/api/orders/list?${queryParams.toString()}`, { headers });
      const data = await res.json();
      if (res.ok) {
        setOrders(data.orders || []);
        setQuotations(data.quotations || []);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBookQuote = (quote) => {
    setPaymentQuote(quote);
  };

  const handleCopy = (text, id) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openReceiptModal = (order) => {
    setReceiptModalOrder(order);
    setRecipientEmail(order.buyer_email || '');
    setSendSuccessMsg(null);
    setSendErrorMsg(null);
  };

  const handleSendReceipt = async (e) => {
    e.preventDefault();
    if (!recipientEmail || !recipientEmail.includes('@')) {
      setSendErrorMsg('Please enter a valid email address.');
      return;
    }

    try {
      setIsSending(true);
      setSendErrorMsg(null);
      setSendSuccessMsg(null);

      const res = await fetch('/api/orders/resend-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: receiptModalOrder.id || receiptModalOrder.transaction_id,
          email: recipientEmail.trim()
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSendSuccessMsg(`✓ Official 10% payment receipt successfully sent to ${data.recipientEmail || recipientEmail}!`);
      } else {
        setSendErrorMsg(data.error || 'Failed to dispatch receipt email.');
      }
    } catch (err) {
      setSendErrorMsg('Error sending email: ' + err.message);
    } finally {
      setIsSending(false);
    }
  };

  const handleSendDirectTotalInvoice = async (order) => {
    const targetEmail = (order.buyer_email || buyerEmail || user?.email || profile?.registered_email || '').trim();
    const orderRef = order.id || order.transaction_id;

    if (!targetEmail || !targetEmail.includes('@')) {
      alert('Valid registered email address is required to dispatch total tax invoice.');
      return;
    }

    try {
      setSendingInvoiceId(orderRef);
      setInvoiceToast(null);

      const res = await fetch('/api/orders/send-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderRef,
          email: targetEmail
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setInvoiceToast({
          type: 'success',
          text: data.message || `✓ Official 100% GST Tax Invoice successfully emailed to ${targetEmail}!`
        });
        setTimeout(() => setInvoiceToast(null), 9000);
      } else {
        setInvoiceToast({
          type: 'error',
          text: data.error || 'Failed to dispatch total tax invoice.'
        });
        setTimeout(() => setInvoiceToast(null), 8000);
      }
    } catch (err) {
      setInvoiceToast({
        type: 'error',
        text: 'Error sending invoice email: ' + err.message
      });
      setTimeout(() => setInvoiceToast(null), 8000);
    } finally {
      setSendingInvoiceId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'settled':
      case 'completed':
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
            ✓ Delivered / Settled
          </span>
        );
      case 'collected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
            ✅ Collected at Godown
          </span>
        );
      case 'price_locked_10':
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300">
            🔒 10% Advance Escrow Paid
          </span>
        );
      case 'warehouse_loading':
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-purple-100 text-purple-800 border border-purple-300">
            🏭 Warehouse Loading
          </span>
        );
      case 'in_transit':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-800 border border-blue-300 animate-pulse">
            🚚 In Transit (Dispatched)
          </span>
        );
      case 'ready_for_pickup':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-indigo-100 text-indigo-800 border border-indigo-300">
            🏢 Ready for Godown Pickup
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-300">
            ✕ Cancelled
          </span>
        );
      case 'rerouted':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-orange-100 text-orange-800 border border-orange-300">
            🔄 AI Rerouted
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-slate-100 text-slate-800 border border-slate-300">
            ⏳ {status || 'Processing'}
          </span>
        );
    }
  };

  const confirmedOrders = orders.filter(o => !['cancelled', 'payment_failed', 'quotation_issued'].includes(o.order_status) && o.payment_status !== 'payment_failed' && o.payment_status !== 'unpaid');
  const failedOrders = orders.filter(o => ['cancelled', 'payment_failed'].includes(o.order_status) || o.payment_status === 'payment_failed');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 pt-24 sm:pt-28 pb-20 px-4 sm:px-6 lg:px-8" suppressHydrationWarning>
        <div className="max-w-6xl mx-auto space-y-6" suppressHydrationWarning>

          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <Breadcrumbs
                items={[
                  { label: 'Home', href: '/' },
                  { label: 'My Orders & Receipts' }
                ]}
                className="mb-2"
              />
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-600">
                <span>B2B India Trade Fulfillment</span>
                <span>•</span>
                <span>10% Escrow Protection</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-1">
                My Orders & Booking Receipts
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                Track your placed orders, verified 10% advance payments, delivery dispatches, and godown gate passes.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/directory"
                className="px-4 py-2.5 bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-bold rounded-xl transition-all border border-brand-200 shadow-sm"
              >
                + Place New Order
              </Link>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* PROMINENT SPAM BOX NOTIFICATION ALERT BANNER */}
          {/* ========================================================================= */}
          {!dismissSpamBanner && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 sm:p-5 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border-2 border-amber-400/80 rounded-2xl sm:rounded-3xl shadow-sm relative overflow-hidden"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-xl font-bold flex-shrink-0 shadow-md shadow-amber-500/20">
                  📬
                </div>
                <div className="flex-1 text-xs sm:text-sm text-slate-800 pr-6">
                  <div className="font-extrabold text-amber-950 text-sm sm:text-base flex items-center gap-2">
                    <span>Email Receipt Delivery Notice</span>
                    <span className="text-[10px] uppercase font-black bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">Important</span>
                  </div>
                  <p className="mt-1 text-slate-700 leading-relaxed font-medium">
                    We automatically email your official <strong>10% Amount Paid Receipt & Order Book Pass</strong> right after checkout. 
                    If you do not see our receipt email in your primary inbox, please <strong className="text-amber-900 underline">check your Spam, Junk, or Promotions folder</strong> and mark our address (<code className="bg-amber-100/80 px-1.5 py-0.5 rounded font-mono text-amber-950 font-bold">b2bbharat.in@gmail.com</code>) as <strong>&quot;Not Spam / Safe Sender&quot;</strong> to guarantee instant delivery and logistics status notifications.
                  </p>
                </div>
                <button
                  onClick={() => setDismissSpamBanner(true)}
                  className="absolute top-3 right-3 text-slate-400 hover:text-slate-700 p-1 text-sm font-bold"
                  title="Dismiss Notice"
                  suppressHydrationWarning
                >
                  ✕
                </button>
              </div>
            </motion.div>
          )}

          {/* Direct Total Invoice Dispatch Alert Toast */}
          <AnimatePresence>
            {invoiceToast && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between shadow-md border ${
                  invoiceToast.type === 'error'
                    ? 'bg-rose-50 text-rose-900 border-rose-200'
                    : 'bg-emerald-50 text-emerald-950 border-2 border-emerald-300 shadow-emerald-500/10'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{invoiceToast.type === 'error' ? '⚠️' : '🧾'}</span>
                  <span>{invoiceToast.text}</span>
                </div>
                <button 
                  onClick={() => setInvoiceToast(null)} 
                  className="text-slate-400 hover:text-slate-700 ml-2 text-sm font-bold cursor-pointer"
                >
                  ✕
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Active Account Filter Indicator */}
          {buyerEmail && (
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-emerald-50 border border-emerald-200/90 rounded-2xl text-xs text-emerald-950 font-semibold shadow-xs">
              <div className="flex items-center gap-2">
                <span className="text-sm">👤</span>
                <span>Active Account Orders:</span>
                <span className="font-bold font-mono bg-white px-2.5 py-0.5 rounded-lg border border-emerald-300 text-emerald-900 shadow-xs">{buyerEmail}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-100/70 px-2.5 py-1 rounded-lg border border-emerald-300">
                <span>🔒</span>
                <span>Private &amp; Secure Escrow Orders</span>
              </div>
            </div>
          )}

          {/* Search & Lookup Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3" suppressHydrationWarning>
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 text-sm">
                🔍
              </span>
              <input
                type="text"
                placeholder="Search by Transaction ID (e.g. TXN-IND-...), email, receiver, or product..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-medium"
                suppressHydrationWarning
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 text-xs"
                  suppressHydrationWarning
                >
                  ✕
                </button>
              )}
            </div>
            <button
              onClick={fetchOrders}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
              suppressHydrationWarning
            >
              🔄 Refresh Orders
            </button>
          </div>

          {/* Tab Filter Navigation */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3" suppressHydrationWarning>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'all'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
              suppressHydrationWarning
            >
              <span>📋 All Items</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${activeTab === 'all' ? 'bg-slate-700 text-slate-100' : 'bg-slate-100 text-slate-700'}`}>
                {confirmedOrders.length + quotations.length + failedOrders.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('quotes')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'quotes'
                  ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md shadow-orange-600/20'
                  : 'bg-white text-slate-600 hover:bg-orange-50 hover:text-orange-700 border border-slate-200'
              }`}
              suppressHydrationWarning
            >
              <span>⚡ Received Quotations (Ready for 10% Booking)</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${activeTab === 'quotes' ? 'bg-orange-800/60 text-white' : 'bg-orange-100 text-orange-800'}`}>
                {quotations.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'orders'
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
              suppressHydrationWarning
            >
              <span>🔒 Confirmed 10% Advance Orders</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${activeTab === 'orders' ? 'bg-brand-800/60 text-white' : 'bg-brand-100 text-brand-800'}`}>
                {confirmedOrders.length}
              </span>
            </button>

            {failedOrders.length > 0 && (
              <button
                onClick={() => setActiveTab('failed')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'failed'
                    ? 'bg-rose-700 text-white shadow-md shadow-rose-700/20'
                    : 'bg-white text-rose-600 hover:bg-rose-50 border border-rose-200'
                }`}
                suppressHydrationWarning
              >
                <span>❌ Failed / Cancelled Attempts</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${activeTab === 'failed' ? 'bg-rose-900 text-white' : 'bg-rose-100 text-rose-800'}`}>
                  {failedOrders.length}
                </span>
              </button>
            )}
          </div>

          {/* ========================================================================= */}
          {/* RECEIVED QUOTATIONS READY FOR 10% ESCROW BOOKING */}
          {/* ========================================================================= */}
          {(activeTab === 'all' || activeTab === 'quotes') && quotations.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                    <span>⚡ Received Quotations Ready to Book</span>
                    <span className="px-2.5 py-0.5 bg-orange-100 text-orange-800 text-xs font-black rounded-full">
                      {quotations.length} Deals
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Compare supplier rates for your RFQs and lock your order with a 10% escrow advance.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {quotations.map((q) => (
                  <motion.div
                    key={q.quote_id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl border-2 border-orange-200 shadow-sm hover:shadow-md transition-all overflow-hidden"
                  >
                    {/* Header */}
                    <div className="bg-orange-50/70 p-4 sm:p-5 border-b border-orange-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="bg-gradient-to-r from-orange-600 to-amber-600 text-white text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-xs">
                          ⚡ RFQ Quotation • Bid #{q.bid_number}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">
                          Ref: #{q.rfq_id.slice(0, 8).toUpperCase()}
                        </span>
                        <span className="text-xs text-slate-400">
                          • Received {new Date(q.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <div>
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300">
                          ⏳ Ready for 10% Advance Booking
                        </span>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                      {/* Left Details */}
                      <div className="lg:col-span-7 space-y-4">
                        <div>
                          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">RFQ Requirement</div>
                          <h3 className="text-2xl font-black text-slate-900 mt-1">{q.product_name}</h3>
                          <div className="text-sm font-bold text-slate-700 mt-1">
                            Quantity: <span className="text-brand-700">{Number(q.quantity).toLocaleString('en-IN')} {q.unit}</span>
                            {q.destination && <span className="text-slate-400 font-normal"> • Delivery: 📍 {q.destination}</span>}
                          </div>
                        </div>

                        {/* Supplier Dossier */}
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs space-y-2">
                          <div className="font-extrabold text-slate-900 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <span>🏭</span> {q.supplier_name}
                            </span>
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                              Verified Supplier
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 pt-1">
                            <div>📍 Dispatch: <strong>{q.supplier_location}</strong></div>
                            <div>⏱️ Transit: <strong>{q.delivery_days} Days</strong></div>
                            {q.supplier_phone && <div>📞 Contact: <strong>{q.supplier_phone}</strong></div>}
                            {q.supplier_email && <div className="truncate">✉️ Email: <strong>{q.supplier_email}</strong></div>}
                          </div>
                          {q.notes && (
                            <div className="pt-1 text-slate-500 italic border-t border-slate-200">
                              &ldquo;{q.notes}&rdquo;
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right Financials & Action */}
                      <div className="lg:col-span-5 bg-gradient-to-br from-slate-50 to-orange-50/40 p-5 rounded-2xl border border-orange-200/80 flex flex-col justify-between h-full space-y-4">
                        <div className="space-y-3 text-xs">
                          <div className="flex justify-between items-center text-slate-600">
                            <span>All-Inclusive Unit Rate:</span>
                            <strong className="text-slate-900 text-sm">₹{q.unit_rate.toLocaleString('en-IN')} / {q.unit}</strong>
                          </div>
                          <div className="flex justify-between items-center text-slate-600">
                            <span>Total Deal Value ({Number(q.quantity).toLocaleString('en-IN')} {q.unit}):</span>
                            <strong className="text-slate-900 text-base font-black">₹{q.total_deal_value.toLocaleString('en-IN')}</strong>
                          </div>
                          <div className="pt-2 border-t border-orange-200/80 flex justify-between items-center text-emerald-800 font-extrabold text-sm">
                            <span>🔒 10% Advance to Book:</span>
                            <span className="text-lg font-black text-emerald-700">₹{q.advance_10_percent.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between items-center text-[11px] text-slate-500">
                            <span>90% on Dock Balance:</span>
                            <span>₹{q.balance_90_percent.toLocaleString('en-IN')}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleBookQuote(q)}
                          disabled={bookingQuoteId === q.quote_id}
                          className="w-full py-3.5 px-4 bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 hover:from-orange-700 hover:to-amber-700 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg shadow-orange-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                        >
                          {bookingQuoteId === q.quote_id ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>Booking 10% Escrow Contract...</span>
                            </>
                          ) : (
                            <>
                              <span>🔒</span>
                              <span>Book Order with 10% Advance (₹{q.advance_10_percent.toLocaleString('en-IN')}) →</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* CONFIRMED 10% ADVANCE ORDERS */}
          {/* ========================================================================= */}
          {(activeTab === 'all' || activeTab === 'orders') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <span>📦 Confirmed 10% Advance Orders</span>
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-black rounded-full">
                    {confirmedOrders.length} Confirmed
                  </span>
                </h2>
              </div>

              {loading ? (
                <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center text-slate-400 animate-pulse font-medium">
                  <div className="text-3xl mb-2">⏳</div>
                  Loading your orders and 10% payment clearance records...
                </div>
              ) : confirmedOrders.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center text-slate-500 shadow-sm">
                  <div className="text-4xl mb-3">📦</div>
                  <h3 className="text-lg font-bold text-slate-800">No Confirmed Orders Found</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                    {search
                      ? `No confirmed orders matching "${search}". Try searching with your Transaction ID or registered email.`
                      : 'Orders you place with 10% advance escrow protection will appear here.'}
                  </p>
                  <div className="mt-5">
                    <Link
                      href="/directory"
                      className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                    >
                      Explore Commodity Directory
                    </Link>
                  </div>
                </div>
              ) : (
                confirmedOrders.map((order) => {
                const isDeliver = order.delivery_option === 'deliver';
                const isPickup = order.delivery_option === 'pickup';

                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all overflow-hidden"
                  >
                    {/* Card Top Header */}
                    <div className="bg-slate-50/80 p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2.5">
                        {/* Transaction ID Badge */}
                        <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-slate-200 shadow-2xs font-mono text-xs font-black text-slate-900">
                          <span>{order.transaction_id || order.id}</span>
                          <button
                            onClick={() => handleCopy(order.transaction_id || order.id, order.id)}
                            className="text-slate-400 hover:text-slate-700 text-xs pl-1"
                            title="Copy Transaction ID"
                          >
                            {copiedId === order.id ? '✅ Copied' : '📋 Copy'}
                          </button>
                        </div>

                        <span className="text-xs text-slate-400 font-mono">
                          Ref: {order.id.slice(0, 14)}...
                        </span>

                        <span className="text-xs text-slate-400">
                          • Placed on {new Date(order.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {getStatusBadge(order.order_status || order.status)}
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                      {/* Left: Product & Pricing (Cols 7) */}
                      <div className="lg:col-span-7 space-y-4">
                        <div>
                          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ordered Commodity</div>
                          <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
                            {order.product_name || 'Commercial Commodity Order'}
                          </h3>
                          <div className="text-xs text-slate-600 mt-1 flex flex-wrap items-center gap-2">
                            <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                              {Number(order.quantity || 1).toLocaleString('en-IN')} {order.unit || 'Kg'}
                            </span>
                            {order.price_per_unit && (
                              <span>@ ₹{order.price_per_unit}/{order.unit || 'Kg'}</span>
                            )}
                            {order.buyer_email && (
                              <span className="text-slate-400">• Buyer: <strong className="text-slate-700">{order.buyer_email}</strong></span>
                            )}
                          </div>
                        </div>

                        {/* Financial Card */}
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                          <div>
                            <div className="text-slate-500 font-medium">Total Contract Value</div>
                            <div className="text-sm font-black text-slate-900 mt-0.5">
                              ₹{Number(order.total_amount || 0).toLocaleString('en-IN')}
                            </div>
                          </div>

                          <div>
                            <div className="text-emerald-700 font-extrabold flex items-center gap-1">
                              <span>✓ 10% Advance Paid</span>
                            </div>
                            <div className="text-sm font-black text-emerald-700 mt-0.5">
                              ₹{Number(order.advance_amount || (order.total_amount * 0.1) || 0).toLocaleString('en-IN')}
                            </div>
                            <div className="text-[10px] text-emerald-600 font-bold">Escrow Cleared</div>
                          </div>

                          <div className="col-span-2 sm:col-span-1">
                            <div className="text-orange-700 font-medium">Balance at Dispatch (90%)</div>
                            <div className="text-sm font-black text-orange-800 mt-0.5">
                              ₹{(Number(order.total_amount || 0) - Number(order.advance_amount || (order.total_amount * 0.1) || 0)).toLocaleString('en-IN')}
                            </div>
                          </div>
                        </div>

                        {/* Live Fulfillment & Dispatch Status Stepper */}
                        {(() => {
                          const statusKey = order.order_status || order.dispatch_status || order.delivery_status || order.status || 'confirmed';
                          const isPickupOrder = isPickup;

                          let stepIndex = 1;
                          if (statusKey === 'settled' || statusKey === 'delivered' || statusKey === 'collected' || statusKey === 'completed') {
                            stepIndex = 4;
                          } else if (statusKey === 'in_transit' || statusKey === 'ready_for_pickup' || statusKey === 'dispatched' || statusKey === 'out_for_delivery') {
                            stepIndex = 3;
                          } else if (statusKey === 'warehouse_loading' || statusKey === 'processing' || statusKey === 'loading') {
                            stepIndex = 2;
                          } else {
                            stepIndex = 1;
                          }

                          return (
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/90 space-y-3">
                              {/* Prominent Status Notice Banner */}
                              {statusKey === 'ready_for_pickup' && (
                                <div className="p-3 bg-gradient-to-r from-indigo-50 via-purple-50 to-indigo-50 border border-indigo-200 rounded-xl text-xs flex items-center justify-between gap-2 shadow-xs">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xl">🏢</span>
                                    <div>
                                      <div className="font-extrabold text-indigo-950 flex items-center gap-1.5">
                                        <span>Ready for Central Godown Pickup!</span>
                                      </div>
                                      <p className="text-[11px] text-indigo-900/85 mt-0.5">
                                        Your commodity has cleared godown dock inspection. Driver may present Gate Pass <strong className="font-mono text-indigo-950 bg-indigo-100/80 px-1.5 py-0.5 rounded font-bold">{order.tracking_number || 'GATE-PASS-ACTIVE'}</strong> at the gate.
                                      </p>
                                    </div>
                                  </div>
                                  <span className="shrink-0 px-2.5 py-1 bg-indigo-600 text-white font-black text-[10px] rounded-lg uppercase tracking-wider animate-pulse">
                                    Ready at Gate
                                  </span>
                                </div>
                              )}

                              {(statusKey === 'in_transit' || statusKey === 'dispatched' || statusKey === 'out_for_delivery') && (
                                <div className="p-3 bg-gradient-to-r from-blue-50 via-sky-50 to-blue-50 border border-blue-200 rounded-xl text-xs flex items-center justify-between gap-2 shadow-xs">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xl">🚚</span>
                                    <div>
                                      <div className="font-extrabold text-blue-950 flex items-center gap-1.5">
                                        <span>Shipment Dispatched & In Transit!</span>
                                      </div>
                                      <p className="text-[11px] text-blue-900/85 mt-0.5">
                                        Commercial logistics carrier has loaded your goods and is en route. Tracking Ref: <strong className="font-mono text-blue-950 bg-blue-100/80 px-1.5 py-0.5 rounded font-bold">{order.tracking_number || 'AWB-IN-TRANSIT'}</strong>.
                                      </p>
                                    </div>
                                  </div>
                                  <span className="shrink-0 px-2.5 py-1 bg-blue-600 text-white font-black text-[10px] rounded-lg uppercase tracking-wider animate-pulse">
                                    In Transit
                                  </span>
                                </div>
                              )}

                              {(statusKey === 'warehouse_loading' || statusKey === 'processing' || statusKey === 'loading') && (
                                <div className="p-3 bg-gradient-to-r from-purple-50 via-fuchsia-50 to-purple-50 border border-purple-200 rounded-xl text-xs flex items-center justify-between gap-2 shadow-xs">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xl">🏭</span>
                                    <div>
                                      <div className="font-extrabold text-purple-950">Warehouse Loading in Progress</div>
                                      <p className="text-[11px] text-purple-900/85 mt-0.5">
                                        Goods are being verified, weighed, and staged at the warehouse loading dock for dispatch.
                                      </p>
                                    </div>
                                  </div>
                                  <span className="shrink-0 px-2.5 py-1 bg-purple-600 text-white font-black text-[10px] rounded-lg uppercase tracking-wider">
                                    Loading Bay
                                  </span>
                                </div>
                              )}

                              {(statusKey === 'confirmed' || statusKey === 'price_locked_10') && (
                                <div className="p-3 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border border-amber-200 rounded-xl text-xs flex items-center justify-between gap-2 shadow-xs">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xl">🔒</span>
                                    <div>
                                      <div className="font-extrabold text-amber-950">10% Advance Paid • Order Confirmed</div>
                                      <p className="text-[11px] text-amber-900/85 mt-0.5">
                                        Escrow advance received. Order is confirmed and queued for central warehouse allocation.
                                      </p>
                                    </div>
                                  </div>
                                  <span className="shrink-0 px-2.5 py-1 bg-amber-600 text-white font-black text-[10px] rounded-lg uppercase tracking-wider">
                                    Confirmed
                                  </span>
                                </div>
                              )}

                              {(statusKey === 'delivered' || statusKey === 'settled' || statusKey === 'completed' || statusKey === 'collected') && (
                                <div className="p-3 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 rounded-xl text-xs flex items-center justify-between gap-2 shadow-xs">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xl">✅</span>
                                    <div>
                                      <div className="font-extrabold text-emerald-950">
                                        {isPickupOrder ? 'Godown Pickup Collected & Settled!' : 'Delivery & Final Settlement Complete!'}
                                      </div>
                                      <p className="text-[11px] text-emerald-900/85 mt-0.5">
                                        {isPickupOrder
                                          ? 'Consignment picked up and accepted from warehouse dock. 100% full deal completed and escrow closed.'
                                          : 'Goods inspected and accepted. 100% full deal completed and platform escrow closed.'}
                                      </p>
                                    </div>
                                  </div>
                                  <span className="shrink-0 px-2.5 py-1 bg-emerald-600 text-white font-black text-[10px] rounded-lg uppercase tracking-wider">
                                    {isPickupOrder ? 'Collected' : 'Settled'}
                                  </span>
                                </div>
                              )}

                              {/* 4-Step Progress Stepper */}
                              <div className="pt-1">
                                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1.5 px-1">
                                  <span>1. Advance Escrow</span>
                                  <span>2. Godown Staging</span>
                                  <span>{isPickupOrder ? '3. Gate Pickup' : '3. In Transit'}</span>
                                  <span>4. Completed</span>
                                </div>
                                <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                                  {/* Step 1 */}
                                  <div className={`p-2 rounded-xl border text-center transition-all ${
                                    stepIndex >= 1 
                                      ? 'bg-amber-50 border-amber-300 text-amber-950 font-extrabold shadow-2xs' 
                                      : 'bg-white border-slate-200 text-slate-400'
                                  }`}>
                                    <div className="text-xs">🔒</div>
                                    <div className="text-[10px] leading-tight mt-0.5">Confirmed</div>
                                  </div>

                                  {/* Step 2 */}
                                  <div className={`p-2 rounded-xl border text-center transition-all ${
                                    stepIndex >= 2 
                                      ? 'bg-purple-50 border-purple-300 text-purple-950 font-extrabold shadow-2xs' 
                                      : 'bg-white border-slate-200 text-slate-400'
                                  }`}>
                                    <div className="text-xs">🏭</div>
                                    <div className="text-[10px] leading-tight mt-0.5">Loading</div>
                                  </div>

                                  {/* Step 3 */}
                                  <div className={`p-2 rounded-xl border text-center transition-all ${
                                    stepIndex >= 3 
                                      ? (isPickupOrder 
                                          ? 'bg-indigo-50 border-indigo-400 text-indigo-950 font-black ring-2 ring-indigo-500/20 shadow-2xs' 
                                          : 'bg-blue-50 border-blue-400 text-blue-950 font-black ring-2 ring-blue-500/20 shadow-2xs') 
                                      : 'bg-white border-slate-200 text-slate-400'
                                  }`}>
                                    <div className="text-xs">{isPickupOrder ? '🏢' : '🚚'}</div>
                                    <div className="text-[10px] leading-tight mt-0.5">{isPickupOrder ? 'Ready Pickup' : 'In Transit'}</div>
                                  </div>

                                  {/* Step 4 */}
                                  <div className={`p-2 rounded-xl border text-center transition-all ${
                                    stepIndex >= 4 
                                      ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-extrabold shadow-2xs' 
                                      : 'bg-white border-slate-200 text-slate-400'
                                  }`}>
                                    <div className="text-xs">✅</div>
                                    <div className="text-[10px] leading-tight mt-0.5">{isPickupOrder ? 'Collected' : 'Delivered'}</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Right: Logistics & Action Buttons (Cols 5) */}
                      {(() => {
                        const hasCompletedLogistics = Boolean(
                          (isDeliver && (order.delivery_address || order.delivery_city || order.delivery_state)) ||
                          (isPickup && (order.arrival_date || order.p1_name || order.vehicle_number))
                        );

                        return (
                          <div className="lg:col-span-5 space-y-4 flex flex-col justify-between h-full">
                            {/* Logistics Info Box */}
                            <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 space-y-2.5 text-xs">
                              <div className="font-extrabold text-slate-900 uppercase tracking-wider flex items-center justify-between">
                                <span>{isDeliver ? '🚚 Direct Delivery' : isPickup ? '🏢 Self Godown Pickup' : '📦 Logistics Mode'}</span>
                                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${hasCompletedLogistics ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'}`}>
                                  {order.tracking_number || (hasCompletedLogistics ? 'GATE-PASS-ISSUED' : 'LOGISTICS-PENDING')}
                                </span>
                              </div>

                              {!hasCompletedLogistics ? (
                                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 space-y-1.5">
                                  <div className="font-bold flex items-center gap-1.5 text-amber-800">
                                    <span>⚠️</span> Logistics Setup Missing
                                  </div>
                                  <p className="text-[11px] text-amber-700 leading-tight">
                                    You have not submitted delivery or visitor pickup details. Complete this step to generate your official Gate Pass & AWB tracking.
                                  </p>
                                  <button
                                    onClick={() => setLogisticsModalOrder({ ...order, isMandatory: false })}
                                    className="w-full mt-1 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold rounded-lg text-xs transition-all shadow-sm cursor-pointer"
                                  >
                                    🚚 Fill Pickup / Delivery Details →
                                  </button>
                                </div>
                              ) : null}

                              {isDeliver && hasCompletedLogistics && (
                                <div className="space-y-1 text-slate-600">
                                  <div><strong className="text-slate-800">Delivery Date:</strong> {order.delivery_date || 'Scheduled'}</div>
                                  <div className="break-words text-xs max-w-full" title={order.delivery_address}><strong className="text-slate-800">Address:</strong> {order.delivery_address || 'On file'}</div>
                                  <div><strong className="text-slate-800">Receiver:</strong> {order.receiver_name || 'Site In-Charge'} ({order.receiver_phone || 'N/A'})</div>
                                  <div className="text-[10px] text-amber-800 font-semibold flex items-center gap-1 pt-1.5 border-t border-slate-200">
                                    <span>🚛</span> Truck charges applicable depending on goods weight &amp; distance
                                  </div>
                                  <div className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                                    <span>🔒</span> Details locked & finalized for security clearance
                                  </div>
                                </div>
                              )}

                              {isPickup && hasCompletedLogistics && (
                                <div className="space-y-1 text-slate-600">
                                  <div><strong className="text-slate-800">Arrival at Godown:</strong> {order.arrival_date || 'Scheduled'}</div>
                                  <div><strong className="text-slate-800">Vehicle / Truck No:</strong> {order.vehicle_number || 'Registered'}</div>
                                  <div><strong className="text-slate-800">Visitor 1 (Driver):</strong> {order.p1_name || 'Driver'} {order.p1_aadhar ? `(Aadhar: •••• ${order.p1_aadhar.slice(-4)})` : ''}</div>
                                  {order.p2_name && (
                                    <div><strong className="text-slate-800">Visitor 2:</strong> {order.p2_name} {order.p2_aadhar ? `(Aadhar: •••• ${order.p2_aadhar.slice(-4)})` : ''}</div>
                                  )}
                                  <div className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1 pt-1.5 border-t border-slate-200">
                                    <span>🔒</span> Details locked & finalized for gate security clearance
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-2">
                              {hasCompletedLogistics ? (
                                <div className="flex flex-col sm:flex-row gap-2">
                                  <button
                                    onClick={() => setViewLogisticsPassOrder(order)}
                                    className="flex-1 py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-extrabold shadow-sm hover:shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                  >
                                    <span>🔒 View Pass</span>
                                  </button>
                                  <button
                                    onClick={() => setLogisticsModalOrder({ ...order, isMandatory: false, isEdit: true })}
                                    className="flex-1 py-2.5 px-3 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-2xl text-xs font-black shadow-xs hover:shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                    title="Update address or driver details (fulfillment mode is locked)"
                                  >
                                    <span>✏️ Update Details</span>
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setLogisticsModalOrder({ ...order, isMandatory: false })}
                                  className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-2xl text-xs font-black shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer animate-pulse"
                                >
                                  <span>🚚 Fill Pickup / Delivery Details (Required) →</span>
                                </button>
                              )}

                              {/* Invoice & Receipt Actions: Remove 10% Receipt and JUST show Total Invoice once order is warehouse loading, ready, or collected */}
                              {(() => {
                                const currentStatus = (order.order_status || order.dispatch_status || order.delivery_status || order.status || '').toLowerCase();
                                const canShowTotalInvoice = ['warehouse_loading', 'loading', 'collected', 'ready_for_pickup', 'in_transit', 'out_for_delivery', 'delivered', 'settled', 'completed'].includes(currentStatus);

                                if (canShowTotalInvoice) {
                                  const isSendingThis = sendingInvoiceId === (order.id || order.transaction_id);

                                  return (
                                    <div className="pt-1">
                                      <button
                                        type="button"
                                        onClick={() => handleSendDirectTotalInvoice(order)}
                                        disabled={isSendingThis}
                                        className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 hover:from-blue-800 hover:via-indigo-800 hover:to-black text-white rounded-2xl text-xs font-black shadow-md shadow-indigo-600/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-60"
                                        title="Directly send complete 100% GST Tax Invoice to your email"
                                      >
                                        {isSendingThis ? (
                                          <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            <span>Sending Total GST Invoice to your Mail...</span>
                                          </>
                                        ) : (
                                          <>
                                            <span className="text-sm group-hover:scale-110 transition-transform">🧾</span>
                                            <span>Send Total GST Invoice to My Mail</span>
                                          </>
                                        )}
                                      </button>
                                    </div>
                                  );
                                }

                                // In early Confirmed 10% Advance stage, show the 10% advance receipt button
                                return (
                                  <button
                                    onClick={() => openReceiptModal(order)}
                                    className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-2xl text-xs font-extrabold shadow-md shadow-emerald-600/15 hover:shadow-lg transition-all flex items-center justify-center gap-2 group cursor-pointer"
                                  >
                                    <span className="text-sm group-hover:scale-110 transition-transform">✉️</span>
                                    <span>Share / Resend 10% Receipt Email</span>
                                  </button>
                                );
                              })()}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        )}

          {/* ========================================================================= */}
          {/* FAILED / CANCELLED PAYMENT ATTEMPTS */}
          {/* ========================================================================= */}
          {(activeTab === 'all' || activeTab === 'failed') && failedOrders.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <span>❌ Payment Failed / Cancelled Attempts</span>
                  <span className="px-2.5 py-0.5 bg-rose-100 text-rose-800 text-xs font-black rounded-full">
                    {failedOrders.length} Incomplete
                  </span>
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {failedOrders.map((order) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl border-2 border-rose-200 shadow-sm overflow-hidden"
                  >
                    <div className="bg-rose-50/80 p-4 border-b border-rose-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-rose-900 bg-white px-2 py-0.5 rounded-lg border border-rose-200">
                          {order.transaction_id || order.id}
                        </span>
                        <span className="text-xs text-rose-700 font-bold">
                          • Payment Failed / Cancelled
                        </span>
                      </div>
                      <span className="px-2.5 py-1 bg-rose-100 text-rose-800 rounded-full text-xs font-black border border-rose-200">
                        ✕ Order Not Confirmed
                      </span>
                    </div>

                    <div className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h4 className="font-black text-slate-900 text-base">{order.product_name || 'Wholesale Order'}</h4>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Amount: ₹{Number(order.total_amount || 0).toLocaleString('en-IN')} • Qty: {order.quantity || 1} {order.unit || 'Kg'}
                        </div>
                        {order.notes && (
                          <div className="text-xs text-rose-600 font-medium mt-1">
                            Reason: {order.notes}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Link
                          href={`/directory`}
                          className="flex-1 sm:flex-none px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black text-center shadow-md shadow-rose-600/20 transition-all"
                        >
                          🔄 Retry Checkout / Reorder
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ========================================================================= */}
      {/* MODAL: RESEND / SHARE RECEIPT EMAIL */}
      {/* ========================================================================= */}
      {receiptModalOrder && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overscroll-contain overflow-hidden"
          onClick={(e) => {
            if (e.target === e.currentTarget) setReceiptModalOrder(null);
          }}
          onWheel={(e) => {
            if (e.target === e.currentTarget) e.stopPropagation();
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            data-modal-scroll="true"
            className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 w-full max-w-lg space-y-5 overscroll-contain"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                  10% Advance Receipt Dispatch
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">
                  Resend Official Order Receipt
                </h3>
                <div className="text-xs font-mono text-slate-400 mt-0.5">
                  Ref: {receiptModalOrder.transaction_id || receiptModalOrder.id}
                </div>
              </div>
              <button
                onClick={() => setReceiptModalOrder(null)}
                className="text-slate-400 hover:text-slate-700 p-1 text-lg rounded-xl hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {/* Order Brief */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 text-xs space-y-1">
              <div className="font-bold text-slate-900">{receiptModalOrder.product_name}</div>
              <div className="text-slate-600 flex justify-between">
                <span>Quantity: <strong>{Number(receiptModalOrder.quantity || 1).toLocaleString('en-IN')} {receiptModalOrder.unit || 'Kg'}</strong></span>
                <span>Total: <strong>₹{Number(receiptModalOrder.total_amount || 0).toLocaleString('en-IN')}</strong></span>
              </div>
              <div className="text-emerald-700 font-extrabold pt-1 border-t border-slate-200/60 flex justify-between">
                <span>10% Advance Paid (Escrow):</span>
                <span>₹{Number(receiptModalOrder.advance_amount || (receiptModalOrder.total_amount * 0.1) || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Spam folder notice in modal */}
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <span>📬</span>
                <span>Email Delivery Advice:</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-800">
                Receipts are sent instantly from <strong>b2bbharat.in@gmail.com</strong>. If not visible in your inbox within 1 minute, please check your <strong>Spam / Promotions</strong> folder and mark as safe.
              </p>
            </div>

            {/* Feedback Notifications */}
            {sendSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold">
                {sendSuccessMsg}
              </div>
            )}
            {sendErrorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-300 text-rose-900 rounded-xl text-xs font-bold">
                {sendErrorMsg}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSendReceipt} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Recipient Email Address
                </label>
                <input
                  type="email"
                  required
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="Enter email to receive receipt (e.g. buyer@company.com)"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-xs text-slate-900 font-medium bg-white"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  You can send this to your own email or share a copy with your accounts / logistics team.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReceiptModalOrder(null)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isSending}
                  className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isSending ? (
                    <span>⏳ Sending Receipt...</span>
                  ) : (
                    <span>✉️ Dispatch Receipt</span>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DUAL PAYMENT MODAL (GOOGLE PAY / DYNAMIC UPI QR vs RAZORPAY) */}
      {/* ========================================================================= */}
      {paymentQuote && (
        <DualPaymentModal
          isOpen={!!paymentQuote}
          onClose={() => setPaymentQuote(null)}
          product={{ title: paymentQuote.product_name }}
          totalAmount={paymentQuote.total_deal_value}
          quantity={paymentQuote.quantity}
          unit={paymentQuote.unit}
          supplierName={paymentQuote.supplier_name}
          rfqId={paymentQuote.rfq_id}
          quoteId={paymentQuote.quote_id}
          deliveryAddress={paymentQuote.destination}
          onPaymentSuccess={(data) => {
            const currentQuote = paymentQuote;
            setPaymentQuote(null);
            
            // Instantly remove booked quote from "Received Quotations Ready to Book" list
            if (currentQuote) {
              setQuotations(prev => prev.filter(q => q.quote_id !== currentQuote.quote_id && q.rfq_id !== currentQuote.rfq_id));
            }

            // Immediately switch to Confirmed Orders tab
            setActiveTab('orders');

            // Immediately mandate the Logistics & Delivery Setup Form
            setLogisticsModalOrder({
              id: data.orderId,
              product_name: currentQuote?.product_name || 'Wholesale Commodity Order',
              quantity: currentQuote?.quantity || 1000,
              unit: currentQuote?.unit || 'Kg',
              price_per_unit: currentQuote?.unit_price || 0,
              total_amount: currentQuote?.total_deal_value || 0,
              advance_amount: data.advancePaid,
              buyer_email: recipientEmail,
              isMandatory: true,
              paymentData: {
                razorpay_payment_id: data.razorpayPaymentId || data.transactionId || data.utr,
                razorpay_order_id: data.razorpayOrderId,
                orderId: data.orderId,
                advanceAmount: data.advancePaid,
              }
            });

            fetchOrders();
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* LOGISTICS & SELF PICKUP / DIRECT DELIVERY MODAL (POST-PAYMENT FLOW) */}
      {/* ========================================================================= */}
      {logisticsModalOrder && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overscroll-contain overflow-hidden"
          onClick={(e) => {
            if (e.target === e.currentTarget && !logisticsModalOrder.isMandatory) {
              setLogisticsModalOrder(null);
              fetchOrders();
            }
          }}
          onWheel={(e) => {
            if (e.target === e.currentTarget) e.stopPropagation();
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            data-modal-scroll="true"
            className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto z-10 rounded-3xl custom-scrollbar overscroll-contain bg-white shadow-2xl"
          >
            {!logisticsModalOrder.isMandatory && (
              <div className="sticky top-3 right-3 sm:top-4 sm:right-4 z-50 flex justify-end pr-3 sm:pr-4 pointer-events-none -mb-12">
                <button 
                  type="button"
                  onClick={() => {
                    setLogisticsModalOrder(null);
                    fetchOrders();
                  }}
                  className="pointer-events-auto inline-flex items-center gap-2 px-4 py-2 bg-slate-900/90 hover:bg-black text-white rounded-full shadow-2xl border border-white/20 backdrop-blur-md transition-all hover:scale-105 active:scale-95 cursor-pointer text-xs font-extrabold"
                  title="Close & return to orders"
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
              product={{ title: logisticsModalOrder.product_name || 'Wholesale Commodity' }}
              quantity={logisticsModalOrder.quantity || 1000}
              unit={logisticsModalOrder.unit || 'Kg'}
              pricePerUnit={logisticsModalOrder.price_per_unit || (logisticsModalOrder.total_amount / (logisticsModalOrder.quantity || 1))}
              subtotal={logisticsModalOrder.subtotal || logisticsModalOrder.total_amount}
              gst={logisticsModalOrder.gst || 0}
              logisticsCost={logisticsModalOrder.logistics_cost || 0}
              total={logisticsModalOrder.total_amount || 0}
              initialEmail={logisticsModalOrder.buyer_email || ''}
              orderId={logisticsModalOrder.id}
              initialDeliveryOption={
                logisticsModalOrder.delivery_option ||
                (logisticsModalOrder.delivery_address || logisticsModalOrder.delivery_city || logisticsModalOrder.delivery_state ? 'deliver' : (logisticsModalOrder.arrival_date || logisticsModalOrder.vehicle_number || logisticsModalOrder.p1_name ? 'pickup' : null))
              }
              initialFormData={{
                buyerEmail: logisticsModalOrder.buyer_email || '',
                deliveryDate: logisticsModalOrder.delivery_date || '',
                deliveryState: logisticsModalOrder.delivery_state || '',
                deliveryCity: logisticsModalOrder.delivery_city || '',
                deliveryVillage: logisticsModalOrder.delivery_village || '',
                deliveryCustomVillage: logisticsModalOrder.delivery_custom_village || '',
                deliveryPincode: logisticsModalOrder.delivery_pincode || '',
                deliveryStreet: logisticsModalOrder.delivery_street || '',
                deliveryAddress: logisticsModalOrder.delivery_address || '',
                receiverName: logisticsModalOrder.receiver_name || '',
                receiverPhone: logisticsModalOrder.receiver_phone || '',
                transporterName: logisticsModalOrder.transporter_name || '',
                arrivalDate: logisticsModalOrder.arrival_date || '',
                visitorCount: logisticsModalOrder.visitor_count ? String(logisticsModalOrder.visitor_count) : (logisticsModalOrder.p2_name ? '2' : '1'),
                vehicleNumber: logisticsModalOrder.vehicle_number || '',
                p1Name: logisticsModalOrder.p1_name || '',
                p1Phone: logisticsModalOrder.p1_phone || '',
                p1Aadhar: logisticsModalOrder.p1_aadhar || '',
                p2Name: logisticsModalOrder.p2_name || '',
                p2Phone: logisticsModalOrder.p2_phone || '',
                p2Aadhar: logisticsModalOrder.p2_aadhar || '',
              }}
              paymentData={logisticsModalOrder.paymentData || {
                razorpay_payment_id: logisticsModalOrder.transaction_id || `TXN-ORD-${logisticsModalOrder.id.slice(0, 6)}`,
                orderId: logisticsModalOrder.id,
                advanceAmount: logisticsModalOrder.advance_amount || (logisticsModalOrder.total_amount * 0.1),
              }}
              onClose={() => {
                setLogisticsModalOrder(null);
                setActiveTab('orders');
                fetchOrders();
              }} 
            />
          </motion.div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* READ-ONLY OFFICIAL LOGISTICS & GATE PASS MODAL */}
      {/* ========================================================================= */}
      {viewLogisticsPassOrder && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overscroll-contain overflow-hidden"
          onClick={(e) => {
            if (e.target === e.currentTarget) setViewLogisticsPassOrder(null);
          }}
          onWheel={(e) => {
            if (e.target === e.currentTarget) e.stopPropagation();
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            data-modal-scroll="true"
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-slate-100 relative overflow-hidden max-h-[92vh] overflow-y-auto custom-scrollbar overscroll-contain"
          >
            <div className="sticky top-0 z-20 flex justify-end pointer-events-none -mb-10">
              <button 
                type="button"
                onClick={() => setViewLogisticsPassOrder(null)}
                className="pointer-events-auto inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900/90 hover:bg-black text-white rounded-full shadow-lg border border-white/20 backdrop-blur-md transition-all hover:scale-105 active:scale-95 cursor-pointer text-xs font-bold"
                title="Close pass"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Close</span>
              </button>
            </div>

            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl font-black shadow-md shadow-emerald-500/10">
                🔒
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Official Logistics Pass (Locked)
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-0.5">
                  {viewLogisticsPassOrder.delivery_option === 'deliver' ? '🚚 Direct Factory Delivery Pass' : '🏢 Central Godown Pickup Pass'}
                </h3>
              </div>
            </div>

            {/* Pass Content */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 text-xs space-y-3.5">
              <div className="flex justify-between items-center pb-2.5 border-b border-slate-200">
                <div>
                  <span className="text-slate-400 font-medium">Order Reference ID</span>
                  <div className="font-mono font-bold text-slate-900">#{viewLogisticsPassOrder.id}</div>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 font-medium">Official Dispatch / Gate No</span>
                  <div className="font-mono font-black text-emerald-700 bg-white px-2.5 py-1 rounded-md border border-emerald-200 shadow-sm mt-0.5">
                    {viewLogisticsPassOrder.tracking_number || (viewLogisticsPassOrder.delivery_option === 'deliver' ? 'AWB-PAN-INDIA' : 'GATE-PASS-CLEARED')}
                  </div>
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-medium">Commodity & Quantity</span>
                <div className="font-bold text-slate-900 text-sm">{viewLogisticsPassOrder.product_name} • {Number(viewLogisticsPassOrder.quantity || 1).toLocaleString('en-IN')} {viewLogisticsPassOrder.unit || 'Kg'}</div>
              </div>

              {viewLogisticsPassOrder.delivery_option === 'deliver' ? (
                <div className="space-y-2.5 pt-1">
                  <div>
                    <span className="text-slate-400 font-medium">Scheduled Delivery Date</span>
                    <div className="font-bold text-slate-900">{viewLogisticsPassOrder.delivery_date || 'Scheduled Dispatch'}</div>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Destination Delivery Address</span>
                    <div className="font-bold text-slate-900 break-words bg-white p-2.5 rounded-xl border border-slate-200 mt-0.5">
                      {viewLogisticsPassOrder.delivery_address || 'Destination on file'}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-400 font-medium">Authorized Receiver</span>
                      <div className="font-bold text-slate-900">{viewLogisticsPassOrder.receiver_name || viewLogisticsPassOrder.buyer_name || 'Site In-Charge'}</div>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Contact Phone</span>
                      <div className="font-bold text-slate-900">{viewLogisticsPassOrder.receiver_phone || viewLogisticsPassOrder.buyer_phone || 'On file'}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5 pt-1">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-400 font-medium">Planned Arrival Date</span>
                      <div className="font-bold text-slate-900">{viewLogisticsPassOrder.arrival_date || 'Scheduled Arrival'}</div>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Truck Registration No</span>
                      <div className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 inline-block mt-0.5">{viewLogisticsPassOrder.vehicle_number || 'MH 12 AB 1234'}</div>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Visitor 1 (Primary / Driver)</span>
                    <div className="font-bold text-slate-900">
                      {viewLogisticsPassOrder.p1_name || 'Authorized Driver'} 
                      {viewLogisticsPassOrder.p1_phone ? ` • ${viewLogisticsPassOrder.p1_phone}` : ''}
                      {viewLogisticsPassOrder.p1_aadhar ? ` • Aadhar: •••• ${viewLogisticsPassOrder.p1_aadhar.slice(-4)}` : ''}
                    </div>
                  </div>
                  {viewLogisticsPassOrder.p2_name && (
                    <div>
                      <span className="text-slate-400 font-medium">Visitor 2 (Secondary)</span>
                      <div className="font-bold text-slate-900">
                        {viewLogisticsPassOrder.p2_name}
                        {viewLogisticsPassOrder.p2_phone ? ` • ${viewLogisticsPassOrder.p2_phone}` : ''}
                        {viewLogisticsPassOrder.p2_aadhar ? ` • Aadhar: •••• ${viewLogisticsPassOrder.p2_aadhar.slice(-4)}` : ''}
                      </div>
                    </div>
                  )}
                  <div className="bg-emerald-50 text-emerald-800 p-2.5 rounded-xl border border-emerald-200 text-[11px] font-medium flex items-center gap-2">
                    <span className="text-base">🏨</span>
                    <span><strong>Complimentary Hotel Stay:</strong> Reserved near Central Godown for verified visitors.</span>
                  </div>
                </div>
              )}

              <div className="p-3.5 bg-slate-100 rounded-xl text-[11px] text-slate-700 flex items-start gap-2.5 border border-slate-200">
                <span className="text-base leading-none">🔒</span>
                <div>
                  <span className="font-black text-slate-900">One-Time Mode Lock: </span>
                  <span>
                    The fulfillment mode (<strong>{viewLogisticsPassOrder.delivery_option === 'deliver' ? 'Direct Delivery' : 'Self Godown Pickup'}</strong>) is permanently locked and cannot be changed. 
                    However, you can update your destination address, receiver contacts, vehicle numbers, or visitor IDs using the <strong>Update Details</strong> button below.
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-3 mt-5">
              <button
                onClick={() => {
                  const target = viewLogisticsPassOrder;
                  setViewLogisticsPassOrder(null);
                  setLogisticsModalOrder({ ...target, isMandatory: false, isEdit: true });
                }}
                className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-black rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                title="Update address, phone, arrival date, or driver details"
              >
                <span>✏️</span> Update Details
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span>🖨️</span> Print Pass
              </button>
              <button
                onClick={() => setViewLogisticsPassOrder(null)}
                className="px-6 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-extrabold rounded-xl transition-colors cursor-pointer"
              >
                Close Pass
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Razorpay Checkout Script */}
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <Footer />
    </div>
  );
}

