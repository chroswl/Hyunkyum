import React, { ReactNode } from 'react';
import { Undo, Redo, RotateCcw, X } from 'lucide-react';
import { useAppearance } from '../../contexts/AppearanceContext';

interface AdminLayoutProps {
  toolbar?: ReactNode; // Deprecated, kept for backward compatibility
  preview?: ReactNode; // Deprecated, kept for backward compatibility
  properties: ReactNode;
  onSave?: () => void;
  onReset?: () => void;
  onClose?: () => void;
  isSaving?: boolean;
  hasChanges?: boolean;
  title?: string;
  lastSaved?: string;
}

export default function AdminLayout({
  properties, onSave, onReset, onClose, isSaving, hasChanges, title, lastSaved
}: AdminLayoutProps) {
  return (
    <div className="flex flex-col w-full h-full bg-[#111] text-white font-sans animate-in fade-in duration-300">
      <div className="h-14 border-b border-neutral-900 flex items-center justify-between px-6 shrink-0">
         <span className="text-xs font-serif tracking-widest text-[#C9A227] uppercase">{title || 'Properties'}</span>
         <div className="flex items-center space-x-3">
           <button onClick={onReset} className="p-2 text-neutral-500 hover:text-white transition-colors rounded hover:bg-white/5" title="Reset">
             <RotateCcw className="w-4 h-4" />
           </button>
           <button onClick={onSave} disabled={!hasChanges || isSaving} className={`px-4 py-1.5 rounded text-[10px] uppercase tracking-wider font-semibold transition-colors ${hasChanges ? 'bg-[#C9A227] text-black hover:bg-[#ebd04e]' : 'bg-neutral-800 text-neutral-500'}`}>
             {isSaving ? 'Saving...' : 'Save'}
           </button>
           {onClose && (
             <button onClick={onClose} className="p-1.5 ml-2 text-neutral-400 hover:text-white hover:bg-white/5 rounded-full"><X className="w-4 h-4" /></button>
           )}
         </div>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
         {properties}
      </div>
    </div>
  );
}
