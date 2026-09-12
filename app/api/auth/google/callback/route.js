// ============================================================================
// CUSTOM GOOGLE OAUTH CALLBACK
// ============================================================================
// Handles Google's redirect after user grants consent.
// Exchanges the authorization code for an id_token via Google's token endpoint,
// then signs the user into Supabase using signInWithIdToken().
// This bypasses the .supabase.co URL on the Google consent screen.
// ============================================================================

import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=Missing+authorization+code`);
  }

  const redirectUri = `${origin}/api/auth/google/callback`;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${origin}/login?error=Server+configuration+error`);
  }

  try {
    // ── Step 1: Exchange authorization code for tokens ──
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok) {
      throw new Error(tokenData.error_description || 'Failed to exchange code');
    }

    const { id_token } = tokenData;

    if (!id_token) {
      throw new Error('No id_token received from Google');
    }

    // ── Step 2: Create Supabase server client with cookie management ──
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

    // ── Step 3: Sign into Supabase with the Google ID token ──
    const { data, error: signInError } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: id_token,
    });

    if (signInError) throw signInError;

    // ── Step 4: Check onboarding status (same logic as existing callback) ──
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
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
  } catch (err) {
    console.error('Google OAuth callback error:', err);
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(err.message)}`);
  }
}
