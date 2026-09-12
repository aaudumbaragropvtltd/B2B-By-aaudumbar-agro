import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LocationCascadeSelector from '@/components/LocationCascadeSelector';

export default function EditProfileModal({ isOpen, onClose, profile, onProfileUpdated, initialSection = 'basic' }) {
  const [activeSection, setActiveSection] = useState(initialSection);
  const [formData, setFormData] = useState({
    company_name: '',
    role: 'buyer',
    gst_number: '',
    pan_number: '',
    phone_number: '',
    whatsapp_number: '',
    company_logo_url: '',
    full_name: '',
    job_title: '',
    website: '',
    about_us: '',
    year_established: '',
    total_employees: '',
    annual_turnover_lakhs: '',
    categories: '',
    warehouse_address: '',
    city: '',
    state: '',
    village: '',
    custom_village: '',
    pincode: '',
    sourcing_frequency: '',
    annual_spending: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    if (initialSection) {
      setActiveSection(initialSection);
    }
  }, [initialSection, isOpen]);

  useEffect(() => {
    if (profile) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        company_name: profile.company_name || '',
        role: profile.role || 'buyer',
        gst_number: profile.gst_number || '',
        pan_number: profile.pan_number || '',
        phone_number: profile.phone_number || profile.corporate_phone || '',
        whatsapp_number: profile.whatsapp_number || '',
        company_logo_url: profile.company_logo_url || '',
        full_name: profile.full_name || '',
        job_title: profile.job_title || '',
        website: profile.website || '',
        about_us: profile.about_us || '',
        year_established: profile.year_established || '',
        total_employees: profile.total_employees || '',
        annual_turnover_lakhs: profile.annual_turnover_lakhs || '',
        categories: Array.isArray(profile.categories) ? profile.categories.join(', ') : (profile.categories || ''),
        warehouse_address: profile.warehouse_address || '',
        city: profile.city || '',
        state: profile.state || '',
        village: profile.village || '',
        custom_village: profile.custom_village || '',
        pincode: profile.pincode || '',
        sourcing_frequency: profile.sourcing_frequency || '',
        annual_spending: profile.annual_spending || '',
      });
    }
  }, [profile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      const { createClient } = await import('@/services/supabase');
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      // Ensure village / custom_village is attached to warehouse address if not already present
      const payload = { ...formData };
      const villageVal = formData.custom_village || formData.village;
      if (villageVal && villageVal !== 'Other' && villageVal !== '-- Select Village / Taluka --') {
        if (payload.warehouse_address) {
          if (!payload.warehouse_address.includes(villageVal)) {
            payload.warehouse_address = `${payload.warehouse_address}, ${villageVal}`;
          }
        } else {
          payload.warehouse_address = villageVal;
        }
      }

      // Use API route for extended fields
      const res = await fetch('/api/dashboard/profile', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Failed to update profile in database');
      }
      
      setSuccessMsg('Profile updated and saved to database successfully!');
      setTimeout(() => {
        if (onProfileUpdated) onProfileUpdated(resData.profile || { ...profile, ...payload });
        onClose();
      }, 700);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const sections = [
    { key: 'business', label: 'Company Profile', icon: '🏢' },
    { key: 'basic', label: 'Personal Information', icon: '👤' },
    { key: 'more', label: 'Company Details', icon: '📋' },
    { key: 'sourcing', label: 'Sourcing Preferences', icon: '🎯' },
  ];

  const renderField = (label, name, type = 'text', placeholder = '', options = null) => (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
      {type === 'textarea' ? (
        <textarea
          name={name}
          value={formData[name] || ''}
          onChange={handleChange}
          placeholder={placeholder}
          rows={3}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-sm transition-shadow resize-none"
        />
      ) : type === 'select' ? (
        <select
          name={name}
          value={formData[name] || ''}
          onChange={handleChange}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-sm transition-shadow bg-white"
        >
          <option value="">Select...</option>
          {options?.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          name={name}
          value={formData[name] || ''}
          onChange={handleChange}
          className={`w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-sm transition-shadow ${type === 'text' && name === 'gst_number' ? 'uppercase placeholder:normal-case' : ''}`}
          placeholder={placeholder}
        />
      )}
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 transition-opacity bg-slate-900/50 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            className="relative flex flex-col w-full max-w-2xl bg-white shadow-2xl rounded-3xl max-h-[88vh] h-auto overflow-hidden text-left z-10"
          >
            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between px-6 sm:px-8 pt-5 pb-3 border-b border-gray-100 bg-white">
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-gray-900">Edit Profile</h3>
                <p className="text-xs text-gray-500 mt-0.5">Manage your company profile and business details</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-sm shadow-brand-500/20 cursor-pointer"
                >
                  {isSubmitting ? (
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span>💾 Save</span>
                  )}
                </button>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Section Tabs */}
            <div className="flex-shrink-0 flex border-b border-gray-100 px-6 sm:px-8 overflow-x-auto no-scrollbar bg-gray-50/50">
              {sections.map(s => (
                <button
                  key={s.key}
                  onClick={() => setActiveSection(s.key)}
                  className={`py-3 px-3 text-xs sm:text-sm font-semibold transition-colors relative whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                    activeSection === s.key ? 'text-brand-600 font-bold' : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <span className="text-xs">{s.icon}</span>
                  {s.label}
                  {activeSection === s.key && (
                    <motion.div layoutId="editTabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600" />
                  )}
                </button>
              ))}
            </div>

            {/* Messages */}
            {error && (
              <div className="flex-shrink-0 mx-6 sm:mx-8 mt-3 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {error}
              </div>
            )}
            {successMsg && (
              <div className="flex-shrink-0 mx-6 sm:mx-8 mt-3 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                {successMsg}
              </div>
            )}

            {/* Form Content (scrollable with min-h-0) */}
            <form onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-y-auto px-6 sm:px-8 py-5">
              <div className="space-y-5">
                {activeSection === 'basic' && (
                  <>
                    <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 mb-2">
                      <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <span>👤</span> Primary Identity &amp; Credentials
                      </div>
                      <p className="text-[11px] text-slate-500">
                        These credentials represent your personal identity across the B2B Bharat network.
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                      <div>
                        <div className="text-slate-400 font-bold text-[10px] uppercase">Registered Email (Login ID)</div>
                        <div className="text-xs font-mono font-bold text-slate-900 mt-0.5">
                          {profile?.registered_email || profile?.email || 'Registered User'}
                        </div>
                      </div>
                      <span className="text-emerald-700 bg-emerald-100 border border-emerald-300 text-[10px] px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
                        <span>✓</span> Verified Login
                      </span>
                    </div>

                    {renderField('Full Name (Contact Person)', 'full_name', 'text', 'Enter your full personal name')}
                    {renderField('Designation / Job Title', 'job_title', 'text', 'e.g. CEO, Managing Director, Procurement Head')}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {renderField('Contact Phone / Mobile', 'phone_number', 'tel', '+91 9405912371')}
                      {renderField('WhatsApp Number', 'whatsapp_number', 'tel', '+91 9405912371')}
                    </div>
                    <div className="pt-2 flex justify-end">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        💾 Save Personal Details
                      </button>
                    </div>
                  </>
                )}

                {activeSection === 'business' && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {renderField('Company / Enterprise Name', 'company_name', 'text', 'Enter your registered company name')}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Business Type</label>
                        <select
                          name="role"
                          value={formData.role || 'buyer'}
                          onChange={handleChange}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-sm transition-shadow bg-white font-medium text-slate-800"
                        >
                          <option value="buyer">Buyer (Sourcing &amp; Procurement)</option>
                          <option value="supplier">Supplier (Manufacturer &amp; Wholesaler)</option>
                          <option value="both">Both (Trade Partner — Buyer &amp; Supplier)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {renderField('GST / Tax ID', 'gst_number', 'text', 'e.g. 29AABCI6363G1ZF')}
                      {renderField('PAN Number', 'pan_number', 'text', 'e.g. 29AABCI6363G')}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {renderField('Official Website', 'website', 'url', 'https://example.com')}
                      {renderField('Annual Turnover (Lakhs INR)', 'annual_turnover_lakhs', 'number', 'e.g. 50')}
                    </div>

                    {renderField('Business Categories / Sectors', 'categories', 'text', 'e.g. Food & Agriculture, Agro, Textiles')}

                    <div className="p-4 bg-gray-50/90 rounded-2xl border border-gray-200 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-800 uppercase tracking-wider border-b border-gray-200 pb-2">
                        <span className="text-sm">🏢</span>
                        <span>Business Location &amp; Jurisdiction</span>
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

                      {renderField('Plot / Street / Landmark Address', 'warehouse_address', 'text', 'e.g. Plot No. 45, MIDC Industrial Area')}
                    </div>

                    {/* Prominent in-form Save button for Business Tab */}
                    <div className="pt-2 flex items-center justify-end">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full sm:w-auto px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl transition-all shadow-md shadow-brand-500/25 flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer"
                      >
                        {isSubmitting ? (
                          <>
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Saving Business Details...</span>
                          </>
                        ) : (
                          <>
                            <span>💾</span>
                            <span>Save Business Details</span>
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}

                {activeSection === 'more' && (
                  <>
                    {renderField('Year Established', 'year_established', 'number', 'e.g. 2010')}
                    {renderField('Total Employees', 'total_employees', 'select', '', ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'])}
                    {renderField('About Us', 'about_us', 'textarea', 'Tell suppliers about your business, products, and capabilities...')}
                    <div className="pt-2 flex justify-end">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                      >
                        💾 Save Details
                      </button>
                    </div>
                  </>
                )}

                {activeSection === 'sourcing' && (
                  <>
                    {renderField('Sourcing Frequency', 'sourcing_frequency', 'select', '', ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annually', 'As Needed'])}
                    {renderField('Annual Spending', 'annual_spending', 'select', '', ['Below ₹1 Lakh', '₹1-5 Lakhs', '₹5-25 Lakhs', '₹25-100 Lakhs', '₹1-10 Crores', 'Above ₹10 Crores'])}
                    <div className="pt-2 flex justify-end">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                      >
                        💾 Save Preferences
                      </button>
                    </div>
                  </>
                )}
              </div>
            </form>

            {/* Footer Actions (Permanently pinned at bottom) */}
            <div className="flex-shrink-0 px-6 sm:px-8 py-3.5 border-t border-gray-100 flex items-center justify-between gap-3 bg-gray-50/95 backdrop-blur-sm z-10">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors text-xs sm:text-sm cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl transition-all shadow-md shadow-brand-500/25 flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <span>💾</span>
                    <span>Save {activeSection === 'business' ? 'Business Details' : activeSection === 'basic' ? 'Basic Info' : activeSection === 'more' ? 'Company Details' : 'Preferences'}</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
