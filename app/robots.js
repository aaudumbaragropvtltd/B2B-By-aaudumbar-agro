// ============================================================================
// B2B INDIA — ROBOTS.TXT CRAWLER & AI ANSWER ENGINE DIRECTIVES
// ============================================================================
// Instructions for Search Engines (Google, Bing) and AI Answer Engines
// (ChatGPT, Perplexity, Claude, Google-Extended) to index public B2B catalog,
// live mandi rates, and llms.txt specifications with 0 blockage.
// ============================================================================

import { getSiteUrl } from '../utils/seoUtils.js';

export default function robots() {
  const baseUrl = getSiteUrl();

  const publicAllowedPaths = [
    '/',
    '/_next/static/*',
    '/_next/image*',
    '/directory',
    '/directory/*',
    '/directory/product/*',
    '/directory/supplier/*',
    '/market-rates',
    '/market-rates/*',
    '/support',
    '/terms',
    '/privacy',
    '/shipping-policy',
    '/refund-policy',
    '/cookie',
    '/llms.txt',
    '/llms-full.txt',
    '/public/*',
    '/sitemap.xml',
    '/api/sitemap.xml',
  ];

  const privateDisallowedPaths = [
    '/api/',
    '/dashboard/',
    '/admin/',
    '/test-flow/',
    '/test-razorpay/',
  ];

  return {
    rules: [
      {
        userAgent: '*',
        allow: publicAllowedPaths,
        disallow: privateDisallowedPaths,
      },
      {
        userAgent: 'Googlebot',
        allow: publicAllowedPaths,
        disallow: [
          '/api/',
          '/dashboard/',
          '/admin/',
          '/test-flow/',
          '/test-razorpay/',
        ],
      },
      {
        // OpenAI ChatGPT, SearchGPT, and GPTBot
        userAgent: ['GPTBot', 'ChatGPT-User', 'OAI-SearchBot'],
        allow: publicAllowedPaths,
        disallow: privateDisallowedPaths,
      },
      {
        // Perplexity AI Search Engine
        userAgent: 'PerplexityBot',
        allow: publicAllowedPaths,
        disallow: privateDisallowedPaths,
      },
      {
        // Anthropic Claude
        userAgent: ['ClaudeBot', 'anthropic-ai'],
        allow: publicAllowedPaths,
        disallow: privateDisallowedPaths,
      },
      {
        // Google Gemini & Extended AI Crawler
        userAgent: 'Google-Extended',
        allow: publicAllowedPaths,
        disallow: privateDisallowedPaths,
      },
      {
        // Apple Intelligence
        userAgent: ['Applebot', 'Applebot-Extended'],
        allow: publicAllowedPaths,
        disallow: privateDisallowedPaths,
      },
      {
        // Cohere AI
        userAgent: 'cohere-ai',
        allow: publicAllowedPaths,
        disallow: privateDisallowedPaths,
      },
    ],
    sitemap: [
      `${baseUrl}/sitemap.xml`,
      `${baseUrl}/api/sitemap.xml`,
    ],
    host: baseUrl,
  };
}

