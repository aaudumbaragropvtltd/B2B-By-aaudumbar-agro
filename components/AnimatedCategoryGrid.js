// ============================================================================
// ANIMATED CATEGORY GRID
// ============================================================================
// Framer Motion staggered reveal grid showing all 10 primary industrial
// sectors with hover micro-interactions, spring animations, and gradient
// accent bars. Links to sector-specific directory pages.
// ============================================================================

"use client";

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

const SECTORS = [
  {
    id: '1',
    name: 'Agriculture & Equipment',
    count: '1,420 Verified Sellers',
    slug: 'agriculture',
    gradient: 'from-emerald-500 to-teal-700',
    icon: '🌾',
    description: 'Irrigation systems, pumps, seeds & farm machinery',
  },
  {
    id: '2',
    name: 'Apparel & Fashion',
    count: '890 Mills Active',
    slug: 'apparel-fashion',
    gradient: 'from-blue-500 to-indigo-700',
    icon: '🧵',
    description: 'Denim fabrics, cotton yarn, khadi & textiles',
  },
  {
    id: '3',
    name: 'Automobile & EV Kits',
    count: '640 Component Units',
    slug: 'automobile-ev',
    gradient: 'from-amber-500 to-orange-700',
    icon: '⚙️',
    description: 'Fasteners, BLDC motor controllers & brake assemblies',
  },
  {
    id: '4',
    name: 'Ayurvedic & Herbal',
    count: '1,110 Registered Labs',
    slug: 'ayurvedic-herbal',
    gradient: 'from-lime-500 to-green-700',
    icon: '🌿',
    description: 'Ashwagandha extracts, organic honey & herbal cosmetics',
  },
  {
    id: '5',
    name: 'Chemicals & Polymers',
    count: '430 Extraction Plants',
    slug: 'chemicals-polymers',
    gradient: 'from-purple-500 to-pink-700',
    icon: '🧪',
    description: 'HDPE granules, phthalic anhydride & industrial pigments',
  },
  {
    id: '6',
    name: 'IT Hardware & Networks',
    count: '520 OEM Partners',
    slug: 'it-hardware',
    gradient: 'from-sky-500 to-blue-700',
    icon: '🖥️',
    description: 'Network switches, industrial routers & peripherals',
  },
  {
    id: '7',
    name: 'Electronics & Electrical',
    count: '750 Industrial Units',
    slug: 'electronics-electrical',
    gradient: 'from-cyan-500 to-blue-700',
    icon: '⚡',
    description: 'Armored cables, switchgears & VFD drives',
  },
  {
    id: '8',
    name: 'Food & Beverages',
    count: '960 Exporters',
    slug: 'food-beverage',
    gradient: 'from-red-500 to-rose-700',
    icon: '🥜',
    description: 'Premium cashews, turmeric & basmati rice',
  },
  {
    id: '9',
    name: 'Medical & Surgical',
    count: '380 Healthcare Units',
    slug: 'medical-surgical',
    gradient: 'from-teal-500 to-emerald-700',
    icon: '🏥',
    description: 'Digital X-ray systems, surgical kits & PPE',
  },
  {
    id: '10',
    name: 'Industrial CNC & Machinery',
    count: '290 Manufacturing Plants',
    slug: 'industrial-cnc',
    gradient: 'from-slate-500 to-zinc-700',
    icon: '🏭',
    description: 'CNC turning centres, high-shear mixers & extractors',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 100, damping: 15 },
  },
};

export default function AnimatedCategoryGrid() {
  return (
    <section id="sectors" className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-surface-elevated">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-50 text-brand-700 text-sm font-semibold mb-4"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
            38 Sectors & Growing
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight"
          >
            India&apos;s Dynamic B2B{' '}
            <span className="gradient-text">Trade Sectors</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto"
          >
            Direct secure pipeline connections to audited corporate manufacturers,
            logistics assets, and automated escrow clearances.
          </motion.p>
        </div>

        {/* Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5"
        >
          {SECTORS.map((sector) => (
            <motion.div key={sector.id} variants={cardVariants}>
              <Link href={`/directory/${sector.slug}`} className="block h-full">
                <motion.div
                  whileHover={{
                    scale: 1.03,
                    y: -6,
                    boxShadow: '0 25px 50px rgba(0,0,0,0.08)',
                  }}
                  whileTap={{ scale: 0.97 }}
                  className="relative overflow-hidden p-6 rounded-2xl bg-white border border-border-subtle cursor-pointer group shadow-sm h-full flex flex-col transition-shadow duration-300"
                >
                  {/* Gradient Accent Bar */}
                  <div
                    className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${sector.gradient} opacity-80 group-hover:opacity-100 transition-opacity`}
                  />

                  {/* Icon */}
                  <div className="text-3xl mb-3">{sector.icon}</div>

                  {/* Content */}
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-foreground group-hover:text-brand-700 transition-colors duration-200 leading-tight">
                      {sector.name}
                    </h3>
                    <p className="mt-1.5 text-xs text-gray-400 leading-relaxed">
                      {sector.description}
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs font-semibold text-brand-600 flex items-center gap-1 group-hover:underline">
                      Browse
                      <span className="transform group-hover:translate-x-1 transition-transform duration-200">
                        →
                      </span>
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">
                      {sector.count}
                    </span>
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* View All Link */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Link
            href="/directory"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-50 text-brand-700 font-semibold hover:bg-brand-100 transition-colors"
          >
            View All 38 Sectors
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
