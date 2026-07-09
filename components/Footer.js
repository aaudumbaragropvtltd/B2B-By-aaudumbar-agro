// ============================================================================
// FOOTER COMPONENT
// ============================================================================
// Enterprise-grade footer with sector links, platform info, certifications,
// and contact details. Supports dark theme natively.
// ============================================================================

import React from 'react';
import Link from 'next/link';

const FOOTER_SECTORS = [
  { name: 'Agriculture', slug: 'agriculture' },
  { name: 'Apparel & Fashion', slug: 'apparel-fashion' },
  { name: 'Automobile & EV', slug: 'automobile-ev' },
  { name: 'Chemicals & Polymers', slug: 'chemicals-polymers' },
  { name: 'Electronics & Electrical', slug: 'electronics-electrical' },
  { name: 'Food & Beverages', slug: 'food-beverage' },
  { name: 'Industrial CNC', slug: 'industrial-cnc' },
  { name: 'Medical & Surgical', slug: 'medical-surgical' },
];

const PLATFORM_LINKS = [
  { name: 'Trade Directory', href: '/directory' },
  { name: 'Supplier Dashboard', href: '/dashboard' },
  { name: 'Buyer Dashboard', href: '/dashboard' },
  { name: 'Pricing Engine', href: '#' },
  { name: 'Escrow Settlement', href: '#' },
];

export default function Footer() {
  return (
    <footer className="bg-brand-950 text-white/70">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center">
                <span className="text-white font-bold text-lg">B</span>
              </div>
              <div>
                <div className="text-lg font-bold text-white">B2B Bharat</div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">
                  Conglomerate Marketplace
                </div>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-white/50 mb-6">
              India&apos;s premier cross-industry B2B platform connecting verified
              manufacturers, automated escrow settlements, and AI-driven
              pricing resilience across 38 sectors.
            </p>
            {/* Trust Badges */}
            <div className="flex flex-wrap gap-2">
              {['GST Verified', 'Escrow Protected', 'AI Pricing'].map((badge) => (
                <span
                  key={badge}
                  className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-semibold uppercase tracking-wider text-white/40"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>

          {/* Sectors Column */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Trade Sectors
            </h4>
            <ul className="space-y-2.5">
              {FOOTER_SECTORS.map((sector) => (
                <li key={sector.slug}>
                  <Link
                    href={`/directory/${sector.slug}`}
                    className="text-sm hover:text-white transition-colors duration-200"
                  >
                    {sector.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Platform Column */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Platform
            </h4>
            <ul className="space-y-2.5">
              {PLATFORM_LINKS.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm hover:text-white transition-colors duration-200"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Column */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Enterprise Support
            </h4>
            <div className="space-y-4 text-sm">
              <div>
                <div className="text-white/40 text-xs uppercase tracking-wider mb-1">
                  Email
                </div>
                <a
                  href="mailto:enterprise@b2bbharat.com"
                  className="hover:text-white transition-colors"
                >
                  enterprise@b2bbharat.com
                </a>
              </div>
              <div>
                <div className="text-white/40 text-xs uppercase tracking-wider mb-1">
                  Helpline
                </div>
                <a href="tel:+911800123456" className="hover:text-white transition-colors">
                  1800-123-456 (Toll Free)
                </a>
              </div>
              <div>
                <div className="text-white/40 text-xs uppercase tracking-wider mb-1">
                  Head Office
                </div>
                <p>Connaught Place, New Delhi 110001</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/30">
            © {new Date().getFullYear()} B2B Bharat Conglomerate Marketplace. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-xs text-white/30">
            <Link href="#" className="hover:text-white/60 transition-colors">
              Privacy Policy
            </Link>
            <Link href="#" className="hover:text-white/60 transition-colors">
              Terms of Trade
            </Link>
            <Link href="#" className="hover:text-white/60 transition-colors">
              Grievance Redressal
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
