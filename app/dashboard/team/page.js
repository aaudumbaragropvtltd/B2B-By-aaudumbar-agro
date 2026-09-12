"use client";

import React, { useState, useEffect } from 'react';

export default function TeamManagement() {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Form State
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ fullName: '', email: '', phone: '', password: '', role: 'sales_rep' });
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTeam = async () => {
    try {
      const res = await fetch('/api/team');
      if (!res.ok) throw new Error('Failed to fetch team');
      const data = await res.json();
      setTeam(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchTeam(); }, []);

  const handleAddMember = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to add member');
      
      setIsAdding(false);
      setFormData({ fullName: '', email: '', phone: '', password: '', role: 'sales_rep' });
      fetchTeam(); // Refresh list
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading team data...</div>;

  const isOwner = team.length > 0 && team.some(m => m.team_role === 'owner' && m.id === team[0]?.id); // Simplistic check

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Organization & Subaccounts</h2>
          <p className="text-slate-500 text-sm mt-1">Manage staff roles, access, and enterprise hierarchy.</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          {isAdding ? 'Cancel' : '+ Add Staff Account'}
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>}

      {isAdding && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Create Subaccount</h3>
          {submitError && <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg">{submitError}</div>}
          <form onSubmit={handleAddMember} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input required type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-brand-500 focus:border-brand-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email (Login ID)</label>
                <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-brand-500 focus:border-brand-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-brand-500 focus:border-brand-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Temporary Password</label>
                <input required type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-brand-500 focus:border-brand-500" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Subaccount Role</label>
                <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-brand-500 focus:border-brand-500">
                  <option value="sales_manager">Sales Manager (Can re-assign leads)</option>
                  <option value="sales_rep">Sales Representative (Can chat with assigned buyers)</option>
                  <option value="catalog_manager">Catalog Manager (Can edit product listings)</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button disabled={isSubmitting} type="submit" className="bg-slate-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-slate-800 disabled:opacity-50">
                {isSubmitting ? 'Creating...' : 'Create Account'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase font-bold">
            <tr>
              <th className="px-6 py-4">Staff Member</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Contact</th>
              <th className="px-6 py-4">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {team.map((member) => (
              <tr key={member.id} className="hover:bg-slate-50">
                <td className="px-6 py-4">
                  <div className="font-bold text-slate-900">{member.company_name}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider
                    ${member.team_role === 'owner' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}
                  >
                    {member.team_role.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  <div>{member.registered_email}</div>
                  <div className="text-xs text-slate-500">{member.corporate_phone}</div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">
                  {new Date(member.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
