// ============================================================================
// TOP SUPPLIERS SECTION (Alibaba-Style)
// ============================================================================
// Showcases top-ranking verified suppliers with tier badges (Gold/Diamond),
// response rates, years in business, and 3D card hover effects.
// ============================================================================

"use client";

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

const TOP_SUPPLIERS = [
  {
    id: 's0',
    name: 'Aaudumbar Agro',
    location: 'Maharashtra, India',
    sector: 'Agriculture & Farming',
    tier: 'Platinum',
    yearEstablished: 2020,
    responseRate: '100%',
    responseTime: '< 1h',
    products: 120,
    icon: '🌾',
  },
  {
    id: 's1',
    name: 'Jain Irrigation Systems',
    location: 'Jalgaon, Maharashtra',
    sector: 'Agriculture & Irrigation',
    tier: 'Diamond',
    yearEstablished: 1986,
    responseRate: '98%',
    responseTime: '< 2h',
    products: 42,
    icon: '🌾',
  },
  {
    id: 's2',
    name: 'Arvind Mills Ltd',
    location: 'Ahmedabad, Gujarat',
    sector: 'Textiles & Apparel',
    tier: 'Gold',
    yearEstablished: 1931,
    responseRate: '95%',
    responseTime: '< 4h',
    products: 38,
    icon: '🧵',
  },
  {
    id: 's3',
    name: 'Polycab India Ltd',
    location: 'Daman, Diu',
    sector: 'Electrical & Cables',
    tier: 'Diamond',
    yearEstablished: 1996,
    responseRate: '97%',
    responseTime: '< 1h',
    products: 56,
    icon: '⚡',
  },
  {
    id: 's4',
    name: 'Sundram Fasteners',
    location: 'Chennai, Tamil Nadu',
    sector: 'Auto Components',
    tier: 'Gold',
    yearEstablished: 1962,
    responseRate: '94%',
    responseTime: '< 3h',
    products: 29,
    icon: '⚙️',
  },
  {
    id: 's5',
    name: 'Dabur Industrial',
    location: 'Ghaziabad, UP',
    sector: 'Ayurvedic & Herbal',
    tier: 'Platinum',
    yearEstablished: 1884,
    responseRate: '99%',
    responseTime: '< 1h',
    products: 67,
    icon: '🌿',
  },
  {
    id: 's6',
    name: 'Bharat Forge Ltd',
    location: 'Pune, Maharashtra',
    sector: 'Industrial Forging',
    tier: 'Diamond',
    yearEstablished: 1961,
    responseRate: '96%',
    responseTime: '< 2h',
    products: 33,
    icon: '🏭',
  },
];

const TIER_STYLES = {
  Diamond: { bg: 'bg-gradient-to-r from-cyan-500 to-blue-600', text: '💎 Diamond', border: 'border-cyan-200' },
  Gold: { bg: 'bg-gradient-to-r from-amber-500 to-yellow-600', text: '🥇 Gold', border: 'border-amber-200' },
  Platinum: { bg: 'bg-gradient-to-r from-violet-500 to-purple-600', text: '👑 Platinum', border: 'border-violet-200' },
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 100, damping: 15 },
  },
};

export default function TopSuppliersSection({ initialSuppliers = [] }) {
  const suppliers = initialSuppliers.length > 0 ? initialSuppliers : TOP_SUPPLIERS;
  return (
    <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8 bg-surface-elevated gradient-mesh">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 text-amber-700 text-sm font-semibold mb-4 border border-amber-200"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Verified & Ranked
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight"
          >
            Top-Ranking <span className="gradient-text">Suppliers</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto"
          >
            India&apos;s most trusted manufacturers — verified, responsive, and ready for enterprise procurement.
          </motion.p>
        </div>

        {/* Suppliers Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-50px' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {suppliers.map((supplier) => {
            const tier = TIER_STYLES[supplier.tier];
            return (
              <motion.div key={supplier.id} variants={cardVariants}>
                <Link href="/directory">
                  <motion.div
                    whileHover={{ y: -8, boxShadow: '0 25px 50px rgba(0,0,0,0.08)' }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-white rounded-2xl border border-gray-100 overflow-hidden group cursor-pointer card-3d h-full"
                  >
                    {/* Top accent */}
                    <div className={`h-1.5 ${tier.bg}`} />

                    <div className="p-5">
                      {/* Company Header */}
                      <div className="flex items-start gap-3 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-2xl border border-gray-100 group-hover:scale-110 transition-transform">
                          {supplier.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 group-hover:text-brand-600 transition-colors truncate">
                            {supplier.name}
                          </h3>
                          <p className="text-xs text-gray-400 mt-0.5">{supplier.location}</p>
                        </div>
                      </div>

                      {/* Tier Badge */}
                      <div className="flex items-center gap-2 mb-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold text-white ${tier.bg}`}>
                          {tier.text}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-gray-50 text-[10px] font-medium text-gray-500 border border-gray-100">
                          {supplier.sector}
                        </span>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="text-center p-2 rounded-lg bg-gray-50 border border-gray-100">
                          <div className="text-sm font-extrabold text-gray-900">{supplier.responseRate}</div>
                          <div className="text-[9px] text-gray-400 uppercase tracking-wider">Response</div>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-gray-50 border border-gray-100">
                          <div className="text-sm font-extrabold text-gray-900">{supplier.responseTime}</div>
                          <div className="text-[9px] text-gray-400 uppercase tracking-wider">Avg Time</div>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-gray-50 border border-gray-100">
                          <div className="text-sm font-extrabold text-gray-900">{supplier.products}</div>
                          <div className="text-[9px] text-gray-400 uppercase tracking-wider">Products</div>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                        <span className="text-[10px] text-gray-400">Est. {supplier.yearEstablished}</span>
                        <span className="text-xs font-semibold text-brand-600 flex items-center gap-1 group-hover:underline">
                          View Profile
                          <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </span>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>

        {/* View All CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-10"
        >
          <Link
            href="/directory"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-50 text-brand-700 font-semibold hover:bg-brand-100 transition-colors border border-brand-100"
          >
            Explore All Suppliers
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
