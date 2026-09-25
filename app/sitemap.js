// ============================================================================
// B2B INDIA — DYNAMIC XML SITEMAP GENERATOR
// ============================================================================
// Programmatically feeds all dynamic product URLs, 38 sector catalogs,
// supplier profiles, and landing pages to Google Search Console for #1 Indexing.
// ============================================================================

import { getAllProducts, getAllSectors, getProductSlug } from '../utils/catalogResolver.js';
import { getSiteUrl } from '../utils/seoUtils.js';

export const revalidate = 43200; // 12-hour Edge ISR caching for instant sub-50ms crawler delivery

export default async function sitemap() {
  const baseUrl = getSiteUrl();
  const now = new Date();

  // 1. Static Core Platform Pages (Public, High-Value Indexable Content Only)
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
      url: `${baseUrl}/cookie`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.4,
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

  // 4. Verified Supplier Profiles (Only Real, Active Supplier UUIDs)
  const verifiedSupplierIds = [
    '114f0006-bdd3-430d-95ba-0f9df91aa7eb',
    'ccbc1c96-b165-4afa-87af-fb9a82571c03',
    '4cd41f3d-9df5-4c26-a0d2-acfee02ee9af',
    '1d1fb33d-8485-4271-b201-3ff2f0690438',
    '28a27773-226e-427d-835d-7c8d5e3036a8',
    '289357d9-4214-4aca-8452-5b578a812397',
    'bc09a874-61f8-416b-8115-d14011382a9e',
    '3bf5b8ca-c730-4674-a2b2-b5e9a8a2d9fe',
    'bf79d26b-1e7c-4132-8a27-28886395dee0',
    'b09ec205-1e0e-45bc-9e87-62d0eb31c0e9',
    'fdc86fa7-5fbd-4efd-b88f-fb314514f93e',
    '5b1eee7b-7aea-4926-bb15-503779e62c58',
    '6751b2de-2e22-45f4-bc21-561da57f5566',
  ];

  // Collect unique supplier IDs from catalog products
  products.forEach((p) => {
    const sId = p.supplier_id?.id;
    if (sId && !sId.startsWith('demo-') && !verifiedSupplierIds.includes(sId)) {
      verifiedSupplierIds.push(sId);
    }
  });

  const supplierPages = verifiedSupplierIds.map((sId) => ({
    url: `${baseUrl}/directory/supplier/${sId}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.75,
  }));

  return [...staticPages, ...sectorPages, ...productPages, ...supplierPages];
}
