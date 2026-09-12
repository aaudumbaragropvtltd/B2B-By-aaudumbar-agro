"use client";

import React from 'react';
import SupportChatPanel from '@/components/SupportChatPanel';

export default function DashboardSupportPage() {
  return (
    <div className="min-h-screen bg-[#05070f] text-white p-3 sm:p-4 md:p-8 pt-20 sm:pt-24">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-400">
              <span>Partner Triage Desk</span>
              <span>•</span>
              <span>Support Assistant Active</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1">
              Autonomous Support & Escrow Assistance
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Real-time resolutions for escrow clearance, delivery status, gate passes, and supplier contracts.
            </p>
          </div>
        </div>

        {/* Support Chat Panel */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-4 sm:p-6 backdrop-blur-xl">
          <SupportChatPanel isDashboard={true} />
        </div>

      </div>
    </div>
  );
}
