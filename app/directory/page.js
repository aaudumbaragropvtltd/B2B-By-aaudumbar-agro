// ============================================================================
// DIRECTORY CATALOG PAGE
// ============================================================================
// Server-rendered multi-sector catalog dashboard.
// Fetches sectors and products from Supabase with search/filter.
// ============================================================================

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CommodityImage from '@/components/CommodityImage';

// ── Static fallback data ──
const STATIC_SECTORS = [
  { id: '1', name: 'Agricultural Products, Equipment & Machines', slug: 'agriculture', description: 'Farm equipment, irrigation systems, seeds, fertilizers, and harvesting machinery', hero_image_url: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800', product_count: 3 },
  { id: '2', name: 'Electronics & Electrical Equipment', slug: 'electronics-electrical', description: 'Cables, switchgears, control panels, transformers, and electrical components', hero_image_url: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800', product_count: 3 },
];

const STATIC_PRODUCTS = [
  {
    id: 'demo-1',
    title: 'Drip Irrigation System Kit (1 Hectare)',
    description: 'Complete drip irrigation system for 1 hectare coverage with inline drippers, main lines, sub-mains, laterals, and filtration unit.',
    base_price_per_unit: 45000,
    unit_label: 'kit',
    bulk_minimum_order: 10,
    quality_grade: 'Premium',
    is_stale: true,
    hero_image_url: 'https://images.unsplash.com/photo-1592982537447-6f2a6a0c8b39?w=500',
    supplier_id: { company_name: 'Jain Irrigation Systems Ltd', city: 'Jalgaon' },
    sector_id: { slug: 'agriculture', name: 'Agricultural Products, Equipment & Machines' }
  },
  {
    id: 'demo-2',
    title: 'Three-Phase Electric Motor 5HP',
    description: 'Industrial grade 5HP three-phase electric motor suitable for heavy machinery and continuous operation.',
    base_price_per_unit: 12500,
    unit_label: 'piece',
    bulk_minimum_order: 5,
    quality_grade: 'Industrial',
    is_stale: false,
    hero_image_url: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=500',
    supplier_id: { company_name: 'Bharat Motors Pvt Ltd', city: 'Pune' },
    sector_id: { slug: 'electronics-electrical', name: 'Electronics & Electrical Equipment' }
  }
];

export const metadata = {
  title: 'Trade Directory — B2B Bharat',
  description: 'Browse 38+ industrial sectors. Find verified suppliers, compare prices, and source directly.',
};

export default async function DirectoryPage({ searchParams }) {
  // Extract query parameters for Server-Side searching and filtering
  const params = await searchParams;
  const query = params?.q || '';
  const sectorSlug = params?.sector || '';

  let sectors = STATIC_SECTORS;
  let products = STATIC_PRODUCTS;

  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { createAdminClient } = await import('@/services/supabaseServer');
      const supabase = createAdminClient();
      
      // Fetch Sectors
      const { data: sectorData } = await supabase
        .from('industry_sectors')
        .select('id, name, slug, description, hero_image_url')
        .is('parent_id', null)
        .eq('is_active', true)
        .order('display_order');
        
      if (sectorData && sectorData.length > 0) sectors = sectorData;

      // Fetch Products with Relations
      let productsQuery = supabase
        .from('products')
        .select(`
          id, title, description, base_price_per_unit, unit_label, 
          bulk_minimum_order, quality_grade, is_stale, hero_image_url,
          supplier_id (company_name, city, state),
          sector_id (name, slug)
        `)
        .eq('is_active', true);

      if (query) {
        productsQuery = productsQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
      }
      
      const { data: productData, error: productError } = await productsQuery;

      if (!productError && productData) {
        products = productData;
      }
    }
  } catch (e) {
    // Supabase not configured, fallback to static
    console.error("Supabase fetch failed, using fallback.", e);
  }

  // Filter products by sector slug in memory to handle relationship filtering easily
  if (sectorSlug) {
    products = products.filter(p => p.sector_id?.slug === sectorSlug);
  }

  // If fallback was used, also apply text search in memory
  if (products === STATIC_PRODUCTS && query) {
    products = products.filter(p => 
      p.title.toLowerCase().includes(query.toLowerCase()) || 
      p.description.toLowerCase().includes(query.toLowerCase())
    );
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 pt-24 pb-16 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight">
              Trade <span className="gradient-text">Directory</span>
            </h1>
            <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
              Find verified suppliers, compare prices, and source directly from India's largest B2B manufacturer network.
            </p>
          </div>

          {/* Search & Filter Bar */}
          <form method="GET" action="/directory" className="bg-white p-4 rounded-2xl shadow-sm border border-border-subtle flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1 relative">
              <input 
                type="text" 
                name="q" 
                defaultValue={query}
                placeholder="Search products by name or description..." 
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
              />
              <svg className="w-5 h-5 text-gray-400 absolute left-4 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            
            <div className="md:w-64">
              <select 
                name="sector" 
                defaultValue={sectorSlug}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none text-gray-700"
              >
                <option value="">All Sectors</option>
                {sectors.map(s => (
                  <option key={s.id} value={s.slug}>{s.name}</option>
                ))}
              </select>
            </div>
            
            <button type="submit" className="px-8 py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl transition-colors shadow-sm">
              Search
            </button>
          </form>

          {/* Active Filters Display */}
          {(query || sectorSlug) && (
            <div className="flex items-center gap-2 mb-6 text-sm">
              <span className="text-gray-500">Showing results for:</span>
              {query && (
                <span className="px-3 py-1 bg-brand-50 text-brand-700 rounded-full font-medium border border-brand-100 flex items-center gap-2">
                  "{query}"
                  <Link href={`/directory?sector=${sectorSlug}`} className="hover:text-brand-900">×</Link>
                </span>
              )}
              {sectorSlug && (
                <span className="px-3 py-1 bg-brand-50 text-brand-700 rounded-full font-medium border border-brand-100 flex items-center gap-2">
                  {sectors.find(s => s.slug === sectorSlug)?.name || sectorSlug}
                  <Link href={`/directory?q=${query}`} className="hover:text-brand-900">×</Link>
                </span>
              )}
              <Link href="/directory" className="text-gray-400 hover:text-gray-600 underline text-xs ml-2">Clear All</Link>
            </div>
          )}

          {/* Product Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.length > 0 ? (
              products.map((product) => (
                <Link key={product.id} href={`/directory/product/${product.id}`} className="group">
                  <div className="bg-white rounded-2xl overflow-hidden border border-border-subtle hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col relative">
                    {/* 7-Day Resiliency Indicator (is_stale) */}
                    {product.is_stale && (
                      <div className="absolute top-3 left-3 z-10 px-2.5 py-1 bg-warning-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-full shadow-sm flex items-center gap-1 backdrop-blur-sm bg-opacity-90">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        Fallback Applied
                      </div>
                    )}
                    
                    <div className="h-48 overflow-hidden bg-gray-100 relative">
                      <CommodityImage 
                        src={product.hero_image_url || 'https://images.unsplash.com/photo-1565043666747-69f6646db940?w=500'} 
                        category={product.sector_id?.name || 'Industrial Product'}
                        className="w-full h-full"
                      />
                    </div>
                    
                    <div className="p-5 flex-1 flex flex-col">
                      <div className="text-xs font-semibold text-brand-600 mb-2 truncate">
                        {product.sector_id?.name || 'Industrial Product'}
                      </div>
                      
                      <h3 className="font-bold text-gray-900 text-lg leading-tight mb-2 line-clamp-2 group-hover:text-brand-600 transition-colors">
                        {product.title}
                      </h3>
                      
                      <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">
                        {product.description}
                      </p>
                      
                      <div className="mt-auto border-t border-gray-100 pt-4">
                        <div className="flex justify-between items-end mb-2">
                          <div>
                            <span className="text-2xl font-extrabold text-gray-900">
                              ₹{Number(product.base_price_per_unit).toLocaleString('en-IN')}
                            </span>
                            <span className="text-xs text-gray-500 ml-1">/{product.unit_label}</span>
                          </div>
                          {product.quality_grade && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                              {product.quality_grade}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center text-xs text-gray-500 gap-1.5">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <span className="truncate">{product.supplier_id?.company_name || 'Verified Supplier'}</span>
                          <span>•</span>
                          <span className="truncate">{product.supplier_id?.city || 'India'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-gray-200">
                <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No products found</h3>
                <p className="text-gray-500">Try adjusting your search or filters to find what you're looking for.</p>
                <Link href="/directory" className="mt-4 inline-block px-4 py-2 bg-brand-50 text-brand-700 font-medium rounded-lg hover:bg-brand-100 transition-colors">
                  Clear all filters
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
