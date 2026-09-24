"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function BannerManager() {
  // Tabs: 'homepage' | 'categories'
  const [activeTab, setActiveTab] = useState('homepage');

  // Homepage Banners State
  const [banners, setBanners] = useState([]);
  const [loadingBanners, setLoadingBanners] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [togglingBannerId, setTogglingBannerId] = useState(null);

  // Sector / Category Banners State
  const [sectorBanners, setSectorBanners] = useState([]);
  const [loadingSectors, setLoadingSectors] = useState(true);
  const [sectorSearch, setSectorSearch] = useState('');
  const [editingSector, setEditingSector] = useState(null);
  const [sectorModalOpen, setSectorModalOpen] = useState(false);
  const [uploadingSectorImage, setUploadingSectorImage] = useState(false);
  const [togglingSectorSlug, setTogglingSectorSlug] = useState(null);

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // Form Data for Homepage Banner
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    badge_text: 'Featured Wholesale Trade',
    hero_image_url: '',
    cta_text: 'Explore Wholesale Deals',
    cta_link: '/directory',
    sector_slug: 'all',
    display_order: 1,
    is_active: true,
  });

  // Form Data for Category / Sector Banner
  const [sectorFormData, setSectorFormData] = useState({
    slug: '',
    name: '',
    hero_image_url: '',
    subtitle: '',
    badge_text: 'Verified Wholesale Sourcing',
    is_active: true,
  });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch Homepage Banners
  const fetchBanners = async () => {
    setLoadingBanners(true);
    try {
      const res = await fetch(`/api/admin/cms/banners?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.banners) setBanners(data.banners);
      }
    } catch (err) {
      showToast('Error loading homepage banners', 'error');
    } finally {
      setLoadingBanners(false);
    }
  };

  // Fetch Sector / Category Banners
  const fetchSectorBanners = async () => {
    setLoadingSectors(true);
    try {
      const res = await fetch(`/api/admin/cms/sector-banners?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.sectorBanners) setSectorBanners(data.sectorBanners);
      }
    } catch (err) {
      showToast('Error loading category banners', 'error');
    } finally {
      setLoadingSectors(false);
    }
  };

  useEffect(() => {
    fetchBanners();
    fetchSectorBanners();
  }, []);

  // Handle local image upload for Homepage banner
  const handleImageFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (JPG, PNG, WebP, GIF, SVG)', 'error');
      return;
    }

    setUploadingImage(true);
    try {
      const data = new FormData();
      data.append('file', file);
      data.append('bucket', 'banners');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: data,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to upload local image');
      }

      setFormData(prev => ({
        ...prev,
        hero_image_url: json.secure_url || json.url,
      }));

      showToast('✓ Image uploaded to Cloudinary CDN successfully!');
    } catch (err) {
      console.error('Local image upload error:', err);
      showToast(err.message || 'Image upload failed', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  // Handle local image upload for Category / Sector banner
  const handleSectorImageFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (JPG, PNG, WebP, GIF, SVG)', 'error');
      return;
    }

    setUploadingSectorImage(true);
    try {
      const data = new FormData();
      data.append('file', file);
      data.append('bucket', 'banners');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: data,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to upload local image');
      }

      setSectorFormData(prev => ({
        ...prev,
        hero_image_url: json.secure_url || json.url,
      }));

      showToast('✓ Category hero image uploaded to Cloudinary CDN!');
    } catch (err) {
      console.error('Category image upload error:', err);
      showToast(err.message || 'Image upload failed', 'error');
    } finally {
      setUploadingSectorImage(false);
    }
  };

  // Open Homepage Banner Create Modal
  const handleOpenCreate = () => {
    setEditingBanner(null);
    setFormData({
      title: '',
      subtitle: '',
      badge_text: 'Featured Wholesale Trade',
      hero_image_url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=2000&q=80',
      cta_text: 'Explore Wholesale Deals',
      cta_link: '/directory',
      sector_slug: 'all',
      display_order: banners.length + 1,
      is_active: true,
    });
    setModalOpen(true);
  };

  // Open Homepage Banner Edit Modal
  const handleOpenEdit = (banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      badge_text: banner.badge_text || '',
      hero_image_url: banner.hero_image_url || '',
      cta_text: banner.cta_text || 'Explore Wholesale Deals',
      cta_link: banner.cta_link || '/directory',
      sector_slug: banner.sector_slug || 'all',
      display_order: banner.display_order || 1,
      is_active: banner.is_active !== undefined ? banner.is_active : true,
    });
    setModalOpen(true);
  };

  // Open Category / Sector Banner Edit Modal
  const handleOpenSectorEdit = (sector) => {
    setEditingSector(sector);
    setSectorFormData({
      slug: sector.slug,
      name: sector.name || sector.slug,
      hero_image_url: sector.hero_image_url || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1600',
      subtitle: sector.subtitle || 'Source verified bulk supplies directly from Indian manufacturers with escrow protection, factory pricing, and pan-India logistics.',
      badge_text: sector.badge_text || 'Verified Wholesale Sourcing',
      is_active: sector.is_active !== undefined ? Boolean(sector.is_active) : true,
    });
    setSectorModalOpen(true);
  };

  // Save Homepage Banner
  const handleSaveHomepageBanner = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = editingBanner ? 'PUT' : 'POST';
      const payload = editingBanner ? { ...formData, id: editingBanner.id } : formData;

      const res = await fetch('/api/admin/cms/banners', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(editingBanner ? 'Banner updated successfully!' : 'New homepage slide added!');
        setModalOpen(false);
        fetchBanners();
      } else {
        showToast(data.error || 'Failed to save banner', 'error');
      }
    } catch (err) {
      showToast('Network error while saving banner', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Save Category / Sector Banner
  const handleSaveSectorBanner = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/cms/sector-banners', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sectorFormData),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`✓ "${sectorFormData.name}" category banner updated live!`);
        setSectorModalOpen(false);
        fetchSectorBanners();
      } else {
        showToast(data.error || 'Failed to update category banner', 'error');
      }
    } catch (err) {
      showToast('Network error saving category banner', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Toggle Homepage Banner Status (Optimistic UI with Instant Feedback)
  const handleToggleActive = async (banner) => {
    const nextState = !Boolean(banner.is_active);

    // 1. Instant optimistic update
    setBanners(prev => prev.map(b => b.id === banner.id ? { ...b, is_active: nextState } : b));
    setTogglingBannerId(banner.id);

    try {
      const res = await fetch('/api/admin/cms/banners', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...banner, is_active: nextState }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Slide ${nextState ? 'published live on website' : 'paused successfully'}`);
        if (data.banner) {
          setBanners(prev => prev.map(b => b.id === banner.id ? data.banner : b));
        }
      } else {
        // Revert on error
        setBanners(prev => prev.map(b => b.id === banner.id ? { ...b, is_active: banner.is_active } : b));
        showToast(data.error || 'Failed to update banner status', 'error');
      }
    } catch (err) {
      // Revert on network failure
      setBanners(prev => prev.map(b => b.id === banner.id ? { ...b, is_active: banner.is_active } : b));
      showToast('Error toggling banner status', 'error');
    } finally {
      setTogglingBannerId(null);
    }
  };

  // Toggle Category / Sector Banner Status (Optimistic UI)
  const handleToggleSectorActive = async (sector) => {
    const currentActive = sector.is_active !== false;
    const nextState = !currentActive;

    // 1. Instant optimistic update
    setSectorBanners(prev => prev.map(s => s.slug === sector.slug ? { ...s, is_active: nextState } : s));
    setTogglingSectorSlug(sector.slug);

    try {
      const res = await fetch('/api/admin/cms/sector-banners', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...sector, is_active: nextState }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`"${sector.name}" banner ${nextState ? 'published live' : 'paused successfully'}`);
      } else {
        // Revert on error
        setSectorBanners(prev => prev.map(s => s.slug === sector.slug ? { ...s, is_active: currentActive } : s));
        showToast(data.error || 'Failed to update category banner status', 'error');
      }
    } catch (err) {
      // Revert on network failure
      setSectorBanners(prev => prev.map(s => s.slug === sector.slug ? { ...s, is_active: currentActive } : s));
      showToast('Error toggling category banner status', 'error');
    } finally {
      setTogglingSectorSlug(null);
    }
  };

  // Delete Homepage Banner
  const handleDeleteBanner = async (id) => {
    if (!confirm('Are you sure you want to delete this promotional banner?')) return;
    try {
      const res = await fetch(`/api/admin/cms/banners?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Banner deleted');
        fetchBanners();
      }
    } catch (err) {
      showToast('Error deleting banner', 'error');
    }
  };

  // Filtered Sectors
  const filteredSectors = sectorBanners.filter(s => {
    const q = sectorSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.slug && s.slug.toLowerCase().includes(q)) ||
      (s.subtitle && s.subtitle.toLowerCase().includes(q))
    );
  });

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎨</span>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              CMS Banner & Category Image Manager
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Customize homepage slider banners and individual category/sector hero banners with instant local file uploads.
          </p>
        </div>

        {activeTab === 'homepage' && (
          <button
            onClick={handleOpenCreate}
            className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-brand-600/30 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto"
          >
            <span>＋ Add New Homepage Slide</span>
          </button>
        )}
      </div>

      {/* ── Tabs Navigation ── */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('homepage')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'homepage'
              ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <span>🌟 Homepage Hero Slider</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
            activeTab === 'homepage' ? 'bg-brand-800 text-white' : 'bg-slate-800 text-slate-300'
          }`}>
            {banners.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'categories'
              ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <span>🏷️ Category / Sector Hero Banners</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
            activeTab === 'categories' ? 'bg-brand-800 text-white' : 'bg-slate-800 text-slate-300'
          }`}>
            {sectorBanners.length || 38}
          </span>
        </button>
      </div>

      {/* ── Toast Alert ── */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-2xl text-xs font-black shadow-xl flex items-center justify-between ${
            toast.type === 'error'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
          }`}
        >
          <span>{toast.msg}</span>
          <button onClick={() => setToast(null)} className="text-slate-400 hover:text-white">✕</button>
        </motion.div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 1: HOMEPAGE HERO PROMOTIONAL BANNERS ── */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'homepage' && (
        <>
          {loadingBanners ? (
            <div className="p-16 text-center text-slate-400 space-y-3">
              <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <div className="text-xs font-bold">Loading Homepage Banners...</div>
            </div>
          ) : banners.length === 0 ? (
            <div className="p-12 text-center bg-slate-900 rounded-3xl border border-slate-800 text-slate-400 space-y-3">
              <div className="text-3xl">🖼️</div>
              <div className="font-bold text-white text-base">No Homepage Banners Found</div>
              <p className="text-xs">Click the button above to add your first dynamic promotional slide.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {banners.map((banner, index) => (
                <motion.div
                  key={banner.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl flex flex-col justify-between hover:border-slate-700 transition-all group"
                >
                  {/* Image Preview */}
                  <div className="relative h-44 w-full bg-slate-950 overflow-hidden">
                    <img
                      src={banner.hero_image_url}
                      alt={banner.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-black border border-white/10 shadow-md">
                        Slide #{banner.display_order || index + 1}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border shadow-md ${
                          banner.is_active
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        }`}
                      >
                        {banner.is_active ? '● Live on Website' : '○ Inactive'}
                      </span>
                    </div>

                    {banner.badge_text && (
                      <div className="absolute bottom-3 left-3">
                        <span className="px-2.5 py-0.5 rounded-md bg-brand-500/90 text-white text-[10px] font-black uppercase tracking-wider">
                          {banner.badge_text}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content Info */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <h3 className="text-sm font-black text-white leading-tight line-clamp-2">
                        {banner.title}
                      </h3>
                      {banner.subtitle && (
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {banner.subtitle}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-mono text-[10px]">
                        CTA: <strong className="text-slate-300">{banner.cta_text}</strong> ({banner.cta_link})
                      </span>
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="p-4 bg-slate-950/70 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleToggleActive(banner)}
                      disabled={togglingBannerId === banner.id}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        banner.is_active
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      } ${togglingBannerId === banner.id ? 'opacity-70 cursor-wait' : ''}`}
                    >
                      {togglingBannerId === banner.id ? (
                        <>
                          <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          <span>Updating...</span>
                        </>
                      ) : (
                        banner.is_active ? '⏸ Pause Slide' : '▶ Publish Live'
                      )}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEdit(banner)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDeleteBanner(banner.id)}
                        className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                        title="Delete Banner"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 2: CATEGORY / SECTOR HERO BANNERS (38 SECTORS) ── */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-900 border border-slate-800 rounded-2xl">
            <div className="relative w-full sm:max-w-md">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 text-xs">
                🔍
              </span>
              <input
                type="text"
                placeholder="Search category (e.g. Food & Agriculture, Textiles, Steel...)"
                value={sectorSearch}
                onChange={(e) => setSectorSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              {sectorSearch && (
                <button
                  onClick={() => setSectorSearch('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="text-xs text-slate-400 font-medium">
              Showing <strong className="text-white">{filteredSectors.length}</strong> categories
            </div>
          </div>

          {/* Categories Grid */}
          {loadingSectors ? (
            <div className="p-16 text-center text-slate-400 space-y-3">
              <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <div className="text-xs font-bold">Loading Category Banners...</div>
            </div>
          ) : filteredSectors.length === 0 ? (
            <div className="p-12 text-center bg-slate-900 rounded-3xl border border-slate-800 text-slate-400 space-y-3">
              <div className="text-3xl">🏷️</div>
              <div className="font-bold text-white text-base">No matching categories found</div>
              <p className="text-xs">Try searching for a different sector name.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSectors.map((sector) => (
                <div
                  key={sector.slug}
                  className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl flex flex-col justify-between hover:border-slate-700 transition-all group"
                >
                  {/* Image Preview */}
                  <div className="relative h-44 w-full bg-slate-950 overflow-hidden">
                    <img
                      src={sector.hero_image_url}
                      alt={sector.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-brand-600 text-white text-[10px] font-black shadow-md uppercase tracking-wider">
                        {sector.badge_text || 'Verified Sector'}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border shadow-md ${
                          sector.is_active !== false
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        }`}
                      >
                        {sector.is_active !== false ? '● Live' : '○ Paused'}
                      </span>
                    </div>

                    <div className="absolute bottom-3 right-3">
                      <Link
                        href={`/directory/${sector.slug}`}
                        target="_blank"
                        className="px-2.5 py-1 rounded-lg bg-white/15 backdrop-blur-md text-white hover:bg-white/30 text-[10px] font-bold border border-white/20 transition-all flex items-center gap-1"
                        title="View Live Category Page"
                      >
                        <span>👁️ Live View</span>
                        <span>↗</span>
                      </Link>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                        Slug: /{sector.slug}
                      </div>
                      <h3 className="text-base font-black text-white leading-tight mt-1">
                        {sector.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                        {sector.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-4 bg-slate-950/80 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleToggleSectorActive(sector)}
                      disabled={togglingSectorSlug === sector.slug}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        sector.is_active !== false
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      } ${togglingSectorSlug === sector.slug ? 'opacity-70 cursor-wait' : ''}`}
                    >
                      {togglingSectorSlug === sector.slug ? (
                        <>
                          <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          <span>Updating...</span>
                        </>
                      ) : (
                        sector.is_active !== false ? '⏸ Pause Banner' : '▶ Publish Live'
                      )}
                    </button>

                    <button
                      onClick={() => handleOpenSectorEdit(sector)}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-brand-600/20 flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>🖼️ Edit</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* ── MODAL: CREATE / EDIT HOMEPAGE BANNER ── */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur z-10">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🎨</span>
                  <h2 className="text-base font-black text-white">
                    {editingBanner ? 'Edit Homepage Banner Slide' : 'Create New Promotional Banner'}
                  </h2>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveHomepageBanner} className="p-6 space-y-5 flex-1">
                {/* Headline Title */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-300">
                    Headline Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. India’s Verified B2B Wholesale Marketplace"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-medium text-white placeholder-slate-500 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>

                {/* Subtitle */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-300">
                    Subtitle / Marketing Description
                  </label>
                  <textarea
                    rows={2}
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    placeholder="Brief description of the wholesale benefits or features..."
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-medium text-white placeholder-slate-500 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>

                {/* Local File Upload + Image URL */}
                <div className="space-y-2">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-300">
                    Banner Background Image <span className="text-rose-500">*</span>
                  </label>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <label className="flex-1 px-4 py-3 bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all">
                      <span>📁 Choose Image from Local Computer</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {uploadingImage && (
                    <div className="text-xs text-brand-400 font-bold flex items-center gap-2">
                      <div className="w-3.5 h-3.5 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
                      Uploading image from computer...
                    </div>
                  )}

                  <input
                    type="url"
                    required
                    value={formData.hero_image_url}
                    onChange={(e) => setFormData({ ...formData, hero_image_url: e.target.value })}
                    placeholder="Or enter image URL (https://... or /uploads/banners/...)"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-medium text-white placeholder-slate-500 focus:ring-2 focus:ring-brand-500 focus:outline-none font-mono"
                  />

                  {/* Live Preview */}
                  {formData.hero_image_url && (
                    <div className="relative h-40 rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 mt-2">
                      <img
                        src={formData.hero_image_url}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent flex items-end p-4">
                        <div className="text-white">
                          <span className="px-2 py-0.5 rounded bg-brand-500 text-[10px] font-black uppercase">
                            {formData.badge_text || 'Featured'}
                          </span>
                          <h4 className="text-xs font-black mt-1 line-clamp-1">{formData.title || 'Slide Title Preview'}</h4>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Badge Text & Display Order */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-300">
                      Badge Text
                    </label>
                    <input
                      type="text"
                      value={formData.badge_text}
                      onChange={(e) => setFormData({ ...formData, badge_text: e.target.value })}
                      placeholder="e.g. 10% Advance Escrow Protected"
                      className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-medium text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-300">
                      Display Order
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={formData.display_order}
                      onChange={(e) => setFormData({ ...formData, display_order: Number(e.target.value) })}
                      className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-medium text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* CTA Button Text & Link */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-300">
                      CTA Button Text
                    </label>
                    <input
                      type="text"
                      value={formData.cta_text}
                      onChange={(e) => setFormData({ ...formData, cta_text: e.target.value })}
                      placeholder="e.g. Explore Wholesale Deals"
                      className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-medium text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-300">
                      CTA Destination Link
                    </label>
                    <input
                      type="text"
                      value={formData.cta_link}
                      onChange={(e) => setFormData({ ...formData, cta_link: e.target.value })}
                      placeholder="e.g. /directory or /market-rates"
                      className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-medium text-white focus:ring-2 focus:ring-brand-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Published Checkbox */}
                <label className="flex items-center gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 rounded text-brand-600 focus:ring-0 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-300">
                    Publish Live immediately on Homepage Slider
                  </span>
                </label>

                {/* Modal Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-black rounded-xl shadow-lg shadow-brand-600/30 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : editingBanner ? 'Update Slide' : 'Create Slide'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* ── MODAL: EDIT CATEGORY / SECTOR HERO BANNER ── */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {sectorModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur z-10">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🏷️</span>
                  <div>
                    <h2 className="text-base font-black text-white">
                      Edit Category Banner: {sectorFormData.name}
                    </h2>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Target route: /directory/{sectorFormData.slug}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSectorModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveSectorBanner} className="p-6 space-y-5 flex-1">
                {/* Category Display Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-300">
                    Category Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={sectorFormData.name}
                    onChange={(e) => setSectorFormData({ ...sectorFormData, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-medium text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>

                {/* Subtitle / Marketing Description */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-300">
                    Marketing Description / Subtitle
                  </label>
                  <textarea
                    rows={3}
                    value={sectorFormData.subtitle}
                    onChange={(e) => setSectorFormData({ ...sectorFormData, subtitle: e.target.value })}
                    placeholder="Describe the commodities, machinery, or procurement advantages in this sector..."
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-medium text-white placeholder-slate-500 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>

                {/* Local File Upload + Hero Image URL */}
                <div className="space-y-2">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-300">
                    Category Hero Banner Image <span className="text-rose-500">*</span>
                  </label>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <label className="flex-1 px-4 py-3 bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all">
                      <span>📁 Choose Image from Local Computer</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleSectorImageFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {uploadingSectorImage && (
                    <div className="text-xs text-brand-400 font-bold flex items-center gap-2">
                      <div className="w-3.5 h-3.5 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
                      Uploading image from computer to local storage...
                    </div>
                  )}

                  <input
                    type="url"
                    required
                    value={sectorFormData.hero_image_url}
                    onChange={(e) => setSectorFormData({ ...sectorFormData, hero_image_url: e.target.value })}
                    placeholder="Or enter image URL (https://... or /uploads/banners/...)"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-medium text-white placeholder-slate-500 focus:ring-2 focus:ring-brand-500 focus:outline-none font-mono"
                  />

                  {/* Live Preview Card */}
                  {sectorFormData.hero_image_url && (
                    <div className="relative h-48 rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 mt-3">
                      <img
                        src={sectorFormData.hero_image_url}
                        alt="Sector Banner Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col justify-end p-5">
                        <span className="self-start px-2.5 py-0.5 rounded-md bg-brand-600 text-white text-[10px] font-black uppercase tracking-wider mb-1.5">
                          {sectorFormData.badge_text || 'Verified Sourcing'}
                        </span>
                        <h3 className="text-lg font-black text-white leading-tight">
                          {sectorFormData.name}
                        </h3>
                        <p className="text-xs text-white/80 line-clamp-2 mt-1">
                          {sectorFormData.subtitle}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Badge Text */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-300">
                    Badge Text
                  </label>
                  <input
                    type="text"
                    value={sectorFormData.badge_text}
                    onChange={(e) => setSectorFormData({ ...sectorFormData, badge_text: e.target.value })}
                    placeholder="e.g. APMC & FSSAI Certified or BIS Certified"
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-medium text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>

                {/* Published Status Checkbox */}
                <label className="flex items-center gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sectorFormData.is_active !== false}
                    onChange={(e) => setSectorFormData({ ...sectorFormData, is_active: e.target.checked })}
                    className="w-4 h-4 rounded text-brand-600 focus:ring-0 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-300">
                    Publish Category Banner live on Directory Page
                  </span>
                </label>

                {/* Modal Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSectorModalOpen(false)}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black rounded-xl shadow-lg shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {saving ? 'Saving Live...' : '✓ Save Category Banner Live'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
