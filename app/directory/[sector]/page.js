// ============================================================================
// SECTOR-SPECIFIC DIRECTORY PAGE — PROGRAMMATIC B2B SEO
// ============================================================================
// Dynamic route for all 38 industry sectors in India.
// Injects Schema.org CollectionPage, ItemList, Breadcrumbs & Sector FAQs.
// ============================================================================

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CommodityImage from '@/components/CommodityImage';
import Breadcrumbs from '@/components/Breadcrumbs';
import FavoriteButton from '@/components/FavoriteButton';
import { STATIC_SECTORS } from '@/constants/sectors';
import { getAllProducts, getProductUrl } from '@/utils/catalogResolver';
import { getSectorBanner } from '@/utils/platformBanners';
import {
  generateSectorMetadata,
  generateSectorJsonLd,
  generateBreadcrumbJsonLd,
  generateFaqJsonLd,
  formatInrPrice,
  SITE_URL,
} from '@/utils/seoUtils';

export const revalidate = 300; // 5-minute ISR edge cache

async function getSectorInfo(slug) {
  const dynamicBanner = await getSectorBanner(slug);
  const found = STATIC_SECTORS.find((s) => s.slug === slug || s.slug.replace(/-/g, '_') === slug);
  const cleanName = found?.name || slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    name: dynamicBanner?.name || cleanName,
    slug: slug,
    hero_image_url: dynamicBanner?.hero_image_url || 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1600',
    subtitle: dynamicBanner?.subtitle || 'Source verified bulk supplies directly from Indian manufacturers with escrow protection, factory pricing, and pan-India logistics.',
    badge_text: dynamicBanner?.badge_text || 'Verified Wholesale Sourcing',
  };
}

export async function generateMetadata({ params }) {
  const { sector } = await params;
  const sectorInfo = await getSectorInfo(sector);
  return generateSectorMetadata(sectorInfo);
}

export default async function SectorPage({ params }) {
  const { sector } = await params;
  const sectorInfo = await getSectorInfo(sector);

  // Fetch all products matching this sector
  const allProducts = await getAllProducts();
  const products = allProducts.filter((p) => {
    const slug = p.sector_id?.slug || p.category || '';
    return (
      slug === sector ||
      slug.includes(sector) ||
      sector.includes(slug) ||
      (sector === 'agriculture' && slug === 'food-agriculture') ||
      (sector === 'food-agriculture' && slug === 'agriculture') ||
      (sector === 'automobile-ev' && slug === 'automobile-parts') ||
      (sector === 'automobile-parts' && slug === 'automobile-ev') ||
      (sector === 'apparel-fashion' && slug === 'apparel-garments') ||
      (sector === 'apparel-garments' && slug === 'apparel-fashion')
    );
  });

  // Schema.org Structured Data
  const sectorJsonLd = generateSectorJsonLd(sectorInfo, products);
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'Home', url: '/' },
    { name: 'Directory', url: '/directory' },
    { name: sectorInfo.name, url: `/directory/${sectorInfo.slug}` },
  ]);

  const sectorFaqs = [
    {
      question: `How to buy wholesale ${sectorInfo.name} in bulk on B2B India?`,
      answer: `You can browse verified Indian manufacturers and distributors in ${sectorInfo.name}, compare real-time wholesale price quotes, check Minimum Order Quantities (MOQ), and initiate direct RFQs or escrow-secured orders with full GST invoices.`,
    },
    {
      question: `Are suppliers in ${sectorInfo.name} GST verified and certified?`,
      answer: `Yes, all suppliers on B2B India undergo strict business credential verification including active GSTIN registration, manufacturing unit verification, and relevant industry certifications (ISO, BIS, CE, FSSAI).`,
    },
    {
      question: `What payment protection is provided for bulk orders in ${sectorInfo.name}?`,
      answer: `B2B India provides an automated Escrow Clearing mechanism. Funds are held safely in escrow and only released to the supplier once you receive and verify the goods at your warehouse.`,
    },
  ];
  const faqJsonLd = generateFaqJsonLd(sectorFaqs);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(sectorJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <Navbar />

      <main className="flex-1 bg-gray-50 min-h-screen">
        {/* Sector Hero Banner */}
        <div className="relative h-64 sm:h-80 overflow-hidden">
          <CommodityImage
            src={sectorInfo.hero_image_url}
            category={sectorInfo.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/20" />
          <div className="absolute bottom-8 left-0 right-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Breadcrumbs
              variant="transparent"
              items={[
                { label: 'Home', href: '/' },
                { label: 'Directory', href: '/directory' },
                { label: sectorInfo.name }
              ]}
              className="mb-3"
            />
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white drop-shadow-md">
              {sectorInfo.name}
            </h1>
            <p className="text-white/85 mt-2 text-sm sm:text-base max-w-3xl leading-relaxed">
              {sectorInfo.subtitle}
            </p>
          </div>
        </div>

        {/* Product Catalog Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Verified Products & Suppliers ({products.length})
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Real-time wholesale base prices with instant quotation & RFQ support
              </p>
            </div>
            <Link
              href="/directory"
              className="text-sm font-semibold text-brand-600 hover:text-brand-700 self-start sm:self-auto flex items-center gap-1"
            >
              ← Explore All 38 Sectors
            </Link>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
              <span className="text-5xl mb-4 block">📦</span>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Products currently being onboarded for {sectorInfo.name}
              </h3>
              <p className="text-gray-500 max-w-md mx-auto mb-6 text-sm">
                Verified suppliers in this category are being verified. Submit an RFQ to get immediate quotes from our supplier network.
              </p>
              <Link
                href="/directory"
                className="inline-block px-6 py-3 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 transition-colors shadow"
              >
                Browse Full Catalog
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => {
                const supplierName =
                  product.supplier_id?.company_name ||
                  product.supplier ||
                  product.supplierName ||
                  'Aaudumbar Agro';
                const city =
                  product.supplier_id?.city ||
                  product.city ||
                  'Chhatrapati Sambhajinagar';

                return (
                  <Link
                    key={product.id}
                    href={getProductUrl(product)}
                    className="group block"
                  >
                    <div className="rounded-2xl bg-white border border-gray-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col">
                      <div className="relative h-48 overflow-hidden bg-gray-100">
                        <CommodityImage
                          src={product.hero_image_url || product.image}
                          category={sectorInfo.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute bottom-3 right-3 z-10">
                          <FavoriteButton 
                            product={{
                              id: product.id,
                              title: product.title || product.name,
                              price: product.base_price_per_unit || product.price,
                              unit: product.unit_label || product.unit,
                              image: product.hero_image_url || product.image,
                              slug: product.slug || product.id,
                              url: getProductUrl(product),
                              sector: sectorInfo.name
                            }} 
                            size="small" 
                          />
                        </div>
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
                        <p className="mt-2 text-xs text-gray-500 truncate">
                          <span className="font-semibold text-gray-700">{supplierName}</span> • {city}
                        </p>

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
                            Get Quote
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Industry SEO Guide & Procurement FAQs */}
          <div className="mt-16 bg-white rounded-2xl border border-gray-200 p-6 sm:p-10 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              B2B Sourcing Guide for {sectorInfo.name} in India
            </h2>
            <p className="text-gray-600 leading-relaxed text-sm sm:text-base mb-8">
              B2B India provides an end-to-end digital procurement highway for {sectorInfo.name}. Directly connect with verified domestic manufacturers, tier-1 suppliers, and exporters across India. Eliminate middlemen margins, receive 100% compliant GST input tax credit invoices, and protect capital with milestone-based escrow clearing.
            </p>

            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions (FAQs)
            </h3>
            <div className="space-y-4">
              {sectorFaqs.map((faq, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <h4 className="font-bold text-gray-900 text-base mb-1.5">{faq.question}</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
