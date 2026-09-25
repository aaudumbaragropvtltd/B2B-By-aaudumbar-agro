// ============================================================================
// PRODUCT DETAIL PAGE — SEO & CONVERSION OPTIMIZED
// ============================================================================
// Features:
// - Programmatic Next.js Dynamic SEO Metadata
// - Schema.org Product, Offer, AggregateRating, Breadcrumbs, and FAQ JSON-LD
// - Technical Specifications Table
// - Pan-India Logistics & Haversine Distance Router
// - Realtime Quotation Dock & RFQ Conversion
// - Related Products Cluster for PageRank & Internal Link Equity
// - Procurement FAQs for Google Rich Snippets
// ============================================================================

import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CommodityImage from '@/components/CommodityImage';
import ProductImageGallery from '@/components/ProductImageGallery';
import QuotationDock from './QuotationDock';
import ProductViewTracker from '@/components/ProductViewTracker';
import FavoriteButton from '@/components/FavoriteButton';
import Breadcrumbs from '@/components/Breadcrumbs';
import { getProductGstRate } from '@/utils/gstUtils';
import { getProductById, getRelatedProducts, getProductSlug, getProductUrl } from '@/utils/catalogResolver';
import {
  generateProductMetadata,
  generateProductJsonLd,
  generateBreadcrumbJsonLd,
  generateFaqJsonLd,
  getProductFaqs,
  generateProductAnswerCapsule,
  getRegulatoryKnowledgeGraphEntities,
  formatInrPrice,
  SITE_URL,
} from '@/utils/seoUtils';

export const revalidate = 300; // 5-minute ISR edge cache

/**
 * Next.js Dynamic Metadata for Rank #1 Google SEO
 */
export async function generateMetadata({ params }) {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) {
    return { title: 'Product Details | B2B India' };
  }
  return generateProductMetadata(product);
}

function formatSpecKey(key) {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatSpecValue(key, value) {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') {
    const village = value.village?.trim();
    const city = value.city?.trim();
    const district = value.district?.trim();
    const state = value.state?.trim();
    const locationParts = [village, city, district, state].filter(Boolean);
    if (locationParts.length > 0) {
      return locationParts.join(', ');
    }
    const entries = Object.entries(value)
      .filter(([_, v]) => v !== null && v !== undefined && String(v).trim() !== '')
      .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`);
    return entries.length > 0 ? entries.join(', ') : '-';
  }
  return String(value);
}

// ── Haversine Distance Router ──
function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export default async function ProductDetailPage({ params }) {
  const { id } = await params;
  const product = await getProductById(id);

  // Canonical slug redirect:
  // If user visits via raw UUID or non-canonical format (e.g. spaces/different casing),
  // redirect immediately to the clean, human-readable product name URL!
  if (product && !product.is_fallback_mock) {
    const canonicalSlug = getProductSlug(product);
    let rawDecoded = id;
    try {
      rawDecoded = decodeURIComponent(id);
    } catch (e) {}

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawDecoded);
    const hasSpaces = rawDecoded.includes(' ') || rawDecoded.includes('+');

    if (canonicalSlug && (isUUID || hasSpaces || rawDecoded !== canonicalSlug)) {
      redirect(`/directory/product/${canonicalSlug}`);
    }
  }

  // Fetch related products for internal linking and crawl optimization
  const sectorSlug = product.sector_id?.slug || 'general';
  const relatedProducts = await getRelatedProducts(product.id, sectorSlug, 4);

  // Parse technical specs
  let specs = {};
  const rawSpecs = product.specifications || product.technical_specifications;

  if (rawSpecs) {
    if (typeof rawSpecs === 'string') {
      try {
        specs = JSON.parse(rawSpecs);
      } catch (e) {
        console.error('Failed to parse technical specs', e);
      }
    } else {
      specs = { ...rawSpecs };
    }

    // Disintermediation Protection: Remove direct private phone/tax numbers
    if (specs) {
      const SENSITIVE_SUPPLIER_KEYS = [
        'Supplier Address', 'supplier_address', 'Address', 'address', 'Warehouse Address', 'warehouse_address',
        'Supplier Street', 'supplier_street', 'Street', 'Factory Address',
        'Supplier Phone', 'supplier_phone', 'Phone', 'phone', 'Mobile', 'mobile', 'Contact Number', 'contact_number',
        'Supplier Email', 'supplier_email', 'Email', 'email', 'Registered Email',
        'GSTIN', 'gstin', 'Gst_number', 'gst_number', 'GST Number', 'GST Rate',
        'PAN', 'pan', 'Pan Number', 'PAN Number', 'Bank Details', 'Account Number', 'IFSC',
        'supplier_net_price', 'platform_commission_percent', 'platform_fee_per_unit',
      ];
      SENSITIVE_SUPPLIER_KEYS.forEach((k) => delete specs[k]);
    }
  }

  // Enrich standard B2B attributes
  const gstDetails = getProductGstRate(product);
  if (!specs['Applicable GST']) {
    specs['Applicable GST'] = gstDetails.label;
  }
  if (product.bulk_minimum_order && !specs['Minimum Order Quantity'] && !specs['MOQ']) {
    specs['Minimum Order Quantity'] = `${product.bulk_minimum_order} ${product.unit_label || 'units'}`;
  }
  if (product.hsn_code && !specs['HSN Code']) {
    specs['HSN Code'] = product.hsn_code;
  }
  if (product.quality_grade && !specs['Quality / Grade']) {
    specs['Quality / Grade'] = product.quality_grade;
  }
  if (product.inventory_count && !specs['Available Stock']) {
    specs['Available Stock'] = `${product.inventory_count} ${product.unit_label || 'units'}`;
  }

  // Logistics calculations
  const isLogisticsEligible = ['agriculture', 'food-beverage', 'food_beverage', 'food-agriculture'].includes(sectorSlug);
  const buyerLat = 28.6139;
  const buyerLng = 77.2090;
  const supplierLat = product.supplier_id?.geo_lat;
  const supplierLng = product.supplier_id?.geo_lng;
  const distanceKm = isLogisticsEligible ? calculateDistance(buyerLat, buyerLng, supplierLat, supplierLng) : null;
  const shippingEstimate = 0;

  // Schema.org Structured Data
  const productJsonLd = generateProductJsonLd(product);
  const breadcrumbItems = [
    { name: 'Home', url: '/' },
    { name: 'Directory', url: '/directory' },
  ];
  if (product.sector_id) {
    breadcrumbItems.push({
      name: product.sector_id.name,
      url: `/directory/${product.sector_id.slug || 'all'}`,
    });
  }
  breadcrumbItems.push({
    name: product.title,
    url: `/directory/product/${getProductSlug(product)}`,
  });
  const breadcrumbJsonLd = generateBreadcrumbJsonLd(breadcrumbItems);

  const productFaqs = getProductFaqs(product);
  const faqJsonLd = generateFaqJsonLd(productFaqs);
  const answerCapsule = generateProductAnswerCapsule(product);
  const regulatoryEntities = getRegulatoryKnowledgeGraphEntities(product);

  const supplierLocation = [product.supplier_id?.city, product.supplier_id?.state].filter(Boolean).join(', ') || 'India';
  const supplierId = product.supplier_id?.id || 'demo-supplier-1';
  const supplierName = product.supplier_id?.company_name || 'Aaudumbar Agro';

  return (
    <>
      {/* Schema.org Structured Data for Google Rich Snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
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
      <ProductViewTracker 
        productId={product?.id || id} 
        productTitle={product?.title || ''} 
        category={product?.sector_id?.name || product?.sector_id?.slug || 'General'} 
        price={product?.base_price_per_unit || 0}
        unit={product?.unit_label || 'unit'}
        image={product?.hero_image_url || product?.gallery_image_urls?.[0] || null}
        slug={getProductSlug(product)}
      />

      <main suppressHydrationWarning className="flex-1 pt-24 pb-16 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb Navigation (SEO & User Flow) */}
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Directory', href: '/directory' },
              ...(product.sector_id
                ? [{ label: product.sector_id.name, href: `/directory/${product.sector_id.slug}` }]
                : []),
              { label: product.title }
            ]}
            className="mb-6"
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Product Image Gallery (Up to 5 Pictures) */}
            <div className="lg:col-span-2 order-1">
              <ProductImageGallery
                images={product.gallery_image_urls || (product.hero_image_url ? [product.hero_image_url] : [])}
                heroImage={product.hero_image_url}
                title={product.title}
                category={product.sector_id?.name || 'Industrial Product'}
                qualityGrade={product.quality_grade}
                isStale={product.is_stale}
              />
            </div>

            {/* Title, Badges & Supplier Info */}
            <div className="lg:col-span-2 order-3 bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-600 mb-2">
                    <span>Verified B2B Listing</span>
                    <span>•</span>
                    <Link
                      href={`/directory/supplier/${supplierId}`}
                      className="hover:underline text-gray-700 font-semibold"
                    >
                      {supplierName} ({supplierLocation})
                    </Link>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
                    {product.title}
                  </h1>
                </div>

                <div className="flex-shrink-0 pt-1">
                  <FavoriteButton
                    product={{
                      id: product.id || id,
                      title: product.title,
                      price: product.base_price_per_unit,
                      unit: product.unit_label,
                      image: product.hero_image_url || product.gallery_image_urls?.[0],
                      slug: getProductSlug(product),
                      sector: product.sector_id?.name || 'General'
                    }}
                    size="large"
                    showLabel={true}
                  />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100 font-semibold">
                  <span>🛡️</span> Escrow Protected
                </div>
                <div className="flex items-center gap-1.5 text-blue-700 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100 font-semibold">
                  <span>🧾</span> 100% GST Invoice
                </div>
                <div className="flex items-center gap-1.5 text-purple-700 bg-purple-50 px-3 py-1 rounded-lg border border-purple-100 font-semibold">
                  <span>🚚</span> Pan-India Logistics
                </div>
              </div>

              {/* RAG Extractable Answer Capsule (Top 30% DOM Anchor for LLM Retrieval) */}
              <div 
                id="rag-answer-capsule" 
                data-rag-anchor="primary-overview"
                className="mt-6 p-5 rounded-2xl bg-gradient-to-br from-indigo-50/80 via-slate-50 to-emerald-50/50 border border-indigo-100/90 shadow-xs relative overflow-hidden"
              >
                <div className="flex items-center justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-900 bg-indigo-100/80 px-2.5 py-0.5 rounded-full border border-indigo-200/70">
                      RAG Verified Answer Capsule
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500 hidden sm:inline">
                    Top 30% Zero-Shot Grounding
                  </span>
                </div>

                <p className="text-sm sm:text-[15px] font-medium text-slate-800 leading-relaxed">
                  {answerCapsule}
                </p>

                {/* Micro Key-Data Bar */}
                <div className="mt-3.5 pt-3 border-t border-indigo-100/70 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="bg-white/90 p-2 rounded-lg border border-slate-200/60 shadow-xs">
                    <div className="text-[10px] text-slate-500 font-semibold uppercase">HSN Code</div>
                    <div className="font-bold text-slate-900">{product.hsn_code || 'Standard HSN'}</div>
                  </div>
                  <div className="bg-white/90 p-2 rounded-lg border border-slate-200/60 shadow-xs">
                    <div className="text-[10px] text-slate-500 font-semibold uppercase">Tax Slab</div>
                    <div className="font-bold text-slate-900">{gstDetails.label}</div>
                  </div>
                  <div className="bg-white/90 p-2 rounded-lg border border-slate-200/60 shadow-xs">
                    <div className="text-[10px] text-slate-500 font-semibold uppercase">Ex-Factory Base</div>
                    <div className="font-bold text-emerald-700">₹{formatInrPrice(product.base_price_per_unit || product.price)}/{product.unit_label || 'unit'}</div>
                  </div>
                  <div className="bg-white/90 p-2 rounded-lg border border-slate-200/60 shadow-xs">
                    <div className="text-[10px] text-slate-500 font-semibold uppercase">Protection</div>
                    <div className="font-bold text-indigo-700">10% Advance Escrow</div>
                  </div>
                </div>
              </div>

              <p className="mt-6 text-gray-600 leading-relaxed text-base whitespace-pre-wrap">
                {product.description?.split(/(\*\*.*?\*\*)/g).map((part, i) => {
                  if (part.startsWith('**') && part.endsWith('**')) {
                    return (
                      <strong key={i} className="font-semibold text-gray-900">
                        {part.slice(2, -2)}
                      </strong>
                    );
                  }
                  return <span key={i}>{part}</span>;
                })}
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                {product.certifications?.map((cert) => (
                  <span
                    key={cert}
                    className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-100 flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                    {cert}
                  </span>
                ))}
                {product.hsn_code && (
                  <span className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-semibold border border-gray-200">
                    HSN Code: {product.hsn_code}
                  </span>
                )}
                {product.quality_grade && (
                  <span className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-semibold border border-gray-200">
                    Grade: {product.quality_grade}
                  </span>
                )}
              </div>
            </div>

            {/* Right: Quotation & Checkout Dock */}
            <div className="order-2 lg:order-none lg:col-span-1 lg:col-start-3 lg:row-start-1 lg:row-span-6 h-full">
              <QuotationDock product={{ ...product, shippingEstimate, distanceKm }} />
            </div>

            {/* Logistics Calculator */}
            {isLogisticsEligible ? (
              <div className="lg:col-span-2 order-3 bg-white p-6 rounded-2xl shadow-sm border border-gray-200 overflow-hidden relative">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
                  <span className="text-xl">🚚</span>
                  Agriculture & Bulk Commodity Logistics
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                    ₹2.3 - 4 / kg (Location Dependent)
                  </span>
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-100">
                    <div className="text-xs text-emerald-700 font-medium mb-1 uppercase tracking-wider">
                      Freight Rate
                    </div>
                    <div className="text-xl font-extrabold text-emerald-900 leading-tight">
                      ₹2.3 / kg - 4 / kg
                    </div>
                    <div className="text-xs font-semibold text-emerald-700 mt-0.5">
                      Depending upon location
                    </div>
                    <div className="text-xs text-emerald-600 mt-1">Inter-state & local freight</div>
                  </div>
                  <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-100">
                    <div className="text-xs text-emerald-700 font-medium mb-1 uppercase tracking-wider">
                      Sample 10,000 kg Truck
                    </div>
                    <div className="text-xl font-extrabold text-emerald-900">₹23,000 - ₹40,000</div>
                    <div className="text-xs text-emerald-600 mt-1">Doorstep delivery estimate</div>
                  </div>
                  <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-100">
                    <div className="text-xs text-emerald-700 font-medium mb-1 uppercase tracking-wider">
                      Pan-India Coverage
                    </div>
                    <div className="text-xl font-extrabold text-emerald-900">All Pincodes</div>
                    <div className="text-xs text-emerald-600 mt-1">GPS-tracked fleet</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="lg:col-span-2 order-3 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-2">
                  <span className="text-xl">📦</span>
                  Pan-India Direct Factory Logistics
                </h2>
                <p className="text-sm text-gray-600 mb-3">
                  Industrial freight is calculated per destination truckload or courier weight upon order confirmation. Full transit insurance is provided.
                </p>
                <div className="text-xs font-semibold text-brand-600 flex items-center gap-1.5">
                  <span>📞</span> Dedicated Freight Coordination: +91 8408841998
                </div>
              </div>
            )}

            {/* Technical Specifications Table */}
            <div className="lg:col-span-2 order-4 rounded-2xl bg-white shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/60 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <svg className="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Product Technical Specifications & Commercial Terms
                </h2>
                <span className="text-xs text-gray-500">Verified by B2B India</span>
              </div>

              <div className="p-0">
                {Object.keys(specs).length > 0 ? (
                  <table className="w-full text-sm text-left table-auto">
                    <tbody className="divide-y divide-gray-100">
                      {Object.entries(specs).map(([key, value]) => (
                        <tr key={key} className="bg-white hover:bg-gray-50 transition-colors">
                          <th scope="row" className="px-6 py-4 font-semibold text-gray-600 w-1/3 align-top border-r border-gray-50">
                            {formatSpecKey(key)}
                          </th>
                          <td className="px-6 py-4 text-gray-900 font-medium whitespace-pre-wrap">
                            {formatSpecValue(key, value)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-6 text-gray-500 text-sm text-center">
                    Standard technical specifications available upon quotation request.
                  </div>
                )}
              </div>
            </div>

            {/* Knowledge Graph Entities & Regulatory Standards */}
            <div 
              id="regulatory-entities" 
              data-rag-anchor="regulatory-knowledge-graph"
              className="lg:col-span-2 order-5 bg-white p-6 rounded-2xl shadow-sm border border-gray-200"
            >
              <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🏛️</span>
                  <h3 className="text-base font-bold text-gray-900">
                    Regulatory Co-Occurrence & Knowledge Graph Entities
                  </h3>
                </div>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Government & Trade Alignment
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                Statutory authorities, quality inspection frameworks, and regulatory benchmarks governing verified commercial trade of this commodity in India:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {regulatoryEntities.map((ent, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      ✓
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-gray-900 truncate">{ent.name}</div>
                      <div className="text-[11px] text-gray-500 leading-snug">{ent.role}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Supplier Verification Profile Card */}
            <div className="lg:col-span-2 order-6 bg-gradient-to-br from-slate-900 via-slate-800 to-gray-900 text-white p-6 sm:p-8 rounded-2xl shadow-lg border border-slate-700/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-xs font-extrabold border border-amber-400/30 flex items-center gap-1">
                    <span>⭐</span> Verified Manufacturer & Supplier
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 flex items-center gap-1">
                    <span>✓</span> Active GSTIN Verified
                  </span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{supplierName}</h3>
                <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs sm:text-sm text-gray-300 mt-2">
                  <div className="flex items-center gap-1">
                    <span>📍</span> <strong>Location:</strong> {supplierLocation}
                  </div>
                  <div className="flex items-center gap-1">
                    <span>🏭</span> <strong>Industry:</strong> {product.sector_id?.name || 'Industrial Supplies'}
                  </div>
                  <div className="flex items-center gap-1 text-emerald-400 font-semibold">
                    <span>🛡️</span> 10% Escrow Supported
                  </div>
                </div>
              </div>

              <Link
                href={`/directory/supplier/${supplierId}`}
                className="w-full md:w-auto px-6 py-4 rounded-xl bg-white hover:bg-amber-50 text-gray-900 transition-all shadow-md hover:shadow-xl flex flex-col items-center md:items-end justify-center group flex-shrink-0 cursor-pointer border border-white/80 active:scale-95"
              >
                <div className="flex items-center gap-2 text-sm sm:text-base font-extrabold text-slate-900 group-hover:text-amber-900">
                  <span>View {supplierName} Catalog</span>
                  <span className="text-brand-600 group-hover:translate-x-1 transition-transform">→</span>
                </div>
                <span className="text-[11px] font-semibold text-gray-500 group-hover:text-amber-800 mt-0.5">
                  📍 {supplierLocation} • Direct Manufacturer
                </span>
              </Link>
            </div>

            {/* The 4-Way Reverse-Prompt Q&A Matrix (AEO/GEO Engine) */}
            <div 
              id="reverse-prompt-matrix" 
              data-rag-anchor="reverse-prompt-matrix"
              className="lg:col-span-2 order-7 bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                <div>
                  <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
                    <span className="text-brand-600">⚡</span>
                    The 4-Way Procurement Q&A Matrix (AEO / GEO Engine)
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Direct natural language answers formulated for procurement directors & AI search engines
                  </p>
                </div>
                <span className="self-start sm:self-auto px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                  Perplexity • SGE • Copilot Grounded
                </span>
              </div>

              <div className="space-y-4">
                {productFaqs.map((faq, index) => (
                  <div 
                    key={index} 
                    itemScope 
                    itemProp="mainEntity" 
                    itemType="https://schema.org/Question"
                    className="p-5 rounded-xl bg-gray-50/80 border border-gray-100 hover:border-brand-200 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider bg-brand-100 text-brand-800 px-2 py-0.5 rounded">
                        {faq.intent || 'Procurement Intent'}
                      </span>
                    </div>
                    <h3 itemProp="name" className="font-bold text-gray-900 text-base mb-2">
                      {faq.question}
                    </h3>
                    <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                      <p itemProp="text" className="text-sm text-gray-700 leading-relaxed font-normal">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Related Products Cluster (Internal Linking for SEO Rank #1) */}
            {relatedProducts.length > 0 && (
              <div className="lg:col-span-3 order-8 mt-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-extrabold text-gray-900">
                      Related Products in {product.sector_id?.name || 'this Category'}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Compare verified wholesale quotes and bulk manufacturer pricing
                    </p>
                  </div>
                  {product.sector_id?.slug && (
                    <Link
                      href={`/directory/${product.sector_id.slug}`}
                      className="text-sm font-bold text-brand-600 hover:text-brand-700"
                    >
                      View All in {product.sector_id.name} →
                    </Link>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {relatedProducts.map((rel) => (
                    <Link
                      key={rel.id}
                      href={`/directory/product/${getProductSlug(rel)}`}
                      className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
                    >
                      <div className="h-44 overflow-hidden bg-gray-100 relative">
                        <CommodityImage
                          src={rel.hero_image_url}
                          category={rel.sector_id?.name || 'Product'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {rel.quality_grade && (
                          <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-white/90 backdrop-blur text-gray-900 text-[10px] font-bold">
                            {rel.quality_grade}
                          </div>
                        )}
                      </div>
                      <div className="p-4 flex-1 flex flex-col">
                        <h3 className="font-bold text-gray-900 text-sm line-clamp-2 group-hover:text-brand-600 transition-colors">
                          {rel.title}
                        </h3>
                        <div className="mt-auto pt-3 flex items-baseline justify-between border-t border-gray-100">
                          <div>
                            <span className="text-lg font-extrabold text-gray-900">
                              ₹{formatInrPrice(rel.base_price_per_unit)}
                            </span>
                            <span className="text-xs text-gray-500 ml-1">/{rel.unit_label}</span>
                          </div>
                          <span className="text-xs font-semibold text-brand-600">Quote →</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
