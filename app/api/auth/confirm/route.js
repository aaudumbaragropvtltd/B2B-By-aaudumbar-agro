// ============================================================================
// EMAIL CONFIRMATION VERIFICATION ROUTE
// ============================================================================
// Handles one-click email confirmation links clicked by users.
// Verifies token_hash with Supabase Auth, updates public.users status,
// and redirects to /login?verified=true.
// ============================================================================

import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') || 'signup';
  const next = searchParams.get('next') || '/login?verified=true';

  if (!token_hash) {
    return NextResponse.redirect(`${origin}/login?error=invalid_token`);
  }

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

  const { data, error } = await supabase.auth.verifyOtp({
    type,
    token_hash,
  });

  if (error) {
    console.error('Email verification error:', error.message);
    return NextResponse.redirect(
      `${origin}/login?error=verification_failed&message=${encodeURIComponent(error.message)}`
    );
  }

  // Update public.users status to 'active'
  const user = data?.user || data?.session?.user;
  if (user?.id || user?.email) {
    try {
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        { auth: { persistSession: false } }
      );

      await supabaseAdmin
        .from('users')
        .update({
          status: 'active',
          updated_at: new Date().toISOString(),
        })
        .or(`firebase_uid.eq.${user.id},registered_email.eq.${user.email}`);
    } catch (dbErr) {
      console.warn('Notice: updating user status after verification:', dbErr.message);
    }
  }

  // Redirect to target with success flag
  const targetPath = next.startsWith('/') ? next : `/${next}`;
  return NextResponse.redirect(`${origin}${targetPath}`);
}
