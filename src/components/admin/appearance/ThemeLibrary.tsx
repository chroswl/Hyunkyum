import React, { useState, useEffect } from 'react';
import { AppearanceSettings, defaultAppearanceSettings, CustomTheme } from '../../../types/appearance';
import { TranslationKey, translations } from '../../../translations';
import { Language } from '../../../types';

import { fetchCustomThemes, saveCustomTheme, deleteCustomTheme } from '../../../services/appearanceService';
import { Palette, Check, Download, Upload, Plus, Trash2, Star } from 'lucide-react';

interface ThemeLibraryProps {
  currentLang: Language;
  currentAppearance: AppearanceSettings;
  onApplyTheme: (theme: AppearanceSettings) => void;
}

const BUILT_IN_THEMES = {
  classic: defaultAppearanceSettings,
  minimalWhite: {
    ...defaultAppearanceSettings,
    theme: "light",
    colors: {
      ...defaultAppearanceSettings.colors,
      primary: "#111111", secondary: "#555555", accent: "#000000",
      background: "#ffffff", surface: "#f5f5f5", text: "#111111",
      muted: "#888888", navigation: "#ffffff", footer: "#f5f5f5",
      buttons: "#111111", links: "#111111", hover: "#ffffff", borders: "#e5e5e5"
    }
  },
  royalGold: {
    ...defaultAppearanceSettings,
    theme: "dark",
    colors: {
      ...defaultAppearanceSettings.colors,
      primary: "#FFD700", secondary: "#DAA520", accent: "#B8860B",
      background: "#0a0a0a", surface: "#141414", text: "#f8f8f8",
      muted: "#8a8a8a", navigation: "#0a0a0a", footer: "#0a0a0a",
      buttons: "#B8860B", links: "#FFD700", hover: "#000000", borders: "#2a2a2a"
    }
  }
};

export default function ThemeLibrary({ currentAppearance, onApplyTheme, currentLang }: ThemeLibraryProps) {
  const t = (key: TranslationKey) => translations[currentLang]?.[key] || translations.EN[key] || key;
  const [activeTab, setActiveTab] = useState<'built-in' | 'custom'>('built-in');
  const [customThemes, setCustomThemes] = useState<CustomTheme[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Localization strings
  const themeLibraryTitle = currentLang === 'KO' ? '테마 프리셋 라이브러리' : currentLang === 'DE' ? 'Design-Vorlagen Bibliothek' : 'Theme Presets Library';
  const builtInThemesLabel = currentLang === 'KO' ? '웹사이트 기본 테마' : currentLang === 'DE' ? 'Standardthemen' : 'Built-in Themes';
  const myPresetsLabel = currentLang === 'KO' ? '나의 커스텀 프리셋' : currentLang === 'DE' ? 'Eigene Vorlagen' : 'My Custom Presets';
  const loadingLabel = currentLang === 'KO' ? '로딩 중...' : currentLang === 'DE' ? 'Wird geladen...' : 'Loading...';
  const noCustomLabel = currentLang === 'KO' ? '저장된 커스텀 프리셋이 없습니다.' : currentLang === 'DE' ? 'Keine eigenen Vorlagen vorhanden.' : 'No custom presets saved.';
  const enterNameLabel = currentLang === 'KO' ? '새 테마 프리셋 이름을 입력해 주세요:' : currentLang === 'DE' ? 'Geben Sie einen Namen für Ihr Thema ein:' : 'Enter a name for your custom theme:';
  const deleteConfirmLabel = currentLang === 'KO' ? '정말로 이 테마를 삭제하시겠습니까?' : currentLang === 'DE' ? 'Möchten Sie dieses Thema wirklich löschen?' : 'Are you sure you want to delete this theme?';
  const invalidFormatLabel = currentLang === 'KO' ? '올바르지 않은 테마 파일 형식입니다.' : currentLang === 'DE' ? 'Ungültiges Dateiformat' : 'Invalid theme file format';
  const failedParseLabel = currentLang === 'KO' ? 'JSON 파싱에 실패했습니다.' : currentLang === 'DE' ? 'JSON konnte nicht gelesen werden' : 'Failed to parse JSON file';

  useEffect(() => {
    loadCustomThemes();
  }, []);

  const loadCustomThemes = async () => {
    setIsLoading(true);
    try {
      const themes = await fetchCustomThemes();
      setCustomThemes(themes || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentAppearance, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "appearance_theme.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const obj = JSON.parse(event.target?.result as string);
        if (obj && obj.colors && obj.typography) {
          onApplyTheme(obj);
        } else {
          alert(invalidFormatLabel);
        }
      } catch (err) {
        alert(failedParseLabel);
      }
    };
    reader.readAsText(file);
  };

  const handleSaveAsPreset = async () => {
    const name = window.prompt(enterNameLabel);
    if (!name) return;
    
    const newTheme: CustomTheme = {
      id: 'theme_' + Date.now(),
      name,
      createdAt: Date.now(),
      settings: currentAppearance,
      favorite: false
    };

    await saveCustomTheme(newTheme);
    setCustomThemes(prev => [newTheme, ...prev]);
    setActiveTab('custom');
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm(deleteConfirmLabel)) return;
    await deleteCustomTheme(id);
    setCustomThemes(prev => prev.filter(t => t.id !== id));
  };

  const handleToggleFavorite = async (e: React.MouseEvent, theme: CustomTheme) => {
    e.stopPropagation();
    const updated = { ...theme, favorite: !theme.favorite };
    await saveCustomTheme(updated);
    setCustomThemes(prev => prev.map(t => t.id === theme.id ? updated : t));
  };

  const renderThemeCard = (key: string, name: string, themeSettings: AppearanceSettings, extraActions?: React.ReactNode) => {
    const isCurrent = JSON.stringify(currentAppearance) === JSON.stringify(themeSettings);
    return (
      <div 
        key={key} 
        className={`p-4 rounded-lg border transition-all cursor-pointer flex flex-col justify-between ${isCurrent ? 'bg-accent/10 border-accent/40 shadow-md' : 'bg-black border-neutral-800 hover:border-neutral-500 hover:bg-neutral-900/40'}`}
        onClick={() => onApplyTheme(themeSettings)}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2.5">
            <Palette className={`w-5 h-5 ${isCurrent ? 'text-accent' : 'text-neutral-500'}`} />
            <span className={`text-[15px] uppercase tracking-wider ${isCurrent ? 'text-accent font-bold' : 'text-white font-medium'}`}>{name}</span>
          </div>
          <div className="flex items-center space-x-3">
            {extraActions}
            {isCurrent && <Check className="w-5 h-5 text-accent" />}
          </div>
        </div>
        <div className="flex space-x-2">
          <div className="w-8 h-8 rounded-full border border-neutral-800 shadow" style={{ backgroundColor: themeSettings.colors.background }} title="Background" />
          <div className="w-8 h-8 rounded-full border border-neutral-800 shadow" style={{ backgroundColor: themeSettings.colors.surface }} title="Surface" />
          <div className="w-8 h-8 rounded-full border border-neutral-800 shadow" style={{ backgroundColor: themeSettings.colors.primary }} title="Primary" />
          <div className="w-8 h-8 rounded-full border border-neutral-800 shadow" style={{ backgroundColor: themeSettings.colors.accent }} title="Accent" />
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full space-y-5">
      <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
        <h4 className="text-[18px] font-bold tracking-wider uppercase text-neutral-400">{themeLibraryTitle}</h4>
        <div className="flex space-x-2.5">
          <button 
            onClick={handleSaveAsPreset} 
            className="p-2.5 bg-accent text-black hover:bg-[#ebd04e] rounded-lg transition-colors flex items-center justify-center min-w-[44px] min-h-[44px]" 
            title="Save current as preset"
          >
            <Plus className="w-5 h-5" />
          </button>
          <label 
            className="cursor-pointer p-2.5 bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors text-neutral-400 hover:text-white flex items-center justify-center min-w-[44px] min-h-[44px]" 
            title="Import JSON Theme"
          >
            <Upload className="w-5 h-5" />
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
          <button 
            onClick={handleExport} 
            className="p-2.5 bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors text-neutral-400 hover:text-white flex items-center justify-center min-w-[44px] min-h-[44px]" 
            title="Export JSON Theme"
          >
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <div className="flex space-x-1.5 p-1.5 bg-black rounded-lg border border-neutral-800">
        <button 
          onClick={() => setActiveTab('built-in')} 
          className={`flex-1 text-[13px] uppercase tracking-wider py-2.5 rounded-md font-semibold transition-all ${activeTab === 'built-in' ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
        >
          {builtInThemesLabel}
        </button>
        <button 
          onClick={() => setActiveTab('custom')} 
          className={`flex-1 text-[13px] uppercase tracking-wider py-2.5 rounded-md font-semibold transition-all ${activeTab === 'custom' ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
        >
          {myPresetsLabel}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 max-h-[350px] custom-scrollbar">
        {activeTab === 'built-in' ? (
          Object.entries(BUILT_IN_THEMES).map(([key, theme]) => 
            renderThemeCard(key, key === 'classic' ? 'Classic Dark' : key === 'minimalWhite' ? 'Minimal White' : 'Royal Gold', theme as any)
          )
        ) : isLoading ? (
          <div className="text-center py-10">
            <span className="text-[15px] text-neutral-500 uppercase tracking-widest animate-pulse font-medium">{loadingLabel}</span>
          </div>
        ) : customThemes.length === 0 ? (
          <div className="text-center py-10">
            <span className="text-[13px] text-neutral-500 tracking-wide font-medium">{noCustomLabel}</span>
          </div>
        ) : (
          customThemes.sort((a, b) => (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0)).map(theme => 
            renderThemeCard(
              theme.id, 
              theme.name, 
              theme.settings, 
              <div className="flex items-center space-x-2">
                <button 
                  onClick={(e) => handleToggleFavorite(e, theme)} 
                  className={`p-2 rounded-md transition-colors ${theme.favorite ? 'text-accent hover:bg-accent/10' : 'text-neutral-600 hover:text-white hover:bg-white/10'}`}
                >
                  <Star className={`w-4 h-4 ${theme.favorite ? 'fill-current' : ''}`} />
                </button>
                <button 
                  onClick={(e) => handleDelete(e, theme.id)} 
                  className="p-2 text-neutral-600 hover:text-rose-400 hover:bg-rose-400/10 rounded-md transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )
          )
        )}
      </div>
    </div>
  );
}
