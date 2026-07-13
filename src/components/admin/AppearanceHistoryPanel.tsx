import React, { useState, useEffect } from 'react';
import { AppearanceHistoryEntry, AppearanceSettings } from '../../types/appearance';
import { TranslationKey, translations } from '../../translations';
import { Language } from '../../types';

import { fetchAppearanceHistory } from '../../services/appearanceService';
import { Clock, RotateCcw, ChevronDown, ChevronRight, Search } from 'lucide-react';

interface AppearanceHistoryPanelProps {
  currentLang: Language;
  currentAppearance: AppearanceSettings;
  onRestore: (settings: AppearanceSettings) => void;
}

export default function AppearanceHistoryPanel({ currentAppearance, onRestore, currentLang }: AppearanceHistoryPanelProps) {
  const t = (key: TranslationKey) => translations[currentLang]?.[key] || translations.EN[key] || key;
  const [history, setHistory] = useState<AppearanceHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Localizations
  const titleLabel = currentLang === 'KO' ? '디자인 히스토리 (버전)' : currentLang === 'DE' ? 'Design-Versionsverlauf' : 'Design Version History';
  const searchPlaceholder = currentLang === 'KO' ? '메모 또는 버전 검색...' : currentLang === 'DE' ? 'Suchen nach Version oder Notiz...' : 'Search note or version...';
  const newestLabel = currentLang === 'KO' ? '최신 순' : currentLang === 'DE' ? 'Neueste zuerst' : 'Newest First';
  const oldestLabel = currentLang === 'KO' ? '오래된 순' : currentLang === 'DE' ? 'Älteste zuerst' : 'Oldest First';
  const loadingLabel = currentLang === 'KO' ? '버전 기록을 불러오는 중...' : currentLang === 'DE' ? 'Verlauf wird geladen...' : 'Loading history...';
  const emptyLabel = currentLang === 'KO' ? '기록된 디자인 버전이 없습니다.' : currentLang === 'DE' ? 'Kein Verlauf gefunden.' : 'No version history recorded.';
  const compareLabel = currentLang === 'KO' ? '현재 테마와의 차이점 비교' : currentLang === 'DE' ? 'Abweichungen zum aktuellen Thema' : 'Changes Comparison';
  const restoreLabel = currentLang === 'KO' ? '이 버전으로 복원' : currentLang === 'DE' ? 'Diese Version laden' : 'Restore This Version';
  const identicalLabel = currentLang === 'KO' ? '현재 설정과 정확히 일치합니다.' : currentLang === 'DE' ? 'Absolut identisch mit aktuellem Thema' : 'Absolutely identical to current theme';

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAppearanceHistory();
      setHistory(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const getChangedKeys = (oldSettings: AppearanceSettings, newSettings: AppearanceSettings) => {
    const changes: { category: string; key: string; oldValue: any; newValue: any }[] = [];
    
    // Flat comparison
    for (const [category, section] of Object.entries(oldSettings)) {
      if (typeof section === 'object' && section !== null) {
        for (const [k, v] of Object.entries(section)) {
          const newVal = (newSettings as any)[category]?.[k];
          if (v !== newVal) {
            changes.push({ category, key: k, oldValue: v, newValue: newVal });
          }
        }
      } else {
        const newVal = (newSettings as any)[category];
        if (section !== newVal) {
          changes.push({ category: 'root', key: category, oldValue: section, newValue: newVal });
        }
      }
    }
    return changes;
  };

  const filteredHistory = history
    .filter(h => {
      const matchNote = h.note?.toLowerCase().includes(search.toLowerCase());
      const matchVersion = h.version.toString().includes(search);
      return matchNote || matchVersion;
    })
    .sort((a, b) => sortOrder === 'newest' ? b.publishedAt - a.publishedAt : a.publishedAt - b.publishedAt);

  return (
    <div className="flex flex-col h-full bg-[#111] overflow-hidden rounded-lg">
      <div className="p-4 border-b border-neutral-900 shrink-0 space-y-4">
        <div className="flex items-center space-x-2.5 pb-2 border-b border-neutral-900">
          <Clock className="w-5 h-5 text-accent" />
          <h3 className="text-[18px] font-bold text-white tracking-wider uppercase">{titleLabel}</h3>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input 
              type="text" 
              placeholder={searchPlaceholder} 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-black border border-neutral-800 rounded-lg pl-10 pr-4 py-2.5 text-[15px] text-white focus:outline-none focus:border-neutral-600"
            />
          </div>
          <select 
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'newest'|'oldest')}
            className="bg-black border border-neutral-800 rounded-lg px-3 py-2.5 text-[15px] text-white focus:outline-none min-h-[44px]"
          >
            <option value="newest">{newestLabel}</option>
            <option value="oldest">{oldestLabel}</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[350px] custom-scrollbar">
        {isLoading ? (
          <div className="text-center text-[15px] text-neutral-500 py-10 animate-pulse font-medium">{loadingLabel}</div>
        ) : filteredHistory.length === 0 ? (
          <div className="text-center text-[15px] text-neutral-500 py-10 font-medium">{emptyLabel}</div>
        ) : (
          filteredHistory.map((entry, idx) => {
            const isExpanded = expandedId === entry.id;
            const changes = getChangedKeys(entry.appearance, currentAppearance);
            
            return (
              <div key={entry.id || idx} className="bg-black border border-neutral-800 rounded-lg overflow-hidden transition-all hover:border-neutral-700">
                <div 
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-all min-h-[56px]"
                  onClick={() => setExpandedId(isExpanded ? null : entry.id || null)}
                >
                  <div className="flex items-center space-x-3.5">
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-neutral-500" /> : <ChevronRight className="w-4 h-4 text-neutral-500" />}
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[15px] font-bold text-white bg-neutral-800 px-2 py-0.5 rounded">v{entry.version}</span>
                        {entry.note && <span className="text-[15px] text-accent font-medium">"{entry.note}"</span>}
                      </div>
                      <div className="text-[13px] text-neutral-500 mt-1">
                        {new Date(entry.publishedAt).toLocaleString()} by {entry.publishedBy || 'Admin'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="flex flex-col items-end mr-2">
                      <span className="text-[14px] text-white font-medium" style={{ fontFamily: entry.appearance.typography.headingFont }}>Aa</span>
                      <span className="text-[11px] text-neutral-500 font-mono" style={{ fontFamily: entry.appearance.typography.bodyFont }}>Aa</span>
                    </div>
                    <div className="flex space-x-1">
                      <div className="w-4 h-4 rounded-full border border-neutral-800/80 shadow" style={{ backgroundColor: entry.appearance.colors.background }} />
                      <div className="w-4 h-4 rounded-full border border-neutral-800/80 shadow" style={{ backgroundColor: entry.appearance.colors.primary }} />
                      <div className="w-4 h-4 rounded-full border border-neutral-800/80 shadow" style={{ backgroundColor: entry.appearance.colors.accent }} />
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-4 border-t border-neutral-800 bg-[#0a0a0a]">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-[13px] uppercase tracking-wider font-semibold text-neutral-400">{compareLabel}</h4>
                      <button
                        onClick={(e) => { e.stopPropagation(); onRestore(entry.appearance); }}
                        className="flex items-center space-x-1.5 text-[13px] bg-accent text-black font-semibold hover:bg-[#ebd04e] px-3.5 py-2 rounded-lg transition-colors min-h-[36px]"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>{restoreLabel}</span>
                      </button>
                    </div>

                    {changes.length === 0 ? (
                      <div className="text-[13px] text-neutral-500 italic">{identicalLabel}</div>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                        {changes.map((change, i) => (
                          <div key={i} className="flex items-center text-[13px] bg-black rounded-lg p-3 border border-neutral-900">
                            <span className="w-1/3 text-neutral-400 truncate font-mono" title={`${change.category}.${change.key}`}>{change.key}</span>
                            <span className="w-1/4 text-neutral-500 line-through truncate text-right">{change.oldValue?.toString()}</span>
                            <span className="mx-3 text-neutral-600 font-bold">→</span>
                            <span className="w-1/3 text-accent truncate font-bold">{change.newValue?.toString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
