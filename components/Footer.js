// ============================================================================
// FOOTER COMPONENT
// ============================================================================
// Clean, spacious 3-column enterprise footer:
// 1. Brand identity & compliance badges
// 2. Clear, dedicated Policies & Legal column (Razorpay compliant)
// 3. Enterprise Contact & Registered Office
// 4. Well-spaced, non-colliding bottom copyright bar
// ============================================================================

import React from 'react';
import Link from 'next/link';
import B2BLogo from '@/components/B2BLogo';

export default function Footer() {
  return (
    <footer className="relative bg-brand-950 text-white/70 pt-8 mt-12 border-t border-white/5">
      {/* Wave Divider */}
      <div className="absolute top-0 left-0 right-0 h-4 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNDQwIDMyIj48cGF0aCBmaWxsPSIjMWUzYTVmIiBmaWxsLW9wYWNpdHk9IjEiIGQ9Ik0wLDE2TDQ4LDE4LjdDOTYsMjEsMTkyLDI3LDI4OCwyNC41QzM4NCwyMiw0ODAsMTEsNTc2LDguNUM2NzIsNSw3NjgsMTEsODY0LDE2Qzk2MCwyMSwxMDU2LDIxLDExNTIsMTguN0MxMjQ4LDE2LDEzNDQsOCwxMzkyLDRMMTQ0MCwwTDE0NDAsMzJMMTM5MiwzMkMxMzQ0LDMyLDEyNDgsMzIsMTE1MiwzMkMxMDU2LDMyLDk2MCwzMiw4NjQsMzJDNzY4LDMyLDY3MiwzMiw1NzYsMzJDNDgwLDMyLDM4NCwzMiwyODgsMzJDMTkyLDMyLDk2LDMyLDQ4LDMyTDAsMzJaIj48L3BhdGg+PC9zdmc+')] bg-cover -mt-4 opacity-50 z-10" />

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-14 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-12">
          {/* 1. Brand Column */}
          <div className="md:col-span-5 lg:col-span-5">
            <div className="flex items-center gap-3 mb-5">
              <B2BLogo className="w-10 h-10" />
              <div>
                <div className="text-lg font-bold text-white tracking-wide">B2B INDIA</div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-accent-400 font-bold">
                  Conglomerate Marketplace
                </div>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-white/60 mb-6 max-w-sm">
              India&apos;s premier cross-industry B2B trade marketplace connecting verified
              manufacturers, automated milestone escrow settlements, and nationwide wholesale freight.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/70 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Aaudumbar Agro Pvt. Ltd. • GST &amp; Escrow Verified
            </div>
          </div>

          {/* 2. Policies & Legal Column */}
          <div className="md:col-span-3 lg:col-span-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-5 pb-1 border-b border-white/10 inline-block">
              Policies &amp; Legal
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/terms"
                  className="text-white/60 hover:text-white transition-colors duration-200 block"
                >
                  Terms &amp; Conditions
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-white/60 hover:text-white transition-colors duration-200 block"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/refund-policy"
                  className="text-white/60 hover:text-white transition-colors duration-200 block"
                >
                  Cancellation &amp; Refund
                </Link>
              </li>
              <li>
                <Link
                  href="/shipping-policy"
                  className="text-white/60 hover:text-white transition-colors duration-200 block"
                >
                  Shipping &amp; Delivery
                </Link>
              </li>
              <li>
                <Link
                  href="/cookie"
                  className="text-white/60 hover:text-white transition-colors duration-200 block"
                >
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* 3. Support & Corporate Office */}
          <div className="md:col-span-4 lg:col-span-4 flex flex-col text-left">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-5 pb-1 border-b border-white/10 inline-block">
              Enterprise Support
            </h4>
            <div className="space-y-4 text-sm text-white/60">
              <div>
                <div className="text-white/40 text-xs uppercase tracking-wider mb-1 font-semibold">
                  Official Email
                </div>
                <a
                  href="mailto:support@b2bindia.site"
                  className="text-white/80 hover:text-accent-400 transition-colors duration-200 font-medium"
                >
                  support@b2bindia.site
                </a>
              </div>
              <div>
                <div className="text-white/40 text-xs uppercase tracking-wider mb-1 font-semibold">
                  Helpline
                </div>
                <a
                  href="tel:+918408841998"
                  className="text-white/90 hover:text-accent-400 font-semibold transition-colors duration-200"
                >
                  +91 8408841998
                </a>
              </div>
              <div>
                <div className="text-white/40 text-xs uppercase tracking-wider mb-1 font-semibold">
                  Registered Office
                </div>
                <p className="leading-relaxed text-xs text-white/60">
                  Plot No. 5, Prerna Nagar, Garkheda Parisar,<br />
                  Chhatrapati Sambhajinagar 431009, Maharashtra
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar — Clean, Spaced, No Collisions */}
      <div className="border-t border-white/10 bg-black/40 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/40">
          <p className="font-medium text-center md:text-left">
            © 2026 Aaudumbar Agro Pvt. Ltd. All rights reserved.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-y-2 gap-x-5 text-white/50">
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms
            </Link>
            <span className="text-white/20 select-none">•</span>
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy
            </Link>
            <span className="text-white/20 select-none">•</span>
            <Link href="/refund-policy" className="hover:text-white transition-colors">
              Refunds
            </Link>
            <span className="text-white/20 select-none">•</span>
            <Link href="/shipping-policy" className="hover:text-white transition-colors">
              Shipping
            </Link>
            <span className="text-white/20 select-none">•</span>
            <Link href="/support" className="hover:text-white transition-colors">
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
