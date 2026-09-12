// ============================================================================
// LOGIN PAGE
// ============================================================================
// Supabase Email/Password + Google OAuth authentication.
// Login: email + password → dashboard (if onboarded) or onboarding
// Register: email + password → onboarding page
// Google: OAuth → onboarding (new) or dashboard (existing)
// ============================================================================

"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/services/supabase';
import B2BLogo from '@/components/B2BLogo';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1 = Enter Email, 2 = Enter OTP & New Password
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotShowPassword, setForgotShowPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotResetLoading, setForgotResetLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotError, setForgotError] = useState('');

  // Email verification & registration states
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [unconfirmedEmail, setUnconfirmedEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  // Detect verification callback query params and reset recovery requests
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const hash = window.location.hash || '';

      if (params.get('verified') === 'true') {
        setSuccess('🎉 Your email has been verified successfully! Please sign in to access your dashboard.');
        setIsLogin(true);
      } else if (params.get('error') === 'verification_failed') {
        const msg = params.get('message');
        setError(msg ? `Email verification failed: ${msg}. Please request a new confirmation email below.` : 'The verification link was invalid or expired. Please request a new confirmation email below.');
      } else if (params.get('reset') === 'true' || params.get('mode') === 'reset' || hash.includes('type=recovery')) {
        setIsLogin(true);
        setShowForgotPassword(true);
        if (params.get('email')) setForgotEmail(params.get('email'));
        if (params.get('otp')) {
          setForgotOtp(params.get('otp'));
          setForgotStep(2);
        }
      }
    }
  }, []);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
    setSuccess('');
    setUnconfirmedEmail('');
    setResendMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    setResendMessage('');

    const emailTrimmed = formData.email.trim();
    const passwordTrimmed = formData.password;

    // Check for reserved domains that Supabase GoTrue blocks
    if (emailTrimmed.endsWith('@example.com') || emailTrimmed.endsWith('@test.com') || emailTrimmed.endsWith('@example.org') || emailTrimmed.endsWith('@invalid.com')) {
      setError('Please use an active business email address such as name@company.in or name@gmail.com.');
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        // ── Sign In with Email/Password ──
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: emailTrimmed,
          password: passwordTrimmed,
        });

        if (signInError) {
          if (signInError.message?.toLowerCase().includes('email not confirmed')) {
            setUnconfirmedEmail(emailTrimmed);
            throw new Error('Your email address has not been confirmed yet. Please check your inbox or click the button below to resend confirmation email.');
          }
          throw signInError;
        }

        // Redirect to dashboard
        router.push('/dashboard');
        router.refresh();
      } else {
        // ── Sign Up with Email/Password via Backend Dispatch Engine ──
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: emailTrimmed,
            password: passwordTrimmed,
          }),
        });

        let data = {};
        try {
          data = await res.json();
        } catch {
          data = { error: 'Server returned an invalid response. Please try again.' };
        }

        if (!res.ok) {
          throw new Error(data.error || 'Failed to complete registration.');
        }

        setRegisteredEmail(emailTrimmed);
        setRegistrationSuccess(true);
        setSuccess('📬 Verification email dispatched! Please check your inbox.');
      }
    } catch (err) {
      console.error("Authentication failed:", err.message);
      setError(err.message || "Authentication failed. Please check your credentials and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async (targetEmail) => {
    const emailToUse = targetEmail || registeredEmail || formData.email.trim();
    if (!emailToUse) return;

    setResendLoading(true);
    setResendMessage('');
    setError('');

    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToUse }),
      });

      let data = {};
      try {
        data = await res.json();
      } catch {
        data = { error: 'Server returned an invalid response. Please try again.' };
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to resend verification email.');
      }

      setResendMessage(data.message || `Fresh verification email sent to ${emailToUse}! Please check your inbox.`);
    } catch (err) {
      setError(err.message || 'Failed to resend confirmation email.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpCode || !otpCode.trim()) {
      setOtpError('Please enter the 8-digit verification code.');
      return;
    }

    setOtpLoading(true);
    setOtpError('');
    setError('');

    try {
      const emailToUse = registeredEmail || formData.email.trim();
      const { data, error: verifyErr } = await supabase.auth.verifyOtp({
        email: emailToUse,
        token: otpCode.trim(),
        type: 'signup',
      });

      if (verifyErr) throw verifyErr;

      setSuccess('🎉 Account verified successfully! Redirecting...');
      setTimeout(() => {
        router.push('/onboarding');
        router.refresh();
      }, 800);
    } catch (err) {
      setOtpError(err.message || 'Invalid or expired verification code. Please check your code or click resend.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      // Redirect to our custom Google OAuth endpoint
      window.location.href = '/api/auth/google';
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    if (e) e.preventDefault();
    if (!forgotEmail || !forgotEmail.trim()) {
      setForgotError('Please enter your email address.');
      return;
    }
    setForgotLoading(true);
    setForgotMessage('');
    setForgotError('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim().toLowerCase() }),
      });

      let data = {};
      try {
        data = await res.json();
      } catch {
        data = { error: 'Server returned an invalid response. Please try again.' };
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send reset email');
      }

      setForgotMessage(data.message || '8-digit password reset OTP has been sent to your email!');
      setForgotStep(2);
    } catch (err) {
      setForgotError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    if (e) e.preventDefault();
    setForgotResetLoading(true);
    setForgotError('');
    setForgotMessage('');

    const emailTrimmed = forgotEmail.trim().toLowerCase();
    const otpTrimmed = forgotOtp.trim();
    const newPassTrimmed = forgotNewPassword.trim();
    const confirmPassTrimmed = forgotConfirmPassword.trim();

    if (!otpTrimmed || otpTrimmed.length < 6) {
      setForgotError('Please enter the 8-digit OTP code sent to your email.');
      setForgotResetLoading(false);
      return;
    }

    if (!newPassTrimmed || newPassTrimmed.length < 6) {
      setForgotError('Password must be at least 6 characters long.');
      setForgotResetLoading(false);
      return;
    }

    if (newPassTrimmed !== confirmPassTrimmed) {
      setForgotError('Passwords do not match. Please verify both passwords match.');
      setForgotResetLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailTrimmed,
          otp: otpTrimmed,
          newPassword: newPassTrimmed,
        }),
      });

      let data = {};
      try {
        data = await res.json();
      } catch {
        data = { error: 'Server returned an invalid response. Please try again.' };
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset password.');
      }

      setForgotMessage('🎉 Password updated successfully! Logging you in...');

      // Attempt automatic sign-in with newly set password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: emailTrimmed,
        password: newPassTrimmed,
      });

      if (signInError) {
        setShowForgotPassword(false);
        setSuccess('🎉 Password reset successfully! Please log in with your new password.');
        setFormData(prev => ({ ...prev, email: emailTrimmed, password: '' }));
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err) {
      console.error('Password reset error:', err);
      setForgotError(err.message || 'Failed to update password. Please check your OTP code and try again.');
    } finally {
      setForgotResetLoading(false);
    }
  };

  const handleDemoLogin = async (email) => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: 'password123',
      });
      if (signInError) throw signInError;
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 animated-gradient items-center justify-center p-12 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }} />
        <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-accent-500/20 blur-[120px]" />

        <div className="relative z-10 max-w-md">
          <Link href="/" className="flex items-center gap-3 mb-12">
            <B2BLogo className="w-12 h-12" />
            <span className="text-2xl font-bold text-white">B2B INDIA</span>
          </Link>

          <h1 className="text-4xl font-extrabold text-white leading-tight mb-6">
            India&apos;s Most Trusted B2B Trade Platform
          </h1>
          <p className="text-lg text-white/60 leading-relaxed mb-10">
            Join 12,400+ verified suppliers and buyers across 38 industrial sectors.
            Automated escrow, AI pricing, and instant settlement.
          </p>

          {/* Trust Stats */}
          <div className="grid grid-cols-3 gap-6">
            {[
              { value: '₹2,400Cr', label: 'Monthly GMV' },
              { value: '38', label: 'Sectors' },
              { value: '287+', label: 'Cities' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-white/40 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-surface-elevated">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <Link href="/" className="lg:hidden flex items-center gap-3 mb-8">
            <B2BLogo className="w-10 h-10" />
            <span className="text-xl font-bold text-foreground">B2B INDIA</span>
          </Link>

          {/* Header */}
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-2">
            {isLogin ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="text-gray-500 mb-8">
            {isLogin
              ? 'Sign in to access your trade dashboard'
              : 'Register to start trading on B2B India'}
          </p>

          {/* Toggle */}
          <div className="flex rounded-xl bg-white border border-border-subtle p-1 mb-8" suppressHydrationWarning>
            {['Login', 'Register'].map((tab) => (
              <button
                key={tab}
                type="button"
                suppressHydrationWarning
                onClick={() => {
                  const isLog = tab === 'Login';
                  setIsLogin(isLog);
                  setError('');
                  setSuccess('');
                  setShowForgotPassword(false);
                  setForgotError('');
                  setForgotMessage('');
                  setForgotStep(1);
                }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  (tab === 'Login') === isLogin
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700"
              >
                <div>{error}</div>
                {unconfirmedEmail && (
                  <div className="mt-2.5 pt-2 border-t border-red-200/80 flex items-center justify-between gap-2">
                    <span className="text-xs text-red-600 font-medium">Haven&apos;t received it?</span>
                    <button
                      type="button"
                      disabled={resendLoading}
                      suppressHydrationWarning
                      onClick={() => handleResendVerification(unconfirmedEmail)}
                      className="text-xs font-bold text-brand-600 hover:text-brand-700 underline disabled:opacity-50"
                    >
                      {resendLoading ? 'Sending email...' : 'Resend confirmation email →'}
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Resend Notice */}
          <AnimatePresence>
            {resendMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-700 font-semibold"
              >
                📬 {resendMessage}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Success */}
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-3 rounded-xl bg-green-50 border border-green-200 text-sm text-green-700 font-semibold"
              >
                {success}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Registration Success & Verification Card */}
          {registrationSuccess ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-6 rounded-2xl bg-white border border-border-subtle shadow-sm space-y-5"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-500 text-white flex items-center justify-center text-2xl mx-auto shadow-md shadow-brand-500/20">
                📬
              </div>

              <div className="text-center">
                <h3 className="text-lg font-bold text-foreground">
                  Check Your Inbox to Activate
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  We sent an official activation email &amp; verification code to:
                </p>
                <div className="inline-block mt-2 px-3 py-1 bg-brand-50 text-brand-700 font-bold rounded-lg text-sm border border-brand-100 break-all">
                  {registeredEmail}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-800 leading-relaxed">
                💡 <strong>Instructions:</strong> Open the email from <strong>B2B India</strong> and click the <strong>&quot;Confirm Email &amp; Activate Account&quot;</strong> button to proceed. (Please check your Spam or Promotions tab if not seen in 1 minute).
              </div>

              {/* OTP Direct Entry Option */}
              <form onSubmit={handleVerifyOtp} suppressHydrationWarning className="pt-3 border-t border-gray-100 space-y-3">
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider text-center">
                  Or enter 8-digit OTP from email
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={otpCode}
                    onChange={(e) => { setOtpCode(e.target.value); setOtpError(''); }}
                    placeholder="e.g. 12345678"
                    maxLength={10}
                    suppressHydrationWarning
                    className="flex-1 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-center font-mono font-bold tracking-widest text-base text-foreground focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all outline-none"
                  />
                  <button
                    type="submit"
                    disabled={otpLoading || !otpCode.trim()}
                    suppressHydrationWarning
                    className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition-all disabled:opacity-50 whitespace-nowrap cursor-pointer"
                  >
                    {otpLoading ? 'Verifying...' : 'Verify OTP'}
                  </button>
                </div>
                {otpError && (
                  <p className="text-xs text-red-600 font-medium text-center">{otpError}</p>
                )}
              </form>

              {/* Resend and Return Actions */}
              <div className="pt-3 border-t border-gray-100 space-y-2 text-center">
                <button
                  type="button"
                  disabled={resendLoading}
                  suppressHydrationWarning
                  onClick={() => handleResendVerification(registeredEmail)}
                  className="w-full py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold border border-gray-200 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {resendLoading ? 'Sending new email...' : 'Didn\'t receive email? Resend verification'}
                </button>

                <div>
                  <button
                    type="button"
                    suppressHydrationWarning
                    onClick={() => {
                      setRegistrationSuccess(false);
                      setIsLogin(true);
                      setError('');
                    }}
                    className="text-xs text-brand-600 hover:text-brand-700 font-semibold cursor-pointer"
                  >
                    ← Return to Login
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
          /* Normal Form */
          <form onSubmit={handleSubmit} suppressHydrationWarning className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Business Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                suppressHydrationWarning
                placeholder="you@company.com"
                className="w-full px-4 py-3 rounded-xl bg-white border border-border-subtle text-foreground placeholder:text-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all text-sm"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                suppressHydrationWarning
                placeholder="Min 6 characters"
                className="w-full px-4 py-3 rounded-xl bg-white border border-border-subtle text-foreground placeholder:text-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all text-sm"
              />
              {isLogin && (
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => { setShowForgotPassword(true); setForgotMessage(''); setForgotError(''); setForgotEmail(formData.email); }}
                  className="mt-1.5 text-xs text-brand-600 hover:text-brand-700 font-semibold transition-colors"
                >
                  Forgot Password?
                </button>
              )}
            </div>

            {/* Forgot Password Modal */}
            <AnimatePresence>
              {isLogin && showForgotPassword && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 shadow-sm space-y-3.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base">🔑</span>
                        <h3 className="text-sm font-bold text-blue-950">
                          {forgotStep === 1 ? 'Reset Your Password' : 'Enter OTP & Set New Password'}
                        </h3>
                      </div>
                      <button
                        type="button"
                        suppressHydrationWarning
                        onClick={() => {
                          setShowForgotPassword(false);
                          setForgotStep(1);
                          setForgotError('');
                          setForgotMessage('');
                        }}
                        className="text-gray-400 hover:text-gray-600 text-lg leading-none p-1 rounded-md cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    {forgotError && (
                      <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold leading-relaxed">
                        ⚠️ {forgotError}
                      </div>
                    )}

                    {forgotMessage && (
                      <div className="p-2.5 rounded-xl bg-green-50 border border-green-200 text-xs text-green-700 font-semibold leading-relaxed">
                        ✅ {forgotMessage}
                      </div>
                    )}

                    {/* Step 1: Enter Email */}
                    {forgotStep === 1 ? (
                      <div className="space-y-2.5">
                        <p className="text-xs text-blue-800/80 leading-relaxed">
                          Enter your registered email address. We will immediately dispatch an 8-digit OTP code to verify your identity.
                        </p>
                        <div className="flex gap-2">
                          <input
                            type="email"
                            value={forgotEmail}
                            onChange={(e) => { setForgotEmail(e.target.value); setForgotError(''); }}
                            placeholder="you@company.com"
                            required
                            suppressHydrationWarning
                            className="flex-1 px-3.5 py-2.5 rounded-xl bg-white border border-blue-200 text-foreground placeholder:text-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all text-sm outline-none"
                          />
                          <button
                            type="button"
                            suppressHydrationWarning
                            onClick={handleForgotPassword}
                            disabled={forgotLoading || !forgotEmail}
                            className="px-4 py-2.5 rounded-xl bg-brand-600 text-white font-bold text-xs uppercase tracking-wider hover:bg-brand-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shadow-sm cursor-pointer"
                          >
                            {forgotLoading ? 'Sending...' : 'Send OTP'}
                          </button>
                        </div>
                        <div className="text-right">
                          <button
                            type="button"
                            onClick={() => { setForgotStep(2); setForgotError(''); }}
                            className="text-[11px] text-blue-700 hover:underline font-semibold cursor-pointer"
                          >
                            Already have an OTP? Click here →
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Step 2: Enter OTP & New Password */
                      <div className="space-y-3 bg-white p-3.5 rounded-xl border border-blue-100 shadow-xs">
                        <div className="flex items-center justify-between text-xs text-gray-500 pb-1 border-b border-gray-100">
                          <span>Email: <strong className="text-foreground">{forgotEmail}</strong></span>
                          <button
                            type="button"
                            onClick={() => { setForgotStep(1); setForgotError(''); }}
                            className="text-brand-600 hover:underline text-[11px] font-semibold cursor-pointer"
                          >
                            Change Email
                          </button>
                        </div>

                        {/* OTP Input */}
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                            8-Digit OTP Code (From Email)
                          </label>
                          <input
                            type="text"
                            value={forgotOtp}
                            onChange={(e) => { setForgotOtp(e.target.value); setForgotError(''); }}
                            placeholder="e.g. 12345678"
                            maxLength={10}
                            suppressHydrationWarning
                            className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-center font-mono font-bold tracking-widest text-base text-foreground focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all outline-none"
                          />
                        </div>

                        {/* New Password */}
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                            New Password
                          </label>
                          <div className="relative">
                            <input
                              type={forgotShowPassword ? 'text' : 'password'}
                              value={forgotNewPassword}
                              onChange={(e) => { setForgotNewPassword(e.target.value); setForgotError(''); }}
                              placeholder="Minimum 6 characters"
                              minLength={6}
                              suppressHydrationWarning
                              className="w-full pl-3 pr-9 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm text-foreground focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all outline-none"
                            />
                            <button
                              type="button"
                              tabIndex={-1}
                              onClick={() => setForgotShowPassword(!forgotShowPassword)}
                              className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600 cursor-pointer p-0.5"
                            >
                              {forgotShowPassword ? '🙈' : '👁️'}
                            </button>
                          </div>
                        </div>

                        {/* Confirm Password */}
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                            Confirm New Password
                          </label>
                          <input
                            type={forgotShowPassword ? 'text' : 'password'}
                            value={forgotConfirmPassword}
                            onChange={(e) => { setForgotConfirmPassword(e.target.value); setForgotError(''); }}
                            placeholder="Re-enter new password"
                            minLength={6}
                            suppressHydrationWarning
                            className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm text-foreground focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all outline-none"
                          />
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-1 space-y-2">
                          <button
                            type="button"
                            onClick={handleResetPasswordSubmit}
                            disabled={forgotResetLoading || !forgotOtp || !forgotNewPassword}
                            suppressHydrationWarning
                            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 text-white font-bold text-xs shadow-md transition-all active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                          >
                            {forgotResetLoading ? (
                              <>
                                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Updating Password...
                              </>
                            ) : (
                              '🔐 Update Password & Sign In'
                            )}
                          </button>

                          <div className="flex items-center justify-between pt-1">
                            <button
                              type="button"
                              onClick={handleForgotPassword}
                              disabled={forgotLoading}
                              className="text-[11px] text-gray-500 hover:text-brand-600 font-semibold cursor-pointer"
                            >
                              {forgotLoading ? 'Resending...' : 'Resend OTP Code'}
                            </button>
                            <Link
                              href={`/reset-password?email=${encodeURIComponent(forgotEmail)}&otp=${encodeURIComponent(forgotOtp)}`}
                              className="text-[11px] text-brand-600 hover:underline font-semibold"
                            >
                              Open Full Page →
                            </Link>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Registration note */}
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-700"
              >
                💡 After creating your account, you&apos;ll complete your business profile with GST verification and category selection.
              </motion.div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              suppressHydrationWarning
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 text-white font-semibold shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-sm cursor-pointer"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing...
                </span>
              ) : isLogin ? (
                'Sign In to Dashboard'
              ) : (
                'Create Account →'
              )}
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              suppressHydrationWarning
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-white border border-gray-300 text-gray-700 font-semibold shadow-sm hover:bg-gray-50 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-sm cursor-pointer"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google
            </button>
          </form>
          )}

          {/* Footer */}
          <p className="mt-8 text-center text-xs text-gray-400">
            By continuing, you agree to B2B India&apos;s Terms of Trade and Privacy Policy.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
