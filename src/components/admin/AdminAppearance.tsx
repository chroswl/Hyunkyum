import React, { useState, useEffect } from 'react';
import type { Language } from '../../types';
import { useAppearance } from '../../contexts/AppearanceContext';
import { saveAppearanceSettings } from '../../services/appearanceService';
import DraggableWindow from './DraggableWindow';
import PropertyAccordion from './PropertyAccordion';
import AppearanceHistoryPanel from './AppearanceHistoryPanel';
import { Save, RefreshCw, Palette, Type, LayoutGrid, Navigation, Wand2, Image as ImageIcon, History } from 'lucide-react';
import { AppearanceSettings } from '../../types/appearance';


import { defaultAppearanceSettings } from '../../types/appearance';

const PRESETS = {
  classic: defaultAppearanceSettings,
  minimalLight: {
    ...defaultAppearanceSettings,
    theme: "light",
    colors: {
      ...defaultAppearanceSettings.colors,
      primary: "#111111",
      secondary: "#555555",
      accent: "#000000",
      background: "#ffffff",
      surface: "#f5f5f5",
      text: "#111111",
      muted: "#888888",
      navigation: "#ffffff",
      footer: "#f5f5f5",
      buttons: "#111111",
      links: "#111111",
      hover: "#333333"
    },
    typography: {
      ...defaultAppearanceSettings.typography,
      headingFont: "Inter",
      bodyFont: "Inter"
    }
  },
  midnightOnyx: {
    ...defaultAppearanceSettings,
    theme: "dark",
    colors: {
      ...defaultAppearanceSettings.colors,
      primary: "#ffffff",
      secondary: "#a0a0a0",
      accent: "#4ea8de",
      background: "#050505",
      surface: "#111111",
      text: "#ffffff",
      muted: "#777777",
      navigation: "#050505",
      footer: "#050505",
      buttons: "#4ea8de",
      links: "#4ea8de",
      hover: "#ffffff"
    },
    typography: {
      ...defaultAppearanceSettings.typography,
      headingFont: "Playfair Display",
      bodyFont: "Inter"
    }
  }
};

export default function AdminAppearance({ currentLang, onBack, onClose }: { currentLang: Language, onBack?: () => void, onClose?: () => void }) {
  const { appearance, updateAppearance } = useAppearance();
  const [activeTab, setActiveTab] = useState<'editor'|'history'>('editor');
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [publishNote, setPublishNote] = useState('');
  const [localState, setLocalState] = useState<AppearanceSettings>(appearance);

  // History tracking for Undo/Redo
  const [history, setHistory] = useState<AppearanceSettings[]>([appearance]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Sync when appearance context changes from DB load
  useEffect(() => {
    // Only if we haven't made local changes
    if (history.length === 1) {
      setLocalState(appearance);
      setHistory([appearance]);
      setHistoryIndex(0);
    }
  }, [appearance]);

  const pushHistory = (newState: AppearanceSettings) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);
    if (newHistory.length > 50) newHistory.shift(); // Max 50 steps
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setLocalState(newState);
    updateAppearance(newState); // live preview
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setLocalState(prev);
      updateAppearance(prev);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setLocalState(next);
      updateAppearance(next);
    }
  };

  // Keyboard shortcuts for Undo/Redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [history, historyIndex]);



  const handleUpdate = (section: keyof AppearanceSettings, field: string, value: any) => {
    const updated = {
      ...localState,
      [section]: typeof localState[section] === 'object' ? {
        ...(localState[section] as any),
        [field]: value
      } : value
    };
    pushHistory(updated);
  };

  const handleRootUpdate = (field: keyof AppearanceSettings, value: any) => {
     const updated = {
      ...localState,
      [field]: value
     };
     pushHistory(updated);
  };

const handlePublishClick = () => {
    setIsPublishModalOpen(true);
    setPublishNote('');
  };

  const handleConfirmPublish = async () => {
    setIsSaving(true);
    try {
      await saveAppearanceSettings(localState, publishNote, 'Admin');
      // Reset history baseline
      setHistory([localState]);
      setHistoryIndex(0);
      setIsPublishModalOpen(false);
      alert('Appearance settings published and snapshot created!');
    } catch (error) {
      console.error("Failed to save:", error);
      alert('Failed to publish appearance settings');
    } finally {
      setIsSaving(false);
    }
  };


  const applyPreset = (presetKey: keyof typeof PRESETS) => {
    const preset = PRESETS[presetKey];
    pushHistory(preset as any);
  };

  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  useEffect(() => {
    document.body.setAttribute('data-preview-mode', previewMode);
    return () => {
      document.body.removeAttribute('data-preview-mode');
    };
  }, [previewMode]);

  return (
    <DraggableWindow title="Appearance Editor" id="appearance-editor" icon={<Palette className="w-4 h-4 text-accent" />} onClose={onClose || onBack || (() => {})}>
    <div className="flex flex-col h-full bg-[#0a0a0a] overflow-hidden">

      {/* Publish Modal */}
      {isPublishModalOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#111] border border-neutral-800 rounded-lg shadow-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-serif text-white mb-2">Publish Appearance</h3>
            <p className="text-xs text-neutral-400 mb-4">This will save your current appearance configuration and create a version history snapshot.</p>
            
            <div className="mb-6">
              <label className="block text-[10px] uppercase tracking-widest text-neutral-500 mb-2">Version Note (Optional)</label>
              <input 
                type="text" 
                placeholder="e.g., 'Winter Theme', 'Updated Typography'"
                value={publishNote}
                onChange={(e) => setPublishNote(e.target.value)}
                className="w-full bg-black border border-neutral-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-accent transition-colors"
                autoFocus
              />
            </div>
            
            <div className="flex items-center justify-end space-x-3">
              <button 
                onClick={() => setIsPublishModalOpen(false)}
                className="px-4 py-2 text-xs text-neutral-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmPublish}
                disabled={isSaving}
                className="bg-accent hover:bg-[#ebd04e] text-black px-6 py-2 rounded text-xs font-semibold transition-colors flex items-center space-x-2 disabled:opacity-50"
              >
                {isSaving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                <span>Publish</span>
              </button>
            </div>
          </div>
        </div>
      )}

{/* Header */}
      <div className="flex flex-col border-b border-neutral-900 shrink-0 bg-[#111]">
        <div className="flex items-center justify-between p-4">
          <div>
            <h2 className="text-sm font-semibold text-white tracking-wider flex items-center space-x-2">
              <span>Appearance Control Center</span>
            </h2>
            <p className="text-[10px] text-neutral-500 mt-1 uppercase tracking-widest">Live Visual Inspector</p>
          </div>
          <div className="flex items-center bg-black p-1 rounded border border-neutral-800">
            <button onClick={() => setActiveTab('editor')} className={`px-3 py-1.5 flex items-center space-x-1 text-[10px] rounded uppercase tracking-widest transition-colors ${activeTab === 'editor' ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-white'}`}>
              <Palette className="w-3 h-3" />
              <span>Editor</span>
            </button>
            <button onClick={() => setActiveTab('history')} className={`px-3 py-1.5 flex items-center space-x-1 text-[10px] rounded uppercase tracking-widest transition-colors ${activeTab === 'history' ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-white'}`}>
              <History className="w-3 h-3" />
              <span>History</span>
            </button>
          </div>
        </div>
        
        {activeTab === 'editor' && (
          <div className="flex items-center justify-between px-4 pb-4">
            <div className="flex items-center space-x-1 bg-black p-1 rounded border border-neutral-800">
              <button onClick={() => setPreviewMode('desktop')} className={`px-2 py-1 text-[9px] rounded uppercase tracking-widest transition-colors ${previewMode === 'desktop' ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-white'}`}>Desktop</button>
              <button onClick={() => setPreviewMode('tablet')} className={`px-2 py-1 text-[9px] rounded uppercase tracking-widest transition-colors ${previewMode === 'tablet' ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-white'}`}>Tablet</button>
              <button onClick={() => setPreviewMode('mobile')} className={`px-2 py-1 text-[9px] rounded uppercase tracking-widest transition-colors ${previewMode === 'mobile' ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-white'}`}>Mobile</button>
            </div>
          </div>
        )}
      </div>
      {/* Main Content Space */}
      <div className="flex-1 overflow-y-auto p-6 lg:p-10">
        <div className="max-w-4xl mx-auto space-y-6">

          
          {/* Theme Presets */}
          <div className="bg-[#111] border border-neutral-900 rounded p-6">
             <h3 className="font-serif text-accent tracking-widest uppercase mb-4 text-sm flex items-center"><Wand2 className="w-4 h-4 mr-2"/> Quick Presets</h3>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button onClick={() => applyPreset('classic')} className="py-2 px-3 text-xs text-left rounded border border-neutral-800 hover:border-accent transition-colors bg-black">
                  <div className="font-bold text-white mb-1">Opera Classic</div>
                  <div className="text-neutral-500 text-[10px]">Dark & Gold</div>
                </button>
                <button onClick={() => applyPreset('minimalLight')} className="py-2 px-3 text-xs text-left rounded border border-neutral-800 hover:border-accent transition-colors bg-white">
                  <div className="font-bold text-black mb-1">Minimal White</div>
                  <div className="text-neutral-500 text-[10px]">Clean & Modern</div>
                </button>
                <button onClick={() => applyPreset('midnightOnyx')} className="py-2 px-3 text-xs text-left rounded border border-neutral-800 hover:border-accent transition-colors bg-[#050505]">
                  <div className="font-bold text-[#4ea8de] mb-1">Midnight Onyx</div>
                  <div className="text-neutral-500 text-[10px]">Deep Dark & Blue</div>
                </button>
             </div>
          </div>

          {/* Theme Mode */}
          <div className="bg-[#111] border border-neutral-900 rounded p-6">
             <h3 className="font-serif text-accent tracking-widest uppercase mb-4 text-sm flex items-center"><Palette className="w-4 h-4 mr-2"/> Theme Mode</h3>
             <div className="flex space-x-4">
                {['dark', 'light', 'system'].map(mode => (
                  <button 
                    key={mode}
                    onClick={() => handleRootUpdate('theme', mode)}
                    className={`flex-1 py-3 text-sm rounded border capitalize transition-colors ${localState.theme === mode ? 'border-accent bg-accent/10 text-accent' : 'border-neutral-800 text-neutral-400 hover:border-neutral-600'}`}
                  >
                    {mode}
                  </button>
                ))}
             </div>
          </div>

          {/* Colors */}
          <PropertyAccordion title="Color Palette" icon={<Palette className="w-4 h-4" />} defaultOpen>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {Object.entries(localState.colors).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between bg-black p-3 border border-neutral-900 rounded">
                    <span className="text-xs text-neutral-400 capitalize">{key}</span>
                    <div className="flex items-center space-x-3">
                       <span className="text-xs font-mono text-neutral-500 uppercase">{value}</span>
                       <div className="relative w-8 h-8 rounded border border-neutral-700 overflow-hidden cursor-pointer">
                         <input 
                           type="color" 
                           value={value as string}
                           onChange={(e) => handleUpdate('colors', key, e.target.value)}
                           className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer"
                         />
                       </div>
                    </div>
                  </div>
               ))}
             </div>
          </PropertyAccordion>

          {/* Typography */}
          <PropertyAccordion title="Typography" icon={<Type className="w-4 h-4" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-neutral-500">Heading Font</label>
                <select 
                  value={localState.typography.headingFont}
                  onChange={(e) => handleUpdate('typography', 'headingFont', e.target.value)}
                  className="w-full bg-black border border-neutral-800 rounded px-3 py-2 text-sm text-white"
                >
                  <option value="Courier New, Courier, monospace">Courier New</option>
                  <option value="Cormorant Garamond, serif">Cormorant Garamond</option>
                  <option value="Playfair Display, serif">Playfair Display</option>
                  <option value="Inter, sans-serif">Inter</option>
                  <option value="system-ui, sans-serif">System UI</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-neutral-500">Body Font</label>
                <select 
                  value={localState.typography.bodyFont}
                  onChange={(e) => handleUpdate('typography', 'bodyFont', e.target.value)}
                  className="w-full bg-black border border-neutral-800 rounded px-3 py-2 text-sm text-white"
                >
                  <option value="Courier New, Courier, monospace">Courier New</option>
                  <option value="Inter, sans-serif">Inter</option>
                  <option value="Roboto, sans-serif">Roboto</option>
                  <option value="system-ui, sans-serif">System UI</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-neutral-500 flex justify-between">
                  <span>Base Font Size</span>
                  <span className="text-accent">{localState.typography.baseFontSize}px</span>
                </label>
                <input 
                  type="range" min="12" max="24" step="1"
                  value={localState.typography.baseFontSize}
                  onChange={(e) => handleUpdate('typography', 'baseFontSize', Number(e.target.value))}
                  className="w-full accent-accent"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-neutral-500 flex justify-between">
                  <span>Heading Scale</span>
                  <span className="text-accent">{localState.typography.headingScale}x</span>
                </label>
                <input 
                  type="range" min="1" max="2" step="0.05"
                  value={localState.typography.headingScale}
                  onChange={(e) => handleUpdate('typography', 'headingScale', Number(e.target.value))}
                  className="w-full accent-accent"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-neutral-500 flex justify-between">
                  <span>Line Height</span>
                  <span className="text-accent">{localState.typography.lineHeight}</span>
                </label>
                <input 
                  type="range" min="1" max="2.5" step="0.1"
                  value={localState.typography.lineHeight}
                  onChange={(e) => handleUpdate('typography', 'lineHeight', Number(e.target.value))}
                  className="w-full accent-accent"
                />
              </div>

            </div>
          </PropertyAccordion>

          {/* Layout */}
          <PropertyAccordion title="Layout & Spacing" icon={<LayoutGrid className="w-4 h-4" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-neutral-500 flex justify-between">
                  <span>Max Width</span>
                  <span className="text-accent">{localState.layout.maxWidth}px</span>
                </label>
                <input 
                  type="range" min="800" max="1920" step="10"
                  value={localState.layout.maxWidth}
                  onChange={(e) => handleUpdate('layout', 'maxWidth', Number(e.target.value))}
                  className="w-full accent-accent"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-neutral-500 flex justify-between">
                  <span>Section Spacing</span>
                  <span className="text-accent">{localState.layout.sectionSpacing}px</span>
                </label>
                <input 
                  type="range" min="40" max="300" step="10"
                  value={localState.layout.sectionSpacing}
                  onChange={(e) => handleUpdate('layout', 'sectionSpacing', Number(e.target.value))}
                  className="w-full accent-accent"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-neutral-500 flex justify-between">
                  <span>Border Radius</span>
                  <span className="text-accent">{localState.layout.borderRadius}px</span>
                </label>
                <input 
                  type="range" min="0" max="40" step="1"
                  value={localState.layout.borderRadius}
                  onChange={(e) => handleUpdate('layout', 'borderRadius', Number(e.target.value))}
                  className="w-full accent-accent"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-neutral-500 flex justify-between">
                  <span>Content Spacing</span>
                  <span className="text-accent">{localState.layout.contentSpacing}px</span>
                </label>
                <input 
                  type="range" min="16" max="120" step="4"
                  value={localState.layout.contentSpacing}
                  onChange={(e) => handleUpdate('layout', 'contentSpacing', Number(e.target.value))}
                  className="w-full accent-accent"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-neutral-500 flex justify-between">
                  <span>Card Padding</span>
                  <span className="text-accent">{localState.layout.cardPadding}px</span>
                </label>
                <input 
                  type="range" min="0" max="64" step="4"
                  value={localState.layout.cardPadding}
                  onChange={(e) => handleUpdate('layout', 'cardPadding', Number(e.target.value))}
                  className="w-full accent-accent"
                />
              </div>
            </div>
          </PropertyAccordion>

          {/* Navigation */}
          <PropertyAccordion title="Navigation Component" icon={<Navigation className="w-4 h-4" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between p-3 border border-neutral-900 rounded bg-black">
                <span className="text-xs text-neutral-400">Sticky Navbar</span>
                <input 
                  type="checkbox" 
                  checked={localState.navigation.sticky}
                  onChange={(e) => handleUpdate('navigation', 'sticky', e.target.checked)}
                  className="accent-accent w-4 h-4"
                />
              </div>
              <div className="flex items-center justify-between p-3 border border-neutral-900 rounded bg-black">
                <span className="text-xs text-neutral-400">Glass Effect (Blur)</span>
                <input 
                  type="checkbox" 
                  checked={localState.navigation.blur}
                  onChange={(e) => handleUpdate('navigation', 'blur', e.target.checked)}
                  className="accent-accent w-4 h-4"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-neutral-500 flex justify-between">
                  <span>Height</span>
                  <span className="text-accent">{localState.navigation.height}px</span>
                </label>
                <input 
                  type="range" min="50" max="120" step="1"
                  value={localState.navigation.height}
                  onChange={(e) => handleUpdate('navigation', 'height', Number(e.target.value))}
                  className="w-full accent-accent"
                />
              </div>

              <div className="flex items-center justify-between p-3 border border-neutral-900 rounded bg-black">
                <span className="text-xs text-neutral-400">Transparent Background</span>
                <input 
                  type="checkbox" 
                  checked={localState.navigation.transparent}
                  onChange={(e) => handleUpdate('navigation', 'transparent', e.target.checked)}
                  className="accent-accent w-4 h-4"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-neutral-500 flex justify-between">
                  <span>Logo Size</span>
                  <span className="text-accent">{localState.navigation.logoSize}px</span>
                </label>
                <input 
                  type="range" min="12" max="64" step="1"
                  value={localState.navigation.logoSize}
                  onChange={(e) => handleUpdate('navigation', 'logoSize', Number(e.target.value))}
                  className="w-full accent-accent"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-neutral-500 flex justify-between">
                  <span>Menu Gap</span>
                  <span className="text-accent">{localState.navigation.menuGap}px</span>
                </label>
                <input 
                  type="range" min="8" max="64" step="4"
                  value={localState.navigation.menuGap}
                  onChange={(e) => handleUpdate('navigation', 'menuGap', Number(e.target.value))}
                  className="w-full accent-accent"
                />
              </div>
            </div>
          </PropertyAccordion>

          {/* Animation */}
          <PropertyAccordion title="Animation & Effects" icon={<Wand2 className="w-4 h-4" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="flex items-center justify-between p-3 border border-neutral-900 rounded bg-black">
                <span className="text-xs text-neutral-400">Enable Animations</span>
                <input 
                  type="checkbox" 
                  checked={localState.animation.enabled}
                  onChange={(e) => handleUpdate('animation', 'enabled', e.target.checked)}
                  className="accent-accent w-4 h-4"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-neutral-500">Animation Style</label>
                <select 
                  value={localState.animation.style}
                  onChange={(e) => handleUpdate('animation', 'style', e.target.value)}
                  className="w-full bg-black border border-neutral-800 rounded px-3 py-2 text-sm text-white"
                >
                  <option value="fade">Fade In</option>
                  <option value="slide">Slide Up</option>
                  <option value="none">None</option>
                </select>
              </div>

               <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-neutral-500">Speed</label>
                <select 
                  value={localState.animation.speed}
                  onChange={(e) => handleUpdate('animation', 'speed', e.target.value)}
                  className="w-full bg-black border border-neutral-800 rounded px-3 py-2 text-sm text-white"
                >
                  <option value="slow">Slow</option>
                  <option value="normal">Normal</option>
                  <option value="fast">Fast</option>
                </select>
              </div>
            </div>
          </PropertyAccordion>

           {/* Portfolio Config */}
           <PropertyAccordion title="Portfolio Archive" icon={<ImageIcon className="w-4 h-4" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-neutral-500 flex justify-between">
                  <span>Grid Columns</span>
                  <span className="text-accent">{localState.portfolio.columns}</span>
                </label>
                <input 
                  type="range" min="1" max="4" step="1"
                  value={localState.portfolio.columns}
                  onChange={(e) => handleUpdate('portfolio', 'columns', Number(e.target.value))}
                  className="w-full accent-accent"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-neutral-500 flex justify-between">
                  <span>Grid Gap</span>
                  <span className="text-accent">{localState.portfolio.gap}px</span>
                </label>
                <input 
                  type="range" min="0" max="64" step="4"
                  value={localState.portfolio.gap}
                  onChange={(e) => handleUpdate('portfolio', 'gap', Number(e.target.value))}
                  className="w-full accent-accent"
                />
              </div>
            </div>
          </PropertyAccordion>

        </div>
      </div>

      {/* Footer */}
      {activeTab === "editor" && (
      <div className="flex items-center justify-between p-4 border-t border-neutral-900 bg-[#0a0a0a] shrink-0">
        <div className="flex items-center space-x-2">
           <button 
             onClick={handleUndo} 
             disabled={historyIndex === 0}
             className="p-1.5 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-colors" title="Undo (Cmd+Z)"
           >
             <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path></svg>
           </button>
           <button 
             onClick={handleRedo} 
             disabled={historyIndex === history.length - 1}
             className="p-1.5 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-colors" title="Redo (Cmd+Shift+Z)"
           >
             <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6"></path></svg>
           </button>
           
           <span className={`text-[9px] uppercase tracking-widest ml-2 ${JSON.stringify(localState) !== JSON.stringify(appearance) ? 'text-accent' : 'text-neutral-500'}`}>
             {JSON.stringify(localState) !== JSON.stringify(appearance) ? 'Unsaved Changes' : 'All changes saved'}
           </span>
        </div>
        <div className="flex items-center space-x-2">

          <button 
            onClick={() => { setLocalState(appearance); updateAppearance(appearance); setHistory([appearance]); setHistoryIndex(0); }} 
            disabled={JSON.stringify(localState) === JSON.stringify(appearance)}
            className="px-3 py-1.5 text-[9px] tracking-widest uppercase text-neutral-400 hover:text-white disabled:opacity-50 transition-colors"
          >
            Discard
          </button>
          <button 
            onClick={() => { localStorage.setItem('appearance_draft', JSON.stringify(localState)); alert('Draft saved locally!'); }} 
            disabled={JSON.stringify(localState) === JSON.stringify(appearance)}
            className="px-3 py-1.5 text-[9px] tracking-widest uppercase text-neutral-400 hover:text-white disabled:opacity-50 transition-colors"
          >
            Save Draft
          </button>
          <button

            onClick={handlePublishClick}
            disabled={isSaving || JSON.stringify(localState) === JSON.stringify(appearance)}
            className="bg-accent hover:bg-[#ebd04e] text-black px-4 py-1.5 rounded text-[9px] tracking-widest uppercase font-semibold transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
            <span>Publish</span>
          </button>
        </div>
      </div>
      )}
    </div>
    </DraggableWindow>
  );
}
