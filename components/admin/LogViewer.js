"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function LogViewer() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState('ALL');
  const [selectedService, setSelectedService] = useState('ALL');
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let url = '/api/admin/logs?limit=100';
      if (selectedLevel !== 'ALL') url += `&level=${selectedLevel}`;
      if (selectedService !== 'ALL') url += `&service=${selectedService}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.logs) setLogs(data.logs);
      }
    } catch (err) {
      showToast('Error loading system logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedLevel, selectedService]);

  const handleClearLogs = async () => {
    if (!confirm('Are you sure you want to clear system logs?')) return;
    try {
      const res = await fetch('/api/admin/logs', { method: 'DELETE' });
      if (res.ok) {
        showToast('Logs cleared');
        setLogs([]);
      }
    } catch (err) {
      showToast('Error clearing logs', 'error');
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">📊</span>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              System Audit & Health Logs
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time audit trail of API executions, payment webhook events, settings adjustments, and server warnings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchLogs}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <span>🔄 Refresh</span>
          </button>
          <button
            onClick={handleClearLogs}
            className="px-4 py-2.5 bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white font-bold text-xs rounded-xl border border-rose-500/30 transition-all cursor-pointer"
          >
            <span>🗑️ Clear Logs</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-slate-900/60 border border-slate-800 rounded-2xl text-xs">
        <span className="text-slate-400 font-bold">Filter Level:</span>
        {['ALL', 'INFO', 'WARN', 'ERROR'].map((lvl) => (
          <button
            key={lvl}
            onClick={() => setSelectedLevel(lvl)}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              selectedLevel === lvl
                ? 'bg-brand-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {lvl}
          </button>
        ))}

        <div className="h-4 w-px bg-slate-800 mx-2 hidden sm:block" />

        <span className="text-slate-400 font-bold">Service:</span>
        <select
          value={selectedService}
          onChange={(e) => setSelectedService(e.target.value)}
          className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none cursor-pointer"
        >
          <option value="ALL">All Services</option>
          <option value="api">API Endpoints</option>
          <option value="razorpay">Razorpay Gateway</option>
          <option value="admin_settings">Admin Settings</option>
          <option value="cms_banners">CMS Banners</option>
          <option value="gemini_agent">Gemini AI</option>
        </select>
      </div>

      {/* Logs Table / List */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 space-y-3">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="text-xs font-bold">Loading System Logs...</div>
        </div>
      ) : logs.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 rounded-3xl border border-slate-800 text-slate-400 space-y-2">
          <div className="text-2xl">📋</div>
          <div className="font-bold text-white text-sm">No Logs Recorded for Selected Filter</div>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="divide-y divide-slate-800">
            {logs.map((log) => {
              const isError = log.level === 'ERROR' || log.level === 'CRITICAL';
              const isWarn = log.level === 'WARN';
              return (
                <div
                  key={log.id}
                  className="p-4 sm:p-5 hover:bg-slate-800/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-black uppercase ${
                          isError
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : isWarn
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {log.level}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono text-[10px]">
                        {log.service}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono" suppressHydrationWarning>
                        {new Date(log.created_at).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="text-white font-bold text-sm leading-snug">
                      {log.message}
                    </div>
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <pre className="text-[10px] text-slate-400 font-mono bg-slate-950 p-2 rounded-xl mt-1 overflow-x-auto max-w-2xl">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
