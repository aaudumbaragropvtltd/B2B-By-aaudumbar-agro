"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Highlights matching prefix or substring in the given text
 */
function HighlightedText({ text, query }) {
  if (!text || !query) return <span>{text}</span>;
  const q = query.trim().toLowerCase();
  const lowerText = text.toLowerCase();
  const index = lowerText.indexOf(q);

  if (index === -1) {
    return <span>{text}</span>;
  }

  const before = text.substring(0, index);
  const match = text.substring(index, index + q.length);
  const after = text.substring(index + q.length);

  return (
    <span>
      {before}
      <span className="font-extrabold text-brand-600 bg-brand-50 px-1 py-0.5 rounded border border-brand-200/70 shadow-sm">
        {match}
      </span>
      {after}
    </span>
  );
}

export default function SearchAutocomplete({
  searchQuery,
  setSearchQuery,
  selectedCategory = '',
  setSelectedCategory = null,
  onSearch,
  placeholder = "Search products or suppliers...",
  theme = "light", // "light" or "dark" (for hero)
  isMobile = false,
  inputClassName = "",
  containerClassName = ""
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState({ keywords: [], products: [], categories: [] });
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const cacheRef = useRef({});
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Fetch suggestions with debouncing
  useEffect(() => {
    const trimmed = (searchQuery || '').trim();
    if (!trimmed || trimmed.length < 1) {
      setSuggestions({ keywords: [], products: [], categories: [] });
      setIsOpen(false);
      setSelectedIndex(-1);
      return;
    }

    const cacheKey = trimmed.toLowerCase();
    if (cacheRef.current[cacheKey]) {
      setSuggestions(cacheRef.current[cacheKey]);
      setIsOpen(true);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const data = await res.json();
          cacheRef.current[cacheKey] = data;
          setSuggestions(data);
          setIsOpen(true);
        }
      } catch (err) {
        console.warn('Autocomplete fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const allItems = [
    ...(suggestions.keywords || []).map(k => ({ type: 'keyword', ...k })),
    ...(suggestions.products || []).map(p => ({ type: 'product', ...p })),
    ...(suggestions.categories || []).map(c => ({ type: 'category', ...c }))
  ];

  const handleSelectKeyword = (keywordText) => {
    setSearchQuery(keywordText);
    setIsOpen(false);
    setSelectedIndex(-1);
    if (onSearch) {
      onSearch(keywordText);
    } else {
      router.push(`/directory?q=${encodeURIComponent(keywordText)}`);
    }
  };

  const handleSelectProduct = (product) => {
    setIsOpen(false);
    setSelectedIndex(-1);
    if (product.url) {
      router.push(product.url);
    } else {
      router.push(`/directory/product/${product.id}`);
    }
  };

  const handleSelectCategory = (category) => {
    setIsOpen(false);
    setSelectedIndex(-1);
    if (setSelectedCategory) {
      setSelectedCategory(category.slug);
    }
    router.push(category.url || `/directory?sector=${category.slug}`);
  };

  const handleKeyDown = (e) => {
    if (!isOpen || allItems.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < allItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : allItems.length - 1));
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && selectedIndex < allItems.length) {
        e.preventDefault();
        const item = allItems[selectedIndex];
        if (item.type === 'keyword') {
          handleSelectKeyword(item.text);
        } else if (item.type === 'product') {
          handleSelectProduct(item);
        } else if (item.type === 'category') {
          handleSelectCategory(item);
        }
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSelectedIndex(-1);
    }
  };

  const hasSuggestions = (
    (suggestions.keywords && suggestions.keywords.length > 0) ||
    (suggestions.products && suggestions.products.length > 0) ||
    (suggestions.categories && suggestions.categories.length > 0)
  );

  const isDark = theme === "dark";

  return (
    <div ref={containerRef} className={`relative flex-1 w-full ${containerClassName}`}>
      {/* Input container */}
      <div className="relative flex items-center w-full">
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (e.target.value.trim().length >= 1) {
              setIsOpen(true);
            }
          }}
          onFocus={() => {
            if ((searchQuery || '').trim().length >= 1 && hasSuggestions) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          suppressHydrationWarning
          autoComplete="off"
          spellCheck="false"
          className={
            inputClassName || (
              isDark
                ? "w-full bg-transparent border-none text-white placeholder-white/60 focus:outline-none focus:ring-0 text-sm sm:text-base font-medium px-3 py-2"
                : isMobile
                ? "w-full px-4 py-3 text-sm text-gray-900 bg-transparent outline-none font-medium placeholder:text-gray-400"
                : "flex-1 px-4 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 bg-transparent font-medium"
            )
          }
        />

        {/* Loading Spinner & Clear Button */}
        <div className="absolute right-3 flex items-center gap-1.5 z-10">
          {isLoading && (
            <svg className={`w-4 h-4 animate-spin ${isDark ? 'text-white/80' : 'text-brand-600'}`} viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          {!isLoading && searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setIsOpen(false);
                inputRef.current?.focus();
              }}
              className={`p-0.5 rounded-full transition-colors ${
                isDark ? 'text-white/60 hover:text-white hover:bg-white/10' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Suggestion Dropdown Popover */}
      {isOpen && hasSuggestions && (
        <div 
          className="absolute left-0 top-full mt-2 w-full min-w-[340px] sm:min-w-[480px] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-[9999] flex flex-col text-left transition-all animate-in fade-in zoom-in-95 duration-150"
          style={{ maxWidth: 'min(90vw, 680px)' }}
        >
          {/* Header */}
          <div className="px-4 py-2 bg-gradient-to-r from-brand-50/80 to-gray-50 border-b border-gray-100 flex items-center justify-between text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            <span className="flex items-center gap-1.5 text-brand-700">
              <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></span>
              Live Suggestions for "{searchQuery}"
            </span>
            <span className="text-gray-400 hidden sm:inline text-[10px]">Use ↑ ↓ arrows</span>
          </div>

          <div className="overflow-y-auto max-h-[380px] divide-y divide-gray-100 p-1.5">
            {/* 1. Keyword Suggestions */}
            {suggestions.keywords && suggestions.keywords.length > 0 && (
              <div className="py-1">
                <div className="px-3 py-1 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                  <span>🔍</span> Matching Keywords
                </div>
                {suggestions.keywords.map((item, idx) => {
                  const globalIdx = idx;
                  const isHighlighted = selectedIndex === globalIdx;
                  return (
                    <button
                      key={item.text + idx}
                      type="button"
                      onClick={() => handleSelectKeyword(item.text)}
                      onMouseEnter={() => setSelectedIndex(globalIdx)}
                      className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between gap-3 text-sm transition-all cursor-pointer ${
                        isHighlighted 
                          ? 'bg-brand-600 text-white font-semibold shadow-sm' 
                          : 'text-gray-800 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <svg className={`w-4 h-4 flex-shrink-0 ${isHighlighted ? 'text-white' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <span className="truncate">
                          {isHighlighted ? item.text : <HighlightedText text={item.text} query={searchQuery} />}
                        </span>
                      </div>
                      {item.category && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                          isHighlighted 
                            ? 'bg-white/20 text-white' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {item.category}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* 2. Direct Matching Products in Stock */}
            {suggestions.products && suggestions.products.length > 0 && (
              <div className="py-1">
                <div className="px-3 py-1 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                  <span>📦</span> Products in Stock
                </div>
                {suggestions.products.map((prod, idx) => {
                  const globalIdx = (suggestions.keywords?.length || 0) + idx;
                  const isHighlighted = selectedIndex === globalIdx;
                  return (
                    <div
                      key={prod.id || idx}
                      onClick={() => handleSelectProduct(prod)}
                      onMouseEnter={() => setSelectedIndex(globalIdx)}
                      className={`px-3 py-2 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all ${
                        isHighlighted
                          ? 'bg-brand-50 border border-brand-200/80 shadow-sm'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {prod.image ? (
                          <img
                            src={prod.image}
                            alt={prod.title}
                            className="w-10 h-10 rounded-lg object-cover border border-gray-200 flex-shrink-0"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0 text-gray-400 text-xs font-bold">
                            📦
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-900 truncate">
                            <HighlightedText text={prod.title} query={searchQuery} />
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-0.5">
                            <span className="font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                              {prod.price} / {prod.unit}
                            </span>
                            {prod.supplierCity && (
                              <span className="text-gray-400 truncate">· {prod.supplierCity}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <span className="text-[11px] font-bold text-brand-600 bg-brand-50 hover:bg-brand-100 px-2.5 py-1 rounded-lg border border-brand-200 flex-shrink-0 flex items-center gap-1">
                        View <span className="text-xs">→</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 3. Sectors / Categories */}
            {suggestions.categories && suggestions.categories.length > 0 && (
              <div className="py-1">
                <div className="px-3 py-1 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                  <span>🏷️</span> Wholesale Sectors
                </div>
                {suggestions.categories.map((sec, idx) => {
                  const globalIdx = (suggestions.keywords?.length || 0) + (suggestions.products?.length || 0) + idx;
                  const isHighlighted = selectedIndex === globalIdx;
                  return (
                    <button
                      key={sec.id || idx}
                      type="button"
                      onClick={() => handleSelectCategory(sec)}
                      onMouseEnter={() => setSelectedIndex(globalIdx)}
                      className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between text-xs font-bold transition-all cursor-pointer ${
                        isHighlighted 
                          ? 'bg-brand-600 text-white shadow-sm' 
                          : 'text-brand-700 hover:bg-brand-50'
                      }`}
                    >
                      <span className="flex items-center gap-2 truncate">
                        <span>📁</span> Browse {sec.name} Sector
                      </span>
                      <span className="text-[10px] uppercase font-bold tracking-wider">Explore →</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Action */}
          <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                if (onSearch) onSearch(searchQuery);
                else router.push(`/directory?q=${encodeURIComponent(searchQuery)}`);
              }}
              className="text-brand-700 font-bold hover:underline flex items-center gap-1 truncate cursor-pointer"
            >
              <span>See all results for "<strong>{searchQuery}</strong>"</span>
              <span>→</span>
            </button>
            <span className="text-[11px] text-gray-400 hidden sm:inline">Press Enter ↵</span>
          </div>
        </div>
      )}
    </div>
  );
}
