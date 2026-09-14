import { Inter } from "next/font/google";
import "./globals.css";

import { getSiteUrl } from "@/utils/seoUtils";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const baseUrl = getSiteUrl();

export const metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "B2B India — Verified B2B Wholesale Marketplace in India | b2bindia.site",
    template: "%s | B2B India",
  },
  description:
    "B2B India (b2bindia.site) is India's leading verified B2B wholesale marketplace. Direct B2B procurement across 38 industrial sectors with escrow payment protection, GST invoices, and pan-India logistics dispatch.",
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
      { url: '/favicon.ico', sizes: '48x48' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
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
    title: "B2B India — Verified B2B Wholesale Marketplace in India | b2bindia.site",
    description:
      "India's premier B2B platform on b2bindia.site connecting verified manufacturers across 38 sectors with automated escrow and AI pricing.",
    url: baseUrl,
    siteName: "B2B India | b2bindia.site",
    images: [
      {
        url: '/og-image.jpg',
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
    title: "B2B India — Verified B2B Wholesale Marketplace | b2bindia.site",
    description: "India's premier B2B platform on b2bindia.site connecting verified manufacturers across 38 sectors with automated escrow and AI pricing.",
    images: ['/og-image.jpg'],
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
    'geo.region': 'IN',
    'geo.placename': 'India',
    'rating': 'general',
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
      },
      {
        '@type': 'Organization',
        '@id': `${baseUrl}/#organization`,
        name: 'B2B India | b2bindia.site',
        url: `${baseUrl}/`,
        logo: {
          '@type': 'ImageObject',
          url: `${baseUrl}/logo.png`,
          width: 1024,
          height: 1024,
          caption: 'B2B India',
        },
        image: `${baseUrl}/logo.png`,
        contactPoint: {
          '@type': 'ContactPoint',
          telephone: '+91-8408841998',
          contactType: 'customer support',
          email: 'support@b2bindia.site',
          areaServed: 'IN',
          availableLanguage: ['en', 'hi', 'mr'],
        },
      },
    ],
  };

  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <link rel="icon" href="/favicon.ico" sizes="48x48" />
        <link rel="icon" href="/icon-192.png" type="image/png" sizes="192x192" />
        <link rel="icon" href="/icon-512.png" type="image/png" sizes="512x512" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link rel="preconnect" href="https://5.imimg.com" />
        <link rel="dns-prefetch" href="https://5.imimg.com" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(globalSiteJsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
