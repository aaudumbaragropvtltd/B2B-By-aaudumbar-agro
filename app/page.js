// ============================================================================
// B2B INDIA — LANDING PAGE (Overhauled)
// ============================================================================
// Clean, product-focused homepage:
// 1. Hero with search bar
// 2. Category strip (horizontal scrollable)
// 3. Featured products grid
// 4. Trending products carousel
// 5. Category showcase (top 4 categories)
// 6. All categories grid
// 7. Footer
// ============================================================================

import Navbar from '@/components/Navbar';
import EcommerceHero from '@/components/EcommerceHero';
import FeaturedProducts from '@/components/FeaturedProducts';
import LiveRFQsSection from '@/components/LiveRFQsSection';
import TrendingProductsSection from '@/components/TrendingProductsSection';
import TopSuppliersSection from '@/components/TopSuppliersSection';
import CategoryShowcase from '@/components/CategoryShowcase';
import AnimatedCategoryGrid from '@/components/AnimatedCategoryGrid';
import KnowledgeHubFaq from '@/components/KnowledgeHubFaq';
import Footer from '@/components/Footer';
import { getActiveBanners } from '@/utils/platformBanners';
import {
  getSiteUrl,
  getPlatformKnowledgeFaqs,
  generateFaqJsonLd,
  generateEscrowHowToJsonLd,
  INDIAN_STATES_SERVED,
} from '@/utils/seoUtils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  const siteUrl = getSiteUrl();

  const platformFaqs = getPlatformKnowledgeFaqs();
  const faqSchema = generateFaqJsonLd(platformFaqs);
  const escrowHowToSchema = generateEscrowHowToJsonLd();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        url: `${siteUrl}/`,
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
        description: "B2B India (b2bindia.site) is India's leading verified B2B wholesale marketplace — Direct Manufacturer Sourcing & Automated Escrow.",
        potentialAction: [
          {
            '@type': 'SearchAction',
            target: {
              '@type': 'EntryPoint',
              urlTemplate: `${siteUrl}/directory?q={search_term_string}`,
            },
            'query-input': 'required name=search_term_string',
          },
        ],
        inLanguage: 'en-IN',
      },
      {
        '@type': 'Organization',
        '@id': `${siteUrl}/#organization`,
        name: 'B2B India | b2bindia.site',
        legalName: 'Aaudumbar Agro Pvt. Ltd.',
        url: `${siteUrl}/`,
        logo: {
          '@type': 'ImageObject',
          inLanguage: 'en-IN',
          '@id': `${siteUrl}/#logo`,
          url: `${siteUrl}/logo.png`,
          contentUrl: `${siteUrl}/logo.png`,
          width: 1024,
          height: 1024,
          caption: 'B2B India Official Logo',
        },
        image: `${siteUrl}/logo.png`,
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
        areaServed: INDIAN_STATES_SERVED.map((code) => ({
          '@type': 'AdministrativeArea',
          identifier: code,
        })),
      },
      {
        '@type': ['LocalBusiness', 'WholesaleStore'],
        '@id': `${siteUrl}/#localbusiness`,
        name: 'B2B India — Aaudumbar Agro Pvt. Ltd.',
        description:
          "India's verified cross-industry B2B wholesale marketplace with automated escrow protection and direct manufacturer sourcing across 38 sectors.",
        url: `${siteUrl}/`,
        telephone: '+91-8408841998',
        email: 'support@b2bindia.site',
        image: `${siteUrl}/logo.png`,
        logo: `${siteUrl}/logo.png`,
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
      {
        '@type': 'FAQPage',
        '@id': `${siteUrl}/#faq`,
        mainEntity: faqSchema.mainEntity,
      },
      (() => {
        const { '@context': _ctx, ...cleanHowTo } = escrowHowToSchema;
        return {
          ...cleanHowTo,
          '@id': `${siteUrl}/#howto`,
        };
      })(),
    ],
  };

  let featuredProducts = [];
  let trendingProducts = [];
  let topSuppliers = [];
  let liveRfqs = [];
  let categoryCounts = {};
  let heroBanners = [];

  try {
    heroBanners = await getActiveBanners();
  } catch (err) {
    console.warn('Failed to load hero banners from CMS:', err.message);
  }

  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { createAdminClient } = await import('@/services/supabaseServer');
      const supabase = createAdminClient();

      // Fetch featured/trending
      const { data, error } = await supabase
        .from('products')
        .select(`
          id, title, base_price_per_unit, unit_label, bulk_minimum_order, quality_grade, hero_image_url, technical_specifications,
          sector_id (slug),
          supplier_id (company_name)
        `)
        .limit(20);

      if (!error && data) {
        const mapped = data.map(p => ({
          id: p.id,
          name: p.title,
          price: p.base_price_per_unit,
          unit: p.unit_label,
          moq: p.bulk_minimum_order,
          badge: p.quality_grade === 'Premium' ? 'Trade Assurance' : (p.quality_grade ? 'Verified' : null),
          image: (p.hero_image_url && p.hero_image_url.trim() !== '')
            ? p.hero_image_url
            : 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&q=80',
          category: p.sector_id?.slug || 'general',
          supplierName: p.technical_specifications?.['Supplier Name'] || p.supplier_id?.company_name || 'Verified Supplier'
        }));

        featuredProducts = mapped.slice(0, 8);
        trendingProducts = mapped.slice(8, 20);
      }

      // Fetch Live Open RFQs
      const { data: rfqData, error: rfqError } = await supabase
        .from('rfqs')
        .select(`
          id, product_name, quantity, unit, target_price, destination, deadline, notes, status, created_at,
          users:buyer_id (company_name, city, state, verification_level)
        `)
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(6);

      if (!rfqError && rfqData && rfqData.length > 0) {
        liveRfqs = rfqData;
      }

      // Fetch all category counts
      const { data: countData, error: countError } = await supabase
        .from('products')
        .select('sector_id(slug)');

      if (!countError && countData) {
        countData.forEach(p => {
          const slug = p.sector_id?.slug;
          if (slug) {
            categoryCounts[slug] = (categoryCounts[slug] || 0) + 1;
          }
        });
      }

      // Fetch Top Suppliers
      const { data: supplierData, error: supplierError } = await supabase
        .from('users')
        .select('id, company_name, city, state, categories, created_at, verification_level')
        .eq('role', 'supplier')
        .eq('onboarding_complete', true)
        .limit(6);

      if (!supplierError && supplierData) {
        topSuppliers = supplierData.map(s => ({
          id: s.id,
          name: s.company_name || 'Verified Supplier',
          location: [s.city, s.state].filter(Boolean).join(', ') || 'India',
          sector: s.categories?.[0] || 'Industrial',
          tier: s.verification_level === 'Diamond' ? 'Diamond' : (s.verification_level === 'Platinum' ? 'Platinum' : 'Gold'),
          yearEstablished: new Date(s.created_at).getFullYear(),
          responseRate: '98%',
          responseTime: '< 2h',
          products: 24,
          icon: '🏭',
        }));
      }
    }
  } catch (e) {
    console.error("Failed to fetch data for homepage", e);
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <main className="flex-1">
        <EcommerceHero initialBanners={heroBanners} />
        <FeaturedProducts initialProducts={featuredProducts} />
        <LiveRFQsSection initialRfqs={liveRfqs} />
        <TrendingProductsSection initialProducts={trendingProducts} />
        <TopSuppliersSection initialSuppliers={topSuppliers} />
        <CategoryShowcase initialProducts={[...featuredProducts, ...trendingProducts]} />
        <AnimatedCategoryGrid categoryCounts={categoryCounts} />
        <KnowledgeHubFaq />
      </main>
      <Footer />
    </div>
  );
}
