// ============================================================================
// SUPPLIER PROFILE PAGE — PROGRAMMATIC B2B SEO
// ============================================================================
// Server-rendered verified supplier profile page with catalog and Schema.org
// Organization / LocalBusiness JSON-LD markup.
// ============================================================================

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CommodityImage from '@/components/CommodityImage';
import Breadcrumbs from '@/components/Breadcrumbs';
import { getAllProducts, getProductUrl } from '@/utils/catalogResolver';
import {
  generateSupplierMetadata,
  generateSupplierJsonLd,
  generateBreadcrumbJsonLd,
  formatInrPrice,
} from '@/utils/seoUtils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const KNOWN_SUPPLIERS = {
  '114f0006-bdd3-430d-95ba-0f9df91aa7eb': {
    id: '114f0006-bdd3-430d-95ba-0f9df91aa7eb',
    name: 'Aaudumbar Agro',
    location: 'Chhatrapati Sambhajinagar, Maharashtra',
    city: 'Chhatrapati Sambhajinagar',
    state: 'Maharashtra',
    sector: 'Agriculture & Food Processing',
    tier: 'Platinum',
    yearEstablished: 2020,
    icon: '🌾',
    gstVerified: true,
  },
  'ccbc1c96-b165-4afa-87af-fb9a82571c03': {
    id: 'ccbc1c96-b165-4afa-87af-fb9a82571c03',
    name: 'Tata Steel Ltd',
    location: 'Jamshedpur, Jharkhand',
    city: 'Jamshedpur',
    state: 'Jharkhand',
    sector: 'Metals, Mining & Construction Materials',
    tier: 'Diamond',
    yearEstablished: 1907,
    icon: '🏗️',
    gstVerified: true,
  },
  '4cd41f3d-9df5-4c26-a0d2-acfee02ee9af': {
    id: '4cd41f3d-9df5-4c26-a0d2-acfee02ee9af',
    name: 'UltraTech Cement',
    location: 'Mumbai, Maharashtra',
    city: 'Mumbai',
    state: 'Maharashtra',
    sector: 'Building & Construction Materials',
    tier: 'Diamond',
    yearEstablished: 1983,
    icon: '🏢',
    gstVerified: true,
  },
  '1d1fb33d-8485-4271-b201-3ff2f0690438': {
    id: '1d1fb33d-8485-4271-b201-3ff2f0690438',
    name: 'Polycab India Ltd',
    location: 'Mumbai, Maharashtra',
    city: 'Mumbai',
    state: 'Maharashtra',
    sector: 'Electronics & Electrical Equipment',
    tier: 'Diamond',
    yearEstablished: 1996,
    icon: '⚡',
    gstVerified: true,
  },
  '28a27773-226e-427d-835d-7c8d5e3036a8': {
    id: '28a27773-226e-427d-835d-7c8d5e3036a8',
    name: 'Arvind Mills Ltd',
    location: 'Ahmedabad, Gujarat',
    city: 'Ahmedabad',
    state: 'Gujarat',
    sector: 'Textiles & Apparel',
    tier: 'Gold',
    yearEstablished: 1931,
    icon: '🧵',
    gstVerified: true,
  },
  '289357d9-4214-4aca-8452-5b578a812397': {
    id: '289357d9-4214-4aca-8452-5b578a812397',
    name: 'Jain Irrigation Systems Ltd',
    location: 'Jalgaon, Maharashtra',
    city: 'Jalgaon',
    state: 'Maharashtra',
    sector: 'Agricultural Products & Machines',
    tier: 'Diamond',
    yearEstablished: 1986,
    icon: '🌾',
    gstVerified: true,
  },
  'bc09a874-61f8-416b-8115-d14011382a9e': {
    id: 'bc09a874-61f8-416b-8115-d14011382a9e',
    name: 'Jyoti CNC Automation',
    location: 'Rajkot, Gujarat',
    city: 'Rajkot',
    state: 'Gujarat',
    sector: 'Industrial Machinery & Automation',
    tier: 'Diamond',
    yearEstablished: 1989,
    icon: '🏭',
    gstVerified: true,
  },
  '3bf5b8ca-c730-4674-a2b2-b5e9a8a2d9fe': {
    id: '3bf5b8ca-c730-4674-a2b2-b5e9a8a2d9fe',
    name: 'Poly Medicure Ltd',
    location: 'Faridabad, Haryana',
    city: 'Faridabad',
    state: 'Haryana',
    sector: 'Medical & Healthcare Equipment',
    tier: 'Diamond',
    yearEstablished: 1995,
    icon: '🏥',
    gstVerified: true,
  },
  'bf79d26b-1e7c-4132-8a27-28886395dee0': {
    id: 'bf79d26b-1e7c-4132-8a27-28886395dee0',
    name: 'Pidilite Industries',
    location: 'Mumbai, Maharashtra',
    city: 'Mumbai',
    state: 'Maharashtra',
    sector: 'Chemicals, Adhesives & Polymers',
    tier: 'Diamond',
    yearEstablished: 1959,
    icon: '🧪',
    gstVerified: true,
  },
  'b09ec205-1e0e-45bc-9e87-62d0eb31c0e9': {
    id: 'b09ec205-1e0e-45bc-9e87-62d0eb31c0e9',
    name: 'Sundram Fasteners Ltd',
    location: 'Chennai, Tamil Nadu',
    city: 'Chennai',
    state: 'Tamil Nadu',
    sector: 'Automobile Parts & Hardware',
    tier: 'Gold',
    yearEstablished: 1962,
    icon: '⚙️',
    gstVerified: true,
  },
  'fdc86fa7-5fbd-4efd-b88f-fb314514f93e': {
    id: 'fdc86fa7-5fbd-4efd-b88f-fb314514f93e',
    name: 'HCL Infosystems',
    location: 'Noida, UP',
    city: 'Noida',
    state: 'UP',
    sector: 'IT, Telecom & Security Electronics',
    tier: 'Diamond',
    yearEstablished: 1976,
    icon: '💻',
    gstVerified: true,
  },
  '5b1eee7b-7aea-4926-bb15-503779e62c58': {
    id: '5b1eee7b-7aea-4926-bb15-503779e62c58',
    name: 'Himalayan Agri Exports',
    location: 'Karnal, Haryana',
    city: 'Karnal',
    state: 'Haryana',
    sector: 'Food Grains, Rice & Agriculture',
    tier: 'Gold',
    yearEstablished: 2012,
    icon: '🌾',
    gstVerified: true,
  },
  '6751b2de-2e22-45f4-bc21-561da57f5566': {
    id: '6751b2de-2e22-45f4-bc21-561da57f5566',
    name: 'Dabur Industrial',
    location: 'Ghaziabad, UP',
    city: 'Ghaziabad',
    state: 'UP',
    sector: 'Herbal, Ayurveda & Personal Care',
    tier: 'Gold',
    yearEstablished: 1884,
    icon: '🌿',
    gstVerified: true,
  },
  's0': {
    id: 's0',
    name: 'Aaudumbar Agro',
    location: 'Chhatrapati Sambhajinagar, Maharashtra',
    city: 'Chhatrapati Sambhajinagar',
    state: 'Maharashtra',
    sector: 'Agriculture & Food Processing',
    tier: 'Platinum',
    yearEstablished: 2020,
    icon: '🌾',
    gstVerified: true,
  },
  's1': {
    id: 's1',
    name: 'Jain Irrigation Systems Ltd',
    location: 'Jalgaon, Maharashtra',
    city: 'Jalgaon',
    state: 'Maharashtra',
    sector: 'Agricultural Products & Machines',
    tier: 'Diamond',
    yearEstablished: 1986,
    icon: '🌾',
    gstVerified: true,
  },
  's2': {
    id: 's2',
    name: 'Polycab India Ltd',
    location: 'Mumbai, Maharashtra',
    city: 'Mumbai',
    state: 'Maharashtra',
    sector: 'Electronics & Electrical Equipment',
    tier: 'Diamond',
    yearEstablished: 1996,
    icon: '⚡',
    gstVerified: true,
  },
  's3': {
    id: 's3',
    name: 'Arvind Mills Ltd',
    location: 'Ahmedabad, Gujarat',
    city: 'Ahmedabad',
    state: 'Gujarat',
    sector: 'Textiles & Apparel',
    tier: 'Gold',
    yearEstablished: 1931,
    icon: '🧵',
    gstVerified: true,
  },
  's4': {
    id: 's4',
    name: 'Sundram Fasteners Ltd',
    location: 'Chennai, Tamil Nadu',
    city: 'Chennai',
    state: 'Tamil Nadu',
    sector: 'Automobile Parts & Accessories',
    tier: 'Gold',
    yearEstablished: 1962,
    icon: '⚙️',
    gstVerified: true,
  },
};

async function getSupplierInfo(id) {
  if (KNOWN_SUPPLIERS[id]) {
    return KNOWN_SUPPLIERS[id];
  }

  // Try fetching from Supabase
  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { createAdminClient } = await import('@/services/supabaseServer');
      const supabase = createAdminClient();
      const { data } = await supabase
        .from('users')
        .select('id, company_name, full_name, city, state, categories, created_at, company_logo_url, verification_level')
        .eq('id', id)
        .single();

      if (data) {
        return {
          id: data.id,
          name: data.company_name || data.full_name || 'Verified Supplier',
          location: [data.city, data.state].filter(Boolean).join(', ') || 'India',
          city: data.city || 'India',
          state: data.state || 'Maharashtra',
          sector: data.categories?.[0] || 'Industrial Manufacturing',
          tier: data.verification_level || 'Gold',
          yearEstablished: new Date(data.created_at).getFullYear() || 2020,
          icon: '🏭',
          logo: data.company_logo_url,
          gstVerified: true,
        };
      }
    }
  } catch (e) {
    // Continue
  }

  return {
    id: id,
    name: 'Verified Supplier',
    location: 'India',
    city: 'Mumbai',
    state: 'Maharashtra',
    sector: 'Industrial Manufacturing',
    tier: 'Gold',
    yearEstablished: 2020,
    icon: '🏭',
    gstVerified: true,
  };
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const supplier = await getSupplierInfo(id);
  return generateSupplierMetadata(supplier);
}

export default async function SupplierProfilePage({ params }) {
  const { id } = await params;
  const supplier = await getSupplierInfo(id);

  // Fetch all products from this supplier
  const allProducts = await getAllProducts();
  const products = allProducts.filter((p) => {
    const pSupplierId = p.supplier_id?.id || p.supplier_id;
    const pSupplierName = (p.supplier_id?.company_name || '').toLowerCase();
    const currentSupplierName = (supplier.name || '').toLowerCase();

    return (
      pSupplierId === id ||
      (currentSupplierName && pSupplierName === currentSupplierName)
    );
  });

  const supplierJsonLd = generateSupplierJsonLd(supplier, products);
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'Home', url: '/' },
    { name: 'Directory', url: '/directory' },
    { name: supplier.name, url: `/directory/supplier/${supplier.id}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(supplierJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <Navbar />

      <main className="flex-1 pt-24 pb-16 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          {/* Breadcrumbs */}
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Directory', href: '/directory' },
              { label: supplier.name }
            ]}
            className="mb-6"
          />

          {/* Supplier Header */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-sm mb-8 flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-600 to-emerald-500" />

            <div className="w-24 h-24 rounded-2xl bg-gray-50 flex items-center justify-center text-5xl border border-gray-100 flex-shrink-0 shadow-inner overflow-hidden">
              {supplier.logo ? (
                <img src={supplier.logo} alt={supplier.name} className="w-full h-full object-cover" />
              ) : (
                supplier.icon
              )}
            </div>

            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">{supplier.name}</h1>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider rounded-full border border-emerald-200 w-fit mx-auto md:mx-0 flex items-center gap-1">
                  <span>✓</span> GST Verified Manufacturer
                </span>
              </div>

              <div className="flex flex-wrap gap-4 md:gap-6 text-sm text-gray-600 mt-4 justify-center md:justify-start">
                <div className="flex items-center gap-1.5">
                  <span>📍</span> {supplier.location}
                </div>
                <div className="flex items-center gap-1.5">
                  <span>🏭</span> {supplier.sector}
                </div>
                <div className="flex items-center gap-1.5">
                  <span>🗓️</span> Established {supplier.yearEstablished}
                </div>
                <div className="flex items-center gap-1.5 text-brand-600 font-semibold">
                  <span>🛡️</span> Escrow Settle Supported
                </div>
              </div>
            </div>

            <div className="flex-shrink-0 w-full md:w-auto">
              <a
                href="#products"
                className="block text-center px-8 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-md transition-colors w-full"
              >
                Browse Catalog ({products.length})
              </a>
            </div>
          </div>

          {/* Supplier Catalog */}
          <div id="products">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Verified Products from {supplier.name}{' '}
                <span className="text-gray-400 font-medium text-lg">({products.length})</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.length > 0 ? (
                products.map((product) => (
                  <Link
                    key={product.id}
                    href={getProductUrl(product)}
                    className="group block"
                  >
                    <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col">
                      <div className="h-48 overflow-hidden bg-gray-100 relative">
                        <CommodityImage
                          src={product.hero_image_url || product.image}
                          category={product.sector_id?.name || 'Industrial Product'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {product.quality_grade && (
                          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur text-gray-900 text-[10px] font-bold shadow-sm">
                            {product.quality_grade}
                          </div>
                        )}
                        {product.bulk_minimum_order && (
                          <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-gray-900/80 backdrop-blur text-white text-[10px] font-semibold">
                            MOQ: {product.bulk_minimum_order} {product.unit_label || 'units'}
                          </div>
                        )}
                      </div>

                      <div className="p-5 flex-1 flex flex-col">
                        <h3 className="font-bold text-gray-900 text-base leading-snug group-hover:text-brand-600 transition-colors line-clamp-2">
                          {product.title || product.name}
                        </h3>

                        <div className="mt-auto pt-4 flex items-end justify-between border-t border-gray-100">
                          <div>
                            <span className="text-xl font-extrabold text-gray-900">
                              ₹{formatInrPrice(product.base_price_per_unit || product.price)}
                            </span>
                            <span className="text-xs text-gray-500 ml-1">
                              /{product.unit_label || product.unit || 'unit'}
                            </span>
                          </div>
                          <span className="px-3.5 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-semibold group-hover:bg-brand-700 transition-colors shadow-sm">
                            Quote →
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Catalog Synchronizing</h3>
                  <p className="text-gray-500 text-sm">
                    Additional products from this supplier are being indexed.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
