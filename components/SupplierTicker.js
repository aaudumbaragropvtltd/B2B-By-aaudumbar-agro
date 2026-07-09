// ============================================================================
// SUPPLIER TICKER
// ============================================================================
// Auto-scrolling marquee-style ticker showing active verified supplier names.
// Pauses on hover for readability. Uses CSS animation for performance.
// ============================================================================

"use client";

import React from 'react';
import { motion } from 'framer-motion';

const TICKER_SUPPLIERS = [
  { name: 'Jain Irrigation Systems', location: 'Jalgaon, MH', sector: 'Agriculture' },
  { name: 'Arvind Mills Ltd', location: 'Ahmedabad, GJ', sector: 'Apparel' },
  { name: 'Sundram Fasteners', location: 'Chennai, TN', sector: 'Automobile' },
  { name: 'Dabur Industrial', location: 'Ghaziabad, UP', sector: 'Ayurvedic' },
  { name: 'Reliance Polymers', location: 'Hazira, GJ', sector: 'Chemicals' },
  { name: 'HCL Infosystems', location: 'Noida, UP', sector: 'IT Hardware' },
  { name: 'Polycab India', location: 'Daman, DD', sector: 'Electrical' },
  { name: 'Milan Dry Fruits', location: 'Delhi', sector: 'F&B' },
  { name: 'Trivitron Healthcare', location: 'Chennai, TN', sector: 'Medical' },
  { name: 'Ace Micromatic', location: 'Bengaluru, KA', sector: 'CNC Machinery' },
  { name: 'Bharat Forge', location: 'Pune, MH', sector: 'Forging' },
  { name: 'Pidilite Industries', location: 'Mumbai, MH', sector: 'Adhesives' },
  { name: 'Havells India', location: 'Noida, UP', sector: 'Electrical' },
  { name: 'Amul GCMMF', location: 'Anand, GJ', sector: 'Dairy' },
];

function TickerItem({ supplier }) {
  return (
    <div className="flex-shrink-0 flex items-center gap-3 px-5 py-2.5 mx-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-default">
      <span className="w-2 h-2 rounded-full bg-success-500 flex-shrink-0" />
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
  // Double the items for seamless infinite scroll
  const doubledSuppliers = [...TICKER_SUPPLIERS, ...TICKER_SUPPLIERS];

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
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success-500" />
          </span>
          <span className="text-xs font-bold text-white/50 uppercase tracking-[0.2em]">
            Active Verified Suppliers
          </span>
        </div>
        <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent" />
      </div>

      <div className="relative overflow-hidden">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-brand-950 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-brand-950 to-transparent z-10 pointer-events-none" />

        {/* Scrolling track */}
        <div className="ticker-track">
          {doubledSuppliers.map((supplier, index) => (
            <TickerItem key={`${supplier.name}-${index}`} supplier={supplier} />
          ))}
        </div>
      </div>
    </motion.section>
  );
}
