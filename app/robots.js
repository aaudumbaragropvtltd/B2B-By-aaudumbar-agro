// ============================================================================
// B2B INDIA — ROBOTS.TXT CRAWLER DIRECTIVES
// ============================================================================
// Instructions for search engine crawlers (Googlebot, Bingbot, etc.) to index
// all public products, sectors, and directories with 0 blockage.
// ============================================================================

export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://b2bindia.site';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
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
          '/public/*',
        ],
        disallow: [
          '/api/',
          '/_next/',
          '/dashboard/',
          '/admin/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
