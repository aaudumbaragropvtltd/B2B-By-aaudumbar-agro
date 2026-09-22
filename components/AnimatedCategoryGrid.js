// ============================================================================
// ANIMATED CATEGORY GRID — Optimized for High PageSpeed & Mobile Compositor
// ============================================================================
// Zero-JS overhead CSS grid showing 38 categories from the product catalog.
// Pure GPU transitions, zero forced reflows, and responsive mobile expansion.
// ============================================================================

"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { CATEGORIES, getProductsByCategory } from '@/data/products';

export default function AnimatedCategoryGrid({ categoryCounts = null }) {
  const [showAllMobile, setShowAllMobile] = useState(false);

  return (
    <section id="sectors" className="py-14 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-10 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight">
            Browse All <span className="gradient-text">Categories</span>
          </h2>

          <p className="mt-2.5 text-xs sm:text-sm md:text-base text-gray-500 max-w-xl mx-auto font-medium">
            Explore verified wholesale products and manufacturers across 38 industry categories
          </p>
        </div>

        {/* Grid — Pure GPU-composited CSS layout without JS animation overhead */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {CATEGORIES.map((cat, idx) => {
            const productCount = categoryCounts ? (categoryCounts[cat.id] || 0) : getProductsByCategory(cat.id).length;
            const isHiddenOnMobile = !showAllMobile && idx >= 12;

            return (
              <div
                key={cat.id}
                className={isHiddenOnMobile ? 'hidden sm:block' : 'block'}
              >
                <Link
                  href={`/directory/${cat.id}`}
                  className="relative overflow-hidden p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-gray-100 cursor-pointer group shadow-xs h-full flex flex-col transition-all duration-200 hover:border-brand-300 hover:shadow-lg hover:-translate-y-1 active:scale-[0.98]"
                >
                  {/* Gradient Accent Bar */}
                  <div
                    className={`absolute top-0 left-0 w-full h-1 sm:h-1.5 bg-gradient-to-r ${cat.color} opacity-70 group-hover:opacity-100 group-hover:h-2 transition-all duration-200`}
                  />

                  {/* Icon */}
                  <div className="text-2xl sm:text-3xl mb-2 group-hover:scale-115 transition-transform duration-200 origin-left">
                    {cat.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <h3 className="text-xs sm:text-sm font-bold text-gray-800 group-hover:text-brand-600 transition-colors duration-150 leading-tight">
                      {cat.name}
                    </h3>
                  </div>

                  {/* Footer */}
                  <div className="mt-2 sm:mt-3 flex items-center justify-between">
                    <span className="text-[10px] sm:text-xs font-semibold text-brand-600 flex items-center gap-1 group-hover:underline">
                      Browse
                      <span className="transform group-hover:translate-x-1 transition-transform duration-150">
                        →
                      </span>
                    </span>
                    {productCount > 0 && (
                      <span className="text-[9px] sm:text-[10px] text-gray-500 font-medium hidden sm:inline">
                        {productCount} products
                      </span>
                    )}
                  </div>
                </Link>
              </div>
            );
          })}
        </div>

        {/* Mobile Expand Toggle to save DOM size on initial load */}
        {!showAllMobile && (
          <div className="mt-6 text-center sm:hidden">
            <button
              onClick={() => setShowAllMobile(true)}
              className="px-5 py-2.5 rounded-xl bg-brand-50 border border-brand-200 text-brand-700 font-bold text-xs shadow-xs hover:bg-brand-100 transition-colors flex items-center gap-1.5 mx-auto"
            >
              <span>View All 38 Categories</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
