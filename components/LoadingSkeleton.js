// ============================================================================
// LOADING SKELETON COMPONENTS
// ============================================================================
// Reusable skeleton placeholders for trust-building loading states.
// Uses CSS shimmer animation defined in globals.css.
// ============================================================================

import React from 'react';

/** Generic rectangular skeleton */
export function Skeleton({ className = '', ...props }) {
  return (
    <div
      className={`skeleton ${className}`}
      {...props}
    />
  );
}

/** Product card skeleton */
export function ProductCardSkeleton() {
  return (
    <div className="rounded-2xl bg-white border border-border-subtle p-5 space-y-4">
      <Skeleton className="w-full h-40 rounded-xl" />
      <Skeleton className="w-3/4 h-5" />
      <Skeleton className="w-1/2 h-4" />
      <div className="flex gap-2">
        <Skeleton className="w-16 h-6 rounded-full" />
        <Skeleton className="w-20 h-6 rounded-full" />
      </div>
      <div className="flex justify-between items-center pt-2">
        <Skeleton className="w-24 h-7" />
        <Skeleton className="w-20 h-9 rounded-xl" />
      </div>
    </div>
  );
}

/** Sector card skeleton */
export function SectorCardSkeleton() {
  return (
    <div className="rounded-2xl bg-white border border-border-subtle p-6 space-y-3">
      <Skeleton className="w-10 h-10 rounded-lg" />
      <Skeleton className="w-3/4 h-5" />
      <Skeleton className="w-full h-3" />
      <Skeleton className="w-2/3 h-3" />
      <div className="flex justify-between items-center pt-2">
        <Skeleton className="w-16 h-4" />
        <Skeleton className="w-12 h-4" />
      </div>
    </div>
  );
}

/** Order row skeleton */
export function OrderRowSkeleton() {
  return (
    <div className="rounded-xl bg-white border border-border-subtle p-4 flex items-center gap-4">
      <Skeleton className="w-12 h-12 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="w-1/2 h-4" />
        <Skeleton className="w-1/3 h-3" />
      </div>
      <Skeleton className="w-20 h-8 rounded-lg flex-shrink-0" />
    </div>
  );
}

/** Full page skeleton with header and grid */
export function PageSkeleton({ cards = 6 }) {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="space-y-3">
        <Skeleton className="w-64 h-8" />
        <Skeleton className="w-96 h-4" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: cards }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
