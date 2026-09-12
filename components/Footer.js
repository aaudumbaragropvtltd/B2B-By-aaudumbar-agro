// ============================================================================
// FOOTER COMPONENT
// ============================================================================
// Simplified footer matching the requested information only.
// ============================================================================

import React from 'react';
import Link from 'next/link';
import B2BLogo from '@/components/B2BLogo';

export default function Footer() {
  return (
    <footer className="relative bg-brand-950 text-white/70 pt-8 mt-12">
      {/* Wave Divider */}
      <div className="absolute top-0 left-0 right-0 h-4 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNDQwIDMyIj48cGF0aCBmaWxsPSIjMWUzYTVmIiBmaWxsLW9wYWNpdHk9IjEiIGQ9Ik0wLDE2TDQ4LDE4LjdDOTYsMjEsMTkyLDI3LDI4OCwyNC41QzM4NCwyMiw0ODAsMTEsNTc2LDguNUM2NzIsNSw3NjgsMTEsODY0LDE2Qzk2MCwyMSwxMDU2LDIxLDExNTIsMTguN0MxMjQ4LDE2LDEzNDQsOCwxMzkyLDRMMTQ0MCwwTDE0NDAsMzJMMTM5MiwzMkMxMzQ0LDMyLDEyNDgsMzIsMTE1MiwzMkMxMDU2LDMyLDk2MCwzMiw4NjQsMzJDNzY4LDMyLDY3MiwzMiw1NzYsMzJDNDgwLDMyLDM4NCwzMiwyODgsMzJDMTkyLDMyLDk2LDMyLDQ4LDMyTDAsMzJaIj48L3BhdGg+PC9zdmc+')] bg-cover -mt-4 opacity-50 z-10" />

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-12 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-5">
              <B2BLogo className="w-10 h-10" />
              <div>
                <div className="text-lg font-bold text-white">B2B INDIA</div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-accent-400 font-bold">
                  Conglomerate Marketplace
                </div>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-white/60">
              India&apos;s premier cross-industry B2B platform connecting verified
              manufacturers, automated escrow settlements, and AI-driven
              pricing resilience across 38 sectors.
            </p>
          </div>

          {/* Contact Column */}
          <div className="lg:col-span-1 flex flex-col text-left">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              Enterprise Support
            </h4>
            <div className="space-y-4 text-sm text-white/60">
              <div>
                <div className="text-white/40 text-xs uppercase tracking-wider mb-1">
                  Email
                </div>
                <div className="flex flex-col gap-1">
                  <a href="mailto:support@b2bindia.site" className="hover:text-white transition-colors">
                    support@b2bindia.site
                  </a>
                </div>
              </div>
              <div>
                <div className="text-white/40 text-xs uppercase tracking-wider mb-1">
                  Helpline
                </div>
                <a href="tel:+918408841998" className="hover:text-accent-400 font-semibold transition-colors">
                  +91 8408841998
                </a>
              </div>
              <div>
                <div className="text-white/40 text-xs uppercase tracking-wider mb-1">
                  Head Office
                </div>
                <p className="leading-relaxed">Plot No.5, Prerna Nagar,<br/>Garkheda Parisar,<br/>Chhatrapati Sambhajinagar 431009</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10 bg-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/40 font-medium">
            © 2026 Aaudumbar agro pvt.ltd. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-xs text-white/40 font-medium">
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms of Trade
            </Link>
            <Link href="/cookie" className="hover:text-white transition-colors">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
