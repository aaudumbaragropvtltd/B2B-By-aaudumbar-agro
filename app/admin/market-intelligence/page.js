"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function MarketIntelligence() {
  const [marketRates, setMarketRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [agentRunning, setAgentRunning] = useState(false);
  const [agentResult, setAgentResult] = useState(null);

  const fetchRates = async () => {
    try {
      const response = await fetch('/api/admin/market-rates');
      if (response.ok) {
        const data = await response.json();
        setMarketRates(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);

  const runAgent = async () => {
    setAgentRunning(true);
    setAgentResult(null);
    try {
      const res = await fetch('/api/cron/market-agent', { method: 'POST' });
      const data = await res.json();
      setAgentResult(data);
      fetchRates(); // Refresh data after agent runs
    } catch (err) {
      console.error('Agent failed:', err);
    } finally {
      setAgentRunning(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Market Intelligence AI</h2>
          <p className="text-slate-500 mt-2 text-sm">
            Continuously track market rates and compare vendor pricing across the web.
          </p>
        </div>
        
        <button 
          onClick={runAgent}
          disabled={agentRunning}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {agentRunning ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Agent Analyzing...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Run Market Agent
            </>
          )}
        </button>
      </div>

      {agentResult && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl text-indigo-800 text-sm">
          <strong>Agent Run Complete:</strong> Processed {agentResult.analyzed} commodities successfully. Database updated.
        </motion.div>
      )}

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-bold">
                <th className="px-6 py-4">Commodity</th>
                <th className="px-6 py-4">Last Scraped</th>
                <th className="px-6 py-4">Min Price</th>
                <th className="px-6 py-4">Max Price</th>
                <th className="px-6 py-4">Market Average</th>
                <th className="px-6 py-4 text-right">Trend Analysis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="6" className="p-8 text-center text-slate-500">Loading market data...</td></tr>
              ) : marketRates.length === 0 ? (
                <tr><td colSpan="6" className="p-12 text-center text-slate-500">No market data available. Run the AI agent to extract pricing.</td></tr>
              ) : (
                marketRates.map((rate) => (
                  <tr key={rate.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{rate.commodity_name}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(rate.recorded_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-700">₹{rate.min_price}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-700">₹{rate.max_price}</td>
                    <td className="px-6 py-4 text-sm font-bold text-indigo-600">₹{rate.average_price}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase tracking-wider">
                        Stable
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
