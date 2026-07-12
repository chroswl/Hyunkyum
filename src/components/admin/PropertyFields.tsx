import React from 'react';

export function PropertyInput({ label, value, onChange, type = "text", placeholder }: { label: string, value: string, onChange: (v: string) => void, type?: string, placeholder?: string }) {
  return (
    <div className="space-y-2">
      <label className="text-[9px] uppercase tracking-widest text-neutral-500">{label}</label>
      <input 
        type={type} 
        value={value} 
        onChange={e => onChange(e.target.value)} 
        placeholder={placeholder}
        className="w-full bg-black border border-neutral-800 p-2 text-xs text-white rounded outline-none focus:border-[#C9A227] transition-colors" 
      />
    </div>
  );
}

export function PropertyTextarea({ label, value, onChange, placeholder, rows = 3 }: { label: string, value: string, onChange: (v: string) => void, placeholder?: string, rows?: number }) {
  return (
    <div className="space-y-2">
      <label className="text-[9px] uppercase tracking-widest text-neutral-500">{label}</label>
      <textarea 
        value={value} 
        onChange={e => onChange(e.target.value)} 
        placeholder={placeholder}
        rows={rows}
        className="w-full bg-black border border-neutral-800 p-2 text-xs text-white rounded outline-none focus:border-[#C9A227] transition-colors resize-none custom-scrollbar" 
      />
    </div>
  );
}

export function PropertySelect({ label, value, onChange, options }: { label: string, value: string, onChange: (v: string) => void, options: {label: string, value: string}[] }) {
  return (
    <div className="space-y-2">
      <label className="text-[9px] uppercase tracking-widest text-neutral-500">{label}</label>
      <select 
        value={value} 
        onChange={e => onChange(e.target.value)} 
        className="w-full bg-black border border-neutral-800 p-2 text-xs text-white rounded outline-none focus:border-[#C9A227] transition-colors"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

export function PropertySlider({ label, value, onChange, min = 0, max = 100, step = 1, unit = "" }: { label: string, value: number, onChange: (v: number) => void, min?: number, max?: number, step?: number, unit?: string }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
         <label className="text-[9px] uppercase tracking-widest text-neutral-500">{label}</label>
         <span className="text-[9px] text-[#C9A227] font-mono">{value}{unit}</span>
      </div>
      <input 
        type="range" 
        min={min} 
        max={max} 
        step={step}
        value={value} 
        onChange={e => onChange(Number(e.target.value))} 
        className="w-full accent-[#C9A227] h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer" 
      />
    </div>
  );
}
