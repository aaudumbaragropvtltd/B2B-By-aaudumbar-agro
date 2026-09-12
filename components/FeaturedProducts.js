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
  const category = getCategoryById(product.category);
  const fallbackImg = 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&q=80';
  const imageSrc = (product.image && typeof product.image === 'string' && product.image.trim() !== '') 
    ? product.image 
    : (product.hero_image_url || fallbackImg);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.03, duration: 0.4 }}
    >
      <Link href={getProductUrl(product)}>
        <motion.div
          whileHover={{ y: -6 }}
          whileTap={{ scale: 0.98 }}
          className="bg-white rounded-3xl border border-gray-100 overflow-hidden cursor-pointer group h-full shadow-sm transition-all duration-500 hover-lift card-glow relative"
        >
          {/* Image Area */}
          <div className="relative h-48 sm:h-56 bg-gray-50 overflow-hidden rounded-t-3xl">
            <img
              src={imageSrc}
              alt={product.name || 'B2B Product'}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
              loading="lazy"
            />
            {/* Badge */}
            {product.badge && (
              <div className={`absolute top-3 left-3 px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-widest shadow-lg ${BADGE_STYLES[product.badge]} badgePulse`}>
                {product.badge}
              </div>
            )}
            {/* Quick View Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
              <span className="px-5 py-2 rounded-xl bg-white/95 text-xs font-bold text-gray-900 backdrop-blur-md shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                View Details →
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-5 relative z-10 bg-white">
            <h4 className="text-sm font-bold text-gray-900 leading-tight line-clamp-2 group-hover:text-brand-600 transition-colors min-h-[2.5rem]">
              {product.name}
            </h4>

            {/* Price Row */}
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-lg sm:text-xl font-extrabold text-gray-900">
                {formatPrice(product.price)}
              </span>
              <span className="text-[11px] text-gray-400 font-medium">
                / {product.unit}
              </span>
            </div>

            {/* MOQ */}
            <div className="mt-1 text-[11px] text-gray-500 font-medium">
              MOQ: {product.moq}
            </div>

            {/* Supplier Info */}
            <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-2">
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0 shadow-[0_0_4px_rgba(34,197,94,0.5)]" />
                <span className="text-[11px] text-gray-600 font-medium truncate">
                  {product.supplierName || 'Verified Supplier'}
                </span>
              </div>
              <span className="flex-shrink-0 px-1.5 py-0.5 rounded bg-emerald-50 text-[9px] font-bold text-emerald-700 uppercase">
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
