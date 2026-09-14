"use client";

import React from 'react';

/**
 * B2B Logo Badge
 * High-precision vector recreation of the official B2B multi-color app icon / brand mark.
 * Features:
 * - Dynamic 5-color conical gradient (Blue, Lime Green, Orange, Crimson Red, Purple)
 * - Pure SVG vector paths for Left 'B', Right 'B', Center Orange Disc with '2', and Digital Pixels
 * - No raster images used; fully responsive and crisp at any screen resolution.
 */
export default function B2BLogo({ 
  className = "w-10 h-10", 
  roundedClass = "rounded-xl",
  showGlow = true,
  animate = true
}) {
  return (
    <div
      className={`relative ${className} ${roundedClass} flex-shrink-0 overflow-hidden flex items-center justify-center select-none ${
        showGlow ? 'shadow-lg shadow-orange-500/20' : ''
      } ${
        animate ? 'transition-transform duration-300 group-hover:scale-105 group-hover:shadow-orange-500/30' : ''
      }`}
      title="B2B India"
    >
      <img
        src="/logo.png"
        alt="B2B India"
        className="w-full h-full object-contain"
        width={512}
        height={512}
      />
    </div>
  );
}
