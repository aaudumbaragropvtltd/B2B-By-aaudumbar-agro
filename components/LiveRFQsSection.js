// ============================================================================
// LIVE RFQS / BUY LEADS SECTION (Homepage Showcase)
// ============================================================================
// Displays live broadcasted procurement requirements directly on the home page.
// Allows suppliers to quote instantly and buyers to broadcast new RFQs with 1 click.
// ============================================================================

"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import SmartRFQForm from './SmartRFQForm';
import SupplierQuoteForm from './SupplierQuoteForm';
import { STATIC_SECTORS } from '@/constants/sectors';

const FALLBACK_RFQS = [
  {
    id: 'ab546f64-078e-4e36-833b-107546a13d98',
    product_name: 'Basmati Rice 1121 Steam (Export Quality)',
    quantity: 500,
    unit: 'Tons',
    target_price: 82000,
    destination: 'Mundra Port, Gujarat',
    deadline: '2026-09-15',
    status: 'open',
    created_at: new Date().toISOString(),
    notes: 'Packaging in 50kg PP bags with custom export stenciling. Quality inspection required.',
    users: { company_name: 'Shree Krishna Agro Exports', city: 'Karnal', state: 'Haryana', verification_level: 'Diamond' }
  },
  {
    id: '09ee35ac-0aeb-4e62-ad46-2e16415da572',
    product_name: 'High-Tensile Hex Head Bolts & Fasteners (M12-M24)',
    quantity: 25000,
    unit: 'Pieces',
    target_price: 45,
    destination: 'Chakan Industrial Area, Pune',
    deadline: '2026-09-10',
    status: 'open',
    created_at: new Date().toISOString(),
    notes: 'Grade 8.8 and 10.9 with zinc phosphating. ISO/TS certification certificate mandatory.',
    users: { company_name: 'Bharat Dynamics Auto Components', city: 'Pune', state: 'Maharashtra', verification_level: 'Platinum' }
  },
  {
    id: '50b4c0e6-47a4-4105-a37c-7dc6cc0ad690',
    product_name: 'HDPE Granules / Polyethylene Raw Material',
    quantity: 50,
    unit: 'Tons',
    target_price: 94000,
    destination: 'Bhiwandi Logistics Park, Mumbai',
    deadline: '2026-09-05',
    status: 'open',
    created_at: new Date().toISOString(),
    notes: 'Blow moulding grade for industrial containers. Virgin prime polymer only.',
    users: { company_name: 'Apex Polymer Packaging Solutions', city: 'Thane', state: 'Maharashtra', verification_level: 'Gold' }
  },
  {
    id: 'd93685c6-0e7c-4ee1-bfa3-65a5b70fec04',
    product_name: 'Solar Grid-Tie Inverters (50kW Three Phase)',
    quantity: 120,
    unit: 'Units',
    target_price: 185000,
    destination: 'Jaipur Solar Park Site',
    deadline: '2026-09-20',
    status: 'open',
    created_at: new Date().toISOString(),
    notes: 'BIS approved with minimum 5-year on-site manufacturer replacement warranty.',
    users: { company_name: 'Surya Shakti Renewable Infra', city: 'Jaipur', state: 'Rajasthan', verification_level: 'Diamond' }
  },
  {
    id: '138a7069-92c7-478c-a062-b943a2600ed5',
    product_name: 'Active Pharmaceutical Intermediate (Paracetamol IP/BP)',
    quantity: 10,
    unit: 'Tons',
    target_price: 480000,
    destination: 'Baddi Industrial Zone, HP',
    deadline: '2026-09-08',
    status: 'open',
    notes: 'GMP certified batches with complete Certificate of Analysis (COA).',
    users: { company_name: 'Zenith BioPharma Labs', city: 'Chandigarh', state: 'Punjab', verification_level: 'Platinum' }
  },
  {
    id: 'b261904f-12df-4e1c-9b13-3b642893db7b',
    product_name: 'Combed Cotton Yarn (Count 30s & 40s)',
    quantity: 40000,
    unit: 'Kg',
    target_price: 285,
    destination: 'Tirupur Textile Hub',
    deadline: '2026-09-12',
    status: 'open',
    notes: 'Evenness testing reports required. Bulk immediate delivery preferred.',
    users: { company_name: 'Kaveri Spinning & Weaving Mills', city: 'Coimbatore', state: 'Tamil Nadu', verification_level: 'Gold' }
  }
];

export default function LiveRFQsSection({ initialRfqs = [] }) {
  const [rfqs, setRfqs] = useState(initialRfqs.length > 0 ? initialRfqs : FALLBACK_RFQS);
  const [showSmartRFQModal, setShowSmartRFQModal] = useState(false);
  const [selectedRfqForQuote, setSelectedRfqForQuote] = useState(null);
  const [currentUserProfile, setCurrentUserProfile] = useState(null);

  // Sync latest live marketplace RFQs and user profile
  React.useEffect(() => {
    fetch('/api/rfq?view=marketplace')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setRfqs(data);
        }
      })
      .catch(() => {});

    fetch('/api/dashboard/profile')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.profile) {
          setCurrentUserProfile(data.profile);
        }
      })
      .catch(() => {});
  }, []);

  const displayRfqs = rfqs.length > 0 ? rfqs : FALLBACK_RFQS;

  return (
    <section className="py-16 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 text-white relative overflow-hidden">
      {/* Background Glows & Matrix Grid */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
        backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px)`,
        backgroundSize: '24px 24px'
      }} />
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-brand-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Buy Leads & Broadcasts
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Active Procurement Requirements
            </h2>
            <p className="text-slate-400 mt-2 text-sm sm:text-base max-w-2xl">
              Verified buyers broadcast live demands across 38 industries daily. Submit competitive quotations or broadcast your own bulk inquiry in 60 seconds.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowSmartRFQModal(true)}
              suppressHydrationWarning
              className="px-6 py-3.5 bg-gradient-to-r from-accent-500 to-amber-500 hover:from-accent-600 hover:to-amber-600 text-slate-950 font-extrabold rounded-2xl shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-2 cursor-pointer text-sm"
            >
              <span>⚡ Broadcast Your RFQ</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
            <Link
              href="/dashboard/rfqs"
              className="px-5 py-3.5 bg-white/10 hover:bg-white/15 border border-white/15 text-white font-semibold rounded-2xl transition-all text-sm flex items-center gap-1.5"
            >
              <span>Explore Marketplace</span>
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Live RFQ Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayRfqs.map((rfq, idx) => (
            <motion.div
              key={rfq.id || idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.08 }}
              className="bg-slate-800/80 backdrop-blur-md rounded-3xl border border-slate-700/60 p-6 flex flex-col justify-between hover:border-brand-500/50 hover:shadow-2xl hover:shadow-brand-500/10 transition-all group"
            >
              <div>
                {/* Top Badge & Date */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-full uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      Open for Quotes
                    </span>
                    {rfq.sector && (
                      <span className="px-2.5 py-0.5 bg-blue-500/15 border border-blue-500/30 text-blue-300 text-[10px] font-bold rounded-full">
                        {STATIC_SECTORS.find(s => s.slug === rfq.sector)?.name || rfq.sector}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 font-medium">
                    {rfq.created_at ? new Date(rfq.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : 'Today'}
                  </span>
                </div>

                {/* Product Title */}
                <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-2 mb-2">
                  {rfq.product_name}
                </h3>

                {/* Buyer Info */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mb-4 pb-3 border-b border-slate-700/60">
                  <span className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[10px] text-white font-bold">
                    🏢
                  </span>
                  <span className="font-medium text-slate-200 truncate">
                    {rfq.users?.company_name || 'Verified Industrial Buyer'}
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-extrabold rounded-full tracking-wider inline-flex items-center gap-1">
                    <span>✓ GST VERIFIED BUYER</span>
                  </span>
                  {rfq.users?.city && (
                    <span className="text-slate-500">• {rfq.users.city}, {rfq.users.state}</span>
                  )}
                </div>

                {/* Requirement Specs Matrix */}
                <div className="grid grid-cols-2 gap-2.5 mb-4">
                  <div className="bg-slate-900/60 rounded-xl p-2.5 border border-slate-700/40">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Required Quantity</div>
                    <div className="text-sm font-bold text-white mt-0.5">
                      {rfq.quantity} {rfq.unit || 'Units'}
                    </div>
                  </div>
                  <div className="bg-slate-900/60 rounded-xl p-2.5 border border-slate-700/40">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-400/80">Target Budget</div>
                    <div className="text-sm font-bold text-amber-400 mt-0.5">
                      ₹{Number(rfq.target_price || 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div className="bg-slate-900/60 rounded-xl p-2.5 border border-slate-700/40">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Destination</div>
                    <div className="text-xs font-semibold text-slate-200 mt-0.5 truncate" title={rfq.destination}>
                      {rfq.destination || 'India Port / Site'}
                    </div>
                  </div>
                  <div className="bg-slate-900/60 rounded-xl p-2.5 border border-slate-700/40">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Needed By</div>
                    <div className="text-xs font-semibold text-slate-200 mt-0.5">
                      {rfq.deadline ? new Date(rfq.deadline).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Immediate'}
                    </div>
                  </div>
                </div>

                {/* Notes Snippet */}
                {rfq.notes && (
                  <p className="text-xs text-slate-400 bg-slate-900/40 rounded-xl p-2.5 border-l-2 border-amber-500/50 italic mb-4 line-clamp-2">
                    "{rfq.notes}"
                  </p>
                )}
              </div>

              {/* Action Button */}
              <div className="pt-2">
                {(() => {
                  const isOwnRfq = Boolean(
                    currentUserProfile && (
                      (rfq.buyer_id && (rfq.buyer_id === currentUserProfile.id || rfq.buyer_id === currentUserProfile.firebase_uid)) ||
                      (rfq.buyer_email && currentUserProfile.registered_email && rfq.buyer_email.toLowerCase().trim() === currentUserProfile.registered_email.toLowerCase().trim()) ||
                      (rfq.buyer_phone && (rfq.buyer_phone === currentUserProfile.corporate_phone || rfq.buyer_phone === currentUserProfile.phone_number || rfq.buyer_phone === currentUserProfile.phone))
                    )
                  );

                  return isOwnRfq ? (
                    <Link
                      href="/dashboard/rfqs"
                      className="w-full py-3 bg-slate-950 hover:bg-black text-amber-400 font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 border border-slate-700 cursor-pointer"
                    >
                      <span>🔒 Your RFQ Requirement • View Quotes</span>
                      <span>→</span>
                    </Link>
                  ) : (
                    <button
                      onClick={() => setSelectedRfqForQuote(rfq)}
                      suppressHydrationWarning
                      className="w-full py-3 bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 group-hover:shadow-brand-500/20 cursor-pointer"
                    >
                      <span>Submit Instant Quotation</span>
                      <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </button>
                  );
                })()}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Live Marketplace Trust Highlights Footer */}
        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-wrap items-center justify-between gap-6 text-xs text-slate-400">
          <div className="flex items-center gap-6 flex-wrap">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <strong>100% Escrow Protection:</strong> 10% Advance locked until warehouse dispatch
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              <strong>Instant Supplier Alerts:</strong> Direct WhatsApp & Email notification
            </span>
          </div>
          <Link
            href="/dashboard/rfqs"
            className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 transition-colors"
          >
            <span>View All 1,480+ Open Inquiries</span>
            <span>→</span>
          </Link>
        </div>
      </div>

      {/* Smart RFQ Modal */}
      <AnimatePresence>
        {showSmartRFQModal && (
          <SmartRFQForm onClose={() => setShowSmartRFQModal(false)} />
        )}
      </AnimatePresence>

      {/* Supplier Quotation Modal */}
      <AnimatePresence>
        {selectedRfqForQuote && (
          <SupplierQuoteForm
            rfq={selectedRfqForQuote}
            onClose={() => setSelectedRfqForQuote(null)}
            onSuccess={() => {
              setSelectedRfqForQuote(null);
              alert("Your quotation has been sent to the buyer!");
            }}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
