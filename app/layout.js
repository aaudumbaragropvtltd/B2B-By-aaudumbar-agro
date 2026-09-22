import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

import { getSiteUrl } from "@/utils/seoUtils";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  fallback: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
});

const baseUrl = getSiteUrl();

export const metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "B2B India — Verified Wholesale Marketplace in India",
    template: "%s | B2B India",
  },
  description:
    "India's verified B2B wholesale marketplace. Direct procurement across 38 sectors with 10% advance escrow protection, verified GST suppliers & bulk freight.",
  keywords: [
    "B2B",
    "B2B India",
    "B2B marketplace",
    "B2B wholesale",
    "b2bindia.site",
    "b2bindia",
    "b2bindia wholesale",
    "B2B wholesale marketplace India",
    "buy wholesale online India",
    "verified B2B suppliers India",
    "Indian B2B portal",
    "B2B e-commerce platform India",
    "turmeric wholesale suppliers India",
    "buy turmeric finger bulk India",
    "wholesale spices suppliers India",
    "wholesale agricultural commodities mandi India",
    "industrial supplies and machinery manufacturers India",
    "escrow payment B2B wholesale India",
    "factory direct wholesale prices",
  ],
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-48.png', sizes: '48x48', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { url: '/logo.png', sizes: '1024x1024', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: ['/favicon.ico'],
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "B2B India — Verified Wholesale Marketplace in India",
    description:
      "India's verified B2B wholesale marketplace. Direct procurement across 38 sectors with 10% advance escrow protection, verified GST suppliers & bulk freight.",
    url: baseUrl,
    siteName: "B2B India | b2bindia.site",
    images: [
      {
        url: `${baseUrl}/logo.png`,
        width: 1024,
        height: 1024,
        alt: 'B2B India Official Logo',
      },
      {
        url: `${baseUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'B2B India Platform Preview',
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: 'summary_large_image',
    title: "B2B India — Verified Wholesale Marketplace in India",
    description: "India's verified B2B wholesale marketplace. Direct procurement across 38 sectors with 10% advance escrow protection, verified GST suppliers & bulk freight.",
    images: [`${baseUrl}/logo.png`, `${baseUrl}/og-image.png`],
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
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || 'google0e8c1d2b0dc6688c',
  },
  other: {
    'geo.region': 'IN-MH',
    'geo.placename': 'Chhatrapati Sambhajinagar, Maharashtra, India',
    'geo.position': '19.8631;75.3588',
    'ICBM': '19.8631, 75.3588',
    'rating': 'general',
    'coverage': 'India',
    'target-country': 'IN',
    'ai-generated': 'no',
  },
};

export default function RootLayout({ children }) {
  const globalSiteJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${baseUrl}/#website`,
        url: `${baseUrl}/`,
        name: 'B2B India',
        alternateName: [
          'B2B',
          'b2bindia.site',
          'B2B India Marketplace',
          'B2B Bharat',
          'b2bindia',
          'www.b2bindia.site',
          'B2B India Wholesale',
        ],
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${baseUrl}/directory?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
        inLanguage: 'en-IN',
        publisher: {
          '@id': `${baseUrl}/#organization`,
        },
        image: `${baseUrl}/logo.png`,
      },
      {
        '@type': 'Organization',
        '@id': `${baseUrl}/#organization`,
        name: 'B2B India | b2bindia.site',
        legalName: 'Aaudumbar Agro Pvt. Ltd.',
        url: `${baseUrl}/`,
        logo: {
          '@type': 'ImageObject',
          '@id': `${baseUrl}/#logo`,
          inLanguage: 'en-IN',
          url: `${baseUrl}/logo.png`,
          contentUrl: `${baseUrl}/logo.png`,
          width: 1024,
          height: 1024,
          caption: 'B2B India Official Logo',
        },
        image: `${baseUrl}/logo.png`,
        sameAs: [
          'https://www.facebook.com/b2bindia.site',
          'https://www.instagram.com/b2bindia.site',
          'https://en.wikipedia.org/wiki/Business-to-business',
          'https://en.wikipedia.org/wiki/Wholesale',
          'https://en.wikipedia.org/wiki/Escrow',
          'https://www.wikidata.org/wiki/Q166662',
        ],
        contactPoint: {
          '@type': 'ContactPoint',
          telephone: '+91-8408841998',
          contactType: 'customer support',
          email: 'support@b2bindia.site',
          areaServed: 'IN',
          availableLanguage: ['en', 'hi', 'mr'],
        },
      },
      {
        '@type': ['LocalBusiness', 'WholesaleStore'],
        '@id': `${baseUrl}/#localbusiness`,
        name: 'B2B India — Aaudumbar Agro Pvt. Ltd.',
        description:
          "India's verified cross-industry B2B wholesale marketplace with automated escrow protection and direct manufacturer sourcing across 38 sectors.",
        url: `${baseUrl}/`,
        telephone: '+91-8408841998',
        email: 'support@b2bindia.site',
        image: `${baseUrl}/logo.png`,
        logo: `${baseUrl}/logo.png`,
        priceRange: '₹₹₹',
        currenciesAccepted: 'INR',
        paymentAccepted: 'Cash, Credit Card, Bank Transfer, Escrow, UPI, RTGS, NEFT',
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'Plot No. 5, Prerna Nagar, Garkheda Parisar',
          addressLocality: 'Chhatrapati Sambhajinagar',
          addressRegion: 'Maharashtra',
          postalCode: '431009',
          addressCountry: 'IN',
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: 19.8631,
          longitude: 75.3588,
        },
        openingHoursSpecification: [
          {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            opens: '09:00',
            closes: '20:00',
          },
        ],
        sameAs: [
          'https://www.facebook.com/b2bindia.site',
          'https://www.instagram.com/b2bindia.site',
          'https://en.wikipedia.org/wiki/Agricultural_produce_market_committee',
        ],
      },
    ],
  };

  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon-48.png" type="image/png" sizes="48x48" />
        <link rel="icon" href="/icon-192.png" type="image/png" sizes="192x192" />
        <link rel="icon" href="/icon-512.png" type="image/png" sizes="512x512" />
        <link rel="icon" href="/logo.png" type="image/png" sizes="1024x1024" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
        <meta name="msapplication-TileImage" content="/icon-512.png" />
        <meta name="msapplication-TileColor" content="#ffffff" />
        <meta name="theme-color" content="#ffffff" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://5.imimg.com" />
        <link
          rel="preload"
          as="image"
          href="https://res.cloudinary.com/pjsh8sfp/image/upload/f_webp,q_45,w_480/v1789108422/b2b-bharat/banners/1789108417666_ChatGPT_Image_Sep_11__2026__12.jpg"
          imageSrcSet="https://res.cloudinary.com/pjsh8sfp/image/upload/f_webp,q_45,w_480/v1789108422/b2b-bharat/banners/1789108417666_ChatGPT_Image_Sep_11__2026__12.jpg 480w, https://res.cloudinary.com/pjsh8sfp/image/upload/f_webp,q_45,w_768/v1789108422/b2b-bharat/banners/1789108417666_ChatGPT_Image_Sep_11__2026__12.jpg 768w, https://res.cloudinary.com/pjsh8sfp/image/upload/f_auto,q_55,w_1080/v1789108422/b2b-bharat/banners/1789108417666_ChatGPT_Image_Sep_11__2026__12.jpg 1080w"
          imageSizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 1080px"
          fetchPriority="high"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(globalSiteJsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans" suppressHydrationWarning>
        {/* Google Analytics 4 Tracking via Next.js Script (loaded during browser idle time to optimize TBT and FCP) */}
        <Script
          strategy="lazyOnload"
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-B2BINDIA01'}`}
        />
        <Script
          id="google-analytics"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-B2BINDIA01'}', {
                page_path: window.location.pathname,
              });
            `,
          }}
        />
        {children}
      </body>
    </html>
  );
}
