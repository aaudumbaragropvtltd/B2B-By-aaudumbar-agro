"use client";
import { useState } from 'react';

export default function CommodityImage({ src, category, className = "aspect-video w-full h-auto sm:aspect-[4/3]" }) {
  const [isBroken, setIsBroken] = useState(!src);

  const thematicStyles = {
    SPICES: "from-amber-600 to-orange-700 text-amber-100",
    TEXTILES: "from-blue-600 to-indigo-700 text-indigo-100",
    MINERALS: "from-slate-600 to-zinc-800 text-zinc-300",
    GRAINS: "from-yellow-500 to-amber-700 text-yellow-100",
    AGRICULTURE: "from-green-600 to-emerald-700 text-emerald-100",
    ELECTRONICS: "from-cyan-600 to-blue-700 text-blue-100",
    AUTOMOBILE: "from-red-600 to-rose-700 text-rose-100",
    APPAREL: "from-pink-500 to-fuchsia-700 text-fuchsia-100",
    FOOD: "from-orange-500 to-red-600 text-orange-100",
    MEDICAL: "from-teal-500 to-cyan-700 text-cyan-100",
    INDUSTRIAL: "from-gray-600 to-slate-800 text-slate-300",
    CHEMICAL: "from-purple-600 to-violet-800 text-violet-200",
    DEFAULT: "from-gray-800 to-slate-900 text-slate-400"
  };

  // Match the first keyword found in the category string
  const resolveTheme = (cat) => {
    if (!cat) return thematicStyles.DEFAULT;
    const upper = cat.toUpperCase();
    for (const key of Object.keys(thematicStyles)) {
      if (key !== 'DEFAULT' && upper.includes(key)) return thematicStyles[key];
    }
    return thematicStyles.DEFAULT;
  };

  const currentTheme = resolveTheme(category);

  // If the image link fails or was missing entirely, render the styled CSS placeholder
  if (isBroken) {
    return (
      <div className={`${className} bg-gradient-to-br ${currentTheme} flex flex-col items-center justify-center relative overflow-hidden border border-white/5 shadow-inner p-4 text-center`}>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:16px_16px]" />
        <span className="text-xs font-mono tracking-widest uppercase opacity-60 mb-2 relative z-10">B2B India Verified</span>
        <span className="text-sm font-bold tracking-wide truncate max-w-full relative z-10">{category || "Bulk Commodity"}</span>
      </div>
    );
  }

  const secureSrc = src && typeof src === 'string'
    ? src.replace(/^http:\/\//i, 'https://')
    : src;

  return (
    <img 
      src={secureSrc} 
      alt={category || "Bulk Commodity"} 
      className={`${className} object-cover border border-white/5`}
      loading="lazy"
      onError={() => setIsBroken(true)}
    />
  );
}
