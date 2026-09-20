import { getSiteUrl } from '@/utils/seoUtils';

const baseUrl = getSiteUrl();

export const metadata = {
  title: 'Customer Support & Concierge Desk | B2B India',
  description:
    'Contact B2B India customer support desk for assistance with 10% advance escrow, factory order status, supplier KYC verification, and pan-India freight tracking.',
  keywords: [
    'b2bindia support',
    'b2bindia customer care',
    'b2b india helpline',
    'escrow dispute support',
    'wholesale supplier contact india',
  ],
  alternates: {
    canonical: `${baseUrl}/support`,
  },
  openGraph: {
    title: 'Customer Support & Concierge Desk | B2B India',
    description: '24/7 B2B wholesale support for escrow safety, supplier verification, and live logistics.',
    url: `${baseUrl}/support`,
    siteName: 'b2bindia.site | B2B India',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Customer Support Desk | B2B India',
    description: '24/7 B2B wholesale assistance and live order concierge.',
  },
};

export default function SupportLayout({ children }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ContactPage',
        '@id': `${baseUrl}/support#contact`,
        url: `${baseUrl}/support`,
        name: 'B2B India Support Desk',
        description: '24/7 dedicated enterprise support for wholesale buyers and suppliers.',
        mainEntity: {
          '@type': 'Organization',
          name: 'B2B India',
          telephone: '+91-8408841998',
          email: 'support@b2bindia.site',
          address: {
            '@type': 'PostalAddress',
            streetAddress: 'Plot No. 5, Prerna Nagar, Garkheda Parisar',
            addressLocality: 'Chhatrapati Sambhajinagar',
            addressRegion: 'Maharashtra',
            postalCode: '431009',
            addressCountry: 'IN',
          },
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${baseUrl}/` },
          { '@type': 'ListItem', position: 2, name: 'Support', item: `${baseUrl}/support` },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
