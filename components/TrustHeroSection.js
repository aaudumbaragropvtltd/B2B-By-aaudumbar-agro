// ============================================================================
// TRUST HERO SECTION
// ============================================================================
// Animated hero section with:
// - Gradient animated background
// - Animated trust metric counters (suppliers, orders, cities)
// - Live blockchain-style transaction feed
// - Premium CTA buttons
// ============================================================================

"use client";

import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

// ── Animated Counter Component ──
function AnimatedCounter({ target, label, suffix = '' }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (val) => Math.floor(val).toLocaleString('en-IN'));
  const [displayValue, setDisplayValue] = useState('0');

  useEffect(() => {
    const controls = animate(count, target, {
      duration: 2.5,
      ease: 'easeOut',
    });
    const unsubscribe = rounded.on('change', (v) => setDisplayValue(v));
    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [target, count, rounded]);

  return (
    <div className="text-center">
      <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">
        {displayValue}{suffix}
      </div>
      <div className="mt-2 text-sm sm:text-base text-white/60 font-medium tracking-wide">
        {label}
      </div>
    </div>
  );
}

// ── Live Transaction Feed ──
const MOCK_TRANSACTIONS = [
  { id: 1, buyer: 'Tata Motors Procurement', supplier: 'Sundram Fasteners', item: 'HT Fasteners M10 (25 Tons)', value: '₹36,25,000', time: '2 min ago' },
  { id: 2, buyer: 'Hindustan Unilever', supplier: 'Dabur Industrial', item: 'Ashwagandha Extract (500 kg)', value: '₹21,00,000', time: '8 min ago' },
  { id: 3, buyer: 'Godrej Properties', supplier: 'Polycab India', item: 'Armoured Cable 240sqmm (2km)', value: '₹96,00,000', time: '14 min ago' },
  { id: 4, buyer: 'ITC Foods Division', supplier: 'Milan Spices', item: 'Cashew W240 (10 Tons)', value: '₹92,00,000', time: '22 min ago' },
  { id: 5, buyer: 'Mahindra & Mahindra', supplier: 'Ace Micromatic', item: 'CNC Turning Centre (3 Units)', value: '₹1,35,00,000', time: '31 min ago' },
];

function TransactionFeed() {
  const [visibleIndex, setVisibleIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleIndex((prev) => (prev + 1) % MOCK_TRANSACTIONS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const tx = MOCK_TRANSACTIONS[visibleIndex];

  return (
    <motion.div
      key={tx.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="glass rounded-2xl p-4 sm:p-5 max-w-xl mx-auto"
    >
      <div className="flex items-center gap-3 mb-3">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
        </span>
        <span className="text-xs font-semibold text-green-400 uppercase tracking-widest">
          Live Settlement
        </span>
        <span className="text-xs text-white/40 ml-auto">{tx.time}</span>
      </div>
      <div className="space-y-1">
        <p className="text-sm text-white/80">
          <span className="font-semibold text-white">{tx.buyer}</span>
          {' '}← {tx.supplier}
        </p>
        <p className="text-xs text-white/50">{tx.item}</p>
        <p className="text-lg font-bold text-accent-400">{tx.value}</p>
      </div>
    </motion.div>
  );
}

export default function TrustHeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center animated-gradient overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px'
        }} />
        {/* Radial glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-brand-500/20 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-accent-500/15 blur-[100px]" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-28 pb-12">
        {/* Trust Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm text-white/80 mb-8"
        >
          <span className="w-2 h-2 rounded-full bg-success-500 pulse-dot" />
          <span className="font-medium">India&apos;s Most Trusted Cross-Industry B2B Platform</span>
          <span className="text-accent-400 font-bold">· LIVE</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-white leading-[1.1] tracking-tight"
        >
          Source, Verify &{' '}
          <span className="relative">
            <span className="bg-gradient-to-r from-accent-400 to-accent-500 bg-clip-text text-transparent">
              Settle
            </span>
          </span>
          <br />
          Across 38 Industries
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-6 text-lg sm:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed"
        >
          Automated escrow clearing, AI-driven pricing recovery, and direct pipeline 
          connections to verified Indian manufacturers — all in one enterprise platform.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
        >
          <a
            href="/directory"
            className="group px-8 py-4 rounded-2xl bg-white text-brand-900 font-bold text-base shadow-2xl shadow-white/10 hover:shadow-white/20 transition-all duration-300 hover:scale-[1.02] active:scale-95"
          >
            Explore Trade Directory
            <span className="inline-block ml-2 transform group-hover:translate-x-1 transition-transform">→</span>
          </a>
          <a
            href="/login"
            className="group px-8 py-4 rounded-2xl glass text-white font-semibold text-base hover:bg-white/10 transition-all duration-300 active:scale-95"
          >
            Register as Supplier
            <span className="inline-block ml-2 transform group-hover:translate-x-1 transition-transform">→</span>
          </a>
        </motion.div>

        {/* Trust Counters */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4 }}
          className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12"
        >
          <AnimatedCounter target={12400} label="Verified Suppliers" suffix="+" />
          <AnimatedCounter target={38} label="Industry Sectors" />
          <AnimatedCounter target={287} label="Cities Connected" suffix="+" />
          <AnimatedCounter target={4250} label="Monthly Settlements" suffix="+" />
        </motion.div>

        {/* Live Transaction Feed */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="mt-12"
        >
          <TransactionFeed />
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-1.5"
        >
          <motion.div className="w-1.5 h-3 rounded-full bg-white/60" />
        </motion.div>
      </motion.div>
    </section>
  );
}
