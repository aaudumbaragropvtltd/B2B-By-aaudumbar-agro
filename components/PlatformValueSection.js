// ============================================================================
// PLATFORM VALUE PROPOSITION SECTION
// ============================================================================
// Showcases the core differentiators of B2B Bharat with animated cards.
// ============================================================================

"use client";

import React from 'react';
import { motion } from 'framer-motion';

const VALUE_PROPS = [
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: 'GST-Verified Suppliers',
    description: 'Every supplier undergoes mandatory GST verification, PAN validation, and warehouse address confirmation before listing activation.',
    stat: '100%',
    statLabel: 'Verified',
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    title: 'Escrow-Protected Trades',
    description: '10% advance locks the price. Final 90% is cleared via QR at the loading dock. Full capital protection for both buyer and supplier.',
    stat: '₹0',
    statLabel: 'Risk Exposure',
    gradient: 'from-blue-500 to-indigo-600',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: 'AI Pricing Resilience',
    description: 'Every 7 days, our AI Pricing Agent validates supplier rates. Stale listings auto-fallback to verified spot-rates from active suppliers.',
    stat: '7-Day',
    statLabel: 'Auto-Refresh',
    gradient: 'from-amber-500 to-orange-600',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
    title: 'Cross-Industry Rerouting',
    description: 'If a supplier drops post-advance, the AI Contract Agent instantly re-routes to equivalent active suppliers, keeping your pipeline alive.',
    stat: '< 30s',
    statLabel: 'Re-route Time',
    gradient: 'from-purple-500 to-pink-600',
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  show: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, type: 'spring', stiffness: 80, damping: 15 },
  }),
};

export default function PlatformValueSection() {
  return (
    <section className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-500/10 text-accent-600 text-sm font-semibold mb-4"
          >
            Why B2B Bharat
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight"
          >
            Built for <span className="gradient-text">Enterprise Trust</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto"
          >
            Every feature is designed to eliminate risk, ensure transparency,
            and keep your procurement pipeline resilient.
          </motion.p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {VALUE_PROPS.map((prop, i) => (
            <motion.div
              key={prop.title}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              whileHover={{ y: -4, boxShadow: '0 20px 40px rgba(0,0,0,0.06)' }}
              className="relative overflow-hidden rounded-2xl bg-white border border-border-subtle p-8 group"
            >
              {/* Background gradient on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${prop.gradient} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500`} />

              <div className="relative z-10 flex flex-col sm:flex-row gap-6">
                {/* Icon */}
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${prop.gradient} text-white flex items-center justify-center flex-shrink-0 shadow-lg`}>
                  {prop.icon}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-foreground mb-2">{prop.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{prop.description}</p>
                </div>

                {/* Stat Badge */}
                <div className="flex-shrink-0 text-right">
                  <div className={`text-2xl font-extrabold bg-gradient-to-r ${prop.gradient} bg-clip-text text-transparent`}>
                    {prop.stat}
                  </div>
                  <div className="text-xs text-gray-400 font-medium">{prop.statLabel}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
