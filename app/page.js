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
import { getActiveBanners, optimizeBannerImageUrl } from '@/utils/platformBanners';
import { optimizeProductImageUrl } from '@/utils/imageOptimizer';
import {
  getSiteUrl,
  getPlatformKnowledgeFaqs,
  generateFaqJsonLd,
  generateEscrowHowToJsonLd,
  INDIAN_STATES_SERVED,
} from '@/utils/seoUtils';

export const revalidate = 60;

export default async function HomePage() {
  const siteUrl = getSiteUrl();

  const platformFaqs = getPlatformKnowledgeFaqs();
  const faqSchema = generateFaqJsonLd(platformFaqs);
  const escrowHowToSchema = generateEscrowHowToJsonLd();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
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
    const bannerPromise = getActiveBanners().catch((err) => {
      console.warn('Failed to load hero banners from CMS:', err?.message);
      return [];
    });

    let productsPromise = Promise.resolve({ data: null, error: null });
    let rfqPromise = Promise.resolve({ data: null, error: null });
    let countPromise = Promise.resolve({ data: null, error: null });
    let supplierPromise = Promise.resolve({ data: null, error: null });

    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { createAdminClient } = await import('@/services/supabaseServer');
      const supabase = createAdminClient();

      productsPromise = supabase
        .from('products')
        .select(`
          id, title, base_price_per_unit, unit_label, bulk_minimum_order, quality_grade, hero_image_url, technical_specifications,
          sector_id (slug),
          supplier_id (company_name)
        `)
        .limit(20);

      rfqPromise = supabase
        .from('rfqs')
        .select(`
          id, product_name, quantity, unit, target_price, destination, deadline, notes, status, created_at,
          users:buyer_id (company_name, city, state, verification_level)
        `)
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(6);

      countPromise = supabase
        .from('products')
        .select('sector_id(slug)')
        .limit(500);

      supplierPromise = supabase
        .from('users')
        .select('id, company_name, city, state, categories, created_at, verification_level')
        .eq('role', 'supplier')
        .eq('onboarding_complete', true)
        .limit(6);
    }

    // Execute all 5 data sources concurrently for lightning-fast server response
    const [bannerRes, productsRes, rfqRes, countRes, supplierRes] = await Promise.allSettled([
      bannerPromise,
      productsPromise,
      rfqPromise,
      countPromise,
      supplierPromise,
    ]);

    if (bannerRes.status === 'fulfilled' && Array.isArray(bannerRes.value)) {
      heroBanners = bannerRes.value;
    }

    if (productsRes.status === 'fulfilled' && productsRes.value?.data) {
      const mapped = productsRes.value.data.map(p => ({
        id: p.id,
        name: p.title,
        price: p.base_price_per_unit,
        unit: p.unit_label,
        moq: p.bulk_minimum_order,
        badge: p.quality_grade === 'Premium' ? 'Trade Assurance' : (p.quality_grade ? 'Verified' : null),
        image: optimizeProductImageUrl(p.hero_image_url, { width: 400 }),
        category: p.sector_id?.slug || 'general',
        supplierName: p.technical_specifications?.['Supplier Name'] || p.supplier_id?.company_name || 'Verified Supplier'
      }));

      featuredProducts = mapped.slice(0, 8);
      trendingProducts = mapped.slice(8, 20);
    }

    if (rfqRes.status === 'fulfilled' && rfqRes.value?.data && rfqRes.value.data.length > 0) {
      liveRfqs = rfqRes.value.data;
    }

    if (countRes.status === 'fulfilled' && countRes.value?.data) {
      countRes.value.data.forEach(p => {
        const slug = p.sector_id?.slug;
        if (slug) {
          categoryCounts[slug] = (categoryCounts[slug] || 0) + 1;
        }
      });
    }

    if (supplierRes.status === 'fulfilled' && supplierRes.value?.data) {
      topSuppliers = supplierRes.value.data.map(s => ({
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
  } catch (e) {
    console.error("Failed to fetch data for homepage", e);
  }

  const primaryBannerImg =
    heroBanners[0]?.hero_image_url ||
    'https://res.cloudinary.com/pjsh8sfp/image/upload/f_auto,q_auto,w_1000/v1789108422/b2b-bharat/banners/1789108417666_ChatGPT_Image_Sep_11__2026__12.jpg';
  const preloadMobileUrl = optimizeBannerImageUrl(primaryBannerImg, 600);
  const preloadDesktopUrl = optimizeBannerImageUrl(primaryBannerImg, 1000);

  return (
    <div className="bg-gray-50 min-h-screen">
      <link
        rel="preload"
        as="image"
        href={preloadDesktopUrl}
        imageSrcSet={`${preloadMobileUrl} 600w, ${preloadDesktopUrl} 1000w`}
        imageSizes="(max-width: 640px) 100vw, 1000px"
        fetchPriority="high"
      />
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
