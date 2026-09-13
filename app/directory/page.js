import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CommodityImage from '@/components/CommodityImage';
import DirectorySearchBar from '@/components/DirectorySearchBar';
import FavoriteButton from '@/components/FavoriteButton';
import { createClient, createAdminClient } from '@/services/supabaseServer';
import { getProductUrl } from '@/utils/catalogResolver';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: "India B2B Trade Directory — Verified Manufacturers, Wholesale Prices & Suppliers",
  description: "Explore India's largest verified B2B trade directory across 38 industrial sectors. Compare live factory wholesale prices, check MOQ, get instant quotations, and trade with automated escrow protection.",
  keywords: [
    "India B2B trade directory",
    "wholesale suppliers directory India",
    "verified Indian manufacturers",
    "industrial commodity marketplace",
    "bulk product suppliers",
    "GST verified B2B sellers",
    "factory direct wholesale price",
  ],
  alternates: {
    canonical: "https://b2bindia.site/directory",
  },
  openGraph: {
    title: "India B2B Trade Directory — Verified Manufacturers & Wholesale Suppliers",
    description: "Browse 38 sectors, compare wholesale prices, and trade directly with verified Indian manufacturers.",
    url: "https://b2bindia.site/directory",
    siteName: "B2B India",
    locale: "en_IN",
    type: "website",
  },
};

const STATIC_SECTORS = [
  { id: '1', name: 'Agricultural Products, Equipment & Machines', slug: 'agriculture', description: 'Farm equipment, irrigation systems, seeds, fertilizers, and harvesting machinery', hero_image_url: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800', product_count: 1450 },
  { id: '2', name: 'Electronics & Electrical Equipment', slug: 'electronics-electrical', description: 'Cables, switchgears, control panels, transformers, and electrical components', hero_image_url: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800', product_count: 2340 },
  { id: '3', name: 'Construction & Building Materials', slug: 'construction', description: 'Cement, steel, tiles, plumbing, and heavy construction equipment', hero_image_url: 'https://images.unsplash.com/photo-1541888087405-eb81f5f242d5?w=800', product_count: 3120 },
  { id: '4', name: 'Textiles & Apparel', slug: 'textiles', description: 'Raw fabrics, yarns, ready-made garments, and textile machinery', hero_image_url: 'https://images.unsplash.com/photo-1599643478524-fb66f70d00f6?w=800', product_count: 1890 },
  { id: '5', name: 'Machinery & Industrial Parts', slug: 'machinery', description: 'Lathes, CNC machines, bearings, gears, and industrial components', hero_image_url: 'https://images.unsplash.com/photo-1565043589221-1a6fd9ae45c7?w=800', product_count: 2750 },
  { id: '6', name: 'Food & Beverage', slug: 'food-beverage', description: 'Spices, grains, processed foods, and beverage manufacturing', hero_image_url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800', product_count: 4200 },
];

const STATIC_SUPPLIERS = [
  { id: 's0', name: 'Aaudumbar Agro', location: 'Maharashtra, India', sector: 'Agriculture', tier: 'Platinum', yearEstablished: 2020, responseRate: '100%', responseTime: '< 1h', products: 120, icon: '🌾' },
  { id: 's1', name: 'Jain Irrigation Systems', location: 'Jalgaon, Maharashtra', sector: 'Agriculture', tier: 'Diamond', yearEstablished: 1986, responseRate: '98%', responseTime: '< 2h', products: 42, icon: '🌾' },
  { id: 's2', name: 'Arvind Mills Ltd', location: 'Ahmedabad, Gujarat', sector: 'Textiles', tier: 'Gold', yearEstablished: 1931, responseRate: '95%', responseTime: '< 4h', products: 38, icon: '🧵' },
  { id: 's3', name: 'Polycab India Ltd', location: 'Mumbai, Maharashtra', sector: 'Electrical', tier: 'Diamond', yearEstablished: 1996, responseRate: '97%', responseTime: '< 1h', products: 56, icon: '⚡' },
  { id: 's4', name: 'Sundram Fasteners', location: 'Chennai, Tamil Nadu', sector: 'Auto Parts', tier: 'Gold', yearEstablished: 1962, responseRate: '94%', responseTime: '< 3h', products: 29, icon: '⚙️' },
  { id: 's5', name: 'Dabur Industrial', location: 'Ghaziabad, UP', sector: 'Ayurvedic', tier: 'Platinum', yearEstablished: 1884, responseRate: '99%', responseTime: '< 1h', products: 67, icon: '🌿' },
  { id: 's6', name: 'Bharat Forge Ltd', location: 'Pune, Maharashtra', sector: 'Forging', tier: 'Diamond', yearEstablished: 1961, responseRate: '96%', responseTime: '< 2h', products: 33, icon: '🏭' },
  { id: 's7', name: 'UltraTech Cement', location: 'Mumbai, Maharashtra', sector: 'Construction', tier: 'Platinum', yearEstablished: 1983, responseRate: '97%', responseTime: '< 3h', products: 15, icon: '🏗️' },
  { id: 's8', name: 'Himalayan Agri Exports', location: 'Karnal, Haryana', sector: 'Food', tier: 'Gold', yearEstablished: 1995, responseRate: '92%', responseTime: '< 12h', products: 22, icon: '🍚' }
];

const TIER_STYLES = {
  Diamond: { bg: 'bg-gradient-to-r from-cyan-500 to-blue-600', text: '💎 Diamond' },
  Gold: { bg: 'bg-gradient-to-r from-amber-500 to-yellow-600', text: '🥇 Gold' },
  Platinum: { bg: 'bg-gradient-to-r from-violet-500 to-purple-600', text: '👑 Platinum' },
};

const STATIC_PRODUCTS = [
  {
    id: 'demo-1',
    title: 'Drip Irrigation System Kit (1 Hectare)',
    description: 'Complete drip irrigation system for 1 hectare coverage with inline drippers, main lines, sub-mains, laterals, and filtration unit. High durability PVC.',
    base_price_per_unit: 46818,
    unit_label: 'kit',
    bulk_minimum_order: 10,
    quality_grade: 'Premium',
    is_stale: false,
    hero_image_url: 'https://images.unsplash.com/photo-1592982537447-6f2a6a0c8b39?w=500',
    supplier_id: { company_name: 'Jain Irrigation Systems Ltd', city: 'Jalgaon' },
    sector_id: { slug: 'agriculture', name: 'Agricultural Products, Equipment & Machines' }
  },
  {
    id: 'demo-2',
    title: 'Three-Phase Electric Motor 5HP',
    description: 'Industrial grade 5HP three-phase electric motor suitable for heavy machinery, pumps, and continuous manufacturing operation.',
    base_price_per_unit: 13388,
    unit_label: 'piece',
    bulk_minimum_order: 5,
    quality_grade: 'Industrial',
    is_stale: false,
    hero_image_url: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=500',
    supplier_id: { company_name: 'Bharat Motors Pvt Ltd', city: 'Pune' },
    sector_id: { slug: 'electronics-electrical', name: 'Electronics & Electrical Equipment' }
  },
  {
    id: 'demo-3',
    title: 'TMT Steel Bars (Fe500D)',
    description: 'High-strength thermo-mechanically treated (TMT) steel reinforcement bars for structural concrete. Available in 8mm to 32mm diameters.',
    base_price_per_unit: 66402,
    unit_label: 'metric ton',
    bulk_minimum_order: 50,
    quality_grade: 'Fe500D',
    is_stale: false,
    hero_image_url: 'https://images.unsplash.com/photo-1504917595217-d4bf805b48e6?w=500',
    supplier_id: { company_name: 'Tata Steel Ltd', city: 'Jamshedpur' },
    sector_id: { slug: 'construction', name: 'Construction & Building Materials' }
  },
  {
    id: 'demo-4',
    title: 'Organic Premium Basmati Rice',
    description: 'Long-grain, aromatic organic Basmati rice directly sourced from the foothills of the Himalayas. Aged for 2 years for perfect cooking.',
    base_price_per_unit: 114,
    unit_label: 'kg',
    bulk_minimum_order: 1000,
    quality_grade: 'Export Quality',
    is_stale: true,
    hero_image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500',
    supplier_id: { company_name: 'Himalayan Agri Exports', city: 'Karnal' },
    sector_id: { slug: 'food-beverage', name: 'Food & Beverage' }
  },
  {
    id: 'demo-5',
    title: '100% Cotton Combed Yarn (40s)',
    description: 'High-quality 40s count combed cotton yarn suitable for knitting and weaving premium apparel. OEKO-TEX certified.',
    base_price_per_unit: 311,
    unit_label: 'kg',
    bulk_minimum_order: 500,
    quality_grade: 'Premium Combed',
    is_stale: false,
    hero_image_url: 'https://images.unsplash.com/photo-1605634547963-44161f52d5b6?w=500',
    supplier_id: { company_name: 'Vardhman Textiles', city: 'Ludhiana' },
    sector_id: { slug: 'textiles', name: 'Textiles & Apparel' }
  },
  {
    id: 'demo-6',
    title: 'CNC Vertical Machining Center',
    description: 'High-precision 3-axis CNC vertical machining center (VMC) with 10,000 RPM spindle and 24-tool automatic tool changer (ATC).',
    base_price_per_unit: 1981350,
    unit_label: 'unit',
    bulk_minimum_order: 1,
    quality_grade: 'Industrial Grade',
    is_stale: false,
    hero_image_url: 'https://images.unsplash.com/photo-1565043589221-1a6fd9ae45c7?w=500',
    supplier_id: { company_name: 'Jyoti CNC Automation', city: 'Rajkot' },
    sector_id: { slug: 'machinery', name: 'Machinery & Industrial Parts' }
  },
  {
    id: 'demo-7',
    title: 'Heavy Duty Power Cable (4 Core, 16 sq.mm)',
    description: 'Armoured 4 core 16 sq.mm aluminium power cable for underground industrial transmission. XLPE insulated and flame retardant.',
    base_price_per_unit: 155,
    unit_label: 'meter',
    bulk_minimum_order: 1000,
    quality_grade: 'ISI Marked',
    is_stale: false,
    hero_image_url: 'https://images.unsplash.com/photo-1558222218-b7b54eede3f3?w=500',
    supplier_id: { company_name: 'Polycab India Ltd', city: 'Mumbai' },
    sector_id: { slug: 'electronics-electrical', name: 'Electronics & Electrical Equipment' }
  },
  {
    id: 'demo-8',
    title: 'Premium Portland Pozzolana Cement (PPC)',
    description: 'High-strength PPC cement for durable concrete construction, plastering, and masonry work. Excellent resistance to chemical attacks.',
    base_price_per_unit: 364,
    unit_label: 'bag (50kg)',
    bulk_minimum_order: 200,
    quality_grade: 'Grade 53',
    is_stale: true,
    hero_image_url: 'https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?w=500',
    supplier_id: { company_name: 'UltraTech Cement', city: 'Mumbai' },
    sector_id: { slug: 'construction', name: 'Construction & Building Materials' }
  }
];

// Fire-and-forget search logger
async function logSearchEvent(query, sectorSlug, resultsCount) {
  if (!query) return;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const supabaseAdmin = createAdminClient();
    let userId = null;
    let profile = null;
    
    if (user) {
      const { data: p } = await supabaseAdmin.from('users').select('id, full_name, company_name, registered_email, corporate_phone, phone_number, gst_number, city').eq('firebase_uid', user.id).single();
      profile = p;
      userId = p?.id;
    }
    
    await supabaseAdmin.from('search_logs').insert({
      user_id: userId,
      query: query.trim(),
      sector_slug: sectorSlug || null,
      results_count: resultsCount,
    });

    // Also log in activity_logs
    try {
      await supabaseAdmin.from('activity_logs').insert({
        user_id: userId,
        action: 'search',
        details: {
          query: query.trim(),
          sector_slug: sectorSlug || null,
          results_count: resultsCount,
          full_name: profile?.full_name || null,
          company_name: profile?.company_name || null,
          phone: profile?.corporate_phone || profile?.phone_number || null,
          email: profile?.registered_email || null,
          timestamp: new Date().toISOString()
        }
      });
    } catch (e) {}
  } catch (err) {
    // Ignore errors for logging
  }
}

export default async function DirectoryPage({ searchParams }) {
  // Extract query parameters for Server-Side searching and filtering
  const params = await searchParams;
  const query = params?.q || '';
  const sectorSlug = params?.sector || '';
  const type = params?.type || 'products'; // 'products' or 'suppliers'

  let sectors = STATIC_SECTORS;
  let products = STATIC_PRODUCTS;
  let suppliers = STATIC_SUPPLIERS;

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
          bulk_minimum_order, quality_grade, is_stale, hero_image_url, technical_specifications,
          supplier_id (id, company_name, city, state, warehouse_address, pincode),
          sector_id (name, slug)
        `)
        .eq('is_active', true);

      if (query) {
        productsQuery = productsQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
      }
      
      const { data: productData, error: productError } = await productsQuery;

      if (productError) {
        console.error("Products query error:", productError);
      }

      if (!productError && productData && productData.length > 0) {
        products = productData;
      }
      
      // Fetch Suppliers: All registered enterprise suppliers & trade partners
      const { data: supplierData, error: supplierError } = await supabase
        .from('users')
        .select('id, company_name, full_name, city, state, categories, display_id, created_at, company_logo_url, role')
        .in('role', ['supplier', 'both'])
        .not('company_name', 'is', null);

      // LIVE REAL PRODUCT COUNT: Query the active products directly to get exact real-time counts per supplier
      const { data: allActiveProductRows } = await supabase
        .from('products')
        .select('supplier_id')
        .eq('is_active', true);

      const liveSupplierProductCounts = {};
      allActiveProductRows?.forEach(p => {
        const supId = typeof p.supplier_id === 'object' ? p.supplier_id?.id : p.supplier_id;
        if (supId) {
          liveSupplierProductCounts[supId] = (liveSupplierProductCounts[supId] || 0) + 1;
        }
      });

      // Standardize and merge DB suppliers + curated static suppliers
      const allMappedSuppliers = [];
      const seenNames = new Set();

      if (!supplierError && supplierData && supplierData.length > 0) {
        const getCanonicalName = (raw) => {
          return (raw || '')
            .toLowerCase()
            .replace(/\b(ltd|pvt|limited|private|enterprises|industries)\b/gi, '')
            .replace(/[^a-z0-9]/gi, '')
            .trim();
        };

        // Filter out obvious test/mock artifacts
        const cleanDbSuppliers = supplierData.filter(s => {
          const n = (s.company_name || '').toLowerCase().trim();
          return n && 
            !n.startsWith('test') && 
            !n.includes('whattheheck') && 
            !n.includes('dummy') && 
            !n.includes('newsupplier') &&
            !n.includes('demo_') &&
            !n.includes('jaahjha') &&
            !n.includes('kmkmn') &&
            !n.includes('b2bindiatest') &&
            n !== 'owner' &&
            n !== 'supplier' && 
            n !== 'admin';
        });

        // Sort suppliers by actual live product count descending before deduplication
        // so the active supplier account with real products always takes precedence!
        cleanDbSuppliers.sort((a, b) => (liveSupplierProductCounts[b.id] || 0) - (liveSupplierProductCounts[a.id] || 0));

        cleanDbSuppliers.forEach(s => {
          const canonical = getCanonicalName(s.company_name);
          if (!canonical || seenNames.has(canonical)) return;
          seenNames.add(canonical);

          const prodCount = liveSupplierProductCounts[s.id] || 0;
          const tier = prodCount >= 10 ? 'Platinum' : prodCount >= 3 ? 'Diamond' : 'Gold';
          
          let resolvedSector = s.categories?.[0] || 'Industrial Wholesale';
          if (resolvedSector.includes('-')) {
            resolvedSector = resolvedSector.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          }

          allMappedSuppliers.push({
            id: s.id,
            name: s.company_name,
            location: [s.city, s.state].filter(Boolean).join(', ') || 'Maharashtra, India',
            sector: resolvedSector,
            tier: tier,
            yearEstablished: s.created_at ? new Date(s.created_at).getFullYear() : 2018,
            responseRate: prodCount > 10 ? '99%' : prodCount > 0 ? '98%' : '95%',
            responseTime: prodCount > 10 ? '< 30m' : prodCount > 0 ? '< 1h' : '< 4h',
            products: prodCount,
            icon: resolvedSector.toLowerCase().includes('agri') || resolvedSector.toLowerCase().includes('food') ? '🌾' :
                  resolvedSector.toLowerCase().includes('textile') || resolvedSector.toLowerCase().includes('apparel') ? '🧵' :
                  resolvedSector.toLowerCase().includes('electr') ? '⚡' :
                  resolvedSector.toLowerCase().includes('steel') || resolvedSector.toLowerCase().includes('metal') ? '🏗️' :
                  resolvedSector.toLowerCase().includes('medic') || resolvedSector.toLowerCase().includes('pharma') ? '🩺' : '🏭',
            logo: s.company_logo_url,
          });
        });

        // Also include any curated flagship suppliers if not already present
        STATIC_SUPPLIERS.forEach(staticSup => {
          const canonical = getCanonicalName(staticSup.name);
          if (!seenNames.has(canonical)) {
            seenNames.add(canonical);
            const prodCount = liveSupplierProductCounts[staticSup.id] || 0;
            allMappedSuppliers.push({
              ...staticSup,
              products: prodCount
            });
          }
        });
      }

      if (allMappedSuppliers.length > 0) {
        // Sort suppliers: suppliers with products and higher tiers first
        allMappedSuppliers.sort((a, b) => (b.products || 0) - (a.products || 0));
        suppliers = allMappedSuppliers;
      }
    }
  } catch (e) {
    // Supabase not configured, fallback to static
    console.error("Supabase fetch failed, using fallback.", e);
  }

  // Filter products and suppliers by sector slug in memory
  if (sectorSlug) {
    products = products.filter(p => {
      const slug = p.sector_id?.slug || (typeof p.sector_id === 'string' ? p.sector_id : '');
      if (!slug) return true;
      const s1 = slug.toLowerCase();
      const s2 = sectorSlug.toLowerCase();
      return s1 === s2 || s1.includes(s2) || s2.includes(s1);
    });
    // Rough match for suppliers
    suppliers = suppliers.filter(s => s.sector.toLowerCase().includes(sectorSlug.toLowerCase()) || sectorSlug.toLowerCase().includes(s.sector.toLowerCase()));
  }

  // Apply text search in memory for fallbacks or unhandled server-side filters
  if (query) {
    if (products === STATIC_PRODUCTS) {
      products = products.filter(p => 
        p.title.toLowerCase().includes(query.toLowerCase()) || 
        p.description.toLowerCase().includes(query.toLowerCase())
      );
    }
    suppliers = suppliers.filter(s => 
      s.name.toLowerCase().includes(query.toLowerCase()) || 
      s.location.toLowerCase().includes(query.toLowerCase())
    );
  }

  if (query) {
    await logSearchEvent(query, sectorSlug, products.length);
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

          {/* Search & Filter Bar with Live Autocomplete */}
          <DirectorySearchBar 
            initialQuery={query} 
            initialSector={sectorSlug} 
            sectors={sectors} 
          />

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Filters */}
            <div className="w-full lg:w-64 flex-shrink-0 space-y-6">
              {/* Supplier Types */}
              <div className="bg-white p-5 rounded-2xl border border-border-subtle shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wider">Supplier Types</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center">
                      <input type="checkbox" className="peer appearance-none w-5 h-5 border-2 border-gray-300 rounded hover:border-brand-500 checked:bg-brand-500 checked:border-brand-500 transition-all" />
                      <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-brand-600 transition-colors flex items-center gap-2">
                      <span className="w-4 h-4 rounded bg-amber-100 flex items-center justify-center text-[10px]">👑</span>
                      Trade Assurance
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center">
                      <input type="checkbox" className="peer appearance-none w-5 h-5 border-2 border-gray-300 rounded hover:border-brand-500 checked:bg-brand-500 checked:border-brand-500 transition-all" />
                      <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-brand-600 transition-colors flex items-center gap-2">
                      <span className="w-4 h-4 rounded bg-blue-100 flex items-center justify-center text-[10px]">💎</span>
                      Verified Supplier
                    </span>
                  </label>
                </div>
              </div>

              {/* Product Features */}
              <div className="bg-white p-5 rounded-2xl border border-border-subtle shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wider">Product Features</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center">
                      <input type="checkbox" className="peer appearance-none w-5 h-5 border-2 border-gray-300 rounded hover:border-brand-500 checked:bg-brand-500 checked:border-brand-500 transition-all" />
                      <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-brand-600 transition-colors flex items-center gap-2">
                      <span className="w-4 h-4 rounded bg-emerald-100 flex items-center justify-center text-[10px]">📦</span>
                      Ready to Ship
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center">
                      <input type="checkbox" className="peer appearance-none w-5 h-5 border-2 border-gray-300 rounded hover:border-brand-500 checked:bg-brand-500 checked:border-brand-500 transition-all" />
                      <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-brand-600 transition-colors flex items-center gap-2">
                      <span className="w-4 h-4 rounded bg-purple-100 flex items-center justify-center text-[10px]">🤖</span>
                      AI Priced
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b border-gray-200 pb-4">
                {/* Products / Suppliers Toggle */}
                <div className="flex bg-gray-100 p-1 rounded-xl">
                  <Link 
                    href={`/directory?type=products${query ? `&q=${query}` : ''}${sectorSlug ? `&sector=${sectorSlug}` : ''}`}
                    className={`px-6 py-2 rounded-lg font-medium text-sm transition-all ${type === 'products' ? 'bg-white text-brand-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                  >
                    Products
                  </Link>
                  <Link 
                    href={`/directory?type=suppliers${query ? `&q=${query}` : ''}${sectorSlug ? `&sector=${sectorSlug}` : ''}`}
                    className={`px-6 py-2 rounded-lg font-medium text-sm transition-all ${type === 'suppliers' ? 'bg-white text-brand-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                  >
                    Suppliers
                  </Link>
                </div>

                {/* Active Filters Display */}
                <div>
                  {(query || sectorSlug) ? (
                    <div className="flex items-center flex-wrap gap-2 text-sm">
                      <span className="text-gray-500">Filters:</span>
                      {query && (
                        <span className="px-3 py-1 bg-brand-50 text-brand-700 rounded-full font-medium border border-brand-100 flex items-center gap-2">
                          &quot;{query}&quot;
                          <Link href={`/directory?type=${type}&sector=${sectorSlug}`} className="hover:text-brand-900">×</Link>
                        </span>
                      )}
                      {sectorSlug && (
                        <span className="px-3 py-1 bg-brand-50 text-brand-700 rounded-full font-medium border border-brand-100 flex items-center gap-2">
                          {sectors.find(s => s.slug === sectorSlug)?.name || sectorSlug}
                          <Link href={`/directory?type=${type}&q=${query}`} className="hover:text-brand-900">×</Link>
                        </span>
                      )}
                      <Link href={`/directory?type=${type}`} className="text-gray-400 hover:text-gray-600 underline text-xs ml-2">Clear All</Link>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 font-medium">
                      Showing all {type === 'products' ? products.length : suppliers.length} {type}
                    </div>
                  )}
                </div>

                {/* View Toggles (Visual Only) */}
                <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-1">
                  <button className="p-1.5 rounded-md bg-gray-100 text-gray-900 shadow-sm" title="Grid View">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                  </button>
                  <button className="p-1.5 rounded-md text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-colors" title="List View">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                  </button>
                </div>
              </div>

              {/* Products OR Suppliers Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                
                {type === 'products' && (
                  products.length > 0 ? (
                    products.map((product, idx) => (
                      <Link key={product.id} href={getProductUrl(product)} className="group">
                        <div 
                          className="bg-white rounded-3xl overflow-hidden border border-border-subtle hover:shadow-2xl transition-all duration-500 h-full flex flex-col relative card-3d hover-lift card-glow animate-slide-up"
                          style={{ animationDelay: `${idx * 0.05}s` }}
                        >
                          {/* 7-Day Resiliency Indicator (is_stale) */}
                          {product.is_stale && (
                            <div className="absolute top-3 left-3 z-10 px-2.5 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-full shadow-lg flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                              Fallback Applied
                            </div>
                          )}
                          
                          <div className="h-48 overflow-hidden bg-gray-100 relative group-hover:opacity-90 transition-opacity">
                            <CommodityImage 
                              src={product.hero_image_url || 'https://images.unsplash.com/photo-1565043666747-69f6646db940?w=500'} 
                              category={product.sector_id?.name || 'Industrial Product'}
                              className="w-full h-full transform group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute top-3 right-3 z-10">
                              <FavoriteButton 
                                product={{
                                  id: product.id,
                                  title: product.title,
                                  price: product.base_price_per_unit,
                                  unit: product.unit_label,
                                  image: product.hero_image_url,
                                  slug: product.slug || product.id,
                                  url: getProductUrl(product),
                                  sector: product.sector_id?.name || 'General'
                                }} 
                                size="small" 
                              />
                            </div>
                          </div>
                          
                          <div className="p-5 flex-1 flex flex-col bg-gradient-to-b from-white to-gray-50/50">
                            <div className="text-xs font-semibold text-brand-600 mb-2 truncate flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
                              {product.sector_id?.name || 'Industrial Product'}
                            </div>
                            
                            <h3 className="font-bold text-gray-900 text-lg leading-tight mb-2 line-clamp-2 group-hover:text-brand-600 transition-colors">
                              {product.title}
                            </h3>
                            
                            <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">
                              {product.description}
                            </p>
                            
                            <div className="mt-auto border-t border-gray-100 pt-4">
                              <div className="flex justify-between items-end mb-3">
                                <div>
                                  <span className="text-2xl font-extrabold text-gray-900">
                                    ₹{Number(product.base_price_per_unit).toLocaleString('en-IN')}
                                  </span>
                                  <span className="text-xs text-gray-500 ml-1">/{product.unit_label}</span>
                                </div>
                                {product.quality_grade && (
                                  <span className="px-2.5 py-1 bg-white border border-gray-200 text-gray-700 text-[10px] font-bold rounded-md shadow-sm">
                                    {product.quality_grade}
                                  </span>
                                )}
                              </div>
                              
                              <div className="flex items-center text-xs text-gray-500 gap-1.5 bg-white p-2 rounded-lg border border-gray-100">
                                <span className="text-base">🏢</span>
                                <span className="font-semibold text-gray-700 truncate">{product.technical_specifications?.['Supplier Name'] || product.supplier_id?.company_name || 'Verified Supplier'}</span>
                                <span className="text-gray-300">•</span>
                                <span className="truncate" title={[product.supplier_id?.city, product.supplier_id?.state].filter(Boolean).join(', ') || 'India'}>
                                  {product.supplier_id?.city ? `${product.supplier_id.city}, ${product.supplier_id.state || ''}`.replace(/,\s*$/, '') : 'India'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-gray-200 shadow-sm">
                      <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">No products found</h3>
                      <p className="text-gray-500 max-w-sm mx-auto">Try adjusting your search or filters to find what you&apos;re looking for.</p>
                      <Link href="/directory" className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-brand-50 text-brand-700 font-bold rounded-xl hover:bg-brand-100 transition-colors">
                        Clear all filters
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </Link>
                    </div>
                  )
                )}

                {type === 'suppliers' && (
                  suppliers.length > 0 ? (
                    suppliers.map((supplier, idx) => {
                      const tier = TIER_STYLES[supplier.tier] || TIER_STYLES.Gold;
                      return (
                        <Link key={supplier.id} href={`/directory/supplier/${supplier.id}`} className="group">
                          <div 
                            className="bg-white rounded-3xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-500 h-full card-3d hover-lift card-glow flex flex-col animate-slide-up"
                            style={{ animationDelay: `${idx * 0.05}s` }}
                          >
                            <div className={`h-2 ${tier.bg} w-full`} />
                            <div className="p-6 flex-1 flex flex-col relative z-10 bg-white">
                              <div className="flex items-start gap-4 mb-5">
                                <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-3xl border border-gray-100 group-hover:scale-110 transition-transform duration-500 overflow-hidden relative shadow-sm">
                                  {supplier.logo ? (
                                    <img src={supplier.logo} alt={supplier.name} className="w-full h-full object-cover" />
                                  ) : (
                                    supplier.icon
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-bold text-gray-900 group-hover:text-brand-600 transition-colors truncate">
                                    {supplier.name}
                                  </h3>
                                  <p className="text-xs text-gray-400 mt-0.5">{supplier.location}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 mb-4">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold text-white ${tier.bg}`}>
                                  {tier.text}
                                </span>
                                <span className="px-2 py-0.5 rounded-full bg-gray-50 text-[10px] font-medium text-gray-500 border border-gray-100">
                                  {supplier.sector}
                                </span>
                              </div>
                              <div className="grid grid-cols-3 gap-2 mb-3 mt-auto">
                                <div className="text-center p-2 rounded-lg bg-gray-50 border border-gray-100">
                                  <div className="text-sm font-extrabold text-gray-900">{supplier.responseRate}</div>
                                  <div className="text-[9px] text-gray-400 uppercase tracking-wider">Response</div>
                                </div>
                                <div className="text-center p-2 rounded-lg bg-gray-50 border border-gray-100">
                                  <div className="text-sm font-extrabold text-gray-900">{supplier.responseTime}</div>
                                  <div className="text-[9px] text-gray-400 uppercase tracking-wider">Avg Time</div>
                                </div>
                                <div className="text-center p-2 rounded-lg bg-gray-50 border border-gray-100">
                                  <div className="text-sm font-extrabold text-gray-900">{supplier.products}</div>
                                  <div className="text-[9px] text-gray-400 uppercase tracking-wider">Products</div>
                                </div>
                              </div>
                              <div className="flex items-center justify-between pt-3 border-t border-gray-50 mt-2">
                                <span className="text-[10px] text-gray-400">Est. {supplier.yearEstablished}</span>
                                <span className="text-xs font-semibold text-brand-600 flex items-center gap-1 group-hover:underline">
                                  View Profile
                                  <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                </span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      );
                    })
                  ) : (
                    <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-gray-200 shadow-sm">
                      <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">No suppliers found</h3>
                      <p className="text-gray-500 max-w-sm mx-auto">Try adjusting your search or filters to find what you&apos;re looking for.</p>
                      <Link href="/directory?type=suppliers" className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-brand-50 text-brand-700 font-bold rounded-xl hover:bg-brand-100 transition-colors">
                        Clear all filters
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </Link>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
