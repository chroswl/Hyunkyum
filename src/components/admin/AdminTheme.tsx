import React from 'react';
import type { Language, ThemeSettings } from '../../types';
import AdminLayout from './AdminLayout';
import PropertyAccordion from './PropertyAccordion';
import { PropertyColorPicker, PropertySelect, PropertySlider } from './PropertyFields';
import { useEditing } from '../../contexts/EditingContext';

export default function AdminTheme({ 
  currentLang, 
  onRefreshData,
  onClose,
  theme,
  setTheme
}: { 
  currentLang: Language; 
  onRefreshData?: () => void;
  onClose?: () => void;
  theme: ThemeSettings;
  setTheme: (t: ThemeSettings) => void;
  initialTheme: ThemeSettings | null;
}) {
  const { status, saveChanges, cancelChanges, isDirty } = useEditing();

  if (!theme) {
    return (
      <div className="p-8 text-neutral-500 animate-pulse flex items-center space-x-3">
        <div className="w-4 h-4 border-2 border-t-transparent border-[#C9A227] rounded-full animate-spin"></div>
        <span>Loading Theme Editor...</span>
      </div>
    );
  }

  const hasChanges = isDirty('theme');
  const isSaving = status === 'saving';

  const handleSave = async () => {
    await saveChanges();
    
  };

  const handleReset = () => {
    cancelChanges();
  };

  const updateField = (key: keyof ThemeSettings, val: any) => {
    if (!theme) return;
    const next = { ...theme, [key]: val };
    setTheme(next);
    // Keep this for any existing listeners that might still need it
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: next }));
  };

  const fonts = [
    { label: 'Inter (Default)', value: 'Inter' },
    { label: 'Space Grotesk', value: 'Space Grotesk' },
    { label: 'Outfit', value: 'Outfit' },
    { label: 'Playfair Display', value: 'Playfair Display' },
    { label: 'JetBrains Mono', value: 'JetBrains Mono' },
    { label: 'Fira Code', value: 'Fira Code' }
  ];

  const applyPreset = (presetName: string) => {
    let newTheme = { ...theme };
    switch (presetName) {
      case 'editorial':
        newTheme.websiteFont = 'Playfair Display';
        newTheme.bg = '#FDFCF0';
        newTheme.text = '#1A1A1A';
        newTheme.spacingContentWidth = 1067;
        newTheme.spacingSection = 120;
        newTheme.spacingNavHeight = 90;
        newTheme.spacingNavGap = 40;
        break;
      case 'minimal':
        newTheme.websiteFont = 'Inter';
        newTheme.bg = '#000000';
        newTheme.text = '#FFFFFF';
        newTheme.spacingContentWidth = 1365;
        newTheme.spacingSection = 96;
        newTheme.spacingNavHeight = 80;
        newTheme.spacingNavGap = 32;
        break;
      case 'technical':
        newTheme.websiteFont = 'JetBrains Mono';
        newTheme.bg = '#111111';
        newTheme.text = '#00FF00';
        newTheme.spacingContentWidth = 1536;
        newTheme.spacingSection = 64;
        newTheme.spacingNavHeight = 64;
        newTheme.spacingNavGap = 24;
        break;
      default:
        break;
    }
    setTheme(newTheme);
  };

  const properties = (
    <div className="pb-20 space-y-2 p-4">
      {/* STEP 1: Design Preset */}
      <PropertyAccordion title="Design Preset" defaultOpen>
        <div className="space-y-4">
          <PropertySelect
            label="Load Preset"
            value="custom"
            onChange={(v) => applyPreset(v)}
            options={[
              { label: 'Custom', value: 'custom' },
              { label: 'Classic Editorial', value: 'editorial' },
              { label: 'Modern Minimal', value: 'minimal' },
              { label: 'Technical Mono', value: 'technical' }
            ]}
          />
        </div>
      </PropertyAccordion>

      <PropertyAccordion title="Base Colors" defaultOpen={false}>
        <div className="space-y-4">
          <PropertyColorPicker 
            label="Background" 
            value={theme.bg || '#000000'} 
            onChange={(v) => updateField('bg', v)} 
          />
          <PropertyColorPicker 
            label="Text" 
            value={theme.text || '#ffffff'} 
            onChange={(v) => updateField('text', v)} 
          />
        </div>
      </PropertyAccordion>

      {/* STEP 3: Fonts */}
      <PropertyAccordion title="Fonts" defaultOpen={false}>
        <div className="space-y-4">
          <PropertySelect
            label="Website Font"
            value={theme.websiteFont || 'Inter'}
            onChange={(v) => updateField('websiteFont', v)}
            options={fonts}
          />
          <PropertySlider
            label="Website Text Size"
            value={theme.websiteTextSize ?? 100}
            min={70} max={150} step={1}
            onChange={(v) => updateField('websiteTextSize', v)}
            unit="%"
          />
          <PropertySlider
            label="Navigation Font Size"
            value={theme.navFontSize ?? 100}
            min={70} max={150} step={1}
            onChange={(v) => updateField('navFontSize', v)}
            unit="%"
          />

        </div>
      </PropertyAccordion>

      {/* STEP 4: Spacing */}
      <PropertyAccordion title="Spacing" defaultOpen={false}>
        <div className="space-y-4">
          <PropertySlider
            label="Content Width"
            value={theme.spacingContentWidth ?? 1536}
            min={320} max={1536} step={10}
            onChange={(v) => updateField('spacingContentWidth', v)}
            unit="px"
          />
          <PropertySlider
            label="Section Spacing"
            value={theme.spacingSection ?? 80}
            min={0} max={300} step={1}
            onChange={(v) => updateField('spacingSection', v)}
            unit="px"
          />
          <PropertySlider
            label="Navigation Height"
            value={theme.spacingNavHeight ?? 80}
            min={40} max={200} step={1}
            onChange={(v) => updateField('spacingNavHeight', v)}
            unit="px"
          />
          <PropertySlider
            label="Navigation Menu Gap"
            value={theme.spacingNavGap ?? 32}
            min={0} max={120} step={1}
            onChange={(v) => updateField('spacingNavGap', v)}
            unit="px"
          />
        </div>
      </PropertyAccordion>
    </div>
  );

  return (
    <AdminLayout 
      title="Theme"
      hasChanges={hasChanges}
      isSaving={isSaving}
      onSave={handleSave}
      onReset={handleReset}
      onClose={onClose}
      properties={properties}
    />
  );
}
