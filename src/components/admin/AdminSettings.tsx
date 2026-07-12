import React from 'react';
import type { Language } from '../../types';

export default function AdminSettings({ currentLang }: { currentLang: Language }) {
  return (
    <div className="space-y-6 p-6 lg:p-10 max-w-5xl mx-auto overflow-y-auto h-full">
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
  );
}
