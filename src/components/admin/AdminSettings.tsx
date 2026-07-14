import React from 'react';
import type { Language } from '../../types';
import { X } from 'lucide-react';

export default function AdminSettings({ currentLang, onClose }: { currentLang: Language; onClose?: () => void }) {
  return (
    <div className="flex flex-col h-full bg-[#111]">
      <div className="h-14 border-b border-neutral-900 flex items-center justify-between px-6 shrink-0">
        <span className="text-xs font-serif tracking-widest text-[#C9A227] uppercase">Settings</span>
        {onClose && (
          <button onClick={onClose} className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/5 rounded-full"><X className="w-4 h-4" /></button>
        )}
      </div>
      <div className="flex-1 space-y-6 p-6 lg:p-10 max-w-5xl mx-auto overflow-y-auto w-full">
        <div className="bg-[#111] border border-neutral-900 p-8 rounded text-center space-y-4">
          <h3 className="font-serif text-[#C9A227] tracking-widest uppercase">System Settings</h3>
          <p className="text-neutral-500 text-sm">Global configuration for Cloudflare R2, Storage, and Upload defaults.</p>
          <div className="text-left text-xs text-neutral-400 max-w-sm mx-auto space-y-2 mt-4 border border-neutral-900 p-4 rounded bg-black">
             <p><strong>Storage Region:</strong> Europe</p>
             <p><strong>Bucket:</strong> hyunkyum</p>
             <p><strong>CDN:</strong> Active</p>
          </div>
        </div>
      </div>
    </div>
  );
}
