"use client";
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CommodityImage from '@/components/CommodityImage';

export default function MasterDashboardSettings() {
  const [activeTab, setActiveTab] = useState('profile');
  const [email, setEmail] = useState('raghavendra@b2b.internal');
  const [password, setPassword] = useState('••••••••••••');
  const [isEditingEmail, setIsEditingEmail] = useState(false);

  // High-fidelity local state mocking Alibaba's specific profile tracking vectors
  const profileMetrics = {
    verificationStatus: "IN_REVIEW",
    submittedDate: "June 28, 2026",
    promotionCode: "BHARAT_BULK_I10",
    browsingHistory: [
      { id: 1, name: "Organic Bulk Turmeric", category: "SPICES" },
      { id: 2, name: "Premium Long-Staple Cotton", category: "TEXTILES" }
    ],
    favorites: [
      { id: 3, name: "Industrial Quartz Crystals", category: "MINERALS" }
    ]
  };

  return (
    <div className="min-h-screen bg-[#05070f] text-white p-4 md:p-8 pt-24 flex gap-6 max-w-7xl mx-auto">
      
      {/* LEFT SIDEBAR NAVIGATION */}
      <div className="w-1/4 bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-xl h-fit space-y-2">
        <div className="pb-4 mb-4 border-b border-slate-800">
          <h3 className="font-bold text-slate-200 text-sm tracking-wide uppercase">Workspace Command</h3>
          <p className="text-xs text-slate-500 mt-1">ID: b2b-commodity-node</p>
        </div>
        {[
          { id: 'profile', label: 'Account & Security' },
          { id: 'history', label: 'Browsing & Favorites' },
          { id: 'messages', label: 'Alibaba Broadcast Hub' },
          { id: 'inspiration', label: 'Product Inspiration' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab.id 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* RIGHT DISPLAY PANEL */}
      <div className="flex-1 bg-slate-900/20 border border-slate-800/60 rounded-3xl p-8 backdrop-blur-xl min-h-[60vh] flex flex-col justify-between">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="space-y-6"
          >
            {/* TAB 1: PROFILE MANAGEMENT & SECURITY */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold tracking-tight">Account Parameters & Security</h2>
                  <p className="text-xs text-slate-400 mt-1">Modify your communication endpoints and review system clearance.</p>
                </div>

                {/* Verification Status Card */}
                <div className="p-4 bg-amber-950/20 border border-amber-900/40 rounded-2xl flex justify-between items-center">
                  <div>
                    <div className="text-xs font-mono text-amber-400 tracking-wider uppercase font-bold">Verification Node Status</div>
                    <div className="text-sm text-slate-300 mt-1">Your corporate GSTIN compliance profile is under validation.</div>
                  </div>
                  <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-xs px-3 py-1 rounded-full font-bold animate-pulse">
                    {profileMetrics.verificationStatus}
                  </span>
                </div>

                {/* Email Modifier Block */}
                <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-5 space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <label className="text-xs font-mono text-slate-500 uppercase">Registered Corporate Email</label>
                      <div className="text-sm font-medium mt-1">{email}</div>
                    </div>
                    <button 
                      onClick={() => setIsEditingEmail(!isEditingEmail)}
                      className="text-xs text-indigo-400 hover:underline font-semibold"
                    >
                      {isEditingEmail ? "Lock" : "Change Destination"}
                    </button>
                  </div>
                  {isEditingEmail && (
                    <input 
                      type="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  )}

                  <div className="flex justify-between items-center pt-4 border-t border-slate-900">
                    <div>
                      <label className="text-xs font-mono text-slate-500 uppercase">Cryptographic Password Token</label>
                      <div className="text-sm font-medium mt-1">{password}</div>
                    </div>
                    <button 
                      onClick={() => setPassword(password === '••••••••••••' ? 'B2BBharatPass2026!' : '••••••••••••')}
                      className="text-xs text-indigo-400 hover:underline font-semibold"
                    >
                      Reveal Plaintext
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: BROWSING HISTORY & FAVORITES */}
            {activeTab === 'history' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold tracking-tight">Sourcing Footprint Tracking</h2>
                  <p className="text-xs text-slate-400 mt-1">Review your recent exploration logs and bookmarked raw cargo matrix nodes.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-xs font-mono text-slate-500 uppercase mb-3">Browsing History Logs</h3>
                    <div className="space-y-3">
                      {profileMetrics.browsingHistory.map(item => (
                        <div key={item.id} className="bg-slate-950/30 border border-slate-800 rounded-xl p-3 flex gap-3 items-center">
                          <CommodityImage category={item.category} className="h-10 w-10 text-[8px]" />
                          <span className="text-xs font-medium text-slate-200 truncate">{item.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-mono text-slate-500 uppercase mb-3">Bookmarked Favorites</h3>
                    <div className="space-y-3">
                      {profileMetrics.favorites.map(item => (
                        <div key={item.id} className="bg-slate-950/30 border border-slate-800 rounded-xl p-3 flex gap-3 items-center">
                          <CommodityImage category={item.category} className="h-10 w-10 text-[8px]" />
                          <span className="text-xs font-medium text-slate-200 truncate">{item.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: ALIBABA BROADCAST COMMUNICATIONS */}
            {activeTab === 'messages' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold tracking-tight">System Message Center</h2>
                  <p className="text-xs text-slate-400 mt-1">Inbound transactional updates broadcasted directly from verification arrays.</p>
                </div>

                <div className="bg-slate-950/50 border border-slate-800 rounded-2xl overflow-hidden">
                  <div className="bg-slate-900 px-4 py-3 flex justify-between items-center border-b border-slate-800">
                    <span className="text-xs font-bold text-indigo-400">System Dispatcher: Alibaba.com Global Support</span>
                    <span className="text-[10px] font-mono text-slate-500">2026-06-29</span>
                  </div>
                  <div className="p-4 text-sm text-slate-300 leading-relaxed font-sans">
                    Welcome to the global trading gateway. Your account deployment has successfully synced with the b2b-commodity architecture network matrix. All features, secure ledger validations, and free-tier Gemini multi-agent call-triage mechanisms are verified online. Proceed with bulk quotation routing.
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: PRODUCT INSPIRATION & PROMOTIONS */}
            {activeTab === 'inspiration' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold tracking-tight">Sourcing Inspiration & Active Promotions</h2>
                  <p className="text-xs text-slate-400 mt-1">Cross-industry arbitrage suggestions mapped completely local to save bandwidth.</p>
                </div>

                <div className="p-5 bg-gradient-to-r from-indigo-950/40 to-slate-950 border border-indigo-900/40 rounded-2xl">
                  <div className="text-xs font-mono text-indigo-400 uppercase font-bold tracking-wider">Active Platform Voucher Code</div>
                  <div className="text-2xl font-black tracking-wide text-white mt-2">{profileMetrics.promotionCode}</div>
                  <p className="text-xs text-slate-400 mt-1">Applies custom platform fee discount thresholds across spatial routing loops automatically.</p>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
