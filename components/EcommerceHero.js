"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SearchAutocomplete from '@/components/SearchAutocomplete';

export function optimizeBannerUrl(url, width = 1000, height = null) {
  if (!url || typeof url !== 'string') return url;
  if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
    // High-compression WebP for mobile and tablet to resolve Lighthouse image delivery audit
    const format = width <= 1080 ? 'f_webp' : 'f_auto';
    const qualityParam = width <= 640 ? 'q_45' : (width <= 1080 ? 'q_50' : 'q_auto:eco');
    const sizeParam = height ? `c_fill,g_auto,w_${width},h_${height}` : `w_${width}`;
    if (url.includes('/upload/f_auto') || url.includes('/upload/f_webp') || url.includes('/upload/c_fill')) {
      return url.replace(/\/upload\/(?:f_auto|f_webp|c_fill)(?:,[^,/]+)*?\//, `/upload/${sizeParam},${format},${qualityParam}/`);
    }
    return url.replace('/upload/', `/upload/${sizeParam},${format},${qualityParam}/`);
  }
  return url;
}

// Official Admin Panel CMS Banners (Strictly synchronized with data/platform_banners.json)
const FALLBACK_BANNERS = [
  {
    id: "banner-1",
    title: "India’s Verified B2B Wholesale Marketplace",
    subtitle: "Direct ex-factory bulk procurement with 10% Advance Escrow Protection, dock inspections, and automated GST billing.",
    badge_text: "10% Advance Escrow",
    hero_image_url: "https://res.cloudinary.com/pjsh8sfp/image/upload/f_auto,q_auto,w_1000/v1789108422/b2b-bharat/banners/1789108417666_ChatGPT_Image_Sep_11__2026__12.jpg",
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
    hero_image_url: "https://res.cloudinary.com/pjsh8sfp/image/upload/f_auto,q_auto,w_1000/v1789108587/b2b-bharat/banners/1789108583730_ChatGPT_Image_Sep_11__2026__12.jpg",
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
    hero_image_url: "https://res.cloudinary.com/pjsh8sfp/image/upload/f_auto,q_auto,w_1000/v1789108718/b2b-bharat/banners/1789108715249_ChatGPT_Image_Sep_11__2026__12.jpg",
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
  const [isPaused, setIsPaused] = useState(false);

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

  // Synchronize with live active banners to reflect admin pause/unpause immediately
  useEffect(() => {
    async function loadDynamicBanners() {
      try {
        const res = await fetch(`/api/banners?t=${Date.now()}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.banners) && data.banners.length > 0) {
            setBanners(data.banners);
          }
        }
      } catch (e) {
        // use fallback
      }
    }
    loadDynamicBanners();
  }, []);

  // Advance slides after comfortable interval; pauses on hover or user interaction
  useEffect(() => {
    if (!banners.length || banners.length <= 1 || isPaused) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [banners.length, isPaused]);

  const touchStartRef = useRef(null);
  const touchEndRef = useRef(null);

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
    touchEndRef.current = null;
    touchStartRef.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e) => {
    touchEndRef.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (!touchStartRef.current || !touchEndRef.current) return;
    const distance = touchStartRef.current - touchEndRef.current;
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
  const rawBgImage = activeBanner.hero_image_url || activeBanner.image || FALLBACK_BANNERS[0].hero_image_url;
  const bgImageMobile = optimizeBannerUrl(rawBgImage, 540, 720);
  const bgImageTablet = optimizeBannerUrl(rawBgImage, 960, 640);
  const bgImageDesktop = optimizeBannerUrl(rawBgImage, 1280, 640);

  return (
    <section
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative w-full h-[76vh] min-h-[500px] sm:min-h-[580px] md:h-[82vh] overflow-hidden bg-slate-950 flex items-center justify-center pt-16 sm:pt-20 pb-8 sm:pb-12 select-none"
    >
      {/* Background Slider */}
      <div className="absolute inset-0 z-0">
        {currentSlide === 0 ? (
          <div className="absolute inset-0">
            <picture className="absolute inset-0 w-full h-full">
              <source media="(max-width: 640px)" srcSet={bgImageMobile} width={540} height={720} />
              <source media="(max-width: 1024px)" srcSet={bgImageTablet} width={960} height={640} />
              <img
                src={bgImageDesktop}
                alt={activeBanner.title || 'Wholesale Banner'}
                width={1280}
                height={640}
                className="absolute inset-0 w-full h-full object-cover object-center"
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
                loading="eager"
                fetchPriority="high"
                decoding="sync"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = FALLBACK_BANNERS[0].hero_image_url;
                }}
              />
            </picture>
          </div>
        ) : (
          <AnimatePresence initial={false} mode="wait">
            <motion.div
              key={activeBanner.id || currentSlide}
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="absolute inset-0"
            >
              <picture className="absolute inset-0 w-full h-full">
                <source media="(max-width: 640px)" srcSet={bgImageMobile} width={540} height={720} />
                <source media="(max-width: 1024px)" srcSet={bgImageTablet} width={960} height={640} />
                <img
                  src={bgImageDesktop}
                  alt={activeBanner.title || 'Wholesale Banner'}
                  width={1280}
                  height={640}
                  className="absolute inset-0 w-full h-full object-cover object-center"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = FALLBACK_BANNERS[0].hero_image_url;
                  }}
                />
              </picture>
            </motion.div>
          </AnimatePresence>
        )}

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
        {currentSlide === 0 ? (
          <div className="w-full flex flex-col items-center">
            <span className="inline-block px-3 sm:px-4 py-1 sm:py-1.5 mb-2.5 sm:mb-4 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-emerald-300 text-[10px] sm:text-xs font-black uppercase tracking-widest shadow-md">
              {activeBanner.badge_text || '10% Advance Escrow'}
            </span>

            <h1 className="text-2xl sm:text-4xl md:text-6xl font-black text-white tracking-tight mb-2.5 sm:mb-4 leading-[1.2] drop-shadow-xl max-w-3xl">
              {activeBanner.title}
            </h1>

            {activeBanner.subtitle && (
              <p className="text-xs sm:text-sm md:text-base text-slate-100/90 max-w-xl mx-auto mb-4 sm:mb-6 font-medium line-clamp-2 sm:line-clamp-none drop-shadow">
                {activeBanner.subtitle}
              </p>
            )}
          </div>
        ) : (
          <motion.div
            key={`text-${activeBanner.id || currentSlide}`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full flex flex-col items-center"
          >
            <span className="inline-block px-3 sm:px-4 py-1 sm:py-1.5 mb-2.5 sm:mb-4 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-emerald-300 text-[10px] sm:text-xs font-black uppercase tracking-widest shadow-md">
              {activeBanner.badge_text || '10% Advance Escrow'}
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
        )}

        {/* Glassmorphism Search Bar with Instant Paint */}
        <div className="w-full max-w-2xl relative z-50">
          <form onSubmit={handleHeroSearch} suppressHydrationWarning className="relative z-50 group">
            <div className="absolute -inset-1 bg-gradient-to-r from-brand-500 via-emerald-400 to-amber-400 rounded-3xl blur-md opacity-30 group-hover:opacity-75 group-focus-within:opacity-85 transition-opacity duration-700 halo-glow" />
            <div className="relative z-50 flex items-center bg-slate-900/70 sm:bg-white/15 backdrop-blur-xl border border-white/30 rounded-2xl p-1.5 sm:p-2 shadow-2xl transition-all duration-300 group-focus-within:border-white/60">
              <svg className="w-5 h-5 text-white/70 ml-2.5 sm:ml-3 mr-1.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <SearchAutocomplete
                searchQuery={heroQuery}
                setSearchQuery={setHeroQuery}
                onSearch={(q) => handleHeroSearch(null, q)}
                placeholder="Search commodities, suppliers, APMC mandis..."
                theme="dark"
                inputClassName="w-full bg-transparent border-none text-white placeholder-white/70 focus:outline-none focus:ring-0 text-xs sm:text-base font-medium px-2 py-1.5 sm:py-2"
              />
              <button
                type="submit"
                suppressHydrationWarning
                className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-brand-600 via-brand-500 to-brand-600 hover:from-brand-500 hover:to-brand-400 text-white rounded-xl font-bold text-xs sm:text-sm shadow-lg shadow-brand-500/30 transition-all flex items-center gap-1.5 cursor-pointer flex-shrink-0 btn-shine hover:scale-105 active:scale-95"
              >
                <span>Search</span>
                <svg className="w-3.5 h-3.5 hidden sm:inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </form>

          {/* Floating Live Marketplace Chips — Elevated behind z-50 and gracefully faded during search */}
          <div
            className={`mt-4 relative z-10 flex flex-wrap items-center justify-center gap-2 text-[10px] sm:text-xs font-semibold transition-all duration-200 ${
              (heroQuery && heroQuery.trim().length > 0) ? 'opacity-0 pointer-events-none -translate-y-2' : 'opacity-100'
            }`}
          >
            <a
              href="/dashboard/rfqs"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white transition-all hover:scale-105 hover:border-amber-400/50 shadow-sm animate-float-slow"
            >
              <span className="w-2 h-2 rounded-full bg-amber-400 radar-beacon flex-shrink-0" />
              <span>1,480+ Live RFQs</span>
            </a>

            <a
              href="/market-rates"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-emerald-300 transition-all hover:scale-105 hover:border-emerald-400/50 shadow-sm animate-float-delayed"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 radar-beacon flex-shrink-0" />
              <span>Live APMC Mandi Rates</span>
            </a>

            <span className="hidden md:inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-slate-200 animate-float-slow">
              <span>🛡️ 10% Advance Escrow</span>
            </span>

            <a
              href="/directory"
              className="hidden sm:inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-slate-200 hover:text-white transition-all hover:scale-105 shadow-sm"
            >
              <span>🏭 38+ Sectors</span>
              <span className="text-[10px]">→</span>
            </a>
          </div>
        </div>
      </div>

      {/* Slide Indicators with Accessible Touch Targets & Composited Pill State */}
      <div className="absolute bottom-3 sm:bottom-6 flex items-center gap-1 sm:gap-2 z-20">
        <button
          onClick={handlePrevSlide}
          type="button"
          aria-label="Previous slide"
          suppressHydrationWarning
          className="sm:hidden w-10 h-10 rounded-full bg-white/15 text-white flex items-center justify-center text-sm backdrop-blur-md border border-white/20 cursor-pointer active:scale-90"
        >
          ‹
        </button>

        <div className="flex items-center">
          {banners.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentSlide(idx)}
              suppressHydrationWarning
              className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-white rounded-full"
              aria-label={`Go to slide ${idx + 1}`}
            >
              <span
                className={`h-2 rounded-full transition-all duration-300 pointer-events-none ${
                  currentSlide === idx
                    ? 'w-7 sm:w-8 bg-brand-500 shadow-sm'
                    : 'w-2 bg-white/50 group-hover:bg-white/80'
                }`}
              />
            </button>
          ))}
        </div>

        <button
          onClick={handleNextSlide}
          type="button"
          aria-label="Next slide"
          suppressHydrationWarning
          className="sm:hidden w-10 h-10 rounded-full bg-white/15 text-white flex items-center justify-center text-sm backdrop-blur-md border border-white/20 cursor-pointer active:scale-90"
        >
          ›
        </button>
      </div>
    </section>
  );
}
