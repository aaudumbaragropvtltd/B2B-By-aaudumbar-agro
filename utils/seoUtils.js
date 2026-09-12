// ============================================================================
// B2B INDIA — SEO & STRUCTURED DATA (JSON-LD) ENGINE
// ============================================================================
// Programmatic SEO generators for Google Rank #1 optimization:
// - Dynamic Rich Metadata (Title, Description, Keywords, Canonical, OpenGraph)
// - Schema.org Product, Offer, AggregateRating, BreadcrumbList, ItemList, FAQPage
// ============================================================================

import { getProductSlug } from '@/utils/catalogResolver';

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://b2bindia.site';

/**
 * Format currency to standard INR representation for SEO
 */
export function formatInrPrice(amount) {
  if (!amount && amount !== 0) return '0';
  return Number(amount).toLocaleString('en-IN');
}

/**
 * Generate high-ranking B2B keywords for a product
 */
export function buildProductKeywords(product) {
  const title = product.title || product.name || 'Industrial Product';
  const category = product.sector_id?.name || product.category || 'Commodity';
  const supplierName = product.supplier_id?.company_name || product.supplierName || 'Verified Supplier';
  const city = product.supplier_id?.city || 'India';
  const hsn = product.hsn_code || '';

  const keywords = [
    `wholesale ${title}`,
    `buy ${title} in bulk`,
    `${title} suppliers in India`,
    `${title} wholesale price`,
    `${title} manufacturers ${city}`,
    `bulk order ${title}`,
    `${title} exporters India`,
    `${title} price per ${product.unit_label || 'unit'}`,
    `verified ${title} distributors`,
    `${category} wholesale market India`,
    `direct factory price ${title}`,
    `B2B procurement ${title}`,
    supplierName,
  ];

  if (hsn) {
    keywords.push(`HSN ${hsn} wholesale`, `HSN code ${hsn} GST rate`);
  }

  return keywords;
}

/**
 * Generate Next.js Dynamic Metadata for Product Pages
 */
export function generateProductMetadata(product) {
  const title = product.title || product.name || 'Product';
  const price = formatInrPrice(product.base_price_per_unit || product.price);
  const unit = product.unit_label || product.unit || 'unit';
  const moq = product.bulk_minimum_order || product.moq || '10 units';
  const supplierName = product.supplier_id?.company_name || product.supplierName || 'Verified Supplier';
  const location = [product.supplier_id?.city, product.supplier_id?.state].filter(Boolean).join(', ') || 'India';
  const category = product.sector_id?.name || product.category || 'Industrial Products';
  
  const allImages = [
    product.hero_image_url,
    ...(Array.isArray(product.gallery_image_urls) ? product.gallery_image_urls : []),
    product.image,
  ].filter(url => typeof url === 'string' && url.trim().length > 0);

  const primaryImage = allImages[0] || `${SITE_URL}/og-image.jpg`;
  const galleryImages = allImages.length > 0 ? Array.from(new Set(allImages)).slice(0, 5) : [primaryImage];

  const metaTitle = `${title} Wholesale Price (₹${price}/${unit}) | Bulk Suppliers & Exporters India`;
  const metaDescription = `Buy ${title} in bulk at verified wholesale price ₹${price}/${unit} from ${supplierName} in ${location}. Minimum Order: ${moq}. GST invoice, escrow security & pan-India logistics support on B2B India.`;

  const productSlug = getProductSlug(product);
  const canonicalUrl = `${SITE_URL}/directory/product/${productSlug}`;

  return {
    title: metaTitle,
    description: metaDescription,
    keywords: buildProductKeywords(product),
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${title} — Wholesale & Bulk Sourcing India`,
      description: `Wholesale price ₹${price}/${unit} | Direct supply from ${supplierName}. Secure escrow checkout & pan-India dispatch.`,
      url: canonicalUrl,
      siteName: 'B2B India',
      locale: 'en_IN',
      type: 'website',
      images: galleryImages.map((imgUrl, i) => ({
        url: imgUrl,
        width: 1200,
        height: 630,
        alt: `${title} view ${i + 1} wholesale bulk supply India`,
      })),
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} Wholesale Price ₹${price}/${unit} | B2B India`,
      description: metaDescription,
      images: galleryImages,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

/**
 * Generate Schema.org Product & Offer JSON-LD Structured Data
 */
export function generateProductJsonLd(product) {
  const title = product.title || product.name || 'Product';
  const price = product.base_price_per_unit || product.price || 0;
  const unit = product.unit_label || product.unit || 'unit';
  const supplierName = product.supplier_id?.company_name || product.supplierName || 'Aaudumbar Agro';
  const supplierState = product.supplier_id?.state || 'Maharashtra';
  const supplierCity = product.supplier_id?.city || 'Chhatrapati Sambhajinagar';
  
  const allImages = [
    product.hero_image_url,
    ...(Array.isArray(product.gallery_image_urls) ? product.gallery_image_urls : []),
    product.image,
  ].filter(url => typeof url === 'string' && url.trim().length > 0);

  const primaryImage = allImages[0] || `${SITE_URL}/og-image.jpg`;
  const galleryImages = allImages.length > 0 ? Array.from(new Set(allImages)).slice(0, 5) : [primaryImage];
  const productSlug = getProductSlug(product);
  const productUrl = `${SITE_URL}/directory/product/${productSlug}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${productUrl}#product`,
    name: title,
    image: galleryImages,
    description: product.description || `Wholesale ${title} bulk supply from verified Indian manufacturers.`,
    sku: String(product.id),
    mpn: product.hsn_code ? `HSN-${product.hsn_code}` : String(product.id),
    category: product.sector_id?.name || product.category || 'Industrial Supplies',
    brand: {
      '@type': 'Brand',
      name: supplierName,
    },
    manufacturer: {
      '@type': 'Organization',
      name: supplierName,
      address: {
        '@type': 'PostalAddress',
        addressLocality: supplierCity,
        addressRegion: supplierState,
        addressCountry: 'IN',
      },
    },
    offers: {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: 'INR',
      price: price,
      priceValidUntil: '2027-12-31',
      itemCondition: 'https://schema.org/NewCondition',
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'Organization',
        name: supplierName,
        url: `${SITE_URL}/directory/supplier/${product.supplier_id?.id || 'demo-supplier-1'}`,
      },
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'IN',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 7,
        returnMethod: 'https://schema.org/ReturnByMail',
        returnFees: 'https://schema.org/FreeReturn',
      },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: '0',
          currency: 'INR',
        },
        shippingDestination: {
          '@type': 'DefinedRegion',
          addressCountry: 'IN',
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: {
            '@type': 'QuantitativeValue',
            minValue: 1,
            maxValue: 3,
            unitCode: 'd',
          },
          transitTime: {
            '@type': 'QuantitativeValue',
            minValue: 2,
            maxValue: 7,
            unitCode: 'd',
          },
        },
      },
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '84',
      bestRating: '5',
      worstRating: '1',
    },
  };
}

/**
 * Generate BreadcrumbList Schema.org JSON-LD
 */
export function generateBreadcrumbJsonLd(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url}`,
    })),
  };
}

/**
 * Generate FAQPage Schema.org JSON-LD for rich expandable snippets
 */
export function generateFaqJsonLd(faqs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

/**
 * Generate Standard Product Procurement FAQs
 */
export function getProductFaqs(product) {
  const title = product.title || product.name || 'this product';
  const price = formatInrPrice(product.base_price_per_unit || product.price);
  const unit = product.unit_label || product.unit || 'unit';
  const moq = product.bulk_minimum_order || product.moq || '10 units';
  const supplierName = product.supplier_id?.company_name || product.supplierName || 'our verified suppliers';

  return [
    {
      question: `What is the wholesale price and minimum order quantity (MOQ) for ${title}?`,
      answer: `The current wholesale base price for ${title} is ₹${price} per ${unit} with a Minimum Order Quantity (MOQ) of ${moq}. Bulk volume discounts are available for large container or multi-tonnage orders through B2B India.`,
    },
    {
      question: `How does B2B India ensure quality and payment security for ${title}?`,
      answer: `Every transaction on B2B India is backed by our automated Escrow clearing mechanism. Payment is securely held until you inspect and verify the physical goods upon delivery. Suppliers like ${supplierName} are verified with active GSTIN and quality compliance certifications.`,
    },
    {
      question: `What are the delivery timelines and shipping coverage across India?`,
      answer: `We provide pan-India delivery across all major states and industrial corridors. Standard dispatch takes 24 to 72 hours, with road freight transit typically arriving within 3 to 7 business days depending on delivery pincode.`,
    },
    {
      question: `Can I get a GST Tax Invoice and formal quotation for ${title}?`,
      answer: `Yes, 100% of orders come with standard B2B GST tax invoices for full input tax credit (ITC) claim. You can also request instant PDF quotations or raise RFQs directly on the product page.`,
    },
  ];
}

/**
 * Generate Dynamic Metadata for Sector / Category Pages
 */
export function generateSectorMetadata(sectorData) {
  const sectorName = sectorData.name || 'Industry Products';
  const slug = sectorData.slug || '';
  const canonicalUrl = `${SITE_URL}/directory/${slug}`;

  return {
    title: `Buy Wholesale ${sectorName} Online | Verified Manufacturers & Suppliers India`,
    description: `Source verified ${sectorName} directly from top Indian manufacturers and wholesale distributors. Compare wholesale prices, check MOQ, get GST invoices, and secure escrow settlement on B2B India.`,
    keywords: [
      `wholesale ${sectorName} India`,
      `${sectorName} manufacturers`,
      `${sectorName} suppliers B2B`,
      `bulk buy ${sectorName}`,
      `${sectorName} factory price`,
      `exporters of ${sectorName} India`,
      `B2B trade directory ${sectorName}`,
    ],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `Wholesale ${sectorName} — Indian Manufacturers & Suppliers`,
      description: `Direct B2B sourcing for ${sectorName}. Connect with top verified suppliers with escrow payment protection.`,
      url: canonicalUrl,
      siteName: 'B2B India',
      locale: 'en_IN',
      type: 'website',
      images: [
        {
          url: sectorData.hero_image_url || `${SITE_URL}/og-image.jpg`,
          width: 1200,
          height: 630,
          alt: `Wholesale ${sectorName} directory`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `Wholesale ${sectorName} | B2B India`,
      description: `Source ${sectorName} in bulk from verified Indian suppliers.`,
      images: [sectorData.hero_image_url || `${SITE_URL}/og-image.jpg`],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

/**
 * Generate CollectionPage & ItemList Schema.org JSON-LD for Sector Pages
 */
export function generateSectorJsonLd(sectorData, products = []) {
  const sectorName = sectorData.name || 'Sector Products';
  const sectorUrl = `${SITE_URL}/directory/${sectorData.slug}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${sectorUrl}#collection`,
    url: sectorUrl,
    name: `Wholesale ${sectorName} Directory`,
    description: `Comprehensive directory of verified manufacturers, suppliers, and wholesale prices in ${sectorName}.`,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: products.slice(0, 30).map((prod, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `${SITE_URL}/directory/product/${getProductSlug(prod)}`,
        name: prod.title || prod.name,
      })),
    },
  };
}

/**
 * Generate Dynamic Metadata for Supplier Pages
 */
export function generateSupplierMetadata(supplier) {
  const name = supplier.name || supplier.company_name || 'Verified Supplier';
  const location = supplier.location || [supplier.city, supplier.state].filter(Boolean).join(', ') || 'India';
  const sector = supplier.sector || 'Industrial Manufacturing';
  const canonicalUrl = `${SITE_URL}/directory/supplier/${supplier.id}`;

  return {
    title: `${name} — Verified B2B Manufacturer & Wholesale Supplier in ${location} | B2B India`,
    description: `Connect with ${name}, a verified Indian supplier in ${sector} sector located in ${location}. View product catalog, wholesale price list, business credentials, and request direct quotations.`,
    keywords: [
      `${name} supplier India`,
      `${name} wholesale products`,
      `${name} ${location}`,
      `verified B2B supplier ${name}`,
      `${sector} manufacturer ${location}`,
    ],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${name} — Verified Supplier Profile`,
      description: `Verified manufacturer in ${location} with active B2B catalog on B2B India.`,
      url: canonicalUrl,
      siteName: 'B2B India',
      locale: 'en_IN',
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${name} | B2B India Verified Supplier`,
      description: `View wholesale catalog and contact ${name} in ${location}.`,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

/**
 * Generate Supplier Organization / LocalBusiness Schema.org JSON-LD
 */
export function generateSupplierJsonLd(supplier, products = []) {
  const name = supplier.name || supplier.company_name || 'Verified Supplier';
  const location = supplier.location || [supplier.city, supplier.state].filter(Boolean).join(', ') || 'India';
  const supplierUrl = `${SITE_URL}/directory/supplier/${supplier.id}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${supplierUrl}#supplier`,
    name: name,
    url: supplierUrl,
    description: `${name} is a verified Indian manufacturer and wholesale distributor operating in the ${supplier.sector || 'Industrial'} industry.`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: supplier.city || location,
      addressRegion: supplier.state || 'Maharashtra',
      addressCountry: 'IN',
    },
    knowsAbout: products.slice(0, 10).map((p) => p.title || p.name),
  };
}
