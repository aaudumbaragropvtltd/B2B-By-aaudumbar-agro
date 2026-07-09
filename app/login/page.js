// ============================================================================
// LOGIN PAGE
// ============================================================================
// Supabase Email/Password + Google OAuth authentication with role selection.
// Supports both login and registration flows with animated transitions.
// All user data stored in Supabase.
// ============================================================================

"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/services/supabase';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    companyName: '',
    role: 'buyer',
    gstNumber: '',
    phone: '',
  });

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        // ── Sign In with Email/Password ──
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (signInError) throw signInError;
        router.push('/dashboard');
        router.refresh();
      } else {
        // ── Sign Up with Email/Password ──
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              company_name: formData.companyName,
              role: formData.role,
              gst_number: formData.gstNumber,
              phone: formData.phone,
            },
          },
        });

        if (signUpError) throw signUpError;

        // Insert profile into profiles table
        if (data.user) {
          const { error: profileError } = await supabase.from('profiles').upsert({
            id: data.user.id,
            company_name: formData.companyName,
            role: formData.role,
            gst_number: formData.gstNumber,
            phone: formData.phone,
            email: formData.email,
          });

          if (profileError) {
            console.warn('Profile creation warning:', profileError.message);
          }
        }

        router.push('/dashboard');
        router.refresh();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });

      if (oauthError) throw oauthError;
      // The browser will redirect to Google — no need to push route
    } catch (err) {
      setError(err.message);
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
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
              <span className="text-white font-bold text-xl">B</span>
            </div>
            <span className="text-2xl font-bold text-white">B2B Bharat</span>
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-accent-500 flex items-center justify-center">
              <span className="text-white font-bold text-lg">B</span>
            </div>
            <span className="text-xl font-bold text-foreground">B2B Bharat</span>
          </Link>

          {/* Header */}
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-2">
            {isLogin ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="text-gray-500 mb-8">
            {isLogin
              ? 'Sign in to access your trade dashboard'
              : 'Register as a buyer or supplier to start trading'}
          </p>

          {/* Toggle */}
          <div className="flex rounded-xl bg-white border border-border-subtle p-1 mb-8">
            {['Login', 'Register'].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setIsLogin(tab === 'Login');
                  setError('');
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
                className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 overflow-hidden"
                >
                  {/* Company Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Company Name
                    </label>
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      required={!isLogin}
                      placeholder="e.g. Acme Industries Pvt Ltd"
                      className="w-full px-4 py-3 rounded-xl bg-white border border-border-subtle text-foreground placeholder:text-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all text-sm"
                    />
                  </div>

                  {/* Role Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      I am a
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { value: 'buyer', label: '🛒 Buyer', desc: 'I want to purchase' },
                        { value: 'supplier', label: '🏭 Supplier', desc: 'I want to sell' },
                      ].map((role) => (
                        <label
                          key={role.value}
                          className={`flex flex-col items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            formData.role === role.value
                              ? 'border-brand-500 bg-brand-50'
                              : 'border-border-subtle hover:border-brand-200'
                          }`}
                        >
                          <input
                            type="radio"
                            name="role"
                            value={role.value}
                            checked={formData.role === role.value}
                            onChange={handleChange}
                            className="sr-only"
                          />
                          <span className="text-lg mb-1">{role.label}</span>
                          <span className="text-xs text-gray-400">{role.desc}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* GST & Phone */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        GST Number
                      </label>
                      <input
                        type="text"
                        name="gstNumber"
                        value={formData.gstNumber}
                        onChange={handleChange}
                        required={!isLogin}
                        placeholder="22AAAAA0000A1Z5"
                        className="w-full px-4 py-3 rounded-xl bg-white border border-border-subtle text-foreground placeholder:text-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Phone
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required={!isLogin}
                        placeholder="+91-98765-43210"
                        className="w-full px-4 py-3 rounded-xl bg-white border border-border-subtle text-foreground placeholder:text-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all text-sm"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

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
                placeholder="Min 6 characters"
                className="w-full px-4 py-3 rounded-xl bg-white border border-border-subtle text-foreground placeholder:text-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all text-sm"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 text-white font-semibold shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-sm"
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
                'Create Trade Account'
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
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-white border border-gray-300 text-gray-700 font-semibold shadow-sm hover:bg-gray-50 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-sm"
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

          {/* Footer */}
          <p className="mt-8 text-center text-xs text-gray-400">
            By continuing, you agree to B2B Bharat&apos;s Terms of Trade and Privacy Policy.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
