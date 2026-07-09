// ============================================================================
// SECTOR-SPECIFIC DIRECTORY PAGE
// ============================================================================
// Dynamic route showing products for a specific industry sector.
// Features sector hero image, supplier cards, and product listings.
// ============================================================================

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CommodityImage from '@/components/CommodityImage';

// ── Static product data (used when Supabase not configured) ──
const STATIC_PRODUCTS = {
  'agriculture': [
    { id: 'p1', title: 'Drip Irrigation System Kit (1 Hectare)', base_price_per_unit: 45000, unit_label: 'kit', quality_grade: 'Premium', supplier: 'Jain Irrigation Systems Ltd', city: 'Jalgaon, MH', is_stale: false, hero_image_url: 'https://images.unsplash.com/photo-1592982537447-6f2a6a0c8b39?w=600' },
    { id: 'p2', title: 'Agricultural Submersible Pumping Kit (5HP)', base_price_per_unit: 38500, unit_label: 'unit', quality_grade: 'Industrial', supplier: 'Jain Irrigation Systems Ltd', city: 'Jalgaon, MH', is_stale: false, hero_image_url: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=600' },
    { id: 'p3', title: 'High-Yield Hybrid Tomato Seeds (Arka Rakshak)', base_price_per_unit: 1200, unit_label: 'packet', quality_grade: 'Premium', supplier: 'Jain Irrigation Systems Ltd', city: 'Jalgaon, MH', is_stale: false, hero_image_url: 'https://images.unsplash.com/photo-1592921870789-04563d55041c?w=600' },
  ],
  'apparel-fashion': [
    { id: 'p4', title: 'Premium Selvedge Denim Fabric (12oz Indigo)', base_price_per_unit: 850, unit_label: 'meter', quality_grade: 'Premium', supplier: 'Arvind Mills Ltd', city: 'Ahmedabad, GJ', is_stale: false, hero_image_url: 'https://images.unsplash.com/photo-1565084888279-aca607ecce0c?w=600' },
    { id: 'p5', title: 'Combed Cotton Yarn (40s Count, Ring Spun)', base_price_per_unit: 285, unit_label: 'kg', quality_grade: 'A', supplier: 'Arvind Mills Ltd', city: 'Ahmedabad, GJ', is_stale: false, hero_image_url: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=600' },
    { id: 'p6', title: 'Handloom Khadi Fabric (Muslin Grade)', base_price_per_unit: 420, unit_label: 'meter', quality_grade: 'Premium', supplier: 'Arvind Mills Ltd', city: 'Ahmedabad, GJ', is_stale: false, hero_image_url: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600' },
  ],
  'automobile-ev': [
    { id: 'p7', title: 'High-Tensile Hex Bolt Set (Grade 10.9, M10)', base_price_per_unit: 145, unit_label: 'kg', quality_grade: 'Automotive OEM', supplier: 'Sundram Fasteners Ltd', city: 'Chennai, TN', is_stale: false, hero_image_url: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=600' },
    { id: 'p8', title: 'BLDC Motor Controller Kit (48V/72V, 3KW)', base_price_per_unit: 8500, unit_label: 'unit', quality_grade: 'Premium', supplier: 'Sundram Fasteners Ltd', city: 'Chennai, TN', is_stale: false, hero_image_url: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=600' },
    { id: 'p9', title: 'Disc Brake Assembly (Ventilated, 280mm)', base_price_per_unit: 3200, unit_label: 'set', quality_grade: 'OEM Replacement', supplier: 'Sundram Fasteners Ltd', city: 'Chennai, TN', is_stale: false, hero_image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600' },
  ],
};

const SECTOR_META = {
  'agriculture': { name: 'Agricultural Products, Equipment & Machines', hero: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1600' },
  'apparel-fashion': { name: 'Apparel & Fashion Accessories', hero: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1600' },
  'automobile-ev': { name: 'Automobile Parts, Accessories & EV Kits', hero: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=1600' },
  'ayurvedic-herbal': { name: 'Ayurvedic, Herbal Products & Natural Extracts', hero: 'https://images.unsplash.com/photo-1611241893603-3c359704e0ee?w=1600' },
  'chemicals-polymers': { name: 'Chemical, Dyes, Pigments & Plastic Raw Material', hero: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=1600' },
  'it-hardware': { name: 'Computer Hardware, Peripherals & IT Solutions', hero: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1600' },
  'electronics-electrical': { name: 'Electronics & Electrical Equipment', hero: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=1600' },
  'food-beverage': { name: 'Food & Beverage Products', hero: 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=1600' },
  'medical-surgical': { name: 'Hospital, Medical Imaging & Surgical Supplies', hero: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1600' },
  'industrial-cnc': { name: 'Industrial Machinery, Plant Equipment & CNC Systems', hero: 'https://images.unsplash.com/photo-1565043666747-69f6646db940?w=1600' },
};

export async function generateMetadata({ params }) {
  const { sector } = await params;
  const meta = SECTOR_META[sector];
  return {
    title: `${meta?.name || 'Sector'} — B2B Bharat Trade Directory`,
    description: `Browse verified suppliers and products in ${meta?.name || 'this sector'}. GST-verified, escrow-protected B2B sourcing.`,
  };
}

export default async function SectorPage({ params }) {
  const { sector } = await params;
  const meta = SECTOR_META[sector] || { name: sector, hero: null };
  let products = STATIC_PRODUCTS[sector] || [];

  // Attempt Supabase fetch
  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { createAdminClient } = await import('@/services/supabaseServer');
      const supabase = createAdminClient();

      const { data: sectorData } = await supabase
        .from('industry_sectors')
        .select('id, name')
        .eq('slug', sector)
        .single();

      if (sectorData) {
        const { data: productData } = await supabase
          .from('products')
          .select('id, title, base_price_per_unit, unit_label, quality_grade, hero_image_url, is_stale, supplier_id(company_name, city)')
          .eq('sector_id', sectorData.id)
          .eq('is_active', true)
          .order('last_price_update', { ascending: false });

        if (productData && productData.length > 0) {
          products = productData.map((p) => ({
            ...p,
            supplier: p.supplier_id?.company_name || 'Unknown',
            city: p.supplier_id?.city || '',
          }));
        }
      }
    }
  } catch (e) {
    // Use static data
  }

  return (
    <>
      <Navbar />
      <main className="flex-1">
        {/* Hero Banner */}
        <div className="relative h-64 sm:h-80 overflow-hidden">
          <CommodityImage
            src={meta.hero}
            category={meta.name}
            className="w-full h-full"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          <div className="absolute bottom-8 left-0 right-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 mb-3">
              <Link href="/directory" className="text-white/60 text-sm hover:text-white transition-colors">
                Directory
              </Link>
              <span className="text-white/30">/</span>
              <span className="text-white text-sm font-medium">{meta.name}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white drop-shadow-lg">
              {meta.name}
            </h1>
            <p className="text-white/60 mt-2">
              {products.length} products from verified suppliers
            </p>
          </div>
        </div>

        {/* Products Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {products.length === 0 ? (
            <div className="text-center py-20">
              <span className="text-5xl mb-4 block">📦</span>
              <h3 className="text-xl font-bold text-foreground mb-2">No products listed yet</h3>
              <p className="text-gray-500">Suppliers in this sector will be onboarded soon.</p>
              <Link href="/directory" className="inline-block mt-6 px-6 py-3 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 transition-colors">
                ← Back to Directory
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <Link
                  key={product.id}
                  href={`/directory/product/${product.id}`}
                  className="group block"
                >
                  <div className="rounded-2xl bg-white border border-border-subtle overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col">
                    {/* Image */}
                    <div className="relative h-48 overflow-hidden">
                      <CommodityImage
                        src={product.hero_image_url}
                        category={meta.name || 'Industrial Product'}
                        className="w-full h-full"
                      />
                      {/* Stale badge */}
                      {product.is_stale && (
                        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-warning-500 text-white text-[10px] font-bold stale-badge">
                          Price Updating
                        </div>
                      )}
                      {/* Quality badge */}
                      {product.quality_grade && (
                        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur text-foreground text-[10px] font-bold">
                          {product.quality_grade}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-5 flex-1 flex flex-col">
                      <h3 className="font-bold text-foreground text-sm leading-tight group-hover:text-brand-700 transition-colors line-clamp-2">
                        {product.title}
                      </h3>
                      <p className="mt-1.5 text-xs text-gray-400">
                        {product.supplier} · {product.city}
                      </p>

                      <div className="mt-auto pt-4 flex items-end justify-between">
                        <div>
                          <span className="text-xl font-extrabold text-foreground">
                            ₹{Number(product.base_price_per_unit).toLocaleString('en-IN')}
                          </span>
                          <span className="text-xs text-gray-400 ml-1">
                            /{product.unit_label}
                          </span>
                        </div>
                        <span className="px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold group-hover:bg-brand-700 transition-colors">
                          Get Quote
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
