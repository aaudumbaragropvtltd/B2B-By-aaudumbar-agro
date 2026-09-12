// ============================================================================
// useAuth HOOK
// ============================================================================
// Custom React hook for Supabase authentication state management.
// Provides current user, loading state, and auth actions.
// ============================================================================

"use client";

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/services/supabase';

/**
 * Hook that tracks Supabase auth state and exposes user info.
 *
 * @returns {{
 *   user: object | null,
 *   profile: object | null,
 *   loading: boolean,
 *   signIn: (email: string, password: string) => Promise<void>,
 *   signUp: (email: string, password: string, metadata?: object) => Promise<object>,
 *   signInWithGoogle: () => Promise<void>,
 *   signOut: () => Promise<void>,
 * }}
 */
export function useAuth() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // Fetch user profile via our backend API
  const fetchProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null);
      return;
    }
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/dashboard/profile', {
        headers: session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
      } else {
        console.warn('Failed to fetch profile API:', res.status);
      }
    } catch (e) {
      console.warn('Network error fetching profile:', e);
    }
  }, []);

  // Listen to auth state changes
  useEffect(() => {
    // Intercept password recovery redirects (e.g. from Supabase verification)
    if (typeof window !== 'undefined') {
      const hash = window.location.hash || '';
      if (hash.includes('type=recovery') && !window.location.pathname.startsWith('/reset-password')) {
        window.location.href = `/reset-password${hash}`;
        return;
      }
    }

    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        await fetchProfile(currentUser.id);
      }
      setLoading(false);
    };

    getInitialSession();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/reset-password')) {
            window.location.href = `/reset-password?recovery=true${window.location.hash}`;
            return;
          }
        }

        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          await fetchProfile(currentUser.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase, fetchProfile]);

  // Sign in with email/password
  const signIn = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  }, [supabase]);

  // Sign up with email/password via backend email dispatch engine
  const signUp = useCallback(async (email, password, metadata = {}) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, metadata }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to register');
    return data;
  }, []);

  // Sign in with Google OAuth
  const signInWithGoogle = useCallback(async () => {
    window.location.href = '/api/auth/google';
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } catch {}
    if (typeof document !== 'undefined') {
      document.cookie = 'b2b_admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
    }
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('b2b_buyer_email');
        localStorage.removeItem('user_email');
        localStorage.removeItem('b2b_buyer_phone');
        localStorage.removeItem('b2b_user_phone');
      } catch (e) {}
    }
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setProfile(null);
  }, [supabase]);

  // STRICT SUPERADMIN POLICY: Only rsevmail@gmail.com is authorized as admin
  const ADMIN_EMAIL = 'rsevmail@gmail.com';
  const isAdmin = Boolean(
    user?.email &&
    user.email.toLowerCase() === ADMIN_EMAIL &&
    (profile?.role === 'admin' || (profile?.registered_email ? profile.registered_email.toLowerCase() === ADMIN_EMAIL : true))
  );

  return {
    user,
    profile,
    isAdmin,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    refreshProfile: () => user?.id && fetchProfile(user.id),
  };
}
