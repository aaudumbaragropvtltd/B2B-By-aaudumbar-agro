// ============================================================================
// PROFILE PAGE — Alibaba-Style Buyer/Supplier Profile
// ============================================================================
// Full profile management page with preview card, basic info, business info,
// more information, and sourcing preferences sections.
// ============================================================================

"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import LocationCascadeSelector from '@/components/LocationCascadeSelector';
import Breadcrumbs from '@/components/Breadcrumbs';

// ── Section completion helper ──
function getCompletionStatus(fields) {
  const filled = fields.filter(f => f && String(f).trim() !== '');
  return { filled: filled.length, total: fields.length };
}

// ── Profile Field Row ──
function ProfileField({ label, value, isIncomplete }) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-gray-50 last:border-0 group">
      <div className="text-sm text-gray-500 font-medium min-w-[140px]">{label}</div>
      <div className={`text-sm font-semibold text-right ${isIncomplete ? 'text-amber-500 italic' : 'text-gray-900'}`}>
        {isIncomplete ? 'Incomplete' : value}
      </div>
    </div>
  );
}

// ── Section Card ──
function SectionCard({ title, subtitle, children, completionStatus, onEdit }) {
  const isComplete = completionStatus && completionStatus.filled === completionStatus.total;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
    >
      <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between">
        <div>
          <h3 className="font-bold text-lg text-gray-900">{title}</h3>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-1 max-w-md">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {completionStatus && !isComplete && (
            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
              {completionStatus.filled}/{completionStatus.total} Complete
            </span>
          )}
          {completionStatus && isComplete && (
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
              Complete
            </span>
          )}
          {onEdit && (
            <button
              onClick={onEdit}
              className="text-sm font-semibold text-brand-600 hover:text-brand-800 transition-colors flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              Edit
            </button>
          )}
        </div>
      </div>
      <div className="px-6 py-4">{children}</div>
    </motion.div>
  );
}

// ── Inline Edit Section Modal ──
function InlineEditModal({ isOpen, onClose, title, fields, onSave }) {
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Critical: Only initialize formData when modal opens (isOpen transitions to true)
  useEffect(() => {
    if (isOpen) {
      const initial = {};
      fields.forEach(f => {
        if (f.type === 'location_cascade') {
          initial.state = f.initialState || '';
          initial.city = f.initialCity || '';
          initial.village = f.initialVillage || '';
          initial.custom_village = f.initialCustomVillage || '';
          initial.pincode = f.initialPincode || '';
        } else {
          initial[f.key] = f.value !== undefined && f.value !== null ? f.value : '';
        }
      });
      setFormData(initial);
      setValidationError('');
    }
  }, [isOpen]);

  const handleSave = async () => {
    // Validate required fields
    for (const f of fields) {
      if (f.required) {
        if (f.type === 'location_cascade') {
          if (!formData.state || String(formData.state).trim() === '') {
            setValidationError('State is mandatory. Please select your State.');
            return;
          }
          if (!formData.city || String(formData.city).trim() === '') {
            setValidationError('City / District is mandatory. Please select your City.');
            return;
          }
        } else {
          if (!formData[f.key] || String(formData[f.key]).trim() === '') {
            setValidationError(`"${f.label.replace(/\*/g, '').trim()}" is mandatory and cannot be empty.`);
            return;
          }
        }
      }
    }
    setValidationError('');
    setSaving(true);
    await onSave(formData);
    setSaving(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 sm:p-8 overflow-y-auto max-h-[90vh]"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-extrabold text-gray-900">{title}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Fields marked with <span className="text-red-500 font-bold">*</span> are mandatory</p>
              </div>
              <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {validationError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-700 flex items-center gap-2">
                <span>⚠️</span>
                <span>{validationError}</span>
              </div>
            )}

            <div className="space-y-4">
              {fields.map((field) => (
                <div key={field.key}>
                  {field.type === 'location_cascade' ? (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-2">
                        <span className="text-sm">📍</span>
                        <span>State, City &amp; Village Jurisdiction</span>
                        {field.required && <span className="text-red-500 font-bold">*</span>}
                      </div>
                      <LocationCascadeSelector
                        state={formData.state}
                        city={formData.city}
                        village={formData.village || ''}
                        customVillage={formData.custom_village || ''}
                        pincode={formData.pincode}
                        showPincode={true}
                        showFullAddressPreview={true}
                        onLocationChange={(loc) => {
                          setFormData(prev => ({
                            ...prev,
                            state: loc.state,
                            city: loc.city,
                            village: loc.village,
                            custom_village: loc.customVillage,
                            pincode: loc.pincode,
                          }));
                        }}
                      />
                    </div>
                  ) : (
                    <>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
                        <span>{field.label}</span>
                        {field.required && <span className="text-red-500 font-bold">*</span>}
                      </label>
                      {field.type === 'textarea' ? (
                        <textarea
                          value={formData[field.key] || ''}
                          onChange={(e) => {
                            setValidationError('');
                            setFormData(prev => ({ ...prev, [field.key]: e.target.value }));
                          }}
                          placeholder={field.placeholder || ''}
                          rows={3}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-sm transition-shadow resize-none"
                        />
                      ) : field.type === 'select' ? (
                        <select
                          value={formData[field.key] || ''}
                          onChange={(e) => {
                            setValidationError('');
                            setFormData(prev => ({ ...prev, [field.key]: e.target.value }));
                          }}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-sm transition-shadow bg-white cursor-pointer"
                        >
                          <option value="">Select...</option>
                          {field.options?.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={field.type || 'text'}
                          value={formData[field.key] || ''}
                          onChange={(e) => {
                            setValidationError('');
                            setFormData(prev => ({ ...prev, [field.key]: e.target.value }));
                          }}
                          placeholder={field.placeholder || ''}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-sm transition-shadow"
                        />
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-6 flex gap-3">
              <button onClick={onClose} className="flex-1 px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors text-sm cursor-pointer">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-5 py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-brand-500/25 flex items-center justify-center text-sm cursor-pointer"
              >
                {saving ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : 'Save Changes'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default function ProfilePage() {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const router = useRouter();
  const [profileData, setProfileData] = useState(null);
  const [completionPercent, setCompletionPercent] = useState(0);
  const [yearJoined, setYearJoined] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Edit modal states
  const [editSection, setEditSection] = useState(null); // 'basic' | 'business' | 'more' | 'sourcing'

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [authLoading, user, router]);

  // Fetch profile data
  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard/profile');
      if (res.ok) {
        const data = await res.json();
        setProfileData(data.profile);
        setCompletionPercent(data.completionPercent);
        setYearJoined(data.yearJoined);
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchProfile();
  }, [user, fetchProfile]);

  // Save handler
  const handleSave = async (data) => {
    try {
      const res = await fetch('/api/dashboard/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        await fetchProfile(); // Refresh local data
        if (refreshProfile) refreshProfile(); // Refresh global auth profile
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
    }
  };

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

  if (isLoading) {
    return (
      <main className="flex-1 pt-24 pb-16 bg-surface-elevated min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loading profile...</p>
        </div>
      </main>
    );
  }

  const p = profileData || profile || {};
  const displayName = p.full_name || p.company_name || user?.user_metadata?.full_name || 'User';
  const maskedEmail = user?.email ? user.email.replace(/(.{3}).+(@.+)/, '$1***$2') : '';
  const memberId = p.display_id || 'Not assigned';
  const avatarInitial = displayName.charAt(0).toUpperCase();

  // Section completion calculations
  const basicCompletion = getCompletionStatus([p.company_name, p.full_name || user?.user_metadata?.full_name, user?.email, p.phone_number]);
  const businessCompletion = getCompletionStatus([p.role, p.company_name, p.warehouse_address || (p.city && p.state), p.job_title, p.website]);
  const moreCompletion = getCompletionStatus([p.year_established, p.total_employees, p.about_us]);
  const sourcingCompletion = getCompletionStatus([p.categories?.length > 0 ? 'yes' : '', p.sourcing_frequency, p.annual_spending]);

  return (
    <>
      {/* ── Edit Modals ── */}
      <InlineEditModal
        isOpen={editSection === 'basic'}
        onClose={() => setEditSection(null)}
        title="Edit Basic Information"
        fields={[
          { key: 'company_name', label: 'Company / Business Name', required: true, value: p.company_name, placeholder: 'Enter registered company name' },
          { key: 'full_name', label: 'Contact Person Full Name', required: true, value: p.full_name || user?.user_metadata?.full_name, placeholder: 'Your full name' },
          { key: 'phone_number', label: 'Phone Number', required: true, type: 'tel', value: p.phone_number, placeholder: '+91 98765 43210' },
        ]}
        onSave={handleSave}
      />

      <InlineEditModal
        isOpen={editSection === 'business'}
        onClose={() => setEditSection(null)}
        title="Edit Business Information"
        fields={[
          { key: 'company_name', label: 'Company Name', required: true, value: p.company_name, placeholder: 'Enter registered company name' },
          { key: 'job_title', label: 'Job Title', value: p.job_title, placeholder: 'e.g. Procurement Manager' },
          { key: 'website', label: 'Website', type: 'url', value: p.website, placeholder: 'https://example.com' },
          {
            key: 'location_cascade',
            label: 'Location Jurisdiction',
            required: true,
            type: 'location_cascade',
            initialState: p.state || '',
            initialCity: p.city || '',
            initialVillage: p.village || '',
            initialCustomVillage: p.custom_village || '',
            initialPincode: p.pincode || '',
          },
          { key: 'warehouse_address', label: 'Building / Plot / Street Address', required: true, value: p.warehouse_address, placeholder: 'Plot No., Industrial Area, Landmark...' },
          { key: 'gst_number', label: 'GST Number', value: p.gst_number, placeholder: '27AADCB2230M1Z2' },
        ]}
        onSave={handleSave}
      />

      <InlineEditModal
        isOpen={editSection === 'more'}
        onClose={() => setEditSection(null)}
        title="Edit Additional Information"
        fields={[
          { key: 'year_established', label: 'Year Established', type: 'number', value: p.year_established, placeholder: 'e.g. 2010' },
          { key: 'total_employees', label: 'Total Number of Employees', type: 'select', value: p.total_employees, options: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'] },
          { key: 'about_us', label: 'About Us', type: 'textarea', value: p.about_us, placeholder: 'Tell suppliers about your business...' },
        ]}
        onSave={handleSave}
      />

      <InlineEditModal
        isOpen={editSection === 'sourcing'}
        onClose={() => setEditSection(null)}
        title="Edit Sourcing Preferences"
        fields={[
          { key: 'sourcing_frequency', label: 'Sourcing Frequency', type: 'select', value: p.sourcing_frequency, options: ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annually', 'As Needed'] },
          { key: 'annual_spending', label: 'Annual Spending', type: 'select', value: p.annual_spending, options: ['Below ₹1 Lakh', '₹1-5 Lakhs', '₹5-25 Lakhs', '₹25-100 Lakhs', '₹1-10 Crores', 'Above ₹10 Crores'] },
        ]}
        onSave={handleSave}
      />

      <main className="flex-1 pt-24 pb-16 bg-surface-elevated min-h-screen">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* ── Page Header ── */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <Breadcrumbs
                items={[
                  { label: 'Dashboard', href: '/dashboard' },
                  { label: 'My Profile' }
                ]}
                className="mb-1.5"
              />
              <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">My Profile</h1>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ═══ LEFT: Profile Preview Card ═══ */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-28"
              >
                {/* Avatar & Name Header */}
                <div className="bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 p-6 text-center relative overflow-hidden">
                  {/* Decorative circles */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

                  <div className="relative z-10">
                    {p.company_logo_url ? (
                      <img src={p.company_logo_url} alt={displayName} className="w-20 h-20 rounded-full mx-auto border-4 border-white/30 shadow-xl object-cover" />
                    ) : (
                      <div className="w-20 h-20 rounded-full mx-auto border-4 border-white/30 shadow-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-3xl font-bold">
                        {avatarInitial}
                      </div>
                    )}
                    <h2 className="text-white font-bold text-lg mt-3">{displayName}</h2>
                    <span className={`inline-block mt-1.5 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      p.role === 'supplier' ? 'bg-orange-400/20 text-orange-100' :
                      p.role === 'admin' ? 'bg-purple-400/20 text-purple-100' :
                      p.role === 'both' ? 'bg-indigo-400/20 text-indigo-100' :
                      'bg-white/20 text-white/90'
                    }`}>
                      {p.role === 'both' ? 'Trade Partner (Buyer & Supplier)' : (p.role || 'Trade Partner')}
                    </span>
                  </div>
                </div>

                {/* Profile Details */}
                <div className="p-5 space-y-3.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400 font-medium">Member ID</span>
                    <span className="font-bold text-gray-900 font-mono text-xs bg-gray-50 px-2 py-0.5 rounded">{memberId}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400 font-medium">Country</span>
                    <span className="font-semibold text-gray-900 flex items-center gap-1.5">
                      <span className="text-base">🇮🇳</span> IN
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400 font-medium">Year Joined</span>
                    <span className="font-semibold text-gray-900">{yearJoined || new Date().getFullYear()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400 font-medium">Email</span>
                    <span className="font-semibold text-gray-900">{maskedEmail}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400 font-medium">Phone</span>
                    <span className={`font-semibold ${p.phone_number ? 'text-gray-900' : 'text-amber-500 italic'}`}>
                      {p.phone_number || 'No phone number'}
                    </span>
                  </div>
                </div>

                {/* Completion Progress */}
                <div className="px-5 pb-5">
                  <div className="bg-gradient-to-r from-brand-50 to-blue-50 rounded-xl p-4 border border-brand-100/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-brand-800">Profile Completion</span>
                      <span className="text-xs font-extrabold text-brand-600">{completionPercent}%</span>
                    </div>
                    <div className="w-full h-2 bg-brand-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${completionPercent}%` }}
                        transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                        className="h-full bg-gradient-to-r from-brand-500 to-brand-600 rounded-full"
                      />
                    </div>
                    {completionPercent < 100 && (
                      <p className="text-[10px] text-brand-600/70 mt-2">Complete your profile to get more tailored quotations.</p>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="px-5 pb-5 space-y-2">
                  {(user?.email?.toLowerCase() === 'rsevmail@gmail.com' && p.role === 'admin') && (
                    <Link
                      href="/admin/dashboard"
                      className="block w-full text-center py-2.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-purple-600/20"
                    >
                      🛡️ Open Admin Panel
                    </Link>
                  )}
                  <Link
                    href="/dashboard"
                    className="block w-full text-center py-2.5 px-4 bg-gray-900 hover:bg-black text-white text-sm font-semibold rounded-xl transition-colors"
                  >
                    ← Back to Dashboard
                  </Link>
                </div>
              </motion.div>
            </div>

            {/* ═══ RIGHT: Profile Sections ═══ */}
            <div className="lg:col-span-2 space-y-6">

              {/* Basic Information */}
              <SectionCard
                title="Basic Information"
                completionStatus={basicCompletion}
                onEdit={() => setEditSection('basic')}
              >
                <ProfileField label="Full Name" value={p.full_name || user?.user_metadata?.full_name} isIncomplete={!p.full_name && !user?.user_metadata?.full_name} />
                <ProfileField label="Company Name" value={p.company_name} isIncomplete={!p.company_name} />
                <ProfileField label="Email" value={user?.email} isIncomplete={false} />
                <ProfileField label="Phone Number" value={p.phone_number} isIncomplete={!p.phone_number} />
              </SectionCard>

              {/* Business Information */}
              <SectionCard
                title="Business Information"
                subtitle="Complete this section to let suppliers know you better. You'll get more tailored quotations and communicate more efficiently with suppliers."
                completionStatus={businessCompletion}
                onEdit={() => setEditSection('business')}
              >
                <ProfileField label="Business Type" value={p.role === 'both' ? 'Trade Partner (Buyer & Supplier)' : p.role ? p.role.charAt(0).toUpperCase() + p.role.slice(1) : 'Trade Partner (Buyer & Supplier)'} isIncomplete={!p.role} />
                <ProfileField label="Company Name" value={p.company_name} isIncomplete={!p.company_name} />
                <ProfileField label="GST Number" value={p.gst_number} isIncomplete={!p.gst_number} />
                <ProfileField
                  label="Address"
                  value={[p.warehouse_address, p.city, p.state, p.pincode].filter(Boolean).join(', ') || null}
                  isIncomplete={!p.city && !p.state && !p.warehouse_address}
                />
                <ProfileField label="Job Title" value={p.job_title} isIncomplete={!p.job_title} />
                <ProfileField label="Website" value={p.website} isIncomplete={!p.website} />
              </SectionCard>

              {/* More Information */}
              <SectionCard
                title="More Information"
                subtitle="Complete this section to let suppliers know you better. You'll get more tailored quotations and communicate more efficiently with suppliers."
                completionStatus={moreCompletion}
                onEdit={() => setEditSection('more')}
              >
                <ProfileField label="Year Established" value={p.year_established} isIncomplete={!p.year_established} />
                <ProfileField label="Total Employees" value={p.total_employees} isIncomplete={!p.total_employees} />
                <ProfileField
                  label="About Us"
                  value={p.about_us ? (p.about_us.length > 60 ? p.about_us.substring(0, 60) + '...' : p.about_us) : null}
                  isIncomplete={!p.about_us}
                />
              </SectionCard>

              {/* Sourcing Preferences */}
              <SectionCard
                title="Sourcing Preferences"
                subtitle="Complete this section to see product suggestions tailored to your needs."
                completionStatus={sourcingCompletion}
                onEdit={() => setEditSection('sourcing')}
              >
                <ProfileField
                  label="Industry Preferences"
                  value={p.categories?.length > 0 ? p.categories.join(', ') : null}
                  isIncomplete={!p.categories || p.categories.length === 0}
                />
                <ProfileField label="Sourcing Frequency" value={p.sourcing_frequency} isIncomplete={!p.sourcing_frequency} />
                <ProfileField label="Annual Spending" value={p.annual_spending} isIncomplete={!p.annual_spending} />
              </SectionCard>

            </div>
          </div>
        </div>
      </main>
    </>
  );
}
