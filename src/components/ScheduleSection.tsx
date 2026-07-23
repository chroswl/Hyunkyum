import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, MapPin, Tag, Edit3, Plus, Trash2, Save, GripVertical, Check, X, Sparkles, ExternalLink 
} from 'lucide-react';
import { ScheduleItem, Language, ThemeSettings } from '../types';
import { translations } from '../translations';
import { User } from 'firebase/auth';
import { db, saveScheduleItem, deleteScheduleItem } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { CollectionManager } from './admin/collection';
import { ensureAbsoluteUrl } from '../lib/mediaUtils';

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
  items, 
  currentLang, 
  setLang, 
  user, 
  activeEditSection, 
  setActiveEditSection,
  onItemsUpdated,
  
  theme
}: ScheduleSectionProps) {
  const t = translations[currentLang];

  // Edit mode states
  const isEditMode = activeEditSection === 'schedule';
  const setIsEditMode = (mode: boolean) => {
    setActiveEditSection(mode ? 'schedule' : 'none');
  };
  const [editingItem, setEditingItem] = useState<Partial<ScheduleItem> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const originalItemRef = useRef<Partial<ScheduleItem> | null>(null);

  // Notifications
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  
  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const onReorderSchedule = (newItems: ScheduleItem[]) => {
    const finalized = newItems.map((item, idx) => ({ ...item, order: idx }));
    onItemsUpdated(finalized);
    showNotification("Schedule reordered in draft");
  };

  const onAddSchedule = (newItem: ScheduleItem) => {
    const savedItem = {
      ...newItem,
      id: newItem.id || `schedule_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      order: items.length
    };
    const newItems = [...items, savedItem];
    onItemsUpdated(newItems);
    showNotification("Event added to draft");
  };

  const onUpdateSchedule = (updatedItem: ScheduleItem) => {
    const newItems = items.map(i => i.id === updatedItem.id ? updatedItem : i);
    onItemsUpdated(newItems);
    showNotification("Event updated in draft");
  };

  const onDeleteSchedule = (id: string) => {
    const newItems = items.filter(i => i.id !== id);
    onItemsUpdated(newItems);
    showNotification("Event deleted from draft");
  };

  const scheduleItemSchema = (): ScheduleItem => ({
    id: `schedule-item-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    date: new Date().toISOString().split('T')[0],
    category: 'Opera',
    title: { EN: '', DE: '', KO: '' },
    role: { EN: '', DE: '', KO: '' },
    location: { EN: '', DE: '', KO: '' },
    link: '',
    order: items.length
  });

  // Helper to format date elegantly
  const formatDate = (dateStr: string) => {
    const dateObj = new Date(dateStr);
    if (isNaN(dateObj.getTime())) return { day: '', monthYear: dateStr };

    const day = dateObj.getDate().toString().padStart(2, '0');
    
    // Custom translation of month based on language
    let month = '';
    if (currentLang === 'KO') {
      month = `${dateObj.getMonth() + 1}월`;
    } else {
      const monthsEN = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const monthsDE = ['JAN', 'FEB', 'MÄR', 'APR', 'MAI', 'JUN', 'JUL', 'AUG', 'SEP', 'OKT', 'NOV', 'DEZ'];
      month = currentLang === 'DE' ? monthsDE[dateObj.getMonth()] : monthsEN[dateObj.getMonth()];
    }

    const year = dateObj.getFullYear();
    return {
      day,
      month,
      year,
      fullDisplay: `${month} ${day}, ${year}`
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

  const startNewPerformance = () => {
    const newItem: Partial<ScheduleItem> = {
      date: new Date().toISOString().split('T')[0],
      category: 'Opera',
      title: { EN: '', DE: '', KO: '' },
      role: { EN: '', DE: '', KO: '' },
      location: { EN: '', DE: '', KO: '' },
      link: ''
    };
    setEditingItem(newItem);
    originalItemRef.current = newItem;
  };

  const startEditPerformance = (item: ScheduleItem) => {
    const parsedItem = {
      ...item,
      title: item.title || { EN: '', DE: '', KO: '' },
      role: item.role || { EN: '', DE: '', KO: '' },
      location: item.location || { EN: '', DE: '', KO: '' }
    };
    setEditingItem(parsedItem);
    originalItemRef.current = JSON.parse(JSON.stringify(parsedItem));
  };

  const handleDeletePerformance = async (id: string) => {
    
    try {
      // local delete
      const newItems = items.filter(item => item.id !== id);
      onItemsUpdated(newItems);
      showNotification("Performance deleted successfully");
    } catch (err: any) {
      console.error("Error deleting performance:", err);
      showNotification(`Failed to delete performance: ${err.message || 'Unknown error'}`, "error");
    }
  };

  const handleCancelEdit = () => {
    const hasChanges = JSON.stringify(editingItem) !== JSON.stringify(originalItemRef.current);
    if (!hasChanges || true) {
      setEditingItem(null);
      originalItemRef.current = null;
    }
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.date) {
      alert("Please provide a valid date");
      return;
    }
    setIsSaving(true);
    try {
      const saveItem = { ...editingItem };
      if (saveItem.order === undefined) {
        saveItem.order = items.length;
      }
      const saved = { ...saveItem };
      if (!saved.id) saved.id = 'temp_' + Date.now();
      
      const newItems = items.find(i => i.id === saved.id)
        ? items.map(i => i.id === saved.id ? saved : i)
        : [...items, saved];
      
      onItemsUpdated(newItems);
      setEditingItem(null);
      originalItemRef.current = null;
      
    } catch (err) {
      console.error("Error saving schedule:", err);
      showNotification("Failed to save schedule", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div id="schedule-section-root" className="w-full relative min-h-[400px]" style={{ backgroundColor: theme?.bg, color: theme?.text }}>
      {items.length > 0 && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(items.map(item => ({
            "@context": "https://schema.org",
            "@type": "MusicEvent",
            "name": item.title?.EN || "Performance",
            "startDate": new Date(item.date || new Date()).toISOString(),
            "location": {
              "@type": "Place",
              "name": "Pfalztheater Kaiserslautern",
              "address": "Kaiserslautern, Germany"
            },
            "performer": {
              "@type": "Person",
              "name": "Hyunkyum Kim"
            },
            "description": "Performance"
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


      {user ? (
        <div className="max-w-4xl mx-auto px-6 py-12">
          {/* Admin Header with integrated language bar */}
          <div className="flex flex-wrap justify-between items-center mb-8 pb-4 border-b border-white/5 gap-4">
            <div className="flex items-center space-x-3">
              <span className="text-[9px] font-mono tracking-widest text-[#C9A227] uppercase bg-white/5 px-2 py-1 rounded">
                ADMIN ACCESS
              </span>
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

          <CollectionManager<ScheduleItem>
            items={items}
            isAdmin={true}
            title="Schedule of Performances"
            strategy="vertical"
            gridClassName="space-y-4 w-full"
            onReorder={onReorderSchedule}
            onAdd={onAddSchedule}
            onUpdate={onUpdateSchedule}
            onDelete={onDeleteSchedule}
            itemSchema={scheduleItemSchema}
            editorForm={({ item, onChange, onSave, onCancel, isSaving }) => (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] tracking-wider text-neutral-400 font-sans uppercase block font-semibold">Date</label>
                    <input
                      type="date"
                      required
                      value={item.date || ''}
                      onChange={(e) => onChange({ ...item, date: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 focus:border-[#C9A227] rounded-sm px-3 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>

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
                    <label className="text-[10px] tracking-wider text-neutral-400 font-sans uppercase block font-semibold">Ticket URL / Link</label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={item.link || ''}
                      onChange={(e) => onChange({ ...item, link: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 focus:border-[#C9A227] rounded-sm px-3 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* Translation Inputs */}
                <div className="space-y-4 pt-3 border-t border-white/5">
                  <span className="text-[9px] font-mono text-[#C9A227] uppercase tracking-widest block font-bold mb-1 text-left">MULTILINGUAL METADATA TRANSLATIONS</span>
                  
                  {/* Title Translations */}
                  <div className="space-y-2 text-left">
                    <span className="text-[9px] font-mono text-neutral-300 uppercase tracking-widest block font-semibold">Performance Title</span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input
                        type="text"
                        required
                        placeholder="Title (EN)"
                        value={item.title?.EN || ''}
                        onChange={(e) => onChange({
                          ...item,
                          title: { ...item.title, EN: e.target.value } as any
                        })}
                        className="w-full bg-black/40 border border-white/10 rounded-sm px-2.5 py-1.5 text-xs text-white focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Title (DE)"
                        value={item.title?.DE || ''}
                        onChange={(e) => onChange({
                          ...item,
                          title: { ...item.title, DE: e.target.value } as any
                        })}
                        className="w-full bg-black/40 border border-white/10 rounded-sm px-2.5 py-1.5 text-xs text-white focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Title (KO)"
                        value={item.title?.KO || ''}
                        onChange={(e) => onChange({
                          ...item,
                          title: { ...item.title, KO: e.target.value } as any
                        })}
                        className="w-full bg-black/40 border border-white/10 rounded-sm px-2.5 py-1.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Role Translations */}
                  <div className="space-y-2 text-left">
                    <span className="text-[9px] font-mono text-neutral-300 uppercase tracking-widest block font-semibold">Role Description</span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input
                        type="text"
                        placeholder="Role (EN)"
                        value={item.role?.EN || ''}
                        onChange={(e) => onChange({
                          ...item,
                          role: { ...item.role, EN: e.target.value } as any
                        })}
                        className="w-full bg-black/40 border border-white/10 rounded-sm px-2.5 py-1.5 text-xs text-white focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Role (DE)"
                        value={item.role?.DE || ''}
                        onChange={(e) => onChange({
                          ...item,
                          role: { ...item.role, DE: e.target.value } as any
                        })}
                        className="w-full bg-black/40 border border-white/10 rounded-sm px-2.5 py-1.5 text-xs text-white focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Role (KO)"
                        value={item.role?.KO || ''}
                        onChange={(e) => onChange({
                          ...item,
                          role: { ...item.role, KO: e.target.value } as any
                        })}
                        className="w-full bg-black/40 border border-white/10 rounded-sm px-2.5 py-1.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Location Translations */}
                  <div className="space-y-2 text-left">
                    <span className="text-[9px] font-mono text-neutral-300 uppercase tracking-widest block font-semibold">Theatre / Location / City</span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input
                        type="text"
                        placeholder="Location (EN)"
                        value={item.location?.EN || ''}
                        onChange={(e) => onChange({
                          ...item,
                          location: { ...item.location, EN: e.target.value } as any
                        })}
                        className="w-full bg-black/40 border border-white/10 rounded-sm px-2.5 py-1.5 text-xs text-white focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Location (DE)"
                        value={item.location?.DE || ''}
                        onChange={(e) => onChange({
                          ...item,
                          location: { ...item.location, DE: e.target.value } as any
                        })}
                        className="w-full bg-black/40 border border-white/10 rounded-sm px-2.5 py-1.5 text-xs text-white focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Location (KO)"
                        value={item.location?.KO || ''}
                        onChange={(e) => onChange({
                          ...item,
                          location: { ...item.location, KO: e.target.value } as any
                        })}
                        className="w-full bg-black/40 border border-white/10 rounded-sm px-2.5 py-1.5 text-xs text-white focus:outline-none"
                      />
                    </div>
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
            )}
            renderItem={(item) => {
              const formatted = formatDate(item.date);
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
                    </div>
                    <h4 className="text-sm font-sans font-bold text-white mt-1 truncate">
                      {item.title[currentLang] || item.title['EN']}
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
            PUBLIC READ-ONLY EXPERIENCE
            ======================================================== */
        items.length === 0 ? (
          <div className="text-center py-16 border bg-transparent/5/40 rounded-sm">
            <Calendar className="w-10 h-10 mx-auto mb-3 text-neutral-400" />
            <p className="text-sm tracking-wider">No scheduled performances found.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {items.map((item, idx) => {
              const formattedDate = formatDate(item.date);
              return (
                <div
                  key={item.id || `schedule-row-${idx}`}
                  id={`schedule-row-${item.id}`}
                  className="group relative border rounded-sm p-6 transition-all duration-300 grid grid-cols-1 md:grid-cols-12 gap-6 items-center"
                  style={{ 
                    backgroundColor: theme?.bg ? 'color-mix(in srgb, var(--color-bg) 50.196078%, transparent)' : undefined, 
                    borderColor: theme?.border || (theme?.text ? 'color-mix(in srgb, var(--color-text) 12.549020%, transparent)' : undefined),
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    color: theme?.text 
                  }}
                >
                  {/* Date column (3 cols) */}
                  <div className="md:col-span-3 flex md:flex-col items-center md:items-start space-x-4 md:space-x-0 md:space-y-1 md:border-r" style={{ borderColor: theme?.text ? 'color-mix(in srgb, var(--color-text) 12.549020%, transparent)' : 'rgba(255, 255, 255, 0.1)' }}>
                    <div className="text-4xl md:text-5xl font-serif font-light tracking-tight group-hover:font-medium transition-all">
                      {formattedDate.day}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs md:text-sm tracking-[0.2em] font-sans font-medium uppercase">
                        {formattedDate.month}
                      </span>
                      <span className="text-[10px] tracking-widest font-mono">
                        {formattedDate.year}
                      </span>
                    </div>
                  </div>

                  {/* Content details column (7 cols) */}
                  <div className="md:col-span-7 space-y-2.5">
                    <div className="flex items-center space-x-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] tracking-widest border uppercase font-semibold font-sans`} style={{ borderColor: theme?.text, color: theme?.text }}>
                        {item.category}
                      </span>
                    </div>

                    <h3 className="text-base md:text-lg font-serif font-light tracking-wide leading-tight group-hover:translate-x-1 transition-transform duration-300">
                      {item.title[currentLang] || item.title['EN']}
                    </h3>

                    <div className="flex flex-col sm:flex-row sm:items-center space-y-1.5 sm:space-y-0 sm:space-x-4 text-xs font-sans">
                      {item.role && (item.role[currentLang] || item.role['EN']) && (
                        <div className="flex items-center space-x-1.5" style={{ color: theme?.text ? 'color-mix(in srgb, var(--color-text) 56.470588%, transparent)' : undefined }}>
                          <Tag className="w-3.5 h-3.5" />
                          <span>
                            <strong className="font-normal">{t.roleLabel}:</strong> {item.role[currentLang] || item.role['EN']}
                          </span>
                        </div>
                      )}
                      {item.location && (item.location[currentLang] || item.location['EN']) && (
                        <div className="flex items-center space-x-1.5" style={{ color: theme?.text }}>
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{item.location[currentLang] || item.location['EN']}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Link / Action column (2 cols) */}
                  <div className="md:col-span-2 flex justify-end items-center space-x-3 mt-4 md:mt-0">
                    {item.link && (
                      <a
                        href={ensureAbsoluteUrl(item.link)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-5 py-2 text-[10px] tracking-widest hover:text-black border border-white/25 hover:bg-white transition-all duration-300 rounded-sm uppercase font-sans font-medium whitespace-nowrap cursor-pointer"
                      >
                        Tickets
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
