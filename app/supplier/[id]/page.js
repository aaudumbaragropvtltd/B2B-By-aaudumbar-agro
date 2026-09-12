"use client";

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { createClient } from '@/services/supabase';
import { notFound } from 'next/navigation';
import { useRouter } from 'next/navigation';
import Breadcrumbs from '@/components/Breadcrumbs';

export default function SupplierStorefront({ params }) {
  const supplierId = params.id;
  const [supplier, setSupplier] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const fetchStorefront = async () => {
      // Fetch Supplier Profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', supplierId)
        .eq('role', 'supplier')
        .single();

      if (profileError || !profile) {
        notFound();
        return;
      }

      setSupplier(profile);

      // Fetch Supplier Products
      const { data: catalog } = await supabase
        .from('products')
        .select('*')
        .eq('supplier_id', supplierId)
        .eq('is_active', true);

      setProducts(catalog || []);
      setLoading(false);
    };

    fetchStorefront();
  }, [supplierId, supabase]);

  const handleMessage = async (productId) => {
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          targetUserId: supplierId,
          productId: productId
        })
      });
      if (response.ok) {
        router.push('/dashboard/messages');
      } else {
        const err = await response.text();
        if (err === 'Unauthorized') router.push('/login');
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading Storefront...</div>;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 pt-24 pb-16">
        
        {/* Header / Banner */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            <Breadcrumbs
              items={[
                { label: 'Home', href: '/' },
                { label: 'Directory', href: '/directory' },
                { label: supplier.company_name }
              ]}
              className="mb-6"
            />
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
              {/* Logo */}
              <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center shadow-inner border border-blue-200 shrink-0">
                {supplier.logo_url ? (
                  <img src={supplier.logo_url} alt={supplier.company_name} className="w-full h-full object-contain rounded-2xl p-4" />
                ) : (
                  <span className="text-4xl font-bold text-blue-500">{supplier.company_name[0]}</span>
                )}
              </div>
              
              {/* Info */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                  <h1 className="text-3xl font-extrabold text-gray-900">{supplier.company_name}</h1>
                  {supplier.verification_level === 'verified' && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                      Verified Supplier
                    </span>
                  )}
                </div>
                
                <p className="text-gray-600 mb-6 max-w-2xl">
                  {supplier.company_description || "Premium supplier on B2B India Network."}
                </p>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-sm text-gray-500 font-medium mb-6">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {supplier.location || 'India'}
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    GST: {supplier.gst_number || 'N/A'}
                  </div>
                </div>

                <div className="flex gap-4 justify-center md:justify-start">
                  <button onClick={() => handleMessage(null)} className="px-6 py-2.5 bg-brand-600 text-white font-semibold rounded-xl shadow-lg shadow-brand-500/30 hover:bg-brand-700 transition-colors">
                    Contact Supplier
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Catalog */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Product Catalog</h2>
          
          {products.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-3xl border border-gray-200">
              <p className="text-gray-500">This supplier has no active products at the moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map(product => {
                const productImg = product.hero_image_url || product.gallery_image_urls?.[0] || product.image_url || product.image;
                return (
                  <div key={product.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow group flex flex-col justify-between">
                    <div className="aspect-[4/3] bg-gray-100 flex items-center justify-center relative overflow-hidden">
                      {productImg ? (
                        <img src={productImg} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <svg className="w-16 h-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      )}
                      {Array.isArray(product.gallery_image_urls) && product.gallery_image_urls.length > 1 && (
                        <span className="absolute top-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          📸 {product.gallery_image_urls.length}
                        </span>
                      )}
                    </div>
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-gray-900 mb-1 truncate group-hover:text-brand-600 transition-colors">{product.title}</h3>
                        <div className="text-xl font-extrabold text-brand-600 mb-4">
                          ₹{product.base_price_per_unit} <span className="text-xs text-gray-500 font-medium">/ {product.unit_label}</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <button onClick={() => handleMessage(product.id)} className="flex-1 py-2 border-2 border-brand-100 text-brand-700 font-semibold rounded-xl hover:bg-brand-50 hover:border-brand-200 transition-colors text-xs">
                          Inquire Now
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
