"use client";

import React, { useState, useEffect } from 'react';
import { isFavorite, toggleFavorite } from '@/utils/favoritesAndHistory';

export default function FavoriteButton({ 
  product, 
  size = 'default', // 'small' | 'default' | 'large'
  className = '',
  showLabel = false 
}) {
  const [favorite, setFavorite] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (product?.id) {
      setFavorite(isFavorite(product.id));
    }

    const handleUpdate = () => {
      if (product?.id) {
        setFavorite(isFavorite(product.id));
      }
    };

    window.addEventListener('b2b_favorites_updated', handleUpdate);
    return () => window.removeEventListener('b2b_favorites_updated', handleUpdate);
  }, [product?.id]);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!product || !product.id) return;

    setAnimating(true);
    const newState = toggleFavorite(product);
    setFavorite(newState);
    setTimeout(() => setAnimating(false), 400);
  };

  const sizeClasses = {
    small: 'w-8 h-8 rounded-full text-xs shadow-md',
    default: 'w-10 h-10 rounded-xl text-sm shadow-md',
    large: 'px-4 py-2.5 rounded-xl text-sm gap-2 shadow-md',
  };

  const iconSizes = {
    small: 'w-4 h-4',
    default: 'w-5 h-5',
    large: 'w-5 h-5',
  };

  return (
    <div
      suppressHydrationWarning
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick(e);
        }
      }}
      title={favorite ? 'Remove from favorites' : 'Save to favorites'}
      className={`relative inline-flex items-center justify-center transition-all duration-200 cursor-pointer select-none ${
        favorite 
          ? 'bg-rose-50 text-rose-700 border-2 border-rose-300 hover:bg-rose-100 hover:border-rose-400 shadow-md' 
          : 'bg-white text-gray-900 border-2 border-gray-300 hover:border-black hover:bg-gray-50 shadow-md'
      } ${sizeClasses[size] || sizeClasses.default} ${className} ${animating ? 'scale-125' : 'hover:scale-105'}`}
      aria-label={favorite ? 'Favorited' : 'Favorite'}
    >
      <svg
        className={`${iconSizes[size] || 'w-4 h-4'} transition-all duration-200 ${
          favorite 
            ? 'fill-rose-500 stroke-black' 
            : 'fill-white stroke-black'
        }`}
        viewBox="0 0 24 24"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
      {showLabel && (
        <span className={`font-extrabold text-xs tracking-wide ${favorite ? 'text-rose-700' : 'text-gray-900'}`}>
          {favorite ? 'Saved' : 'Favorite'}
        </span>
      )}
    </div>
  );
}
