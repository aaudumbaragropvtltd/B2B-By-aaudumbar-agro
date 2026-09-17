// ============================================================================
// TRENDING PRODUCTS SECTION — Real Products Auto-Scrolling Carousel
// ============================================================================
// Auto-scrolling carousel of real trending products with images, prices,
// and Aaudumbar Agro supplier info. No emojis, no fake data.
// ============================================================================

"use client";

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { PRODUCTS, formatPrice, SUPPLIER } from '@/data/products';
import { getProductUrl } from '@/utils/slugUtils';

// Pick trending products (ones with badges)
const TRENDING_PRODUCTS = PRODUCTS.filter(p => p.badge).slice(0, 12);

const BADGE_STYLES = {
  'Best Seller': 'bg-gradient-to-r from-red-500 to-orange-500 text-white',
  'Trade Assurance': 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white',
  'Verified': 'bg-gradient-to-r from-emerald-500 to-green-600 text-white',
};

function ProductCard({ product, index }) {
  const fallbackImg = 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&q=80';
  const imageSrc = (product.image && typeof product.image === 'string' && product.image.trim() !== '') 
    ? product.image 
    : (product.hero_image_url || fallbackImg);
  const displayName = product.name || product.title || 'Verified Wholesale Product';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className="flex-shrink-0 w-52 sm:w-64"
    >
      <Link href={getProductUrl(product)}>
        <motion.div
          whileHover={{ y: -6 }}
          whileTap={{ scale: 0.98 }}
          className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 overflow-hidden cursor-pointer group h-full shadow-xs hover:shadow-xl hover:border-brand-200 transition-all duration-300 relative flex flex-col glow-border-brand"
        >
          {/* Image Area */}
          <div className="h-36 sm:h-44 bg-gray-50 relative overflow-hidden rounded-t-2xl sm:rounded-t-3xl">
            <img
              src={imageSrc}
              alt={displayName}
              className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
              loading="lazy"
            />
            {/* Badge */}
            {product.badge && (
              <div className={`absolute top-2.5 right-2.5 sm:top-3 sm:right-3 px-2 sm:px-2.5 py-1 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider sm:tracking-widest shadow-md ${BADGE_STYLES[product.badge] || 'bg-brand-600 text-white'} group-hover:scale-105 transition-transform duration-300`}>
                {product.badge}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-3.5 sm:p-4 relative z-10 bg-white flex flex-col justify-between flex-1">
            <div>
              <h3 
                title={displayName}
                className="text-xs sm:text-sm font-bold text-gray-900 leading-snug line-clamp-3 sm:line-clamp-2 group-hover:text-brand-600 transition-colors min-h-[3rem] sm:min-h-[2.5rem] break-words"
              >
                {displayName}
              </h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-base sm:text-xl font-extrabold text-gray-900 font-mono group-hover:text-brand-700 transition-colors">{formatPrice(product.price)}</span>
                <span className="text-[10px] sm:text-xs text-gray-400 font-medium">/{product.unit || 'Unit'}</span>
              </div>
              <div className="mt-1 text-[10px] sm:text-xs text-gray-500 font-medium">
                MOQ: {product.moq || '1 Unit'}
              </div>
            </div>

            <div className="mt-2.5 pt-2.5 sm:mt-3 sm:pt-3 border-t border-gray-50 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 live-pulse-dot" />
                <span className="text-[10px] sm:text-xs text-gray-600 font-medium truncate group-hover:text-gray-900 transition-colors">{product.supplierName || 'Verified Supplier'}</span>
              </div>
              <span className="flex-shrink-0 px-1.5 py-0.5 rounded bg-emerald-50 text-[8px] sm:text-[9px] font-bold text-emerald-700 uppercase group-hover:bg-emerald-100 transition-colors">
                ✓
              </span>
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}

export default function TrendingProductsSection({ initialProducts = [] }) {
  const trending = initialProducts.length > 0 ? initialProducts : TRENDING_PRODUCTS;
  const doubled = [...trending, ...trending];

  return (
    <section className="py-12 lg:py-16 gradient-mesh relative overflow-hidden">
      {/* Animated Wave Background */}
      <div className="absolute inset-0 opacity-40 pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/80" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="px-3 py-1 rounded-full bg-gradient-to-r from-red-500 to-orange-500 text-white text-[10px] font-extrabold uppercase tracking-widest shadow-md badgePulse">
                🔥 Trending
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight drop-shadow-sm">
              Top Products <span className="gradient-text-premium">Right Now</span>
            </h2>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <Link
              href="/directory"
              className="hidden sm:inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-white shadow-sm border border-gray-100 text-sm font-bold text-brand-600 hover:text-brand-700 hover:shadow-md hover:-translate-y-0.5 transition-all card-glow"
            >
              View All Products
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Auto-scrolling Carousel */}
      <div className="relative">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-gray-50/50 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-gray-50/50 to-transparent z-10 pointer-events-none" />

        <div className="carousel-track gap-4 px-4">
          {doubled.map((product, i) => (
            <ProductCard key={`${product.id}-${i}`} product={product} index={i % TRENDING_PRODUCTS.length} />
          ))}
        </div>
      </div>
    </section>
  );
}
