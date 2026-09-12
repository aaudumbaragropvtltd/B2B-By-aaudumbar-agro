// ============================================================================
// B2B INDIA — PRODUCT SLUG & URL UTILITIES
// ============================================================================
// Pure, isomorphic helper functions for generating and parsing SEO-friendly
// product slugs and directory URLs. Safe for both Client and Server Components.
// ============================================================================

/**
 * Standard slugify function to generate SEO-friendly, URL-safe slugs
 */
export function slugify(text) {
  return (text || '')
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // remove non-alphanumeric except whitespace and hyphens
    .replace(/[\s_-]+/g, '-') // convert spaces and underscores to single hyphen
    .replace(/^-+|-+$/g, ''); // strip leading/trailing hyphens
}

/**
 * Generates an SEO friendly slug for any product object
 */
export function getProductSlug(product) {
  if (!product) return '';
  const title = product.title || product.name || '';
  const slug = slugify(title);
  return slug || String(product.id || '');
}

/**
 * Generates the full directory URL path for a product
 */
export function getProductUrl(product) {
  if (!product) return '/directory';
  return '/directory/product/' + getProductSlug(product);
}
