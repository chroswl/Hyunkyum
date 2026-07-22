import React from 'react';

interface ColorRowProps {
  label: string;
  value: string | undefined;
  fallback: string;
  onChange: (value: string) => void;
}

export function ColorRow({ label, value, fallback, onChange }: ColorRowProps) {
  const displayValue = value !== undefined && value !== '' ? value : fallback;
  const isValidHex = /^#[0-9A-Fa-f]{6}$/.test(displayValue);
  const colorPickerValue = isValidHex 
    ? displayValue 
    : (fallback.startsWith('#') && fallback.length === 7 ? fallback : '#000000');

  return (
    <div className="flex items-center justify-between">
      <label className="text-xs text-neutral-300">{label}</label>
      <div className="flex items-center space-x-2">
        <input 
          type="text" 
          value={displayValue} 
          onChange={(e) => onChange(e.target.value)}
          className="bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs text-white w-20 font-mono focus:outline-none focus:border-neutral-500 transition-colors uppercase"
        />
        <div className="relative w-6 h-6 rounded overflow-hidden border border-neutral-700 shrink-0">
          <input 
            type="color" 
            value={colorPickerValue} 
            onChange={(e) => onChange(e.target.value)}
            className="absolute -top-2 -left-2 w-10 h-10 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}

export default ColorRow;
