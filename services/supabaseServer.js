// ============================================================================
// SUPABASE SERVER CLIENT
// ============================================================================
// Used in Server Components, Server Actions, and API Route Handlers.
// Manages session via HTTP-only cookies for secure server-side operations.
// Includes strict timeout to prevent Next.js from hanging when Supabase is paused.
// ============================================================================

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const DB_TIMEOUT_MS = 6000;

function resilientFetch(url, options = {}) {
  const signal = options.signal || (typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? AbortSignal.timeout(DB_TIMEOUT_MS) : undefined);
  return fetch(url, { ...options, signal });
}

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
      global: {
        fetch: resilientFetch
      },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch (error) {
            // setAll was called from a Server Component — ignore gracefully
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
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      global: {
        fetch: resilientFetch
      }
    }
  );
}
