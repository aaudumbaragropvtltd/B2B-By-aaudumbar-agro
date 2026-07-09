// ============================================================================
// ESCROW FLOW SECTION
// ============================================================================
// Visual step-by-step explainer of the B2B Bharat escrow lifecycle:
// 1. Quotation → 2. 10% Advance → 3. Warehouse Loading → 4. QR Settlement
// ============================================================================

"use client";

import React from 'react';
import { motion } from 'framer-motion';

const ESCROW_STEPS = [
  {
    step: '01',
    title: 'Digital Quotation',
    description: 'Browse the directory, select products, and receive an instant digital quotation with logistics costs, GST computation, and total contract value.',
    icon: '📋',
    color: 'bg-blue-500',
  },
  {
    step: '02',
    title: '10% Price Lock',
    description: 'Commit a 10% non-refundable advance to lock the agreed price. The supplier confirms stock availability and estimated dispatch timeline.',
    icon: '🔒',
    color: 'bg-amber-500',
  },
  {
    step: '03',
    title: 'Warehouse Loading',
    description: 'Goods are prepared at the supplier warehouse. Real-time status updates via WhatsApp keep both parties informed through loading completion.',
    icon: '🏗️',
    color: 'bg-purple-500',
  },
  {
    step: '04',
    title: 'QR Dock Settlement',
    description: 'At the loading dock, scan the dynamic QR code to clear the final 90% balance. Funds split instantly — supplier payout, platform commission, and digital invoices generated.',
    icon: '✅',
    color: 'bg-emerald-500',
  },
];

export default function EscrowFlowSection() {
  return (
    <section className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-surface-elevated">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-sm font-semibold mb-4"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Escrow Protected
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight"
          >
            How <span className="gradient-text">Settlement</span> Works
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto"
          >
            From quotation to QR dock settlement — every rupee is tracked,
            protected, and disbursed automatically.
          </motion.p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connector Line (desktop) */}
          <div className="hidden lg:block absolute top-24 left-[calc(12.5%+20px)] right-[calc(12.5%+20px)] h-0.5 bg-gradient-to-r from-blue-200 via-purple-200 to-emerald-200" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4">
            {ESCROW_STEPS.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, type: 'spring', stiffness: 80 }}
                className="relative"
              >
                <div className="bg-white rounded-2xl border border-border-subtle p-6 h-full hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  {/* Step Number & Icon */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-xl ${step.color} text-white flex items-center justify-center text-lg font-bold shadow-lg`}>
                      {step.step}
                    </div>
                    <span className="text-2xl">{step.icon}</span>
                  </div>

                  {/* Content */}
                  <h3 className="text-lg font-bold text-foreground mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{step.description}</p>
                </div>

                {/* Arrow between steps (mobile/tablet) */}
                {i < ESCROW_STEPS.length - 1 && (
                  <div className="lg:hidden flex justify-center py-2 text-gray-300">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-14"
        >
          <p className="text-sm text-gray-400 mb-4">
            Supplier at fault? Our AI Contract Agent re-routes your order instantly.
          </p>
          <a
            href="/login"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-700 text-white font-semibold shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 transition-all duration-300 active:scale-95"
          >
            Start Your First Trade
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
