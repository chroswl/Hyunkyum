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
  const [localValue, setLocalValue] = React.useState(value.toString());

  React.useEffect(() => {
    setLocalValue(value.toString());
  }, [value]);

  const handleInputChange = (e) => {
    setLocalValue(e.target.value);
    const num = Number(e.target.value);
    if (!isNaN(num)) {
      onChange(num);
    }
  };

  const handleBlur = () => {
    let num = Number(localValue);
    if (isNaN(num)) num = min;
    if (num < min) num = min;
    if (num > max) num = max;
    setLocalValue(num.toString());
    onChange(num);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleBlur();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
         <label className="text-[9px] uppercase tracking-widest" style={{ color: 'var(--color-text)' }}>{label}</label>
         <div className="flex items-center space-x-1">
           <input
             type="number"
             inputMode="decimal"
             value={localValue}
             onChange={handleInputChange}
             onBlur={handleBlur}
             onKeyDown={handleKeyDown}
             className="w-16 bg-transparent border-b border-neutral-800 focus:border-[#C9A227] text-right text-[10px] font-mono outline-none transition-colors"
             style={{ color: 'var(--color-text)' }}
           />
           {unit && <span className="text-[9px] font-mono text-neutral-500">{unit}</span>}
         </div>
      </div>
      <input 
        type="range" 
        min={min} 
        max={max} 
        step={step}
        value={value} 
        onChange={e => onChange(Number(e.target.value))} 
        className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer" 
        style={{ accentColor: 'var(--color-text)' }}
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
