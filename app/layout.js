import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://b2bindia.site';

export const metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "B2B India — India's Cross-Industry Automated B2B Wholesale Marketplace",
    template: "%s | B2B India",
  },
  description:
    "Direct B2B procurement pipeline across 38 industrial sectors. Buy wholesale from verified Indian manufacturers with escrow payment clearing, GST invoices, and pan-India logistics.",
  keywords: [
    "B2B wholesale marketplace India",
    "B2B e-commerce platform India",
    "find B2B buyers in India",
    "Bulk order suppliers India",
    "wholesale distributor for retailers",
    "verified B2B suppliers India",
    "industrial suppliers India",
    "B2B procurement",
    "manufacturing supplies",
    "trade directory India",
    "wholesale spices suppliers India",
    "bulk cardamom black pepper turmeric buyers",
    "wholesale vegetables online India",
    "bulk onion and potato suppliers",
    "fresh agricultural commodities B2B",
    "wholesale grains and pulses India",
    "export quality Indian spices bulk",
    "bulk dry fruits wholesale India",
    "organic food commodities B2B",
    "agri-commodities trading platform India",
    "B2B agricultural produce buyers",
    "wholesale grocery suppliers India",
  ],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "B2B India — Cross-Industry Automated B2B Marketplace",
    description:
      "India's premier B2B platform connecting verified manufacturers across 38 sectors with automated escrow and AI pricing.",
    url: baseUrl,
    siteName: "B2B India",
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
    title: "B2B India — India's Cross-Industry Automated Marketplace",
    description: "India's premier B2B platform connecting verified manufacturers across 38 sectors with automated escrow and AI pricing.",
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
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || 'google-site-verification-b2bindia',
  },
  other: {
    'geo.region': 'IN',
    'geo.placename': 'India',
    'rating': 'general',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link rel="preconnect" href="https://5.imimg.com" />
        <link rel="dns-prefetch" href="https://5.imimg.com" />
      </head>
      <body className="min-h-full flex flex-col font-sans" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
