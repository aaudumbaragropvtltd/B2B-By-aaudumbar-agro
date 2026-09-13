// ============================================================================
// B2B INDIA — REAL-TIME SEO AUTOMATION & SEARCH ENGINE PING ENGINE
// ============================================================================
// Triggered automatically whenever a new product is added or updated:
// 1. Calculates canonical SEO slug and full absolute URL (https://www.b2bindia.site/...)
// 2. Revalidates Next.js sitemap, category directory, and product pages on demand
// 3. Pings Google and Bing sitemap crawlers to request priority indexing
// ============================================================================

import { getSiteUrl } from '../utils/seoUtils.js';
import { getProductSlug } from '../utils/slugUtils.js';

/**
 * Automates indexing and cache revalidation for any newly added or updated product
 * @param {object} product - The product record from Supabase
 * @param {'created' | 'updated'} action - Event type
 */
export async function triggerProductSeoAutomation(product, action = 'created') {
  if (!product) return null;

  const siteUrl = getSiteUrl();
  const slug = getProductSlug(product);
  const productUrl = `${siteUrl}/directory/product/${slug}`;
  const sitemapUrl = `${siteUrl}/sitemap.xml`;

  // 1. On-Demand Next.js Cache Revalidation
  try {
    const { revalidatePath } = await import('next/cache');
    if (typeof revalidatePath === 'function') {
      revalidatePath('/sitemap.xml');
      revalidatePath('/directory');
      revalidatePath('/');
      revalidatePath(`/directory/product/${slug}`);
      if (product.id) {
        revalidatePath(`/directory/product/${product.id}`);
      }
      if (product.sector_id?.slug) {
        revalidatePath(`/directory/${product.sector_id.slug}`);
      }
    }
  } catch (e) {
    // revalidatePath is safe to catch if executed outside server action / Next context
  }

  // 2. Search Engine Ping Dispatcher (Google & Bing)
  // Non-blocking fire-and-forget pings to notify search crawlers immediately
  const pingResults = { google: 'pending', bing: 'pending' };

  try {
    const googlePingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
    const bingPingUrl = `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;

    // Dispatch async pings with a short timeout so API response is never blocked
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const [googleRes, bingRes] = await Promise.allSettled([
      fetch(googlePingUrl, { method: 'GET', signal: controller.signal }),
      fetch(bingPingUrl, { method: 'GET', signal: controller.signal }),
    ]);

    clearTimeout(timeoutId);

    pingResults.google = googleRes.status === 'fulfilled' ? 'notified' : 'queued';
    pingResults.bing = bingRes.status === 'fulfilled' ? 'notified' : 'queued';
  } catch (err) {
    pingResults.google = 'deferred';
    pingResults.bing = 'deferred';
  }

  console.log(`[SEO Automation] Product ${action.toUpperCase()}: "${product.title || product.name}"`);
  console.log(`[SEO Automation] URL: ${productUrl}`);
  console.log(`[SEO Automation] Sitemap: ${sitemapUrl} | Crawler Pings:`, pingResults);

  return {
    success: true,
    action,
    slug,
    url: productUrl,
    sitemapUrl,
    pingResults,
  };
}
