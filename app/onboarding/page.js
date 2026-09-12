// ============================================================================
// ONBOARDING PAGE
// ============================================================================
// Multi-step onboarding form shown after Google OAuth or email signup.
// Step 1: Role selection (Buyer/Supplier)
// Step 2: Company details + GST verification
// Step 3: Category selection
// Step 4: Success screen with generated ID
// ============================================================================

"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { STATIC_SECTORS } from '@/constants/sectors';
import B2BLogo from '@/components/B2BLogo';

const STEPS = [
  { id: 1, label: 'Trade Account', icon: '🤝' },
  { id: 2, label: 'Company', icon: '🏢' },
  { id: 3, label: 'Categories', icon: '📂' },
  { id: 4, label: 'Done', icon: '✅' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [gstVerified, setGstVerified] = useState(false);
  const [gstVerifying, setGstVerifying] = useState(false);
  const [gstDetails, setGstDetails] = useState(null);
  const [categorySearch, setCategorySearch] = useState('');
  const [successData, setSuccessData] = useState(null);
  const [sectors, setSectors] = useState(STATIC_SECTORS);

  // Fetch dynamic sectors
  useEffect(() => {
    async function fetchSectors() {
      try {
        const res = await fetch('/api/sectors');
        if (res.ok) {
          const data = await res.json();
          if (data.sectors && data.sectors.length > 0) {
            setSectors(data.sectors);
          }
        }
      } catch (err) {
        console.error('Failed to fetch sectors', err);
      }
    }
    fetchSectors();
  }, []);

  const [formData, setFormData] = useState({
    role: 'both',
    companyName: '',
    fullName: '',
    gstNumber: '',
    phone: '',
    categories: [],
  });

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [authLoading, user, router]);

  // Pre-fill name from Google profile
  useEffect(() => {
    if (user?.user_metadata?.full_name) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData(prev => ({
        ...prev,
        fullName: prev.fullName || user.user_metadata.full_name,
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
    // Reset GST verification if number changes
    if (name === 'gstNumber') {
      setGstVerified(false);
      setGstDetails(null);
    }
  };

  const selectRole = (role) => {
    setFormData(prev => ({ ...prev, role }));
    setError('');
  };

  const toggleCategory = (slug) => {
    setFormData(prev => {
      const cats = prev.categories.includes(slug)
        ? prev.categories.filter(c => c !== slug)
        : [...prev.categories, slug];
      return { ...prev, categories: cats };
    });
    setError('');
  };

  // Filter categories based on search
  const filteredSectors = useMemo(() => {
    if (!categorySearch.trim()) return sectors;
    const q = categorySearch.toLowerCase();
    return sectors.filter(s =>
      s.name.toLowerCase().includes(q) || s.slug.toLowerCase().includes(q)
    );
  }, [categorySearch, sectors]);

  // GST Verification
  const verifyGST = async () => {
    const gstin = formData.gstNumber.toUpperCase().trim();
    if (!gstin) {
      setError('Please enter a GST number first.');
      return;
    }

    setGstVerifying(true);
    setError('');

    try {
      const res = await fetch('/api/gst/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gstNumber: gstin }),
      });

      const data = await res.json();

      if (!res.ok || !data.valid) {
        setError(data.error || 'GST verification failed.');
        setGstVerified(false);
        setGstDetails(null);
      } else {
        setGstVerified(true);
        setGstDetails(data.details);
        setFormData(prev => ({ ...prev, gstNumber: data.gstin }));
      }
    } catch (err) {
      setError('Failed to verify GST. Please try again.');
    } finally {
      setGstVerifying(false);
    }
  };

  // Validate current step
  const validateStep = () => {
    switch (step) {
      case 1:
        if (!formData.role) {
          setError('Please select whether you are a buyer or supplier.');
          return false;
        }
        return true;
      case 2:
        if (!formData.companyName.trim()) {
          setError('Company name is required.');
          return false;
        }
        if (!gstVerified) {
          setError('Please verify your GST number before proceeding.');
          return false;
        }
        if (!formData.phone.trim() || formData.phone.trim().length < 10) {
          setError('Please enter a valid phone number.');
          return false;
        }
        return true;
      case 3:
        if (formData.categories.length === 0) {
          setError('Please select at least one category.');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep()) {
      setError('');
      setStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setError('');
    setStep(prev => prev - 1);
  };

  // Submit onboarding
  const handleSubmit = async () => {
    if (!validateStep()) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed. Please try again.');
        return;
      }

      setSuccessData(data);
      setStep(4);
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show loading while auth resolves
  if (authLoading || !user) {
    return (
      <main className="min-h-screen bg-surface-elevated flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-surface-elevated flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <B2BLogo className="w-10 h-10" />
          <div>
            <span className="text-lg font-bold text-brand-950">B2B INDIA</span>
            <span className="text-xs text-gray-400 block">Complete your registration</span>
          </div>
        </div>
      </div>

      {/* Progress Stepper */}
      {step < 4 && (
        <div className="bg-white border-b border-gray-100 px-4 sm:px-6 py-4">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between">
              {STEPS.slice(0, 3).map((s, i) => (
                <React.Fragment key={s.id}>
                  <div className="flex items-center gap-2">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                      step > s.id
                        ? 'bg-green-500 text-white'
                        : step === s.id
                        ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/30'
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      {step > s.id ? '✓' : s.icon}
                    </div>
                    <span className={`text-sm font-medium hidden sm:block ${
                      step >= s.id ? 'text-gray-900' : 'text-gray-400'
                    }`}>
                      {s.label}
                    </span>
                  </div>
                  {i < 2 && (
                    <div className={`flex-1 h-0.5 mx-3 rounded transition-all duration-500 ${
                      step > s.id ? 'bg-green-500' : 'bg-gray-200'
                    }`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex items-start justify-center px-4 sm:px-6 py-8">
        <div className="w-full max-w-2xl">
          {/* Error Display */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-sm text-amber-900 flex items-center justify-between gap-3 shadow-sm"
              >
                <div className="flex items-start gap-2.5">
                  <span className="text-amber-600 mt-0.5 font-bold">⚠️</span>
                  <span className="font-semibold">{error}</span>
                </div>
                <Link
                  href="/dashboard"
                  className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-extrabold rounded-xl transition-all shadow-md shrink-0 active:scale-95"
                >
                  Go to Dashboard →
                </Link>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {/* ── STEP 1: Unified All-in-One Trade Account ── */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center sm:text-left mb-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold mb-3">
                    <span>✨</span> All-in-One Trade Account Enabled
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-2">
                    Welcome to B2B INDIA! 🇮🇳
                  </h1>
                  <p className="text-gray-500 text-sm sm:text-base leading-relaxed">
                    Your single business account allows you to seamlessly <strong>Buy raw goods & materials</strong> and <strong>Sell products</strong> across 38+ sectors in India.
                  </p>
                </div>

                {/* Dual Capabilities Showcase */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  {/* Buyer Card */}
                  <div className="p-5 rounded-2xl border-2 border-brand-200 bg-gradient-to-br from-brand-50/60 to-white shadow-sm relative overflow-hidden">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center text-xl">
                        🛒
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-base">Procure as a Buyer</h3>
                        <span className="text-[11px] text-brand-700 font-semibold">Post RFQs & Source Materials</span>
                      </div>
                    </div>
                    <ul className="space-y-2 text-xs text-gray-600">
                      <li className="flex items-center gap-2">
                        <span className="text-emerald-500 font-bold">✓</span> Broadcast Smart RFQs to 10,000+ verified suppliers
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-emerald-500 font-bold">✓</span> 100% Escrow protected trade payments
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-emerald-500 font-bold">✓</span> Dockside cargo inspection & real-time logistics
                      </li>
                    </ul>
                  </div>

                  {/* Supplier Card */}
                  <div className="p-5 rounded-2xl border-2 border-orange-200 bg-gradient-to-br from-orange-50/60 to-white shadow-sm relative overflow-hidden">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-xl">
                        🏭
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-base">Sell as a Supplier</h3>
                        <span className="text-[11px] text-orange-700 font-semibold">List Catalog & Win Orders</span>
                      </div>
                    </div>
                    <ul className="space-y-2 text-xs text-gray-600">
                      <li className="flex items-center gap-2">
                        <span className="text-emerald-500 font-bold">✓</span> List wholesale product inventory nationwide
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-emerald-500 font-bold">✓</span> Direct quotation access to live buyer RFQs
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-emerald-500 font-bold">✓</span> Instant GST verified trust badge on your catalog
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 mb-8 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                    💡
                  </div>
                  <p className="text-xs text-slate-600">
                    <strong>No need to register twice.</strong> You will have a unified dashboard to manage both purchase orders and product sales.
                  </p>
                </div>

                <button
                  onClick={nextStep}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 text-white font-semibold shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 transition-all duration-200 active:scale-[0.98] text-sm"
                >
                  Continue to Business Details →
                </button>
              </motion.div>
            )}

            {/* ── STEP 2: Company Details & GST ── */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3 }}
              >
                <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-2">
                  Business Details 🏢
                </h1>
                <p className="text-gray-500 mb-8">
                  Enter your company info and GST number for verification.
                </p>

                <div className="space-y-5">
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Your Full Name
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="e.g. Rajesh Sharma"
                      className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-foreground placeholder:text-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all text-sm"
                    />
                  </div>

                  {/* Company Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Company / Business Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      required
                      placeholder="e.g. Aaudumbar Agro Pvt Ltd"
                      className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-foreground placeholder:text-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all text-sm"
                    />
                  </div>

                  {/* GST Number with Verify Button */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      GST Number (GSTIN) <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        name="gstNumber"
                        value={formData.gstNumber}
                        onChange={handleChange}
                        required
                        maxLength={15}
                        placeholder="22AAAAA0000A1Z5"
                        className={`flex-1 px-4 py-3 rounded-xl bg-white border text-foreground placeholder:text-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all text-sm uppercase ${
                          gstVerified ? 'border-green-400 bg-green-50' : 'border-gray-200'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={verifyGST}
                        disabled={gstVerifying || !formData.gstNumber.trim()}
                        className={`px-5 py-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                          gstVerified
                            ? 'bg-green-100 text-green-700 border border-green-300'
                            : 'bg-brand-600 text-white hover:bg-brand-500 disabled:opacity-50'
                        }`}
                      >
                        {gstVerifying ? (
                          <span className="flex items-center gap-2">
                            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Verifying...
                          </span>
                        ) : gstVerified ? (
                          '✓ Verified'
                        ) : (
                          'Verify GST'
                        )}
                      </button>
                    </div>

                    {/* GST Details Card */}
                    {gstVerified && gstDetails && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-3 p-3 rounded-xl bg-green-50 border border-green-200 text-sm"
                      >
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-gray-500">State:</span>{' '}
                            <span className="font-medium text-gray-800">{gstDetails.stateName}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Entity Type:</span>{' '}
                            <span className="font-medium text-gray-800">{gstDetails.entityType}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">PAN:</span>{' '}
                            <span className="font-medium text-gray-800">{gstDetails.panNumber}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Status:</span>{' '}
                            <span className="font-medium text-green-700">Format Verified ✓</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Business Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      placeholder="+91-98765-43210"
                      className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-foreground placeholder:text-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all text-sm"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-8">
                  <button
                    onClick={prevStep}
                    className="px-6 py-3.5 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-all text-sm"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={nextStep}
                    className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 text-white font-semibold shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 transition-all duration-200 active:scale-[0.98] text-sm"
                  >
                    Continue →
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── STEP 3: Category Selection ── */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3 }}
              >
                <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-2">
                  Select Your Categories 📂
                </h1>
                <p className="text-gray-500 mb-4">
                  {formData.role === 'supplier'
                    ? 'Which sectors do you supply products in? Select all that apply.'
                    : formData.role === 'both'
                    ? 'Which sectors do you operate in (both buying and selling)? Select all that apply.'
                    : 'Which sectors are you interested in buying from? Select all that apply.'}
                </p>

                {/* Selected count */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-gray-500">
                    {formData.categories.length} selected
                  </span>
                  {formData.categories.length > 0 && (
                    <button
                      onClick={() => setFormData(prev => ({ ...prev, categories: [] }))}
                      className="text-xs text-red-500 hover:text-red-700 font-medium"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                {/* Category Search */}
                <div className="mb-4">
                  <input
                    type="text"
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    placeholder="🔍 Search categories..."
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-foreground placeholder:text-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all text-sm"
                  />
                </div>

                {/* Category Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar mb-6">
                  {filteredSectors.map((sector) => {
                    const isSelected = formData.categories.includes(sector.slug);
                    return (
                      <button
                        key={sector.id}
                        onClick={() => toggleCategory(sector.slug)}
                        className={`flex items-center gap-3 p-3 rounded-xl text-left text-sm transition-all duration-200 ${
                          isSelected
                            ? 'bg-brand-50 border-2 border-brand-500 text-brand-800 font-medium'
                            : 'bg-white border border-gray-200 text-gray-700 hover:border-brand-200 hover:bg-brand-50/30'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border-2 transition-all ${
                          isSelected
                            ? 'bg-brand-600 border-brand-600'
                            : 'border-gray-300'
                        }`}>
                          {isSelected && (
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className="truncate">{sector.name}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={prevStep}
                    className="px-6 py-3.5 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-all text-sm"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading || formData.categories.length === 0}
                    className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 text-white font-semibold shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Creating Account...
                      </span>
                    ) : (
                      'Complete Registration ✓'
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── STEP 4: Success Screen ── */}
            {step === 4 && successData && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="text-center py-8"
              >
                {/* Confetti-like decorative elements */}
                <div className="relative inline-block mb-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                    className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center mx-auto shadow-2xl shadow-green-500/30"
                  >
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5, type: 'spring' }}
                      className="text-4xl"
                    >
                      ✅
                    </motion.span>
                  </motion.div>
                  {/* Decorative particles */}
                  {[...Array(8)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                      animate={{
                        opacity: [0, 1, 0],
                        scale: [0, 1, 0.5],
                        x: Math.cos(i * 45 * Math.PI / 180) * 60,
                        y: Math.sin(i * 45 * Math.PI / 180) * 60,
                      }}
                      transition={{ delay: 0.3 + i * 0.05, duration: 1 }}
                      className={`absolute top-1/2 left-1/2 w-3 h-3 rounded-full ${
                        ['bg-yellow-400', 'bg-blue-400', 'bg-pink-400', 'bg-green-400', 'bg-purple-400', 'bg-orange-400', 'bg-cyan-400', 'bg-red-400'][i]
                      }`}
                    />
                  ))}
                </div>

                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-3xl sm:text-4xl font-extrabold text-foreground mb-3"
                >
                  Registration Successful! 🎉
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-gray-500 mb-8 max-w-md mx-auto"
                >
                  {successData.message}
                </motion.p>

                {/* ID Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="inline-block bg-white rounded-2xl shadow-xl border border-gray-200 p-6 mb-8 min-w-[280px]"
                >
                  <div className="text-xs text-gray-400 uppercase tracking-widest mb-3 font-medium">
                    Your {successData.role === 'supplier' ? 'Supplier' : successData.role === 'both' ? 'Merchant' : 'Buyer'} ID
                  </div>
                  <div className="text-4xl font-extrabold bg-gradient-to-r from-brand-600 to-accent-500 bg-clip-text text-transparent mb-3">
                    {successData.displayId}
                  </div>
                  <div className="text-sm font-medium text-gray-700">
                    {successData.companyName}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    GST: {formData.gstNumber}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                >
                  <button
                    onClick={() => {
                      router.push('/');
                      router.refresh();
                    }}
                    className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 text-white font-semibold shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 transition-all duration-200 active:scale-[0.98] text-sm"
                  >
                    Go to Homepage →
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
