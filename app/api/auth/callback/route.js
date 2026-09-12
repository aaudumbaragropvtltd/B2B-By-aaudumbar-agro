// ============================================================================
// SUPABASE AUTH CALLBACK ROUTE
// ============================================================================
// Handles the OAuth redirect from Google Sign-In.
// Exchanges the authorization code for a Supabase session.
// Redirects new users to /onboarding, returning users to /dashboard.
// ============================================================================

import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value;
          },
          set(name, value, options) {
            cookieStore.set(name, value, options);
          },
          remove(name, options) {
            cookieStore.delete(name, options);
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Check if user has completed onboarding
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Initialize Admin client to bypass RLS for profile checks
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseAdmin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY,
          { auth: { persistSession: false } }
        );

        const { data: profile } = await supabaseAdmin
          .from('users')
          .select('onboarding_complete')
          .eq('firebase_uid', user.id)
          .single();

        // New user or incomplete onboarding → go to onboarding
        if (!profile || !profile.onboarding_complete) {
          return NextResponse.redirect(`${origin}/onboarding`);
        }
      }

      // Existing user with completed onboarding → go to dashboard
      return NextResponse.redirect(`${origin}/dashboard`);
    }
  }

  // If there's an error or no code, redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
