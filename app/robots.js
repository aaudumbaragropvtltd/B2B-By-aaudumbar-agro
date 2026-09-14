// ============================================================================
// B2B INDIA — ROBOTS.TXT CRAWLER DIRECTIVES
// ============================================================================
// Instructions for search engine crawlers (Googlebot, Bingbot, etc.) to index
// all public products, sectors, and directories with 0 blockage.
// ============================================================================

import { getSiteUrl } from '../utils/seoUtils.js';

export default function robots() {
  const baseUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/directory/',
          '/directory/*',
          '/directory/product/*',
          '/directory/supplier/*',
          '/market-rates/',
          '/terms',
          '/privacy',
          '/shipping-policy',
          '/refund-policy',
          '/public/*',
          '/sitemap.xml',
          '/api/sitemap.xml',
        ],
        disallow: [
          '/api/',
          '/_next/',
          '/dashboard/',
          '/admin/',
          '/test-flow/',
          '/cookie/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: [
          '/',
          '/directory/',
          '/directory/*',
          '/directory/product/*',
          '/directory/supplier/*',
          '/market-rates/',
          '/public/*',
          '/sitemap.xml',
          '/api/sitemap.xml',
        ],
        disallow: [
          '/api/',
          '/_next/',
          '/dashboard/',
          '/admin/',
        ],
      },
    ],
    sitemap: [
      `${baseUrl}/sitemap.xml`,
      `${baseUrl}/api/sitemap.xml`,
    ],
    host: baseUrl,
  };
}
