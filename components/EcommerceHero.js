"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SearchAutocomplete from '@/components/SearchAutocomplete';

// Official Admin Panel CMS Banners (Strictly synchronized with data/platform_banners.json)
const FALLBACK_BANNERS = [
  {
    id: "banner-1",
    title: "India’s Verified B2B Wholesale Marketplace",
    subtitle: "Direct ex-factory bulk procurement with 100% Escrow Price Protection, dock inspections, and automated GST billing.",
    badge_text: "100% Escrow Protected",
    hero_image_url: "https://res.cloudinary.com/pjsh8sfp/image/upload/v1789108422/b2b-bharat/banners/1789108417666_ChatGPT_Image_Sep_11__2026__12.jpg",
    cta_text: "Explore 38+ Wholesale Sectors",
    cta_link: "/directory",
    sector_slug: "all",
    display_order: 1,
    is_active: true,
  },
  {
    id: "banner-2",
    title: "APMC Mandi Direct Agro & Spice Sourcing",
    subtitle: "Connect directly with certified agricultural aggregators in Nashik, Erode, Unjha, and Guntur with daily live mandi rates.",
    badge_text: "Live Mandi Intelligence",
    hero_image_url: "https://res.cloudinary.com/pjsh8sfp/image/upload/v1789108587/b2b-bharat/banners/1789108583730_ChatGPT_Image_Sep_11__2026__12.jpg",
    cta_text: "View Live Mandi Rates",
    cta_link: "/market-rates",
    sector_slug: "food-agriculture",
    display_order: 2,
    is_active: true,
  },
  {
    id: "banner-3",
    title: "Heavy Industrial & Raw Materials Exchange",
    subtitle: "Bulk TMT steel, polymers, textile fabrics, and chemicals with verified factory lab certificates and dock logistics.",
    badge_text: "Verified Industrial Hub",
    hero_image_url: "https://res.cloudinary.com/pjsh8sfp/image/upload/v1789108718/b2b-bharat/banners/1789108715249_ChatGPT_Image_Sep_11__2026__12.jpg",
    cta_text: "Post Enterprise RFQ",
    cta_link: "/#rfq-form",
    sector_slug: "metals-mining",
    display_order: 3,
    is_active: true,
  },
];

export default function EcommerceHero({ initialBanners = [] }) {
  const [banners, setBanners] = useState(
    initialBanners && initialBanners.length > 0 ? initialBanners : FALLBACK_BANNERS
  );
  const [currentSlide, setCurrentSlide] = useState(0);
  const [heroQuery, setHeroQuery] = useState('');

  // Sync with initialBanners if provided
  useEffect(() => {
    if (initialBanners && initialBanners.length > 0) {
      setBanners(initialBanners);
    }
  }, [initialBanners]);

  const handleHeroSearch = (e, customQuery) => {
    if (e?.preventDefault) e.preventDefault();
    const query = (typeof customQuery === 'string' ? customQuery : heroQuery).trim();
    if (!query) return;

    try {
      fetch('/api/search/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      }).catch(() => { });
    } catch (err) { }

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
      className="relative w-full h-[76vh] min-h-[500px] sm:min-h-[580px] md:h-[82vh] overflow-hidden bg-slate-950 flex items-center justify-center pt-16 sm:pt-20 pb-8 sm:pb-12 select-none"
    >
      {/* Background Slider */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={activeBanner.id || currentSlide}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.1, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <img
              src={bgImage}
              alt={activeBanner.title || 'Wholesale Banner'}
              className="absolute inset-0 w-full h-full object-cover object-center"
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
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

        {/* Balanced cinematic scrim: image remains vivid from top to bottom */}
        <div className="absolute inset-0 bg-slate-950/45" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-slate-950/50" />
      </div>

      {/* Desktop Floating Navigation Arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={handlePrevSlide}
            type="button"
            aria-label="Slide back to previous banner"
            suppressHydrationWarning
            className="hidden sm:flex absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/25 active:bg-white/40 text-white backdrop-blur-md border border-white/20 items-center justify-center transition-all hover:scale-110 active:scale-95 z-20 shadow-xl cursor-pointer"
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
            className="hidden sm:flex absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/25 active:bg-white/40 text-white backdrop-blur-md border border-white/20 items-center justify-center transition-all hover:scale-110 active:scale-95 z-20 shadow-xl cursor-pointer"
            title="Slide Forward"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Hero Content - Perfectly Balanced & Centered Over The Image */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 flex flex-col items-center text-center my-auto">
        <motion.div
          key={`text-${activeBanner.id || currentSlide}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="w-full flex flex-col items-center"
        >
          <span className="inline-block px-3 sm:px-4 py-1 sm:py-1.5 mb-2.5 sm:mb-4 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-emerald-300 text-[10px] sm:text-xs font-black uppercase tracking-widest shadow-md">
            {activeBanner.badge_text || '100% Escrow Protected'}
          </span>

          <h1 className="text-2xl sm:text-4xl md:text-6xl font-black text-white tracking-tight mb-2.5 sm:mb-4 leading-[1.2] drop-shadow-xl max-w-3xl">
            {activeBanner.title}
          </h1>

          {activeBanner.subtitle && (
            <p className="text-xs sm:text-sm md:text-base text-slate-100/90 max-w-xl mx-auto mb-4 sm:mb-6 font-medium line-clamp-2 sm:line-clamp-none drop-shadow">
              {activeBanner.subtitle}
            </p>
          )}
        </motion.div>

        {/* Glassmorphism Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="w-full max-w-2xl relative z-40"
        >
          <form onSubmit={handleHeroSearch} suppressHydrationWarning className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-brand-500 via-emerald-500 to-brand-600 rounded-3xl blur opacity-25 group-hover:opacity-45 transition duration-700" />
            <div className="relative flex items-center bg-slate-900/60 sm:bg-white/15 backdrop-blur-xl border border-white/25 rounded-2xl p-1.5 sm:p-2 shadow-2xl">
              <svg className="w-5 h-5 text-white/60 ml-2.5 sm:ml-3 mr-1.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <SearchAutocomplete
                searchQuery={heroQuery}
                setSearchQuery={setHeroQuery}
                onSearch={(q) => handleHeroSearch(null, q)}
                placeholder="Search commodities, suppliers, APMC mandis..."
                theme="dark"
                inputClassName="w-full bg-transparent border-none text-white placeholder-white/60 focus:outline-none focus:ring-0 text-xs sm:text-base font-medium px-2 py-1.5 sm:py-2"
              />
              <button
                type="submit"
                suppressHydrationWarning
                className="px-4 sm:px-6 py-2 sm:py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold text-xs sm:text-sm shadow-lg shadow-brand-500/30 transition-all flex items-center gap-1.5 cursor-pointer flex-shrink-0"
              >
                <span>Search</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>

      {/* Slide Indicators with Mobile Nav Touch Controls */}
      <div className="absolute bottom-3 sm:bottom-6 flex items-center gap-2.5 z-20">
        <button
          onClick={handlePrevSlide}
          type="button"
          aria-label="Previous slide"
          suppressHydrationWarning
          className="sm:hidden w-6 h-6 rounded-full bg-white/15 text-white flex items-center justify-center text-xs backdrop-blur-md border border-white/20 cursor-pointer active:scale-90"
        >
          ‹
        </button>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {banners.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              suppressHydrationWarning
              className={`h-1.5 sm:h-2 rounded-full transition-all cursor-pointer ${
                currentSlide === idx ? 'w-6 sm:w-8 bg-brand-500' : 'w-1.5 sm:w-2 bg-white/40 hover:bg-white/70'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

        <button
          onClick={handleNextSlide}
          type="button"
          aria-label="Next slide"
          suppressHydrationWarning
          className="sm:hidden w-6 h-6 rounded-full bg-white/15 text-white flex items-center justify-center text-xs backdrop-blur-md border border-white/20 cursor-pointer active:scale-90"
        >
          ›
        </button>
      </div>
    </section>
  );
}
