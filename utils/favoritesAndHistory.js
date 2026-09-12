// ============================================================================
// B2B INDIA — CLIENT FAVORITES & BROWSING HISTORY ENGINE
// ============================================================================
// High-performance client-side storage for saved products & viewing trails.
// Triggers custom window events so all UI components update in real-time.
// ============================================================================

import { getProductUrl } from './slugUtils';

const FAVORITES_KEY = 'b2b_favorites_v1';
const HISTORY_KEY = 'b2b_browsing_history_v1';
const MAX_HISTORY_ITEMS = 25;

/**
 * Helper to safely read JSON from localStorage
 */
function readStorage(key) {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn(`Error reading ${key} from storage:`, err);
    return [];
  }
}

/**
 * Helper to safely write JSON to localStorage
 */
function writeStorage(key, data) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn(`Error writing ${key} to storage:`, err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FAVORITES (SAVED PRODUCTS)
// ─────────────────────────────────────────────────────────────────────────────

export function getFavorites() {
  return readStorage(FAVORITES_KEY);
}

export function isFavorite(productId) {
  if (!productId) return false;
  const list = getFavorites();
  const targetId = String(productId).toLowerCase();
  return list.some(item => String(item.id).toLowerCase() === targetId || String(item.slug).toLowerCase() === targetId);
}

export function addFavorite(product) {
  if (!product || !product.id) return false;
  const list = getFavorites();
  const targetId = String(product.id).toLowerCase();
  
  if (list.some(item => String(item.id).toLowerCase() === targetId)) {
    return true; // Already favorite
  }

  const cleanProduct = {
    id: String(product.id),
    title: product.title || product.name || 'Product',
    price: Number(product.base_price_per_unit || product.price || 0),
    unit: product.unit_label || product.unit || 'unit',
    image: product.hero_image_url || product.image || product.gallery_image_urls?.[0] || null,
    slug: product.slug || String(product.id),
    url: product.url || getProductUrl(product),
    sector: product.sector_id?.name || product.sector || 'General',
    addedAt: Date.now(),
  };

  const updated = [cleanProduct, ...list];
  writeStorage(FAVORITES_KEY, updated);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('b2b_favorites_updated', { detail: updated }));
  }
  return true;
}

export function removeFavorite(productId) {
  if (!productId) return false;
  const list = getFavorites();
  const targetId = String(productId).toLowerCase();
  const updated = list.filter(item => String(item.id).toLowerCase() !== targetId && String(item.slug).toLowerCase() !== targetId);
  
  writeStorage(FAVORITES_KEY, updated);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('b2b_favorites_updated', { detail: updated }));
  }
  return true;
}

export function toggleFavorite(product) {
  if (!product || !product.id) return false;
  if (isFavorite(product.id)) {
    removeFavorite(product.id);
    return false;
  } else {
    addFavorite(product);
    return true;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// BROWSING HISTORY
// ─────────────────────────────────────────────────────────────────────────────

export function getBrowsingHistory() {
  return readStorage(HISTORY_KEY);
}

export function addToBrowsingHistory(product) {
  if (!product || !product.id) return;
  const list = getBrowsingHistory();
  const targetId = String(product.id).toLowerCase();

  // Filter out existing occurrence
  const remaining = list.filter(item => String(item.id).toLowerCase() !== targetId);

  const cleanItem = {
    id: String(product.id),
    title: product.title || product.name || 'Product',
    price: Number(product.base_price_per_unit || product.price || 0),
    unit: product.unit_label || product.unit || 'unit',
    image: product.hero_image_url || product.image || product.gallery_image_urls?.[0] || null,
    slug: product.slug || String(product.id),
    url: product.url || getProductUrl(product),
    sector: product.sector_id?.name || product.sector || 'General',
    viewedAt: Date.now(),
  };

  const updated = [cleanItem, ...remaining].slice(0, MAX_HISTORY_ITEMS);
  writeStorage(HISTORY_KEY, updated);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('b2b_history_updated', { detail: updated }));
  }
}

export function removeFromBrowsingHistory(productId) {
  if (!productId) return;
  const list = getBrowsingHistory();
  const targetId = String(productId).toLowerCase();
  const updated = list.filter(item => String(item.id).toLowerCase() !== targetId);

  writeStorage(HISTORY_KEY, updated);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('b2b_history_updated', { detail: updated }));
  }
}

export function clearBrowsingHistory() {
  writeStorage(HISTORY_KEY, []);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('b2b_history_updated', { detail: [] }));
  }
}

/**
 * Format relative time (e.g. "Just now", "5m ago", "2h ago", "Yesterday")
 */
export function formatRelativeTime(timestamp) {
  if (!timestamp) return '';
  const now = Date.now();
  const diffMs = now - Number(timestamp);
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}
