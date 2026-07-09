// ============================================================================
// SUPABASE BROWSER CLIENT
// ============================================================================
// Used in Client Components for interactive UI operations.
// Uses @supabase/ssr createBrowserClient for cookie-based session management.
// ============================================================================

import { createBrowserClient } from '@supabase/ssr';

/**
 * Creates a Supabase client for use in browser/client components.
 * Reads public env vars exposed to the browser.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
