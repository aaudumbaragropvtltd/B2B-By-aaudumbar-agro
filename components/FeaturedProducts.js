// ============================================================================
// FEATURED PRODUCTS SECTION — Alibaba/IndiaMART-Style Product Grid
// ============================================================================
// Grid of featured products with real images, prices, MOQ, and supplier info.
// All products attributed to "Aaudumbar Agro".
// ============================================================================

"use client";

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { getFeaturedProducts, formatPrice, getCategoryById, SUPPLIER } from '@/data/products';
import { getProductUrl } from '@/utils/slugUtils';

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
      transition={{ delay: index * 0.03, duration: 0.4 }}
    >
      <Link href={getProductUrl(product)}>
        <motion.div
          whileHover={{ y: -4 }}
          whileTap={{ scale: 0.98 }}
          className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 overflow-hidden cursor-pointer group h-full shadow-xs hover:shadow-md transition-all duration-300 relative flex flex-col"
        >
          {/* Image Area */}
          <div className="relative h-36 sm:h-48 md:h-56 bg-gray-50 overflow-hidden rounded-t-2xl sm:rounded-t-3xl">
            <img
              src={imageSrc}
              alt={displayName}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              loading="lazy"
            />
            {/* Badge */}
            {product.badge && (
              <div className={`absolute top-2 left-2 sm:top-3 sm:left-3 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider sm:tracking-widest shadow-md ${BADGE_STYLES[product.badge] || 'bg-brand-600 text-white'}`}>
                {product.badge}
              </div>
            )}
            {/* Quick View Overlay (Desktop only) */}
            <div className="hidden sm:flex absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 items-end justify-center pb-4">
              <span className="px-5 py-2 rounded-xl bg-white/95 text-xs font-bold text-gray-900 backdrop-blur-md shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                View Details →
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-3 sm:p-5 relative z-10 bg-white flex flex-col justify-between flex-1">
            <div>
              <h3 
                title={displayName}
                className="text-xs sm:text-sm font-bold text-gray-900 leading-snug line-clamp-3 sm:line-clamp-2 group-hover:text-brand-600 transition-colors min-h-[3rem] sm:min-h-[2.5rem] break-words"
              >
                {displayName}
              </h3>

              {/* Price Row */}
              <div className="mt-2 flex items-baseline gap-1 sm:gap-1.5 flex-wrap">
                <span className="text-base sm:text-xl font-extrabold text-gray-900 font-mono">
                  {formatPrice(product.price)}
                </span>
                <span className="text-[10px] sm:text-[11px] text-gray-400 font-medium">
                  / {product.unit || 'Unit'}
                </span>
              </div>

              {/* MOQ */}
              <div className="mt-1 text-[10px] sm:text-[11px] text-gray-500 font-medium">
                MOQ: {product.moq || '1 Unit'}
              </div>
            </div>

            {/* Supplier Info */}
            <div className="mt-2.5 pt-2.5 sm:mt-3 sm:pt-3 border-t border-gray-50 flex items-center justify-between gap-1.5">
              <div className="flex items-center gap-1 sm:gap-1.5 flex-1 min-w-0">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500 flex-shrink-0" />
                <span className="text-[10px] sm:text-[11px] text-gray-600 font-medium truncate">
                  {product.supplierName || 'Verified Supplier'}
                </span>
              </div>
              <span className="flex-shrink-0 px-1.5 py-0.5 rounded bg-emerald-50 text-[8px] sm:text-[9px] font-bold text-emerald-700 uppercase">
                ✓ Verified
              </span>
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}

export default function FeaturedProducts({ initialProducts = [] }) {
  // Use real DB products if available, fallback to mock if none
  const products = initialProducts.length > 0 ? initialProducts : getFeaturedProducts(16);

  return (
    <section className="py-12 lg:py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Featured <span className="gradient-text">Products</span>
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Quality products from verified suppliers
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <Link
              href="/directory"
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-50 text-sm font-semibold text-brand-600 hover:bg-brand-100 transition-colors"
            >
              View All
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </motion.div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
          {products.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </div>

        {/* Mobile View All */}
        <div className="sm:hidden text-center mt-6">
          <Link
            href="/directory"
            className="inline-flex items-center gap-1.5 px-6 py-3 rounded-xl bg-brand-50 text-sm font-semibold text-brand-600"
          >
            View All Products →
          </Link>
        </div>
      </div>
    </section>
  );
}
