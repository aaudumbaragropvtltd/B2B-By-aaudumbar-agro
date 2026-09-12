"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LocationCascadeSelector from '@/components/LocationCascadeSelector';

export default function PostPaymentFlow({
  initialPhase = 1,
  product = null,
  quantity = 1000,
  unit = 'Kg',
  pricePerUnit = null,
  subtotal = null,
  gst = null,
  logisticsCost = null,
  total = null,
  initialEmail = '',
  initialDeliveryOption = null,
  initialFormData = null,
  onClose = null,
  paymentData = null,  // { razorpay_payment_id, razorpay_order_id, orderId, advanceAmount }
  orderId = null,
}) {
  const [phase, setPhase] = useState(initialPhase);
  const [deliveryOption, setDeliveryOption] = useState(initialDeliveryOption || null);
  const isOptionLocked = Boolean(initialDeliveryOption);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedTxn, setCopiedTxn] = useState(false);
  
  // Use Razorpay payment ID as transaction reference when available
  const [transactionId] = useState(() => paymentData?.razorpay_payment_id || `TXN-IND-${Math.floor(100000 + Math.random() * 900000)}`);
  
  const productTitle = product?.title || product?.name || 'Bulk Commodity Trade Order';
  const unitPrice = pricePerUnit || product?.base_price_per_unit || 99.91;
  const numQuantity = Number(quantity) || 1000;
  const orderSubtotal = subtotal !== null ? Number(subtotal) : (numQuantity * unitPrice);
  const orderGst = gst !== null ? Number(gst) : (orderSubtotal * 0.05);
  const orderLogistics = logisticsCost !== null ? Number(logisticsCost) : 0;
  const totalAmount = total !== null ? Number(total) : (orderSubtotal + orderGst + orderLogistics);
  const advanceAmount = paymentData?.advanceAmount || totalAmount * 0.1;

  const [formData, setFormData] = useState({
    buyerEmail: initialFormData?.buyerEmail || initialEmail || '',
    
    deliveryDate: initialFormData?.deliveryDate || '',
    deliveryState: initialFormData?.deliveryState || '',
    deliveryCity: initialFormData?.deliveryCity || '',
    deliveryVillage: initialFormData?.deliveryVillage || '',
    deliveryCustomVillage: initialFormData?.deliveryCustomVillage || '',
    deliveryPincode: initialFormData?.deliveryPincode || '',
    deliveryStreet: initialFormData?.deliveryStreet || '',
    deliveryAddress: initialFormData?.deliveryAddress || '',
    receiverName: initialFormData?.receiverName || '',
    receiverPhone: initialFormData?.receiverPhone || '',
    transporterName: initialFormData?.transporterName || '',
    
    arrivalDate: initialFormData?.arrivalDate || '',
    visitorCount: initialFormData?.visitorCount ? String(initialFormData.visitorCount) : '1',
    vehicleNumber: initialFormData?.vehicleNumber || '',
    p1Name: initialFormData?.p1Name || '',
    p1Phone: initialFormData?.p1Phone || '',
    p1Aadhar: initialFormData?.p1Aadhar || '',
    p2Name: initialFormData?.p2Name || '',
    p2Phone: initialFormData?.p2Phone || '',
    p2Aadhar: initialFormData?.p2Aadhar || '',
  });

  useEffect(() => {
    if (initialDeliveryOption) {
      setDeliveryOption(initialDeliveryOption);
    }
  }, [initialDeliveryOption]);

  useEffect(() => {
    if (initialFormData) {
      setFormData((prev) => ({
        ...prev,
        ...initialFormData,
        visitorCount: initialFormData.visitorCount ? String(initialFormData.visitorCount) : prev.visitorCount,
        buyerEmail: initialFormData.buyerEmail || prev.buyerEmail || initialEmail || '',
      }));
    }
  }, [initialFormData, initialEmail]);

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleOptionSelect = (option) => {
    if (isOptionLocked) return; // Mode selection is locked permanently once chosen
    setDeliveryOption(option);
    setErrors({});
  };

  const simulatePayment = () => {
    setPhase(2);
  };

  const validatePhone = (phone) => /^[0-9]{10}$/.test((phone || '').trim());
  const validateAadhar = (aadhar) => /^[0-9]{12}$/.test((aadhar || '').replace(/\s/g, '').trim());
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((email || '').trim());

  const handleCopyTxn = () => {
    navigator.clipboard?.writeText(transactionId);
    setCopiedTxn(true);
    setTimeout(() => setCopiedTxn(false), 2500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.buyerEmail || !validateEmail(formData.buyerEmail)) {
      newErrors.buyerEmail = 'Please provide a valid buyer email address';
    }

    if (!deliveryOption) {
      newErrors.option = 'Please select a delivery option (Delivery or Self Pickup).';
      setErrors(newErrors);
      return;
    }

    if (deliveryOption === 'deliver') {
      if (!formData.deliveryDate) newErrors.deliveryDate = 'Delivery date is required';
      if (!formData.deliveryState || !formData.deliveryCity) {
        newErrors.deliveryAddress = 'Please select your delivery State and City';
      } else if (!formData.deliveryVillage) {
        newErrors.deliveryAddress = 'Please select a Village/Taluka or select Other';
      } else if (formData.deliveryVillage === 'Other' && !formData.deliveryCustomVillage?.trim()) {
        newErrors.deliveryAddress = 'Please enter your custom village name in the box provided';
      } else if (!formData.deliveryAddress?.trim()) {
        newErrors.deliveryAddress = 'Full delivery address is required';
      }
      if (!formData.receiverName?.trim()) newErrors.receiverName = 'Receiver name is required';
      if (!validatePhone(formData.receiverPhone)) newErrors.receiverPhone = 'Valid 10-digit phone number is required';
    } else if (deliveryOption === 'pickup') {
      if (!formData.arrivalDate) newErrors.arrivalDate = 'Planned arrival date is required';
      
      if (!formData.p1Name?.trim()) newErrors.p1Name = 'Visitor 1 Full Name is required';
      if (!validatePhone(formData.p1Phone)) newErrors.p1Phone = 'Valid 10-digit mobile number required';
      if (!validateAadhar(formData.p1Aadhar)) newErrors.p1Aadhar = 'Valid 12-digit Aadhar number required';
      
      if (formData.visitorCount === '2') {
        if (!formData.p2Name?.trim()) newErrors.p2Name = 'Visitor 2 Full Name is required';
        if (!validatePhone(formData.p2Phone)) newErrors.p2Phone = 'Valid 10-digit mobile number required';
        if (!validateAadhar(formData.p2Aadhar)) newErrors.p2Aadhar = 'Valid 12-digit Aadhar number required';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        orderId: orderId || paymentData?.orderId || null,
        deliveryOption,
        transactionId,
        productId: product?.id || 'prod-direct-order',
        productTitle,
        quantity: numQuantity,
        unit,
        pricePerUnit: unitPrice,
        subtotal: orderSubtotal,
        gst: orderGst,
        logisticsCost: orderLogistics,
        totalAmount,
        advanceAmount
      };

      const res = await fetch('/api/logistics/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const resData = await res.json().catch(() => ({}));
      
      if (!res.ok) {
        throw new Error(resData.error || 'Failed to confirm logistics arrangement');
      }
      
      if (typeof window !== 'undefined' && formData.buyerEmail) {
        localStorage.setItem('b2b_buyer_email', formData.buyerEmail);
      }
      setPhase(3);
    } catch (err) {
      console.error('Submission error:', err);
      setErrors((prev) => ({ ...prev, submit: err.message || 'Failed to save logistics details. Please try again.' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 md:p-8 bg-white text-slate-900 rounded-3xl shadow-xl border border-gray-200">
      <AnimatePresence mode="wait">
        
        {/* ========================================================= */}
        {/* PHASE 1: INITIAL ACTION BUTTONS */}
        {/* ========================================================= */}
        {phase === 1 && (
          <motion.div
            key="phase1"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <button className="flex-1 py-4 px-6 rounded-xl bg-gray-100 text-gray-800 font-bold hover:bg-gray-200 transition-colors">
              Request Quotation
            </button>
            <button 
              onClick={simulatePayment}
              className="flex-[1.5] py-4 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold hover:shadow-lg transition-all"
            >
              Buy Now
            </button>
          </motion.div>
        )}

        {/* ========================================================= */}
        {/* PHASE 'success': PAYMENT SUCCESSFUL SCREEN */}
        {/* ========================================================= */}
        {phase === 'success' && (
          <motion.div
            key="phase-success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="text-center space-y-6 py-4"
          >
            {/* Animated Checkmark */}
            <div className="flex justify-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 12 }}
                className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/30"
              >
                <motion.svg
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                  className="w-12 h-12 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <motion.path d="M5 13l4 4L19 7" />
                </motion.svg>
              </motion.div>
            </div>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Payment Successful!</h2>
              <p className="text-sm text-slate-500 mt-1.5 max-w-md mx-auto">
                {paymentData?.paymentMethod === 'google_pay_qr'
                  ? 'Your advance escrow payment has been confirmed via Google Pay / Dynamic UPI QR (0% Fee).'
                  : 'Your 10% advance escrow payment has been securely processed via Razorpay.'}
              </p>
            </motion.div>

            {/* Payment Details Card */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-5 text-left max-w-md mx-auto"
            >
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Product</span>
                  <span className="font-bold text-slate-900 truncate ml-4 text-right max-w-[200px]">{productTitle}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Quantity</span>
                  <span className="font-bold text-slate-900">{numQuantity.toLocaleString('en-IN')} {unit}</span>
                </div>
                <div className="flex justify-between items-center border-t border-emerald-200 pt-3">
                  <span className="text-slate-500">Total Contract Value</span>
                  <span className="font-extrabold text-slate-900">₹{totalAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-emerald-700 font-semibold">Advance Escrow Paid</span>
                  <span className="font-black text-emerald-700">₹{advanceAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Payment Channel</span>
                  <span className="font-bold text-xs px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300">
                    {paymentData?.paymentMethod === 'google_pay_qr' ? '⚡ Google Pay / UPI QR (0% Fee)' : '💳 Razorpay Gateway'}
                  </span>
                </div>
                {paymentData?.razorpay_payment_id && (
                  <div className="flex justify-between items-center border-t border-emerald-200 pt-3">
                    <span className="text-slate-500">Payment Reference</span>
                    <span className="font-mono text-xs font-bold text-slate-700 bg-white px-2 py-1 rounded-lg border border-slate-200">{paymentData.razorpay_payment_id}</span>
                  </div>
                )}
                {(orderId || paymentData?.orderId) && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Order Ref</span>
                    <span className="font-mono text-xs font-bold text-slate-700">#{(orderId || paymentData.orderId).slice(0, 8).toUpperCase()}</span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Escrow Trust Badge */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="flex items-center justify-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 max-w-md mx-auto"
            >
              <span className="text-base">🔒</span>
              <span><strong>Escrow Protected:</strong> Advance held securely until goods are verified at dock.</span>
            </motion.div>

            {/* Email Receipt Confirmation Badge */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.85 }}
              className="flex items-center justify-center gap-2 text-xs text-blue-800 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 max-w-md mx-auto"
            >
              <span className="text-base">✉️</span>
              <span><strong>10% Advance Receipt Sent:</strong> Official booking receipt dispatched to <strong>{initialEmail || 'your email'}</strong>.</span>
            </motion.div>

            {/* Continue Button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
              className="pt-2"
            >
              <button
                onClick={() => setPhase(2)}
                className="w-full max-w-md mx-auto py-4 px-8 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-black hover:to-slate-900 text-white font-extrabold rounded-2xl text-sm shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-3 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>📦 Continue to Pickup / Delivery Options</span>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </motion.div>
          </motion.div>
        )}

        {/* ========================================================= */}
        {/* PHASE 2: POST-PAYMENT / LOGISTICS FORM */}
        {/* ========================================================= */}
        {phase === 2 && (
          <motion.div
            key="phase2"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            {/* Header Success & Order Card */}
            <div className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-2xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-md shadow-emerald-500/20 text-white text-xl">
                    ✓
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900">Order Locked & Escrow Initiated</h2>
                    <p className="text-xs text-emerald-800 font-semibold mt-0.5">10% Advance Protection Lock Confirmed</p>
                  </div>
                </div>

                {/* Transaction ID Badge */}
                <div className="bg-white/80 backdrop-blur-sm border border-emerald-200 px-3.5 py-2 rounded-xl flex items-center gap-2">
                  <div>
                    <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Transaction ID</div>
                    <div className="text-xs font-mono font-extrabold text-slate-900">{transactionId}</div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyTxn}
                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 text-xs transition-colors"
                    title="Copy Transaction ID"
                  >
                    {copiedTxn ? '✅' : '📋'}
                  </button>
                </div>
              </div>

              {/* Order Brief Summary */}
              <div className="mt-4 pt-4 border-t border-emerald-200/60 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 font-medium">Product</span>
                  <div className="font-bold text-slate-900 truncate" title={productTitle}>{productTitle}</div>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Quantity</span>
                  <div className="font-bold text-slate-900">{numQuantity.toLocaleString('en-IN')} {unit}</div>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Total Value</span>
                  <div className="font-extrabold text-slate-900">₹{totalAmount.toLocaleString('en-IN')}</div>
                </div>
                <div>
                  <span className="text-emerald-700 font-medium">Escrow Paid (10%)</span>
                  <div className="font-black text-emerald-700">₹{advanceAmount.toLocaleString('en-IN')}</div>
                </div>
              </div>

              {/* 90% Balance Notice */}
              <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-[11px] text-amber-900 font-medium flex items-center gap-2">
                <span>⚠️</span>
                <span>
                  <strong>Payment Milestone Notice:</strong> The remaining 90% balance (₹{Math.max(0, totalAmount - advanceAmount).toLocaleString('en-IN')}) is payable strictly at the time of loading the goods into the truck at our warehouse/godown.
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Buyer Email Input */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  Buyer Email Address * <span className="text-slate-400 font-normal">(for order receipts & dispatch tracking)</span>
                </label>
                <input 
                  type="email" 
                  name="buyerEmail" 
                  value={formData.buyerEmail} 
                  onChange={handleChange}
                  placeholder="e.g. procurement@company.com" 
                  className={`w-full p-3 rounded-xl bg-white border text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-brand-500 outline-none transition-all ${
                    errors.buyerEmail ? 'border-red-400 focus:ring-red-300' : 'border-slate-300'
                  }`} 
                />
                {errors.buyerEmail && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.buyerEmail}</p>}
              </div>

              {/* Option Selection Cards */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    How would you like to receive your shipment?
                  </h3>
                  {isOptionLocked && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-indigo-100 text-indigo-900 border border-indigo-200 self-start sm:self-auto">
                      🔒 Mode Locked (One-Time Selection)
                    </span>
                  )}
                </div>

                {isOptionLocked ? (
                  <div className="p-3.5 bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 border border-blue-200 rounded-2xl flex items-start gap-3 shadow-xs">
                    <span className="text-xl shrink-0 mt-0.5">🔒</span>
                    <div className="text-xs space-y-1">
                      <div className="font-extrabold text-blue-950 flex flex-wrap items-center gap-2">
                        <span>Fulfillment Mode Locked: {deliveryOption === 'deliver' ? 'Direct Delivery' : 'Self Godown Pickup'}</span>
                        <span className="bg-blue-200 text-blue-900 text-[10px] uppercase font-black px-2 py-0.5 rounded-full">
                          Permanent Choice
                        </span>
                      </div>
                      <p className="text-blue-900/85 leading-relaxed font-medium">
                        Per platform trade security regulations, your logistics mode ({deliveryOption === 'deliver' ? 'Direct Delivery' : 'Self Godown Pickup'}) was chosen once and cannot be changed. 
                        However, you can freely update all specific details ({deliveryOption === 'deliver' ? 'destination address, site contact person, phone number, and delivery date' : 'godown arrival date, vehicle registration number, and visitor/driver ID proofs'}) below anytime.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 border border-amber-200/90 rounded-2xl flex items-start gap-2.5 text-xs text-amber-950">
                    <span className="text-base shrink-0 mt-0.5">⚠️</span>
                    <p className="font-medium text-amber-900 leading-relaxed">
                      <strong className="font-extrabold text-amber-950">One-Time Selection Rule:</strong> Choose between Direct Delivery and Self Godown Pickup carefully. Once confirmed, this fulfillment option is permanent and cannot be changed later.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Option 1: Delivery */}
                  <div 
                    onClick={() => handleOptionSelect('deliver')}
                    className={`p-5 rounded-2xl border-2 transition-all relative ${
                      isOptionLocked && deliveryOption !== 'deliver'
                        ? 'opacity-40 cursor-not-allowed bg-slate-100 border-slate-200 border-dashed select-none'
                        : isOptionLocked && deliveryOption === 'deliver'
                        ? 'border-brand-600 bg-brand-50/60 shadow-md ring-2 ring-brand-500/20 cursor-default'
                        : deliveryOption === 'deliver' 
                        ? 'cursor-pointer border-brand-500 bg-brand-50/50 shadow-md ring-2 ring-brand-500/20' 
                        : 'cursor-pointer border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🚚</span>
                        <div className="font-extrabold text-slate-900 text-base">Direct Delivery</div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {isOptionLocked && deliveryOption === 'deliver' && (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-brand-100 text-brand-900 rounded-md border border-brand-200">
                            🔒 Confirmed Mode
                          </span>
                        )}
                        {isOptionLocked && deliveryOption !== 'deliver' && (
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-slate-200 text-slate-500 rounded-md">
                            🚫 Cannot Switch
                          </span>
                        )}
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${deliveryOption === 'deliver' ? 'border-brand-600 bg-brand-600' : 'border-slate-300'}`}>
                          {deliveryOption === 'deliver' && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600">Goods dispatched directly to your destination warehouse/factory via verified logistics.</p>
                    <div className="mt-2.5 text-[11px] font-semibold text-amber-900 bg-amber-50/90 border border-amber-200/80 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5">
                      <span>🚛</span>
                      <span><strong>Freight Notice:</strong> Truck charges are applicable depending on goods weight &amp; destination distance.</span>
                    </div>
                  </div>

                  {/* Option 2: Self Pickup */}
                  <div 
                    onClick={() => handleOptionSelect('pickup')}
                    className={`p-5 rounded-2xl border-2 transition-all relative ${
                      isOptionLocked && deliveryOption !== 'pickup'
                        ? 'opacity-40 cursor-not-allowed bg-slate-100 border-slate-200 border-dashed select-none'
                        : isOptionLocked && deliveryOption === 'pickup'
                        ? 'border-brand-600 bg-brand-50/60 shadow-md ring-2 ring-brand-500/20 cursor-default'
                        : deliveryOption === 'pickup' 
                        ? 'cursor-pointer border-brand-500 bg-brand-50/50 shadow-md ring-2 ring-brand-500/20' 
                        : 'cursor-pointer border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🏢</span>
                        <div className="font-extrabold text-slate-900 text-base">Self Godown Pickup</div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {isOptionLocked && deliveryOption === 'pickup' && (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-brand-100 text-brand-900 rounded-md border border-brand-200">
                            🔒 Confirmed Mode
                          </span>
                        )}
                        {isOptionLocked && deliveryOption !== 'pickup' && (
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-slate-200 text-slate-500 rounded-md">
                            🚫 Cannot Switch
                          </span>
                        )}
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${deliveryOption === 'pickup' ? 'border-brand-600 bg-brand-600' : 'border-slate-300'}`}>
                          {deliveryOption === 'pickup' && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600">You or your truck driver will visit our central godown. Hotel stay provided for visitors.</p>
                    <div className="mt-2.5 text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5">
                      <span>🏢</span>
                      <span><strong>Self Arranged:</strong> Buyer arranges own vehicle (zero platform truck freight charged).</span>
                    </div>
                  </div>
                </div>
                {errors.option && <p className="text-red-500 text-xs font-bold mt-1">{errors.option}</p>}
              </div>

              {/* Dynamic Form: Deliver */}
              <AnimatePresence mode="wait">
                {deliveryOption === 'deliver' && (
                  <motion.div
                    key="form-deliver"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 bg-slate-50/80 p-5 rounded-2xl border border-slate-200"
                  >
                    <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-200 pb-2">
                      <span>📍</span> Delivery Logistics Details
                    </h4>

                    {/* Weight-based Truck Charges Notice */}
                    <div className="p-3.5 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border border-amber-200 rounded-xl text-xs text-amber-950 flex items-start gap-3 shadow-xs">
                      <span className="text-xl flex-shrink-0 mt-0.5">🚛</span>
                      <div className="space-y-1">
                        <div className="font-extrabold text-amber-950 flex flex-wrap items-center gap-2">
                          <span>Truck &amp; Freight Charges Applicable</span>
                          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-black">
                            Weight Dependent
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-900/90 leading-relaxed font-medium">
                          Please note: Dedicated truck and freight hauling charges are applicable depending on the total goods weight, volume, and destination distance. Freight is calculated according to shipment weight and billed at the time of loading/dispatch or upon delivery.
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">Requested Delivery Date *</label>
                      <input 
                        type="date" 
                        name="deliveryDate" 
                        value={formData.deliveryDate} 
                        onChange={handleChange} 
                        className="w-full sm:w-1/2 p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-brand-500 outline-none text-sm font-bold" 
                      />
                      {errors.deliveryDate && <p className="text-red-500 text-xs font-semibold mt-1">{errors.deliveryDate}</p>}
                    </div>

                    {/* Cascading State -> City -> Village Selector */}
                    <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
                      <div className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                        <span>🗺️</span> Destination Territory &amp; Jurisdiction
                      </div>
                      
                      <LocationCascadeSelector
                        state={formData.deliveryState}
                        city={formData.deliveryCity}
                        village={formData.deliveryVillage}
                        customVillage={formData.deliveryCustomVillage}
                        pincode={formData.deliveryPincode}
                        showPincode={true}
                        showFullAddressPreview={true}
                        onLocationChange={(loc) => {
                          const street = formData.deliveryStreet || '';
                          const fullAddr = [street, loc.formattedAddress].filter(Boolean).join(', ');
                          setFormData(prev => ({
                            ...prev,
                            deliveryState: loc.state,
                            deliveryCity: loc.city,
                            deliveryVillage: loc.village,
                            deliveryCustomVillage: loc.customVillage,
                            deliveryPincode: loc.pincode,
                            deliveryAddress: fullAddr,
                          }));
                          if (errors.deliveryAddress) setErrors(prev => ({ ...prev, deliveryAddress: null }));
                        }}
                      />

                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">
                          Building / Plot / Factory Street Address *
                        </label>
                        <input
                          type="text"
                          name="deliveryStreet"
                          value={formData.deliveryStreet}
                          onChange={(e) => {
                            const streetVal = e.target.value;
                            const villagePart = formData.deliveryCustomVillage || formData.deliveryVillage;
                            const territory = [villagePart, formData.deliveryCity, formData.deliveryState, formData.deliveryPincode].filter(Boolean).join(', ');
                            const fullAddr = [streetVal, territory].filter(Boolean).join(', ');
                            setFormData(prev => ({ ...prev, deliveryStreet: streetVal, deliveryAddress: fullAddr }));
                            if (errors.deliveryAddress) setErrors(prev => ({ ...prev, deliveryAddress: null }));
                          }}
                          placeholder="Plot No. / Survey No., Industrial Zone, Landmark..."
                          className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 font-semibold focus:ring-2 focus:ring-brand-500 outline-none text-sm"
                        />
                      </div>
                    </div>
                    {errors.deliveryAddress && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.deliveryAddress}</p>}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">Receiver / Site In-Charge Name *</label>
                        <input 
                          type="text" 
                          name="receiverName" 
                          value={formData.receiverName} 
                          onChange={handleChange} 
                          className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 font-semibold focus:ring-2 focus:ring-brand-500 outline-none text-sm" 
                          placeholder="e.g. Ramesh Kumar" 
                        />
                        {errors.receiverName && <p className="text-red-500 text-xs font-semibold mt-1">{errors.receiverName}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">Receiver Contact Number *</label>
                        <input 
                          type="tel" 
                          name="receiverPhone" 
                          value={formData.receiverPhone} 
                          onChange={handleChange} 
                          className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 font-mono font-semibold focus:ring-2 focus:ring-brand-500 outline-none text-sm" 
                          placeholder="10-digit mobile number" 
                          maxLength="10" 
                        />
                        {errors.receiverPhone && <p className="text-red-500 text-xs font-semibold mt-1">{errors.receiverPhone}</p>}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Dynamic Form: Pickup */}
                {deliveryOption === 'pickup' && (
                  <motion.div
                    key="form-pickup"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 bg-slate-50/80 p-5 rounded-2xl border border-slate-200"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                          <span>🏢</span> Central Godown Pickup & Visitor Verification
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">Government ID verification is required for gate pass generation.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-slate-800">Visitor Count:</label>
                        <select 
                          name="visitorCount" 
                          value={formData.visitorCount} 
                          onChange={handleChange} 
                          className="p-2 border border-slate-300 rounded-xl text-xs font-bold bg-white text-slate-900 focus:ring-2 focus:ring-brand-500 outline-none"
                        >
                          <option value="1" className="text-slate-900">1 Person</option>
                          <option value="2" className="text-slate-900">2 Persons</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">Planned Arrival Date at Godown *</label>
                        <input 
                          type="date" 
                          name="arrivalDate" 
                          value={formData.arrivalDate} 
                          onChange={handleChange} 
                          className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-brand-500 outline-none text-sm font-bold" 
                        />
                        {errors.arrivalDate && <p className="text-red-500 text-xs font-semibold mt-1">{errors.arrivalDate}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">Vehicle / Truck Registration No.</label>
                        <input 
                          type="text" 
                          name="vehicleNumber" 
                          value={formData.vehicleNumber} 
                          onChange={handleChange} 
                          placeholder="e.g. MH 12 AB 1234 / DL 01 A 9999"
                          className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500 outline-none text-sm font-mono font-bold uppercase" 
                        />
                      </div>
                    </div>

                    {/* Person 1 */}
                    <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
                      <div className="text-xs font-extrabold text-brand-700 uppercase tracking-wider">Visitor 1 (Primary / Driver) *</div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-800 mb-1">Full Name</label>
                          <input 
                            type="text" 
                            name="p1Name" 
                            value={formData.p1Name} 
                            onChange={handleChange} 
                            placeholder="Full Legal Name" 
                            className="w-full p-2.5 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 font-bold focus:ring-2 focus:ring-brand-500 outline-none" 
                          />
                          {errors.p1Name && <p className="text-red-500 text-[10px] font-semibold mt-1">{errors.p1Name}</p>}
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-800 mb-1">10-Digit Mobile</label>
                          <input 
                            type="tel" 
                            name="p1Phone" 
                            value={formData.p1Phone} 
                            onChange={handleChange} 
                            placeholder="98XXXXXXXX" 
                            maxLength="10" 
                            className="w-full p-2.5 text-xs font-mono rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 font-bold focus:ring-2 focus:ring-brand-500 outline-none" 
                          />
                          {errors.p1Phone && <p className="text-red-500 text-[10px] font-semibold mt-1">{errors.p1Phone}</p>}
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-800 mb-1">12-Digit Aadhar Card</label>
                          <input 
                            type="text" 
                            name="p1Aadhar" 
                            value={formData.p1Aadhar} 
                            onChange={handleChange} 
                            placeholder="XXXX XXXX XXXX" 
                            maxLength="12" 
                            className="w-full p-2.5 text-xs font-mono rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 font-bold focus:ring-2 focus:ring-brand-500 outline-none" 
                          />
                          {errors.p1Aadhar && <p className="text-red-500 text-[10px] font-semibold mt-1">{errors.p1Aadhar}</p>}
                        </div>
                      </div>
                    </div>

                    {/* Person 2 */}
                    {formData.visitorCount === '2' && (
                      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
                        <div className="text-xs font-extrabold text-brand-700 uppercase tracking-wider">Visitor 2 (Secondary / Manager) *</div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-800 mb-1">Full Name</label>
                            <input 
                              type="text" 
                              name="p2Name" 
                              value={formData.p2Name} 
                              onChange={handleChange} 
                              placeholder="Full Legal Name" 
                              className="w-full p-2.5 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 font-bold focus:ring-2 focus:ring-brand-500 outline-none" 
                            />
                            {errors.p2Name && <p className="text-red-500 text-[10px] font-semibold mt-1">{errors.p2Name}</p>}
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-800 mb-1">10-Digit Mobile</label>
                            <input 
                              type="tel" 
                              name="p2Phone" 
                              value={formData.p2Phone} 
                              onChange={handleChange} 
                              placeholder="98XXXXXXXX" 
                              maxLength="10" 
                              className="w-full p-2.5 text-xs font-mono rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 font-bold focus:ring-2 focus:ring-brand-500 outline-none" 
                            />
                            {errors.p2Phone && <p className="text-red-500 text-[10px] font-semibold mt-1">{errors.p2Phone}</p>}
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-800 mb-1">12-Digit Aadhar Card</label>
                            <input 
                              type="text" 
                              name="p2Aadhar" 
                              value={formData.p2Aadhar} 
                              onChange={handleChange} 
                              placeholder="XXXX XXXX XXXX" 
                              maxLength="12" 
                              className="w-full p-2.5 text-xs font-mono rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 font-bold focus:ring-2 focus:ring-brand-500 outline-none" 
                            />
                            {errors.p2Aadhar && <p className="text-red-500 text-[10px] font-semibold mt-1">{errors.p2Aadhar}</p>}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="p-3.5 bg-blue-50 border border-blue-200 text-blue-950 text-xs font-bold rounded-xl flex items-center gap-2.5 shadow-sm">
                      <span className="text-base">🏨</span>
                      <span>Complimentary hotel stay near central godown arranged for verified buyer visitors.</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit Button */}
              <div className="border-t border-slate-200 pt-6 flex flex-col items-center">
                <div className="flex flex-col-reverse sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
                  {onClose && (
                    <button
                      type="button"
                      onClick={onClose}
                      className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-all cursor-pointer border border-slate-200"
                    >
                      Cancel &amp; Close
                    </button>
                  )}
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-slate-900 text-white font-extrabold text-sm hover:bg-black hover:shadow-xl transition-all disabled:opacity-70 flex justify-center items-center gap-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {isOptionLocked ? 'Saving Updated Logistics Details...' : 'Confirming Order & Logistics...'}
                      </>
                    ) : (
                      isOptionLocked ? 'Save & Update Logistics Details' : 'Confirm Order & Save Logistics'
                    )}
                  </button>
                </div>
                {deliveryOption === 'deliver' && (
                  <p className="text-[11px] text-amber-800 font-medium text-center mt-2.5 flex items-center justify-center gap-1.5">
                    <span>🚛</span>
                    <span>* Truck charges are applicable depending on total goods weight &amp; destination distance.</span>
                  </p>
                )}
                {errors.submit && (
                  <p className="text-red-500 text-xs font-bold mt-3 text-center">{errors.submit}</p>
                )}
              </div>
            </form>
          </motion.div>
        )}

        {/* ========================================================= */}
        {/* PHASE 3: COMPLETED STATE */}
        {/* ========================================================= */}
        {phase === 3 && (
          <motion.div
            key="phase3"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-8 flex flex-col items-center text-center space-y-5"
          >
            <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center text-emerald-600 text-3xl shadow-lg shadow-emerald-500/10">
              ✓
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900">
                {isOptionLocked ? 'Logistics Details Updated!' : 'Order & Logistics Confirmed!'}
              </h2>
              <p className="text-slate-500 text-sm mt-1 max-w-md">
                {isOptionLocked
                  ? 'Your updated address and dispatch clearance details have been recorded and synced with warehouse ops.'
                  : 'Your order has been recorded with transaction reference and transmitted to the operations desk and admin console.'}
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-left space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Transaction ID</span>
                  <div className="font-mono text-sm font-black text-slate-900">{transactionId}</div>
                </div>
                <button
                  type="button"
                  onClick={handleCopyTxn}
                  className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  {copiedTxn ? 'Copied ✅' : 'Copy ID'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 font-medium">Buyer Email:</span>
                  <div className="font-bold text-slate-900 truncate">{formData.buyerEmail}</div>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Mode:</span>
                  <div className="font-bold text-slate-900 capitalize">
                    {deliveryOption === 'deliver' ? '🚚 Direct Delivery' : '🏢 Self Pickup'}
                  </div>
                  {deliveryOption === 'deliver' && (
                    <div className="text-[10px] text-amber-800 font-medium mt-0.5">
                      (Truck charges applicable depending on goods weight)
                    </div>
                  )}
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Date:</span>
                  <div className="font-bold text-slate-900">
                    {formData.deliveryDate || formData.arrivalDate || 'Pending Schedule'}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Escrow Advance:</span>
                  <div className="font-bold text-emerald-700">₹{advanceAmount.toLocaleString('en-IN')} (10% Paid)</div>
                </div>
                <div className="col-span-2 pt-2 border-t border-slate-200">
                  <span className="text-amber-800 font-bold">Remaining 90% Balance:</span>
                  <div className="font-extrabold text-slate-900 mt-0.5">
                    ₹{Math.max(0, totalAmount - advanceAmount).toLocaleString('en-IN')} <span className="text-[11px] font-normal text-slate-500">(Payable at truck loading at warehouse/godown)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-3">
              <button 
                onClick={() => {
                  if (onClose) onClose();
                  else window.location.href = '/orders';
                }}
                className="w-full px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-sm shadow-md shadow-emerald-600/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>📦 Go to Confirmed 10% Advance Orders</span>
                <span>→</span>
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}

