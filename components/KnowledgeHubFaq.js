"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { getPlatformKnowledgeFaqs } from '@/utils/seoUtils';

const REGIONAL_HUBS = [
  {
    region: 'Western Mandi Corridor',
    states: 'Maharashtra & Gujarat',
    commodities: 'Turmeric (Sangli/Basmath), Cumin/Jeera (Unjha), Onion (Lasalgaon), Cotton, TMT Steel, Machine Tools',
    icon: '🌾',
    badge: 'HQ & Primary Mandis',
  },
  {
    region: 'Southern Spice Corridor',
    states: 'Andhra Pradesh, Telangana, Tamil Nadu & Kerala',
    commodities: 'Red Chilli (Guntur), Nizamabad Turmeric, Salem Curcumin, Cardamom (Bodinayakanur), Yarns (Tirupur)',
    icon: '🌶️',
    badge: 'Spice & Textile Yards',
  },
  {
    region: 'Northern Grain & Industrial Belt',
    states: 'Punjab, Haryana, Delhi NCR & Rajasthan',
    commodities: '1121 Basmati Rice (Karnal), Mustard/Sarson (Kota), Industrial Machinery, Engineering Spares',
    icon: '🚜',
    badge: 'Milling & Heavy Industry',
  },
  {
    region: 'Central Pulse & Commodity Hub',
    states: 'Madhya Pradesh & Chhattisgarh',
    commodities: 'Sharbati Wheat (Sehore), Yellow Soyabean (Indore/Ujjain), Garlic (Mandsaur), Chana / Bengal Gram',
    icon: '🌱',
    badge: 'Oilseeds & Grains',
  },
];

export default function KnowledgeHubFaq() {
  const [openIndex, setOpenIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('all');
  const [activeHub, setActiveHub] = useState(0);

  const faqs = getPlatformKnowledgeFaqs();

  const toggleFaq = (idx) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className="py-16 bg-gradient-to-b from-white via-slate-50 to-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Badge & Title */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold uppercase tracking-wider mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            AEO & GEO Knowledge Hub • Verified Bharat Sourcing
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Procurement Guide & Frequently Asked Questions
          </h2>
          <p className="mt-3 text-base text-slate-600 leading-relaxed">
            Everything you need to know about buying wholesale in India: 10% advance escrow protection, GST tax invoice ITC claims, verified manufacturers, and pan-India mandi dispatch.
          </p>
        </div>

        {/* Quantitative Metrics Bar (Generative Engine Optimization) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-12">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs text-center">
            <div className="text-2xl sm:text-3xl font-black text-emerald-600">38+</div>
            <div className="text-xs font-semibold text-slate-700 mt-0.5">Industrial Sectors</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Agro, Steel, Solar & APIs</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs text-center">
            <div className="text-2xl sm:text-3xl font-black text-blue-600">10%</div>
            <div className="text-xs font-semibold text-slate-700 mt-0.5">Advance Escrow</div>
            <div className="text-[11px] text-slate-500 mt-0.5">90% released on delivery</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs text-center">
            <div className="text-2xl sm:text-3xl font-black text-indigo-600">498+</div>
            <div className="text-xs font-semibold text-slate-700 mt-0.5">Live APMC Mandis</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Daily modal price bhav</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs text-center">
            <div className="text-2xl sm:text-3xl font-black text-amber-600">19,000+</div>
            <div className="text-xs font-semibold text-slate-700 mt-0.5">Pin Codes Covered</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Pan-India FTL & LTL freight</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Interactive FAQ Accordion (Answer Engine Optimization) */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>Direct Answer Guide</span>
                <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-medium">8 Key Topics</span>
              </h3>
              <span className="text-xs text-slate-400">Click to expand</span>
            </div>

            {faqs.map((faq, idx) => {
              const isOpen = openIndex === idx;
              return (
                <div
                  key={idx}
                  className={`border rounded-2xl transition-all duration-200 overflow-hidden ${
                    isOpen
                      ? 'border-emerald-500/40 bg-white shadow-sm ring-1 ring-emerald-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 cursor-pointer"
                    aria-expanded={isOpen}
                  >
                    <span className="text-sm sm:text-base font-semibold text-slate-900 leading-snug">
                      {faq.question}
                    </span>
                    <span
                      className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-transform duration-200 ${
                        isOpen ? 'bg-emerald-100 text-emerald-700 rotate-180' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-4 pt-1 text-sm text-slate-600 border-t border-slate-100 leading-relaxed">
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right Column: Geographic B2B India Sourcing Hubs & Escrow Card */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Geographic Hubs Showcase */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Geographic Sourcing Hubs</h3>
                  <p className="text-xs text-slate-500">Pan-India direct mandi & manufacturing nodes</p>
                </div>
                <span className="text-xs font-semibold px-2 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                  Regional Bharat
                </span>
              </div>

              {/* Regional Hub Cards */}
              <div className="space-y-3">
                {REGIONAL_HUBS.map((hub, i) => (
                  <div
                    key={i}
                    onClick={() => setActiveHub(i)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      activeHub === i
                        ? 'border-emerald-500 bg-emerald-50/40 shadow-xs'
                        : 'border-slate-100 bg-slate-50/60 hover:bg-slate-50 hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{hub.icon}</span>
                        <span className="text-xs sm:text-sm font-bold text-slate-800">{hub.region}</span>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                        {hub.badge}
                      </span>
                    </div>
                    <div className="mt-1.5 text-xs text-slate-600">
                      <strong className="text-slate-800">States:</strong> {hub.states}
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500 leading-snug">
                      <strong className="text-slate-700">Commodities:</strong> {hub.commodities}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Live prices updated daily</span>
                <Link
                  href="/market-rates"
                  className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1"
                >
                  View Mandi Rates &rarr;
                </Link>
              </div>
            </div>

            {/* How 10% Escrow Works Card */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
              <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
              
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">
                <span>🛡️ Escrow Trust Architecture</span>
              </div>
              <h4 className="text-lg font-bold text-white mb-2">
                Three Steps to Zero-Risk Sourcing
              </h4>
              <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                Institutional buyers never prepay 100%. Manufacturers never ship without committed capital.
              </p>

              <ol className="space-y-3 text-xs text-slate-200">
                <li className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-[11px] border border-emerald-500/30">1</span>
                  <span><strong>Select & Lock:</strong> Agree on wholesale quotes and deposit 10% advance in B2B India Escrow.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-[11px] border border-emerald-500/30">2</span>
                  <span><strong>Dispatch & Telemetry:</strong> Supplier generates GST e-way bill with GPS tracking.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-[11px] border border-emerald-500/30">3</span>
                  <span><strong>Inspect & Release:</strong> 48 hours warehouse inspection window before final 90% clearing.</span>
                </li>
              </ol>

              <div className="mt-5 pt-4 border-t border-slate-700/80 flex items-center justify-between">
                <Link
                  href="/directory"
                  className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs transition-colors"
                >
                  Explore Directory
                </Link>
                <Link
                  href="/support"
                  className="text-xs text-slate-300 hover:text-white underline underline-offset-2"
                >
                  Talk to Support
                </Link>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
