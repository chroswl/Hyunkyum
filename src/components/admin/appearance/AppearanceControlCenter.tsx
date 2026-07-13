import { TranslationKey, translations } from '../../../translations';
import type { Language } from '../../../types';
import React, { useState } from 'react';
import FloatingWindow from './FloatingWindow';
import { useAppearance } from '../../../contexts/AppearanceContext';
import { AppearanceSettings, defaultAppearanceSettings } from '../../../types/appearance';
import { saveAppearanceSettings } from '../../../services/appearanceService';
import { 
  Compass, 
  Menu, 
  BookOpen, 
  Image, 
  Film, 
  Calendar, 
  Mail, 
  CreditCard, 
  Type, 
  Layers, 
  Settings2, 
  RotateCcw, 
  Undo, 
  Redo, 
  Save, 
  RefreshCw, 
  Copy, 
  Check, 
  Hash, 
  Info,
  ChevronDown,
  ChevronUp,
  Sliders
} from 'lucide-react';
import TypographyPanel from './TypographyPanel';
import LayoutPanel from './LayoutPanel';
import ThemeLibrary from './ThemeLibrary';
import AppearanceHistoryPanel from '../AppearanceHistoryPanel';

export default function AppearanceControlCenter({ onClose, currentLang = 'EN' }: { onClose: () => void, currentLang?: Language }) {
  const { appearance, updateAppearance } = useAppearance();
  const t = (key: TranslationKey) => translations[currentLang]?.[key] || translations.EN[key] || key;
  
  const [activeTab, setActiveTab] = useState('hero');
  const [localState, setLocalState] = useState<AppearanceSettings>(appearance);
  
  // History stack
  const [history, setHistory] = useState<AppearanceSettings[]>([appearance]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [initialAppearance, setInitialAppearance] = useState<AppearanceSettings>(appearance); // Last published theme

  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const [publishNote, setPublishNote] = useState('');
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  // Accordion state for Advanced tab
  const [isPresetsOpen, setIsPresetsOpen] = useState(true);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [showAdvancedColors, setShowAdvancedColors] = useState(false);

  const updateAndPushHistory = (updated: AppearanceSettings) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(updated);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setLocalState(updated);
    updateAppearance(updated);
    setHasChanges(true);
  };

  const handleUpdate = (section: keyof AppearanceSettings, field: string, value: any) => {
    let updated: AppearanceSettings;
    if (field === '') {
      updated = {
        ...localState,
        [section]: value
      };
    } else {
      updated = {
        ...localState,
        [section]: {
          ...(localState[section] as any),
          [field]: value
        }
      };
    }
    updateAndPushHistory(updated);
  };

  const handleNestedUpdate = (section: keyof AppearanceSettings, subSection: string, field: string, value: any) => {
    const updated = {
      ...localState,
      [section]: {
        ...(localState[section] as any),
        [subSection]: {
          ...((localState[section] as any)[subSection] || {}),
          [field]: value
        }
      }
    };
    updateAndPushHistory(updated);
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

  const handleReset = () => {
    updateAndPushHistory(initialAppearance);
  };

  const handleResetToDefault = () => {
    if (window.confirm(currentLang === 'KO' ? '모든 설정을 웹사이트 기본 테마로 초기화하시겠습니까?' : currentLang === 'DE' ? 'Möchten Sie wirklich alle Einstellungen auf die Standardwerte zurücksetzen?' : 'Are you sure you want to reset all settings to system defaults?')) {
      updateAndPushHistory(defaultAppearanceSettings);
    }
  };

  const handlePublish = async () => {
    setIsSaving(true);
    try {
      await saveAppearanceSettings(localState, publishNote, 'Admin');
      setHasChanges(false);
      setIsPublishModalOpen(false);
      setInitialAppearance(localState);
    } catch (e) {
      console.error(e);
      alert('Failed to save appearance');
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 2000);
  };

  // 11 distinct tabs in chronological ordering matching the exact website flow
  const tabs = [
    { id: 'hero', icon: Compass, label: t('sectionHero') },
    { id: 'navigation', icon: Menu, label: t('sectionNavigation') },
    { id: 'biography', icon: BookOpen, label: t('sectionBiography') },
    { id: 'portfolio', icon: Image, label: t('sectionPortfolio') },
    { id: 'videos', icon: Film, label: t('sectionVideos') },
    { id: 'schedule', icon: Calendar, label: t('sectionSchedule') },
    { id: 'contact', icon: Mail, label: t('sectionContact') },
    { id: 'footer', icon: CreditCard, label: t('sectionFooter') },
    { id: 'typography', icon: Type, label: t('sectionTypography') },
    { id: 'layout', icon: Layers, label: t('sectionLayout') },
    { id: 'advanced', icon: Settings2, label: t('sectionAdvanced') },
  ];

  // Global helper for rendering setting labels with beginner-friendly tooltips
  const renderLabelWithTip = (label: string, tipKey: string) => (
    <div className="flex items-center space-x-2 mb-1.5">
       <span className="text-[15px] font-medium text-neutral-300 tracking-wide">{label}</span>
       <div className="relative group/tooltip">
          <Info className="w-4 h-4 text-neutral-500 hover:text-neutral-300 cursor-help transition-colors" />
          <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-3 bg-neutral-900 border border-neutral-800 rounded-lg text-[13px] text-neutral-300 opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-50 whitespace-normal leading-relaxed text-center pointer-events-none shadow-xl normal-case">
            {t(tipKey as any)}
          </div>
       </div>
    </div>
  );

  // Renders a color selector with inline HEX editor and preview box
  const renderColorInput = (section: keyof AppearanceSettings, fieldPath: string, label: string, tipKey: string) => {
    const keys = fieldPath.split('.');
    let value = localState[section] as any;
    for (const k of keys) {
      if (value) value = value[k];
    }
    value = value || '#000000';

    const handleColorChange = (newVal: string) => {
      if (keys.length === 1) {
        handleUpdate(section, keys[0], newVal);
      } else {
        handleNestedUpdate(section, keys[0], keys[1], newVal);
      }
    };

    return (
      <div key={fieldPath} className="flex flex-col p-3 hover:bg-white/5 rounded-lg border border-neutral-900/50 hover:border-neutral-800 transition-all group">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
             {renderLabelWithTip(label, tipKey)}
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="relative flex items-center bg-black border border-neutral-800 rounded-lg px-2 py-1.5 w-28 group-hover:border-neutral-600 transition-all">
              <Hash className="w-3.5 h-3.5 text-neutral-500 mr-1 shrink-0" />
              <input 
                type="text" 
                value={value.replace('#', '')} 
                onChange={(e) => handleColorChange('#' + e.target.value)}
                className="bg-transparent text-[14px] text-white w-full focus:outline-none uppercase font-mono"
              />
              <button onClick={() => copyToClipboard(value)} className="ml-1 text-neutral-500 hover:text-white transition-colors" title="Copy color code">
                {copiedHex === value ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            
            <div className="relative w-8 h-8 rounded-lg border border-neutral-700 shadow-inner overflow-hidden cursor-pointer shrink-0">
              <input 
                type="color" 
                value={value} 
                onChange={(e) => handleColorChange(e.target.value)} 
                className="absolute inset-[-10px] w-14 h-14 cursor-pointer p-0 border-0" 
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Renders a toggle (switch) button
  const renderToggle = (section: keyof AppearanceSettings, field: string, label: string, tipKey: string) => {
    const value = (localState[section] as any)[field];
    return (
      <div className="flex items-center justify-between p-3 bg-black/30 border border-neutral-900 rounded-lg hover:border-neutral-800 transition-all">
        {renderLabelWithTip(label, tipKey)}
        <button 
          onClick={() => handleUpdate(section, field, !value)}
          className={`w-12 h-6 rounded-full relative transition-colors shrink-0 ml-3 ${value ? 'bg-accent' : 'bg-neutral-800'}`}
        >
          <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${value ? 'translate-x-6' : 'translate-x-0'}`} />
        </button>
      </div>
    );
  };

  // Renders a slider slider
  const renderSlider = (section: keyof AppearanceSettings, field: string, label: string, tipKey: string, min: number, max: number, step: number, unit: string = 'px') => {
    const value = (localState[section] as any)[field];
    return (
      <div className="p-3 bg-black/30 border border-neutral-900 rounded-lg hover:border-neutral-800 transition-all">
        <div className="flex justify-between items-center mb-2">
          {renderLabelWithTip(label, tipKey)}
          <span className="text-white text-[15px] font-bold font-mono bg-neutral-800 px-2 py-0.5 rounded">{value}{unit}</span>
        </div>
        <input 
          type="range" min={min} max={max} step={step} 
          value={value} onChange={(e) => handleUpdate(section, field, Number(e.target.value))} 
          className="w-full accent-accent cursor-pointer h-2 bg-neutral-800 rounded-lg appearance-none" 
        />
      </div>
    );
  };

  // Renders a dropdown selector
  const renderSelect = (section: keyof AppearanceSettings, field: string, label: string, tipKey: string, options: {value: string, label: string}[]) => {
    const value = field ? (localState[section] as any)[field] : (localState[section] as any);
    return (
      <div className="p-3 bg-black/30 border border-neutral-900 rounded-lg hover:border-neutral-800 transition-all">
        <div className="mb-2">
          {renderLabelWithTip(label, tipKey)}
        </div>
        <select 
          value={value}
          onChange={(e) => handleUpdate(section, field, e.target.value)}
          className="w-full bg-black border border-neutral-800 rounded-lg px-3 py-2 text-[15px] text-white focus:outline-none focus:border-neutral-500 min-h-[44px]"
        >
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
    );
  };

  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'hero':
        return (
          <div className="space-y-6">
            <div>
              <h4 className="text-[18px] uppercase tracking-wider text-neutral-400 font-bold mb-3 border-b border-neutral-800/80 pb-2">
                {currentLang === 'KO' ? '히어로 섹션 디자인' : currentLang === 'DE' ? 'Hero-Bereich Aussehen' : 'Hero Visual Theme'}
              </h4>
              <p className="text-[13px] text-neutral-500 mb-4 leading-relaxed">
                {currentLang === 'KO' ? '메인 이미지 위에 표시되는 이름, 부제목 텍스트 및 오버레이 선명도를 제어합니다.' : currentLang === 'DE' ? 'Passen Sie die Farben und Overlays des Startbereichs an.' : 'Adjust primary visuals, typography, and color overlays on the hero image.'}
              </p>
            </div>
            
            <div className="space-y-4">
              {renderColorInput('colors', 'hero.title', t('labelHeroTitle'), 'tipHeroTitle')}
              {renderColorInput('colors', 'hero.subtitle', t('labelHeroSubtitle'), 'tipHeroSubtitle')}
              
              <div className="p-3 bg-black/30 border border-neutral-900 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  {renderLabelWithTip(t('labelHeroOpacity'), 'tipHeroOpacity')}
                  <span className="text-white text-[15px] font-bold font-mono bg-neutral-800 px-2 py-0.5 rounded">
                    {localState.colors.hero?.backgroundOverlayOpacity !== undefined ? localState.colors.hero.backgroundOverlayOpacity : 0.5}
                  </span>
                </div>
                <input 
                  type="range" min="0" max="1" step="0.05"
                  value={localState.colors.hero?.backgroundOverlayOpacity !== undefined ? localState.colors.hero.backgroundOverlayOpacity : 0.5}
                  onChange={(e) => handleNestedUpdate('colors', 'hero', 'backgroundOverlayOpacity', parseFloat(e.target.value))}
                  className="w-full accent-accent cursor-pointer h-2 bg-neutral-800 rounded-lg appearance-none"
                />
              </div>
            </div>

            {showAdvancedColors ? (
              <div className="space-y-4 pt-5 border-t border-neutral-800/60 animate-in fade-in duration-250">
                <h5 className="text-[14px] uppercase tracking-wider text-accent font-bold mb-1">
                  {currentLang === 'KO' ? '세부 조절 항목' : 'Detailed Hero Elements'}
                </h5>
                {renderColorInput('colors', 'hero.buttonBg', t('labelHeroButtonBg'), 'tipHeroButtonBg')}
                {renderColorInput('colors', 'hero.buttonText', t('labelHeroButtonText'), 'tipHeroButtonText')}
                {renderColorInput('colors', 'hero.buttonHover', t('labelHeroButtonHover'), 'tipHeroButtonHover')}
                {renderColorInput('colors', 'hero.overlay', t('labelHeroOverlay'), 'tipHeroOverlay')}
                {renderColorInput('colors', 'hero.arrow', t('labelHeroArrow'), 'tipHeroArrow')}
                
                <div className="p-3 bg-black/30 border border-neutral-900 rounded-lg">
                  {renderLabelWithTip(t('labelHeroGradient'), 'tipHeroGradient')}
                  <input 
                    type="text" 
                    value={localState.colors.hero?.gradient || 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.8) 100%)'}
                    onChange={(e) => handleNestedUpdate('colors', 'hero', 'gradient', e.target.value)}
                    className="w-full bg-black border border-neutral-800 rounded-lg px-3 py-2.5 text-[15px] text-white focus:outline-none focus:border-neutral-500 font-mono"
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-2 border border-dashed border-neutral-800 rounded-lg text-xs text-neutral-500">
                {currentLang === 'KO' ? '우측 상단의 [세부/고급 색상 조절] 버튼을 켜면 버튼, 그래디언트 등의 미세 색상을 조정할 수 있습니다.' : 'Turn on [Detailed/Advanced Colors] to tweak buttons, gradients, arrow lines, etc.'}
              </div>
            )}
          </div>
        );

      case 'navigation':
        return (
          <div className="space-y-6">
            <div>
              <h4 className="text-[18px] uppercase tracking-wider text-neutral-400 font-bold mb-3 border-b border-neutral-800/80 pb-2">{t('sectionNavigation')}</h4>
              <p className="text-[13px] text-neutral-500 mb-4 leading-relaxed">
                {currentLang === 'KO' ? '메뉴 헤더의 고정 및 투명 속성과 주요 배경/텍스트 글자색을 설정합니다.' : currentLang === 'DE' ? 'Legen Sie das Verhalten und die Farben der Kopfzeile fest.' : 'Configure navigation header behavior, backgrounds, and text.'}
              </p>
            </div>

            <div className="space-y-4">
              {renderToggle('navigation', 'sticky', t('labelNavSticky'), 'tipNavSticky')}
              {renderToggle('navigation', 'transparent', t('labelNavTrans'), 'tipNavTrans')}
              {renderColorInput('colors', 'navigation.background', currentLang === 'KO' ? '네비게이션 배경색' : 'Navbar Background', 'tipBackground')}
              {renderColorInput('colors', 'navigation.text', currentLang === 'KO' ? '네비게이션 글자색' : 'Navbar Text Color', 'tipTextColor')}
            </div>

            {showAdvancedColors ? (
              <div className="space-y-6 pt-5 border-t border-neutral-800/60 animate-in fade-in duration-250">
                <div>
                  <h5 className="text-[14px] uppercase tracking-wider text-accent font-bold mb-3">
                    {currentLang === 'KO' ? '세부 배치 및 형태' : 'Detailed Sizing & Layout'}
                  </h5>
                  <div className="space-y-4">
                    {renderToggle('navigation', 'blur', t('labelNavBlur'), 'tipNavBlur')}
                    {renderSlider('navigation', 'height', t('labelNavHeight'), 'tipNavHeight', 40, 120, 4, 'px')}
                    {renderSlider('navigation', 'logoSize', t('labelNavLogoSize'), 'tipNavLogoSize', 16, 64, 2, 'px')}
                    {renderSlider('navigation', 'menuGap', t('labelNavMenuGap'), 'tipNavMenuGap', 16, 64, 4, 'px')}
                  </div>
                </div>

                <div>
                  <h5 className="text-[14px] uppercase tracking-wider text-accent font-bold mb-3">
                    {currentLang === 'KO' ? '기본 상태 추가 세부 색상' : 'Scrolled State Advanced Colors'}
                  </h5>
                  <div className="space-y-4">
                    {renderColorInput('colors', 'navigation.hover', t('labelBtnHover'), 'tipBtnHover')}
                    {renderColorInput('colors', 'navigation.active', t('labelHighlightColor'), 'tipHighlightColor')}
                    {renderColorInput('colors', 'navigation.border', t('labelCardBorder'), 'tipCardBorder')}
                  </div>
                </div>

                <div>
                  <h5 className="text-[14px] uppercase tracking-wider text-accent font-bold mb-3">
                    {currentLang === 'KO' ? '상단 투명 상태 추가 세부 색상' : 'Transparent State Advanced Colors'}
                  </h5>
                  <div className="space-y-4">
                    {renderColorInput('colors', 'navigationTransparent.background', t('labelBackground'), 'tipBackground')}
                    {renderColorInput('colors', 'navigationTransparent.text', t('labelTextColor'), 'tipTextColor')}
                    {renderColorInput('colors', 'navigationTransparent.hover', t('labelBtnHover'), 'tipBtnHover')}
                    {renderColorInput('colors', 'navigationTransparent.active', t('labelHighlightColor'), 'tipHighlightColor')}
                    {renderColorInput('colors', 'navigationTransparent.border', t('labelCardBorder'), 'tipCardBorder')}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-2 border border-dashed border-neutral-800 rounded-lg text-xs text-neutral-500">
                {currentLang === 'KO' ? '우측 상단의 [세부/고급 색상 조절] 버튼을 켜면 크기, 간격, 호버, 투명 모드 전용 세부 색상을 바꿀 수 있습니다.' : 'Turn on [Detailed/Advanced Colors] to customize logo sizes, link spacing, specific hovers, active indicator colors.'}
              </div>
            )}
          </div>
        );

      case 'biography':
        return (
          <div className="space-y-6">
            <div>
              <h4 className="text-[18px] uppercase tracking-wider text-neutral-400 font-bold mb-3 border-b border-neutral-800/80 pb-2">{t('sectionBiography')}</h4>
              <p className="text-[13px] text-neutral-500 mb-4 leading-relaxed">
                {currentLang === 'KO' ? '프로필 바이오그라피 영역의 배경색과 본문 글자 색상을 설정합니다.' : currentLang === 'DE' ? 'Passen Sie die Farben für den Biografie-Abschnitt an.' : 'Customize the background and main text of your biography section.'}
              </p>
            </div>
            <div className="space-y-4">
              {renderColorInput('colors', 'biography.background', t('labelBackground'), 'tipBackground')}
              {renderColorInput('colors', 'biography.text', t('labelTextColor'), 'tipTextColor')}
            </div>

            {showAdvancedColors ? (
              <div className="space-y-4 pt-5 border-t border-neutral-800/60 animate-in fade-in duration-250">
                <h5 className="text-[14px] uppercase tracking-wider text-accent font-bold">
                  {currentLang === 'KO' ? '세부 조절 항목' : 'Detailed Bio Elements'}
                </h5>
                {renderColorInput('colors', 'biography.title', t('labelTitleColor'), 'tipTitleColor')}
                {renderColorInput('colors', 'biography.highlight', t('labelHighlightColor'), 'tipHighlightColor')}
              </div>
            ) : (
              <div className="text-center py-2 border border-dashed border-neutral-800 rounded-lg text-xs text-neutral-500">
                {currentLang === 'KO' ? '우측 상단의 [세부/고급 색상 조절] 버튼을 켜면 제목 색상, 강조 타이포그래피 등의 미세 색상을 조정할 수 있습니다.' : 'Turn on [Detailed/Advanced Colors] to style titles, highlight badges, and year ticks.'}
              </div>
            )}
          </div>
        );

      case 'portfolio':
        return (
          <div className="space-y-6">
            <div>
              <h4 className="text-[18px] uppercase tracking-wider text-neutral-400 font-bold mb-3 border-b border-neutral-800/80 pb-2">{t('sectionPortfolio')}</h4>
              <p className="text-[13px] text-neutral-500 mb-4 leading-relaxed">
                {currentLang === 'KO' ? '갤러리의 레이아웃 컬럼 개수와 전체 배경색 및 카드 배경색을 지정합니다.' : currentLang === 'DE' ? 'Legen Sie das Layout und das Design der Portfolio-Galerie fest.' : 'Configure gallery columns, primary background, and card background.'}
              </p>
            </div>

            <div className="space-y-4">
              {renderSlider('portfolio', 'columns', t('labelPortCols'), 'tipPortCols', 1, 6, 1, '')}
              {renderColorInput('colors', 'portfolio.background', t('labelBackground'), 'tipBackground')}
              {renderColorInput('colors', 'portfolio.cardBg', t('labelCardBg'), 'tipCardBg')}
            </div>

            {showAdvancedColors ? (
              <div className="space-y-6 pt-5 border-t border-neutral-800/60 animate-in fade-in duration-250">
                <div>
                  <h5 className="text-[14px] uppercase tracking-wider text-accent font-bold mb-3">
                    {currentLang === 'KO' ? '고급 배치 및 형태' : 'Sizing & Formats'}
                  </h5>
                  <div className="space-y-4">
                    {renderSlider('portfolio', 'gap', t('labelPortGap'), 'tipPortGap', 0, 64, 4, 'px')}
                    {renderToggle('portfolio', 'hoverEffect', t('labelPortHover'), 'tipPortHover')}
                    {renderToggle('portfolio', 'roundedCorners', t('labelPortRound'), 'tipPortRound')}
                  </div>
                </div>

                <div>
                  <h5 className="text-[14px] uppercase tracking-wider text-accent font-bold mb-3">
                    {currentLang === 'KO' ? '포트폴리오 세부 색상' : 'Detailed Portfolio Colors'}
                  </h5>
                  <div className="space-y-4">
                    {renderColorInput('colors', 'portfolio.title', t('labelTitleColor'), 'tipTitleColor')}
                    {renderColorInput('colors', 'portfolio.description', t('labelTextColor'), 'tipTextColor')}
                    {renderColorInput('colors', 'portfolio.cardText', currentLang === 'KO' ? '카드 내부 텍스트 색상' : 'Card Internal Text', 'tipTextColor')}
                    {renderColorInput('colors', 'portfolio.hoverOverlay', t('labelPlayBtn'), 'tipPlayBtn')}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-2 border border-dashed border-neutral-800 rounded-lg text-xs text-neutral-500">
                {currentLang === 'KO' ? '우측 상단의 [세부/고급 색상 조절] 버튼을 켜면 카드 여백 간격, 라운딩 효과, 마우스 오버 효과 및 글자색을 바꿀 수 있습니다.' : 'Turn on [Detailed/Advanced Colors] to adjust image gap pixels, rounded corners, zoom scales, text overlays, and hover opacity.'}
              </div>
            )}
          </div>
        );

      case 'videos':
        return (
          <div className="space-y-6">
            <div>
              <h4 className="text-[18px] uppercase tracking-wider text-neutral-400 font-bold mb-3 border-b border-neutral-800/80 pb-2">{t('sectionVideos')}</h4>
              <p className="text-[13px] text-neutral-500 mb-4 leading-relaxed">
                {currentLang === 'KO' ? '임베드 동영상 목록 영역의 주 배경색을 수정합니다.' : currentLang === 'DE' ? 'Ändern Sie das Farbschema des Videobereichs.' : 'Tune main background color for video blocks.'}
              </p>
            </div>
            <div className="space-y-4">
              {renderColorInput('colors', 'videos.background', t('labelBackground'), 'tipBackground')}
            </div>

            {showAdvancedColors ? (
              <div className="space-y-4 pt-5 border-t border-neutral-800/60 animate-in fade-in duration-250">
                <h5 className="text-[14px] uppercase tracking-wider text-accent font-bold">
                  {currentLang === 'KO' ? '세부 조절 항목' : 'Detailed Video Elements'}
                </h5>
                {renderColorInput('colors', 'videos.title', t('labelTitleColor'), 'tipTitleColor')}
                {renderColorInput('colors', 'videos.text', t('labelTextColor'), 'tipTextColor')}
                {renderColorInput('colors', 'videos.playButton', t('labelPlayBtn'), 'tipPlayBtn')}
              </div>
            ) : (
              <div className="text-center py-2 border border-dashed border-neutral-800 rounded-lg text-xs text-neutral-500">
                {currentLang === 'KO' ? '우측 상단의 [세부/고급 색상 조절] 버튼을 켜면 비디오 제목, 채널 설명 및 재생 아이콘의 세부 색상을 바꿀 수 있습니다.' : 'Turn on [Detailed/Advanced Colors] to refine title labels, paragraph captions, and play icons.'}
              </div>
            )}
          </div>
        );

      case 'schedule':
        return (
          <div className="space-y-6">
            <div>
              <h4 className="text-[18px] uppercase tracking-wider text-neutral-400 font-bold mb-3 border-b border-neutral-800/80 pb-2">{t('sectionSchedule')}</h4>
              <p className="text-[13px] text-neutral-500 mb-4 leading-relaxed">
                {currentLang === 'KO' ? '연주회 스케줄 섹션의 기본 배경 및 목록 일정이 표시될 가로 카드의 내부 색상을 제어합니다.' : currentLang === 'DE' ? 'Konfigurieren Sie das Erscheinungsbild der Termine.' : 'Set values for events listing background and calendar row backgrounds.'}
              </p>
            </div>
            <div className="space-y-4">
              {renderColorInput('colors', 'schedule.background', t('labelBackground'), 'tipBackground')}
              {renderColorInput('colors', 'schedule.cardBg', t('labelCardBg'), 'tipCardBg')}
            </div>

            {showAdvancedColors ? (
              <div className="space-y-4 pt-5 border-t border-neutral-800/60 animate-in fade-in duration-250">
                <h5 className="text-[14px] uppercase tracking-wider text-accent font-bold">
                  {currentLang === 'KO' ? '세부 조절 항목' : 'Detailed Schedule Elements'}
                </h5>
                {renderColorInput('colors', 'schedule.title', t('labelTitleColor'), 'tipTitleColor')}
                {renderColorInput('colors', 'schedule.text', t('labelTextColor'), 'tipTextColor')}
                {renderColorInput('colors', 'schedule.cardBorder', t('labelCardBorder'), 'tipCardBorder')}
                {renderColorInput('colors', 'schedule.buttonBg', t('labelHeroButtonBg'), 'tipHeroButtonBg')}
                {renderColorInput('colors', 'schedule.buttonText', t('labelHeroButtonText'), 'tipHeroButtonText')}
                {renderColorInput('colors', 'schedule.buttonHover', t('labelHeroButtonHover'), 'tipHeroButtonHover')}
              </div>
            ) : (
              <div className="text-center py-2 border border-dashed border-neutral-800 rounded-lg text-xs text-neutral-500">
                {currentLang === 'KO' ? '우측 상단의 [세부/고급 색상 조절] 버튼을 켜면 일정별 테두리 및 예매/더보기 버튼의 글자/배경/호버 색상을 조정할 수 있습니다.' : 'Turn on [Detailed/Advanced Colors] to style row borders, ticket buttons, and hover parameters.'}
              </div>
            )}
          </div>
        );

      case 'contact':
        return (
          <div className="space-y-6">
            <div>
              <h4 className="text-[18px] uppercase tracking-wider text-neutral-400 font-bold mb-3 border-b border-neutral-800/80 pb-2">{t('sectionContact')}</h4>
              <p className="text-[13px] text-neutral-500 mb-4 leading-relaxed">
                {currentLang === 'KO' ? '문의 양식 메시지 전송용 입력란 배경색과 최종 보내기 버튼의 배경을 조율합니다.' : currentLang === 'DE' ? 'Gestalten Sie das Kontaktformular.' : 'Design input background and action submit buttons.'}
              </p>
            </div>
            <div className="space-y-4">
              {renderColorInput('colors', 'forms.background', t('labelBackground'), 'tipBackground')}
              {renderColorInput('colors', 'forms.buttonBg', t('labelHeroButtonBg'), 'tipHeroButtonBg')}
            </div>

            {showAdvancedColors ? (
              <div className="space-y-4 pt-5 border-t border-neutral-800/60 animate-in fade-in duration-250">
                <h5 className="text-[14px] uppercase tracking-wider text-accent font-bold">
                  {currentLang === 'KO' ? '세부 조절 항목' : 'Detailed Form Elements'}
                </h5>
                {renderColorInput('colors', 'forms.text', t('labelTextColor'), 'tipTextColor')}
                {renderColorInput('colors', 'forms.border', t('labelCardBorder'), 'tipCardBorder')}
                {renderColorInput('colors', 'forms.focus', t('labelHighlightColor'), 'tipHighlightColor')}
                {renderColorInput('colors', 'forms.buttonText', t('labelHeroButtonText'), 'tipHeroButtonText')}
                {renderColorInput('colors', 'forms.buttonHover', t('labelHeroButtonHover'), 'tipHeroButtonHover')}
              </div>
            ) : (
              <div className="text-center py-2 border border-dashed border-neutral-800 rounded-lg text-xs text-neutral-500">
                {currentLang === 'KO' ? '우측 상단의 [세부/고급 색상 조절] 버튼을 켜면 입력 글자색, 포커스 강조 테두리, 버튼 텍스트/호버 색상을 변경할 수 있습니다.' : 'Turn on [Detailed/Advanced Colors] to specify input focused colors, borders, or submit labels.'}
              </div>
            )}
          </div>
        );

      case 'footer':
        return (
          <div className="space-y-6">
            <div>
              <h4 className="text-[18px] uppercase tracking-wider text-neutral-400 font-bold mb-3 border-b border-neutral-800/80 pb-2">{t('sectionFooter')}</h4>
              <p className="text-[13px] text-neutral-500 mb-4 leading-relaxed">
                {currentLang === 'KO' ? '하단 저작권 및 공통 푸터 영역의 전체 배경색과 기본 텍스트 색상을 설정합니다.' : currentLang === 'DE' ? 'Farben für den Fußbereich.' : 'Adjust primary background and default text in the footer.'}
              </p>
            </div>
            <div className="space-y-4">
              {renderColorInput('colors', 'footer.background', t('labelBackground'), 'tipBackground')}
              {renderColorInput('colors', 'footer.text', t('labelTextColor'), 'tipTextColor')}
            </div>

            {showAdvancedColors ? (
              <div className="space-y-4 pt-5 border-t border-neutral-800/60 animate-in fade-in duration-250">
                <h5 className="text-[14px] uppercase tracking-wider text-accent font-bold">
                  {currentLang === 'KO' ? '세부 조절 항목' : 'Detailed Footer Elements'}
                </h5>
                {renderColorInput('colors', 'footer.heading', t('labelTitleColor'), 'tipTitleColor')}
                {renderColorInput('colors', 'footer.links', t('labelHighlightColor'), 'tipHighlightColor')}
                {renderColorInput('colors', 'footer.hover', t('labelBtnHover'), 'tipBtnHover')}
                {renderColorInput('colors', 'footer.border', t('labelCardBorder'), 'tipCardBorder')}
              </div>
            ) : (
              <div className="text-center py-2 border border-dashed border-neutral-800 rounded-lg text-xs text-neutral-500">
                {currentLang === 'KO' ? '우측 상단의 [세부/고급 색상 조절] 버튼을 켜면 푸터 소셜 링크 색상, 마우스 호버 효과 및 테두리 구분선 색상을 수정할 수 있습니다.' : 'Turn on [Detailed/Advanced Colors] to paint link accents, partition lines, and copyright hovers.'}
              </div>
            )}
          </div>
        );

      case 'typography':
        return (
          <TypographyPanel 
            currentLang={currentLang} 
            typography={localState.typography} 
            onChange={(k, v) => handleUpdate('typography', k, v)} 
          />
        );

      case 'layout':
        return (
          <LayoutPanel 
            currentLang={currentLang} 
            layout={localState.layout} 
            onChange={(k, v) => handleUpdate('layout', k, v)} 
          />
        );

      case 'advanced':
        return (
          <div className="space-y-6">
            <div>
              <h4 className="text-[18px] uppercase tracking-wider text-neutral-400 font-bold mb-3 border-b border-neutral-800/80 pb-2">{t('sectionAdvanced')}</h4>
              <p className="text-[13px] text-neutral-500 mb-4 leading-relaxed">
                {currentLang === 'KO' ? '글로벌 화면 테마 모드(다크/라이트)와 전체 웹사이트의 기본 배경 및 시그니처 골드 포인트 색상을 변경합니다.' : currentLang === 'DE' ? 'Verwalten Sie globale Systemfarben, Animationen und Themes.' : 'Adjust system branding colors, slide motion curves, and access advanced theme templates or save configurations.'}
              </p>
            </div>

            <div className="space-y-4">
              {renderSelect('theme', '', currentLang === 'KO' ? '화면 테마 모드' : currentLang === 'DE' ? 'Farbmodus' : 'Theme Mode', 'tipGlobalFont', [
                { value: 'dark', label: 'Dark Mode' },
                { value: 'light', label: 'Light Mode' },
                { value: 'system', label: 'System Default' }
              ])}
              {renderColorInput('colors', 'background', currentLang === 'KO' ? '사이트 공통 배경색' : 'Global Canvas Background', 'appColorBgTip')}
              {renderColorInput('colors', 'accent', currentLang === 'KO' ? '공통 포인트 강조색 (골드)' : 'Global Highlight Accent', 'appColorAccentTip')}
            </div>

            {showAdvancedColors ? (
              <div className="space-y-6 pt-5 border-t border-neutral-800/60 animate-in fade-in duration-250">
                <div>
                  <h5 className="text-[14px] uppercase tracking-wider text-accent font-bold mb-3">
                    {currentLang === 'KO' ? '스크롤 애니메이션 효과' : 'Scroll Entrance Animations'}
                  </h5>
                  <div className="space-y-4">
                    {renderToggle('animation', 'enabled', t('labelAnimEnabled'), 'tipAnimEnabled')}
                    {renderSelect('animation', 'speed', t('labelAnimSpeed'), 'tipAnimSpeed', [
                      {value: 'slow', label: 'Slow'},
                      {value: 'normal', label: 'Normal'},
                      {value: 'fast', label: 'Fast'}
                    ])}
                    {renderSelect('animation', 'style', t('labelAnimStyle'), 'tipAnimStyle', [
                      {value: 'fade', label: 'Fade In'},
                      {value: 'slide', label: 'Slide Up'},
                      {value: 'none', label: 'None'}
                    ])}
                  </div>
                </div>

                <div>
                  <h5 className="text-[14px] uppercase tracking-wider text-accent font-bold mb-3">
                    {currentLang === 'KO' ? '기타 글로벌 기본 색상' : 'Other Global Core Colors'}
                  </h5>
                  <div className="space-y-4">
                    {renderColorInput('colors', 'text', currentLang === 'KO' ? '기본 본문 텍스트 색상' : 'Global Body Text Color', 'appColorTextTip')}
                    {renderColorInput('colors', 'primary', t('appColorPrimary' as any) as string || 'Primary Color', 'appColorPrimaryTip')}
                    {renderColorInput('colors', 'secondary', t('appColorSecondary' as any) as string || 'Secondary Color', 'appColorSecondaryTip')}
                    {renderColorInput('colors', 'surface', t('appColorSurface' as any) as string || 'Surface Blocks', 'appColorSurfaceTip')}
                    {renderColorInput('colors', 'borders', t('appColorBorders' as any) as string || 'Borders & Rules', 'appColorBordersTip')}
                    {renderColorInput('colors', 'muted', t('appColorMuted' as any) as string || 'Muted Description', 'appColorMutedTip')}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-2 border border-dashed border-neutral-800 rounded-lg text-xs text-neutral-500">
                {currentLang === 'KO' ? '우측 상단의 [세부/고급 색상 조절] 버튼을 켜면 스크롤 페이드/슬라이드 입체 애니메이션 속도 및 공통 시스템 기본 색상을 다룰 수 있습니다.' : 'Turn on [Detailed/Advanced Colors] to configure transition curves, scroll speed, and core system blocks.'}
              </div>
            )}

            {/* Accordion 1: Built-in & Custom Theme Library Presets */}
            <div className="border border-neutral-800 rounded-lg overflow-hidden mt-6 bg-[#0c0c0c]">
              <button 
                onClick={() => setIsPresetsOpen(!isPresetsOpen)}
                className="w-full flex items-center justify-between p-4 bg-neutral-900/50 hover:bg-neutral-900 transition-colors"
                type="button"
              >
                <span className="text-[15px] font-bold text-white uppercase tracking-wider">{currentLang === 'KO' ? '테마 프리셋 라이브러리' : currentLang === 'DE' ? 'Themenvorlagen' : 'Theme Presets Library'}</span>
                {isPresetsOpen ? <ChevronUp className="w-5 h-5 text-neutral-400" /> : <ChevronDown className="w-5 h-5 text-neutral-400" />}
              </button>
              {isPresetsOpen && (
                <div className="p-4 border-t border-neutral-800/80 bg-black/40">
                  <ThemeLibrary 
                    currentLang={currentLang}
                    currentAppearance={localState}
                    onApplyTheme={(theme) => {
                      setLocalState(theme);
                      updateAppearance(theme);
                      setHasChanges(true);
                    }}
                  />
                </div>
              )}
            </div>

            {/* Accordion 2: Published Version History Panel */}
            <div className="border border-neutral-800 rounded-lg overflow-hidden mt-4 bg-[#0c0c0c]">
              <button 
                onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                className="w-full flex items-center justify-between p-4 bg-neutral-900/50 hover:bg-neutral-900 transition-colors"
                type="button"
              >
                <span className="text-[15px] font-bold text-white uppercase tracking-wider">{currentLang === 'KO' ? '변경 이력 (버전 복원)' : currentLang === 'DE' ? 'Versionsverlauf' : 'Version History Restoration'}</span>
                {isHistoryOpen ? <ChevronUp className="w-5 h-5 text-neutral-400" /> : <ChevronDown className="w-5 h-5 text-neutral-400" />}
              </button>
              {isHistoryOpen && (
                <div className="p-4 border-t border-neutral-800/80 bg-black/40">
                  <AppearanceHistoryPanel 
                    currentLang={currentLang} 
                    currentAppearance={appearance}
                    onRestore={(restored) => {
                      const cleanRestored = { ...restored };
                      if (typeof cleanRestored.theme !== 'string' || !['dark', 'light', 'system'].includes(cleanRestored.theme)) {
                        cleanRestored.theme = 'dark';
                      }
                      setLocalState(cleanRestored);
                      updateAppearance(cleanRestored);
                      setHasChanges(true);
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderFooter = () => (
    <div className="flex items-center justify-between px-3 py-1.5 bg-black/40">
      <div className="flex items-center space-x-2">
        <button 
          onClick={handleUndo} 
          disabled={historyIndex <= 0}
          className="text-neutral-400 hover:text-white p-2.5 disabled:opacity-30 disabled:hover:text-neutral-400 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-neutral-800/50"
          title={currentLang === 'KO' ? '실행 취소' : 'Undo'}
        >
          <Undo className="w-5 h-5" />
        </button>
        <button 
          onClick={handleRedo} 
          disabled={historyIndex >= history.length - 1}
          className="text-neutral-400 hover:text-white p-2.5 disabled:opacity-30 disabled:hover:text-neutral-400 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-neutral-800/50"
          title={currentLang === 'KO' ? '다시 실행' : 'Redo'}
        >
          <Redo className="w-5 h-5" />
        </button>
      </div>
      <div className="flex items-center space-x-3">
        <button 
          onClick={handleResetToDefault}
          className="text-[15px] text-neutral-400 hover:text-white px-3.5 py-2.5 uppercase tracking-wider font-semibold transition-colors flex items-center space-x-1.5 min-h-[44px] rounded-lg hover:bg-neutral-800/40"
        >
          <RotateCcw className="w-4 h-4" />
          <span>{currentLang === 'KO' ? '전체 초기화' : 'Default Reset'}</span>
        </button>
        <button 
          onClick={handleReset}
          className="text-[15px] text-neutral-400 hover:text-white px-3.5 py-2.5 uppercase tracking-wider font-semibold transition-colors flex items-center space-x-1.5 min-h-[44px] rounded-lg hover:bg-neutral-800/40"
        >
          <RotateCcw className="w-4 h-4" />
          <span>{currentLang === 'KO' ? '출판본 복원' : 'Restore'}</span>
        </button>
        <button
          onClick={() => { setIsPublishModalOpen(true); setPublishNote(''); }}
          disabled={!hasChanges}
          className="bg-accent hover:bg-[#ebd04e] text-black px-5 py-2.5 rounded-lg text-[15px] font-bold uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1.5 shadow min-h-[44px]"
        >
          <Save className="w-4 h-4" />
          <span>{t('appPublish')}</span>
        </button>
      </div>
    </div>
  );

  return (
    <FloatingWindow title={t('appAppearanceTitle') as string} onClose={onClose} footer={renderFooter()}>
      {/* Premium widescreen grid side-by-side design */}
      <div className="flex-1 flex overflow-hidden bg-black/20" style={{ height: '100%' }}>
        
        {/* Left Sidebar - Navigation Items */}
        <div className="w-[220px] shrink-0 border-r border-neutral-850/50 bg-[#0d0d0d] flex flex-col justify-between overflow-y-auto custom-scrollbar p-2">
          <div className="space-y-1">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-lg text-left transition-all min-h-[46px] ${isActive ? 'bg-accent/15 text-accent font-bold border-l-4 border-accent' : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5 font-medium'}`}
                >
                  <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-accent' : 'text-neutral-500'}`} />
                  <span className="text-[15px] uppercase tracking-wide truncate">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Right Pane - Scrolling Control Desk */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-[#111111]/80">
          {activeTab !== 'typography' && activeTab !== 'layout' && (
            <div className="flex items-center justify-between pb-3.5 mb-5 border-b border-neutral-800/80">
              <div className="flex items-center space-x-2.5">
                <Settings2 className="text-accent w-4 h-4" />
                <span className="text-[13px] font-bold text-neutral-300 uppercase tracking-wider">
                  {tabs.find(t => t.id === activeTab)?.label}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowAdvancedColors(!showAdvancedColors)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border cursor-pointer select-none ${
                  showAdvancedColors 
                    ? 'bg-accent/15 border-accent text-accent' 
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>{currentLang === 'KO' ? '세부/고급 색상 조절' : 'Detailed/Advanced Colors'}</span>
              </button>
            </div>
          )}
          {renderActiveTabContent()}
        </div>
      </div>

      {/* Publish Modal */}
      {isPublishModalOpen && (
        <div className="absolute inset-0 z-[10000] flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="bg-[#141414] border border-neutral-800 rounded-xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-[18px] font-bold text-white mb-2 uppercase tracking-wider">{t('appPublishTitle')}</h3>
            <p className="text-[13px] text-neutral-400 mb-5 leading-normal">
              {currentLang === 'KO' 
                ? '현재까지 수정한 디자인 테마 설정을 웹사이트 실서버에 영구 반영하며, 버전 복원이 가능하도록 백업 기록을 남깁니다.' 
                : currentLang === 'DE'
                  ? 'Veröffentlichen Sie Ihr Design auf der Live-Site und erstellen Sie eine Sicherheitskopie im Versionsverlauf.'
                  : 'Permanently publish your customized visual settings to the live environment and create a restore snapshot.'}
            </p>
            <div className="mb-6">
              <label className="block text-[13px] uppercase tracking-wider text-neutral-400 font-bold mb-2">
                {currentLang === 'KO' ? '버전 메모 (선택사항)' : currentLang === 'DE' ? 'Versionsnotiz (optional)' : 'Version Note (Optional)'}
              </label>
              <input 
                type="text" 
                placeholder="e.g. 'Golden Theme Update'"
                value={publishNote}
                onChange={(e) => setPublishNote(e.target.value)}
                className="w-full bg-black border border-neutral-800 rounded-lg px-4 py-3 text-[15px] text-white focus:outline-none focus:border-accent font-medium min-h-[44px]"
                autoFocus
              />
            </div>
            <div className="flex items-center justify-end space-x-3.5">
              <button 
                onClick={() => setIsPublishModalOpen(false)} 
                className="px-4 py-2.5 text-[15px] uppercase tracking-wider font-semibold text-neutral-400 hover:text-white rounded-lg hover:bg-white/5 transition-all min-h-[44px]"
              >
                {currentLang === 'KO' ? '취소' : 'Cancel'}
              </button>
              <button 
                onClick={handlePublish} 
                disabled={isSaving} 
                className="bg-accent hover:bg-[#ebd04e] text-black px-5 py-2.5 rounded-lg text-[15px] font-bold uppercase tracking-wider flex items-center space-x-2 shadow min-h-[44px]"
              >
                {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{currentLang === 'KO' ? '출판하기' : 'Publish Live'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </FloatingWindow>
  );
}
