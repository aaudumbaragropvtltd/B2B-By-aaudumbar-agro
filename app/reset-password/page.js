// ============================================================================
// RESET PASSWORD PAGE
// ============================================================================
// Dedicated page for setting a new password via 8-digit OTP code, Supabase
// recovery session, or direct recovery token_hash link sent to the user's email.
// ============================================================================

"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import B2BLogo from '@/components/B2BLogo';
import { createClient } from '@/services/supabase';

function ResetPasswordForm() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [tokenHash, setTokenHash] = useState('');
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Read URL search params & hash on client mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const emailParam = params.get('email');
      const hashParam = params.get('token_hash');
      const otpParam = params.get('otp');
      const recoveryParam = params.get('recovery');

      if (emailParam) setEmail(emailParam);
      if (hashParam) setTokenHash(hashParam);
      if (otpParam) setOtpCode(otpParam);
      if (recoveryParam === 'true') setHasRecoverySession(true);

      // Check hash fragment for Supabase recovery tokens
      const hash = window.location.hash || '';
      if (hash.includes('type=recovery') || hash.includes('access_token')) {
        setHasRecoverySession(true);
      }
    }

    // Also listen to Supabase auth state change for PASSWORD_RECOVERY
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (session && window.location.hash.includes('type=recovery'))) {
        setHasRecoverySession(true);
      }
    });

    return () => subscription?.unsubscribe();
  }, [supabase]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const emailTrimmed = email.trim().toLowerCase();
    const newPassTrimmed = newPassword.trim();
    const confirmPassTrimmed = confirmPassword.trim();
    const otpTrimmed = otpCode.trim();

    if (!newPassTrimmed || newPassTrimmed.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassTrimmed !== confirmPassTrimmed) {
      setError('Passwords do not match. Please ensure both passwords match.');
      return;
    }

    setLoading(true);

    try {
      // Method A: If active Supabase recovery session exists in client
      if (hasRecoverySession) {
        const { error: updateError } = await supabase.auth.updateUser({
          password: newPassTrimmed,
        });

        if (!updateError) {
          setSuccess('🎉 Password updated successfully! Redirecting to login...');
          setTimeout(() => {
            router.push('/login?verified=true');
          }, 1500);
          return;
        }
        console.warn('Direct Supabase session update failed, falling back to API:', updateError.message);
      }

      // Method B: Verify via OTP code or token_hash via backend API
      if (!tokenHash && !otpTrimmed) {
        setError('Please enter the 8-digit OTP verification code from your email.');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailTrimmed,
          otp: otpTrimmed || undefined,
          token_hash: tokenHash ? tokenHash.trim() : undefined,
          newPassword: newPassTrimmed,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset password.');
      }

      setSuccess('🎉 Password updated successfully! Redirecting to login...');
      setTimeout(() => {
        router.push('/login?verified=true');
      }, 1500);
    } catch (err) {
      console.error('Password reset failed:', err);
      setError(err.message || 'Failed to update password. Please check your OTP code and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-border-subtle shadow-xl space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-3">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <B2BLogo className="w-10 h-10" />
          <span className="text-2xl font-black text-foreground tracking-tight">B2B INDIA</span>
        </Link>
        <h1 className="text-2xl font-extrabold text-foreground">
          Create New Password
        </h1>
        <p className="text-xs text-gray-500 leading-relaxed max-w-xs mx-auto">
          {hasRecoverySession
            ? '✅ Recovery session verified. Enter your new password below.'
            : tokenHash
            ? 'Enter your 8-digit OTP or submit with your verified link.'
            : 'Enter the 8-digit OTP code sent to your email along with your new password.'}
        </p>
      </div>

      {/* Error Alert */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold leading-relaxed"
          >
            ⚠️ {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Alert */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-3.5 rounded-xl bg-green-50 border border-green-200 text-xs text-green-700 font-semibold text-center"
          >
            {success}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form */}
      <form onSubmit={handleSubmit} suppressHydrationWarning className="space-y-4">
        {/* Email Field */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
            Registered Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(''); }}
            required
            placeholder="you@company.com"
            suppressHydrationWarning
            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-border-subtle text-foreground text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all outline-none"
          />
        </div>

        {/* OTP Code */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
              8-Digit OTP Code
            </label>
            <span className="text-[11px] text-brand-600 font-semibold">
              {hasRecoverySession ? 'Auto-verified from email link' : 'from email'}
            </span>
          </div>
          <input
            type="text"
            value={otpCode}
            onChange={(e) => { setOtpCode(e.target.value); setError(''); }}
            required={!hasRecoverySession && !tokenHash}
            maxLength={10}
            placeholder={hasRecoverySession ? '(Session active — optional)' : 'e.g. 12345678'}
            suppressHydrationWarning
            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-border-subtle text-center font-mono font-bold tracking-widest text-lg text-foreground focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all outline-none"
          />
        </div>

        {/* New Password */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
            New Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
              required
              minLength={6}
              placeholder="Minimum 6 characters"
              suppressHydrationWarning
              className="w-full pl-4 pr-11 py-3 rounded-xl bg-gray-50 border border-border-subtle text-foreground text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all outline-none"
            />
            <button
              type="button"
              tabIndex={-1}
              suppressHydrationWarning
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600 transition-colors p-0.5 cursor-pointer"
            >
              {showPassword ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Confirm New Password */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
            Confirm Password
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
              required
              minLength={6}
              placeholder="Re-enter new password"
              suppressHydrationWarning
              className="w-full pl-4 pr-11 py-3 rounded-xl bg-gray-50 border border-border-subtle text-foreground text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all outline-none"
            />
            <button
              type="button"
              tabIndex={-1}
              suppressHydrationWarning
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600 transition-colors p-0.5 cursor-pointer"
            >
              {showConfirmPassword ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          suppressHydrationWarning
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 text-white font-bold text-sm shadow-lg shadow-brand-600/25 transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Updating Password...
            </>
          ) : (
            '🔐 Update Password & Sign In'
          )}
        </button>
      </form>

      {/* Footer Navigation */}
      <div className="pt-4 border-t border-gray-100 text-center">
        <Link
          href="/login"
          className="text-xs text-gray-500 hover:text-brand-600 font-semibold transition-colors"
        >
          ← Return to Login
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6">
      <Suspense fallback={<div className="text-sm font-bold text-gray-500">Loading...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}
