import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Palette } from 'lucide-react';
import { useEditable } from '../../contexts/EditingContext';
import { ThemeSettings } from '../../types';
import PropertyAccordion from './PropertyAccordion';
import { ColorRow } from './ColorRow';
import { PropertySlider } from './PropertyFields';

interface AppearancePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AppearancePanel({ isOpen, onClose }: AppearancePanelProps) {
  const [theme, setTheme] = useEditable<Partial<ThemeSettings>>('theme', {});

  const updateField = (key: keyof ThemeSettings, val: any) => {
    setTheme({ ...theme, [key]: val });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 z-40"
          />
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-80 bg-neutral-900 border-l border-neutral-800 shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-800 shrink-0">
              <div className="flex items-center space-x-2 text-white">
                <Palette className="w-4 h-4 text-[#C9A227]" />
                <h2 className="text-xs font-serif tracking-widest uppercase">Appearance</h2>
              </div>
              <button 
                onClick={onClose}
                className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pb-10">
              {/* Global Colors */}
              <PropertyAccordion title="Global Colors" defaultOpen={true}>
                <div className="space-y-4">
                  <ColorRow 
                    label="Background" 
                    value={theme.bg} 
                    fallback="#000000" 
                    onChange={(v) => updateField('bg', v)} 
                  />
                  <ColorRow 
                    label="Text" 
                    value={theme.text} 
                    fallback="#ffffff" 
                    onChange={(v) => updateField('text', v)} 
                  />
                  <ColorRow 
                    label="Accent" 
                    value={theme.accent} 
                    fallback="#C9A227" 
                    onChange={(v) => updateField('accent', v)} 
                  />
                  <ColorRow 
                    label="Border" 
                    value={theme.border} 
                    fallback="#262626" 
                    onChange={(v) => updateField('border', v)} 
                  />
                </div>
              </PropertyAccordion>

              {/* Navigation */}
              <PropertyAccordion title="Navigation" defaultOpen={false}>
                <div className="space-y-4">
                  <ColorRow 
                    label="Navigation Background" 
                    value={theme.navBg} 
                    fallback={theme.bg || "#000000"} 
                    onChange={(v) => updateField('navBg', v)} 
                  />
                </div>
              </PropertyAccordion>

              {/* Hero Section */}
              <PropertyAccordion title="Hero Section" defaultOpen={true}>
                <div className="space-y-4">
                  <ColorRow 
                    label="Hero Text Color" 
                    value={theme.heroTextColor} 
                    fallback={theme.text || "#ffffff"} 
                    onChange={(v) => updateField('heroTextColor', v)} 
                  />
                </div>
              </PropertyAccordion>

              {/* Typography */}
              <PropertyAccordion title="Typography" defaultOpen={true}>
                <div className="space-y-4">
                  <PropertySlider 
                    label="Press Text Size" 
                    value={theme.pressFontSize ?? 24} 
                    min={12} 
                    max={64} 
                    onChange={(v) => updateField('pressFontSize', v)} 
                  />
                </div>
              </PropertyAccordion>

              {/* Layout */}
              <PropertyAccordion title="Layout">
                <div className="text-xs text-neutral-500 italic py-2">Settings coming soon</div>
              </PropertyAccordion>

              {/* Components / Contact Form */}
              <PropertyAccordion title="Contact Form" defaultOpen={true}>
                <div className="space-y-4">
                  <ColorRow 
                    label="Input Background" 
                    value={theme.contactFormBg} 
                    fallback="transparent" 
                    onChange={(v) => updateField('contactFormBg', v)} 
                  />
                </div>
              </PropertyAccordion>

              {/* Advanced */}
              <PropertyAccordion title="Advanced">
                <div className="text-xs text-neutral-500 italic py-2">Settings coming soon</div>
              </PropertyAccordion>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
