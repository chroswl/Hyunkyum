import React, { useState, useEffect, useRef } from 'react';
import { Rnd } from 'react-rnd';
import { ThemeSettings } from '../types';
import { Sliders, ChevronDown, ChevronUp, Save, RotateCcw, X, LayoutTemplate } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HeroEditorPanelProps {
  theme: ThemeSettings;
  setTheme: React.Dispatch<React.SetStateAction<ThemeSettings>>;
  isEditingText: boolean;
  setIsEditingText: (val: boolean) => void;
  onSave: () => Promise<void>;
  onReset: () => void;
  initialTheme: ThemeSettings | null; // To check unsaved changes
}

export default function HeroEditorPanel({ theme, setTheme, isEditingText, setIsEditingText, onSave, onReset, initialTheme }: HeroEditorPanelProps) {
  const [isExpanded, setIsExpanded] = useState(() => {
    return localStorage.getItem('heroEditorExpanded') !== 'false';
  });
  const [opacity, setOpacity] = useState(() => {
    return Number(localStorage.getItem('heroEditorOpacity')) || 85; // 85% default for better visibility
  });
  
  // Section toggle state
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem('heroEditorSections') || '{}');
    } catch {
      return {};
    }
  });

  const toggleSection = (id: string) => {
    const next = { ...expandedSections, [id]: !expandedSections[id] };
    setExpandedSections(next);
    localStorage.setItem('heroEditorSections', JSON.stringify(next));
  };

  useEffect(() => {
    localStorage.setItem('heroEditorExpanded', isExpanded.toString());
  }, [isExpanded]);

  useEffect(() => {
    localStorage.setItem('heroEditorOpacity', opacity.toString());
  }, [opacity]);

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

  const handleReset = () => {
    if (true) {
      onReset();
    }
  };

  // If text edit mode is ON, we show a minimized floating toolbar instead of the full panel
  if (isEditingText) {
    return (
      <Rnd
        default={{
          x: window.innerWidth / 2 - 150,
          y: 40,
          width: 300,
          height: 'auto',
        }}
        enableResizing={false}
        dragHandleClassName="drag-handle"
        bounds="window"
        className="z-[9999] admin-panel-exclude fixed"
      >
        <div className="bg-neutral-950/90 border border-accent/50 rounded-full px-4 py-2.5 shadow-2xl backdrop-blur-md text-white flex items-center justify-between">
          <div className="drag-handle flex items-center space-x-2 cursor-grab active:cursor-grabbing mr-4">
            <LayoutTemplate className="w-4 h-4 text-accent" />
            <span className="font-serif text-[11px] tracking-widest uppercase hidden sm:inline-block">Text Edit Mode</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <button 
              onClick={() => setIsEditingText(false)}
              className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-3 py-1.5 rounded-full text-[10px] uppercase tracking-wider font-semibold transition-colors"
            >
              Settings
            </button>
            <button 
              onClick={() => {
                // To properly cancel, we could restore initialTheme, but just disabling mode is fine for WYSIWYG
                if (initialTheme) setTheme(initialTheme);
                setIsEditingText(false);
              }}
              className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 px-3 py-1.5 rounded-full text-[10px] uppercase tracking-wider font-semibold transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={() => setIsEditingText(false)}
              className="bg-accent hover:bg-[#ebd04e] text-black px-4 py-1.5 rounded-full text-[10px] uppercase tracking-wider font-semibold transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </Rnd>
    );
  }

  return (
    <Rnd
      default={{
        x: Number(localStorage.getItem('heroEditorX')) || 24,
        y: Number(localStorage.getItem('heroEditorY')) || window.innerHeight - 500,
        width: Number(localStorage.getItem('heroEditorWidth')) || 320,
        height: 'auto',
      }}
      minWidth={280}
      maxWidth={600}
      bounds="window"
      onDragStop={(e, d) => {
        localStorage.setItem('heroEditorX', d.x.toString());
        localStorage.setItem('heroEditorY', d.y.toString());
      }}
      onResizeStop={(e, direction, ref, delta, position) => {
        localStorage.setItem('heroEditorWidth', ref.style.width);
        localStorage.setItem('heroEditorX', position.x.toString());
        localStorage.setItem('heroEditorY', position.y.toString());
      }}
      dragHandleClassName="drag-handle"
      className="z-[9999] admin-panel-exclude fixed"
    >
      <div 
        className="border border-accent/50 rounded shadow-2xl backdrop-blur-md text-white flex flex-col h-full transition-opacity duration-200"
        style={{ 
          backgroundColor: `rgba(10, 10, 10, ${opacity / 100})`,
        }}
      >
        {/* Header (Draggable) */}
        <div className="drag-handle flex items-center justify-between px-2 py-1.5 border-b border-neutral-900 cursor-grab active:cursor-grabbing bg-white/5 rounded-t">
          <div className="flex items-center space-x-1.5">
            <Sliders className="w-4 h-4 text-accent" />
            <span className="font-serif text-[11px] tracking-wider uppercase text-neutral-200 select-none">
              Hero Design Editor
            </span>
            {hasUnsavedChanges && (
              <span className="text-[10px] text-accent ml-2 flex items-center space-x-1 uppercase tracking-widest font-sans">
                <span className="w-1.5 h-1 rounded-full bg-accent animate-pulse"></span>
                <span>Unsaved</span>
              </span>
            )}
          </div>
          <div className="flex items-center space-x-1.5 cursor-auto" onMouseDown={e => e.stopPropagation()}>
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
              title={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Body */}
        {isExpanded && (
          <div className="p-2 space-y-3 overflow-y-auto max-h-[70vh] custom-scrollbar">
            {toastMsg && (
              <div className={`p-2 rounded text-[10px] text-center font-sans ${
                toastMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}>
                {toastMsg.text}
              </div>
            )}

            {/* General Actions */}
            <div className="flex items-center justify-between pb-1">
              <button 
                onClick={() => setIsEditingText(true)}
                className="px-2.5 py-1.5 rounded bg-accent/10 text-accent hover:bg-accent/20 border border-accent/30 text-[10px] uppercase tracking-wider font-semibold transition-colors flex items-center space-x-1"
              >
                <LayoutTemplate className="w-3 h-3" />
                <span>Text Edit Mode</span>
              </button>
              
              <div className="flex items-center space-x-1.5">
                <span className="text-[9px] text-neutral-500 uppercase tracking-widest font-sans font-semibold">Opacity</span>
                <select 
                  value={opacity} 
                  onChange={(e) => setOpacity(Number(e.target.value))}
                  className="bg-neutral-900 border border-neutral-800 text-[10px] rounded px-1.5 py-0.5 outline-none text-neutral-300 font-sans cursor-pointer h-6"
                >
                  <option value={100}>100%</option>
                  <option value={90}>90%</option>
                  <option value={85}>85%</option>
                  <option value={80}>80%</option>
                  <option value={70}>70%</option>
                  <option value={60}>60%</option>
                  <option value={50}>50%</option>
                  <option value={40}>40%</option>
                </select>
              </div>
            </div>

            
            {/* Global Settings */}
            <div className="space-y-2 pt-2 border-t border-neutral-900">
              <div className="space-y-1">
                <span className="text-[10px] text-neutral-400 font-sans block uppercase tracking-widest font-semibold">Global Alignment</span>
                <div className="grid grid-cols-3 gap-1">
                  {(['left', 'center', 'right'] as const).map((align) => (
                    <button
                      key={align}
                      onClick={() => setTheme(prev => ({ ...prev, heroAlign: align }))}
                      className={`py-1 rounded border text-[10px] uppercase tracking-wider flex items-center justify-center space-x-1 transition-all ${
                        (theme.heroAlign || 'center') === align 
                          ? 'border-accent bg-accent/10 text-accent font-semibold' 
                          : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      <span>{align}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-neutral-400 font-sans uppercase tracking-widest font-semibold">
                  <span>Global Y-Offset</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <input 
                    type="range" min="-300" max="300" 
                    value={theme.heroOffsetY || 0} 
                    onChange={(e) => setTheme(prev => ({ ...prev, heroOffsetY: parseInt(e.target.value) || 0 }))} 
                    className="w-full accent-accent bg-neutral-900 h-1 rounded-sm appearance-none cursor-pointer" 
                  />
                  <input 
                    type="number"
                    value={theme.heroOffsetY || 0} 
                    onChange={(e) => setTheme(prev => ({ ...prev, heroOffsetY: parseInt(e.target.value) || 0 }))} 
                    className="w-12 bg-neutral-900 border border-neutral-800 text-white text-[10px] px-1.5 py-0.5 rounded text-center focus:outline-none focus:border-accent font-mono h-6"
                  />
                </div>
              </div>
            </div>

            {/* Elements */}

            <div className="space-y-2 pt-3 border-t border-neutral-900">
              {[
                { id: 'Subtitle', keySize: 'heroSubtitleSize', keyX: 'heroSubtitleOffsetX', keyY: 'heroSubtitleOffsetY', defaultSize: 14, label: 'Subtitle (소제목)' },
                { id: 'Title', keySize: 'heroTitleSize', keyX: 'heroTitleOffsetX', keyY: 'heroTitleOffsetY', defaultSize: 64, label: 'Main Title (대제목)' },
                { id: 'Desc', keySize: 'heroDescSize', keyX: 'heroDescOffsetX', keyY: 'heroDescOffsetY', defaultSize: 16, label: 'Description (설명)' },
                { id: 'Button', keySize: 'heroButtonSize', keyX: 'heroButtonOffsetX', keyY: 'heroButtonOffsetY', defaultSize: 12, label: 'Button (버튼)' },
              ].map(elem => (
                <div key={elem.id} className="border border-neutral-800/80 rounded bg-neutral-950/40 overflow-hidden">
                  <button
                    onClick={() => toggleSection(elem.id)}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 hover:bg-neutral-900/60 transition-colors"
                  >
                    <span className="text-[10px] text-neutral-300 font-sans tracking-wider uppercase font-semibold">{elem.label}</span>
                    <div className="flex items-center space-x-1.5">
                      <span 
                        onClick={(e) => {
                          e.stopPropagation();
                          setTheme(prev => ({ 
                            ...prev, 
                            [elem.keySize]: elem.defaultSize,
                            [elem.keyX]: 0,
                            [elem.keyY]: 0
                          }));
                        }}
                        className="text-[9px] text-accent hover:underline uppercase tracking-wider cursor-pointer font-semibold"
                      >
                        Reset
                      </span>
                      {expandedSections[elem.id] ? <ChevronUp className="w-3 h-3 text-neutral-500" /> : <ChevronDown className="w-3 h-3 text-neutral-500" />}
                    </div>
                  </button>
                  
                  {expandedSections[elem.id] && (
                    <div className="px-2 py-1.5 bg-neutral-950/60 space-y-2.5 border-t border-neutral-800/50">
                      <div className="grid grid-cols-[55px_1fr_45px] gap-2 items-center">
                        <span className="text-[9px] text-neutral-400 font-sans uppercase tracking-widest font-semibold">Size</span>
                        <input 
                          type="range" min="8" max="150" 
                          value={theme[elem.keySize as keyof ThemeSettings] as number || elem.defaultSize} 
                          onChange={(e) => setTheme(prev => ({ ...prev, [elem.keySize]: parseInt(e.target.value) || elem.defaultSize }))} 
                          className="w-full accent-accent bg-neutral-900 h-1 rounded-sm appearance-none cursor-pointer" 
                        />
                        <input 
                          type="number"
                          value={theme[elem.keySize as keyof ThemeSettings] as number || elem.defaultSize} 
                          onChange={(e) => setTheme(prev => ({ ...prev, [elem.keySize]: parseInt(e.target.value) || elem.defaultSize }))} 
                          className="w-full bg-neutral-900 border border-neutral-800 text-white text-[10px] px-1 py-0.5 rounded text-center focus:outline-none focus:border-accent font-mono h-5"
                        />
                      </div>
                      
                      <div className="grid grid-cols-[55px_1fr_45px] gap-2 items-center">
                        <span className="text-[9px] text-neutral-400 font-sans uppercase tracking-widest font-semibold">X-Offset</span>
                        <input 
                          type="range" min="-300" max="300" 
                          value={theme[elem.keyX as keyof ThemeSettings] as number || 0} 
                          onChange={(e) => setTheme(prev => ({ ...prev, [elem.keyX]: parseInt(e.target.value) || 0 }))} 
                          className="w-full accent-accent bg-neutral-900 h-1 rounded-sm appearance-none cursor-pointer" 
                        />
                        <input 
                          type="number"
                          value={theme[elem.keyX as keyof ThemeSettings] as number || 0} 
                          onChange={(e) => setTheme(prev => ({ ...prev, [elem.keyX]: parseInt(e.target.value) || 0 }))} 
                          className="w-full bg-neutral-900 border border-neutral-800 text-white text-[10px] px-1 py-0.5 rounded text-center focus:outline-none focus:border-accent font-mono h-5"
                        />
                      </div>

                      <div className="grid grid-cols-[55px_1fr_45px] gap-2 items-center">
                        <span className="text-[9px] text-neutral-400 font-sans uppercase tracking-widest font-semibold">Y-Offset</span>
                        <input 
                          type="range" min="-300" max="300" 
                          value={theme[elem.keyY as keyof ThemeSettings] as number || 0} 
                          onChange={(e) => setTheme(prev => ({ ...prev, [elem.keyY]: parseInt(e.target.value) || 0 }))} 
                          className="w-full accent-accent bg-neutral-900 h-1 rounded-sm appearance-none cursor-pointer" 
                        />
                        <input 
                          type="number"
                          value={theme[elem.keyY as keyof ThemeSettings] as number || 0} 
                          onChange={(e) => setTheme(prev => ({ ...prev, [elem.keyY]: parseInt(e.target.value) || 0 }))} 
                          className="w-full bg-neutral-900 border border-neutral-800 text-white text-[10px] px-1 py-0.5 rounded text-center focus:outline-none focus:border-accent font-mono h-5"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-neutral-900">
              <button
                onClick={handleReset}
                className="px-2 py-1.5 text-neutral-400 hover:text-white text-[10px] tracking-wider uppercase flex items-center space-x-1.5 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset All</span>
              </button>

              <button
                onClick={handleSave}
                disabled={isSaving || !hasUnsavedChanges}
                className={`px-4 py-2 rounded text-[10px] font-bold tracking-widest uppercase flex items-center space-x-1.5 transition-all ${
                  hasUnsavedChanges 
                    ? 'bg-accent hover:bg-[#ebd04e] text-black shadow-lg cursor-pointer' 
                    : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                }`}
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving...' : 'Save Design'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </Rnd>
  );
}
