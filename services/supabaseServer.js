// ============================================================================
// SUPABASE SERVER CLIENT
// ============================================================================
// Used in Server Components, Server Actions, and API Route Handlers.
// Manages session via HTTP-only cookies for secure server-side operations.
// ============================================================================

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Creates a Supabase client for server-side operations.
 * Must be called within a server context (Server Components, Route Handlers).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set(name, value, options) {
          try {
            cookieStore.set(name, value, options);
          } catch (error) {
            // set() is not available in Server Components — ignore gracefully
          }
        },
        remove(name, options) {
          try {
            cookieStore.delete(name, options);
          } catch (error) {
            // delete() is not available in Server Components — ignore gracefully
          }
        },
      },
    }
  );
}

/**
 * Creates a Supabase Admin client with service_role key.
 * ONLY for trusted server-side operations (cron jobs, webhooks).
 * Bypasses Row Level Security.
 */
export function createAdminClient() {
  const { createClient: createSupabaseClient } = require('@supabase/supabase-js');
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}
