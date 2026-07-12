import React, { ReactNode } from 'react';
import { Undo, Redo, RotateCcw } from 'lucide-react';

interface AdminLayoutProps {
  toolbar?: ReactNode;
  preview: ReactNode;
  properties: ReactNode;
  onSave?: () => void;
  onReset?: () => void;
  isSaving?: boolean;
  hasChanges?: boolean;
  title?: string;
  lastSaved?: string;
}

export default function AdminLayout({
  toolbar, preview, properties, onSave, onReset, isSaving, hasChanges, title, lastSaved
}: AdminLayoutProps) {
  return (
    <div className="flex w-full h-full bg-[#0a0a0a] overflow-hidden text-white font-sans animate-in fade-in duration-300">
      {/* Center Panel (Preview) */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-neutral-900 bg-[#0a0a0a]">
        <div className="h-14 border-b border-neutral-900 bg-[#111] flex items-center justify-between px-6 shrink-0">
           <div className="flex items-center space-x-6">
              <span className="text-xs font-serif tracking-widest text-[#C9A227] uppercase">{title || 'Preview'}</span>
              {toolbar}
           </div>
           <div className="flex items-center space-x-4">
              {lastSaved && <span className="text-[10px] text-neutral-500 uppercase tracking-widest">Last Saved: {lastSaved}</span>}
              <div className="flex items-center space-x-1 border-l border-neutral-800 pl-4">
                 <button className="p-2 text-neutral-500 hover:text-white transition-colors rounded hover:bg-white/5" title="Undo"><Undo className="w-4 h-4" /></button>
                 <button className="p-2 text-neutral-500 hover:text-white transition-colors rounded hover:bg-white/5" title="Redo"><Redo className="w-4 h-4" /></button>
              </div>
           </div>
        </div>
        <div className="flex-1 overflow-hidden bg-neutral-950 p-6 flex flex-col relative items-center justify-center">
           <div className="w-full h-full flex flex-col bg-black border border-neutral-900 rounded-lg overflow-hidden shadow-2xl relative max-w-[1400px]">
              {preview}
           </div>
        </div>
      </div>
      
      {/* Right Panel (Properties) */}
      <div className="w-[340px] xl:w-[380px] bg-[#111] flex flex-col shrink-0">
        <div className="h-14 border-b border-neutral-900 bg-[#111] flex items-center justify-between px-6 shrink-0">
           <span className="text-xs font-sans tracking-widest text-neutral-400 uppercase">Properties</span>
           <div className="flex items-center space-x-3">
             <button onClick={onReset} className="p-2 text-neutral-500 hover:text-white transition-colors rounded hover:bg-white/5" title="Reset">
               <RotateCcw className="w-4 h-4" />
             </button>
             <button onClick={onSave} disabled={!hasChanges || isSaving} className={`px-4 py-1.5 rounded text-[10px] uppercase tracking-wider font-semibold transition-colors ${hasChanges ? 'bg-[#C9A227] text-black hover:bg-[#ebd04e]' : 'bg-neutral-800 text-neutral-500'}`}>
               {isSaving ? 'Saving...' : 'Save'}
             </button>
           </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
           {properties}
        </div>
      </div>
    </div>
  );
}
