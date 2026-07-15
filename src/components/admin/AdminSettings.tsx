import React, { useState } from 'react';
import type { Language } from '../../types';
import { X, RefreshCw, CheckCircle2, Loader2, LayoutTemplate } from 'lucide-react';
import { triggerLayoutSync } from '../../lib/layoutSync';

export default function AdminSettings({ currentLang, onClose }: { currentLang: Language; onClose?: () => void }) {
  const [syncState, setSyncState] = useState<'idle' | 'syncing' | 'done'>('idle');

  const handleManualSync = () => {
    setSyncState('syncing');
    triggerLayoutSync();
    
    setTimeout(() => {
      setSyncState('done');
      setTimeout(() => setSyncState('idle'), 3000);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full bg-[#111] text-white">
      <div className="h-14 border-b border-neutral-900 flex items-center justify-between px-6 shrink-0 relative z-10">
        <span className="text-xs font-serif tracking-widest text-[#C9A227] uppercase">System Settings</span>
        {onClose && (
          <button onClick={onClose} className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/5 rounded-full"><X className="w-4 h-4" /></button>
        )}
      </div>
      <div className="flex-1 space-y-6 p-6 lg:p-10 max-w-5xl mx-auto overflow-y-auto w-full custom-scrollbar">
        
        {/* Layout Synchronization Panel */}
        <div className="bg-[#111] border border-neutral-900 rounded p-6 space-y-4">
           <div className="flex items-center space-x-3 mb-4">
              <LayoutTemplate className="w-5 h-5 text-[#C9A227]" />
              <h3 className="font-serif text-white tracking-widest uppercase text-sm">Layout Synchronization</h3>
           </div>
           
           <p className="text-neutral-400 text-xs leading-relaxed max-w-lg">
             The Layout Engine automatically synchronizes when content is saved. You can also manually trigger a layout recalculation here without modifying any underlying data or CSS.
           </p>
           
           <div className="bg-black border border-neutral-800 p-4 rounded-md space-y-4 max-w-lg">
             <div className="flex flex-col space-y-2 text-[10px] uppercase font-mono tracking-wider text-neutral-500">
               <div className="flex items-center space-x-2">
                 <CheckCircle2 className="w-3 h-3 text-emerald-500/50" />
                 <span>Recalculate Navigation Height</span>
               </div>
               <div className="flex items-center space-x-2">
                 <CheckCircle2 className="w-3 h-3 text-emerald-500/50" />
                 <span>Refresh Sticky Header Offset</span>
               </div>
               <div className="flex items-center space-x-2">
                 <CheckCircle2 className="w-3 h-3 text-emerald-500/50" />
                 <span>Refresh Anchor Positions</span>
               </div>
               <div className="flex items-center space-x-2">
                 <CheckCircle2 className="w-3 h-3 text-emerald-500/50" />
                 <span>Trigger Responsive Reflow</span>
               </div>
             </div>
             
             <div className="pt-2 border-t border-neutral-900">
               <button 
                 onClick={handleManualSync}
                 disabled={syncState !== 'idle'}
                 className="flex items-center justify-center space-x-2 w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-white rounded text-xs uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 {syncState === 'syncing' ? (
                   <>
                     <Loader2 className="w-4 h-4 animate-spin text-[#C9A227]" />
                     <span className="text-[#C9A227]">Synchronizing Layout...</span>
                   </>
                 ) : syncState === 'done' ? (
                   <>
                     <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                     <span className="text-emerald-500">Layout Synchronized</span>
                   </>
                 ) : (
                   <>
                     <RefreshCw className="w-4 h-4" />
                     <span>Recalculate Layout</span>
                   </>
                 )}
               </button>
             </div>
           </div>
        </div>

        {/* Existing System Settings Panel */}
        <div className="bg-[#111] border border-neutral-900 rounded p-6 space-y-4">
          <h3 className="font-serif text-[#C9A227] tracking-widest uppercase text-sm">Storage Configuration</h3>
          <p className="text-neutral-500 text-xs">Global configuration for Cloudflare R2, Storage, and Upload defaults.</p>
          <div className="text-left text-[11px] font-mono tracking-wider text-neutral-400 max-w-lg space-y-2 mt-4 border border-neutral-900 p-4 rounded bg-black">
             <div className="flex justify-between border-b border-neutral-900/50 pb-2">
               <span className="uppercase">Storage Region</span>
               <span className="text-white">Europe</span>
             </div>
             <div className="flex justify-between border-b border-neutral-900/50 pb-2">
               <span className="uppercase">Bucket</span>
               <span className="text-white">hyunkyum</span>
             </div>
             <div className="flex justify-between">
               <span className="uppercase">CDN</span>
               <span className="text-emerald-500">Active</span>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
