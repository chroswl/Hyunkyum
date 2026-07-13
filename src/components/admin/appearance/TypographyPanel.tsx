import React, { useState, useEffect } from 'react';
import { AppearanceSettings } from '../../../types/appearance';
import { Search, Info } from 'lucide-react';
import { TranslationKey, translations } from '../../../translations';
import { Language } from '../../../types';

interface TypographyPanelProps {
  currentLang: Language;
  typography: AppearanceSettings['typography'];
  onChange: (key: string, value: any) => void;
}

const FONT_CATEGORIES = {
  'Elegant Serif': ['Cormorant Garamond', 'EB Garamond', 'Playfair Display', 'Libre Baskerville', 'Crimson Pro', 'Spectral', 'Bodoni Moda', 'Lora'],
  'Modern Sans': ['Inter', 'Manrope', 'Plus Jakarta Sans', 'IBM Plex Sans', 'DM Sans', 'Source Sans 3', 'Public Sans', 'Noto Sans'],
  'Editorial': ['Fraunces', 'Literata', 'Cardo', 'Alegreya', 'Prata'],
  'Monospace': ['JetBrains Mono', 'Fira Code', 'Space Mono', 'IBM Plex Mono', 'Courier New']
};

export default function TypographyPanel({ typography, onChange, currentLang }: TypographyPanelProps) {
  const t = (key: TranslationKey) => translations[currentLang]?.[key] || translations.EN[key] || key;
  const [activeSelect, setActiveSelect] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const searchPlaceholder = currentLang === 'KO' ? '글꼴 검색...' : currentLang === 'DE' ? 'Schriftarten suchen...' : 'Search fonts...';
  const favoritesLabel = currentLang === 'KO' ? '즐겨찾기' : currentLang === 'DE' ? 'Favoriten' : 'Favorites';
  const recentlyUsedLabel = currentLang === 'KO' ? '최근 사용한 글꼴' : currentLang === 'DE' ? 'Zuletzt verwendet' : 'Recently Used';
  const overrideDesc = currentLang === 'KO' 
    ? '제목, 본문, 버튼 등에 각기 다른 글꼴을 개별 지정할 수 있습니다.' 
    : currentLang === 'DE' 
      ? 'Ermöglicht individuelle Schriftarten für Überschriften, Fließtext, Buttons usw.' 
      : 'Allow custom fonts for headings, body, buttons, and navigation.';

  const renderLabelWithTip = (label: string, tipKey: string) => (
    <div className="flex items-center space-x-2 mb-2">
       <span className="text-[15px] font-medium text-neutral-300 tracking-wide">{label}</span>
       <div className="relative group/tooltip">
          <Info className="w-4 h-4 text-neutral-500 hover:text-neutral-300 cursor-help transition-colors" />
          <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-3 bg-neutral-900 border border-neutral-800 rounded-lg text-[13px] text-neutral-300 opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-50 whitespace-normal leading-relaxed text-center pointer-events-none shadow-xl normal-case">
            {t(tipKey as any)}
          </div>
       </div>
    </div>
  );

  const [favorites, setFavorites] = useState<string[]>(() => {
    return JSON.parse(localStorage.getItem('appearance_favorite_fonts') || '[]');
  });
  const [recent, setRecent] = useState<string[]>(() => {
    return JSON.parse(localStorage.getItem('appearance_recent_fonts') || '[]');
  });

  const toggleFavorite = (e: React.MouseEvent, font: string) => {
    e.stopPropagation();
    const newFavs = favorites.includes(font) ? favorites.filter(f => f !== font) : [...favorites, font];
    setFavorites(newFavs);
    localStorage.setItem('appearance_favorite_fonts', JSON.stringify(newFavs));
  };

  const addToRecent = (font: string) => {
    const newRecent = [font, ...recent.filter(f => f !== font)].slice(0, 5);
    setRecent(newRecent);
    localStorage.setItem('appearance_recent_fonts', JSON.stringify(newRecent));
  };

  // Dynamically inject the selected fonts so they load via Google Fonts if not already loaded
  useEffect(() => {
    const fontsToLoad = [
      typography.globalFont,
      typography.heroFont,
      typography.headingFont,
      typography.bodyFont,
      typography.navigationFont,
      typography.buttonFont,
      typography.quoteFont
    ].filter(Boolean);

    fontsToLoad.forEach(font => {
      if (!document.getElementById(`font-${font}`)) {
        const link = document.createElement('link');
        link.id = `font-${font}`;
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${font.replace(/ /g, '+')}:wght@300;400;500;600;700&display=swap`;
        document.head.appendChild(link);
      }
    });
  }, [
    typography.globalFont,
    typography.heroFont,
    typography.headingFont,
    typography.bodyFont,
    typography.navigationFont,
    typography.buttonFont,
    typography.quoteFont
  ]);

  const renderFontSelect = (key: string, label: string, tipKey: string) => {
    const value = (typography as any)[key] || 'Inter';
    const isOpen = activeSelect === key;

    return (
      <div className="mb-5 relative">
        {renderLabelWithTip(label, tipKey)}
        <button 
          onClick={() => setActiveSelect(isOpen ? null : key)}
          className="w-full flex items-center justify-between bg-black border border-neutral-800 p-3 rounded-lg text-left hover:border-neutral-500 transition-all focus:outline-none focus:ring-1 focus:ring-accent min-h-[44px]"
        >
          <span className="text-[15px] text-white" style={{ fontFamily: value }}>{value}</span>
          <span className="text-[13px] text-neutral-500 font-mono">Aa</span>
        </button>
        {isOpen && (
          <div className="absolute z-50 top-full mt-2 left-0 right-0 bg-[#111] border border-neutral-800 rounded-lg shadow-2xl max-h-72 flex flex-col overflow-hidden">
            <div className="p-3 border-b border-neutral-800 shrink-0 relative flex items-center">
              <Search className="absolute left-6 w-4 h-4 text-neutral-500" />
              <input 
                type="text" 
                placeholder={searchPlaceholder} 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-black border border-neutral-800 rounded-lg pl-10 pr-4 py-2.5 text-[15px] text-white focus:outline-none focus:border-neutral-500"
              />
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-5">
              
              {!search && favorites.length > 0 && (
                <div>
                  <h5 className="text-[13px] uppercase tracking-wider text-accent font-semibold mb-2 flex justify-between">
                    <span>{favoritesLabel}</span>
                  </h5>
                  <div className="space-y-1">
                    {favorites.map(font => (
                      <button
                        key={font}
                        onClick={() => { onChange(key, font); addToRecent(font); setActiveSelect(null); setSearch(''); }}
                        className={`w-full text-left px-3 py-2.5 rounded-lg text-[15px] hover:bg-white/5 transition-colors flex justify-between items-center min-h-[44px] ${value === font ? 'bg-accent/10 text-accent font-medium' : 'text-neutral-300'}`}
                        style={{ fontFamily: font }}
                      >
                        <span>{font}</span>
                        <div className="flex items-center space-x-3">
                          <span onClick={(e) => toggleFavorite(e, font)} className="text-accent cursor-pointer hover:scale-110 transition-transform text-[16px]">★</span>
                          <span className="text-[13px] opacity-50 font-mono">Aa</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {!search && recent.length > 0 && (
                <div>
                  <h5 className="text-[13px] uppercase tracking-wider text-neutral-500 font-semibold mb-2">{recentlyUsedLabel}</h5>
                  <div className="space-y-1">
                    {recent.map(font => (
                      <button
                        key={font}
                        onClick={() => { onChange(key, font); addToRecent(font); setActiveSelect(null); setSearch(''); }}
                        className={`w-full text-left px-3 py-2.5 rounded-lg text-[15px] hover:bg-white/5 transition-colors flex justify-between items-center min-h-[44px] ${value === font ? 'bg-accent/10 text-accent font-medium' : 'text-neutral-300'}`}
                        style={{ fontFamily: font }}
                      >
                        <span>{font}</span>
                        <div className="flex items-center space-x-3">
                          <span onClick={(e) => toggleFavorite(e, font)} className="text-neutral-600 hover:text-accent cursor-pointer transition-colors text-[16px]">☆</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {Object.entries(FONT_CATEGORIES).map(([cat, fonts]) => {
                const filtered = fonts.filter(f => f.toLowerCase().includes(search.toLowerCase()));
                if (filtered.length === 0) return null;
                return (
                  <div key={cat}>
                    <h5 className="text-[13px] uppercase tracking-wider text-neutral-500 font-semibold mb-2 mt-2">{cat}</h5>
                    <div className="space-y-1">
                      {filtered.map(font => {
                        const isFav = favorites.includes(font);
                        return (
                          <button
                            key={font}
                            onClick={() => { onChange(key, font); addToRecent(font); setActiveSelect(null); setSearch(''); }}
                            className={`w-full text-left px-3 py-2.5 rounded-lg text-[15px] hover:bg-white/5 transition-colors flex justify-between items-center min-h-[44px] ${value === font ? 'bg-accent/10 text-accent font-medium' : 'text-neutral-300'}`}
                            style={{ fontFamily: font }}
                          >
                            <span>{font}</span>
                            <div className="flex items-center space-x-3">
                              <span onClick={(e) => toggleFavorite(e, font)} className={`${isFav ? 'text-accent hover:scale-110' : 'text-neutral-600 hover:text-accent'} cursor-pointer transition-all text-[16px]`}>
                                {isFav ? '★' : '☆'}
                              </span>
                              <span className="text-[13px] opacity-50 font-mono">Aa</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSlider = (key: string, label: string, tipKey: string, min: number, max: number, step: number, unit: string = '') => {
    const value = (typography as any)[key];
    return (
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          {renderLabelWithTip(label, tipKey)}
          <span className="text-white text-[15px] font-bold font-mono bg-neutral-800/50 px-2 py-0.5 rounded">{value}{unit}</span>
        </div>
        <input 
          type="range" 
          min={min} 
          max={max} 
          step={step} 
          value={value} 
          onChange={(e) => onChange(key, Number(e.target.value))} 
          className="w-full accent-accent cursor-pointer h-2 bg-neutral-800 rounded-lg appearance-none" 
        />
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h4 className="text-[18px] uppercase tracking-wider text-neutral-400 font-bold mb-4 border-b border-neutral-800/80 pb-2">{t('sectionTypography')}</h4>
        {renderFontSelect('globalFont', t('labelGlobalFont') as string, 'tipGlobalFont')}
        
        <div className="mt-5 mb-3 flex items-center justify-between bg-[#111] p-4 rounded-lg border border-neutral-800">
          <div className="flex flex-col pr-4">
            <span className="text-[15px] font-bold text-white tracking-wide">{t('labelOverrideIndividual')}</span>
            <span className="text-[13px] text-neutral-500 mt-1 leading-normal">{overrideDesc}</span>
          </div>
          <button
            onClick={() => onChange('overrideIndividualFonts', !typography.overrideIndividualFonts)}
            className={`w-12 h-6 rounded-full relative transition-colors shrink-0 ${typography.overrideIndividualFonts ? 'bg-accent' : 'bg-neutral-700'}`}
          >
            <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${typography.overrideIndividualFonts ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>
      
      {typography.overrideIndividualFonts && (
        <div className="mt-5 animate-in fade-in slide-in-from-top-2 duration-300 space-y-2">
          <h4 className="text-[18px] uppercase tracking-wider text-neutral-400 font-bold mb-4 border-b border-neutral-800/80 pb-2">
            {currentLang === 'KO' ? '개별 폰트 설정' : currentLang === 'DE' ? 'Einzelne Zuordnungen' : 'Individual Assignments'}
          </h4>
          {renderFontSelect('heroFont', t('labelFontHero') as string, 'tipFontHero')}
          {renderFontSelect('headingFont', t('labelFontHeading') as string, 'tipFontHeading')}
          {renderFontSelect('bodyFont', t('labelFontBody') as string, 'tipFontBody')}
          {renderFontSelect('navigationFont', t('labelFontNav') as string, 'tipFontNav')}
          {renderFontSelect('buttonFont', t('labelFontButton') as string, 'tipFontButton')}
          {renderFontSelect('quoteFont', t('labelFontQuote') as string, 'tipFontQuote')}
        </div>
      )}

      <div>
        <h4 className="text-[18px] uppercase tracking-wider text-neutral-400 font-bold mb-4 border-b border-neutral-800/80 pb-2">
          {currentLang === 'KO' ? '비율 및 스케일' : currentLang === 'DE' ? 'Skalierung & Rhythmus' : 'Scale & Rhythm'}
        </h4>
        <div className="space-y-6">
          {renderSlider('baseFontSize', t('labelBaseFontSize') as string, 'tipBaseFontSize', 12, 24, 1, 'px')}
          {renderSlider('headingScale', t('labelHeadingScale') as string, 'tipHeadingScale', 1.1, 1.6, 0.05, 'x')}
          {renderSlider('lineHeight', t('labelLineHeight') as string, 'tipLineHeight', 1.2, 2.0, 0.1)}
          {renderSlider('fontWeight', t('labelFontWeight') as string, 'tipFontWeight', 300, 700, 100)}
        </div>
      </div>
    </div>
  );
}
