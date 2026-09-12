"use client";

import React from 'react';
import Link from 'next/link';

/**
 * Universal Responsive Breadcrumb Component
 * 
 * Props:
 * - items: Array of { label: string, href?: string, icon?: React.ReactNode }
 * - className?: string
 * - variant?: 'light' | 'dark' | 'transparent'
 */
export default function Breadcrumbs({ items = [], className = '', variant = 'light' }) {
  if (!items || items.length === 0) return null;

  const isDark = variant === 'dark';
  const isTransparent = variant === 'transparent';

  const containerClasses = isTransparent
    ? 'text-white/80'
    : isDark
    ? 'text-slate-400'
    : 'text-slate-500';

  const linkHoverClasses = isTransparent
    ? 'hover:text-white'
    : isDark
    ? 'hover:text-brand-400'
    : 'hover:text-brand-600';

  const activeTextClasses = isTransparent
    ? 'text-white font-bold'
    : isDark
    ? 'text-slate-100 font-bold'
    : 'text-slate-900 font-bold';

  const chevronClasses = isTransparent
    ? 'text-white/50'
    : isDark
    ? 'text-slate-600'
    : 'text-slate-400';

  return (
    <nav 
      aria-label="Breadcrumb" 
      className={`flex items-center flex-wrap gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium ${containerClasses} ${className}`}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <React.Fragment key={`${item.label}-${index}`}>
            {index > 0 && (
              <svg 
                className={`w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0 ${chevronClasses}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            )}

            {isLast || !item.href ? (
              <span 
                className={`inline-flex items-center gap-1.5 truncate max-w-[180px] xs:max-w-[240px] sm:max-w-md ${activeTextClasses}`}
                title={item.label}
              >
                {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                <span className="truncate">{item.label}</span>
              </span>
            ) : (
              <Link
                href={item.href}
                className={`inline-flex items-center gap-1.5 transition-colors flex-shrink-0 ${linkHoverClasses}`}
              >
                {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                <span>{item.label}</span>
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
