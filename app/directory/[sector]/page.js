// ============================================================================
// SECTOR-SPECIFIC DIRECTORY PAGE — PROGRAMMATIC B2B SEO & CONVERSION ENGINE
// ============================================================================
// Dynamic route for all 38 industry sectors in India.
// Outranks legacy directories (IndiaMART, TradeIndia) with:
// - Formulaic High-CTR Metadata & Headings (Bulk Suppliers, Wholesale Rates, Manufacturers)
// - Transparent Volume Pricing Slabs Matrix (Breaks competitor phone spam trap)
// - 1-Click Reverse-Auction RFQ Engine
// - Rich Semantic Sourcing Guide with In-Depth Technical Testing Standards
// - Complete Schema.org Structured Data (CollectionPage, ItemList, Breadcrumbs, FAQPage)
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

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getSectorInfo(slug) {
  const dynamicBanner = await getSectorBanner(slug);
  const found = STATIC_SECTORS.find((s) => s.slug === slug || s.slug.replace(/-/g, '_') === slug);
  const cleanName = found?.name || slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    name: dynamicBanner?.name || cleanName,
    slug: slug,
    hero_image_url: dynamicBanner?.hero_image_url || 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1600',
    subtitle: dynamicBanner?.subtitle || `Source verified ${cleanName} in bulk directly from primary Indian manufacturers. Transparent wholesale pricing, verified GSTIN credentials, and 100% Escrow payment protection.`,
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
      answer: `You can browse verified Indian manufacturers and primary mills in ${sectorInfo.name}, compare transparent wholesale price quotes, check Minimum Order Quantities (MOQ), and initiate direct RFQs or escrow-secured orders with full GST tax invoices.`,
    },
    {
      question: `How does B2B India's Escrow Protection safeguard ${sectorInfo.name} orders?`,
      answer: `Unlike traditional directories where buyers pay upfront to unverified sellers, B2B India holds order funds securely in an automated escrow account. Funds are released to the manufacturer only after third-party quality inspection and warehouse delivery confirmation.`,
    },
    {
      question: `Are manufacturers in ${sectorInfo.name} GST verified with lab certifications?`,
      answer: `Yes, 100% of suppliers undergo rigorous credential verification including active GSTIN registration, MSME Udyam status, factory physical verification, and mandated compliance standards (BIS, FSSAI, ISO, CE, or WHO-GMP).`,
    },
    {
      question: `What are the typical Minimum Order Quantities (MOQ) and sample order policies?`,
      answer: `MOQs vary by product category, ranging from small trial batches (e.g. 50-100 units or 500kg) up to full truckload (FTL) and multi-tonnage consignments. Most suppliers provide paid sample runs with sample cost credited against the first commercial order.`,
    },
    {
      question: `How does B2B India differ from IndiaMART or TradeIndia for ${sectorInfo.name}?`,
      answer: `Legacy platforms act as lead-generation brokers that sell your phone number to dozens of unverified agents, resulting in unwanted cold calls and advance payment risks. B2B India is an end-to-end transactional marketplace offering public price slabs, verified supplier identity, and zero-risk escrow checkout.`,
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
        <div className="relative min-h-[320px] sm:min-h-[380px] overflow-hidden flex flex-col justify-end">
          <CommodityImage
            src={sectorInfo.hero_image_url}
            category={sectorInfo.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/30" />
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
            <Breadcrumbs
              variant="transparent"
              items={[
                { label: 'Home', href: '/' },
                { label: 'Directory', href: '/directory' },
                { label: sectorInfo.name },
              ]}
              className="mb-3"
            />
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-semibold backdrop-blur mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              {sectorInfo.badge_text}
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white drop-shadow-md tracking-tight leading-tight">
              {sectorInfo.name} — Wholesale Manufacturers & Bulk Suppliers
            </h1>
            <p className="text-white/85 mt-2.5 text-sm sm:text-base max-w-3xl leading-relaxed">
              {sectorInfo.subtitle}
            </p>

            {/* High-Intent Trust Badges Strip */}
            <div className="mt-6 flex flex-wrap items-center gap-3 text-xs sm:text-sm text-white/90">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur border border-white/15">
                <span className="text-emerald-400 font-bold">🛡️</span>
                <span>100% Escrow Payment Protection</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur border border-white/15">
                <span className="text-blue-400 font-bold">📜</span>
                <span>Verified GSTIN & MSME Suppliers</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur border border-white/15">
                <span className="text-amber-400 font-bold">🏭</span>
                <span>Direct Primary Factory Supply</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur border border-white/15">
                <span className="text-purple-400 font-bold">⚡</span>
                <span>4-Hour Live RFQ Reverse Auction</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

          {/* Transparent Wholesale Pricing Tier Matrix */}
          <div className="mb-10 bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-gray-100 pb-5">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
                  Volume Pricing Transparency
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
                  Wholesale Procurement Tiers & Volume Slabs
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  No hidden rates or unsolicited sales phone calls. Select your order volume to unlock direct factory pricing.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                  ✓ Verified Escrow Clearing
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Slab 1 */}
              <div className="p-5 rounded-xl bg-gray-50 border border-gray-200 flex flex-col justify-between hover:border-brand-500 transition-colors">
                <div>
                  <span className="px-2.5 py-0.5 rounded-md bg-gray-200 text-gray-800 text-[11px] font-bold uppercase">
                    Tier 1: Pilot / Trial Batch
                  </span>
                  <h3 className="text-lg font-bold text-gray-900 mt-2">1x – 5x Listed MOQ</h3>
                  <p className="text-xs text-gray-600 mt-1">
                    Ideal for sample validation, regional retailers, and initial quality batch testing.
                  </p>
                  <ul className="mt-4 space-y-1.5 text-xs text-gray-600">
                    <li>• Standard Factory Wholesale Base Rate</li>
                    <li>• 100% Escrow Milestone Protection</li>
                    <li>• Standard Transit Packaging</li>
                    <li>• GST Tax Invoice Included</li>
                  </ul>
                </div>
                <div className="mt-5 pt-3 border-t border-gray-200 flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500">Rate: Catalog Price</span>
                  <span className="text-xs font-bold text-emerald-600">Safe Pilot Sourcing</span>
                </div>
              </div>

              {/* Slab 2 */}
              <div className="p-5 rounded-xl bg-brand-50/60 border border-brand-200 flex flex-col justify-between hover:border-brand-500 transition-colors relative">
                <div className="absolute -top-3 right-4 px-2 py-0.5 rounded-full bg-brand-600 text-white text-[10px] font-bold shadow-sm">
                  Most Popular
                </div>
                <div>
                  <span className="px-2.5 py-0.5 rounded-md bg-brand-100 text-brand-800 text-[11px] font-bold uppercase">
                    Tier 2: Commercial Distribution
                  </span>
                  <h3 className="text-lg font-bold text-gray-900 mt-2">6x – 25x Listed MOQ</h3>
                  <p className="text-xs text-gray-600 mt-1">
                    Suited for regional distributors, institutional contractors, and manufacturing lines.
                  </p>
                  <ul className="mt-4 space-y-1.5 text-xs text-gray-600">
                    <li>• <strong>3% to 7% Volume Discount</strong> on base quote</li>
                    <li>• Priority Warehouse Dispatch (24-48h)</li>
                    <li>• Batch Certificate of Analysis (COA) / Mill Test</li>
                    <li>• Dedicated B2B Logistics Route Support</li>
                  </ul>
                </div>
                <div className="mt-5 pt-3 border-t border-brand-200 flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500">Rate: Volume Discounted</span>
                  <span className="text-xs font-bold text-brand-700">Commercial Margin</span>
                </div>
              </div>

              {/* Slab 3 */}
              <div className="p-5 rounded-xl bg-gray-50 border border-gray-200 flex flex-col justify-between hover:border-brand-500 transition-colors">
                <div>
                  <span className="px-2.5 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[11px] font-bold uppercase">
                    Tier 3: Full Truckload (FTL / Contract)
                  </span>
                  <h3 className="text-lg font-bold text-gray-900 mt-2">26x+ MOQ / Container Loads</h3>
                  <p className="text-xs text-gray-600 mt-1">
                    Direct primary rolling mill and plant dispatch for enterprise procurement and exporters.
                  </p>
                  <ul className="mt-4 space-y-1.5 text-xs text-gray-600">
                    <li>• <strong>Net Factory Mill Pricing</strong> (Zero intermediary margin)</li>
                    <li>• Third-Party Inspection Support (SGS / TUV)</li>
                    <li>• Custom Bulk Packaging & Export Branding</li>
                    <li>• Flexible Staged Milestone Escrow</li>
                  </ul>
                </div>
                <div className="mt-5 pt-3 border-t border-gray-200 flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500">Rate: Custom Mill Bid</span>
                  <span className="text-xs font-bold text-purple-700">Enterprise Scale</span>
                </div>
              </div>
            </div>
          </div>

          {/* Reverse-Auction RFQ Callout Banner */}
          <div className="mb-10 rounded-2xl bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 p-6 sm:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg border border-white/10">
            <div className="max-w-2xl">
              <span className="inline-block px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-bold uppercase tracking-wider mb-2 border border-brand-400/30">
                ⚡ Reverse-Auction Sourcing Engine
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                Suppliers Compete For Your {sectorInfo.name} Requirement
              </h2>
              <p className="mt-1.5 text-white/80 text-sm leading-relaxed">
                Post your target quantity, required technical grade, and delivery pincode. Verified manufacturers submit competitive bids within 4 hours. No broker spam or unsolicited phone calls.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0">
              <Link
                href="/directory"
                className="w-full sm:w-auto text-center px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-md transition-all duration-200"
              >
                Post Live Buy RFQ
              </Link>
              <a
                href="tel:+919226497450"
                className="w-full sm:w-auto text-center px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm border border-white/20 transition-colors"
              >
                Call Desk: +91-9226497450
              </a>
            </div>
          </div>

          {/* Product Catalog Grid Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Verified Products & Manufacturers ({products.length})
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Real-time wholesale factory rates with instant quotation, sample requests, and Escrow checkout
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
                Products currently being verified for {sectorInfo.name}
              </h3>
              <p className="text-gray-500 max-w-md mx-auto mb-6 text-sm">
                Manufacturers in this category are undergoing credential audits. Submit an RFQ to receive immediate factory quotes.
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
                              sector: sectorInfo.name,
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
                            View MOQ & Quotes
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Semantic Sourcing & Buying Guide */}
          <div className="mt-16 bg-white rounded-2xl border border-gray-200 p-6 sm:p-10 shadow-sm">
            <div className="border-b border-gray-100 pb-5 mb-8">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
                Comprehensive B2B Sourcing Playbook
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1">
                Wholesale Market Sourcing Guide for {sectorInfo.name} in India
              </h2>
              <p className="text-gray-600 text-sm sm:text-base mt-2 leading-relaxed">
                Navigating bulk procurement in India requires verified compliance, clear volume thresholds, and absolute capital security. This guide outlines how corporate procurement teams, wholesalers, and exporters source {sectorInfo.name} efficiently on B2B India.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              <div className="p-6 rounded-xl bg-gray-50 border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <span className="text-brand-600">📊</span> Current Wholesale Pricing Trends & Slabs
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Wholesale prices in {sectorInfo.name} fluctuate based on primary raw material rates, energy tariffs, and seasonal domestic demand. On B2B India, products are listed with verified ex-factory base rates rather than inflated broker margins. Volume slabs ensure buyers securing full truckloads (FTL) or monthly recurring contracts receive direct mill discounts.
                </p>
              </div>

              <div className="p-6 rounded-xl bg-gray-50 border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <span className="text-brand-600">🔬</span> Quality Standards & Mandated Testing
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Every batch of {sectorInfo.name} listed on the platform adheres to national and global standards (BIS, FSSAI, ISO 9001, CE, or WHO-GMP). Manufacturers provide authentic Certificates of Analysis (COA) or Mill Test Certificates (MTC) with each shipment. Third-party testing can be requested prior to final escrow settlement.
                </p>
              </div>

              <div className="p-6 rounded-xl bg-gray-50 border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <span className="text-brand-600">🚚</span> Minimum Order Quantities (MOQ) & Dispatch SLAs
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Standard MOQs are clearly demarcated on product cards to prevent mismatched expectations. Suppliers maintain ready inventory for rapid 24 to 72 hour dispatch across all major industrial freight corridors in Maharashtra, Gujarat, Tamil Nadu, NCR, and Telangana.
                </p>
              </div>

              <div className="p-6 rounded-xl bg-gray-50 border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <span className="text-brand-600">🛡️</span> How Escrow Eliminates Advance Payment Fraud
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Traditional directories like IndiaMART and TradeIndia operate on an unverified lead-distribution model, where buyers risk losing advances to fraudulent shell companies. B2B India locks order funds in escrow until the physical consignment reaches your destination and passes inspection.
                </p>
              </div>
            </div>

            {/* Procurement FAQs */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span>❓</span> Frequently Asked Questions (FAQs)
              </h3>
              <div className="space-y-4">
                {sectorFaqs.map((faq, idx) => (
                  <div key={idx} className="p-5 rounded-xl bg-gray-50 border border-gray-100 hover:border-gray-200 transition-colors">
                    <h4 className="font-bold text-gray-900 text-base mb-1.5">{faq.question}</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </>
  );
}
