// ============================================================================
// CATEGORY SHOWCASE — IndiaMART/Alibaba-Style Category Product Sections
// ============================================================================
// Shows 4 top categories with product cards inside each.
// Each category section is a horizontal scrollable row of products.
// ============================================================================

"use client";

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { PRODUCTS, formatPrice } from '@/data/products';
import { getProductUrl } from '@/utils/slugUtils';

function ProductMiniCard({ product }) {
  const fallbackImg = 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&q=80';
  const imageSrc = (product.image && typeof product.image === 'string' && product.image.trim() !== '') 
    ? product.image 
    : (product.hero_image_url || fallbackImg);

  return (
    <Link href={getProductUrl(product)} className="flex-shrink-0 w-40 sm:w-48 mx-2">
      <motion.div
        whileHover={{ y: -4 }}
        className="bg-white rounded-xl border border-gray-100 overflow-hidden group cursor-pointer hover:shadow-md transition-all duration-300 h-full flex flex-col"
      >
        {/* Image */}
        <div className="h-28 sm:h-32 bg-gray-50 overflow-hidden relative">
          <img
            src={imageSrc}
            alt={product.name || 'B2B Product'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        </div>
        {/* Content */}
        <div className="p-2.5 flex-1 flex flex-col">
          <h4 className="text-[11px] font-semibold text-gray-800 leading-tight line-clamp-2 group-hover:text-brand-600 transition-colors">
            {product.name}
          </h4>
          <div className="mt-auto pt-2 flex items-baseline gap-1">
            <span className="text-sm font-extrabold text-gray-900">
              {formatPrice(product.price)}
            </span>
            <span className="text-[9px] text-gray-400">/{product.unit}</span>
          </div>
          <div className="mt-1 text-[9px] text-gray-400 font-medium">
            MOQ: {product.moq}
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

export default function CategoryShowcase({ initialProducts = [] }) {
  // Use DB products if provided, otherwise fallback to static
  const allProducts = initialProducts.length > 0 ? initialProducts : PRODUCTS.slice(0, 20);
  const doubled = [...allProducts, ...allProducts];

  return (
    <section className="py-12 lg:py-16 bg-gray-50/50 overflow-hidden">
      <div className="mb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight"
        >
          Shop by <span className="gradient-text">Categories</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-1 text-sm text-gray-500"
        >
          Browse all products in a continuous slideshow
        </motion.p>
      </div>

      <div className="relative mt-8">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-gray-50/50 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-gray-50/50 to-transparent z-10 pointer-events-none" />

        <div className="carousel-track">
          {doubled.map((product, i) => (
            <ProductMiniCard key={`${product.id}-${i}`} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
