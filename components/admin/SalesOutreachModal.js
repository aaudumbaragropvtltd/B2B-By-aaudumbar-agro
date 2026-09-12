"use client";

import React, { useState, useEffect } from 'react';

export default function SalesOutreachModal({ isOpen, onClose, user, product, searchQuery }) {
  if (!isOpen || !user) return null;

  const basePrice = product?.base_price_per_unit || 0;
  const [offerPrice, setOfferPrice] = useState(basePrice ? Math.round(basePrice * 0.95) : 0);
  const [moq, setMoq] = useState(product?.bulk_minimum_order || '10');
  const [unit, setUnit] = useState(product?.unit_label || 'kg');
  const [language, setLanguage] = useState('hinglish'); // 'hinglish', 'english', 'hindi'
  const [paymentTerms, setPaymentTerms] = useState('10% Escrow Advance + 90% at Dock');
  const [deliveryTimeline, setDeliveryTimeline] = useState('Ready for dispatch within 24-48 hours');
  const [customNote, setCustomNote] = useState('');
  const [copied, setCopied] = useState(false);

  // Normalize phone number for WhatsApp
  const rawPhone = user.whatsapp_number || user.corporate_phone || '';
  const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
  const internationalPhone = cleanPhone.startsWith('91') && cleanPhone.length > 10 ? cleanPhone : `91${cleanPhone.slice(-10)}`;

  useEffect(() => {
    if (basePrice) {
      setOfferPrice(Math.round(basePrice * 0.95)); // default 5% discount
      setUnit(product?.unit_label || 'units');
      setMoq(product?.bulk_minimum_order || '10');
    } else if (searchQuery) {
      setOfferPrice(0);
      setUnit('kg');
      setMoq('100');
    }
  }, [product, searchQuery]);

  const applyDiscount = (percent) => {
    if (!basePrice) return;
    const discounted = Math.round(basePrice * (1 - percent / 100));
    setOfferPrice(discounted);
  };

  const generatePitchText = () => {
    const company = user.company_name || 'Sir/Madam';
    const prodTitle = product?.title || (searchQuery ? `Wholesale ${searchQuery}` : 'Industrial Products');
    const priceText = offerPrice > 0 ? `*₹${Number(offerPrice).toLocaleString('en-IN')}/${unit}*` : '*Best Mandi wholesale rate*';
    const standardPriceText = basePrice ? `_(Standard Listed: ₹${Number(basePrice).toLocaleString('en-IN')})_` : '';

    if (language === 'english') {
      return `*Special B2B Offer from B2B India* 🇮🇳\n\n` +
        `Dear *${company}*,\n\n` +
        (searchQuery ? `We noticed your search for *"${searchQuery}"* on B2B India.\n\n` : `We noticed your interest in *${prodTitle}* on our B2B trade marketplace.\n\n`) +
        `🔥 *Exclusive Verified Supply Deal:*\n` +
        `• *Offer Rate:* ${priceText} ${standardPriceText}\n` +
        `• *Minimum Order:* ${moq} ${unit}\n` +
        `• *Payment Terms:* ${paymentTerms}\n` +
        `• *Dispatch:* ${deliveryTimeline}\n` +
        (customNote ? `• *Note:* ${customNote}\n` : '') +
        `\n✅ 100% Verified Manufacturers & Safe Escrow Protection.\n` +
        `Would you like us to block this stock & prepare your proforma invoice?\n\n` +
        `*B2B India Trade Desk*\n` +
        `📞 Call: +91 8408841998 | Web: https://b2bindia.site`;
    }

    if (language === 'hindi') {
      return `*B2B India की तरफ से विशेष बिज़नेस ऑफर* 🇮🇳\n\n` +
        `नमस्ते *${company}* जी,\n\n` +
        (searchQuery ? `हमने देखा कि आप B2B India पर *"${searchQuery}"* खोज रहे थे।\n\n` : `हमने देखा कि आप B2B India पर *${prodTitle}* देख रहे थे।\n\n`) +
        `🔥 *आज का एक्सक्लूसिव ऑफर:*\n` +
        `• *ऑफर रेट:* ${priceText} ${standardPriceText}\n` +
        `• *न्यूनतम आर्डर (MOQ):* ${moq} ${unit}\n` +
        `• *भुगतान शर्तें:* ${paymentTerms}\n` +
        `• *डिलीवरी:* ${deliveryTimeline}\n` +
        (customNote ? `• *अतिरिक्त जानकारी:* ${customNote}\n` : '') +
        `\n✅ 100% वेरिफाइड क्वालिटी और सुरक्षित एस्क्रो पेमेंट सुरक्षा।\n` +
        `क्या हम आपके लिए यह स्टॉक बुक करें?\n\n` +
        `*B2B India ट्रेड डेस्क*\n` +
        `📞 संपर्क: +91 8408841998`;
    }

    // Default: Hinglish
    return `*Special B2B Direct Offer from B2B India* 🇮🇳\n\n` +
      `Namaste *${company}* team,\n\n` +
      (searchQuery ? `Aapne recently B2B India par *"${searchQuery}"* search kiya tha. Hamne aapke liye direct verified suppliers se best bulk trade price arrange kiya hai:\n\n` : `Aapne recently B2B India par *${prodTitle}* check kiya tha. Hamne aapke liye best bulk trade price arrange kiya hai:\n\n`) +
      `🔥 *Exclusive Offer Details:*\n` +
      `• *Offer Rate:* ${priceText} ${standardPriceText}\n` +
      `• *MOQ:* ${moq} ${unit}\n` +
      `• *Payment Protection:* ${paymentTerms}\n` +
      `• *Dispatch Timeline:* ${deliveryTimeline}\n` +
      (customNote ? `• *Special Notes:* ${customNote}\n` : '') +
      `\n✅ 100% Quality Inspected & Safe Escrow payment security.\n` +
      `Kya hum aapke liye quote confirm karein ya sample dispatch schedule karein?\n\n` +
      `*B2B India Trade Desk*\n` +
      `📞 Direct Call: +91 8408841998`;
  };

  const pitchMessage = generatePitchText();

  const handleSendWhatsApp = () => {
    if (!cleanPhone) {
      alert('This user does not have a phone or WhatsApp number listed.');
      return;
    }
    const url = `https://wa.me/${internationalPhone}?text=${encodeURIComponent(pitchMessage)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(pitchMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCall = () => {
    if (!rawPhone) {
      alert('No phone number available.');
      return;
    }
    window.location.href = `tel:${rawPhone}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md">
      <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Sales Outreach Engine
                </span>
                <span className="text-xs text-slate-500">1-Click WhatsApp & Call</span>
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 mt-2">
                Pitch Offer to <span className="text-brand-600">{user.company_name}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Target User: {user.registered_email} · Phone: {rawPhone || 'N/A'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Product or Search Banner */}
          {product ? (
            <div className="mt-5 p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center gap-4 shadow-sm">
              {product.hero_image_url ? (
                <img
                  src={product.hero_image_url}
                  alt={product.title}
                  className="w-16 h-16 object-cover rounded-xl border border-white/20 flex-shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-white/10 flex items-center justify-center text-2xl flex-shrink-0">
                  📦
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-xs text-slate-300 uppercase tracking-wider font-semibold">User Recently Viewed Product</div>
                <div className="font-bold text-white text-base truncate">{product.title}</div>
                <div className="text-xs text-emerald-400 font-medium mt-0.5">
                  Standard Listed: ₹{Number(basePrice).toLocaleString('en-IN')} / {unit}
                </div>
              </div>
            </div>
          ) : searchQuery ? (
            <div className="mt-5 p-4 rounded-2xl bg-gradient-to-r from-emerald-950 to-slate-900 text-white flex items-center gap-4 shadow-sm border border-emerald-800/40">
              <div className="w-14 h-14 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-2xl flex-shrink-0 border border-emerald-500/30">
                🔍
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-emerald-400 uppercase tracking-wider font-semibold">User Searched on Website</div>
                <div className="font-extrabold text-white text-lg truncate">"{searchQuery}"</div>
                <div className="text-xs text-slate-300 font-medium mt-0.5">
                  Pitch direct supplier quotation & wholesale mandi rates for this requirement
                </div>
              </div>
            </div>
          ) : null}

          {/* Offer Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            {/* Price & Discounts */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Special Offer Price (₹ / {unit})
              </label>
              <input
                type="number"
                value={offerPrice}
                onChange={(e) => setOfferPrice(e.target.value)}
                className="w-full text-xl font-extrabold text-slate-900 px-4 py-2 bg-white border border-slate-300 rounded-xl shadow-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
              
              <div className="flex items-center gap-1.5 mt-3">
                <span className="text-[11px] font-semibold text-slate-500 mr-1">Quick Discount:</span>
                <button
                  type="button"
                  onClick={() => applyDiscount(5)}
                  className="px-2.5 py-1 text-xs font-bold bg-white hover:bg-emerald-50 text-emerald-700 border border-slate-200 rounded-lg transition-all"
                >
                  -5%
                </button>
                <button
                  type="button"
                  onClick={() => applyDiscount(10)}
                  className="px-2.5 py-1 text-xs font-bold bg-white hover:bg-emerald-50 text-emerald-700 border border-slate-200 rounded-lg transition-all"
                >
                  -10%
                </button>
                <button
                  type="button"
                  onClick={() => applyDiscount(15)}
                  className="px-2.5 py-1 text-xs font-bold bg-white hover:bg-emerald-50 text-emerald-700 border border-slate-200 rounded-lg transition-all"
                >
                  -15%
                </button>
                <button
                  type="button"
                  onClick={() => setOfferPrice(basePrice)}
                  className="px-2.5 py-1 text-xs font-semibold bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg transition-all"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* MOQ & Unit */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Minimum Order Quantity (MOQ)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={moq}
                  onChange={(e) => setMoq(e.target.value)}
                  placeholder="e.g. 50"
                  className="w-full font-bold text-slate-900 px-3 py-2 bg-white border border-slate-300 rounded-xl shadow-sm focus:ring-2 focus:ring-brand-500"
                />
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="Unit (kg, ton, kit)"
                  className="w-full font-bold text-slate-900 px-3 py-2 bg-white border border-slate-300 rounded-xl shadow-sm focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div className="mt-3 text-[11px] text-slate-500">
                Total Deal Volume: <span className="font-bold text-slate-900">₹{(Number(offerPrice || 0) * Number(moq || 0)).toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Payment Terms */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Payment & Escrow Terms
              </label>
              <select
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="w-full text-sm font-semibold text-slate-900 px-3 py-2 bg-white border border-slate-300 rounded-xl shadow-sm focus:ring-2 focus:ring-brand-500"
              >
                <option value="10% Escrow Advance + 90% at Dock">10% Advance + 90% at Dock (Escrow Safe)</option>
                <option value="100% Escrow Protected (Funds held until delivery)">100% Escrow Protected</option>
                <option value="Letter of Credit (LC) / Bank Guarantee">Letter of Credit (LC) / Bank Guarantee</option>
                <option value="Net 15 Days Credit for Verified Buyers">Net 15 Days Credit (Verified)</option>
                <option value="Immediate 100% Advance with 2% Extra Cash Discount">100% Advance (2% Extra Cash Discount)</option>
              </select>
            </div>

            {/* Dispatch Timeline & Language */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Pitch Language & Dispatch
              </label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full text-xs font-bold text-slate-900 px-3 py-2 bg-white border border-slate-300 rounded-xl shadow-sm focus:ring-2 focus:ring-brand-500"
                >
                  <option value="hinglish">Hinglish (Best Response)</option>
                  <option value="english">Professional English</option>
                  <option value="hindi">Pure Hindi (शुद्ध हिंदी)</option>
                </select>
                <input
                  type="text"
                  value={deliveryTimeline}
                  onChange={(e) => setDeliveryTimeline(e.target.value)}
                  placeholder="Dispatch time"
                  className="w-full text-xs font-medium text-slate-900 px-3 py-2 bg-white border border-slate-300 rounded-xl shadow-sm focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
          </div>

          {/* Optional Custom Note */}
          <div className="mt-4">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Custom Pitch Note (Optional)
            </label>
            <input
              type="text"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="e.g. Free sample kit included / Freight discount applicable this week"
              className="w-full text-sm px-4 py-2 border border-slate-300 rounded-xl shadow-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>

          {/* Live Message Preview */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                Generated WhatsApp Pitch Preview
              </label>
              <button
                type="button"
                onClick={handleCopy}
                className="text-xs font-bold text-brand-600 hover:text-brand-800 flex items-center gap-1 bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-100"
              >
                {copied ? '✅ Copied!' : '📋 Copy Text'}
              </button>
            </div>
            <pre className="p-4 bg-slate-900 text-emerald-400 rounded-2xl text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-44 overflow-y-auto border border-slate-800 shadow-inner">
              {pitchMessage}
            </pre>
          </div>

          {/* Action Footer */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleCall}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all flex items-center justify-center gap-2 border border-slate-200"
            >
              📞 Call Directly ({rawPhone || 'No Phone'})
            </button>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all transform active:scale-95"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                </svg>
                Open WhatsApp Pitch
              </button>
            </div>
          </div>
        </div>
      </div>
  );
}
