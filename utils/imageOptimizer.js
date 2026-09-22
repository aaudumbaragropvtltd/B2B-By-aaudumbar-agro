// ============================================================================
// B2B INDIA — UNIVERSAL PRODUCT & MEDIA IMAGE OPTIMIZER
// ============================================================================
// Dynamically transforms external and hosted image URLs to auto-format (AVIF/WebP),
// constrain dimensions to responsive display sizes (e.g. 400px), and strip
// redundant query bloat for maximum PageSpeed Insights score.
// ============================================================================

export function optimizeProductImageUrl(url, options = {}) {
  const { width = 320, quality = 75 } = options;
  if (!url || typeof url !== 'string') {
    return 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=320&q=75';
  }

  let cleanUrl = url.trim();

  // Upgrade HTTP to HTTPS for SSL & mixed content compliance
  if (cleanUrl.startsWith('http://')) {
    cleanUrl = cleanUrl.replace(/^http:\/\//i, 'https://');
  }

  // Intercept the legacy uncompressed 3.5MB Black Pepper PNG if encountered
  if (cleanUrl.includes('indian-black-pepper-malabar-tellicherry-kollimalai-origins.png')) {
    return `https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=${width}&q=${quality}`;
  }

  // Cloudinary image auto-format & eco compression
  if (cleanUrl.includes('res.cloudinary.com')) {
    if (cleanUrl.includes('/upload/')) {
      if (cleanUrl.includes('/upload/f_auto,q_auto')) {
        return cleanUrl.replace(/\/upload\/f_auto,q_auto(?::eco|:good|:low)?(?:,w_\d+)?\//, `/upload/f_auto,q_auto:eco,w_${width}/`);
      }
      return cleanUrl.replace('/upload/', `/upload/f_auto,q_auto:eco,w_${width}/`);
    }
    if (cleanUrl.includes('/image/fetch/')) {
      return cleanUrl.replace(/\/fetch\/f_auto,q_auto(?::eco|:good|:low)?(?:,w_\d+)?\//, `/fetch/f_auto,q_auto:eco,w_${width}/`);
    }
    return cleanUrl;
  }

  // Shopify CDN images (cdn/shop/files or cdn.shopify.com)
  if (cleanUrl.includes('cdn/shop/files') || cleanUrl.includes('cdn.shopify.com')) {
    if (/([?&])width=\d+/.test(cleanUrl)) {
      return cleanUrl.replace(/([?&])width=\d+/, `$1width=${width}`);
    }
    const separator = cleanUrl.includes('?') ? '&' : '?';
    return `${cleanUrl}${separator}width=${width}`;
  }

  // Unsplash images
  if (cleanUrl.includes('images.unsplash.com')) {
    if (cleanUrl.includes('w=')) {
      cleanUrl = cleanUrl.replace(/w=\d+/, `w=${width}`);
    } else {
      const sep = cleanUrl.includes('?') ? '&' : '?';
      cleanUrl = `${cleanUrl}${sep}w=${width}`;
    }
    if (!cleanUrl.includes('auto=format')) {
      cleanUrl += '&auto=format';
    }
    if (!cleanUrl.includes('fit=')) {
      cleanUrl += '&fit=crop';
    }
    if (!cleanUrl.includes('q=')) {
      cleanUrl += `&q=${quality}`;
    }
    return cleanUrl;
  }

  // JD MagicBox QuickQuotes thumbnail sizing
  if (cleanUrl.includes('images.jdmagicbox.com') || cleanUrl.includes('content.jdmagicbox.com')) {
    if (cleanUrl.includes('Resize=')) {
      return cleanUrl.replace(/Resize=\(\d+,\d+\)/, `Resize=(${width},${width})`);
    }
    if (cleanUrl.includes('impolicy=queryparam')) {
      return `${cleanUrl}&im=Resize=(${width},${width}),aspect=fit`;
    }
  }

  // Proxy unoptimized third-party image hosts through Cloudinary fetch for WebP/AVIF auto-compression
  if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
    return `https://res.cloudinary.com/pjsh8sfp/image/fetch/f_auto,q_auto:eco,w_${width}/${cleanUrl}`;
  }

  return cleanUrl;
}
