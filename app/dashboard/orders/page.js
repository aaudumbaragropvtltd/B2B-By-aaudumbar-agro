"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardOrdersRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/orders');
  }, [router]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center bg-slate-50">
      <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mb-4" />
      <h2 className="text-base font-extrabold text-slate-800">Redirecting to Orders & Booking Receipts...</h2>
      <p className="text-xs text-slate-500 mt-1">Opening your unified Orders central portal at <code className="font-mono font-bold text-brand-700">/orders</code></p>
    </div>
  );
}
