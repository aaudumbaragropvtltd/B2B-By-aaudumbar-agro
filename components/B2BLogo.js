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
      style={{
        background: 'conic-gradient(from 280deg at 50% 50%, #006aff 0deg, #0080ff 30deg, #10b981 60deg, #22c55e 88deg, #f59e0b 120deg, #ff5e00 155deg, #ff4500 180deg, #ef4444 210deg, #e11d48 235deg, #9333ea 270deg, #3b82f6 315deg, #006aff 360deg)'
      }}
      title="B2B India"
    >
      {/* Soft radial depth light */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.18) 0%, transparent 70%)'
        }}
      />

      {/* Vector B2B Graphic */}
      <svg 
        viewBox="0 0 512 512" 
        className="w-full h-full relative z-10 p-[4%]" 
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* LEFT 'B' */}
        <path 
          d="M 54 184 L 142 184 C 180 184 204 196 204 224 C 204 242 192 252 174 256 C 196 260 210 274 210 296 C 210 326 182 342 142 342 L 54 342 Z 
             M 98 216 L 98 244 L 136 244 C 150 244 162 238 162 230 C 162 222 150 216 136 216 Z 
             M 98 280 L 98 310 L 140 310 C 154 310 168 304 168 295 C 168 286 154 280 140 280 Z"
          fill="#FFFFFF" 
        />

        {/* RIGHT 'B' */}
        <path 
          d="M 338 184 L 426 184 C 464 184 488 196 488 224 C 488 242 476 252 458 256 C 480 260 494 274 494 296 C 494 326 466 342 426 342 L 338 342 Z 
             M 382 216 L 382 244 L 420 244 C 434 244 446 238 446 230 C 446 222 434 216 420 216 Z 
             M 382 280 L 382 310 L 424 310 C 438 310 452 304 452 295 C 452 286 438 280 424 280 Z"
          fill="#FFFFFF" 
        />

        {/* CENTER ORANGE RING & DISC */}
        <circle cx="260" cy="263" r="88" fill="#FF5E00" />
        <circle cx="260" cy="263" r="70" fill="#FFFFFF" />

        {/* DIGITAL PIXEL SQUARES ESCAPING TO TOP-RIGHT */}
        <rect x="300" y="194" width="17" height="17" fill="#FF5E00" />
        <rect x="315" y="171" width="19" height="19" fill="#FF5E00" />
        <rect x="331" y="150" width="19" height="19" fill="#FF5E00" />
        <rect x="350" y="146" width="19" height="19" fill="#FF5E00" />
        <rect x="348" y="167" width="16" height="16" fill="#FF5E00" />

        {/* CENTER ORANGE '2' */}
        <path 
          d="M 235 242 C 235 224 246 211 262 211 C 279 211 290 223 290 239 C 290 254 280 266 266 278 L 249 292 L 292 292 L 292 314 L 232 314 L 232 296 L 261 269 C 271 261 275 253 275 241 C 275 231 270 226 262 226 C 253 226 248 232 248 242 Z"
          fill="#FF5E00" 
        />
      </svg>
    </div>
  );
}
