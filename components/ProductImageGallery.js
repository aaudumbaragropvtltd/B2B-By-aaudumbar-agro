"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProductImageGallery({
  images = [],
  heroImage = '',
  category = 'Industrial Product',
  title = 'Product Image',
  qualityGrade = null,
  isStale = false,
}) {
  // Consolidate images array (up to 5 max)
  const rawList = Array.isArray(images) && images.length > 0
    ? images
    : (heroImage ? [heroImage] : []);

  // Filter valid string URLs and limit to 5
  const validImages = rawList
    .filter(img => typeof img === 'string' && img.trim().length > 0)
    .slice(0, 5);

  // If completely empty, use fallback
  const allImages = validImages.length > 0
    ? validImages
    : ['https://images.unsplash.com/photo-1592982537447-6f2a6a0c8b39?w=1200'];

  const [activeIndex, setActiveIndex] = useState(0);
  const [brokenMap, setBrokenMap] = useState({});

  const currentImage = allImages[activeIndex] || allImages[0];
  const isCurrentBroken = brokenMap[currentImage];

  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const minSwipeDistance = 45;

  const handlePrev = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setActiveIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  const handleNext = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setActiveIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrev();
    }
  };

  const thematicStyles = {
    SPICES: "from-amber-600 to-orange-700 text-amber-100",
    TEXTILES: "from-blue-600 to-indigo-700 text-indigo-100",
    MINERALS: "from-slate-600 to-zinc-800 text-zinc-300",
    GRAINS: "from-yellow-500 to-amber-700 text-yellow-100",
    AGRICULTURE: "from-green-600 to-emerald-700 text-emerald-100",
    ELECTRONICS: "from-cyan-600 to-blue-700 text-blue-100",
    AUTOMOBILE: "from-red-600 to-rose-700 text-rose-100",
    APPAREL: "from-pink-500 to-fuchsia-700 text-fuchsia-100",
    FOOD: "from-orange-500 to-red-600 text-orange-100",
    MEDICAL: "from-teal-500 to-cyan-700 text-cyan-100",
    INDUSTRIAL: "from-gray-600 to-slate-800 text-slate-300",
    CHEMICAL: "from-purple-600 to-violet-800 text-violet-200",
    DEFAULT: "from-gray-800 to-slate-900 text-slate-400"
  };

  const resolveTheme = (cat) => {
    if (!cat) return thematicStyles.DEFAULT;
    const upper = cat.toUpperCase();
    for (const key of Object.keys(thematicStyles)) {
      if (key !== 'DEFAULT' && upper.includes(key)) return thematicStyles[key];
    }
    return thematicStyles.DEFAULT;
  };

  const currentTheme = resolveTheme(category);

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* ── Main Stage Image Viewer ── */}
      <div 
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className="relative w-full h-80 sm:h-96 lg:h-[420px] rounded-2xl overflow-hidden bg-slate-900 border border-gray-200 shadow-sm group select-none cursor-grab active:cursor-grabbing"
      >
        <AnimatePresence mode="wait">
          {isCurrentBroken ? (
            <motion.div
              key="broken"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`w-full h-full bg-gradient-to-br ${currentTheme} flex flex-col items-center justify-center p-6 text-center relative`}
            >
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:20px_20px]" />
              <span className="text-xs font-mono tracking-widest uppercase opacity-70 mb-2 relative z-10">B2B India Verified</span>
              <span className="text-xl font-bold tracking-wide max-w-md relative z-10">{title || category}</span>
            </motion.div>
          ) : (
            <motion.img
              key={currentImage}
              src={currentImage}
              alt={`${title} - View ${activeIndex + 1}`}
              initial={{ opacity: 0.7 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0.7 }}
              transition={{ duration: 0.25 }}
              className="w-full h-full object-cover select-none"
              onError={() => setBrokenMap(prev => ({ ...prev, [currentImage]: true }))}
            />
          )}
        </AnimatePresence>

        {/* Quality / Status Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
          {qualityGrade && (
            <div className="px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md text-gray-900 text-xs font-bold shadow-md border border-gray-100 flex items-center gap-1.5">
              <span className="text-emerald-600">✓</span> {qualityGrade} Grade
            </div>
          )}
        </div>

        {isStale && (
          <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-amber-500 text-white text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 shadow-md z-10">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Price Updating
          </div>
        )}

        {/* Navigation Arrows (if > 1 image) */}
        {allImages.length > 1 && (
          <>
            <button
              suppressHydrationWarning
              onClick={handlePrev}
              type="button"
              aria-label="Previous image"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-sm flex items-center justify-center opacity-80 hover:opacity-100 transition-all hover:scale-105 z-10"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              suppressHydrationWarning
              onClick={handleNext}
              type="button"
              aria-label="Next image"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-sm flex items-center justify-center opacity-80 hover:opacity-100 transition-all hover:scale-105 z-10"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Image Counter Badge */}
        {allImages.length > 1 && (
          <div className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-semibold tracking-wider z-10 flex items-center gap-1.5">
            <span>📷</span>
            <span>{activeIndex + 1} / {allImages.length}</span>
          </div>
        )}
      </div>

      {/* ── Thumbnails Strip (Up to 5 Photos) ── */}
      {allImages.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto py-1 px-0.5 no-scrollbar">
          {allImages.map((imgUrl, idx) => {
            const isActive = idx === activeIndex;
            return (
              <button
                suppressHydrationWarning
                key={idx}
                type="button"
                onClick={() => setActiveIndex(idx)}
                onMouseEnter={() => setActiveIndex(idx)}
                className={`relative flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                  isActive
                    ? 'border-brand-600 ring-2 ring-brand-500/30 scale-105 shadow-md'
                    : 'border-gray-200 hover:border-brand-300 opacity-70 hover:opacity-100'
                }`}
              >
                <img
                  src={imgUrl}
                  alt={`${title} thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {idx === 0 && (
                  <span className="absolute bottom-0 inset-x-0 bg-brand-600/90 text-white text-[9px] font-bold uppercase py-0.5 text-center leading-tight">
                    Cover
                  </span>
                )}
                {idx > 0 && isActive && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-brand-500 shadow-sm" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
