import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface PropertyAccordionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export default function PropertyAccordion({ title, icon, children, defaultOpen = false }: PropertyAccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-[#111] border border-neutral-900 rounded overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-black/40 hover:bg-black/60 transition-colors"
      >
        <div className="flex items-center space-x-2 text-sm font-serif tracking-widest text-[#C9A227] uppercase">
          {icon && icon}
          <span>{title}</span>
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 text-neutral-500" /> : <ChevronDown className="w-4 h-4 text-neutral-500" />}
      </button>
      {isOpen && (
        <div className="p-4 border-t border-neutral-900">
          {children}
        </div>
      )}
    </div>
  );
}
