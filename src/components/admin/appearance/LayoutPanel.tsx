import React from 'react';
import { AppearanceSettings } from '../../../types/appearance';
import { TranslationKey, translations } from '../../../translations';
import { Language } from '../../../types';
import { Info } from 'lucide-react';

interface LayoutPanelProps {
  currentLang: Language;
  layout: AppearanceSettings['layout'];
  onChange: (key: string, value: number) => void;
}

export default function LayoutPanel({ layout, onChange, currentLang }: LayoutPanelProps) {
  const t = (key: TranslationKey) => translations[currentLang]?.[key] || translations.EN[key] || key;

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

  const renderSlider = (key: keyof AppearanceSettings['layout'], label: string, tipKey: string, min: number, max: number, step: number, unit: string = 'px') => (
    <div className="mb-5">
      <div className="flex justify-between items-center mb-2">
        {renderLabelWithTip(label, tipKey)}
        <span className="text-white text-[15px] font-bold font-mono bg-neutral-800/50 px-2 py-0.5 rounded">{layout[key]}{unit}</span>
      </div>
      <input 
        type="range" 
        min={min} 
        max={max} 
        step={step} 
        value={layout[key]} 
        onChange={(e) => onChange(key as string, Number(e.target.value))} 
        className="w-full accent-accent cursor-pointer h-2 bg-neutral-800 rounded-lg appearance-none" 
      />
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h4 className="text-[18px] uppercase tracking-wider text-neutral-400 font-bold mb-4 border-b border-neutral-800/80 pb-2">
          {currentLang === 'KO' ? '컨테이너 설정' : currentLang === 'DE' ? 'Container' : 'Container'}
        </h4>
        {renderSlider('maxWidth', t('labelLayoutMaxW') as string, 'tipLayoutMaxW', 800, 1920, 20)}
      </div>

      <div>
        <h4 className="text-[18px] uppercase tracking-wider text-neutral-400 font-bold mb-4 border-b border-neutral-800/80 pb-2">
          {currentLang === 'KO' ? '공백 및 여백 설정' : currentLang === 'DE' ? 'Abstände' : 'Spacing'}
        </h4>
        {renderSlider('sectionSpacing', t('labelLayoutSecSpace') as string, 'tipLayoutSecSpace', 40, 200, 10)}
        {renderSlider('contentSpacing', t('labelLayoutConSpace') as string, 'tipLayoutConSpace', 16, 80, 4)}
        {renderSlider('verticalRhythm', t('labelLayoutVerticalRhythm') as string, 'tipLayoutVerticalRhythm', 4, 32, 4)}
      </div>

      <div>
        <h4 className="text-[18px] uppercase tracking-wider text-neutral-400 font-bold mb-4 border-b border-neutral-800/80 pb-2">
          {currentLang === 'KO' ? '세부 디자인 구성' : currentLang === 'DE' ? 'Elemente' : 'Elements'}
        </h4>
        {renderSlider('borderRadius', t('labelLayoutRadius') as string, 'tipLayoutRadius', 0, 32, 2)}
        {renderSlider('cardPadding', t('labelLayoutCardPad') as string, 'tipLayoutCardPad', 8, 64, 4)}
      </div>
    </div>
  );
}
