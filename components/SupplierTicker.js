// ============================================================================
// SUPPLIER TICKER v2 (PREMIUM)
// ============================================================================
// Dual-row auto-scrolling with company icon placeholders, verified badges,
// glow hover effects, and reverse-direction second row.
// ============================================================================

"use client";

import React from 'react';
import { motion } from 'framer-motion';

const TICKER_SUPPLIERS = [
  { name: 'Jain Irrigation Systems', location: 'Jalgaon, MH', sector: 'Agriculture', icon: '🌾' },
  { name: 'Arvind Mills Ltd', location: 'Ahmedabad, GJ', sector: 'Apparel', icon: '🧵' },
  { name: 'Sundram Fasteners', location: 'Chennai, TN', sector: 'Automobile', icon: '⚙️' },
  { name: 'Dabur Industrial', location: 'Ghaziabad, UP', sector: 'Ayurvedic', icon: '🌿' },
  { name: 'Reliance Polymers', location: 'Hazira, GJ', sector: 'Chemicals', icon: '🧪' },
  { name: 'HCL Infosystems', location: 'Noida, UP', sector: 'IT Hardware', icon: '🖥️' },
  { name: 'Polycab India', location: 'Daman, DD', sector: 'Electrical', icon: '⚡' },
  { name: 'Milan Dry Fruits', location: 'Delhi', sector: 'F&B', icon: '🥜' },
  { name: 'Trivitron Healthcare', location: 'Chennai, TN', sector: 'Medical', icon: '🏥' },
  { name: 'Ace Micromatic', location: 'Bengaluru, KA', sector: 'CNC Machinery', icon: '🏭' },
  { name: 'Bharat Forge', location: 'Pune, MH', sector: 'Forging', icon: '🔨' },
  { name: 'Pidilite Industries', location: 'Mumbai, MH', sector: 'Adhesives', icon: '🧴' },
  { name: 'Havells India', location: 'Noida, UP', sector: 'Electrical', icon: '💡' },
  { name: 'Amul GCMMF', location: 'Anand, GJ', sector: 'Dairy', icon: '🥛' },
];

const TICKER_SUPPLIERS_2 = [
  { name: 'Tata Steel', location: 'Jamshedpur, JH', sector: 'Metals', icon: '🔩' },
  { name: 'UPL Limited', location: 'Mumbai, MH', sector: 'Agrochemicals', icon: '🧫' },
  { name: 'Mahindra & Mahindra', location: 'Pune, MH', sector: 'Auto', icon: '🚗' },
  { name: 'Cipla Ltd', location: 'Mumbai, MH', sector: 'Pharma', icon: '💊' },
  { name: 'Adani Solar', location: 'Mundra, GJ', sector: 'Solar', icon: '☀️' },
  { name: 'Asian Paints', location: 'Mumbai, MH', sector: 'Paints', icon: '🎨' },
  { name: 'Godrej & Boyce', location: 'Mumbai, MH', sector: 'Industrial', icon: '🏗️' },
  { name: 'L&T InfoTech', location: 'Mumbai, MH', sector: 'IT Services', icon: '💻' },
  { name: 'ITC Limited', location: 'Kolkata, WB', sector: 'FMCG', icon: '📦' },
  { name: 'Berger Paints', location: 'Kolkata, WB', sector: 'Paints', icon: '🖌️' },
  { name: 'JSW Steel', location: 'Mumbai, MH', sector: 'Steel', icon: '🏗️' },
  { name: 'Hindalco Industries', location: 'Mumbai, MH', sector: 'Aluminium', icon: '🪙' },
];

function TickerItem({ supplier }) {
  return (
    <div className="flex-shrink-0 flex items-center gap-3 px-4 py-2.5 mx-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all cursor-default group">
      <span className="text-lg group-hover:scale-110 transition-transform">{supplier.icon}</span>
      <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0 shadow-[0_0_6px_rgba(34,197,94,0.6)]" />
      <span className="text-sm font-medium text-white whitespace-nowrap">
        {supplier.name}
      </span>
      <span className="text-xs text-white/40 whitespace-nowrap hidden sm:inline">
        {supplier.location}
      </span>
      <span className="px-2 py-0.5 rounded-md bg-white/10 text-[10px] font-semibold text-white/60 uppercase tracking-wider whitespace-nowrap">
        {supplier.sector}
      </span>
    </div>
  );
}

export default function SupplierTicker() {
  const doubledRow1 = [...TICKER_SUPPLIERS, ...TICKER_SUPPLIERS];
  const doubledRow2 = [...TICKER_SUPPLIERS_2, ...TICKER_SUPPLIERS_2];

  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="py-6 bg-brand-950 overflow-hidden border-y border-white/5"
    >
      <div className="flex items-center gap-4 px-4 mb-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
          </span>
          <span className="text-xs font-bold text-white/50 uppercase tracking-[0.2em]">
            Active Verified Suppliers
          </span>
        </div>
        <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent" />
        <span className="text-[10px] text-white/30 font-medium">12,400+ Registered</span>
      </div>

      {/* Row 1 — Left to Right */}
      <div className="relative overflow-hidden mb-3">
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-brand-950 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-brand-950 to-transparent z-10 pointer-events-none" />
        <div className="ticker-track">
          {doubledRow1.map((supplier, index) => (
            <TickerItem key={`r1-${supplier.name}-${index}`} supplier={supplier} />
          ))}
        </div>
      </div>

      {/* Row 2 — Right to Left (Reverse) */}
      <div className="relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-brand-950 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-brand-950 to-transparent z-10 pointer-events-none" />
        <div className="ticker-track-reverse">
          {doubledRow2.map((supplier, index) => (
            <TickerItem key={`r2-${supplier.name}-${index}`} supplier={supplier} />
          ))}
        </div>
      </div>
    </motion.section>
  );
}
