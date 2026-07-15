import React, { ReactNode, useState } from 'react';
import { Undo, Redo, RotateCcw, X, CheckCircle2, Loader2 } from 'lucide-react';
import { useAppearance } from '../../contexts/AppearanceContext';
import { triggerLayoutSync } from '../../lib/layoutSync';
import { AnimatePresence, motion } from 'motion/react';

interface AdminLayoutProps {
  toolbar?: ReactNode; // Deprecated, kept for backward compatibility
  preview?: ReactNode; // Deprecated, kept for backward compatibility
  properties: ReactNode;
  onSave?: () => void | Promise<void>;
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
  const [syncState, setSyncState] = useState<'idle' | 'syncing' | 'done'>('idle');

  const handleActionSave = async () => {
    if (!onSave) return;
    
    try {
      await onSave();
      
      setSyncState('syncing');
      triggerLayoutSync();
      
      setTimeout(() => setSyncState('done'), 1500);
      setTimeout(() => setSyncState('idle'), 3500);
    } catch (e) {
      console.error(e);
      setSyncState('idle');
    }
  };

  return (
    <div className="flex flex-col w-full h-full bg-[#111] text-white font-sans animate-in fade-in duration-300">
      <div className="h-14 border-b border-neutral-900 flex items-center justify-between px-6 shrink-0 relative z-10">
         <span className="text-xs font-serif tracking-widest text-[#C9A227] uppercase">{title || 'Properties'}</span>
         <div className="flex items-center space-x-3">
           <button onClick={onReset} className="p-2 text-neutral-500 hover:text-white transition-colors rounded hover:bg-white/5" title="Reset">
             <RotateCcw className="w-4 h-4" />
           </button>
           <button onClick={handleActionSave} disabled={!hasChanges || isSaving} className={`px-4 py-1.5 rounded text-[10px] uppercase tracking-wider font-semibold transition-colors ${hasChanges ? 'bg-[#C9A227] text-black hover:bg-[#ebd04e]' : 'bg-neutral-800 text-neutral-500'}`}>
             {isSaving ? 'Saving...' : 'Save'}
           </button>
           {onClose && (
             <button onClick={onClose} className="p-1.5 ml-2 text-neutral-400 hover:text-white hover:bg-white/5 rounded-full"><X className="w-4 h-4" /></button>
           )}
         </div>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-0 relative">
         {properties}

         {/* Layout Sync Overlay */}
         <AnimatePresence>
           {syncState !== 'idle' && (
             <motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
             >
               <motion.div
                 initial={{ scale: 0.95, opacity: 0 }}
                 animate={{ scale: 1, opacity: 1 }}
                 exit={{ scale: 0.95, opacity: 0 }}
                 className="bg-neutral-950 border border-neutral-800 p-6 rounded-lg w-full max-w-sm flex flex-col space-y-4"
               >
                 <div className="flex items-center space-x-3 mb-2">
                   {syncState === 'syncing' ? (
                     <Loader2 className="w-5 h-5 text-[#C9A227] animate-spin" />
                   ) : (
                     <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                   )}
                   <h3 className="text-sm font-serif text-white tracking-widest uppercase">
                     {syncState === 'syncing' ? 'Synchronizing Layout...' : 'Layout Synchronized'}
                   </h3>
                 </div>
                 
                 <div className="space-y-2 text-[10px] font-mono tracking-wider text-neutral-400 uppercase">
                   <div className="flex items-center space-x-2">
                     <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                     <span>Content Saved</span>
                   </div>
                   <div className="flex items-center space-x-2">
                     {syncState === 'done' ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <div className="w-3 h-3 border border-neutral-600 rounded-full" />}
                     <span className={syncState === 'done' ? 'text-white' : ''}>Navigation Updated</span>
                   </div>
                   <div className="flex items-center space-x-2">
                     {syncState === 'done' ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <div className="w-3 h-3 border border-neutral-600 rounded-full" />}
                     <span className={syncState === 'done' ? 'text-white' : ''}>Landing Updated</span>
                   </div>
                   <div className="flex items-center space-x-2">
                     {syncState === 'done' ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <div className="w-3 h-3 border border-neutral-600 rounded-full" />}
                     <span className={syncState === 'done' ? 'text-white' : ''}>Responsive Updated</span>
                   </div>
                 </div>
               </motion.div>
             </motion.div>
           )}
         </AnimatePresence>
      </div>
    </div>
  );
}
