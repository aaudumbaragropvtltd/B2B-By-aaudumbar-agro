// ============================================================================
// PROXY (Next.js 16 Convention)
// ============================================================================
// Replaces deprecated middleware.js:
// 1. Supabase session refresh (cookie-based token renewal)
// 2. Route protection — redirects unauthenticated users to /login
// 3. Admin protection — strictly requires rsevmail@gmail.com or b2b_admin_token
// 4. Onboarding check — redirects incomplete profiles to /onboarding
// ============================================================================

import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

export async function proxy(request) {
  const pathname = request.nextUrl.pathname;

  let response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-key',
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set({ name, value, ...options })
          );
        },
      },
    }
  );

  // Refresh the session — this keeps the user logged in
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data?.user;
  } catch (e) {
    // Suppress error
  }

  // Initialize Admin client to bypass RLS for profile checks
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'mock-key',
    { auth: { persistSession: false } }
  );

  // ── Route protection: Dashboard requires auth ──
  if (pathname.startsWith('/dashboard') && !user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // ── Route protection: Admin strictly requires rsevmail@gmail.com or b2b_admin_token ──
  if (pathname.startsWith('/admin')) {
    // 1. Allow the admin login page itself
    if (pathname === '/admin/login') {
      return response;
    }

    const ADMIN_EMAIL = 'rsevmail@gmail.com';

    // If a user is logged in, ONLY rsevmail@gmail.com is permitted
    if (user) {
      if (user.email?.toLowerCase() !== ADMIN_EMAIL) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
      return response;
    }

    // 2. Fallback check for cookie-based admin auth
    const adminToken = request.cookies.get('b2b_admin_token')?.value;
    if (adminToken) {
      return response;
    }

    // 3. Unauthorized — redirect to admin login
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  // ── Redirect logged-in users away from login page ──
  if (pathname === '/login' && user) {
    try {
      const { data: profile } = await supabaseAdmin
        .from('users')
        .select('onboarding_complete')
        .eq('firebase_uid', user.id)
        .single();

      if (!profile || !profile.onboarding_complete) {
        return NextResponse.redirect(new URL('/onboarding', request.url));
      }
    } catch (e) {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // ── Onboarding check: authenticated users with incomplete profiles ──
  if (pathname.startsWith('/dashboard') && user) {
    try {
      const { data: profile } = await supabaseAdmin
        .from('users')
        .select('onboarding_complete, role')
        .eq('firebase_uid', user.id)
        .single();

      if (!profile || !profile.onboarding_complete) {
        return NextResponse.redirect(new URL('/onboarding', request.url));
      }
    } catch (e) {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }
  }

  // ── Onboarding page: only for authenticated users ──
  if (pathname === '/onboarding' && !user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // ── If already onboarded, skip onboarding page ──
  if (pathname === '/onboarding' && user) {
    try {
      const { data: profile } = await supabaseAdmin
        .from('users')
        .select('onboarding_complete')
        .eq('firebase_uid', user.id)
        .single();

      if (profile?.onboarding_complete) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    } catch (e) {
      // Let them proceed to onboarding
    }
  }

  return response;
}

// Next.js 16 matcher: explicitly exclude API routes, static files, and images
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
