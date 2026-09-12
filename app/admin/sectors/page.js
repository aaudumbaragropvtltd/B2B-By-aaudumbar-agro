'use client';

import React, { useState, useEffect } from 'react';

import Link from 'next/link';

export default function AdminSectors() {
  const [sectors, setSectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingSector, setEditingSector] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    fetchSectors();
  }, []);

  const fetchSectors = async () => {
    try {
      const res = await fetch('/api/admin/sectors');
      const data = await res.json();
      if (Array.isArray(data)) {
        setSectors(data);
      } else {
        console.error('Expected array of sectors, got:', data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (sector) => {
    setEditingSector(sector);
    setEditForm({
      id: sector.id,
      name: sector.name || '',
      slug: sector.slug || '',
      description: sector.description || '',
      is_active: sector.is_active !== false,
    });
  };

  const closeEditModal = () => {
    setEditingSector(null);
    setEditForm({});
  };

  const handleDeleteSector = async (sectorId, sectorName = 'this sector') => {
    if (!confirm(`Are you sure you want to delete sector "${sectorName}"?`)) return;
    try {
      setSectors(prev => prev.filter(s => s.id !== sectorId));
      if (editingSector?.id === sectorId) closeEditModal();

      const res = await fetch(`/api/admin/sectors?id=${encodeURIComponent(sectorId)}`, {
        method: 'DELETE'
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        fetchSectors();
        alert(data.error || 'Failed to delete sector');
      }
    } catch (err) {
      fetchSectors();
      alert('Error deleting sector: ' + err.message);
    }
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/sectors', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        closeEditModal();
        fetchSectors();
      } else {
        const err = await res.json();
        alert('Failed to update sector: ' + (err.error || res.statusText));
      }
    } catch (err) {
      console.error(err);
      alert('Error updating sector');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sector Hierarchy</h1>
          <p className="text-slate-500 mt-1">Manage global industry categories and directories</p>
        </div>
        <Link
          href="/admin/cms"
          className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl shadow-md shadow-brand-600/20 flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <span>🎨 Manage Category Banners & Images</span>
          <span>→</span>
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Sector Name</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Slug</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sectors.map((sector) => (
                <tr key={sector.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <div className="font-semibold text-slate-900">{sector.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">{sector.description || 'No description'}</div>
                  </td>
                  <td className="p-4 text-sm text-slate-600 font-mono bg-slate-50 rounded">
                    {sector.slug}
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                      sector.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {sector.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => openEditModal(sector)}
                        className="px-3 py-1.5 text-xs font-medium bg-brand-50 text-brand-700 rounded-md hover:bg-brand-100 transition-colors cursor-pointer"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteSector(sector.id, sector.name)}
                        className="p-1.5 text-xs font-medium bg-rose-50 text-rose-700 rounded-md hover:bg-rose-100 transition-colors cursor-pointer"
                        title="Delete Sector"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {sectors.length === 0 && (
                <tr>
                  <td colSpan="4" className="p-12 text-center text-slate-500">
                    No sectors found in database. Run migration to seed static sectors.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingSector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-slide-up">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-lg text-slate-900">Edit Sector</h3>
              <button onClick={closeEditModal} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <form onSubmit={submitEdit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                  <input type="text" value={editForm.name || ''} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-brand-500 focus:border-brand-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">URL Slug</label>
                  <input type="text" value={editForm.slug || ''} onChange={e => setEditForm({...editForm, slug: e.target.value})} className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-brand-500 focus:border-brand-500 font-mono text-sm" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <textarea value={editForm.description || ''} onChange={e => setEditForm({...editForm, description: e.target.value})} className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-brand-500 focus:border-brand-500 h-24" />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="is_active" checked={editForm.is_active} onChange={e => setEditForm({...editForm, is_active: e.target.checked})} className="rounded text-brand-600 focus:ring-brand-500" />
                  <label htmlFor="is_active" className="text-sm font-medium text-slate-700">Sector Active on Platform</label>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={closeEditModal} className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
