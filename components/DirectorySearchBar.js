"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import SearchAutocomplete from '@/components/SearchAutocomplete';
import { useAuth } from '@/hooks/useAuth';

export default function DirectorySearchBar({
  initialQuery = '',
  initialSector = '',
  sectors = []
}) {
  const router = useRouter();
  const { profile, user } = useAuth();
  const [query, setQuery] = useState(initialQuery);
  const [sector, setSector] = useState(initialSector);

  const handleSubmit = (e, customQuery) => {
    if (e?.preventDefault) e.preventDefault();
    const finalQuery = (typeof customQuery === 'string' ? customQuery : query).trim();
    
    // Log search activity
    try {
      fetch('/api/search/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: finalQuery,
          sectorSlug: sector || null,
          userId: profile?.id || null,
          email: profile?.registered_email || user?.email || null,
          phone: profile?.corporate_phone || profile?.phone_number || null,
        }),
      }).catch(() => {});
    } catch (err) {}

    const params = new URLSearchParams();
    if (finalQuery) params.append('q', finalQuery);
    if (sector) params.append('sector', sector);

    router.push(`/directory?${params.toString()}`);
  };

  return (
    <form 
      onSubmit={handleSubmit}
      className="bg-white p-3 sm:p-4 rounded-2xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-3 mb-8 relative z-30"
    >
      {/* Search Autocomplete Input */}
      <div className="flex-1 relative flex items-center bg-gray-50 rounded-xl border border-gray-200 focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-transparent transition-all">
        <svg className="w-5 h-5 text-gray-400 absolute left-3.5 pointer-events-none z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <div className="pl-8 w-full">
          <SearchAutocomplete
            searchQuery={query}
            setSearchQuery={setQuery}
            selectedCategory={sector}
            setSelectedCategory={setSector}
            onSearch={(q) => handleSubmit(null, q)}
            placeholder="Search products by name or commodity (e.g. Turmeric, Rubber Sheet)..."
          />
        </div>
      </div>
      
      {/* Sector Dropdown */}
      <div className="md:w-64">
        <select 
          name="sector" 
          value={sector}
          onChange={(e) => setSector(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none text-gray-700 font-medium text-sm cursor-pointer"
        >
          <option value="">All Sectors</option>
          {sectors.map(s => (
            <option key={s.id} value={s.slug}>{s.name}</option>
          ))}
        </select>
      </div>
      
      {/* Search Button */}
      <button 
        type="submit" 
        className="px-8 py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 hover:shadow-md active:scale-95"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        Search
      </button>
    </form>
  );
}
