import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "B2B Bharat — India's Cross-Industry Automated Marketplace",
  description:
    "Source, verify & settle across 38 industrial sectors. Direct pipeline connections to 12,400+ verified Indian manufacturers with automated escrow clearing and AI-driven pricing resilience.",
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
  ],
  openGraph: {
    title: "B2B Bharat — Cross-Industry Automated B2B Marketplace",
    description:
      "India's premier B2B platform connecting verified manufacturers across 38 sectors with automated escrow and AI pricing.",
    type: "website",
    locale: "en_IN",
    siteName: "B2B Bharat",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <head>
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        {children}
      </body>
    </html>
  );
}
