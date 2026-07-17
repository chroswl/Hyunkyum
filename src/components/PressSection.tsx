import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, ChevronRight, Edit3, Plus, Trash2, X, Save, 
  GripVertical, Check, ExternalLink, Sparkles 
} from 'lucide-react';
import { PressItem, Language } from '../types';
import { translations } from '../translations';
import { fetchPress, savePressItem, deletePressItem, db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';

import { CollectionManager } from './admin/collection';

interface PressSectionProps {
  items?: PressItem[];
  t?: any;
  onItemsUpdated?: (items: PressItem[]) => void;
  currentLang: Language;
  setLang: (lang: Language) => void;
  user: User | null;
  activeEditSection: 'none' | 'biography' | 'press' | 'gallery' | 'videos' | 'schedule';
  setActiveEditSection: (section: 'none' | 'biography' | 'press' | 'gallery' | 'videos' | 'schedule') => void;
  theme?: any;
  onThemeUpdated?: (newTheme: any) => void;
}

export default function PressSection({ currentLang, setLang, user, activeEditSection, setActiveEditSection, theme, onThemeUpdated = () => {}, items: propItems, onItemsUpdated }: PressSectionProps) {
  const [pressItems, setPressItems] = useState<PressItem[]>(propItems || []);
  useEffect(() => {
    if (propItems) {
      setPressItems(propItems);
      if (propItems.length > 0) {
        setSelectedItemId(prev => {
          if (!prev || !propItems.some(item => item.id === prev)) {
            return propItems[0].id;
          }
          return prev;
        });
      } else {
        setSelectedItemId(null);
      }
    }
  }, [propItems]);
  const [loading, setLoading] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  
  // Edit mode states
  const isEditMode = activeEditSection === 'press';
  const setIsEditMode = (mode: boolean) => {
    setActiveEditSection(mode ? 'press' : 'none');
  };
  const [editingItem, setEditingItem] = useState<Partial<PressItem> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const originalItemRef = useRef<Partial<PressItem> | null>(null);

  // Notification Toast state
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const t = translations[currentLang];

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const onReorderPress = async (newItems: PressItem[]) => {
    setPressItems(newItems);
    if (onItemsUpdated) onItemsUpdated(newItems);
    try {
      for (let i = 0; i < newItems.length; i++) {
        const item = newItems[i];
        if (item.order !== i) {
          item.order = i;
          await savePressItem(item);
        }
      }
      showNotification("Press items reordered");
    } catch (err) {
      console.error(err);
      showNotification("Failed to save reorder", "error");
    }
  };

  const onAddPress = async (newItem: PressItem) => {
    try {
      const newItems = [...pressItems, newItem];
      setPressItems(newItems);
      if (onItemsUpdated) onItemsUpdated(newItems);
      await savePressItem(newItem);
      setSelectedItemId(newItem.id);
      showNotification("Press review added");
    } catch (err) {
      console.error(err);
      showNotification("Failed to add item", "error");
    }
  };

  const onUpdatePress = async (updatedItem: PressItem) => {
    try {
      const newItems = pressItems.map(i => i.id === updatedItem.id ? updatedItem : i);
      setPressItems(newItems);
      if (onItemsUpdated) onItemsUpdated(newItems);
      await savePressItem(updatedItem);
      showNotification("Press review updated");
    } catch (err) {
      console.error(err);
      showNotification("Failed to update item", "error");
    }
  };

  const onDeletePress = async (id: string) => {
    try {
      const newItems = pressItems.filter(i => i.id !== id);
      setPressItems(newItems);
      if (onItemsUpdated) onItemsUpdated(newItems);
      if (selectedItemId === id) {
        setSelectedItemId(newItems.length > 0 ? newItems[0].id : null);
      }
      await deletePressItem(id);
      showNotification("Press review deleted");
    } catch (err) {
      console.error(err);
      showNotification("Failed to delete item", "error");
    }
  };

  const pressItemSchema = (): PressItem => ({
    id: `press-item-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    source: '',
    rating: 5,
    quote: { EN: '', DE: '', KO: '' },
    author: '',
    date: new Date().toISOString().split('T')[0],
    link: '',
    type: 'Review',
    order: pressItems.length
  });

  const loadPress = async () => {
    try {
      const data = await fetchPress();
      setPressItems(data);
      // Initialize selectedItemId if not set or if it's no longer in the list
      if (data.length > 0) {
        if (!selectedItemId || !data.some(item => item.id === selectedItemId)) {
          setSelectedItemId(data[0].id);
        }
      } else {
        setSelectedItemId(null);
      }
    } catch (err) {
      console.error("Error loading press reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  // loadPress is no longer needed on mount, propItems provides data

  // Compute active/current index based on selectedItemId
  const activeIndex = selectedItemId 
    ? pressItems.findIndex(item => item.id === selectedItemId) 
    : 0;
  const currentIndex = activeIndex >= 0 ? activeIndex : 0;
  const currentItem = pressItems[currentIndex];

  const handlePrev = () => {
    if (pressItems.length <= 1) return;
    const prevIndex = (currentIndex - 1 + pressItems.length) % pressItems.length;
    setSelectedItemId(pressItems[prevIndex].id);
  };

  const handleNext = () => {
    if (pressItems.length <= 1) return;
    const nextIndex = (currentIndex + 1) % pressItems.length;
    setSelectedItemId(pressItems[nextIndex].id);
  };

  const startNewPress = () => {
    const newItem: Partial<PressItem> = {
      source: '',
      rating: 5,
      quote: { EN: '', DE: '', KO: '' },
      author: '',
      date: new Date().toISOString().split('T')[0],
      link: '',
      type: 'Review'
    };
    setEditingItem(newItem);
    originalItemRef.current = newItem;
  };

  const startEditPress = (item: PressItem) => {
    setEditingItem({ ...item });
    originalItemRef.current = { ...item };
  };

  const handleDeletePress = async (id: string) => {
    try {
      const filtered = pressItems.filter(item => item.id !== id);
      setPressItems(filtered);
      if (onItemsUpdated) onItemsUpdated(filtered);
      if (selectedItemId === id) {
        setSelectedItemId(filtered.length > 0 ? filtered[0].id : null);
      }
      showNotification("Review deleted successfully");
    } catch (err: any) {
      console.error("Error deleting review:", err);
      showNotification(`Failed to delete review: ${err.message || 'Unknown error'}`, "error");
    }
  };

  const handleCancelEdit = () => {
    const hasChanges = JSON.stringify(editingItem) !== JSON.stringify(originalItemRef.current);
    if (hasChanges) {
      if (true) {
        setEditingItem(null);
        originalItemRef.current = null;
      }
    } else {
      setEditingItem(null);
      originalItemRef.current = null;
    }
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setIsSaving(true);
    try {
      const saved = { ...editingItem };
      if (!saved.id) {
        saved.id = 'temp_' + Date.now();
      }
      if (saved.order === undefined) {
        saved.order = pressItems.length;
      }
      const newItems = pressItems.find(i => i.id === saved.id)
        ? pressItems.map(i => i.id === saved.id ? saved : i)
        : [...pressItems, saved];
      
      setPressItems(newItems);
      if (onItemsUpdated) onItemsUpdated(newItems);
      setSelectedItemId(saved.id);
      
      setEditingItem(null);
      originalItemRef.current = null;
      
      showNotification("Review saved successfully!");
      // custom event removed
    } catch (err) {
      console.error("Error saving review:", err);
      showNotification("Failed to save changes", "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="animate-pulse flex flex-col items-center space-y-4">
          <div className="w-12 h-[1px]" style={{ backgroundColor: theme?.text ? `${theme.text}20` : 'rgba(255, 255, 255, 0.2)' }} />
          <span className="text-[10px] tracking-[0.3em] uppercase font-sans" style={{ color: theme?.text ? `${theme.text}60` : undefined }}>Loading Reviews</span>
        </div>
      </div>
    );
  }

  return (
    <div id="press-section-root" className="w-full relative min-h-[300px]" style={{ backgroundColor: theme?.bg, color: theme?.text }}>
      
      {/* Dynamic Success/Error Notifications */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`absolute top-0 left-1/2 -translate-x-1/2 z-50 px-4 py-2 border rounded-full text-xs tracking-wider uppercase font-sans flex items-center space-x-2 shadow-lg ${
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
          <CollectionManager<PressItem>
            items={pressItems}
            isAdmin={true}
            title="Press Review"
            strategy="vertical"
            gridClassName="space-y-4 w-full"
            onReorder={onReorderPress}
            onAdd={onAddPress}
            onUpdate={onUpdatePress}
            onDelete={onDeletePress}
            itemSchema={pressItemSchema}
            editorForm={({ item, onChange, onSave, onCancel, isSaving }) => (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 font-sans uppercase block text-left font-bold">Source / Publication</label>
                    <input
                      type="text"
                      placeholder="e.g. Das Opernglas"
                      value={item.source || ''}
                      onChange={(e) => onChange({ ...item, source: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 focus:border-[#C9A227] rounded-sm px-2.5 py-1.5 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 font-sans uppercase block text-left font-bold">Author</label>
                    <input
                      type="text"
                      placeholder="e.g. Dr. Müller"
                      value={item.author || ''}
                      onChange={(e) => onChange({ ...item, author: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 focus:border-[#C9A227] rounded-sm px-2.5 py-1.5 text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 font-sans uppercase block text-left font-bold">Date</label>
                    <input
                      type="date"
                      value={item.date || ''}
                      onChange={(e) => onChange({ ...item, date: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 focus:border-[#C9A227] rounded-sm px-2.5 py-1.5 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 font-sans uppercase block text-left font-bold">Type</label>
                    <select
                      value={item.type || 'Review'}
                      onChange={(e) => onChange({ ...item, type: e.target.value as any })}
                      className="w-full bg-black/40 border border-white/10 focus:border-[#C9A227] rounded-sm px-2.5 py-1.5 text-xs text-white focus:outline-none"
                    >
                      <option value="Review">Review</option>
                      <option value="Interview">Interview</option>
                      <option value="Article">Article</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-400 font-sans uppercase block text-left font-bold">Link</label>
                    <input
                      type="url"
                      placeholder="e.g. https://example.com"
                      value={item.link || ''}
                      onChange={(e) => onChange({ ...item, link: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 focus:border-[#C9A227] rounded-sm px-2.5 py-1.5 text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-white/5">
                  <span className="text-[9px] font-mono text-[#C9A227] uppercase tracking-widest block font-bold mb-1 text-left">
                    QUOTE TRANSLATIONS
                  </span>
                  <div className="space-y-3 text-left">
                    <div className="space-y-1">
                      <label className="text-[10px] text-neutral-400 font-sans uppercase block font-semibold">Quote (EN)</label>
                      <textarea
                        rows={3}
                        placeholder="English quote"
                        value={item.quote?.EN || ''}
                        onChange={(e) => onChange({ ...item, quote: { ...item.quote, EN: e.target.value } })}
                        className="w-full bg-black/40 border border-white/10 focus:border-[#C9A227] rounded-sm px-2.5 py-1.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-neutral-400 font-sans uppercase block font-semibold">Quote (DE)</label>
                      <textarea
                        rows={3}
                        placeholder="German quote"
                        value={item.quote?.DE || ''}
                        onChange={(e) => onChange({ ...item, quote: { ...item.quote, DE: e.target.value } })}
                        className="w-full bg-black/40 border border-white/10 focus:border-[#C9A227] rounded-sm px-2.5 py-1.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-neutral-400 font-sans uppercase block font-semibold">Quote (KO)</label>
                      <textarea
                        rows={3}
                        placeholder="Korean quote"
                        value={item.quote?.KO || ''}
                        onChange={(e) => onChange({ ...item, quote: { ...item.quote, KO: e.target.value } })}
                        className="w-full bg-black/40 border border-white/10 focus:border-[#C9A227] rounded-sm px-2.5 py-1.5 text-xs text-white focus:outline-none"
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
            renderItem={(item) => (
              <div className="w-full p-5 border border-white/5 bg-white/[0.01] rounded-sm flex flex-col space-y-4 text-left">
                <div className="flex items-center justify-between text-[10px] font-mono tracking-wider text-neutral-400 uppercase">
                  <span>{item.type || 'Review'}</span>
                  <span>
                    {new Date(item.date).toLocaleDateString(
                      currentLang === 'KO' ? 'ko-KR' : currentLang === 'DE' ? 'de-DE' : 'en-US', 
                      { year: 'numeric', month: 'long' }
                    )}
                  </span>
                </div>
                <p className="text-sm italic font-serif leading-relaxed opacity-95">
                  “{item.quote[currentLang] || item.quote['EN']}”
                </p>
                <div className="flex items-center justify-between text-xs pt-3 border-t border-white/5">
                  <div>
                    <span className="font-semibold block">{item.source}</span>
                    {item.author && <span className="text-[10px] text-neutral-400 block">{item.author}</span>}
                  </div>
                  {item.link && (
                    <a href={item.link} target="_blank" rel="noreferrer" className="text-[10px] uppercase tracking-wider text-[#C9A227] hover:text-[#ebd04e] transition-colors flex items-center space-x-1 font-sans">
                      <span>Read Link</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            )}
          />
        </div>
      ) : (
        <div className="w-full mx-auto">
          {pressItems.length === 0 ? (
            <div className="text-center py-16 text-[color:inherit] text-xs font-sans">
              No press reviews published at the moment.
            </div>
          ) : (
            currentItem && (
              <div className="flex flex-col items-center">
                
                {/* Adaptive Quote Content Container */}
                <div className="w-full relative px-4 md:px-10 py-2">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentItem.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                      className="text-center flex flex-col justify-between"
                    >
                      {/* Quote section */}
                      <div className="space-y-4 md:space-y-6">
                        <div className="flex justify-center items-center">
                          <span className="text-[10px] font-mono tracking-[0.3em] uppercase" style={{ color: theme?.text }}>
                            {currentItem.type || 'Review'}
                          </span>
                        </div>
                        
                        <blockquote 
                          className="font-serif italic leading-[1.8] tracking-normal w-full max-w-4xl mx-auto"
                          style={{
                            color: theme?.text,
                            fontSize: theme?.pressFontSize ? `clamp(18px, 3.5vw, ${theme.pressFontSize}px)` : undefined,
                            fontWeight: 300
                          }}
                        >
                          “{currentItem.quote[currentLang] || currentItem.quote['EN']}”
                        </blockquote>
                      </div>

                      {/* Source details and publication */}
                      <div className="mt-8 md:mt-10 pt-8 border-t max-w-4xl mx-auto w-full space-y-1.5" style={{ borderColor: theme?.text ? `${theme.text}20` : 'rgba(255, 255, 255, 0.05)' }}>
                        <h4 className="font-sans text-[11px] md:text-xs tracking-[0.2em] uppercase font-semibold" style={{ color: theme?.text ? `${theme.text}90` : undefined }}>
                          {currentItem.source}
                        </h4>
                        
                        {currentItem.author && (
                          <p className="text-[10px] sm:text-[11px] font-sans tracking-wide" style={{ color: theme?.text ? `${theme.text}70` : undefined }}>
                            {currentItem.author}
                          </p>
                        )}
                        
                        <p className="text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.15em]" style={{ color: theme?.text ? `${theme.text}50` : undefined }}>
                          {new Date(currentItem.date).toLocaleDateString(
                            currentLang === 'KO' ? 'ko-KR' : currentLang === 'DE' ? 'de-DE' : 'en-US', 
                            { year: 'numeric', month: 'long' }
                          )}
                        </p>

                        {/* Article link */}
                        <div className="pt-4 flex flex-col items-center justify-center relative w-full min-h-[44px]">
                          {currentItem.link ? (
                            <a
                              href={currentItem.link}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center space-x-1 text-[10px] sm:text-[11px] uppercase tracking-[0.2em] font-sans font-semibold hover:text-[#C9A227]! transition-colors"
                              style={{ color: theme?.text ? `${theme.text}80` : undefined }}
                            >
                              <span>{t.readArticle}</span>
                              <ChevronRight className="w-3 h-3 transform group-hover:translate-x-1 transition-transform" />
                            </a>
                          ) : null}
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Elegant Chevrons Arrow Navigation */}
                {pressItems.length > 1 && (
                  <div className="flex items-center justify-center space-x-8 mt-10 md:mt-12 select-none">
                    <button
                      onClick={handlePrev}
                      aria-label="Previous review"
                      className="w-12 h-12 flex items-center justify-center rounded-full border hover:bg-white/[0.03] transition-all duration-300 cursor-pointer active:scale-95"
                      style={{ 
                        borderColor: theme?.text ? `${theme.text}10` : 'rgba(255, 255, 255, 0.1)',
                        color: theme?.text ? `${theme.text}80` : undefined
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = theme?.text || 'white'}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = theme?.text ? `${theme.text}10` : 'rgba(255, 255, 255, 0.1)'}
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    
                    <span className="text-[10px] md:text-[11px] font-mono tracking-[0.25em] uppercase select-none font-semibold" style={{ color: theme?.text ? `${theme.text}60` : undefined }}>
                      PRESS · {String(currentIndex + 1).padStart(2, '0')} / {String(pressItems.length).padStart(2, '0')}
                    </span>
                    
                    <button
                      onClick={handleNext}
                      aria-label="Next review"
                      className="w-12 h-12 flex items-center justify-center rounded-full border hover:bg-white/[0.03] transition-all duration-300 cursor-pointer active:scale-95"
                      style={{ 
                        borderColor: theme?.text ? `${theme.text}10` : 'rgba(255, 255, 255, 0.1)',
                        color: theme?.text ? `${theme.text}80` : undefined
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = theme?.text || 'white'}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = theme?.text ? `${theme.text}10` : 'rgba(255, 255, 255, 0.1)'}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}