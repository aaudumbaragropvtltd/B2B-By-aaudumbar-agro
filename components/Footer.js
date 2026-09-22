// ============================================================================
// FOOTER COMPONENT — ENTERPRISE B2B CONGLOMERATE DESIGN
// ============================================================================
// 1. High-Trust Value Pillars (Escrow, Verified MSMEs, Mandi Rates, Logistics)
// 2. Cohesive 4-Column Enterprise Architecture:
//    - Brand Identity, Conglomerate Accreditation & Official Social Channels
//    - Marketplace Solutions Navigation
//    - Policies & Legal Compliance (Strict Razorpay Compliance)
//    - Enterprise Support Desk & Corporate HQ (Schema.org Microdata)
// 3. Wholesale Industry Sectors Showcase (38 Sectors in Glassmorphic Micro-Cards,
//    with smart mobile expansion to preserve clean vertical rhythm)
// 4. Secure Legal & Cryptographic Trust Strip (SSL, Razorpay Escrow, Copyright)
// ============================================================================

"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import B2BLogo from '@/components/B2BLogo';
import { STATIC_SECTORS } from '@/constants/sectors';

export default function Footer() {
  const [showAllMobileSectors, setShowAllMobileSectors] = useState(false);

  return (
    <footer className="relative bg-gradient-to-b from-[#080d19] via-[#050912] to-[#02050a] text-slate-300 pt-10 sm:pt-14 mt-16 border-t border-white/[0.08] overflow-hidden">
      {/* Ambient Top Glow */}
      <div 
        aria-hidden="true" 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 max-w-4xl h-32 bg-gradient-to-b from-blue-500/10 via-amber-500/5 to-transparent blur-3xl pointer-events-none -z-10" 
      />

      {/* Main Footer Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 space-y-12">
        
        {/* ── 1. High-Trust Value Pillars Bar ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 pb-10 sm:pb-12 border-b border-white/[0.08]">
          
          {/* Pillar 1: 100% Escrow Protection */}
          <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/[0.025] hover:bg-white/[0.04] border border-white/[0.06] transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">100% Escrow Safeguard</h4>
              <p className="text-[11px] text-slate-400 leading-tight mt-0.5">Milestone payouts via Razorpay</p>
            </div>
          </div>

          {/* Pillar 2: Verified MSMEs */}
          <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/[0.025] hover:bg-white/[0.04] border border-white/[0.06] transition-all">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400 shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Verified Indian MSMEs</h4>
              <p className="text-[11px] text-slate-400 leading-tight mt-0.5">Strict GSTIN &amp; factory audits</p>
            </div>
          </div>

          {/* Pillar 3: Live Mandi Benchmarks */}
          <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/[0.025] hover:bg-white/[0.04] border border-white/[0.06] transition-all">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Live Mandi Benchmarks</h4>
              <p className="text-[11px] text-slate-400 leading-tight mt-0.5">Daily wholesale APMC rates</p>
            </div>
          </div>

          {/* Pillar 4: Pan-India Freight */}
          <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/[0.025] hover:bg-white/[0.04] border border-white/[0.06] transition-all">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-400 shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
              </svg>
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Pan-India Freight</h4>
              <p className="text-[11px] text-slate-400 leading-tight mt-0.5">Full truckload &amp; express dispatch</p>
            </div>
          </div>
        </div>

        {/* ── 2. Cohesive 4-Column Enterprise Architecture ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 pb-10 sm:pb-12 border-b border-white/[0.08]">
          
          {/* Column 1: Brand & Conglomerate Accreditation (lg:col-span-4) */}
          <div className="lg:col-span-4 space-y-4">
            <Link href="/" className="inline-flex items-center gap-3 group">
              <B2BLogo className="w-10 h-10 transition-transform group-hover:scale-105" />
              <div>
                <div className="text-lg font-black text-white tracking-wide leading-none">B2B INDIA</div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-amber-400 font-bold mt-1">
                  Conglomerate Marketplace
                </div>
              </div>
            </Link>

            <p className="text-xs leading-relaxed text-slate-300/80 max-w-sm">
              India&apos;s premier cross-industry B2B trade marketplace connecting verified
              manufacturers, automated milestone escrow settlements, and nationwide wholesale freight.
            </p>

            {/* Corporate Entity & GST Verified Card */}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-1.5 max-w-sm">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="text-xs font-bold text-white">Aaudumbar Agro Pvt. Ltd.</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Govt. GSTIN &amp; CIN Registered • ISO 9001:2015 Standards • Bank Escrow Protected
              </p>
            </div>

            {/* Official Social Media Channels */}
            <div className="pt-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Official Channels
              </div>
              <div className="flex items-center gap-2.5">
                <a
                  href="https://www.facebook.com/b2bindia.site"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="B2B India on Facebook"
                  className="w-8 h-8 rounded-xl bg-white/[0.04] hover:bg-white/[0.12] border border-white/[0.08] flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M12 2.04c-5.5 0-10 4.49-10 10.02 0 5 3.66 9.15 8.44 9.9v-7H7.9v-2.9h2.54V9.85c0-2.51 1.49-3.89 3.78-3.89 1.09 0 2.23.19 2.23.19v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.9h-2.33v7a10 10 0 0 0 8.44-9.9c0-5.53-4.5-10.02-10-10.02z"/></svg>
                </a>
                <a
                  href="https://www.instagram.com/b2bindia.site"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="B2B India on Instagram"
                  className="w-8 h-8 rounded-xl bg-white/[0.04] hover:bg-white/[0.12] border border-white/[0.08] flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </a>
                <a
                  href="https://wa.me/918408841998"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="B2B India on WhatsApp"
                  className="w-8 h-8 rounded-xl bg-white/[0.04] hover:bg-emerald-500/20 border border-white/[0.08] hover:border-emerald-500/30 flex items-center justify-center text-slate-300 hover:text-emerald-400 transition-all cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.592 2.654-.696c1.004.573 1.828.847 2.806.847h.005c3.18 0 5.767-2.586 5.768-5.766.001-3.182-2.585-5.768-5.773-5.768zm4.27 7.747c-.18.508-.9 1.005-1.432 1.042-.486.034-.982.16-3.23-1.077-1.921-1.056-3.158-3.007-3.253-3.136-.096-.129-.778-1.034-.778-1.972 0-.938.491-1.398.665-1.589.175-.19.381-.238.508-.238.127 0 .254.001.365.006.117.006.274-.044.428.327.159.381.54 1.317.587 1.412.048.096.079.207.016.334-.064.127-.096.206-.19.317-.096.111-.202.248-.288.334-.096.095-.196.198-.084.39.111.19.495.817 1.06 1.32.729.649 1.343.85 1.534.945.19.096.302.08.413-.048.111-.127.476-.556.603-.746.127-.19.254-.159.428-.095.175.064 1.111.524 1.302.619.19.096.317.143.365.223.048.079.048.46-.132.968z"/></svg>
                </a>
              </div>
            </div>
          </div>

          {/* Column 2: Marketplace Solutions (lg:col-span-2) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-3.5 rounded-full bg-amber-400 inline-block" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Solutions
              </h4>
            </div>

            <ul className="space-y-2.5 text-xs">
              <li>
                <Link
                  href="/directory"
                  className="text-slate-300/80 hover:text-white transition-colors py-0.5 inline-flex items-center gap-2 group"
                >
                  <span className="text-amber-400/50 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all text-xs">›</span>
                  <span>38 Sector Directory</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/market-rates"
                  className="text-slate-300/80 hover:text-white transition-colors py-0.5 inline-flex items-center gap-2 group"
                >
                  <span className="text-amber-400/50 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all text-xs">›</span>
                  <span>Live Mandi Rates</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/directory"
                  className="text-slate-300/80 hover:text-white transition-colors py-0.5 inline-flex items-center gap-2 group"
                >
                  <span className="text-amber-400/50 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all text-xs">›</span>
                  <span>Post Buying RFQ</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/orders"
                  className="text-slate-300/80 hover:text-white transition-colors py-0.5 inline-flex items-center gap-2 group"
                >
                  <span className="text-amber-400/50 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all text-xs">›</span>
                  <span>Order &amp; Escrow Tracking</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/onboarding"
                  className="text-slate-300/80 hover:text-white transition-colors py-0.5 inline-flex items-center gap-2 group"
                >
                  <span className="text-amber-400/50 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all text-xs">›</span>
                  <span>Sell on B2B India</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/support"
                  className="text-slate-300/80 hover:text-white transition-colors py-0.5 inline-flex items-center gap-2 group"
                >
                  <span className="text-amber-400/50 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all text-xs">›</span>
                  <span>Enterprise Desk</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Policies & Razorpay Compliance (lg:col-span-2) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-3.5 rounded-full bg-amber-400 inline-block" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Policies &amp; Legal
              </h4>
            </div>

            <ul className="space-y-2.5 text-xs">
              <li>
                <Link
                  href="/terms"
                  className="text-slate-300/80 hover:text-white transition-colors py-0.5 inline-flex items-center gap-2 group"
                >
                  <span className="text-amber-400/50 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all text-xs">›</span>
                  <span>Terms &amp; Conditions</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-slate-300/80 hover:text-white transition-colors py-0.5 inline-flex items-center gap-2 group"
                >
                  <span className="text-amber-400/50 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all text-xs">›</span>
                  <span>Privacy Policy</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/refund-policy"
                  className="text-slate-300/80 hover:text-white transition-colors py-0.5 inline-flex items-center gap-2 group"
                >
                  <span className="text-amber-400/50 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all text-xs">›</span>
                  <span>Cancellation &amp; Refund</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/shipping-policy"
                  className="text-slate-300/80 hover:text-white transition-colors py-0.5 inline-flex items-center gap-2 group"
                >
                  <span className="text-amber-400/50 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all text-xs">›</span>
                  <span>Shipping &amp; Delivery</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/cookie"
                  className="text-slate-300/80 hover:text-white transition-colors py-0.5 inline-flex items-center gap-2 group"
                >
                  <span className="text-amber-400/50 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all text-xs">›</span>
                  <span>Cookie Policy</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/terms#escrow"
                  className="text-slate-300/80 hover:text-white transition-colors py-0.5 inline-flex items-center gap-2 group"
                >
                  <span className="text-amber-400/50 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all text-xs">›</span>
                  <span>Escrow Guidelines</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Enterprise Support & Registered Office (lg:col-span-4) */}
          <div
            className="lg:col-span-4 space-y-4"
            itemScope
            itemType="https://schema.org/LocalBusiness"
          >
            <meta itemProp="name" content="B2B India — Aaudumbar Agro Pvt. Ltd." />
            <meta itemProp="url" content="https://www.b2bindia.site" />
            <meta itemProp="image" content="https://www.b2bindia.site/logo.png" />
            
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-3.5 rounded-full bg-emerald-400 inline-block" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Enterprise Support Desk
              </h4>
            </div>

            <div className="space-y-2.5">
              {/* Email Link Card */}
              <a
                href="mailto:support@b2bindia.site"
                itemProp="email"
                className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-amber-400/30 transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400 shrink-0">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Official Email</div>
                  <div className="text-xs font-medium text-white group-hover:text-amber-300 transition-colors truncate">
                    support@b2bindia.site
                  </div>
                </div>
                <span className="text-slate-400 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all text-xs shrink-0">→</span>
              </a>

              {/* Phone Link Card */}
              <a
                href="tel:+918408841998"
                itemProp="telephone"
                className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-emerald-400/30 transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Helpline &amp; Escalations</div>
                  <div className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                    +91 8408841998
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium shrink-0">
                  9 AM - 8 PM
                </span>
              </a>

              {/* Registered Corporate Office (Schema PostalAddress) */}
              <div 
                itemProp="address" 
                itemScope 
                itemType="https://schema.org/PostalAddress"
                className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]"
              >
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5 mb-1">
                  <span>🏢</span> Registered Corporate HQ
                </div>
                <p className="text-xs text-slate-300 leading-snug">
                  <span itemProp="streetAddress">Plot No. 5, Prerna Nagar, Garkheda Parisar</span>,<br />
                  <span itemProp="addressLocality">Chhatrapati Sambhajinagar</span>{' '}
                  <span itemProp="postalCode">431009</span>,{' '}
                  <span itemProp="addressRegion">Maharashtra</span>,{' '}
                  <span itemProp="addressCountry">India</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── 3. Wholesale Industry Sectors Showcase (38 Sectors) ── */}
        <div className="pb-10 sm:pb-12">
          <div className="rounded-2xl bg-gradient-to-b from-white/[0.025] to-white/[0.005] border border-white/[0.07] p-4 sm:p-6 backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white tracking-wide">
                    Browse 38 Industrial Sectors &amp; Wholesale Directories
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Direct procurement from certified Indian manufacturers, fabricators &amp; millers
                  </p>
                </div>
              </div>
              
              <Link
                href="/directory"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 text-amber-300 text-xs font-semibold transition-all group self-start sm:self-auto shrink-0 cursor-pointer"
              >
                <span>Master Directory</span>
                <span className="group-hover:translate-x-0.5 transition-transform">→</span>
              </Link>
            </div>

            {/* 38 Sectors in Micro-Card Pills:
                - Always 38 on desktop/tablet (>=640px)
                - On mobile (<640px), top 12 displayed by default with a clean expand toggle
            */}
            <nav 
              aria-label="38 Industrial Sectors Directory"
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-2.5"
            >
              {STATIC_SECTORS.map((sector, index) => {
                const isHiddenOnMobile = !showAllMobileSectors && index >= 12;
                return (
                  <Link
                    key={sector.slug}
                    href={`/directory/${sector.slug}`}
                    className={`group px-2.5 py-1.5 rounded-lg bg-black/25 hover:bg-amber-400/10 border border-white/[0.04] hover:border-amber-400/30 transition-all items-center justify-between gap-1 text-slate-300 hover:text-white ${
                      isHiddenOnMobile ? 'hidden sm:flex' : 'flex'
                    }`}
                  >
                    <span className="text-[11px] font-medium text-slate-300 group-hover:text-amber-200 transition-colors truncate">
                      {sector.name}
                    </span>
                    <span className="text-[10px] text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all shrink-0 select-none">
                      ›
                    </span>
                  </Link>
                );
              })}
            </nav>

            {/* Mobile View All Toggle Button (Visible only on <640px) */}
            <div className="mt-3 text-center sm:hidden">
              <button
                type="button"
                onClick={() => setShowAllMobileSectors(!showAllMobileSectors)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-medium text-amber-300 transition-all cursor-pointer"
              >
                <span>{showAllMobileSectors ? 'Show Fewer Sectors' : `Show All 38 Sectors (+${STATIC_SECTORS.length - 12} More)`}</span>
                <span className="text-[10px]">{showAllMobileSectors ? '▲' : '▼'}</span>
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* ── 4. Bottom Cryptographic Trust & Legal Strip ── */}
      <div className="border-t border-white/[0.08] bg-black/80 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Copyright & Organization */}
            <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2 text-center md:text-left">
              <span className="text-slate-300 font-medium text-[11px] sm:text-xs">
                © 2026 Aaudumbar Agro Pvt. Ltd. All rights reserved.
              </span>
              <span className="hidden sm:inline text-white/20">•</span>
              <span className="text-[11px] text-slate-400">
                ISO 9001:2015 Standards • GSTIN Registered Marketplace
              </span>
            </div>

            {/* Cryptographic Trust Badges in Clean Responsive Pills */}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 text-[11px] text-slate-300">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/[0.06]">
                <svg className="w-3.5 h-3.5 text-emerald-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>256-Bit SSL Escrow</span>
              </span>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/[0.06]">
                <svg className="w-3.5 h-3.5 text-blue-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
                <span>Razorpay Verified</span>
              </span>

              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/[0.06]">
                <span>🇮🇳</span>
                <span>Made in India</span>
              </span>
            </div>
          </div>

          {/* Clean Quick Legal Jump Navigation Bar */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-1.5 text-[11px] text-slate-400 pt-2 border-t border-white/[0.04]">
            <Link href="/terms" className="hover:text-amber-300 transition-colors py-0.5">
              Terms of Use
            </Link>
            <span className="text-white/20 select-none">•</span>
            <Link href="/privacy" className="hover:text-amber-300 transition-colors py-0.5">
              Privacy Policy
            </Link>
            <span className="text-white/20 select-none">•</span>
            <Link href="/refund-policy" className="hover:text-amber-300 transition-colors py-0.5">
              Cancellation &amp; Refund
            </Link>
            <span className="text-white/20 select-none">•</span>
            <Link href="/shipping-policy" className="hover:text-amber-300 transition-colors py-0.5">
              Shipping &amp; Logistics
            </Link>
            <span className="text-white/20 select-none">•</span>
            <Link href="/cookie" className="hover:text-amber-300 transition-colors py-0.5">
              Cookie Preferences
            </Link>
            <span className="text-white/20 select-none">•</span>
            <Link href="/support" className="hover:text-amber-300 transition-colors py-0.5">
              24/7 Enterprise Desk
            </Link>
          </div>

        </div>
      </div>
    </footer>
  );
}
