// ============================================================================
// RESET PASSWORD API
// ============================================================================
// Verifies password reset OTP code or token_hash and updates the user's
// password in Supabase Auth.
// ============================================================================

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, otp, token_hash, newPassword } = body;

    const emailTrimmed = email ? email.trim().toLowerCase() : '';
    const newPasswordTrimmed = newPassword ? newPassword.trim() : '';

    if (!newPasswordTrimmed || newPasswordTrimmed.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );
    const supabaseAnon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { auth: { persistSession: false } }
    );

    let verifiedUserId = null;

    // 1. Try verify via OTP code
    if (otp && emailTrimmed) {
      const { data, error } = await supabaseAnon.auth.verifyOtp({
        email: emailTrimmed,
        token: otp.trim(),
        type: 'recovery',
      });

      if (!error && data?.user?.id) {
        verifiedUserId = data.user.id;
      } else if (error) {
        console.warn('OTP verification attempt failed:', error.message);
      }
    }

    // 2. Try verify via token_hash if not already verified
    if (!verifiedUserId && token_hash) {
      const { data, error } = await supabaseAnon.auth.verifyOtp({
        token_hash: token_hash.trim(),
        type: 'recovery',
      });

      if (!error && data?.user?.id) {
        verifiedUserId = data.user.id;
      } else if (error) {
        console.warn('Token hash verification attempt failed:', error.message);
      }
    }

    if (!verifiedUserId) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP code or reset link. Please request a fresh reset code.' },
        { status: 400 }
      );
    }

    if (!verifiedUserId) {
      return NextResponse.json(
        { error: 'Could not identify account from the provided credentials.' },
        { status: 400 }
      );
    }

    // 3. Update the password using Supabase Admin
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      verifiedUserId,
      { password: newPasswordTrimmed }
    );

    if (updateError) {
      console.error('Failed to update password:', updateError.message);
      return NextResponse.json(
        { error: updateError.message || 'Failed to update password. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully! You can now log in with your new password.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
