import { NextResponse } from 'next/server';
import { getAllProducts, getProductSlug } from '@/utils/catalogResolver.js';
import { getSiteUrl } from '@/utils/seoUtils.js';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // 1 hour cache

function escapeXml(unsafe) {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Google Merchant Center Standard XML Product Feed
 * Compatible with Google Shopping & Surfaces Across Google (Free Listings).
 * Feed URL: https://b2bindia.site/api/feeds/google-merchant
 */
export async function GET() {
  try {
    const baseUrl = getSiteUrl();
    const products = await getAllProducts();

    const itemsXml = products
      .map((prod) => {
        const id = escapeXml(prod.id || `prod-${Math.random().toString(36).substr(2, 9)}`);
        const title = escapeXml(prod.title || 'Wholesale Industrial Product');
        const description = escapeXml(
          prod.description ||
            `Buy wholesale ${prod.title || 'products'} direct from verified Indian suppliers on B2B India. Factory direct wholesale pricing with GST invoice.`
        );
        const slug = getProductSlug(prod);
        const link = `${baseUrl}/directory/product/${slug}`;
        const imageLink = escapeXml(
          prod.hero_image_url ||
            (Array.isArray(prod.gallery_image_urls) && prod.gallery_image_urls[0]) ||
            `${baseUrl}/og-image.png`
        );
        const priceNum = Number(prod.base_price_per_unit || prod.price || 100).toFixed(2);
        const price = `${priceNum} INR`;
        const sectorName = escapeXml(
          (prod.sector_id && prod.sector_id.name) || prod.category || 'Wholesale & Industrial Supplies'
        );
        const brand = escapeXml(
          (prod.supplier_id && prod.supplier_id.company_name) || 'B2B India'
        );

        return `    <item>
      <g:id>${id}</g:id>
      <g:title>${title}</g:title>
      <g:description>${description}</g:description>
      <g:link>${link}</g:link>
      <g:image_link>${imageLink}</g:image_link>
      <g:condition>new</g:condition>
      <g:availability>in_stock</g:availability>
      <g:price>${price}</g:price>
      <g:brand>${brand}</g:brand>
      <g:product_type>${sectorName}</g:product_type>
      <g:identifier_exists>no</g:identifier_exists>
    </item>`;
      })
      .join('\n');

    const feedXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>B2B India — Wholesale Product Catalog Feed</title>
    <link>${baseUrl}</link>
    <description>Verified B2B wholesale marketplace catalog for Google Merchant Center and Free Google Shopping Listings.</description>
${itemsXml}
  </channel>
</rss>`;

    return new NextResponse(feedXml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Error generating Google Merchant feed:', error);
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Error</title></channel></rss>`,
      {
        status: 500,
        headers: { 'Content-Type': 'application/xml; charset=utf-8' },
      }
    );
  }
}
