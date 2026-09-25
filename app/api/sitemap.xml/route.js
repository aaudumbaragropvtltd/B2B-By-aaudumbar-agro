import { NextResponse } from 'next/server';
import sitemap from '@/app/sitemap';

export const revalidate = 43200;

/**
 * Dynamic XML Sitemap endpoint at /api/sitemap.xml
 * Mirrors app/sitemap.js to support crawlers and GSC submissions configured for /api/sitemap.xml
 */
export async function GET() {
  try {
    const entries = await sitemap();

    const urlElements = entries
      .map((entry) => {
        const lastMod = entry.lastModified
          ? new Date(entry.lastModified).toISOString()
          : new Date().toISOString();
        const freq = entry.changeFrequency || 'daily';
        const prio = typeof entry.priority === 'number' ? entry.priority.toFixed(2) : '0.80';

        return `  <url>
    <loc>${entry.url}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>${freq}</changefreq>
    <priority>${prio}</priority>
  </url>`;
      })
      .join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlElements}
</urlset>`;

    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (err) {
    console.error('Error generating dynamic sitemap in /api/sitemap.xml:', err);
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://www.b2bindia.site</loc></url></urlset>`,
      {
        status: 200,
        headers: { 'Content-Type': 'application/xml; charset=utf-8' },
      }
    );
  }
}

