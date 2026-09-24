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
import SearchAutocomplete from '@/components/SearchAutocomplete';
import B2BLogo from '@/components/B2BLogo';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const { user, profile, isAdmin, loading, signOut } = useAuth();
  const router = useRouter();

  // Fetch notifications when user is logged in
  useEffect(() => {
    if (!user) return;
    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/notifications?limit=10');
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (e) { /* silent */ }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [user]);

  const markAllRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      });
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (e) { /* silent */ }
  };

  const handleSearch = (e, customQuery) => {
    if (e?.preventDefault) e.preventDefault();
    const query = (typeof customQuery === 'string' ? customQuery : searchQuery).trim();
    const sector = selectedCategory || null;
    if (!query && !sector) return;
    
    // Asynchronously log search activity with full user profile and contact details
    try {
      fetch('/api/search/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          sectorSlug: sector,
          userId: profile?.id || null,
          email: profile?.registered_email || user?.email || null,
          phone: profile?.corporate_phone || profile?.phone_number || null,
        }),
      }).catch(() => {});
    } catch (err) {}

    let url = '/directory?';
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (sector) params.append('sector', sector);
    
    router.push(url + params.toString());
    setIsMobileMenuOpen(false);
  };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close user menu and notification panel when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowUserMenu(false);
      setShowNotifications(false);
    };
    if (showUserMenu || showNotifications) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showUserMenu, showNotifications]);

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
  let navLinks = [];
  if (user) {
    navLinks = [
      { href: '/directory', label: 'Trade Directory' },
      { href: '/orders', label: 'My Orders' },
      { href: '/support', label: 'Support Desk' },
      { href: '/dashboard?tab=settings', label: 'Settings' },
    ];
  } else {
    navLinks = [
      { href: '/directory', label: 'Trade Directory' },
      { href: '/market-rates', label: 'Mandi Rates' },
      { href: '/support', label: 'Support Desk' },
    ];
  }

  const pathname = usePathname();
  const isDarkPage = pathname?.startsWith('/dashboard');
  const isNavbarDark = isDarkPage;

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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isNavbarDark
          ? 'bg-slate-950/85 backdrop-blur-md border-b border-slate-800/60 shadow-md'
          : 'bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm'
      }`}
    >
      <nav className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20 gap-2">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group flex-shrink-0">
            <B2BLogo className="w-10 h-10" />
            <div className="flex flex-col">
              <span className={`text-lg font-extrabold tracking-tight transition-colors ${
                isNavbarDark ? 'text-white drop-shadow-md' : 'text-gray-900'
              }`}>
                B2B INDIA
              </span>
              <span className={`text-[10px] font-bold tracking-widest uppercase transition-colors ${
                isNavbarDark ? 'text-emerald-300 drop-shadow-sm' : 'text-emerald-700'
              }`}>
                Conglomerate Marketplace
              </span>
            </div>
          </Link>

          {/* Central Search Bar (Desktop) */}
          <div className="hidden lg:flex flex-1 max-w-2xl mx-4 xl:mx-8 relative z-30 min-w-[340px]">
            <form onSubmit={handleSearch} suppressHydrationWarning className={`flex w-full min-w-0 rounded-xl backdrop-blur-md shadow-sm border transition-all card-glow relative group ${
              isNavbarDark
                ? 'bg-white/15 border-white/25 focus-within:ring-2 focus-within:ring-white/40 focus-within:border-white/50 text-white'
                : 'bg-white border-gray-200 focus-within:ring-2 focus-within:ring-brand-500/50 hover:shadow-md text-gray-900'
            }`}>
              <div className="absolute inset-0 rounded-xl gradient-border pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <select
                id="desktop-category-select"
                aria-label="Filter products by sector category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                suppressHydrationWarning
                className={`w-36 lg:w-40 px-3 py-2 bg-transparent text-xs outline-none cursor-pointer font-bold relative z-10 rounded-l-xl ${
                  isNavbarDark
                    ? 'border-r border-white/20 text-white'
                    : 'border-r border-gray-200 text-gray-900'
                }`}
              >
                <option value="" className="bg-white text-gray-900">All Categories</option>
                <option value="building-construction" className="bg-white text-gray-900">Building & Construction</option>
                <option value="electronics-electrical" className="bg-white text-gray-900">Electronics & Electrical</option>
                <option value="industrial-machinery" className="bg-white text-gray-900">Industrial Machinery</option>
                <option value="apparel-garments" className="bg-white text-gray-900">Apparel & Garments</option>
                <option value="food-agriculture" className="bg-white text-gray-900">Food & Agriculture</option>
              </select>
              <SearchAutocomplete
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                onSearch={(q) => handleSearch(null, q)}
                placeholder="Search products or commodities (e.g. Turmeric)..."
                theme={isNavbarDark ? "dark" : "light"}
                containerClassName="min-w-[180px] flex-1"
                inputClassName={`flex-1 min-w-[160px] px-3.5 py-2 text-sm outline-none bg-transparent font-medium ${
                  isNavbarDark
                    ? 'text-white placeholder:text-white/70'
                    : 'text-gray-900 placeholder:text-gray-400'
                }`}
              />
              <button
                type="submit"
                suppressHydrationWarning
                className="px-5 py-2 animated-gradient text-white font-bold text-sm transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 relative z-10 rounded-r-xl flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <span>Search</span>
              </button>
            </form>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1.5 xl:gap-2 flex-shrink-0">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              let linkClass = '';
              if (isActive) {
                linkClass = isNavbarDark ? 'text-white bg-white/20 font-bold' : 'text-gray-950 bg-gray-100 font-extrabold shadow-xs';
              } else if (isNavbarDark) {
                linkClass = 'text-white/95 hover:text-white hover:bg-white/10 font-semibold';
              } else {
                linkClass = 'text-gray-800 hover:text-gray-950 hover:bg-gray-100 font-semibold';
              }

              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-xl text-sm transition-all duration-200 ${linkClass}`}
                >
                  {link.label}
                </Link>
              );
            })}

            {/* Admin Panel Quick Access (Desktop) */}
            {user && isAdmin && user.email?.toLowerCase() === 'rsevmail@gmail.com' && (
              <Link
                href="/admin/dashboard"
                className="ml-1 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:to-indigo-800 text-white shadow-md shadow-purple-600/25 flex items-center gap-1.5 border border-purple-400/40 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                title="Superadmin Control Center"
              >
                <span>🛡️</span>
                <span>Admin Panel</span>
              </Link>
            )}

            {/* Auth Section */}
            {!loading && (
              <>
                {user ? (
                  <div className="flex items-center gap-2 ml-2">
                    <div className="relative">
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowNotifications(!showNotifications); setShowUserMenu(false); }}
                        suppressHydrationWarning
                        className={`relative p-2 rounded-lg transition-all ${isNavbarDark ? 'text-white hover:text-white hover:bg-white/10' : 'text-gray-900 hover:text-black hover:bg-gray-100'}`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                        {unreadCount > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center border-2 border-white dark:border-slate-950 animate-pulse">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </span>
                        )}
                      </button>

                      {/* Notification Dropdown */}
                      <AnimatePresence>
                        {showNotifications && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-slate-900 border border-slate-700 rounded-xl shadow-2xl shadow-black/50 z-50"
                          >
                            <div className="flex items-center justify-between p-3 border-b border-slate-700">
                              <h3 className="text-sm font-bold text-white">Notifications</h3>
                              {unreadCount > 0 && (
                                <button onClick={markAllRead} suppressHydrationWarning className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold">
                                  Mark all read
                                </button>
                              )}
                            </div>
                            {notifications.length === 0 ? (
                              <div className="p-6 text-center text-slate-400 text-sm">No notifications yet</div>
                            ) : (
                              notifications.map(n => (
                                <Link
                                  key={n.id}
                                  href={n.link || '/dashboard'}
                                  onClick={() => setShowNotifications(false)}
                                  className={`block px-3 py-3 border-b border-slate-800 hover:bg-slate-800/60 transition-colors ${!n.is_read ? 'bg-indigo-500/5' : ''}`}
                                >
                                  <div className="flex items-start gap-2">
                                    {!n.is_read && <span className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />}
                                    <div className={!n.is_read ? '' : 'ml-4'}>
                                      <p className="text-xs font-semibold text-white">{n.title}</p>
                                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{n.body}</p>
                                      <p className="text-[10px] text-slate-500 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                                    </div>
                                  </div>
                                </Link>
                              ))
                            )}
                            <Link
                              href="/dashboard"
                              onClick={() => setShowNotifications(false)}
                              className="block p-2 text-center text-xs text-indigo-400 hover:text-indigo-300 font-semibold border-t border-slate-700"
                            >
                              View all in Dashboard →
                            </Link>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <Link href="/orders" className={`relative p-2 rounded-lg transition-all ${isNavbarDark ? 'text-white hover:text-white hover:bg-white/10' : 'text-gray-900 hover:text-black hover:bg-gray-100'}`} title="My Orders & Receipts">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                    </Link>
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowUserMenu(!showUserMenu);
                        }}
                        suppressHydrationWarning
                        className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold transition-all ring-2 ring-offset-1 ${
                          isNavbarDark
                            ? 'bg-indigo-600 text-white ring-indigo-400/30 ring-offset-slate-950'
                            : 'bg-brand-600 text-white ring-brand-300/30 ring-offset-white'
                        }`}
                      >
                        {user.user_metadata?.avatar_url ? (
                          <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          getUserInitials()
                        )}
                      </button>

                    <AnimatePresence>
                      {showUserMenu && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          className="absolute right-0 mt-3 w-64 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/40 overflow-hidden z-50 animate-slide-up"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-br from-gray-50/80 to-white/50">
                            <p className="text-sm font-extrabold text-gray-900 truncate">
                              {user.user_metadata?.full_name || user.user_metadata?.company_name || 'User'}
                            </p>
                            <p className="text-xs text-brand-600 font-medium truncate mt-0.5">{user.email}</p>
                          </div>
                          <div className="py-2 px-2">
                            {isAdmin && user?.email?.toLowerCase() === 'rsevmail@gmail.com' && (
                              <Link
                                href="/admin/dashboard"
                                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-all mb-1 cursor-pointer"
                                onClick={() => setShowUserMenu(false)}
                              >
                                <span>🛡️</span>
                                <span>Admin Panel</span>
                                <span className="ml-auto text-[10px] bg-purple-200 text-purple-800 font-black px-1.5 py-0.5 rounded-md">PRO</span>
                              </Link>
                            )}
                            <Link href="/dashboard" className="block px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-brand-50 hover:text-brand-700 transition-all" onClick={() => setShowUserMenu(false)}>📊 Trade Dashboard</Link>
                            <Link href="/dashboard/rfqs" className="block px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-brand-50 hover:text-brand-700 transition-all" onClick={() => setShowUserMenu(false)}>⚡ Live RFQs (Buy / Quote)</Link>
                            <Link href="/dashboard?tab=products" className="block px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-brand-50 hover:text-brand-700 transition-all" onClick={() => setShowUserMenu(false)}>📦 My Products (Sell)</Link>
                            <Link href="/orders" className="block px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-brand-50 hover:text-brand-700 transition-all" onClick={() => setShowUserMenu(false)}>📋 Order History</Link>
                            <div className="h-px bg-gray-100 my-1 mx-3" />
                            <button onClick={handleSignOut} suppressHydrationWarning className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 hover:text-red-700 transition-all">🚪 Sign Out</button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5 ml-2">
                    <Link
                      href="/login"
                      className={`px-4 py-2 rounded-xl text-sm font-extrabold transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-xs ${
                        isNavbarDark
                          ? 'text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600'
                          : 'text-slate-900 hover:text-black bg-slate-100 hover:bg-slate-200 border border-slate-300 hover:border-slate-400'
                      }`}
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/login?mode=signup"
                      className="px-4 py-2 rounded-xl text-sm font-extrabold text-white bg-gradient-to-r from-emerald-600 via-brand-600 to-emerald-700 hover:from-emerald-500 hover:to-brand-500 shadow-md shadow-emerald-900/40 transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 flex-shrink-0 btn-shine"
                    >
                      <span>Sign Up Free</span>
                      <span className="text-xs">→</span>
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            suppressHydrationWarning
            className={`lg:hidden p-2 rounded-xl transition-colors ${
              isNavbarDark ? 'text-white hover:bg-white/10' : 'text-gray-900 hover:text-black hover:bg-gray-100'
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
              <div className={`rounded-2xl p-4 mb-4 space-y-2 shadow-2xl border transition-all ${
                isNavbarDark
                  ? 'bg-slate-900/98 backdrop-blur-2xl border-slate-800 text-white'
                  : 'bg-white/98 backdrop-blur-2xl border-gray-200 text-gray-900 shadow-xl'
              }`}>
                {/* Mobile Search */}
                <form onSubmit={handleSearch} suppressHydrationWarning className={`flex mb-4 rounded-xl border transition-all relative z-20 ${
                  isNavbarDark ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-200'
                }`}>
                  <SearchAutocomplete
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    selectedCategory={selectedCategory}
                    setSelectedCategory={setSelectedCategory}
                    onSearch={(q) => handleSearch(null, q)}
                    placeholder="Search products (e.g. Turmeric)..."
                    theme={isNavbarDark ? "dark" : "light"}
                    isMobile={true}
                  />
                  <button type="submit" suppressHydrationWarning className={`px-4 font-bold transition-colors flex items-center justify-center rounded-r-xl flex-shrink-0 ${
                    isNavbarDark ? 'text-emerald-400 bg-slate-700/80 hover:bg-slate-700' : 'text-brand-600 bg-brand-50 hover:bg-brand-100'
                  }`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </button>
                </form>

                {navLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                      pathname === link.href
                        ? isNavbarDark ? 'text-white bg-slate-800 font-bold border border-slate-700' : 'text-gray-950 bg-gray-100 font-extrabold border border-gray-200'
                        : isNavbarDark ? 'text-white/90 hover:bg-slate-800/80 hover:text-white' : 'text-gray-900 hover:bg-gray-100 hover:text-black font-bold'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}

                {!loading && user ? (
                  <>
                    {/* User info in mobile menu */}
                    <div className={`px-4 py-3 border-t mt-2 pt-3 ${isNavbarDark ? 'border-slate-800' : 'border-gray-200'}`}>
                      <p className={`text-sm font-bold truncate ${isNavbarDark ? 'text-white' : 'text-gray-900'}`}>
                        {user.user_metadata?.full_name || user.email}
                      </p>
                      <p className={`text-xs truncate mt-0.5 ${isNavbarDark ? 'text-slate-400' : 'text-gray-500'}`}>
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
                    {isAdmin && user?.email?.toLowerCase() === 'rsevmail@gmail.com' && (
                      <Link
                        href="/admin/dashboard"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="block px-4 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 text-center mt-2 shadow-md cursor-pointer"
                      >
                        🛡️ Admin Panel →
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        handleSignOut();
                      }}
                      className={`w-full px-4 py-3 rounded-xl text-sm font-medium transition-colors text-left mt-1 ${
                        isNavbarDark ? 'text-red-400 hover:bg-red-500/10' : 'text-red-600 hover:bg-red-50'
                      }`}
                    >
                      🚪 Sign Out
                    </button>
                  </>
                ) : (
                  <div className={`space-y-2 pt-3 border-t mt-2 ${isNavbarDark ? 'border-slate-800' : 'border-gray-200'}`}>
                    <Link
                      href="/login?mode=signup"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block w-full px-4 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-emerald-600 via-brand-600 to-emerald-700 hover:from-emerald-500 hover:to-brand-500 text-center shadow-md shadow-emerald-900/30 transition-all active:scale-95 btn-shine"
                    >
                      ✨ Sign Up as Buyer / Supplier →
                    </Link>
                    <Link
                      href="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`block w-full px-4 py-2.5 rounded-xl text-sm font-bold text-center transition-colors shadow-xs ${
                        isNavbarDark
                          ? 'text-white bg-slate-800 hover:bg-slate-700 border border-slate-700'
                          : 'text-gray-900 bg-gray-100 hover:bg-gray-200 border border-gray-300'
                      }`}
                    >
                      Sign In
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </motion.header>
  );
}
