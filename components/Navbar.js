// ============================================================================
// NAVBAR COMPONENT
// ============================================================================
// Premium glassmorphism navigation bar with auth-aware state.
// Shows user avatar + logout when signed in, login link when signed out.
// Includes mobile responsive hamburger menu and scroll-triggered styling.
// ============================================================================

"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowUserMenu(false);
    if (showUserMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showUserMenu]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  // Auth-aware nav links
  const navLinks = user
    ? [
        { href: '/directory', label: 'Trade Directory' },
        { href: '/dashboard/orders', label: 'Orders' },
        { href: '/dashboard/support', label: 'Support' },
        { href: '/dashboard/settings', label: 'Settings' },
      ]
    : [
        { href: '/directory', label: 'Trade Directory' },
        { href: '/login', label: 'Partner Login' },
      ];

  const pathname = usePathname();
  const isLightPage = pathname?.startsWith('/directory') || pathname?.startsWith('/login');
  const isDarkPage = pathname?.startsWith('/dashboard');
  const shouldBeSolid = isScrolled || isLightPage;
  const isDark = isDarkPage && !isScrolled;

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user) return '';
    const email = user.email || '';
    const name = user.user_metadata?.full_name || user.user_metadata?.company_name || email;
    return name.charAt(0).toUpperCase();
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isDark
          ? 'bg-slate-950/80 backdrop-blur-md border-b border-slate-800/60'
          : shouldBeSolid
          ? 'glass shadow-lg shadow-black/5 bg-white/80 backdrop-blur-md border-b border-gray-200'
          : 'bg-transparent'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-accent-500 flex items-center justify-center shadow-lg shadow-brand-500/25 group-hover:shadow-brand-500/40 transition-shadow">
              <span className="text-white font-bold text-lg">B</span>
              {/* Live status dot */}
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-success-500 rounded-full border-2 border-white pulse-dot" />
            </div>
            <div className="flex flex-col">
              <span className={`text-lg font-bold tracking-tight transition-colors ${
                isDark ? 'text-white' : shouldBeSolid ? 'text-brand-950' : 'text-white'
              }`}>
                B2B Bharat
              </span>
              <span className={`text-[10px] font-medium tracking-widest uppercase transition-colors ${
                isDark ? 'text-slate-400' : shouldBeSolid ? 'text-gray-400' : 'text-white/60'
              }`}>
                Conglomerate Marketplace
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:bg-white/10 ${
                  pathname === link.href
                    ? isDark
                      ? 'text-white bg-slate-800/60'
                      : 'text-brand-700 bg-brand-50'
                    : isDark
                    ? 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    : shouldBeSolid
                    ? 'text-gray-700 hover:text-brand-700 hover:bg-brand-50'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}

            {/* Auth Section */}
            {!loading && (
              <>
                {user ? (
                  <div className="flex items-center gap-3 ml-3">
                    {/* Dashboard Button */}
                    <Link
                      href="/dashboard"
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 text-white text-sm font-semibold shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 hover:from-brand-500 hover:to-brand-600 transition-all duration-200 active:scale-95 whitespace-nowrap"
                    >
                      Dashboard →
                    </Link>

                    {/* User Avatar Dropdown */}
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowUserMenu(!showUserMenu);
                        }}
                        className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold transition-all ring-2 ring-offset-2 ${
                          isDark
                            ? 'bg-indigo-600 text-white hover:bg-indigo-500 ring-indigo-400/30 ring-offset-slate-950'
                            : 'bg-brand-600 text-white hover:bg-brand-500 ring-brand-300/30 ring-offset-white'
                        }`}
                      >
                        {user.user_metadata?.avatar_url ? (
                          <img
                            src={user.user_metadata.avatar_url}
                            alt="Avatar"
                            className="w-9 h-9 rounded-full object-cover"
                          />
                        ) : (
                          getUserInitials()
                        )}
                      </button>

                    {/* Dropdown Menu */}
                    <AnimatePresence>
                      {showUserMenu && (
                        <motion.div
                          initial={{ opacity: 0, y: -5, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -5, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                            <p className="text-sm font-bold text-gray-900 truncate">
                              {user.user_metadata?.full_name || user.user_metadata?.company_name || 'User'}
                            </p>
                            <p className="text-xs text-gray-500 truncate mt-0.5">
                              {user.email}
                            </p>
                          </div>
                          <div className="py-1">
                            <Link
                              href="/dashboard/settings"
                              className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                              onClick={() => setShowUserMenu(false)}
                            >
                              ⚙️ Account Settings
                            </Link>
                            <Link
                              href="/dashboard/orders"
                              className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                              onClick={() => setShowUserMenu(false)}
                            >
                              📦 My Orders
                            </Link>
                            <button
                              onClick={handleSignOut}
                              className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
                            >
                              🚪 Sign Out
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    </div>
                  </div>
                ) : (
                  <Link
                    href="/login"
                    className="ml-3 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 text-white text-sm font-semibold shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 hover:from-brand-500 hover:to-brand-600 transition-all duration-200 active:scale-95"
                  >
                    Get Started →
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`lg:hidden p-2 rounded-xl transition-colors ${
              isDark ? 'text-slate-300' : shouldBeSolid ? 'text-gray-700' : 'text-white'
            }`}
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="lg:hidden overflow-hidden"
            >
              <div className="glass rounded-2xl p-4 mb-4 space-y-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                      pathname === link.href
                        ? 'text-brand-700 bg-brand-50'
                        : 'text-gray-700 hover:bg-brand-50 hover:text-brand-700'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}

                {!loading && user ? (
                  <>
                    {/* User info in mobile menu */}
                    <div className="px-4 py-3 border-t border-gray-200 mt-2 pt-3">
                      <p className="text-sm font-bold text-gray-900 truncate">
                        {user.user_metadata?.full_name || user.email}
                      </p>
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {user.email}
                      </p>
                    </div>
                    <Link
                      href="/dashboard"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block px-4 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-brand-600 to-brand-700 text-center mt-2"
                    >
                      Dashboard →
                    </Link>
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        handleSignOut();
                      }}
                      className="w-full px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors text-left mt-1"
                    >
                      🚪 Sign Out
                    </button>
                  </>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-4 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-brand-600 to-brand-700 text-center mt-2"
                  >
                    Get Started →
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </motion.header>
  );
}
