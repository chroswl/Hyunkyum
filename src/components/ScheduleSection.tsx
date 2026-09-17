import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, MapPin, Tag, Edit3, Plus, Trash2, Save, GripVertical, Check, X, 
  Sparkles, ExternalLink, ChevronDown, ChevronUp, Clock, Info, AlertCircle 
} from 'lucide-react';
import { ScheduleItem, Production, Performance, Language, ThemeSettings } from '../types';
import { translations } from '../translations';
import { User } from 'firebase/auth';
import { CollectionManager } from './admin/collection';
import { ensureAbsoluteUrl } from '../lib/mediaUtils';
import { 
  normalizeProduction, 
  createEmptyProduction, 
  getNearestUpcomingPerformance, 
  isProductionUpcoming 
} from '../lib/scheduleUtils';
import SmartImportModal from './admin/SmartImportModal';

interface ScheduleSectionProps {
  items: ScheduleItem[];
  currentLang: Language;
  setLang: (lang: Language) => void;
  user: User | null;
  activeEditSection: 'none' | 'biography' | 'press' | 'gallery' | 'videos' | 'schedule';
  setActiveEditSection: (section: 'none' | 'biography' | 'press' | 'gallery' | 'videos' | 'schedule') => void;
  onItemsUpdated: (items: ScheduleItem[]) => void;
  theme?: ThemeSettings;
}

export default function ScheduleSection({ 
  items: rawItems, 
  currentLang, 
  setLang, 
  user, 
  activeEditSection, 
  setActiveEditSection,
  onItemsUpdated,
  theme
}: ScheduleSectionProps) {
  const t = translations[currentLang];

  // Normalize items to ensure all have Production & Performance structures
  const items: Production[] = (rawItems || []).map(normalizeProduction);

  // Expanded card state for public schedule
  const [expandedProductions, setExpandedProductions] = useState<Record<string, boolean>>({});
  const [isSmartImportOpen, setIsSmartImportOpen] = useState(false);

  const toggleExpanded = (prodId: string) => {
    setExpandedProductions(prev => ({
      ...prev,
      [prodId]: !prev[prodId]
    }));
  };

  // Notifications
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  
  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const onReorderSchedule = (newItems: Production[]) => {
    const finalized = newItems.map((item, idx) => ({ ...item, order: idx }));
    onItemsUpdated(finalized);
    showNotification("Schedule reordered in draft");
  };

  const onAddSchedule = (newItem: Production) => {
    const savedItem: Production = {
      ...newItem,
      id: newItem.id || `schedule_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      order: items.length
    };
    const newItems = [...items, savedItem];
    onItemsUpdated(newItems);
    showNotification("Production added to draft");
  };

  const onUpdateSchedule = (updatedItem: Production) => {
    const newItems = items.map(i => i.id === updatedItem.id ? updatedItem : i);
    onItemsUpdated(newItems);
    showNotification("Production updated in draft");
  };

  const onDeleteSchedule = (id: string) => {
    const newItems = items.filter(i => i.id !== id);
    onItemsUpdated(newItems);
    showNotification("Production deleted from draft");
  };

  const scheduleItemSchema = (): Production => {
    const newProd = createEmptyProduction();
    newProd.order = items.length;
    return newProd;
  };

  // Helper to format date elegantly
  const formatDate = (dateStr: string) => {
    if (!dateStr) return { day: '--', month: '', year: '', fullDisplay: '' };
    
    // Handle YYYY-MM-DD cleanly without timezone offset issues
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parts[2].padStart(2, '0');
      
      let month = '';
      if (currentLang === 'KO') {
        month = `${monthIdx + 1}월`;
      } else {
        const monthsEN = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        const monthsDE = ['JAN', 'FEB', 'MÄR', 'APR', 'MAI', 'JUN', 'JUL', 'AUG', 'SEP', 'OKT', 'NOV', 'DEZ'];
        month = currentLang === 'DE' ? monthsDE[monthIdx] : monthsEN[monthIdx];
      }

      return {
        day,
        month,
        year,
        fullDisplay: `${day}. ${month} ${year}`
      };
    }

    const dateObj = new Date(dateStr);
    if (isNaN(dateObj.getTime())) return { day: '--', month: '', year: '', fullDisplay: dateStr };

    const day = dateObj.getDate().toString().padStart(2, '0');
    const monthIdx = dateObj.getMonth();
    
    let month = '';
    if (currentLang === 'KO') {
      month = `${monthIdx + 1}월`;
    } else {
      const monthsEN = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const monthsDE = ['JAN', 'FEB', 'MÄR', 'APR', 'MAI', 'JUN', 'JUL', 'AUG', 'SEP', 'OKT', 'NOV', 'DEZ'];
      month = currentLang === 'DE' ? monthsDE[monthIdx] : monthsEN[monthIdx];
    }

    const year = dateObj.getFullYear();
    return {
      day,
      month,
      year,
      fullDisplay: `${day}. ${month} ${year}`
    };
  };

  const getTagColor = (category: string) => {
    switch (category) {
      case 'Opera': return 'border-amber-500/30 text-amber-400 bg-amber-500/5';
      case 'Concert': return 'border-blue-500/30 text-blue-400 bg-blue-500/5';
      case 'Recital': return 'border-purple-500/30 text-purple-400 bg-purple-500/5';
      default: return 'border-neutral-500/30 bg-neutral-500/5';
    }
  };

  const getPerformanceCountLabel = (count: number) => {
    if (currentLang === 'KO') return `${count}회 공연`;
    if (currentLang === 'DE') return `${count} ${count === 1 ? 'Aufführung' : 'Aufführungen'}`;
    return `${count} ${count === 1 ? 'Performance' : 'Performances'}`;
  };

  return (
    <div id="schedule-section-root" className="w-full relative min-h-[400px]" style={{ backgroundColor: theme?.bg, color: theme?.text }}>
      {items.length > 0 && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(items.map(item => ({
            "@context": "https://schema.org",
            "@type": "MusicEvent",
            "name": item.title?.EN || "Performance",
            "startDate": new Date(item.performances?.[0]?.date || item.date || new Date()).toISOString(),
            "location": {
              "@type": "Place",
              "name": item.location?.EN || "Pfalztheater Kaiserslautern",
              "address": item.location?.DE || "Kaiserslautern, Germany"
            },
            "performer": {
              "@type": "Person",
              "name": "Hyunkyum Kim"
            },
            "description": `${item.category} - ${item.role?.EN || ''}`
          })))}} />
      )}
            
      {/* Toast notifications */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`absolute -top-12 left-1/2 -translate-x-1/2 z-50 px-4 py-2 border rounded-full text-xs tracking-wider uppercase font-sans flex items-center space-x-2 shadow-lg ${
              notification.type === 'success'
                ? 'border-emerald-500/30 bg-emerald-950/80 text-emerald-400 backdrop-blur-sm'
                : 'border-rose-500/30 bg-rose-950/80 text-rose-400 backdrop-blur-sm'
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            <span>{notification.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Smart Import Modal */}
      <SmartImportModal
        isOpen={isSmartImportOpen}
        onClose={() => setIsSmartImportOpen(false)}
        existingProductions={items}
        onApply={(updatedList) => {
          onItemsUpdated(updatedList);
          showNotification("Schedule imported into draft");
        }}
        currentLang={currentLang}
      />

      {user ? (
        <div className="max-w-4xl mx-auto px-6 py-12">
          {/* Admin Header with Smart Import trigger and language bar */}
          <div className="flex flex-wrap justify-between items-center mb-8 pb-4 border-b border-white/5 gap-4">
            <div className="flex items-center space-x-3">
              <span className="text-[9px] font-mono tracking-widest text-[#C9A227] uppercase bg-white/5 px-2 py-1 rounded">
                ADMIN ACCESS
              </span>
              <button
                type="button"
                onClick={() => setIsSmartImportOpen(true)}
                className="flex items-center space-x-1.5 px-3 py-1 rounded bg-[#C9A227]/10 hover:bg-[#C9A227]/20 border border-[#C9A227]/30 text-[#C9A227] text-[10px] uppercase tracking-wider font-semibold transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Smart Import Text</span>
              </button>
            </div>
            
            <div className="flex items-center space-x-1 bg-white/5 px-1.5 py-1 rounded-sm border border-white/10">
              {(['EN', 'DE', 'KO'] as Language[]).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLang(lang)}
                  className={`px-2.5 py-0.5 text-[10px] font-sans font-bold tracking-wider rounded-sm transition-all ${
                    currentLang === lang
                      ? 'bg-[#C9A227] text-black font-extrabold shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          <CollectionManager<Production>
            items={items}
            isAdmin={true}
            title="Productions"
            strategy="vertical"
            gridClassName="space-y-4 w-full"
            onReorder={onReorderSchedule}
            onAdd={onAddSchedule}
            onUpdate={onUpdateSchedule}
            onDelete={onDeleteSchedule}
            itemSchema={scheduleItemSchema}
            editorForm={({ item, onChange, onSave, onCancel, isSaving }) => {
              const handleAddPerf = () => {
                const newPerf: Performance = {
                  id: `perf-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
                  date: new Date().toISOString().split('T')[0],
                  startTime: '19:30',
                  venue: item.location?.EN ? item.location.EN.split(',')[0].trim() : '',
                  city: item.location?.EN && item.location.EN.includes(',') ? item.location.EN.split(',')[1].trim() : '',
                  ticketUrl: '',
                  ticketStatus: 'available',
                  isPremiere: !item.performances || item.performances.length === 0,
                  notes: ''
                };
                onChange({
                  ...item,
                  performances: [...(item.performances || []), newPerf]
                });
              };

              const handleUpdatePerf = (index: number, updates: Partial<Performance>) => {
                const updated = [...(item.performances || [])];
                updated[index] = { ...updated[index], ...updates };
                onChange({ ...item, performances: updated });
              };

              const handleDeletePerf = (index: number) => {
                const updated = (item.performances || []).filter((_, i) => i !== index);
                onChange({ ...item, performances: updated });
              };

              return (
                <div className="space-y-6">
                  {/* Category & General Link Row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5 text-left">
                      <label className="text-[10px] tracking-wider text-neutral-400 font-sans uppercase block font-semibold">Category</label>
                      <select
                        value={item.category || 'Opera'}
                        onChange={(e) => onChange({ ...item, category: e.target.value as any })}
                        className="w-full bg-black/40 border border-white/10 focus:border-[#C9A227] rounded-sm px-3 py-2 text-xs text-white focus:outline-none"
                      >
                        <option value="Opera">Opera</option>
                        <option value="Concert">Concert</option>
                        <option value="Recital">Recital</option>
                        <option value="Gala">Gala</option>
                      </select>
                    </div>

                    <div className="space-y-1.5 text-left">
                      <label className="text-[10px] tracking-wider text-neutral-400 font-sans uppercase block font-semibold">Season (e.g. 2026/27)</label>
                      <input
                        type="text"
                        placeholder="2026/27"
                        value={item.season || ''}
                        onChange={(e) => onChange({ ...item, season: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 focus:border-[#C9A227] rounded-sm px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5 text-left">
                      <label className="text-[10px] tracking-wider text-neutral-400 font-sans uppercase block font-semibold">General Link / Info URL</label>
                      <input
                        type="url"
                        placeholder="https://..."
                        value={item.generalLink || item.link || ''}
                        onChange={(e) => onChange({ ...item, generalLink: e.target.value, link: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 focus:border-[#C9A227] rounded-sm px-3 py-2 text-xs text-white focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  {/* Multilingual Titles, Roles, Locations */}
                  <div className="space-y-4 pt-3 border-t border-white/5">
                    <span className="text-[9px] font-mono text-[#C9A227] uppercase tracking-widest block font-bold mb-1 text-left">PRODUCTION METADATA</span>
                    
                    {/* Title */}
                    <div className="space-y-2 text-left">
                      <span className="text-[9px] font-mono text-neutral-300 uppercase tracking-widest block font-semibold">Production Title</span>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <input
                          type="text"
                          required
                          placeholder="Title (EN)"
                          value={item.title?.EN || ''}
                          onChange={(e) => onChange({
                            ...item,
                            title: { ...item.title, EN: e.target.value }
                          })}
                          className="w-full bg-black/40 border border-white/10 rounded-sm px-2.5 py-1.5 text-xs text-white focus:outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Title (DE)"
                          value={item.title?.DE || ''}
                          onChange={(e) => onChange({
                            ...item,
                            title: { ...item.title, DE: e.target.value }
                          })}
                          className="w-full bg-black/40 border border-white/10 rounded-sm px-2.5 py-1.5 text-xs text-white focus:outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Title (KO)"
                          value={item.title?.KO || ''}
                          onChange={(e) => onChange({
                            ...item,
                            title: { ...item.title, KO: e.target.value }
                          })}
                          className="w-full bg-black/40 border border-white/10 rounded-sm px-2.5 py-1.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Role */}
                    <div className="space-y-2 text-left">
                      <span className="text-[9px] font-mono text-neutral-300 uppercase tracking-widest block font-semibold">Role Description</span>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <input
                          type="text"
                          placeholder="Role (EN)"
                          value={item.role?.EN || ''}
                          onChange={(e) => onChange({
                            ...item,
                            role: { ...item.role, EN: e.target.value }
                          })}
                          className="w-full bg-black/40 border border-white/10 rounded-sm px-2.5 py-1.5 text-xs text-white focus:outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Role (DE)"
                          value={item.role?.DE || ''}
                          onChange={(e) => onChange({
                            ...item,
                            role: { ...item.role, DE: e.target.value }
                          })}
                          className="w-full bg-black/40 border border-white/10 rounded-sm px-2.5 py-1.5 text-xs text-white focus:outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Role (KO)"
                          value={item.role?.KO || ''}
                          onChange={(e) => onChange({
                            ...item,
                            role: { ...item.role, KO: e.target.value }
                          })}
                          className="w-full bg-black/40 border border-white/10 rounded-sm px-2.5 py-1.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Location */}
                    <div className="space-y-2 text-left">
                      <span className="text-[9px] font-mono text-neutral-300 uppercase tracking-widest block font-semibold">Theatre / Location / City</span>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <input
                          type="text"
                          placeholder="Location (EN)"
                          value={item.location?.EN || ''}
                          onChange={(e) => onChange({
                            ...item,
                            location: { ...item.location, EN: e.target.value }
                          })}
                          className="w-full bg-black/40 border border-white/10 rounded-sm px-2.5 py-1.5 text-xs text-white focus:outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Location (DE)"
                          value={item.location?.DE || ''}
                          onChange={(e) => onChange({
                            ...item,
                            location: { ...item.location, DE: e.target.value }
                          })}
                          className="w-full bg-black/40 border border-white/10 rounded-sm px-2.5 py-1.5 text-xs text-white focus:outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Location (KO)"
                          value={item.location?.KO || ''}
                          onChange={(e) => onChange({
                            ...item,
                            location: { ...item.location, KO: e.target.value }
                          })}
                          className="w-full bg-black/40 border border-white/10 rounded-sm px-2.5 py-1.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Performance Dates Sub-List */}
                  <div className="space-y-3 pt-3 border-t border-white/5 text-left">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono text-[#C9A227] uppercase tracking-widest block font-bold">
                        PERFORMANCE DATES ({(item.performances || []).length})
                      </span>
                      <button
                        type="button"
                        onClick={handleAddPerf}
                        className="px-2.5 py-1 rounded bg-[#C9A227]/10 hover:bg-[#C9A227]/20 text-[#C9A227] text-[10px] uppercase tracking-wider font-semibold flex items-center space-x-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Date</span>
                      </button>
                    </div>

                    <div className="space-y-3 max-h-72 overflow-y-auto custom-scrollbar p-1">
                      {(item.performances || []).map((perf, pIndex) => (
                        <div key={perf.id || pIndex} className="p-3.5 bg-black/40 border border-white/10 rounded-sm space-y-2.5">
                          <div className="flex items-center justify-between text-[9px] font-mono text-neutral-400 border-b border-white/5 pb-1.5">
                            <span className="font-bold text-[#C9A227]">Performance #{pIndex + 1}</span>
                            <div className="flex items-center space-x-3">
                              <label className="flex items-center space-x-1 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={!!perf.isPremiere}
                                  onChange={(e) => handleUpdatePerf(pIndex, { isPremiere: e.target.checked })}
                                  className="rounded border-white/20 text-[#C9A227] focus:ring-[#C9A227] bg-black/60"
                                />
                                <span className={`text-[9px] uppercase tracking-wider ${perf.isPremiere ? 'text-[#C9A227] font-bold' : 'text-neutral-400'}`}>
                                  Premiere
                                </span>
                              </label>
                              <button
                                type="button"
                                onClick={() => handleDeletePerf(pIndex)}
                                className="text-neutral-500 hover:text-red-400 p-0.5"
                                title="Delete Date"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                            <div>
                              <label className="block text-[9px] uppercase text-neutral-400 mb-0.5">Date</label>
                              <input
                                type="date"
                                value={perf.date}
                                onChange={(e) => handleUpdatePerf(pIndex, { date: e.target.value })}
                                className="w-full bg-black/60 border border-white/10 text-white text-xs rounded px-2 py-1 focus:outline-none focus:border-[#C9A227] font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] uppercase text-neutral-400 mb-0.5">Start Time</label>
                              <input
                                type="text"
                                placeholder="19:00"
                                value={perf.startTime || ''}
                                onChange={(e) => handleUpdatePerf(pIndex, { startTime: e.target.value })}
                                className="w-full bg-black/60 border border-white/10 text-white text-xs rounded px-2 py-1 focus:outline-none focus:border-[#C9A227] font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] uppercase text-neutral-400 mb-0.5">Venue / Stage</label>
                              <input
                                type="text"
                                placeholder="Werkstattbühne"
                                value={perf.venue || ''}
                                onChange={(e) => handleUpdatePerf(pIndex, { venue: e.target.value })}
                                className="w-full bg-black/60 border border-white/10 text-white text-xs rounded px-2 py-1 focus:outline-none focus:border-[#C9A227]"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] uppercase text-neutral-400 mb-0.5">City</label>
                              <input
                                type="text"
                                placeholder="Kaiserslautern"
                                value={perf.city || ''}
                                onChange={(e) => handleUpdatePerf(pIndex, { city: e.target.value })}
                                className="w-full bg-black/60 border border-white/10 text-white text-xs rounded px-2 py-1 focus:outline-none focus:border-[#C9A227]"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div>
                              <label className="block text-[9px] uppercase text-neutral-400 mb-0.5">Ticket Status</label>
                              <select
                                value={perf.ticketStatus || 'no_ticket'}
                                onChange={(e) => handleUpdatePerf(pIndex, { ticketStatus: e.target.value })}
                                className="w-full bg-black/60 border border-white/10 text-white text-xs rounded px-2 py-1 focus:outline-none focus:border-[#C9A227]"
                              >
                                <option value="available">Available (Tickets)</option>
                                <option value="sold_out">Sold Out (Ausverkauft)</option>
                                <option value="few_tickets">Few Tickets (Restkarten)</option>
                                <option value="no_ticket">No Ticket Link</option>
                                <option value="free">Free Entry (Kostenlos)</option>
                                <option value="cancelled">Cancelled (Abgesagt)</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[9px] uppercase text-neutral-400 mb-0.5">Notes</label>
                              <input
                                type="text"
                                placeholder="Wiederaufnahme, UA..."
                                value={perf.notes || ''}
                                onChange={(e) => handleUpdatePerf(pIndex, { notes: e.target.value })}
                                className="w-full bg-black/60 border border-white/10 text-white text-xs rounded px-2 py-1 focus:outline-none focus:border-[#C9A227]"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] uppercase text-neutral-400 mb-0.5">Ticket URL</label>
                              <input
                                type="url"
                                placeholder="https://..."
                                value={perf.ticketUrl || ''}
                                onChange={(e) => handleUpdatePerf(pIndex, { ticketUrl: e.target.value })}
                                className="w-full bg-black/60 border border-white/10 text-white text-xs rounded px-2 py-1 focus:outline-none focus:border-[#C9A227] font-mono"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-3 border-t border-white/5">
                    <button
                      type="button"
                      onClick={onCancel}
                      className="px-4 py-2 border border-white/10 hover:border-white/30 hover:bg-white/5 rounded-sm text-neutral-400 hover:text-white text-xs tracking-wider uppercase font-sans transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={onSave}
                      disabled={isSaving}
                      className="px-5 py-2 bg-[#C9A227] hover:bg-[#ebd04e] text-black font-semibold rounded-sm text-xs tracking-wider uppercase transition-all flex items-center space-x-1.5 cursor-pointer font-sans active:scale-95 shadow-md"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{isSaving ? "Saving..." : "Save"}</span>
                    </button>
                  </div>
                </div>
              );
            }}
            renderItem={(item) => {
              const { performance: mainPerf } = getNearestUpcomingPerformance(item);
              const formatted = formatDate(mainPerf?.date || item.date || '');
              const perfCount = (item.performances || []).length;
              return (
                <div className="w-full p-4 border border-white/5 bg-white/[0.01] rounded-sm flex items-start justify-between text-left">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-[10px] font-mono font-bold text-[#C9A227]">
                        {formatted.fullDisplay || item.date}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[8px] tracking-widest border uppercase font-sans ${getTagColor(item.category)}`}>
                        {item.category}
                      </span>
                      <span className="text-[9px] font-mono text-neutral-400 px-1.5 py-0.5 rounded bg-white/5">
                        {perfCount} {perfCount === 1 ? 'Date' : 'Dates'}
                      </span>
                    </div>
                    <h4 className="text-sm font-sans font-bold text-white mt-1 truncate">
                      {item.title[currentLang] || item.title['EN'] || item.title['DE'] || 'Untitled Production'}
                    </h4>
                    {item.role && (
                      <p className="text-xs text-neutral-400 font-sans mt-0.5">
                        {item.role[currentLang] || item.role['EN']} · {item.location[currentLang] || item.location['EN']}
                      </p>
                    )}
                  </div>
                </div>
              );
            }}
          />
        </div>
      ) : (
        /* ========================================================
            PUBLIC READ-ONLY EXPERIENCE (ONE CARD PER PRODUCTION)
            ======================================================== */
        items.length === 0 ? (
          <div className="text-center py-16 border bg-transparent/5/40 rounded-sm">
            <Calendar className="w-10 h-10 mx-auto mb-3 text-neutral-400" />
            <p className="text-sm tracking-wider">No scheduled performances found.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {items.map((production, idx) => {
              const { performance: mainPerf, isUpcoming } = getNearestUpcomingPerformance(production);
              const formattedDate = formatDate(mainPerf?.date || production.date || '');
              const perfCount = (production.performances || []).length;
              const isExpanded = expandedProductions[production.id] || false;
              const generalLink = production.generalLink || production.link;

              return (
                <div
                  key={production.id || `schedule-row-${idx}`}
                  id={`schedule-row-${production.id}`}
                  onClick={() => {
                    if (perfCount > 1) {
                      toggleExpanded(production.id);
                    }
                  }}
                  className={`group relative border rounded-sm p-4 sm:p-6 transition-all duration-300 ${
                    perfCount > 1 ? 'cursor-pointer hover:border-white/20 hover:bg-white/[0.015]' : ''
                  }`}
                  style={{ 
                    backgroundColor: theme?.bg ? 'color-mix(in srgb, var(--color-bg) 50.196078%, transparent)' : undefined, 
                    borderColor: theme?.border || (theme?.text ? 'color-mix(in srgb, var(--color-text) 12.549020%, transparent)' : undefined),
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    color: theme?.text 
                  }}
                >
                  {/* Main Grid View */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 items-start md:items-center">
                    {/* Date column (3 cols on desktop, responsive on mobile) */}
                    <div className="md:col-span-3 flex flex-row md:flex-col items-center md:items-start justify-between md:justify-start space-x-3 md:space-x-0 md:space-y-1 pb-3 md:pb-0 border-b md:border-b-0 md:border-r" style={{ borderColor: theme?.text ? 'color-mix(in srgb, var(--color-text) 12.549020%, transparent)' : 'rgba(255, 255, 255, 0.1)' }}>
                      <div className="flex items-baseline space-x-3 md:space-x-0 md:block">
                        <div className="text-3xl sm:text-4xl md:text-5xl font-serif font-light tracking-tight group-hover:font-medium transition-all leading-none">
                          {formattedDate.day}
                        </div>
                        <div className="flex flex-col md:mt-1">
                          <span className="text-xs md:text-sm tracking-[0.2em] font-sans font-medium uppercase">
                            {formattedDate.month}
                          </span>
                          <span className="text-[10px] tracking-widest font-mono text-neutral-400">
                            {formattedDate.year}
                          </span>
                        </div>
                      </div>
                      {mainPerf?.startTime && (
                        <div className="flex items-center space-x-1 text-[11px] md:text-[10px] font-mono text-[#C9A227] bg-[#C9A227]/10 md:bg-transparent px-2 py-0.5 md:px-0 md:py-0 rounded md:mt-0.5">
                          <Clock className="w-3 h-3 md:hidden shrink-0" />
                          <span>{mainPerf.startTime} Uhr</span>
                        </div>
                      )}
                    </div>

                    {/* Content details column (6 cols on desktop) */}
                    <div className="md:col-span-6 space-y-2.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] tracking-widest border uppercase font-semibold font-sans`} style={{ borderColor: theme?.text, color: theme?.text }}>
                          {production.category}
                        </span>
                        {perfCount > 1 && (
                          <span className="px-2 py-0.5 rounded text-[9px] uppercase tracking-widest font-mono border border-white/10 bg-white/5 text-[#C9A227]">
                            {getPerformanceCountLabel(perfCount)}
                          </span>
                        )}
                        {!isUpcoming && (
                          <span className="px-2 py-0.5 rounded text-[9px] uppercase tracking-widest font-mono bg-neutral-800/80 text-neutral-400">
                            Archiv / Past
                          </span>
                        )}
                        {mainPerf?.isPremiere && (
                          <span className="px-2 py-0.5 rounded text-[9px] uppercase tracking-wider font-mono font-medium bg-[#382B0A]/90 border border-[#94741B]/80 text-[#F0D586] shadow-[0_0_8px_rgba(201,162,39,0.18)] inline-flex items-center">
                            Premiere
                          </span>
                        )}
                      </div>

                      <h3 className="text-base md:text-lg font-serif font-light tracking-wide leading-snug group-hover:translate-x-1 transition-transform duration-300 break-words">
                        {production.title[currentLang] || production.title['EN'] || production.title['DE']}
                      </h3>

                      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-y-1.5 gap-x-4 text-xs font-sans">
                        {production.role && (production.role[currentLang] || production.role['EN']) && (
                          <div className="flex items-center space-x-1.5 min-w-0" style={{ color: theme?.text ? 'color-mix(in srgb, var(--color-text) 56.470588%, transparent)' : undefined }}>
                            <Tag className="w-3.5 h-3.5 shrink-0" />
                            <span className="break-words">
                              <strong className="font-normal">{t.roleLabel}:</strong> {production.role[currentLang] || production.role['EN']}
                            </span>
                          </div>
                        )}
                        {(mainPerf?.venue || mainPerf?.city || (production.location && (production.location[currentLang] || production.location['EN']))) && (
                          <div className="flex items-center space-x-1.5 min-w-0" style={{ color: theme?.text }}>
                            <MapPin className="w-3.5 h-3.5 shrink-0" />
                            <span className="break-words">
                              {[mainPerf?.venue, mainPerf?.city].filter(Boolean).join(', ') || (production.location && (production.location[currentLang] || production.location['EN']))}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions column (3 cols on desktop, responsive on mobile) */}
                    <div className="md:col-span-3 flex flex-row md:flex-col items-center md:items-end justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-white/5">
                      {/* Ticket or Main Link */}
                      {mainPerf?.ticketStatus === 'sold_out' ? (
                        <div className="px-4 sm:px-5 py-2 text-[10px] tracking-widest border border-[#6E222D] bg-[#3A141A]/90 text-[#E08590] rounded-sm uppercase font-sans font-medium whitespace-nowrap inline-flex items-center justify-center min-h-[36px] cursor-default">
                          <span>Sold Out</span>
                        </div>
                      ) : (mainPerf?.ticketUrl || generalLink) && mainPerf?.ticketStatus !== 'no_ticket' ? (
                        <a
                          href={ensureAbsoluteUrl(mainPerf?.ticketUrl || generalLink || '')}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="px-4 sm:px-5 py-2 text-[10px] tracking-widest hover:text-black border border-white/25 hover:bg-white transition-all duration-300 rounded-sm uppercase font-sans font-medium whitespace-nowrap cursor-pointer inline-flex items-center space-x-1 min-h-[36px]"
                        >
                          <span>Tickets</span>
                          <ExternalLink className="w-3 h-3 ml-1 opacity-70" />
                        </a>
                      ) : (
                        <div className="hidden md:block min-h-[36px]" />
                      )}

                      {/* Expand / Collapse Toggle for multiple performances */}
                      {perfCount > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpanded(production.id);
                          }}
                          className="flex items-center space-x-1 text-[10px] font-sans uppercase tracking-widest text-[#C9A227] hover:underline py-1 min-h-[36px] cursor-pointer"
                        >
                          <span>{isExpanded ? (currentLang === 'DE' ? 'Termine ausblenden' : currentLang === 'KO' ? '일정 접기' : 'Hide dates') : (currentLang === 'DE' ? `Alle Termine (${perfCount})` : currentLang === 'KO' ? `전체 일정 (${perfCount})` : `All dates (${perfCount})`)}</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded Performances List View */}
                  <AnimatePresence>
                    {isExpanded && perfCount > 1 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="mt-6 pt-6 border-t overflow-hidden"
                        style={{ borderColor: theme?.text ? 'color-mix(in srgb, var(--color-text) 12.549020%, transparent)' : 'rgba(255, 255, 255, 0.1)' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="text-[10px] uppercase font-mono tracking-widest text-[#C9A227] mb-3">
                          {currentLang === 'DE' ? 'Alle Vorstellungstermine' : currentLang === 'KO' ? '전체 공연 일정' : 'All Performance Dates'}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {production.performances.filter(p => p.id !== mainPerf?.id).map((perf, pIdx) => {
                            const pFormatted = formatDate(perf.date);
                            const pUrl = perf.ticketUrl || generalLink;
                            const isPerfPast = perf.date < new Date().toISOString().split('T')[0];

                            return (
                              <div
                                key={perf.id || pIdx}
                                className={`p-3.5 rounded border text-xs transition-colors flex flex-col justify-between space-y-3 min-w-0 ${
                                  isPerfPast 
                                    ? 'border-white/5 bg-white/[0.01] opacity-60' 
                                    : 'border-white/10 bg-white/[0.03] hover:border-[#C9A227]/40'
                                }`}
                              >
                                <div className="space-y-2 min-w-0">
                                  {/* Header row: Date */}
                                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                                    <span className="font-mono font-bold text-white text-xs whitespace-nowrap">
                                      {pFormatted.fullDisplay}
                                    </span>
                                  </div>

                                  {(perf.startTime || perf.venue || perf.city || perf.notes) && (
                                    <div className="space-y-1 text-[10px] text-neutral-400 font-sans min-w-0">
                                      {perf.startTime && (
                                        <div className="flex items-center space-x-1.5 font-mono text-neutral-300">
                                          <Clock className="w-3 h-3 text-[#C9A227] shrink-0" />
                                          <span>{perf.startTime} Uhr</span>
                                        </div>
                                      )}
                                      {(perf.venue || perf.city) && (
                                        <div className="flex items-start space-x-1.5 text-neutral-300 leading-normal min-w-0">
                                          <MapPin className="w-3 h-3 text-neutral-500 shrink-0 mt-0.5" />
                                          <span className="break-words font-normal text-neutral-400">
                                            {[perf.venue, perf.city].filter(Boolean).join(', ')}
                                          </span>
                                        </div>
                                      )}
                                      {perf.notes && (
                                        <div className="text-[#C9A227] text-[9px] font-mono font-medium pt-0.5 break-words">
                                          {perf.notes}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {!isPerfPast && (
                                  <div className="pt-1 flex justify-end min-h-[24px]">
                                    {perf.ticketStatus === 'sold_out' ? (
                                      <div className="text-[10px] uppercase font-mono tracking-widest text-[#E08590] py-1 cursor-default inline-flex items-center">
                                        Sold Out
                                      </div>
                                    ) : pUrl && perf.ticketStatus !== 'no_ticket' ? (
                                      <a
                                        href={ensureAbsoluteUrl(pUrl)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="text-[10px] uppercase font-mono tracking-widest text-[#C9A227] hover:underline inline-flex items-center space-x-1 py-1"
                                      >
                                        <span>Tickets</span>
                                        <ExternalLink className="w-2.5 h-2.5" />
                                      </a>
                                    ) : null}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
