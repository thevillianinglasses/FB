// src/components/pharmacy/ScheduleChip.jsx
import React from 'react';

export default function ScheduleChip({ symbol, className = "" }) {
  if (!symbol || symbol === "NONE") return null;
  
  const colors = {
    H: "bg-amber-600 text-white",
    H1: "bg-red-600 text-white",
    X: "bg-rose-700 text-white", 
    N: "bg-orange-600 text-white",
    G: "bg-sky-600 text-white",
    K: "bg-emerald-600 text-white",
    NONE: "bg-gray-400 text-white"
  };
  
  const descriptions = {
    H: "Schedule H - Prescription required",
    H1: "Schedule H1 - Prescription required", 
    X: "Schedule X - Narcotic/Psychotropic - Special prescription required",
    N: "Schedule N - Narcotic drugs - Prescription required",
    G: "Schedule G - General medicines - No prescription required",
    K: "Schedule K - Ayurvedic medicines - No prescription required",
    NONE: "No schedule classification"
  };
  
  const color = colors[symbol] || colors.NONE;
  const title = descriptions[symbol] || descriptions.NONE;
  
  return (
    <span 
      title={title}
      className={`px-1.5 py-0.5 text-xs rounded font-medium ${color} ${className}`}
    >
      {symbol}
    </span>
  );
}