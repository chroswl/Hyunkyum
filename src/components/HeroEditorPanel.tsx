import React, { useState, useEffect } from 'react';
import { ThemeSettings } from '../types';
import { RotateCcw } from 'lucide-react';
import { FloatingEditor } from './admin/FloatingEditor';
import { MediaCropWrapper } from './admin/media';

interface HeroEditorPanelProps {
  theme: ThemeSettings;
  setTheme: React.Dispatch<React.SetStateAction<ThemeSettings>>;
  onSave: () => Promise<void>;
  onReset: () => void;
  initialTheme: ThemeSettings | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function HeroEditorPanel({ theme, setTheme, onSave, onReset, initialTheme, isOpen, onClose }: HeroEditorPanelProps) {
  // Unsaved changes logic
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  useEffect(() => {
    if (!initialTheme) return;
    const isDifferent = JSON.stringify(theme) !== JSON.stringify(initialTheme);
    setHasUnsavedChanges(isDifferent);
  }, [theme, initialTheme]);

  const [isSaving, setIsSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<{type: 'success'|'error', text: string} | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave();
      setToastMsg({ type: 'success', text: 'Design saved successfully!' });
      setTimeout(() => setToastMsg(null), 3000);
    } catch (e) {
      setToastMsg({ type: 'error', text: 'Failed to save.' });
      setTimeout(() => setToastMsg(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <FloatingEditor isOpen={isOpen} onClose={onClose} title="Hero Settings">
      <div className="space-y-6">
        {toastMsg && (
          <div className={`p-3 rounded text-xs tracking-wider uppercase font-sans text-center ${toastMsg.type === 'success' ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30' : 'bg-rose-950/80 text-rose-400 border border-rose-500/30'}`}>
            {toastMsg.text}
          </div>
        )}

        <div className="flex items-center space-x-2">
          <button 
            onClick={handleSave} 
            disabled={isSaving || !hasUnsavedChanges}
            className={`flex-1 py-2 rounded-sm text-xs font-semibold uppercase tracking-widest transition-colors ${hasUnsavedChanges ? 'bg-[#C9A227] text-black hover:bg-[#ebd04e] shadow-[0_0_15px_rgba(201,162,39,0.3)]' : 'bg-white/5 text-white/30 cursor-not-allowed'}`}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
          
          <button 
            onClick={onReset}
            disabled={!hasUnsavedChanges}
            className={`px-3 py-2 border rounded-sm transition-colors ${hasUnsavedChanges ? 'border-rose-500/30 text-rose-400 hover:bg-rose-500/10 cursor-pointer' : 'border-white/5 text-white/30 cursor-not-allowed'}`}
            title="Discard Unsaved Changes"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-white/[0.02] border border-white/5 rounded-sm">
            <label className="text-[10px] font-sans tracking-widest uppercase text-[#C9A227] mb-2 block">Hero Alignment</label>
            <div className="flex space-x-2">
              {(['left', 'center', 'right'] as const).map((align) => (
                <button
                  key={align}
                  onClick={() => setTheme({ ...theme, heroAlign: align })}
                  className={`flex-1 py-1.5 text-[10px] uppercase tracking-wider rounded-sm border transition-colors ${
                    theme.heroAlign === align 
                      ? 'border-[#C9A227] text-[#C9A227] bg-[#C9A227]/10' 
                      : 'border-white/10 text-neutral-400 hover:border-white/30'
                  }`}
                >
                  {align}
                </button>
              ))}
            </div>
          </div>
          
          <div className="p-4 bg-white/[0.02] border border-white/5 rounded-sm">
            <label className="text-[10px] font-sans tracking-widest uppercase text-[#C9A227] mb-2 block">Background Media URL</label>
            <input 
              type="text"
              value={theme.homeBg || ''}
              onChange={e => setTheme({...theme, homeBg: e.target.value})}
              className="w-full bg-black/40 border border-white/10 focus:border-[#C9A227] rounded-sm px-3 py-2 text-xs text-white focus:outline-none"
              placeholder="Image or YouTube URL"
            />
          </div>
          
          <div className="p-4 bg-white/[0.02] border border-white/5 rounded-sm">
            <label className="text-[10px] font-sans tracking-widest uppercase text-[#C9A227] mb-2 block">Vertical Offset (px)</label>
            <div className="flex justify-between items-center space-x-3">
              <input 
                type="range" 
                min="-200" max="200" step="10"
                value={theme.heroContentOffsetY ?? theme.heroOffsetY ?? 0}
                onChange={e => setTheme({...theme, heroContentOffsetY: Number(e.target.value)})}
                className="flex-1 accent-[#C9A227]"
              />
              <span className="text-[10px] text-[#C9A227] font-mono min-w-[40px] text-right">
                {theme.heroContentOffsetY ?? theme.heroOffsetY ?? 0}px
              </span>
            </div>
          </div>
          
          <div className="p-4 bg-white/[0.02] border border-white/5 rounded-sm">
            <label className="text-[10px] font-sans tracking-widest uppercase text-[#C9A227] mb-2 block">Hero Title Font Size (px)</label>
            <div className="flex justify-between items-center space-x-3">
              <input 
                type="range" 
                min="24" max="120" step="1"
                value={theme.heroTitleSize || 64}
                onChange={e => setTheme({...theme, heroTitleSize: Number(e.target.value)})}
                className="flex-1 accent-[#C9A227]"
              />
              <span className="text-[10px] text-[#C9A227] font-mono min-w-[40px] text-right">
                {theme.heroTitleSize || 64}px
              </span>
            </div>
          </div>
          
        </div>
      </div>
    </FloatingEditor>
  );
}
