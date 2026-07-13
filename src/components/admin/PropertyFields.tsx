import React from 'react';

export function PropertyInput({ label, value, onChange, type = "text", placeholder }: { label: string, value: string, onChange: (v: string) => void, type?: string, placeholder?: string }) {
  return (
    <div className="space-y-2">
      <label className="text-[9px] uppercase tracking-widest" style={{ color: 'var(--color-text)' }}>{label}</label>
      <input 
        type={type} 
        value={value} 
        onChange={e => onChange(e.target.value)} 
        placeholder={placeholder}
        className="w-full bg-black border border-neutral-800 p-2 text-xs rounded outline-none focus:border-[#C9A227] transition-colors"
        style={{ color: 'var(--color-text)' }}
      />
    </div>
  );
}

export function PropertyTextarea({ label, value, onChange, placeholder, rows = 3 }: { label: string, value: string, onChange: (v: string) => void, placeholder?: string, rows?: number }) {
  return (
    <div className="space-y-2">
      <label className="text-[9px] uppercase tracking-widest" style={{ color: 'var(--color-text)' }}>{label}</label>
      <textarea 
        value={value} 
        onChange={e => onChange(e.target.value)} 
        placeholder={placeholder}
        rows={rows}
        className="w-full bg-black border border-neutral-800 p-2 text-xs rounded outline-none focus:border-[#C9A227] transition-colors resize-none custom-scrollbar" 
        style={{ color: 'var(--color-text)' }}
      />
    </div>
  );
}

export function PropertySelect({ label, value, onChange, options }: { label: string, value: string, onChange: (v: string) => void, options: {label: string, value: string}[] }) {
  return (
    <div className="space-y-2">
      <label className="text-[9px] uppercase tracking-widest" style={{ color: 'var(--color-text)' }}>{label}</label>
      <select 
        value={value} 
        onChange={e => onChange(e.target.value)} 
        className="w-full bg-black border border-neutral-800 p-2 text-xs rounded outline-none focus:border-[#C9A227] transition-colors"
        style={{ color: 'var(--color-text)' }}
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
         <label className="text-[9px] uppercase tracking-widest" style={{ color: 'var(--color-text)' }}>{label}</label>
         <span className="text-[9px] font-mono" style={{ color: 'var(--color-accent)' }}>{value}{unit}</span>
      </div>
      <input 
        type="range" 
        min={min} 
        max={max} 
        step={step}
        value={value} 
        onChange={e => onChange(Number(e.target.value))} 
        className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer" 
        style={{ accentColor: 'var(--color-accent)' }}
      />
    </div>
  );
}

export function PropertyColorPicker({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <label className="text-[9px] uppercase tracking-widest" style={{ color: 'var(--color-text)' }}>{label}</label>
      <div className="flex items-center space-x-2">
        <div className="relative w-8 h-8 rounded border border-neutral-800 overflow-hidden shrink-0 bg-neutral-900">
          <input 
            type="color" 
            value={value || '#000000'} 
            onChange={e => onChange(e.target.value)} 
            className="absolute inset-0 w-[200%] h-[200%] -translate-x-[25%] -translate-y-[25%] cursor-pointer border-0 p-0"
          />
        </div>
        <input 
          type="text" 
          value={value || ''} 
          onChange={e => onChange(e.target.value)} 
          placeholder="#000000"
          maxLength={7}
          className="flex-1 bg-black border border-neutral-800 p-2 text-xs rounded outline-none focus:border-[#C9A227] transition-colors uppercase font-mono" 
          style={{ color: 'var(--color-text)' }}
        />
      </div>
    </div>
  );
}
