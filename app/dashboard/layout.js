// ============================================================================
// DASHBOARD LAYOUT
// ============================================================================
// Shared layout for all /dashboard/* routes.
// Provides the Navbar navigation panel to Orders, Support, Settings, etc.
// ============================================================================

import Navbar from '@/components/Navbar';

export default function DashboardLayout({ children }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
