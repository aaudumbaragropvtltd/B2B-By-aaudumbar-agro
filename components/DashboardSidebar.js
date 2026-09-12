// ============================================================================
// DASHBOARD SIDEBAR — Alibaba-Style
// ============================================================================
// Sidebar component for the dashboard overview showing profile card,
// quick stats, verification prompts, favorites, and browsing history.
// ============================================================================

"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { 
  getFavorites, 
  removeFavorite, 
  getBrowsingHistory, 
  removeFromBrowsingHistory, 
  clearBrowsingHistory, 
  formatRelativeTime 
} from '@/utils/favoritesAndHistory';

export default function DashboardSidebar({ user, profile, orders = [] }) {
  const displayName = profile?.full_name || profile?.company_name || user?.user_metadata?.full_name || 'User';
  const avatarInitial = displayName.charAt(0).toUpperCase();

  const [favorites, setFavorites] = useState([]);
  const [history, setHistory] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
    setFavorites(getFavorites());
    setHistory(getBrowsingHistory());

    const onFavUpdated = (e) => {
      setFavorites(e?.detail || getFavorites());
    };

    const onHistoryUpdated = (e) => {
      setHistory(e?.detail || getBrowsingHistory());
    };

    window.addEventListener('b2b_favorites_updated', onFavUpdated);
    window.addEventListener('b2b_history_updated', onHistoryUpdated);

    return () => {
      window.removeEventListener('b2b_favorites_updated', onFavUpdated);
      window.removeEventListener('b2b_history_updated', onHistoryUpdated);
    };
  }, []);
  
  // Compute profile completion
  const profileFields = [
    profile?.company_name, profile?.phone_number, profile?.gst_number,
    profile?.job_title, profile?.website, profile?.about_us,
    profile?.total_employees, profile?.year_established,
    profile?.warehouse_address, profile?.city, profile?.state,
  ];
  const filledCount = profileFields.filter(f => f && String(f).trim() !== '').length;
  const completionPercent = Math.round((filledCount / profileFields.length) * 100);

  // Unread message count (placeholder — would need API)
  const unreadMessages = 0;
  const newQuotes = 0;

  return (
    <div className="space-y-4">
      {/* ── Profile Card ── */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
      >
        <Link href="/dashboard/profile" className="block p-5 hover:bg-gray-50/50 transition-colors">
          <div className="flex items-center gap-3">
            {profile?.company_logo_url ? (
              <img src={profile.company_logo_url} alt={displayName} className="w-12 h-12 rounded-full border-2 border-brand-100 shadow-sm object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-lg font-bold shadow-sm">
                {avatarInitial}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="font-bold text-gray-900 text-sm truncate">{displayName}</div>
              <div className="text-[10px] text-gray-400 font-medium">{profile?.display_id || 'Member'}</div>
            </div>
            <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </div>
        </Link>
      </motion.div>

      {/* ── Quick Stats Grid ── */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4"
      >
        <div className="grid grid-cols-3 gap-2 text-center">
          <Link href="/dashboard/support" className="group">
            <div className="text-lg font-extrabold text-gray-900 group-hover:text-brand-600 transition-colors">{unreadMessages}</div>
            <div className="text-[10px] text-gray-400 font-medium leading-tight">Unread<br/>messages</div>
          </Link>
          <Link href="/dashboard/rfqs" className="group">
            <div className="text-lg font-extrabold text-gray-900 group-hover:text-brand-600 transition-colors">{newQuotes}</div>
            <div className="text-[10px] text-gray-400 font-medium leading-tight">New<br/>quotes</div>
          </Link>
          <div className="group cursor-default">
            <div className="text-lg font-extrabold text-gray-900">0</div>
            <div className="text-[10px] text-gray-400 font-medium leading-tight">Coupons</div>
          </div>
        </div>
      </motion.div>

      {/* ── Verification Prompts ── */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-2"
      >
        {profile?.status !== 'active' && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 rounded-xl p-3.5 flex items-start gap-3">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600 text-sm flex-shrink-0">🔒</div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-amber-800">Verify business information</div>
              <div className="text-[10px] text-amber-600/70 mt-0.5">Unlock full platform features</div>
            </div>
            <svg className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </div>
        )}

        {!profile?.gst_number && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-3.5 flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 text-sm flex-shrink-0">📋</div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-blue-800">Get verified for tax-exempt</div>
              <div className="text-[10px] text-blue-600/70 mt-0.5">Add GST to unlock benefits</div>
            </div>
            <svg className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </div>
        )}

        {completionPercent < 100 && (
          <Link href="/dashboard/profile" className="block bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl p-3.5 hover:shadow-sm transition-shadow">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 text-sm flex-shrink-0">✏️</div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-emerald-800">Complete profile</div>
                <div className="text-[10px] text-emerald-600/70 mt-0.5">Get more tailored quotations</div>
                <div className="mt-2 w-full h-1.5 bg-emerald-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${completionPercent}%` }} />
                </div>
              </div>
            </div>
          </Link>
        )}
      </motion.div>

      {/* ── Favorites ── */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
      >
        <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">❤️</span>
            <h4 className="text-xs font-bold text-gray-900">Favorites</h4>
          </div>
          {isLoaded && favorites.length > 0 && (
            <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-50 text-rose-600 rounded-full border border-rose-100">
              {favorites.length}
            </span>
          )}
        </div>

        {!isLoaded || favorites.length === 0 ? (
          <div className="p-5 flex flex-col items-center text-center">
            <div className="w-10 h-10 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-2 text-base">❤️</div>
            <p className="text-xs text-gray-500 font-medium mb-0.5">No favorites yet</p>
            <p className="text-[10px] text-gray-400 mb-2.5">Save products you want to review later</p>
            <Link href="/directory" className="text-[11px] font-bold text-brand-600 hover:text-brand-800 transition-colors">
              Explore Products →
            </Link>
          </div>
        ) : (
          <div className="p-2 space-y-1.5 max-h-72 overflow-y-auto divide-y divide-gray-50">
            <AnimatePresence>
              {favorites.slice(0, 6).map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-gray-50/80 transition-all group relative"
                >
                  <Link 
                    href={item.url || `/directory/product/${item.slug || item.id}`}
                    className="flex-shrink-0 w-11 h-11 rounded-lg bg-gray-100 overflow-hidden border border-gray-100 relative"
                  >
                    {item.image ? (
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs bg-slate-100 text-slate-400">📦</div>
                    )}
                  </Link>

                  <div className="flex-1 min-w-0 pr-6">
                    <Link 
                      href={item.url || `/directory/product/${item.slug || item.id}`}
                      className="text-xs font-semibold text-gray-800 hover:text-brand-600 transition-colors truncate block leading-snug"
                      title={item.title}
                    >
                      {item.title}
                    </Link>
                    <div className="text-[11px] font-bold text-gray-900 mt-0.5">
                      ₹{Number(item.price || 0).toLocaleString('en-IN')}
                      <span className="text-[10px] text-gray-400 font-normal ml-0.5">/{item.unit || 'unit'}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeFavorite(item.id)}
                    title="Remove from favorites"
                    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-gray-300 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition-all cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>

            {favorites.length > 6 && (
              <div className="pt-2 pb-1 text-center">
                <Link href="/directory" className="text-[10px] font-bold text-brand-600 hover:underline">
                  + {favorites.length - 6} more saved items
                </Link>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* ── Browsing History ── */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
      >
        <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">🕐</span>
            <h4 className="text-xs font-bold text-gray-900">Browsing History</h4>
          </div>
          {isLoaded && history.length > 0 && (
            <button
              type="button"
              onClick={clearBrowsingHistory}
              title="Clear browsing history"
              className="text-[10px] font-medium text-gray-400 hover:text-rose-500 transition-colors cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {!isLoaded || history.length === 0 ? (
          <div className="p-5 flex flex-col items-center text-center">
            <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-2 text-base">🕐</div>
            <p className="text-xs text-gray-500 font-medium mb-0.5">No history yet</p>
            <p className="text-[10px] text-gray-400 mb-2.5">Products you view will appear here</p>
            <Link href="/directory" className="text-[11px] font-bold text-brand-600 hover:text-brand-800 transition-colors">
              Browse Directory →
            </Link>
          </div>
        ) : (
          <div className="p-2 space-y-1.5 max-h-72 overflow-y-auto divide-y divide-gray-50">
            <AnimatePresence>
              {history.slice(0, 6).map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-gray-50/80 transition-all group relative"
                >
                  <Link 
                    href={item.url || `/directory/product/${item.slug || item.id}`}
                    className="flex-shrink-0 w-11 h-11 rounded-lg bg-gray-100 overflow-hidden border border-gray-100 relative"
                  >
                    {item.image ? (
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs bg-slate-100 text-slate-400">📦</div>
                    )}
                  </Link>

                  <div className="flex-1 min-w-0 pr-6">
                    <Link 
                      href={item.url || `/directory/product/${item.slug || item.id}`}
                      className="text-xs font-semibold text-gray-800 hover:text-brand-600 transition-colors truncate block leading-snug"
                      title={item.title}
                    >
                      {item.title}
                    </Link>
                    <div className="flex items-center justify-between text-[10px] text-gray-400 mt-0.5">
                      <span className="font-bold text-gray-900">
                        ₹{Number(item.price || 0).toLocaleString('en-IN')}
                      </span>
                      <span>{formatRelativeTime(item.viewedAt)}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeFromBrowsingHistory(item.id)}
                    title="Remove from history"
                    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-gray-300 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-all cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>

            {history.length > 6 && (
              <div className="pt-2 pb-1 text-center">
                <Link href="/directory" className="text-[10px] font-bold text-brand-600 hover:underline">
                  + {history.length - 6} more recently viewed
                </Link>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
