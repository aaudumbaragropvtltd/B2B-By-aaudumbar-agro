// ============================================================================
// DASHBOARD PAGE
// ============================================================================
// Role-based dashboard with different views for Buyer, Supplier, and Admin.
// Includes high-fidelity Settings panel for Password, Verification, Favorites, and History.
// ============================================================================

"use client";

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Script from 'next/script';
import { createClient } from '@/services/supabase';
import AddProductForm from '@/components/AddProductForm';
import SmartRFQForm from '@/components/SmartRFQForm';
import PriceTrackerWidget from '@/components/PriceTrackerWidget';
import EditProfileModal from '@/components/EditProfileModal';
import DashboardSidebar from '@/components/DashboardSidebar';
// ── Demo dashboard data ──
const DEMO_STATS = {
  buyer: [
    { label: 'Active Orders', value: '0', icon: '📦', change: 'New Account' },
    { label: 'Pending Quotes', value: '0', icon: '📋', change: 'New Account' },
    { label: 'Total Spent', value: '₹0', icon: '💰', change: 'New Account' },
    { label: 'Suppliers Used', value: '0', icon: '🏭', change: 'New Account' },
  ],
  supplier: [
    { label: 'Active Listings', value: '0', icon: '📦', change: 'New Account' },
    { label: 'Incoming Orders', value: '0', icon: '📥', change: 'New Account' },
    { label: 'Revenue', value: '₹0', icon: '💰', change: 'New Account' },
    { label: 'Verification', value: 'Pending', icon: '⏳', change: 'Under Review' },
  ],
};

const DEMO_ORDERS = [];

const STATUS_MAP = {
  quotation_issued: { label: 'Quotation Issued', color: 'bg-blue-50 text-blue-700 border border-blue-200', dot: 'bg-blue-500' },
  price_locked_10: { label: '10% Advance Paid', color: 'bg-amber-50 text-amber-700 border border-amber-200', dot: 'bg-amber-500' },
  warehouse_loading: { label: 'Warehouse Loading', color: 'bg-purple-50 text-purple-700 border border-purple-200', dot: 'bg-purple-500' },
  settled: { label: 'Settled ✅', color: 'bg-emerald-50 text-emerald-700 border border-emerald-200', dot: 'bg-emerald-500' },
  cancelled: { label: 'Cancelled', color: 'bg-red-50 text-red-700 border border-red-200', dot: 'bg-red-500' },
  rerouted: { label: 'Rerouted', color: 'bg-orange-50 text-orange-700 border border-orange-200', dot: 'bg-orange-500' },
};

const DEMO_FAVORITES = [];

const DEMO_HISTORY = [];

// Helper to format large currency amounts into compact Indian denomination (Crores / Lakhs)
const getCompactIndianCurrency = (val) => {
  if (!val || typeof val !== 'string' || !val.includes('₹')) return null;
  const num = Number(val.replace(/[^0-9.]/g, ''));
  if (!num || isNaN(num) || num < 100000) return null;
  if (num >= 10000000) {
    const cr = (num / 10000000).toFixed(2).replace(/\.00$/, '');
    return `₹${cr} Cr`;
  }
  if (num >= 100000) {
    const l = (num / 100000).toFixed(2).replace(/\.00$/, '');
    return `₹${l} Lakh`;
  }
  return null;
};

import { useAuth } from '@/hooks/useAuth';
import { useRouter, useSearchParams } from 'next/navigation';

// Suspense wrapper to handle useSearchParams()
export default function DashboardPage() {
  return (
    <Suspense fallback={
      <main className="flex-1 pt-24 pb-16 bg-surface-elevated min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </main>
    }>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const { user, profile, isAdmin, loading: authLoading, refreshProfile } = useAuth();
  const [currentProfile, setCurrentProfile] = useState(profile);
  useEffect(() => {
    if (profile) setCurrentProfile(profile);
  }, [profile]);
  const activeProfile = currentProfile || profile || {};

  // STRICT SUPERADMIN POLICY: Only rsevmail@gmail.com is authorized as admin
  const ADMIN_EMAIL = 'rsevmail@gmail.com';
  const isAdminUser = Boolean(
    isAdmin &&
    user?.email &&
    user.email.toLowerCase() === ADMIN_EMAIL
  );

  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'overview';
  
  const [role, setRole] = useState(activeProfile?.role === 'both' ? 'supplier' : (activeProfile?.role || 'buyer'));
  
  useEffect(() => {
    if (activeProfile?.role && !role) {
      setRole(activeProfile.role === 'both' ? 'supplier' : activeProfile.role);
    }
  }, [activeProfile?.role]);

  const [activeTab, setActiveTab] = useState(initialTab);
  const [editProfileSection, setEditProfileSection] = useState(null);
  
  // Also listen for URL tab changes so back navigation works smoothly if they change it
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showRFQForm, setShowRFQForm] = useState(false);
  const [editingRfq, setEditingRfq] = useState(null);
  const [plan, setPlan] = useState(profile?.membership_plan || 'FREE TIER');
  const [membershipInfo, setMembershipInfo] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('upi'); // 'upi' | 'cards'
  const [upgradingPlan, setUpgradingPlan] = useState(null);
  const [upgradeSuccessModal, setUpgradeSuccessModal] = useState(null);
  const [showUpgradeGateModal, setShowUpgradeGateModal] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(10);
  const [pricingInfo, setPricingInfo] = useState({
    originalPrice: 20000,
    baseAmount: 2000,
    discountPercent: 90,
    savingsAmount: 18000,
    gstRate: 18,
    gstAmount: 360,
    subtotalWithGst: 2360,
    gatewayFeePercent: 2.5,
    gatewayFee: 59,
    gstOnGatewayFee: 10.62,
    totalGatewaySurcharge: 69.62,
    totalPayable: 2429.62,
  });

  const fetchMembershipStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/membership');
      if (res.ok) {
        const json = await res.json();
        if (json.membership) {
          setMembershipInfo(json.membership);
          if (json.membership.plan) {
            setPlan(json.membership.plan);
          }
        }
        if (json.pricing) {
          setPricingInfo(json.pricing);
        }
      }
    } catch (e) {
      console.warn('Membership fetch notice:', e);
    }
  }, []);

  useEffect(() => {
    fetchMembershipStatus();
  }, [fetchMembershipStatus, user]);

  useEffect(() => {
    if (profile?.membership_plan) {
      setPlan(profile.membership_plan);
    }
  }, [profile?.membership_plan]);
  const [stats, setStats] = useState(DEMO_STATS.buyer);
  const [orders, setOrders] = useState([]);
  const [supplierProducts, setSupplierProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [orderFilter, setOrderFilter] = useState('all');

  const [pwdForm, setPwdForm] = useState({ old: '', new: '' });
  const [pwdStatus, setPwdStatus] = useState({ loading: false, error: null, success: null });

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!pwdForm.old || pwdForm.old.length < 1) {
      setPwdStatus({ loading: false, error: 'Please enter your current password', success: null });
      return;
    }
    if (!pwdForm.new || pwdForm.new.length < 6) {
      setPwdStatus({ loading: false, error: 'New password must be at least 6 characters', success: null });
      return;
    }
    if (pwdForm.old === pwdForm.new) {
      setPwdStatus({ loading: false, error: 'New password must be different from current password', success: null });
      return;
    }
    setPwdStatus({ loading: true, error: null, success: null });
    
    try {
      const supabase = createClient();
      
      // Step 1: Verify the old password by re-authenticating
      const userEmail = user?.email;
      if (!userEmail) {
        throw new Error('Unable to verify account. Please log out and log back in.');
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: pwdForm.old,
      });

      if (signInError) {
        setPwdStatus({ loading: false, error: 'Current password is incorrect. Please try again.', success: null });
        return;
      }
      
      // Step 2: Update to new password using the now-verified session
      const { error: updateError } = await supabase.auth.updateUser({
        password: pwdForm.new
      });
      
      if (updateError) {
        throw updateError;
      }
      
      setPwdStatus({ loading: false, error: null, success: 'Password updated successfully!' });
      setPwdForm({ old: '', new: '' });
    } catch (err) {
      setPwdStatus({ loading: false, error: err.message || 'Failed to update password. Please try again.', success: null });
    }
  };

  const handleAddProductClick = () => {
    if (plan === 'FREE TIER') {
      setShowUpgradeGateModal(true);
      return;
    }
    setShowAddProduct(true);
  };

  const handleUpgradePlan = async (targetPlan, methodToUse = selectedPaymentMethod) => {
    if (!targetPlan || targetPlan === 'FREE TIER') return;
    setUpgradingPlan(targetPlan);
    try {
      // 1. Call /api/membership to create Razorpay Order with chosen payment method
      const res = await fetch('/api/membership', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          plan: targetPlan,
          paymentMethod: methodToUse || 'upi'
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to initiate upgrade order.');
      }

      // 2. Open Razorpay checkout modal
      if (typeof window !== 'undefined' && window.Razorpay) {
        const options = {
          key: data.razorpayKeyId,
          amount: data.amountPaise,
          currency: data.currency || 'INR',
          name: 'B2B India',
          description: `Supplier Membership — ${targetPlan}`,
          order_id: data.razorpayOrderId,
          prefill: data.prefill || {},
          theme: { color: '#ea580c' },
          handler: async function (response) {
            // 3. Verify payment signature
            try {
              const verifyRes = await fetch('/api/membership', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  action: 'verify',
                  plan: targetPlan,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              });

              const verifyData = await verifyRes.json();
              if (verifyRes.ok) {
                setPlan(targetPlan);
                setShowUpgradeGateModal(false);
                setUpgradeSuccessModal({
                  plan: targetPlan,
                  amount: data.amount,
                  paymentId: response.razorpay_payment_id,
                  expiresAt: verifyData.expiresAt,
                });
                await fetchMembershipStatus();
                // Refresh supplier's product list to reflect restored products
                try {
                  const prodRes = await fetch('/api/products?my=true');
                  if (prodRes.ok) {
                    const prodJson = await prodRes.json();
                    setSupplierProducts(prodJson.products || []);
                  }
                } catch (pErr) {}
                if (refreshProfile) refreshProfile();
              } else {
                alert('Payment verification failed: ' + (verifyData.error || 'Please contact support.'));
              }
            } catch (vErr) {
              console.error('Membership verification error:', vErr);
              alert('Payment verification error. Please contact support.');
            }
            setUpgradingPlan(null);
          },
          modal: {
            ondismiss: function () {
              setUpgradingPlan(null);
            },
          },
        };

        try {
          const rzp = new window.Razorpay(options);
          rzp.on('payment.failed', function (resp) {
            alert(`Payment failed: ${resp.error?.description || 'Could not complete transaction'}`);
            setUpgradingPlan(null);
          });
          rzp.open();
        } catch (rzpOpenErr) {
          console.warn('Razorpay modal open error:', rzpOpenErr);
          alert('Failed to open payment gateway. Please try again.');
          setUpgradingPlan(null);
        }
      } else {
        alert('Payment gateway could not be loaded. Please check your internet connection.');
        setUpgradingPlan(null);
      }
    } catch (err) {
      console.error('Upgrade plan error:', err);
      alert('Upgrade Notice: ' + (err.message || 'Payment initiation failed.'));
      setUpgradingPlan(null);
    }
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, ordersRes] = await Promise.all([
          fetch('/api/dashboard/stats'),
          fetch(`/api/dashboard/orders?view=${role}`)
        ]);
        
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          if (statsData.role && !role) setRole(statsData.role);
          if (statsData.stats) setStats(statsData.stats);
        }
        
        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          if (ordersData.orders) setOrders(ordersData.orders);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, [role]);

  const fetchSupplierProducts = async () => {
    try {
      setLoadingProducts(true);
      const res = await fetch('/api/products?my=true');
      if (res.ok) {
        const data = await res.json();
        setSupplierProducts(data.products || []);
      }
    } catch (err) {
      console.error('Failed to fetch supplier products:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchSupplierProducts();
    }
  }, [user]);

  // Show loading state while auth resolves or redirect happens
  if (authLoading || !user) {
    return (
      <main className="flex-1 pt-24 pb-16 bg-surface-elevated min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <>
      <EditProfileModal 
        isOpen={!!editProfileSection} 
        initialSection={editProfileSection || 'basic'}
        onClose={() => setEditProfileSection(null)} 
        profile={activeProfile} 
        onProfileUpdated={(updated) => {
          if (updated) setCurrentProfile(prev => ({ ...(prev || {}), ...updated }));
          if (refreshProfile) refreshProfile();
        }} 
      />
      <main className="flex-1 pt-24 pb-16 bg-surface-elevated min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header & Role Switcher */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 sm:mb-8">
            <div className="space-y-3 flex-1 min-w-0">
              
              {/* Title & Trade Partner Badge */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">Trade Dashboard</h1>
                {(profile || user) && (
                  <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[11px] sm:text-xs font-bold bg-indigo-50 text-indigo-800 border border-indigo-200 shadow-2xs flex items-center gap-1.5 max-w-full truncate">
                    <span className="flex-shrink-0">🤝</span>
                    <span className="truncate">Trade Partner (Buyer &amp; Supplier)</span>
                    {profile?.display_id ? <span className="text-indigo-600 font-mono font-extrabold flex-shrink-0">• {profile.display_id}</span> : ''}
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm text-gray-500 leading-relaxed max-w-2xl">
                Unified All-in-One workspace to buy raw materials and sell wholesale products across India.
              </p>

              {/* 100% Mobile Responsive Hub Switcher (Buying Hub vs Selling Hub) */}
              {(profile || user) && (
                <div className="pt-1 w-full sm:w-auto">
                  <div className="grid grid-cols-2 sm:inline-flex w-full sm:w-auto bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/90 shadow-inner gap-1">
                    <button
                      type="button"
                      onClick={() => setRole('buyer')}
                      className={`flex items-center justify-center gap-2 px-3 sm:px-5 py-2.5 sm:py-2 text-xs sm:text-sm font-black rounded-xl transition-all duration-200 cursor-pointer ${
                        role === 'buyer'
                          ? 'bg-white text-brand-700 shadow-md shadow-brand-500/10 border border-slate-200 scale-[1.01]'
                          : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
                      }`}
                    >
                      <span className="text-base sm:text-lg">🛒</span>
                      <span className="truncate">Buying Hub</span>
                      {role === 'buyer' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-600 animate-pulse hidden sm:inline-block ml-1" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setRole('supplier')}
                      className={`flex items-center justify-center gap-2 px-3 sm:px-5 py-2.5 sm:py-2 text-xs sm:text-sm font-black rounded-xl transition-all duration-200 cursor-pointer ${
                        role === 'supplier'
                          ? 'bg-white text-orange-700 shadow-md shadow-orange-500/10 border border-slate-200 scale-[1.01]'
                          : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
                      }`}
                    >
                      <span className="text-base sm:text-lg">🏭</span>
                      <span className="truncate">Selling Hub</span>
                      {role === 'supplier' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-600 animate-pulse hidden sm:inline-block ml-1" />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {isAdminUser && (
              <div className="flex items-center gap-2 flex-shrink-0">
                <Link
                  href="/admin/dashboard"
                  className="w-full sm:w-auto justify-center px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:to-indigo-800 text-white text-xs sm:text-sm font-bold shadow-md shadow-purple-600/25 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer border border-purple-400/30"
                >
                  <span>🛡️</span>
                  <span>Admin Panel</span>
                </Link>
              </div>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-2 border-b border-gray-200 mb-8 overflow-x-auto no-scrollbar">
            {['overview', 'orders', 'products', 'rfqs', 'profile', 'settings'].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  if (tab === 'orders') {
                    router.push('/orders');
                    return;
                  }
                  if (tab === 'profile') {
                    router.push('/dashboard/profile');
                    return;
                  }
                  if (tab === 'rfqs') {
                    router.push('/dashboard/rfqs');
                    return;
                  }
                  setActiveTab(tab);
                }}
                className={`pb-3 px-4 text-sm font-semibold capitalize transition-colors relative whitespace-nowrap ${
                  activeTab === tab ? 'text-brand-600' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {tab === 'orders' ? '📦 My Orders' : tab === 'rfqs' ? '⚡ RFQs' : tab === 'products' ? '📦 My Products' : tab}
                {activeTab === tab && (
                  <motion.div 
                    layoutId="activeTabIndicator" 
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600" 
                  />
                )}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* ── OVERVIEW TAB ── */}
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  {/* ═══ LEFT SIDEBAR (Alibaba-Style) ═══ */}
                  <div className="lg:col-span-1 order-2 lg:order-1">
                    <DashboardSidebar user={user} profile={profile} orders={orders} />
                  </div>

                  {/* ═══ MAIN CONTENT ═══ */}
                  <div className="lg:col-span-3 order-1 lg:order-2 space-y-8">
                    {/* Stats Grid - 100% Mobile Responsive */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                      {stats.map((stat, i) => {
                        const compactEquivalent = getCompactIndianCurrency(stat.value);
                        const valLength = String(stat.value || '').length;

                        return (
                          <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                            className="rounded-2xl bg-white border border-border-subtle p-3.5 sm:p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between min-w-0 overflow-hidden"
                          >
                            <div className="flex items-center justify-between gap-1 mb-2 sm:mb-3 min-w-0">
                              <span className="text-xl sm:text-2xl flex-shrink-0">{stat.icon}</span>
                              <span className="text-[9px] sm:text-[10px] text-gray-500 font-bold bg-gray-50 border border-gray-100 px-1.5 sm:px-2 py-0.5 rounded-full truncate max-w-[80px] sm:max-w-none flex-shrink-0">
                                {stat.change}
                              </span>
                            </div>

                            <div className="min-w-0">
                              <div 
                                className={`font-black text-foreground tracking-tight leading-tight truncate ${
                                  valLength > 11 
                                    ? 'text-[15px] sm:text-lg lg:text-2xl' 
                                    : valLength > 7 
                                    ? 'text-base sm:text-xl lg:text-2xl' 
                                    : 'text-xl sm:text-2xl'
                                }`}
                                title={stat.value}
                              >
                                {stat.value}
                              </div>

                              {compactEquivalent && (
                                <div className="text-[10px] sm:text-xs font-bold text-emerald-600 truncate mt-0.5" title={`Approx. ${compactEquivalent}`}>
                                  ≈ {compactEquivalent}
                                </div>
                              )}
                            </div>

                            <div className="text-[11px] sm:text-xs text-gray-500 mt-1 font-semibold truncate" title={stat.label}>
                              {stat.label}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>

                    {/* Quick Actions (Unified Buying & Selling) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Buy Action: Smart RFQ */}
                      <button 
                        onClick={() => setShowRFQForm(true)} 
                        className="text-left rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-6 shadow-md hover:-translate-y-1 transition-all group relative overflow-hidden text-white"
                      >
                        <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform">
                          <span className="text-8xl">⚡</span>
                        </div>
                        <span className="text-2xl mb-3 block text-white/90">⚡</span>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-white text-lg">Smart RFQ</h3>
                          <span className="text-[10px] uppercase font-bold bg-white/20 px-2 py-0.5 rounded-full">Buyer</span>
                        </div>
                        <p className="text-brand-100 text-sm mt-1">Broadcast bulk demand to 10,000+ verified sellers</p>
                      </button>

                      {/* Sell Action: Add Product */}
                      <button 
                        onClick={handleAddProductClick} 
                        className={`text-left rounded-2xl p-6 shadow-md transition-all group relative overflow-hidden ${plan === 'FREE TIER' ? 'bg-gradient-to-br from-amber-600 to-orange-700 text-white hover:-translate-y-1' : 'bg-gradient-to-br from-orange-600 to-amber-700 hover:-translate-y-1 text-white'}`}
                      >
                        <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform">
                          <span className="text-8xl">➕</span>
                        </div>
                        <span className="text-2xl mb-3 block text-white/90">➕</span>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-white text-lg">Add Product</h3>
                          <span className="text-[10px] uppercase font-bold bg-white/20 px-2 py-0.5 rounded-full">Supplier</span>
                        </div>
                        <p className="text-orange-100 text-sm mt-1">{plan === 'FREE TIER' ? 'List inventory to buyers across India' : 'Manage your product catalogue & stock'}</p>
                      </button>

                      {/* Browse Directory */}
                      <Link href="/directory" className="rounded-2xl bg-white border border-border-subtle p-6 hover:shadow-md hover:-translate-y-1 transition-all group">
                        <span className="text-2xl mb-3 block">🔍</span>
                        <h3 className="font-bold text-foreground group-hover:text-brand-700 transition-colors">Browse Directory</h3>
                        <p className="text-xs text-gray-400 mt-1">Find verified suppliers across 38 sectors</p>
                      </Link>

                      {/* Order History */}
                      <Link href="/orders" className="rounded-2xl bg-white border border-border-subtle p-6 hover:shadow-md hover:-translate-y-1 transition-all group">
                        <span className="text-2xl mb-3 block">📊</span>
                        <h3 className="font-bold text-foreground group-hover:text-brand-700 transition-colors">My Orders & Receipts</h3>
                        <p className="text-xs text-gray-400 mt-1">Track all escrow orders, dispatches & receipts</p>
                      </Link>

                      {/* Live RFQ Marketplace */}
                      <Link href="/dashboard/rfqs" className="rounded-2xl bg-white border border-border-subtle p-6 hover:shadow-md hover:-translate-y-1 transition-all group">
                        <span className="text-2xl mb-3 block">📋</span>
                        <h3 className="font-bold text-foreground group-hover:text-brand-700 transition-colors">Live RFQ Hub</h3>
                        <p className="text-xs text-gray-400 mt-1">View posted demands or quote on buyer leads</p>
                      </Link>

                      {/* Settings */}
                      <Link href="/dashboard" onClick={(e) => { e.preventDefault(); setActiveTab('settings'); }} className="rounded-2xl bg-white border border-border-subtle p-6 hover:shadow-md hover:-translate-y-1 transition-all group">
                        <span className="text-2xl mb-3 block">⚙️</span>
                        <h3 className="font-bold text-foreground group-hover:text-brand-700 transition-colors">Account Settings</h3>
                        <p className="text-xs text-gray-400 mt-1">Manage security, verification, and preferences</p>
                      </Link>
                    </div>

                    {/* Orders Preview */}
                    <div className="bg-white rounded-2xl border border-border-subtle shadow-sm overflow-hidden">
                      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                          <span className="text-lg">📋</span> Orders
                        </h3>
                        <button onClick={() => setActiveTab('orders')} className="text-xs font-semibold text-brand-600 hover:text-brand-800 transition-colors">View all</button>
                      </div>

                      {/* Order Status Tabs (Alibaba-style) */}
                      <div className="flex border-b border-gray-100 overflow-x-auto no-scrollbar">
                        {[
                          { key: 'all', label: 'All' },
                          { key: 'quotation_issued', label: 'Confirming' },
                          { key: 'price_locked_10', label: 'Unpaid' },
                          { key: 'warehouse_loading', label: 'Preparing' },
                          { key: 'settled', label: 'Completed' },
                        ].map(f => (
                          <button
                            key={f.key}
                            onClick={() => setOrderFilter(f.key)}
                            className={`px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors border-b-2 ${
                              orderFilter === f.key 
                                ? 'text-brand-600 border-brand-600' 
                                : 'text-gray-400 border-transparent hover:text-gray-600'
                            }`}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>

                      <div className="divide-y divide-gray-50">
                        {orders.filter(o => orderFilter === 'all' || o.status === orderFilter).length === 0 ? (
                          <div className="px-6 py-10 flex flex-col items-center text-center">
                            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-3 text-xl">📦</div>
                            <h4 className="text-sm font-bold text-gray-900 mb-1">No orders yet</h4>
                            <p className="text-xs text-gray-500">Your orders will appear here once placed.</p>
                          </div>
                        ) : (
                          orders.filter(o => orderFilter === 'all' || o.status === orderFilter).slice(0, 5).map((order) => {
                            const statusInfo = STATUS_MAP[order.status] || STATUS_MAP.quotation_issued;
                            return (
                              <div key={order.id} className="px-3 sm:px-6 py-3 flex items-center gap-2 sm:gap-3 hover:bg-gray-50 transition-colors">
                                <div className={`w-2.5 h-2.5 rounded-full ${statusInfo.dot} flex-shrink-0`} />
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs sm:text-sm font-bold text-gray-900 truncate">{order.productName}</div>
                                  <div className="text-[10px] sm:text-xs text-gray-400 truncate">{order.supplierName}</div>
                                </div>
                                <span className={`px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold ${statusInfo.color} uppercase tracking-wider flex-shrink-0`}>{statusInfo.label}</span>
                                <div className="text-xs sm:text-sm font-bold text-gray-900 flex-shrink-0 text-right">{order.value}</div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Price Tracker (For Buyers) */}
                    {role === 'buyer' && (
                      <div className="mt-4">
                        <PriceTrackerWidget />
                      </div>
                    )}

                    {/* Premium Subscription Plans Grid (For Suppliers) */}
                    {role === 'supplier' && (
                      <div className="mt-6 pt-6 border-t border-gray-100">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                          <div>
                            <h2 className="text-xl font-bold text-foreground">Supplier Membership Plans</h2>
                            <p className="text-xs text-gray-500">Pay securely with Razorpay to unlock unlimited product catalog listings & premium buyer discovery.</p>
                          </div>
                          {plan !== 'FREE TIER' && !membershipInfo?.isExpired && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-black rounded-full border border-emerald-300 w-fit">
                              ✓ {plan} Active
                            </span>
                          )}
                          {membershipInfo?.isExpired && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-100 text-rose-800 text-xs font-black rounded-full border border-rose-300 w-fit">
                              🔴 Expired ({membershipInfo?.previousPlan || 'Plan'})
                            </span>
                          )}
                        </div>

                        {/* ── Dynamic Renewal & Expiry Status Banner ── */}
                        {membershipInfo?.daysLeft > 0 && !membershipInfo?.isExpired && (
                          <div className={`mb-6 p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs ${
                            membershipInfo?.isExpiringSoon 
                              ? 'bg-amber-50 border-amber-300' 
                              : 'bg-emerald-50/80 border-emerald-300'
                          }`}>
                            <div className="flex items-start gap-3">
                              <span className="text-2xl mt-0.5">{membershipInfo?.isExpiringSoon ? '⚠️' : '⏳'}</span>
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className={`text-sm font-extrabold ${membershipInfo?.isExpiringSoon ? 'text-amber-900' : 'text-emerald-900'}`}>
                                    {membershipInfo?.daysLeft} Days Remaining to Renew
                                  </span>
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    membershipInfo?.isExpiringSoon 
                                      ? 'bg-amber-200 text-amber-900' 
                                      : 'bg-emerald-200 text-emerald-900'
                                  }`}>
                                    Valid until {membershipInfo?.expiresAtFormatted}
                                  </span>
                                </div>
                                <p className={`text-xs mt-1 ${membershipInfo?.isExpiringSoon ? 'text-amber-800' : 'text-emerald-700'}`}>
                                  {membershipInfo?.isExpiringSoon 
                                    ? `Renew before ${membershipInfo?.expiresAtFormatted} to prevent your products from being temporarily hidden from buyers.`
                                    : `All your product listings are live and visible to verified enterprise buyers across India.`}
                                </p>
                              </div>
                            </div>

                            <button
                              onClick={() => handleUpgradePlan(plan === 'ANNUAL PLAN' ? 'ANNUAL PLAN' : 'ANNUAL PLAN')}
                              disabled={upgradingPlan !== null}
                              className={`px-4 py-2 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 flex-shrink-0 cursor-pointer disabled:opacity-50 ${
                                membershipInfo?.isExpiringSoon
                                  ? 'bg-amber-600 hover:bg-amber-700 animate-pulse'
                                  : 'bg-emerald-700 hover:bg-emerald-800'
                              }`}
                            >
                              <span>🔄</span> Extend / Renew Plan
                            </button>
                          </div>
                        )}

                        {/* ── Expired Subscription Alert Banner ── */}
                        {membershipInfo?.isExpired && (
                          <div className="mb-6 p-4.5 bg-rose-50 border-2 border-rose-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                            <div className="flex items-start gap-3">
                              <span className="text-2xl mt-0.5">🔴</span>
                              <div>
                                <span className="text-sm font-black text-rose-900">
                                  Subscription Expired on {membershipInfo?.expiresAtFormatted || 'Recent Date'}
                                </span>
                                <p className="text-xs text-rose-700 mt-1 leading-relaxed">
                                  Your products are currently <strong>hidden from the website</strong>. Renew your membership now to immediately restore all your existing product catalog listings live!
                                </p>
                              </div>
                            </div>

                            <button
                              onClick={() => handleUpgradePlan(membershipInfo?.previousPlan || 'ANNUAL PLAN')}
                              disabled={upgradingPlan !== null}
                              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-lg shadow-rose-600/20 transition-all flex items-center justify-center gap-1.5 flex-shrink-0 cursor-pointer disabled:opacity-50 whitespace-nowrap"
                            >
                              <span>🔄</span> Renew Now & Restore Products
                            </button>
                          </div>
                        )}

                        {/* Payment Fee Policy Notice */}
                        <div className="mb-6 p-4 bg-slate-900 text-white rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-slate-800 shadow-md">
                          <div className="flex items-center gap-3">
                            <span className="text-xl">💳</span>
                            <div>
                              <div className="text-xs font-black uppercase tracking-wider text-amber-400">
                                Razorpay Payment & Tax Structure
                              </div>
                              <p className="text-[11px] text-slate-300 mt-0.5">
                                Base Plan + <strong>18% GST</strong> + Standard Razorpay Platform Fee of <strong>2.5% + 18% GST on fee</strong> across all payment options (UPI, Cards, NetBanking).
                              </p>
                            </div>
                          </div>
                          <span className="px-3 py-1 bg-slate-800 text-slate-300 text-[11px] font-mono font-bold rounded-lg border border-slate-700 w-fit">
                            Fee: 2.5% + 18% GST
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 max-w-4xl gap-6">
                          {/* FREE TIER */}
                          <div className={`p-6 rounded-2xl border transition-all ${plan === 'FREE TIER' && !membershipInfo?.isExpired ? 'border-brand-500 bg-brand-50/20 shadow-sm ring-1 ring-brand-500/30' : 'border-gray-200 bg-white opacity-80'}`}>
                            <div className="flex justify-between items-center">
                              <h3 className="text-lg font-bold">FREE TIER</h3>
                              {plan === 'FREE TIER' && !membershipInfo?.isExpired && <span className="text-[10px] bg-slate-900 text-white font-bold px-2 py-0.5 rounded-full">ACTIVE</span>}
                            </div>
                            <p className="text-2xl font-extrabold my-3">₹0</p>
                            <ul className="text-sm text-gray-600 space-y-2 mb-4">
                              <li className="text-rose-600 font-medium">❌ No Product Uploads (Upgrade required)</li>
                              <li>✅ Basic Visibility</li>
                              <li>✅ Escrow Supported</li>
                            </ul>
                            <button disabled className="w-full py-2.5 bg-gray-200 text-gray-500 font-semibold rounded-xl text-xs">
                              {plan === 'FREE TIER' && !membershipInfo?.isExpired ? 'Current Plan' : 'Free Basic'}
                            </button>
                          </div>

                          {/* ANNUAL PLAN */}
                          <div className={`p-6 rounded-2xl border relative transition-all ${plan === 'ANNUAL PLAN' && !membershipInfo?.isExpired ? 'border-amber-500 bg-amber-50/30 shadow-md ring-2 ring-amber-500/40' : 'border-amber-300 bg-gradient-to-br from-amber-50/60 to-white hover:border-amber-400'}`}>
                            <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-600 to-orange-600 text-white text-[10px] font-black px-2.5 py-1 rounded-bl-xl rounded-tr-xl tracking-wider">
                              {pricingInfo?.discountPercent ? `${pricingInfo.discountPercent}% OFF` : 'BEST VALUE'}
                            </div>
                            <div className="flex justify-between items-center">
                              <h3 className="text-lg font-bold text-slate-900">ANNUAL PLAN</h3>
                              {plan === 'ANNUAL PLAN' && !membershipInfo?.isExpired && <span className="text-[10px] bg-amber-600 text-white font-bold px-2 py-0.5 rounded-full mr-16">CURRENT ACTIVE</span>}
                            </div>

                            {/* Price Breakdown */}
                            <div className="my-3">
                              {/* Strikethrough Original Price & Selling Price Badge */}
                              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                <span className="text-sm font-bold text-slate-400 line-through decoration-rose-500 decoration-2 font-mono" title="Original List Price">
                                  ₹{(pricingInfo?.originalPrice || 20000).toLocaleString('en-IN')}
                                </span>
                                <span className="text-[11px] font-extrabold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-md border border-emerald-300">
                                  Selling Price: ₹{(pricingInfo?.baseAmount || 2000).toLocaleString('en-IN')}
                                </span>
                                {pricingInfo?.discountPercent > 0 && (
                                  <span className="text-[10px] font-black text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                                    Save {pricingInfo.discountPercent}%
                                  </span>
                                )}
                              </div>

                              {/* All-Inclusive Total */}
                              <div className="flex items-baseline gap-1.5">
                                <span className="text-2xl sm:text-3xl font-black text-brand-900 font-mono tracking-tight">
                                  ₹{(pricingInfo?.totalPayable || 2429.62).toFixed(2)}
                                </span>
                                <span className="text-xs text-slate-500 font-medium">all-inclusive / 12 mo</span>
                              </div>

                              {/* Dynamic Fee Breakdown */}
                              <div className="text-[11px] text-slate-600 mt-2 font-mono space-y-1 bg-amber-50/90 p-3 rounded-xl border border-amber-200 shadow-2xs">
                                <div className="flex justify-between">
                                  <span>Selling Base Price:</span>
                                  <span className="font-bold text-slate-900">₹{(pricingInfo?.baseAmount || 2000).toLocaleString('en-IN')}.00</span>
                                </div>
                                <div className="flex justify-between text-emerald-800 font-bold">
                                  <span>+ {pricingInfo?.gstRate || 18}% GST on Base:</span>
                                  <span>+₹{(pricingInfo?.gstAmount || 360).toFixed(2)} (₹{(pricingInfo?.subtotalWithGst || 2360).toFixed(2)})</span>
                                </div>
                                <div className="flex justify-between text-slate-600">
                                  <span>+ Razorpay Fee ({pricingInfo?.gatewayFeePercent || 2.5}% + {pricingInfo?.gstRate || 18}% GST):</span>
                                  <span>+₹{(pricingInfo?.totalGatewaySurcharge || 69.62).toFixed(2)}</span>
                                </div>
                                <div className="border-t border-amber-300/60 pt-1 mt-1 flex justify-between font-black text-slate-900">
                                  <span>Total All-Inclusive:</span>
                                  <span className="text-brand-900 font-mono">₹{(pricingInfo?.totalPayable || 2429.62).toFixed(2)}</span>
                                </div>
                              </div>
                            </div>

                            <ul className="text-xs text-gray-600 space-y-1.5 mb-4">
                              <li className="font-bold text-emerald-700">✅ Unlocked Product Uploads</li>
                              <li>✅ Premium Visibility (Top Ranked)</li>
                              <li>✅ Dedicated Account Manager</li>
                              <li>✅ Best Value (Save ₹{((pricingInfo?.originalPrice || 20000) - (pricingInfo?.baseAmount || 2000)).toLocaleString('en-IN')}/yr)</li>
                            </ul>

                            {plan === 'ANNUAL PLAN' && !membershipInfo?.isExpired ? (
                              <button 
                                onClick={() => handleUpgradePlan('ANNUAL PLAN')}
                                disabled={upgradingPlan === 'ANNUAL PLAN'}
                                className="w-full py-2.5 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                              >
                                {upgradingPlan === 'ANNUAL PLAN' ? 'Opening Razorpay...' : `⭐ Renew / Extend 1 Year (₹${(pricingInfo?.totalPayable || 2429.62).toFixed(2)})`}
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleUpgradePlan('ANNUAL PLAN')} 
                                disabled={upgradingPlan === 'ANNUAL PLAN'}
                                className="w-full py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-black rounded-xl transition-all text-xs shadow-md shadow-orange-600/20 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                              >
                                {upgradingPlan === 'ANNUAL PLAN' ? (
                                  <>
                                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <span>Opening Razorpay...</span>
                                  </>
                                ) : (
                                  <>
                                    <span>⭐ Pay ₹{(pricingInfo?.totalPayable || 2429.62).toFixed(2)} (Upgrade to Annual)</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── ORDERS TAB ── */}
            {activeTab === 'orders' && (
              <motion.div
                key="orders"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="rounded-2xl bg-white border border-border-subtle overflow-hidden shadow-sm">
                  <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                      <svg className="w-5 h-5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                      All Transactions
                    </h2>
                  </div>

                  {/* ── Order Status Filter Tabs (Alibaba-style) ── */}
                  <div className="flex border-b border-gray-100 overflow-x-auto no-scrollbar bg-gray-50/30">
                    {[
                      { key: 'all', label: 'All', icon: '📋' },
                      { key: 'quotation_issued', label: 'Confirming', icon: '🔄' },
                      { key: 'price_locked_10', label: 'Unpaid', icon: '💳' },
                      { key: 'warehouse_loading', label: 'Preparing to ship', icon: '📦' },
                      { key: 'settled', label: 'Completed & in review', icon: '✅' },
                      { key: 'cancelled', label: 'Cancelled', icon: '✕' },
                    ].map(f => (
                      <button
                        key={f.key}
                        onClick={() => setOrderFilter(f.key)}
                        className={`px-4 py-3 text-xs font-semibold whitespace-nowrap transition-all border-b-2 flex items-center gap-1.5 ${
                          orderFilter === f.key 
                            ? 'text-brand-600 border-brand-600 bg-white' 
                            : 'text-gray-400 border-transparent hover:text-gray-600 hover:bg-white/50'
                        }`}
                      >
                        <span>{f.icon}</span>
                        {f.label}
                      </button>
                    ))}
                  </div>

                  <div className="divide-y divide-border-subtle">
                    {isLoading ? (
                      <div className="px-6 py-12 flex items-center justify-center text-gray-500">Loading orders...</div>
                    ) : orders.filter(o => orderFilter === 'all' || o.status === orderFilter).length === 0 ? (
                      <div className="px-6 py-12 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-2xl">📦</div>
                        <h3 className="text-base font-bold text-gray-900 mb-1">No orders yet</h3>
                        <p className="text-sm text-gray-500 max-w-sm">When you place orders or receive quotes, they will appear here for tracking.</p>
                      </div>
                    ) : (
                      orders.filter(o => orderFilter === 'all' || o.status === orderFilter).map((order) => {
                        const statusInfo = STATUS_MAP[order.status] || STATUS_MAP.quotation_issued;
                        return (
                          <div key={order.id} className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/80 transition-colors">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <div className={`w-3 h-3 rounded-full ${statusInfo.dot} flex-shrink-0 mt-1`} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <span className="text-xs font-mono font-extrabold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg border border-slate-200">
                                    #{order.id.slice(0, 8).toUpperCase()}
                                  </span>
                                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${statusInfo.color} uppercase tracking-wider`}>
                                    {statusInfo.label}
                                  </span>
                                  {order.date && <span className="text-[11px] text-gray-400">• {order.date}</span>}
                                </div>
                                <h4 className="font-extrabold text-foreground text-base truncate">{order.productName}</h4>
                                <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2 flex-wrap">
                                  <span>Trade with <strong>{order.supplierName}</strong></span>
                                  {order.quantity && <span>• Qty: <strong>{order.quantity} {order.unit || ''}</strong></span>}
                                </div>
                              </div>
                            </div>

                            <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-2 flex-shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-gray-100">
                              <div className="text-right">
                                <div className="font-extrabold text-gray-900 text-base">{order.value}</div>
                                {order.advancePaidFormatted && (
                                  <div className="text-[11px] text-emerald-700 font-bold">
                                    10% Advance: {order.advancePaidFormatted}
                                  </div>
                                )}
                                {order.balanceDueFormatted && (
                                  <div className="text-[10px] text-gray-400">
                                    90% on Dock: {order.balanceDueFormatted}
                                  </div>
                                )}
                              </div>
                              <Link
                                href="/orders"
                                className="px-3.5 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold text-xs rounded-xl border border-brand-200 transition-all flex items-center gap-1"
                              >
                                <span>🛡️ Track Escrow</span>
                                <span>→</span>
                              </Link>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── PRODUCTS TAB (My Product Catalog) ── */}
            {activeTab === 'products' && (
              <motion.div
                key="products"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row justify-between sm:items-center bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-border-subtle gap-4">
                  <div>
                    <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
                      📦 Product Catalog ({supplierProducts.length})
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">Manage listings, stock levels, and technical specs visible to buyers.</p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="relative flex-1 sm:w-64">
                      <span className="absolute left-3 top-2.5 text-gray-400 text-sm">🔍</span>
                      <input 
                        type="text" 
                        placeholder="Search my products..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-xs sm:text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                      />
                    </div>
                    <button 
                      onClick={handleAddProductClick} 
                      className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-md transition-all hover:scale-[1.01] text-xs sm:text-sm whitespace-nowrap flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>➕</span> Add New Product
                    </button>
                  </div>
                </div>

                {/* Subscription Expired Notice in Product Catalog */}
                {membershipInfo?.isExpired && (
                  <div className="p-4.5 bg-rose-50 border-2 border-rose-300 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-rose-900 shadow-sm">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl mt-0.5">🔴</span>
                      <div>
                        <div className="font-black text-sm text-rose-900">
                          Catalog Hidden from Marketplace (Subscription Expired)
                        </div>
                        <p className="text-xs text-rose-700 mt-0.5 leading-relaxed">
                          Your {supplierProducts.length} product listings are currently <strong>hidden from buyers</strong>. Renew your membership now to automatically reactivate all your catalog items live on B2B India.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleUpgradePlan(membershipInfo?.previousPlan || 'ANNUAL PLAN')}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md whitespace-nowrap cursor-pointer flex-shrink-0"
                    >
                      🔄 Renew Plan & Restore Catalog
                    </button>
                  </div>
                )}

                {loadingProducts ? (
                  <div className="bg-white p-12 rounded-2xl text-center text-gray-500 border border-gray-200">
                    <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-3" />
                    Loading product catalog...
                  </div>
                ) : supplierProducts.length === 0 ? (
                  <div className="bg-white rounded-2xl border-2 border-dashed border-gray-300 p-10 text-center flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-brand-50 text-brand-600 rounded-full flex items-center justify-center text-3xl mb-4">📦</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No Products Added Yet</h3>
                    <p className="text-sm text-gray-500 max-w-md mb-6">List your products with IndiaMART standard technical specifications to receive buyer quotation requests.</p>
                    <button 
                      onClick={handleAddProductClick} 
                      className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-lg transition-all text-sm"
                    >
                      + Create First Product Listing
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
                    {supplierProducts
                      .filter(p => !productSearch || p.title?.toLowerCase().includes(productSearch.toLowerCase()) || p.hsn_code?.includes(productSearch))
                      .map((prod) => {
                        const thumbnail = prod.hero_image_url || prod.gallery_image_urls?.[0];
                        const photoCount = Array.isArray(prod.gallery_image_urls) ? prod.gallery_image_urls.length : (thumbnail ? 1 : 0);

                        return (
                          <div key={prod.id} className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-border-subtle overflow-hidden flex flex-col justify-between group">
                            <div className="h-44 bg-slate-100 relative overflow-hidden">
                              {thumbnail ? (
                                <img src={thumbnail} alt={prod.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-4xl">🌾</div>
                              )}
                              <span className={`absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md ${
                                membershipInfo?.isExpired 
                                  ? 'bg-rose-600 text-white' 
                                  : prod.is_active 
                                  ? 'bg-emerald-600 text-white' 
                                  : 'bg-gray-500 text-white'
                              }`}>
                                {membershipInfo?.isExpired ? '🔒 Hidden (Expired)' : prod.is_active ? 'Active' : 'Inactive'}
                              </span>
                              {photoCount > 1 && (
                                <span className="absolute top-3 left-3 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                                  📸 {photoCount} photos
                                </span>
                              )}
                              {prod.quality_grade && (
                                <span className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 rounded-md">
                                  {prod.quality_grade}
                                </span>
                              )}
                            </div>
                            
                            <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                              <div>
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <span className="text-[10px] font-bold text-brand-600 uppercase tracking-wider truncate">
                                    {prod.sector_id?.name || 'Trade Sector'}
                                  </span>
                                  {prod.hsn_code && <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">HSN: {prod.hsn_code}</span>}
                                </div>
                                
                                <h3 className="font-bold text-gray-900 text-base leading-snug line-clamp-2 mb-2 group-hover:text-brand-600 transition-colors">
                                  {prod.title}
                                </h3>
                                
                                <div className="flex items-baseline gap-1 text-emerald-600 font-extrabold text-lg mb-3">
                                  ₹{prod.base_price_per_unit}
                                  <span className="text-xs text-gray-500 font-normal">/ {prod.unit_label || 'unit'}</span>
                                </div>

                                <div className="bg-slate-50 p-2.5 rounded-xl text-xs space-y-1 mb-3 text-slate-600">
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">Stock:</span>
                                    <span className="font-bold text-slate-800">{prod.inventory_count || 1000} {prod.unit_label}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">MOQ:</span>
                                    <span className="font-semibold text-slate-700">{prod.bulk_minimum_order || 1000} {prod.unit_label}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex gap-2 pt-3 border-t border-gray-100">
                                <button
                                  onClick={() => setEditingProduct(prod)}
                                  className="flex-1 py-2 px-3 bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 text-xs font-bold rounded-xl text-center transition-all flex items-center justify-center gap-1 cursor-pointer"
                                  title="Edit Product Specifications, Pricing & Stock"
                                >
                                  <span>✏️</span> Edit
                                </button>
                                <Link
                                  href={`/directory/product/${prod.id}`}
                                  target="_blank"
                                  className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl text-center transition-colors flex items-center justify-center gap-1"
                                >
                                  <span>👁️</span> View Details
                                </Link>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      
                    <div 
                      onClick={handleAddProductClick}
                      className="bg-white rounded-2xl border-2 border-dashed border-gray-300 hover:border-brand-500 hover:bg-brand-50/50 cursor-pointer transition-all p-6 text-center flex flex-col items-center justify-center group min-h-[300px]"
                    >
                      <div className="w-14 h-14 bg-gray-100 group-hover:bg-brand-100 text-gray-400 group-hover:text-brand-600 rounded-full flex items-center justify-center mb-3 transition-colors text-2xl">
                        ➕
                      </div>
                      <h3 className="font-bold text-gray-800 group-hover:text-brand-700 text-base mb-1">Add Another Product</h3>
                      <p className="text-xs text-gray-500 max-w-[200px]">Click to open the IndiaMART standard universal product listing form.</p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── SETTINGS TAB (Alibaba Style) ── */}
            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Superadmin Access Banner */}
                {isAdminUser && (
                  <div className="bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl border border-purple-500/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-purple-600/30 border border-purple-400/40 flex items-center justify-center text-2xl flex-shrink-0 shadow-inner">
                        🛡️
                      </div>
                      <div>
                        <div className="text-base font-black flex items-center gap-2">
                          <span>Administrator Privileges Active</span>
                          <span className="px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-200 text-[11px] font-extrabold border border-purple-400/30">Superadmin</span>
                        </div>
                        <p className="text-xs text-purple-200/80 mt-0.5 font-medium">
                          Your account has full management authorization over all suppliers, buyers, product catalogs, and subscription ledgers.
                        </p>
                      </div>
                    </div>
                    <Link
                      href="/admin/dashboard"
                      className="px-5 py-2.5 rounded-xl bg-white text-purple-950 hover:bg-purple-50 font-black text-xs transition-all shadow-md flex items-center justify-center gap-2 flex-shrink-0 cursor-pointer"
                    >
                      <span>Open Admin Control Center</span>
                      <span>→</span>
                    </Link>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Column: Personal & Company Info */}
                  <div className="lg:col-span-2 space-y-6">
                    
                    {/* Personal Information */}
                    <div className="bg-white rounded-2xl shadow-sm border border-border-subtle overflow-hidden">
                      <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
                        <div>
                          <h3 className="font-bold text-lg text-gray-900">Personal Information</h3>
                          <p className="text-xs text-gray-400 mt-0.5">Primary contact identity and account credentials</p>
                        </div>
                        <button onClick={() => setEditProfileSection('basic')} className="text-sm font-semibold text-brand-600 hover:text-brand-800 flex items-center gap-1 cursor-pointer">
                          <span>✏️</span> Edit
                        </button>
                      </div>
                      <div className="p-6 space-y-6">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 text-2xl font-bold uppercase shadow-inner">
                            {(activeProfile?.full_name || activeProfile?.company_name || user?.user_metadata?.full_name || 'U').charAt(0)}
                          </div>
                          <div>
                            <div className="text-lg font-bold text-gray-900">
                              {activeProfile?.full_name || user?.user_metadata?.full_name || activeProfile?.company_name || 'User'}
                            </div>
                            <div className="text-xs font-semibold text-slate-500 mt-0.5">
                              {activeProfile?.company_name ? `${activeProfile.company_name}` : 'Registered Enterprise'}
                            </div>
                            <div className="text-sm text-gray-500">{user?.email || activeProfile?.registered_email}</div>
                            {activeProfile?.job_title && (
                              <div className="text-xs font-semibold text-brand-600 mt-0.5">
                                Designation: {activeProfile.job_title}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 pt-4 border-t border-gray-50">
                          <div>
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Account ID</div>
                            <div className="text-sm font-bold text-brand-700 font-mono bg-brand-50/80 px-2 py-0.5 rounded inline-block">{activeProfile?.display_id || 'Not assigned'}</div>
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Registered Email</div>
                            <div className="text-sm font-medium text-gray-900 truncate" title={user?.email || activeProfile?.registered_email}>{user?.email || activeProfile?.registered_email}</div>
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Contact Phone</div>
                            <div className="text-sm font-medium text-gray-900">{activeProfile?.phone_number || activeProfile?.corporate_phone || 'Not provided'}</div>
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">WhatsApp Number</div>
                            <div className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                              {activeProfile?.whatsapp_number ? (
                                <span className="text-emerald-700 font-bold flex items-center gap-1">
                                  <span>💬</span> {activeProfile.whatsapp_number}
                                </span>
                              ) : (
                                <span className="text-gray-400">Not provided</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Company Profile */}
                    <div className="bg-white rounded-2xl shadow-sm border border-border-subtle overflow-hidden">
                      <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                          <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                            <span>🏢</span> Company Profile &amp; Commercial Dossier
                          </h3>
                          <p className="text-xs text-gray-400 mt-0.5">Commercial registration, statutory credentials, operating facilities &amp; sourcing capacity</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setEditProfileSection('business')} className="text-xs font-bold text-brand-700 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-xl border border-brand-200 transition-colors flex items-center gap-1 cursor-pointer shadow-2xs">
                            <span>✏️</span> Edit Business
                          </button>
                          <button onClick={() => setEditProfileSection('more')} className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1 cursor-pointer">
                            <span>📋</span> Details
                          </button>
                          <button onClick={() => setEditProfileSection('sourcing')} className="text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-xl border border-amber-200 transition-colors flex items-center gap-1 cursor-pointer">
                            <span>🎯</span> Sourcing
                          </button>
                        </div>
                      </div>

                      <div className="p-6 space-y-6">
                        {/* Section 1: Commercial & Legal Identity */}
                        <div>
                          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <span>🛡️</span> Statutory &amp; Commercial Identity
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            <div>
                              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Company Name</div>
                              <div className="text-sm font-bold text-gray-900">{activeProfile?.company_name || 'Not provided'}</div>
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Business Type</div>
                              <div className="text-sm font-medium text-gray-900 capitalize">
                                {activeProfile?.role === 'both' ? 'Trade Partner (Buyer & Supplier)' : activeProfile?.role === 'supplier' ? 'Supplier / Manufacturer' : (activeProfile?.role || 'Buyer')}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">GST / Tax ID</div>
                              <div className="text-sm font-mono font-bold text-gray-900 flex items-center gap-1.5">
                                <span>{activeProfile?.gst_number || 'Not provided'}</span>
                                {(activeProfile?.gst_verified || activeProfile?.gst_status === 'format_verified' || (activeProfile?.gst_number && activeProfile.gst_number !== 'PENDING')) && (
                                  <span className="text-[10px] bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold px-1.5 py-0.5 rounded-md">✓ Verified</span>
                                )}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">PAN Number</div>
                              <div className="text-sm font-mono font-bold text-gray-900">{activeProfile?.pan_number || 'Not provided'}</div>
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Account Status</div>
                              <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                                {activeProfile?.status === 'active' ? (
                                  <><span className="w-2 h-2 rounded-full bg-green-500"></span> Verified Active</>
                                ) : (
                                  <><span className="w-2 h-2 rounded-full bg-amber-500"></span> Pending Verification</>
                                )}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Annual Turnover</div>
                              <div className="text-sm font-bold text-brand-700">
                                {activeProfile?.annual_turnover_lakhs ? `₹${activeProfile.annual_turnover_lakhs} Lakhs INR` : 'Not specified'}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Section 2: Enterprise Demographics & Capabilities */}
                        <div className="pt-4 border-t border-gray-100">
                          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <span>📊</span> Scale &amp; Enterprise Demographics
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                            <div>
                              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Executive Designation</div>
                              <div className="text-sm font-medium text-gray-900">{activeProfile?.job_title || 'Not specified'}</div>
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Year Established</div>
                              <div className="text-sm font-medium text-gray-900">{activeProfile?.year_established || 'Not specified'}</div>
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Total Employees</div>
                              <div className="text-sm font-medium text-gray-900">{activeProfile?.total_employees ? `${activeProfile.total_employees} Employees` : 'Not specified'}</div>
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Official Website</div>
                              <div className="text-sm font-medium text-gray-900 truncate">
                                {activeProfile?.website ? (
                                  <a href={activeProfile.website.startsWith('http') ? activeProfile.website : `https://${activeProfile.website}`} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline">
                                    {activeProfile.website}
                                  </a>
                                ) : (
                                  <span className="text-gray-400">Not provided</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Section 3: Sourcing & Procurement Capacity */}
                        <div className="pt-4 border-t border-gray-100">
                          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <span>🎯</span> Sourcing &amp; Procurement Capacity
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            <div>
                              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Sourcing Frequency</div>
                              <div className="text-sm font-bold text-slate-800">{activeProfile?.sourcing_frequency || 'Not specified'}</div>
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Annual Sourcing Budget</div>
                              <div className="text-sm font-bold text-emerald-700">{activeProfile?.annual_spending || 'Not specified'}</div>
                            </div>
                            <div className="sm:col-span-2 lg:col-span-1">
                              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Business Categories / Sectors</div>
                              <div className="mt-1">
                                {Array.isArray(activeProfile?.categories) && activeProfile.categories.length > 0 ? (
                                  <div className="flex flex-wrap gap-1.5">
                                    {activeProfile.categories.map((cat, cIdx) => (
                                      <span key={cIdx} className="px-2.5 py-0.5 bg-brand-50 border border-brand-200 text-brand-800 text-xs font-bold rounded-lg capitalize">
                                        {cat.replace(/-/g, ' ')}
                                      </span>
                                    ))}
                                  </div>
                                ) : typeof activeProfile?.categories === 'string' && activeProfile.categories.trim() ? (
                                  <div className="flex flex-wrap gap-1.5">
                                    {activeProfile.categories.split(',').map((cat, cIdx) => (
                                      <span key={cIdx} className="px-2.5 py-0.5 bg-brand-50 border border-brand-200 text-brand-800 text-xs font-bold rounded-lg capitalize">
                                        {cat.trim()}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-sm text-gray-400">All Categories</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Section 4: Registered Location & Warehouse Facility */}
                        <div className="pt-4 border-t border-gray-100">
                          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <span>📍</span> Registered Location &amp; Facilities
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div>
                              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Operating Jurisdiction</div>
                              <div className="text-sm font-medium text-gray-900">
                                {[activeProfile?.city, activeProfile?.state, activeProfile?.pincode].filter(Boolean).join(', ') || 'Not specified'}
                              </div>
                            </div>
                            <div className="md:col-span-2">
                              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Facility / Warehouse Address</div>
                              <div className="text-sm font-medium text-gray-900">
                                {activeProfile?.warehouse_address || 'Not specified'}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Section 5: Company Overview & Bio */}
                        <div className="pt-4 border-t border-gray-100">
                          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">About Company / Enterprise Bio</div>
                          <div className="text-sm text-gray-700 bg-slate-50/80 p-4 rounded-xl border border-slate-100 leading-relaxed">
                            {activeProfile?.about_us || 'No company overview provided yet. Click "Edit Business" to describe your company, products, and manufacturing capabilities.'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Security & Verification */}
                  <div className="space-y-6">
                    
                    {/* Verification Hub */}
                    <div className="bg-white rounded-2xl shadow-sm border border-border-subtle overflow-hidden">
                      <div className="px-6 py-5 border-b border-gray-100">
                        <h3 className="font-bold text-lg text-gray-900">Verification Hub</h3>
                      </div>
                      <div className="p-6 space-y-4">
                        <div className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-emerald-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          <div>
                            <div className="text-sm font-bold text-gray-900">Email Verification</div>
                            <div className="text-xs font-semibold text-emerald-600">Verified via {user?.app_metadata?.providers?.includes('google') ? 'Google Auth' : 'Email'}</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-emerald-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          <div>
                            <div className="text-sm font-bold text-gray-900">Mobile Number</div>
                            <div className="text-xs font-semibold text-gray-700">{activeProfile?.phone_number || activeProfile?.corporate_phone || 'Not verified'}</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          {activeProfile?.gst_verified || (activeProfile?.gst_number && activeProfile?.gst_number !== 'PENDING') ? (
                            <svg className="w-5 h-5 text-emerald-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          ) : (
                            <svg className="w-5 h-5 text-amber-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          )}
                          <div>
                            <div className="text-sm font-bold text-gray-900">GST Registration</div>
                            <div className={`text-xs font-bold ${
                              activeProfile?.gst_verified || (activeProfile?.gst_number && activeProfile?.gst_number !== 'PENDING')
                                ? 'text-emerald-600'
                                : 'text-amber-600'
                            }`}>
                              {activeProfile?.gst_verified || (activeProfile?.gst_number && activeProfile?.gst_number !== 'PENDING')
                                ? `Verified (${activeProfile.gst_number})`
                                : 'Pending manual verification'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          {activeProfile?.pan_number ? (
                            <svg className="w-5 h-5 text-emerald-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          ) : (
                            <svg className="w-5 h-5 text-slate-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          )}
                          <div>
                            <div className="text-sm font-bold text-gray-900">PAN Identification</div>
                            <div className={`text-xs font-bold ${activeProfile?.pan_number ? 'text-emerald-600 font-mono' : 'text-slate-400'}`}>
                              {activeProfile?.pan_number ? `Verified (${activeProfile.pan_number})` : 'Not provided'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Security / Change Password */}
                    <div className="bg-white rounded-2xl shadow-sm border border-border-subtle overflow-hidden">
                      <div className="px-6 py-5 border-b border-gray-100">
                        <h3 className="font-bold text-lg text-gray-900">Account Security</h3>
                      </div>
                      <div className="p-6">
                        {user?.app_metadata?.providers?.includes('google') ? (
                          <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-xl border border-gray-100">
                            Your account is secured via Google Authentication. Password changes must be managed through your Google account.
                          </div>
                        ) : (
                          <form onSubmit={handleUpdatePassword} className="space-y-4">
                            {pwdStatus.error && (
                              <div className="p-3 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-100">
                                {pwdStatus.error}
                              </div>
                            )}
                            {pwdStatus.success && (
                              <div className="p-3 bg-green-50 text-green-600 text-sm font-medium rounded-xl border border-green-100">
                                {pwdStatus.success}
                              </div>
                            )}
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Current Password</label>
                              <input 
                                type="password" 
                                placeholder="••••••••" 
                                value={pwdForm.old}
                                onChange={(e) => setPwdForm({...pwdForm, old: e.target.value})}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none text-sm transition-shadow" 
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-1.5">New Password</label>
                              <input 
                                type="password" 
                                placeholder="••••••••" 
                                value={pwdForm.new}
                                onChange={(e) => setPwdForm({...pwdForm, new: e.target.value})}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none text-sm transition-shadow" 
                              />
                            </div>
                            <div className="pt-2">
                              <button 
                                type="submit" 
                                disabled={pwdStatus.loading}
                                className="w-full px-5 py-2.5 bg-gray-900 hover:bg-black text-white text-sm font-semibold rounded-xl shadow-sm transition-colors disabled:opacity-50"
                              >
                                {pwdStatus.loading ? 'Updating...' : 'Update Password'}
                              </button>
                            </div>
                          </form>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              </motion.div>
            )}


          </AnimatePresence>

          {/* Upgrade Gate Modal (Shown when Free Tier user attempts to upload products) */}
          {showUpgradeGateModal && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 text-center relative overflow-hidden"
              >
                <button
                  onClick={() => setShowUpgradeGateModal(false)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 text-xl font-bold p-1"
                >
                  ✕
                </button>

                <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-3xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg shadow-amber-600/20">
                  🔒
                </div>

                <h3 className="text-2xl font-black text-slate-900">
                  Membership Upgrade Required
                </h3>

                <p className="text-xs text-slate-600 mt-2 font-medium leading-relaxed">
                  Your account is currently on the <strong>FREE TIER</strong>, which does not permit product catalog listings. Upgrade with Razorpay to unlock <strong>unlimited product uploads</strong> and make your products live.
                </p>

                <div className="my-5 max-w-sm mx-auto text-left">
                  {/* Annual Plan */}
                  <div className="p-5 bg-gradient-to-br from-amber-50/80 to-white rounded-2xl border-2 border-amber-400 relative shadow-lg shadow-amber-500/10 flex flex-col justify-between">
                    <div className="absolute -top-3 right-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                      {pricingInfo?.discountPercent ? `${pricingInfo.discountPercent}% OFF` : '1 YEAR ALL-INCLUSIVE'}
                    </div>
                    <div>
                      <div className="text-sm font-extrabold text-slate-900">ANNUAL PLAN (12 MONTHS)</div>
                      
                      {/* Strikethrough & Selling Price */}
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="text-sm font-bold text-slate-400 line-through decoration-rose-500 decoration-2 font-mono">
                          ₹{(pricingInfo?.originalPrice || 20000).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[11px] font-extrabold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-md border border-emerald-300">
                          Selling Price: ₹{(pricingInfo?.baseAmount || 2000).toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="text-2xl font-black text-amber-700 font-mono my-1.5">
                        ₹{(pricingInfo?.totalPayable || 2429.62).toFixed(2)}
                        <span className="text-xs font-normal text-slate-500 ml-1.5 font-sans">all-inclusive</span>
                      </div>

                      <div className="text-[11px] text-slate-500 font-mono space-y-1 border-t border-amber-200/80 pt-2 mt-1 bg-amber-50/50 p-2.5 rounded-xl border">
                        <div className="flex justify-between">
                          <span>Selling Base Price:</span>
                          <span className="font-bold">₹{(pricingInfo?.baseAmount || 2000).toLocaleString('en-IN')}.00</span>
                        </div>
                        <div className="flex justify-between text-emerald-800 font-bold">
                          <span>+ {pricingInfo?.gstRate || 18}% GST on Base:</span>
                          <span>+₹{(pricingInfo?.gstAmount || 360).toFixed(2)} (₹{(pricingInfo?.subtotalWithGst || 2360).toFixed(2)})</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>+ Gateway Fee ({pricingInfo?.gatewayFeePercent || 2.5}% + {pricingInfo?.gstRate || 18}% GST):</span>
                          <span>+₹{(pricingInfo?.totalGatewaySurcharge || 69.62).toFixed(2)}</span>
                        </div>
                      </div>
                      <ul className="text-xs text-slate-700 space-y-1.5 mt-3.5">
                        <li className="font-semibold text-emerald-700">✓ Unlimited Product Catalog Uploads</li>
                        <li>✓ 1 Full Year Active Marketplace Indexing</li>
                        <li>✓ Direct Buyer Inquiries &amp; Live RFQ Access</li>
                        <li>✓ Dedicated Account Manager &amp; Priority Support</li>
                      </ul>
                    </div>
                    <button
                      onClick={() => handleUpgradePlan('ANNUAL PLAN')}
                      disabled={upgradingPlan === 'ANNUAL PLAN'}
                      className="mt-4 w-full py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-black text-sm rounded-xl transition-all shadow-md shadow-amber-600/30 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 btn-shine"
                    >
                      {upgradingPlan === 'ANNUAL PLAN' ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Opening Razorpay...</span>
                        </>
                      ) : (
                        <span>⚡ Pay ₹{(pricingInfo?.totalPayable || 2429.62).toFixed(2)} (Activate 1 Year)</span>
                      )}
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => setShowUpgradeGateModal(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 font-semibold cursor-pointer"
                >
                  Maybe Later
                </button>
              </motion.div>
            </div>
          )}

          {/* Upgrade Success Modal */}
          {upgradeSuccessModal && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 text-center relative overflow-hidden"
              >
                <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-3xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg shadow-emerald-600/20">
                  🎉
                </div>

                <h3 className="text-2xl font-black text-slate-900">
                  Membership Activated!
                </h3>

                <p className="text-xs text-slate-600 mt-2 font-medium">
                  Your supplier account is now upgraded to <strong className="text-emerald-700">{upgradeSuccessModal.plan}</strong>. Unlimited product listings and verified buyer RFQ quotes are now active.
                </p>

                <div className="my-5 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-left space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Active Tier:</span>
                    <span className="font-bold text-slate-900">{upgradeSuccessModal.plan}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Amount Paid:</span>
                    <span className="font-extrabold text-emerald-700">₹{upgradeSuccessModal.amount?.toLocaleString('en-IN')}</span>
                  </div>
                  {upgradeSuccessModal.paymentId && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Razorpay Payment ID:</span>
                      <span className="font-mono font-bold text-slate-700">{upgradeSuccessModal.paymentId}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-slate-200 pt-1.5 text-emerald-800 font-extrabold">
                    <span>Product Uploads:</span>
                    <span>✓ UNLOCKED & ACTIVE</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      setUpgradeSuccessModal(null);
                      setShowAddProduct(true);
                    }}
                    className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-brand-600/20 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>➕</span> Upload Your First Product Listing
                  </button>
                  <button
                    onClick={() => setUpgradeSuccessModal(null)}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {/* Add or Edit Product Modal */}
          {(showAddProduct || editingProduct) && (
            <AddProductForm 
              productToEdit={editingProduct}
              onClose={() => { 
                setShowAddProduct(false); 
                setEditingProduct(null); 
                fetchSupplierProducts(); 
              }} 
            />
          )}

          {/* Create or Edit RFQ Modal */}
          {(showRFQForm || editingRfq) && (
            <SmartRFQForm 
              rfqToEdit={editingRfq}
              onClose={() => { 
                setShowRFQForm(false); 
                setEditingRfq(null); 
              }} 
            />
          )}

          {/* Razorpay Checkout Script */}
          <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
        </div>
      </main>
    </>
  );
}
