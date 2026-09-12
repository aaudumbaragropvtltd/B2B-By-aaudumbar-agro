// ============================================================================
// RFQ BANNER SECTION (Alibaba-Style)
// ============================================================================
// Full-width animated call-to-action banner for submitting RFQs.
// Features gradient mesh background, step indicators, and pulse animation.
// ============================================================================

"use client";

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

const STEPS = [
  { step: '1', label: 'Submit Requirements', icon: '📋' },
  { step: '2', label: 'Get Multiple Quotes', icon: '📩' },
  { step: '3', label: 'Compare & Select', icon: '🏆' },
];

export default function RFQBannerSection() {
  return (
    <section className="py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl"
        >
          {/* Background */}
          <div className="absolute inset-0 animated-gradient-premium" />
          
          {/* Decorative Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white/5 blur-[80px] animate-morph-blob" />
            <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-accent-500/10 blur-[60px] animate-float-slow" />
            {/* Grid pattern */}
            <div className="absolute inset-0 opacity-[0.03]" style={{
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px'
            }} />
          </div>

          {/* Content */}
          <div className="relative z-10 px-6 sm:px-10 lg:px-16 py-12 lg:py-16 text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-v2 text-sm text-white/80 mb-6"
            >
              <span className="w-2 h-2 rounded-full bg-accent-400 animate-pulse" />
              <span className="font-medium">Get Quotes from Verified Suppliers</span>
            </motion.div>

            {/* Headline */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight tracking-tight"
            >
              One Request, Multiple
              <br />
              <span className="bg-gradient-to-r from-accent-400 to-yellow-300 bg-clip-text text-transparent">
                Competitive Quotes
              </span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="mt-4 text-base sm:text-lg text-white/60 max-w-xl mx-auto"
            >
              Tell us what you need. We&apos;ll match your requirements with verified suppliers across India and get you the best competitive pricing.
            </motion.p>

            {/* Steps */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 mt-10 mb-10"
            >
              {STEPS.map((step, i) => (
                <React.Fragment key={step.step}>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl glass-v2 flex items-center justify-center text-xl">
                      {step.icon}
                    </div>
                    <div className="text-left">
                      <div className="text-xs text-white/40 uppercase tracking-wider font-medium">Step {step.step}</div>
                      <div className="text-sm font-bold text-white">{step.label}</div>
                    </div>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="hidden sm:block w-8 h-px bg-white/20" />
                  )}
                </React.Fragment>
              ))}
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link
                href="/login"
                className="group px-8 py-4 rounded-2xl bg-white text-brand-900 font-bold text-base shadow-2xl shadow-white/10 hover:shadow-white/20 transition-all duration-300 hover:scale-[1.02] active:scale-95 btn-premium"
              >
                Submit Your RFQ for Free
                <span className="inline-block ml-2 transform group-hover:translate-x-1 transition-transform">→</span>
              </Link>
              <Link
                href="/directory"
                className="group px-8 py-4 rounded-2xl glass-v2 text-white font-semibold text-base hover:bg-white/10 transition-all duration-300 active:scale-95"
              >
                Browse Products Instead
                <span className="inline-block ml-2 transform group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
