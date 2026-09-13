// ============================================================================
// B2B INDIA — DYNAMIC XML SITEMAP GENERATOR
// ============================================================================
// Programmatically feeds all dynamic product URLs, 38 sector catalogs,
// supplier profiles, and landing pages to Google Search Console for #1 Indexing.
// ============================================================================

import { getAllProducts, getAllSectors, getProductSlug } from '../utils/catalogResolver.js';
import { getSiteUrl } from '../utils/seoUtils.js';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate sitemap hourly

export default async function sitemap() {
  const baseUrl = getSiteUrl();
  const now = new Date();

  // 1. Static Core Platform Pages
  const staticPages = [
    {
      url: `${baseUrl}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/directory`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.95,
    },
    {
      url: `${baseUrl}/market-rates`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/orders`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/support`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/shipping-policy`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/refund-policy`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  // 2. All 38 Industry Sectors / Category Pages
  const sectors = getAllSectors();
  const sectorPages = sectors.map((sector) => ({
    url: `${baseUrl}/directory/${sector.slug}`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 0.85,
  }));

  // 3. All Dynamic Products (Database + Static Catalog)
  const products = await getAllProducts();
  const productPages = products.map((prod) => ({
    url: `${baseUrl}/directory/product/${getProductSlug(prod)}`,
    lastModified: prod.updated_at ? new Date(prod.updated_at) : now,
    changeFrequency: 'daily',
    priority: 0.9,
  }));

  // 4. Verified Supplier Profiles
  const supplierIds = ['demo-supplier-1', 's0', 's1', 's2', 's3', 's4'];
  // Also collect any unique supplier IDs from products
  products.forEach((p) => {
    if (p.supplier_id?.id && !supplierIds.includes(p.supplier_id.id)) {
      supplierIds.push(p.supplier_id.id);
    }
  });

  const supplierPages = supplierIds.map((sId) => ({
    url: `${baseUrl}/directory/supplier/${sId}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.75,
  }));

  return [...staticPages, ...sectorPages, ...productPages, ...supplierPages];
}
