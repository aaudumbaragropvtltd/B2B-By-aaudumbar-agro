// ============================================================================
// ANIMATED CATEGORY GRID — Updated with Real IndiaMART Categories
// ============================================================================
// Beautiful animated grid showing all 38 categories from the product catalog.
// Links to sector-specific directory pages.
// ============================================================================

"use client";

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { CATEGORIES, getProductsByCategory } from '@/data/products';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 120, damping: 15 },
  },
};

export default function AnimatedCategoryGrid({ categoryCounts = null }) {
  return (
    <section id="sectors" className="py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight"
          >
            Browse All <span className="gradient-text">Categories</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-3 text-base text-gray-500 max-w-xl mx-auto"
          >
            Explore products across 38 industry categories
          </motion.p>
        </div>

        {/* Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4"
        >
          {CATEGORIES.map((cat) => {
            const productCount = categoryCounts ? (categoryCounts[cat.id] || 0) : getProductsByCategory(cat.id).length;
            return (
              <motion.div key={cat.id} variants={cardVariants}>
                <Link href={`/directory/${cat.id}`} className="block h-full">
                  <motion.div
                    whileHover={{
                      scale: 1.03,
                      y: -4,
                      boxShadow: '0 16px 32px rgba(0,0,0,0.06)',
                    }}
                    whileTap={{ scale: 0.97 }}
                    className="relative overflow-hidden p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-gray-100 cursor-pointer group shadow-sm h-full flex flex-col transition-all duration-300 hover:border-brand-200"
                  >
                    {/* Gradient Accent Bar */}
                    <div
                      className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${cat.color} opacity-60 group-hover:opacity-100 transition-opacity`}
                    />

                    {/* Icon */}
                    <div className="text-2xl sm:text-3xl mb-2 group-hover:scale-110 transition-transform duration-300">
                      {cat.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <h3 className="text-xs sm:text-sm font-bold text-gray-800 group-hover:text-brand-600 transition-colors duration-200 leading-tight">
                        {cat.name}
                      </h3>
                    </div>

                    {/* Footer */}
                    <div className="mt-2 sm:mt-3 flex items-center justify-between">
                      <span className="text-[10px] sm:text-xs font-semibold text-brand-600 flex items-center gap-1 group-hover:underline">
                        Browse
                        <span className="transform group-hover:translate-x-1 transition-transform duration-200">
                          →
                        </span>
                      </span>
                      {productCount > 0 && (
                        <span className="text-[9px] sm:text-[10px] text-gray-400 font-medium hidden sm:inline">
                          {productCount} products
                        </span>
                      )}
                    </div>
                  </motion.div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
