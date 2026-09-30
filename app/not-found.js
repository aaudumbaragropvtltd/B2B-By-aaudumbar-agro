import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Page Not Found (404) | B2B India',
  description: 'The requested page or listing could not be found on B2B India wholesale marketplace.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="min-h-[70vh] bg-slate-50 flex items-center justify-center px-4 py-20">
        <div className="max-w-xl w-full text-center bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 shadow-sm">
          <div className="w-20 h-20 mx-auto mb-6 bg-brand-50 border border-brand-200 text-brand-600 rounded-2xl flex items-center justify-center text-3xl font-black">
            404
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-3 tracking-tight">
            Listing or Page Not Found
          </h1>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-8">
            The product, supplier, or resource you are looking for does not exist, has been delisted, or may have moved to a different URL.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link
              href="/directory"
              className="w-full sm:w-auto px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl transition-colors shadow-sm"
            >
              Browse Verified Directory
            </Link>
            <Link
              href="/"
              className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors"
            >
              Back to Home
            </Link>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 text-xs text-slate-400">
            Need procurement assistance? Contact our desk at{' '}
            <a href="mailto:support@b2bindia.site" className="text-brand-600 font-medium hover:underline">
              support@b2bindia.site
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
