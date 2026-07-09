// ============================================================================
// useLogisticsCalculator HOOK
// ============================================================================
// Custom state hook for real-time logistics cost estimation.
// Uses Haversine formula for geo-coordinate distance calculation.
// Supports multiple freight modes with Indian rate cards.
// ============================================================================

"use client";

import { useState, useMemo, useCallback } from 'react';



// ── Indian freight rate cards (simplified) ──
const FREIGHT_RATES = {
  road: {
    label: 'Road Transport',
    ratePerKmPerTon: 2.5, // ₹ per km per ton
    minimumCharge: 2000,
    maxDistanceKm: 3000,
    transitDaysPerKm: 0.007, // ~7 days for 1000km
  },
  rail: {
    label: 'Rail Freight',
    ratePerKmPerTon: 1.2,
    minimumCharge: 5000,
    maxDistanceKm: 5000,
    transitDaysPerKm: 0.01, // ~10 days for 1000km
    minWeightKg: 5000, // Wagon minimums
  },
  multimodal: {
    label: 'Multi-Modal (Road + Rail)',
    ratePerKmPerTon: 1.8,
    minimumCharge: 3500,
    maxDistanceKm: 4000,
    transitDaysPerKm: 0.008,
  },
};

/**
 * Hook for calculating logistics costs between supplier and buyer locations.
 *
 * @returns {{
 *   origin: { lat: number, lng: number } | null,
 *   destination: { lat: number, lng: number } | null,
 *   weightKg: number,
 *   mode: string,
 *   setOrigin: (coords: { lat: number, lng: number }) => void,
 *   setDestination: (coords: { lat: number, lng: number }) => void,
 *   setWeightKg: (weight: number) => void,
 *   setMode: (mode: string) => void,
 *   result: {
 *     distanceKm: number,
 *     cost: number,
 *     transitDays: number,
 *     modeLabel: string,
 *     costPerKg: number,
 *   } | null,
 *   availableModes: Array<{ key: string, label: string }>,
 * }}
 */
export function useLogisticsCalculator() {
  const [distanceKm, setDistanceKm] = useState('');
  const [weightKg, setWeightKg] = useState(1000);
  const [mode, setMode] = useState('road');

  const availableModes = Object.entries(FREIGHT_RATES).map(([key, rate]) => ({
    key,
    label: rate.label,
  }));

  const result = useMemo(() => {
    const distNum = parseFloat(distanceKm);
    if (!distNum || isNaN(distNum) || weightKg <= 0) return null;

    const rateConfig = FREIGHT_RATES[mode] || FREIGHT_RATES.road;
    const weightTons = weightKg / 1000;

    // Check if rail mode has minimum weight requirement
    if (mode === 'rail' && weightKg < (rateConfig.minWeightKg || 0)) {
      return {
        distanceKm: Math.round(distanceKm),
        cost: 0,
        transitDays: 0,
        modeLabel: rateConfig.label,
        costPerKg: 0,
        error: `Rail freight requires minimum ${rateConfig.minWeightKg} kg`,
      };
    }

    // Based on user feedback: Cost = weightKg * 2 * (distanceKm / 300)
    const cost = Math.max(rateConfig.minimumCharge, Math.round(weightKg * 2 * (distNum / 300)));
    const transitDays = Math.max(1, Math.ceil(distNum * rateConfig.transitDaysPerKm));

    return {
      distanceKm: Math.round(distNum),
      cost,
      transitDays,
      modeLabel: rateConfig.label,
      costPerKg: Math.round((cost / weightKg) * 100) / 100,
    };
  }, [distanceKm, weightKg, mode]);
  return {
    distanceKm,
    weightKg,
    mode,
    setDistanceKm,
    setWeightKg,
    setMode,
    result,
    availableModes,
  };
}
