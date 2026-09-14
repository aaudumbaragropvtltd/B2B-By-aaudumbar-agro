import { getSiteUrl } from '@/utils/seoUtils';

const baseUrl = getSiteUrl();

export const metadata = {
  title: 'Live Mandi Rates Today India — APMC Commodity Prices | b2bindia.site',
  description:
    'Real-time APMC Mandi commodity rates today across India on b2bindia.site. Track live wholesale mandi bhav for turmeric, jeera, cardamom, soybean, wheat, and pulses with AI market intelligence.',
  keywords: [
    'b2bindia.site',
    'b2bindia mandi rates',
    'mandi rates today India',
    'APMC commodity prices live',
    'turmeric mandi bhav today',
    'jeera unjha mandi rate',
    'soybean latur mandi rate',
    'cardamom auction rates',
    'daily wholesale agricultural rates India',
  ],
  alternates: {
    canonical: `${baseUrl}/market-rates`,
  },
  openGraph: {
    title: 'Live Mandi Rates Today India — APMC Commodity Prices | b2bindia.site',
    description:
      'Real-time APMC Mandi wholesale commodity rates across India on b2bindia.site. AI-analyzed price intelligence and mandi bhav.',
    url: `${baseUrl}/market-rates`,
    siteName: 'b2bindia.site | B2B India',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Live Mandi Rates Today India | b2bindia.site',
    description: 'Real-time APMC Mandi wholesale prices and market intelligence across India on b2bindia.site.',
  },
};

export default function MarketRatesLayout({ children }) {
  return children;
}
