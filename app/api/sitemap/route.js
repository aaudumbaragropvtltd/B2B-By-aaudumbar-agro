import { NextResponse } from 'next/server';
import { getAllProductSlugs } from '@/utils/seoUtils';

/**
 * Generate a dynamic sitemap.xml for SEO.
 * Includes homepage, directory, and all product pages.
 */
export async function GET(request) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://b2bindia.site';
  const urls = [];

  // Core site URLs
  urls.push({ loc: `${baseUrl}/`, lastmod: new Date().toISOString() });
  urls.push({ loc: `${baseUrl}/directory`, lastmod: new Date().toISOString() });
  urls.push({ loc: `${baseUrl}/about`, lastmod: new Date().toISOString() });

  // Dynamic product URLs
  try {
    const slugs = await getAllProductSlugs(); // expects array of strings
    for (const slug of slugs) {
      urls.push({ loc: `${baseUrl}/directory/product/${slug}`, lastmod: new Date().toISOString() });
    }
  } catch (e) {
    console.error('Failed to fetch product slugs for sitemap', e);
  }

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
    .map(
      (u) =>
        `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>`
    )
    .join('\n')}
</urlset>`;

  return new NextResponse(sitemapXml, {
    status: 200,
    headers: { 'Content-Type': 'application/xml' },
  });
}
