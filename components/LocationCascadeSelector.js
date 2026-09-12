"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { getIndianStates, getCitiesByState, getVillagesByCity } from '@/utils/indianLocations';

export default function LocationCascadeSelector({
  state = '',
  city = '',
  village = '',
  customVillage = '',
  pincode = '',
  onLocationChange,
  theme = 'light', // 'light' | 'dark'
  layout = 'grid', // 'grid' | 'stacked'
  showPincode = false,
  showFullAddressPreview = false,
  labels = {
    state: 'State / Union Territory *',
    city: 'City / District *',
    village: 'Village / Taluka / Area *',
    customVillage: 'Enter Custom Village / Area Name *',
    pincode: 'PIN Code',
  },
  required = true,
  disabled = false,
  className = '',
}) {
  const [selectedState, setSelectedState] = useState(state || '');
  const [selectedCity, setSelectedCity] = useState(city || '');
  const [selectedVillage, setSelectedVillage] = useState(village || '');
  const [customVillageText, setCustomVillageText] = useState(customVillage || '');
  const [inputPincode, setInputPincode] = useState(pincode || '');
  const [isOtherSelected, setIsOtherSelected] = useState(
    village === 'Other' || (!!customVillage && !getVillagesByCity(state, city).includes(village))
  );

  const statesList = useMemo(() => getIndianStates(), []);
  const citiesList = useMemo(() => getCitiesByState(selectedState), [selectedState]);
  const villagesList = useMemo(() => {
    const list = getVillagesByCity(selectedState, selectedCity);
    return [...list, 'Other'];
  }, [selectedState, selectedCity]);

  // Sync internal state if external props change
  useEffect(() => {
    if (state !== undefined && state !== selectedState) setSelectedState(state || '');
  }, [state]);

  useEffect(() => {
    if (city !== undefined && city !== selectedCity) setSelectedCity(city || '');
  }, [city]);

  useEffect(() => {
    if (village !== undefined && village !== selectedVillage) {
      setSelectedVillage(village || '');
      setIsOtherSelected(village === 'Other');
    }
  }, [village]);

  useEffect(() => {
    if (customVillage !== undefined && customVillage !== customVillageText) {
      setCustomVillageText(customVillage || '');
    }
  }, [customVillage]);

  useEffect(() => {
    if (pincode !== undefined && pincode !== inputPincode) {
      setInputPincode(pincode || '');
    }
  }, [pincode]);

  const notifyChange = (newState, newCity, newVillage, newCustomVillage, newPincode, newIsOther) => {
    if (!onLocationChange) return;
    const finalVillage = newIsOther ? (newCustomVillage || 'Other') : newVillage;
    const parts = [finalVillage, newCity, newState, newPincode].filter(Boolean);
    const formattedAddress = parts.join(', ');

    onLocationChange({
      state: newState,
      city: newCity,
      village: newVillage,
      customVillage: newCustomVillage,
      finalVillage,
      pincode: newPincode,
      isOther: newIsOther,
      formattedAddress,
    });
  };

  const handleStateSelect = (e) => {
    const newState = e.target.value;
    setSelectedState(newState);
    setSelectedCity('');
    setSelectedVillage('');
    setCustomVillageText('');
    setIsOtherSelected(false);
    notifyChange(newState, '', '', '', inputPincode, false);
  };

  const handleCitySelect = (e) => {
    const newCity = e.target.value;
    setSelectedCity(newCity);
    setSelectedVillage('');
    setCustomVillageText('');
    setIsOtherSelected(false);
    notifyChange(selectedState, newCity, '', '', inputPincode, false);
  };

  const handleVillageSelect = (e) => {
    const val = e.target.value;
    setSelectedVillage(val);
    const other = val === 'Other';
    setIsOtherSelected(other);
    notifyChange(selectedState, selectedCity, val, customVillageText, inputPincode, other);
  };

  const handleCustomVillageChange = (e) => {
    const val = e.target.value;
    setCustomVillageText(val);
    notifyChange(selectedState, selectedCity, 'Other', val, inputPincode, true);
  };

  const handlePincodeChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setInputPincode(val);
    notifyChange(selectedState, selectedCity, selectedVillage, customVillageText, val, isOtherSelected);
  };

  // Styling based on theme
  const isDark = theme === 'dark';
  const labelClass = isDark
    ? "flex items-center text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 h-5 truncate"
    : "flex items-center text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 h-5 truncate";

  const renderLabelWithRedAsterisk = (text) => {
    if (!text || typeof text !== 'string') return text;
    if (text.includes('*')) {
      const parts = text.split('*');
      return (
        <span className="inline-flex items-center">
          <span>{parts[0].trim()}</span>
          <span className="text-red-500 font-bold ml-1">*</span>
          {parts[1] && <span className="ml-1">{parts[1]}</span>}
        </span>
      );
    }
    return text;
  };

  const inputClass = isDark
    ? "w-full h-11 px-3.5 bg-slate-900 border border-slate-700 text-white rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all disabled:opacity-50 shadow-sm"
    : "w-full h-11 px-3.5 bg-white border border-slate-300 text-slate-900 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all disabled:opacity-50 shadow-sm";

  const noticeClass = isDark
    ? "p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-xs text-emerald-300 leading-relaxed shadow-sm"
    : "p-3 bg-blue-50/80 border border-blue-200/80 rounded-xl text-xs text-blue-900 leading-relaxed shadow-sm";

  return (
    <div className={`space-y-4 w-full ${className}`}>
      {/* ── 2-COLUMN STRUCTURED BALANCED GRID ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* ── 1. STATE SELECTOR ── */}
        <div className="flex flex-col">
          <label className={labelClass} title={labels.state}>
            {renderLabelWithRedAsterisk(labels.state)}
          </label>
          <select
            value={selectedState}
            onChange={handleStateSelect}
            required={required}
            disabled={disabled}
            className={inputClass}
          >
            <option value="" className="text-slate-900 bg-white">-- Select State --</option>
            {statesList.map((st) => (
              <option key={st} value={st} className="text-slate-900 bg-white">
                {st}
              </option>
            ))}
          </select>
        </div>

        {/* ── 2. CITY / DISTRICT SELECTOR ── */}
        <div className="flex flex-col">
          <label className={labelClass} title={labels.city}>
            {renderLabelWithRedAsterisk(labels.city)}
          </label>
          <select
            value={selectedCity}
            onChange={handleCitySelect}
            required={required}
            disabled={disabled || !selectedState}
            className={inputClass}
          >
            <option value="" className="text-slate-900 bg-white">
              {selectedState ? '-- Select City / District --' : '-- First Select State --'}
            </option>
            {citiesList.map((ct) => (
              <option key={ct} value={ct} className="text-slate-900 bg-white">
                {ct}
              </option>
            ))}
          </select>
        </div>

        {/* ── 3. VILLAGE / TALUKA SELECTOR ── */}
        <div className={`flex flex-col ${!showPincode ? 'sm:col-span-2' : ''}`}>
          <label className={labelClass} title={labels.village}>
            {renderLabelWithRedAsterisk(labels.village)}
          </label>
          <select
            value={selectedVillage}
            onChange={handleVillageSelect}
            required={required}
            disabled={disabled || !selectedCity}
            className={inputClass}
          >
            <option value="" className="text-slate-900 bg-white">
              {selectedCity ? '-- Select Village / Taluka --' : '-- First Select City --'}
            </option>
            {villagesList.map((vg) => (
              <option key={vg} value={vg} className="text-slate-900 bg-white">
                {vg === 'Other' ? '📍 Other (Specify Village / Area)' : vg}
              </option>
            ))}
          </select>
        </div>

        {/* ── 4. PINCODE (Optional) ── */}
        {showPincode && (
          <div className="flex flex-col">
            <label className={labelClass} title={labels.pincode}>
              {renderLabelWithRedAsterisk(labels.pincode)}
            </label>
            <input
              type="text"
              value={inputPincode}
              onChange={handlePincodeChange}
              maxLength={6}
              placeholder="e.g. 431009"
              disabled={disabled}
              className={`${inputClass} font-mono`}
            />
          </div>
        )}
      </div>

      {/* ── HELPER NOTICE: Explaining the 'Other' village option ── */}
      {selectedCity && (
        <div className={noticeClass}>
          <div className="flex items-start gap-2">
            <span className="text-base flex-shrink-0 mt-0.5">💡</span>
            <div className="text-[11px] sm:text-xs">
              <strong>Village Selection Guide:</strong> If your specific village or gram panchayat is not listed in the options above, select <strong>&quot;Other (Specify Village / Area)&quot;</strong> and type your village name in the new box below.
            </div>
          </div>
        </div>
      )}

      {/* ── 5. DYNAMIC NEW INPUT BOX FOR CUSTOM VILLAGE NAME ── */}
      {isOtherSelected && (
        <div className="p-4 rounded-2xl border border-dashed border-brand-400 bg-brand-50/30 dark:bg-emerald-950/30 space-y-2 animate-fadeIn">
          <label className={`${labelClass} text-brand-700 dark:text-emerald-400 h-auto`}>
            {renderLabelWithRedAsterisk(labels.customVillage)}
          </label>
          <input
            type="text"
            value={customVillageText}
            onChange={handleCustomVillageChange}
            required={required && isOtherSelected}
            disabled={disabled}
            placeholder="Type your village, gram panchayat, or industrial area name here..."
            className={`${inputClass} border-brand-400 focus:border-brand-500`}
            autoFocus
          />
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            ✓ Your custom village will be mapped to <strong>{selectedCity}, {selectedState}</strong> on official dispatch gate passes and tax invoices.
          </p>
        </div>
      )}

      {/* ── Optional Formatted Address Preview ── */}
      {showFullAddressPreview && (selectedState || selectedCity || selectedVillage) && (
        <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-2">
          <span>📍 Selected Jurisdiction:</span>
          <strong className="text-slate-900 dark:text-white font-semibold">
            {[
              isOtherSelected ? (customVillageText || 'Custom Village') : selectedVillage,
              selectedCity,
              selectedState,
              inputPincode
            ].filter(Boolean).join(', ') || 'None'}
          </strong>
        </div>
      )}
    </div>
  );
}
