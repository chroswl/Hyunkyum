import React, { useState, useEffect } from 'react';
import type { Language, ThemeSettings } from '../../types';
import { fetchThemeSettings, saveThemeSettings } from '../../firebase';
import AdminLayout from './AdminLayout';
import PropertyAccordion from './PropertyAccordion';
import { PropertyInput, PropertySlider, PropertySelect } from './PropertyFields';
import { GoogleDrivePicker } from './GoogleDrivePicker';
import HeroSection from '../HeroSection';
import { translations } from '../../translations';
import { optimizeImageFile } from '../../lib/imageCompressor';
import { Upload } from 'lucide-react';

export default function AdminHero({ currentLang }: { currentLang: Language }) {
  const [theme, setTheme] = useState<ThemeSettings | null>(null);
  const [initialTheme, setInitialTheme] = useState<ThemeSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  useEffect(() => {
    fetchThemeSettings().then(data => {
      setTheme(data);
      setInitialTheme(data);
    });
  }, []);

  if (!theme) return <div className="p-8 text-neutral-500">Loading editor...</div>;

  const hasChanges = JSON.stringify(theme) !== JSON.stringify(initialTheme);

  const handleSave = async () => {
    setIsSaving(true);
    await saveThemeSettings(theme);
    setInitialTheme(theme);
    setIsSaving(false);
  };

  const handleReset = () => {
    if (initialTheme) setTheme(initialTheme);
  };

  const updateField = (key: keyof ThemeSettings, val: any) => {
    setTheme(prev => prev ? { ...prev, [key]: val } : prev);
  };

  const handleFile = async (file: File) => {
    if (file.size > 30 * 1024 * 1024) {
      alert("File is too large. Maximum size is 30MB.");
      return;
    }
    
    if (file.type.startsWith('image/')) {
      setIsOptimizing(true);
      setUploadProgress(0);
      try {
        const optimizedBase64 = await optimizeImageFile(file, (p) => {
          setUploadProgress(p);
        });
        setTheme(prev => prev ? { ...prev, homeBg: optimizedBase64, homeBgType: 'image' } : null);
      } catch (err) {
        console.error("Failed to optimize image:", err);
      } finally {
        setIsOptimizing(false);
        setUploadProgress(null);
      }
    } else if (file.type.startsWith('video/')) {
      setIsOptimizing(true);
      setUploadProgress(10);
      try {
        const reader = new FileReader();
        reader.onprogress = (e) => {
          if (e.lengthComputable) {
            setUploadProgress(Math.round((e.loaded / e.total) * 100));
          }
        };
        reader.onload = (e) => {
          const base64 = e.target?.result as string;
          setTheme(prev => prev ? { ...prev, homeBg: base64, homeBgType: 'video' } : null);
          setIsOptimizing(false);
          setUploadProgress(null);
        };
        reader.readAsDataURL(file);
      } catch (err) {
        console.error("Failed to read video:", err);
        setIsOptimizing(false);
        setUploadProgress(null);
      }
    } else {
      alert("Please select a valid image or video file.");
    }
  };

  const properties = (
    <div className="pb-20">
      <PropertyAccordion title="Content" defaultOpen>
        <PropertyInput label="Subtitle" value={currentLang === 'KO' ? theme.heroSubtitleKO || '' : currentLang === 'DE' ? theme.heroSubtitleDE || '' : theme.heroSubtitle || ''} onChange={(v) => updateField(currentLang === 'KO' ? 'heroSubtitleKO' : currentLang === 'DE' ? 'heroSubtitleDE' : 'heroSubtitle', v)} />
        <PropertyInput label="Main Title" value={currentLang === 'KO' ? theme.heroTitleKO || '' : currentLang === 'DE' ? theme.heroTitleDE || '' : theme.heroTitle || ''} onChange={(v) => updateField(currentLang === 'KO' ? 'heroTitleKO' : currentLang === 'DE' ? 'heroTitleDE' : 'heroTitle', v)} />
        <PropertyInput label="Description" value={currentLang === 'KO' ? theme.heroDescriptionKO || '' : currentLang === 'DE' ? theme.heroDescriptionDE || '' : theme.heroDescription || ''} onChange={(v) => updateField(currentLang === 'KO' ? 'heroDescriptionKO' : currentLang === 'DE' ? 'heroDescriptionDE' : 'heroDescription', v)} />
        <PropertyInput label="Button Text" value={currentLang === 'KO' ? theme.heroDiscoverKO || '' : currentLang === 'DE' ? theme.heroDiscoverDE || '' : theme.heroDiscover || ''} onChange={(v) => updateField(currentLang === 'KO' ? 'heroDiscoverKO' : currentLang === 'DE' ? 'heroDiscoverDE' : 'heroDiscover', v)} />
      </PropertyAccordion>

      <PropertyAccordion title="Typography & Position">
        <PropertySelect label="Alignment" value={theme.heroAlign || 'center'} options={[{label: 'Left', value: 'left'}, {label: 'Center', value: 'center'}, {label: 'Right', value: 'right'}]} onChange={(v) => updateField('heroAlign', v)} />
        
        <div className="pt-4 border-t border-neutral-800/50 space-y-4">
           <h4 className="text-[10px] uppercase text-accent tracking-widest font-semibold">Title Adjustments</h4>
           <PropertySlider label="Font Size" value={theme.heroTitleSize || 64} min={10} max={120} onChange={(v) => updateField('heroTitleSize', v)} />
           <PropertySlider label="X Offset" value={theme.heroTitleOffsetX || 0} min={-200} max={200} onChange={(v) => updateField('heroTitleOffsetX', v)} />
           <PropertySlider label="Y Offset" value={theme.heroTitleOffsetY || 0} min={-200} max={200} onChange={(v) => updateField('heroTitleOffsetY', v)} />
        </div>

        <div className="pt-4 border-t border-neutral-800/50 space-y-4">
           <h4 className="text-[10px] uppercase text-accent tracking-widest font-semibold">Subtitle Adjustments</h4>
           <PropertySlider label="Font Size" value={theme.heroSubtitleSize || 14} min={8} max={40} onChange={(v) => updateField('heroSubtitleSize', v)} />
           <PropertySlider label="X Offset" value={theme.heroSubtitleOffsetX || 0} min={-100} max={100} onChange={(v) => updateField('heroSubtitleOffsetX', v)} />
           <PropertySlider label="Y Offset" value={theme.heroSubtitleOffsetY || 0} min={-100} max={100} onChange={(v) => updateField('heroSubtitleOffsetY', v)} />
        </div>

        <div className="pt-4 border-t border-neutral-800/50 space-y-4">
           <h4 className="text-[10px] uppercase text-accent tracking-widest font-semibold">Description Adjustments</h4>
           <PropertySlider label="Font Size" value={theme.heroDescSize || 16} min={8} max={40} onChange={(v) => updateField('heroDescSize', v)} />
           <PropertySlider label="X Offset" value={theme.heroDescOffsetX || 0} min={-100} max={100} onChange={(v) => updateField('heroDescOffsetX', v)} />
           <PropertySlider label="Y Offset" value={theme.heroDescOffsetY || 0} min={-100} max={100} onChange={(v) => updateField('heroDescOffsetY', v)} />
        </div>
      </PropertyAccordion>

      <PropertyAccordion title="Background Settings">
        <PropertySelect label="Background Type" value={theme.homeBgType || 'image'} options={[{label: 'Image', value: 'image'}, {label: 'Video', value: 'video'}, {label: 'YouTube', value: 'youtube'}]} onChange={(v) => updateField('homeBgType', v as any)} />
        <div className="flex justify-between items-end gap-2">
          <PropertyInput label="Background URL / Youtube ID" value={theme.homeBg || ''} onChange={(v) => updateField('homeBg', v)} />
          <GoogleDrivePicker onPick={url => updateField('homeBg', url)} />
        </div>
        
        <div className="mt-4 space-y-2">
          <label className="text-[10px] uppercase text-accent tracking-widest font-semibold block">Drag & Drop Upload (Photo/Video)</label>
          <div 
            className={`relative border-2 border-dashed rounded p-5 text-center transition-all ${
              isDragOver 
                ? 'border-accent bg-accent/5' 
                : 'border-neutral-800 bg-neutral-900/40 hover:border-neutral-700'
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              if (e.dataTransfer.files?.[0]) {
                handleFile(e.dataTransfer.files[0]);
              }
            }}
          >
            {uploadProgress !== null ? (
              <div className="flex flex-col items-center justify-center space-y-2 py-4">
                <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-neutral-400 font-mono">Processing: {uploadProgress}%</span>
              </div>
            ) : (
              <label className="cursor-pointer flex flex-col items-center justify-center space-y-1 py-2 w-full h-full">
                <Upload className="w-5 h-5 text-neutral-500 mb-1" />
                <span className="text-[11px] text-neutral-300 font-sans font-medium">
                  Drag & Drop file here or <span className="text-accent hover:underline">Browse</span>
                </span>
                <span className="text-[9px] text-neutral-500 font-sans">
                  Images and Videos up to 30MB • Drive Links Compatible
                </span>
                <input 
                  type="file" 
                  accept="image/*,video/*" 
                  className="hidden" 
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleFile(e.target.files[0]);
                    }
                  }} 
                />
              </label>
            )}
          </div>
        </div>
      </PropertyAccordion>
    </div>
  );

  return (
    <AdminLayout 
      title="Hero Design"
      hasChanges={hasChanges}
      isSaving={isSaving}
      onSave={handleSave}
      onReset={handleReset}
      preview={<div className="w-full h-full overflow-y-auto bg-black custom-scrollbar">
          <HeroSection 
            theme={theme}
            setTheme={setTheme}
            currentLang={currentLang}
            t={translations[currentLang]}
            user={null}
            isAdminOpen={true}
            activeEditSection="none"
            setActiveEditSection={() => {}}
            isEditingHeroText={false}
            setIsEditingHeroText={() => {}}
            scrollToSection={() => {}}
          />
        </div>}
      properties={properties}
    />
  );
}
