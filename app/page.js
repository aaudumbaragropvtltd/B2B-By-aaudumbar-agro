// ============================================================================
// B2B BHARAT — LANDING PAGE
// ============================================================================
// High-trust landing hub with:
// 1. Animated hero section with trust counters & live transaction feed
// 2. Supplier ticker marquee
// 3. Interactive category grid (10 sectors)
// 4. Platform value proposition section
// 5. Escrow flow explainer
// 6. Footer
// ============================================================================

import Navbar from '@/components/Navbar';
import TrustHeroSection from '@/components/TrustHeroSection';
import SupplierTicker from '@/components/SupplierTicker';
import AnimatedCategoryGrid from '@/components/AnimatedCategoryGrid';
import PlatformValueSection from '@/components/PlatformValueSection';
import EscrowFlowSection from '@/components/EscrowFlowSection';
import Footer from '@/components/Footer';

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <TrustHeroSection />
        <SupplierTicker />
        <AnimatedCategoryGrid />
        <PlatformValueSection />
        <EscrowFlowSection />
      </main>
      <Footer />
    </>
  );
}
