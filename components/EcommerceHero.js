"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SearchAutocomplete from '@/components/SearchAutocomplete';

const FALLBACK_BANNERS = [
  {
    id: '1',
    title: "India's Premier Cross-Industry B2B Network",
    subtitle: 'Source directly from 10,000+ verified manufacturers',
    badge_text: 'Verified Wholesale Network',
    hero_image_url: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=1600&q=80',
    cta_text: 'Explore 38+ Wholesale Sectors',
    cta_link: '/directory',
  },
  {
    id: '2',
    title: 'Scale Your Business with Trade Assurance',
    subtitle: 'Secure payments, escrow protection, and guaranteed delivery',
    badge_text: '100% Escrow Protection',
    hero_image_url: 'https://images.unsplash.com/photo-1586528116311-ad8ed7c663be?w=1600&q=80',
    cta_text: 'View Live Mandi Rates',
    cta_link: '/market-rates',
  },
  {
    id: '3',
    title: 'Wholesale Sourcing Made Seamless',
    subtitle: 'From industrial machinery to premium agriculture',
    badge_text: 'Direct Factory Pricing',
    hero_image_url: 'https://images.unsplash.com/photo-1565043589221-1a6fd9ae45c7?w=1600&q=80',
    cta_text: 'Post Requirement RFQ',
    cta_link: '/#rfq-form',
  },
];

export default function EcommerceHero() {
  const [banners, setBanners] = useState(FALLBACK_BANNERS);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [heroQuery, setHeroQuery] = useState('');

  const handleHeroSearch = (e, customQuery) => {
    if (e?.preventDefault) e.preventDefault();
    const query = (typeof customQuery === 'string' ? customQuery : heroQuery).trim();
    if (!query) return;

    try {
      fetch('/api/search/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      }).catch(() => {});
    } catch (err) {}

    window.location.href = `/directory?q=${encodeURIComponent(query)}`;
  };

  // Fetch dynamic banners from CMS API
  useEffect(() => {
    async function loadDynamicBanners() {
      try {
        const res = await fetch('/api/banners');
        if (res.ok) {
          const data = await res.json();
          if (data.banners && data.banners.length > 0) {
            setBanners(data.banners);
          }
        }
      } catch (e) {
        // use fallback
      }
    }
    loadDynamicBanners();
  }, []);

  // Preload all banner images immediately so they appear with zero lag on website load
  useEffect(() => {
    if (banners && banners.length > 0 && typeof window !== 'undefined') {
      banners.forEach(b => {
        const url = b.hero_image_url || b.image;
        if (url) {
          const img = new window.Image();
          img.src = url;
        }
      });
    }
  }, [banners]);

  useEffect(() => {
    if (!banners.length) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  // Swipe sensitivity threshold in px
  const minSwipeDistance = 50;

  const handlePrevSlide = () => {
    if (!banners.length) return;
    setCurrentSlide((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  };

  const handleNextSlide = () => {
    if (!banners.length) return;
    setCurrentSlide((prev) => (prev + 1) % banners.length);
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
      // Swiped left -> Next slide
      handleNextSlide();
    } else if (isRightSwipe) {
      // Swiped right -> Slide back
      handlePrevSlide();
    }
  };

  const activeBanner = banners[currentSlide] || FALLBACK_BANNERS[0];
  const bgImage = activeBanner.hero_image_url || activeBanner.image || FALLBACK_BANNERS[0].hero_image_url;

  return (
    <section 
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className="relative w-full h-[85vh] min-h-[600px] overflow-hidden bg-gray-900 flex items-center justify-center pt-16 select-none"
    >
      {/* Background Slider */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={activeBanner.id || currentSlide}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <img
              src={bgImage}
              alt={activeBanner.title || 'Wholesale Banner'}
              className="w-full h-full object-cover"
              loading="eager"
              fetchPriority="high"
              decoding="async"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = FALLBACK_BANNERS[0].hero_image_url;
              }}
            />
          </motion.div>
        </AnimatePresence>

        {/* Advanced Gradient Overlays for high readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900/80 via-gray-900/60 to-gray-900/95 mix-blend-multiply" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-brand-900/40 via-transparent to-transparent" />
      </div>

      {/* Slide Back & Forward Navigation Controls for Phones & Desktops */}
      {banners.length > 1 && (
        <>
          <button
            onClick={handlePrevSlide}
            type="button"
            aria-label="Slide back to previous banner"
            suppressHydrationWarning
            className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/25 active:bg-white/40 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-20 shadow-xl cursor-pointer"
            title="Slide Back"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={handleNextSlide}
            type="button"
            aria-label="Slide forward to next banner"
            suppressHydrationWarning
            className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/25 active:bg-white/40 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-20 shadow-xl cursor-pointer"
            title="Slide Forward"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Hero Content */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 flex flex-col items-center text-center mt-[-5vh]">
        <motion.div
          key={`text-${activeBanner.id || currentSlide}`}
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          <span className="inline-block px-5 py-2 mb-6 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/90 text-xs font-bold uppercase tracking-[0.2em] shadow-2xl">
            {activeBanner.badge_text || activeBanner.subtitle || '100% Escrow Protected'}
          </span>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-6 leading-[1.1] drop-shadow-2xl">
            {activeBanner.title}
          </h1>

          {activeBanner.subtitle && (
            <p className="text-sm sm:text-base text-slate-200/90 max-w-2xl mx-auto mb-8 font-medium">
              {activeBanner.subtitle}
            </p>
          )}
        </motion.div>

        {/* Massive Glassmorphism Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="w-full max-w-3xl relative mt-2 z-40"
        >
          <form onSubmit={handleHeroSearch} suppressHydrationWarning className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-brand-500 to-emerald-600 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
            <div className="relative flex items-center bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-2 shadow-2xl">
              <svg className="w-6 h-6 text-white/60 ml-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <SearchAutocomplete
                searchQuery={heroQuery}
                setSearchQuery={setHeroQuery}
                onSearch={(q) => handleHeroSearch(null, q)}
                placeholder="Search wholesale commodities, verified suppliers, or APMC mandis (e.g. Turmeric)..."
                theme="dark"
                inputClassName="w-full bg-transparent border-none text-white placeholder-white/60 focus:outline-none focus:ring-0 text-sm sm:text-base font-medium px-2 py-2"
              />
              <button
                type="submit"
                suppressHydrationWarning
                className="px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold shadow-lg shadow-brand-500/30 transition-all flex items-center gap-2 cursor-pointer flex-shrink-0"
              >
                <span>Search</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>

      {/* Slide Indicators */}
      <div className="absolute bottom-6 flex items-center gap-2 z-20">
        {banners.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            suppressHydrationWarning
            className={`h-2 rounded-full transition-all cursor-pointer ${
              currentSlide === idx ? 'w-8 bg-brand-500' : 'w-2 bg-white/40 hover:bg-white/70'
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
