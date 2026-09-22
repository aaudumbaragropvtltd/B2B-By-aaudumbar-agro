// ============================================================================
// FOOTER COMPONENT
// ============================================================================
// Structure matching exact user specification:
// 1. Browse 38 Industrial Sectors & Wholesale Directories Grid (Top)
// 2. Enterprise Section: Brand, Policies & Legal, Enterprise Support (Middle)
// 3. Copyright & Legal Quick Links Bar (Bottom)
// ============================================================================

import React from 'react';
import Link from 'next/link';
import B2BLogo from '@/components/B2BLogo';
import { STATIC_SECTORS } from '@/constants/sectors';

export default function Footer() {
  return (
    <footer className="relative bg-[#070d18] text-white/70 pt-8 mt-12 border-t border-white/10 overflow-hidden">
      {/* Wave Divider Accent */}
      <div 
        aria-hidden="true"
        className="absolute top-0 left-0 right-0 h-4 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNDQwIDMyIj48cGF0aCBmaWxsPSIjMWUzYTVmIiBmaWxsLW9wYWNpdHk9IjEiIGQ9Ik0wLDE2TDQ4LDE4LjdDOTYsMjEsMTkyLDI3LDI4OCwyNC41QzM4NCwyMiw0ODAsMTEsNTc2LDguNUM2NzIsNSw3NjgsMTEsODY0LDE2Qzk2MCwyMSwxMDU2LDIxLDExNTIsMTguN0MxMjQ4LDE2LDEzNDQsOCwxMzkyLDRMMTQ0MCwwTDE0NDAsMzJMMTM5MiwzMkMxMzQ0LDMyLDEyNDgsMzIsMTE1MiwzMkMxMDU2LDMyLDk2MCwzMiw4NjQsMzJDNzY4LDMyLDY3MiwzMiw1NzYsMzJDNDgwLDMyLDM4NCwzMiwyODgsMzJDMTkyLDMyLDk2LDMyLDQ4LDMyTDAsMzJaIj48L3BhdGg+PC9zdmc+')] bg-cover -mt-4 opacity-50 z-10 pointer-events-none" 
      />

      {/* Main Footer Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 pb-12 relative z-20 space-y-10 sm:space-y-12">
        
        {/* ── 1. Wholesale Industry Sectors Directory (38 Sectors) — Placed at the top ── */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-3 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <span className="w-1.5 h-4 rounded-full bg-amber-400 inline-block shrink-0" />
              <h4 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                Browse 38 Industrial Sectors &amp; Wholesale Directories
              </h4>
            </div>
            
            <Link
              href="/directory"
              className="text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors inline-flex items-center gap-1.5 group self-start sm:self-auto cursor-pointer"
            >
              <span>Explore Master Directory</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>

          {/* Neatly Aligned Responsive Grid:
              - Mobile (<640px): 2 balanced columns with generous tap targets
              - Tablet (640px - 1024px): 3 balanced columns
              - Desktop (>=1024px): 4 balanced columns
          */}
          <nav 
            aria-label="38 Industrial Sectors Directory"
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-2.5 text-xs text-slate-300"
          >
            {STATIC_SECTORS.map((sector) => (
              <Link
                key={sector.slug}
                href={`/directory/${sector.slug}`}
                className="group flex items-start gap-1.5 py-1 text-slate-300/85 hover:text-white transition-all duration-150"
              >
                <span className="text-amber-400/70 group-hover:text-amber-400 text-xs font-mono leading-none mt-0.5 shrink-0 transition-transform group-hover:translate-x-0.5 select-none">
                  ›
                </span>
                <span className="text-[11px] sm:text-xs leading-snug group-hover:text-amber-300 group-hover:underline underline-offset-2 break-words">
                  {sector.name}
                </span>
              </Link>
            ))}
          </nav>
        </div>

        {/* ── 2. Top Enterprise 3-Column Section (Brand, Policies & Legal, Enterprise Support) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12 pt-8 sm:pt-10 border-t border-white/10">
          
          {/* Brand & Trust Column */}
          <div className="sm:col-span-2 lg:col-span-5 space-y-4">
            <Link href="/" className="inline-flex items-center gap-3 group">
              <B2BLogo className="w-10 h-10 transition-transform group-hover:scale-105" />
              <div>
                <div className="text-lg font-black text-white tracking-wide">B2B INDIA</div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-amber-400 font-bold">
                  Conglomerate Marketplace
                </div>
              </div>
            </Link>

            <p className="text-xs sm:text-sm leading-relaxed text-slate-300/80 max-w-md">
              India&apos;s premier cross-industry B2B trade marketplace connecting verified
              manufacturers, automated milestone escrow settlements, and nationwide wholesale freight.
            </p>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-200 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span>Aaudumbar Agro Pvt. Ltd. • GST &amp; Escrow Verified</span>
            </div>

            {/* Verified Social Media Channels */}
            <div className="pt-2">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                Official Channels
              </div>
              <div className="flex items-center gap-2.5">
                <a
                  href="https://www.facebook.com/b2bindia.site"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="B2B India on Facebook"
                  className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2.04c-5.5 0-10 4.49-10 10.02 0 5 3.66 9.15 8.44 9.9v-7H7.9v-2.9h2.54V9.85c0-2.51 1.49-3.89 3.78-3.89 1.09 0 2.23.19 2.23.19v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.9h-2.33v7a10 10 0 0 0 8.44-9.9c0-5.53-4.5-10.02-10-10.02z"/></svg>
                </a>
                <a
                  href="https://www.instagram.com/b2bindia.site"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="B2B India on Instagram"
                  className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </a>
              </div>
            </div>
          </div>

          {/* Policies & Legal Column (Razorpay Compliance) */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-3.5 rounded-full bg-amber-400 inline-block" />
              <h4 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
                Policies &amp; Legal
              </h4>
            </div>

            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <Link
                  href="/terms"
                  className="text-slate-300 hover:text-white transition-colors duration-150 py-1 inline-flex items-center gap-2 group"
                >
                  <span className="text-amber-400/60 group-hover:text-amber-400 text-xs">›</span>
                  <span>Terms &amp; Conditions</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-slate-300 hover:text-white transition-colors duration-150 py-1 inline-flex items-center gap-2 group"
                >
                  <span className="text-amber-400/60 group-hover:text-amber-400 text-xs">›</span>
                  <span>Privacy Policy</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/refund-policy"
                  className="text-slate-300 hover:text-white transition-colors duration-150 py-1 inline-flex items-center gap-2 group"
                >
                  <span className="text-amber-400/60 group-hover:text-amber-400 text-xs">›</span>
                  <span>Cancellation &amp; Refund</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/shipping-policy"
                  className="text-slate-300 hover:text-white transition-colors duration-150 py-1 inline-flex items-center gap-2 group"
                >
                  <span className="text-amber-400/60 group-hover:text-amber-400 text-xs">›</span>
                  <span>Shipping &amp; Delivery</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/cookie"
                  className="text-slate-300 hover:text-white transition-colors duration-150 py-1 inline-flex items-center gap-2 group"
                >
                  <span className="text-amber-400/60 group-hover:text-amber-400 text-xs">›</span>
                  <span>Cookie Policy</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Enterprise Support & Corporate Office (Schema.org Microdata) */}
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
              <h4 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
                Enterprise Support
              </h4>
            </div>

            <div className="space-y-3.5 text-xs sm:text-sm text-slate-300">
              <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span>✉️</span> Official Email
                </div>
                <a
                  href="mailto:support@b2bindia.site"
                  itemProp="email"
                  className="text-white hover:text-amber-300 transition-colors font-medium block break-all"
                >
                  support@b2bindia.site
                </a>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span>📞</span> Helpline &amp; Escalations
                </div>
                <a
                  href="tel:+918408841998"
                  itemProp="telephone"
                  className="text-white hover:text-amber-300 font-bold transition-colors block"
                >
                  +91 8408841998
                </a>
              </div>

              <div 
                itemProp="address" 
                itemScope 
                itemType="https://schema.org/PostalAddress"
                className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1"
              >
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span>🏢</span> Registered Corporate Office
                </div>
                <p className="leading-relaxed text-xs text-slate-200">
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
      </div>

      {/* ── 3. Bottom Bar: Clean, Spaced, High-Contrast ── */}
      <div className="border-t border-white/10 bg-black/60 py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-300">
          <p className="font-medium text-center md:text-left text-slate-300 text-[11px] sm:text-xs">
            © 2026 Aaudumbar Agro Pvt. Ltd. All rights reserved. • ISO &amp; GST Certified Marketplace
          </p>

          <div className="flex flex-wrap items-center justify-center gap-y-2 gap-x-4 sm:gap-x-5 text-slate-300 text-[11px] sm:text-xs font-medium">
            <Link href="/terms" className="hover:text-white transition-colors py-1">
              Terms
            </Link>
            <span className="text-white/30 select-none">•</span>
            <Link href="/privacy" className="hover:text-white transition-colors py-1">
              Privacy
            </Link>
            <span className="text-white/30 select-none">•</span>
            <Link href="/refund-policy" className="hover:text-white transition-colors py-1">
              Refunds
            </Link>
            <span className="text-white/30 select-none">•</span>
            <Link href="/shipping-policy" className="hover:text-white transition-colors py-1">
              Shipping
            </Link>
            <span className="text-white/30 select-none">•</span>
            <Link href="/support" className="hover:text-white transition-colors py-1">
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
