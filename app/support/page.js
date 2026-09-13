"use client";

import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SupportChatPanel from '@/components/SupportChatPanel';

export default function PublicSupportPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 pt-20 sm:pt-28 pb-16 sm:pb-20 px-3 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-6">

          {/* Page Header */}
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-600">
              <span>B2B India Customer Care</span>
              <span>•</span>
              <span>24/7 Support Assistant</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-1">
              Enterprise Support & Concierge Desk
            </h1>
            <p className="text-slate-500 text-sm mt-1 max-w-2xl">
              Get instant answers on 10% escrow security, gate pass logistics, quotation requests, and live order tracking.
            </p>
          </div>

          {/* Support Panel Component */}
          <SupportChatPanel isDashboard={false} />

        </div>
      </main>

      <Footer />
    </div>
  );
}
