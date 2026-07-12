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

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableItem } from './SortableItem';

interface PressSectionProps {
  items?: PressItem[];
  t?: any;
  onItemsUpdated?: (items: PressItem[]) => void;
  onRefreshData?: () => void;
  currentLang: Language;
  setLang: (lang: Language) => void;
  user: User | null;
  activeEditSection: 'none' | 'biography' | 'press' | 'gallery' | 'videos' | 'schedule';
  setActiveEditSection: (section: 'none' | 'biography' | 'press' | 'gallery' | 'videos' | 'schedule') => void;
  theme?: any;
  onThemeUpdated?: (newTheme: any) => void;
}

export default function PressSection({ currentLang, setLang, user, activeEditSection, setActiveEditSection, theme, onThemeUpdated = () => {}, items: propItems }: PressSectionProps) {
  const [pressItems, setPressItems] = useState<PressItem[]>(propItems || []);
  useEffect(() => {
    if (propItems) setPressItems(propItems);
  }, [propItems]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    loadPress();

    // Listen for press changes from admin panel or other panels
    const handlePressChange = () => {
      loadPress();
    };
    window.addEventListener('pressChanged', handlePressChange);
    return () => window.removeEventListener('pressChanged', handlePressChange);
  }, []);

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

  // Drag-and-drop Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = pressItems.findIndex((item) => item.id === active.id);
    const newIndex = pressItems.findIndex((item) => item.id === over.id);

    const newOrder = arrayMove(pressItems, oldIndex, newIndex) as PressItem[];
    
    // Update order field
    const updatedList = newOrder.map((item, index) => ({
      ...item,
      order: index
    }));

    // Optimistic state update
    setPressItems(updatedList);

    // Save to Firestore
    try {
      const batchUpdates = updatedList.map((item, index) => {
        if (pressItems[index]?.id !== item.id || pressItems[index]?.order !== item.order) {
          return updateDoc(doc(db, "press", item.id), { order: item.order });
        }
        return Promise.resolve();
      });
      await Promise.all(batchUpdates);
      
      showNotification("Order updated");
      
      // Keep the same selected item tracked
      window.dispatchEvent(new CustomEvent('pressChanged'));
    } catch (err) {
      console.error("Error saving new order:", err);
      showNotification("Failed to save new order", "error");
      loadPress();
    }
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
      await deletePressItem(id);
      showNotification("Review deleted successfully");
      
      // Update local state and adjust selection if needed
      const filtered = pressItems.filter(item => item.id !== id);
      setPressItems(filtered);
      if (selectedItemId === id) {
        setSelectedItemId(filtered.length > 0 ? filtered[0].id : null);
      }
      
      window.dispatchEvent(new CustomEvent('pressChanged'));
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
      const saved = await savePressItem(editingItem as PressItem);
      
      // Reload everything
      const data = await fetchPress();
      setPressItems(data);
      
      // Keep the same selected Press item visible after saving
      setSelectedItemId(saved.id);
      
      setEditingItem(null);
      originalItemRef.current = null;
      
      showNotification("Review saved successfully!");
      window.dispatchEvent(new CustomEvent('pressChanged'));
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
          <div className="w-12 h-[1px] bg-white/20" />
          <span className="text-[10px] tracking-[0.3em] uppercase font-sans text-neutral-400">Loading Reviews</span>
        </div>
      </div>
    );
  }

  return (
    <div id="press-section-root" className="w-full relative min-h-[300px]">
      
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

      {/* Mode Selector and controls for Authenticated Admins */}
      {user && (activeEditSection === 'none' || activeEditSection === 'press') && (
        <div className="flex flex-wrap justify-between items-center mb-10 pb-4 border-b border-white/5 gap-4">
          <div className="flex items-center space-x-3">
            <span className="text-[9px] font-mono tracking-widest text-[#C9A227] uppercase bg-white/5 px-2 py-1 rounded">
              ADMIN ACCESS
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {!isEditMode ? (
              <button
                type="button"
                onClick={() => setIsEditMode(true)}
                className="inline-flex items-center space-x-2 text-[10px] uppercase tracking-widest px-4 py-2 bg-white/5 border border-white/10 hover:border-[#C9A227] hover:bg-white/10 rounded-sm text-neutral-300 transition-all cursor-pointer font-sans font-medium"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#C9A227]" />
                <span>Edit Press</span>
              </button>
            ) : (
              <div className="flex items-center space-x-3 flex-wrap gap-2">
                {/* Embedded Language switcher inside Press Edit Mode */}
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

                {/* Quote Font Size Control */}
                <div className="flex items-center space-x-2 bg-white/5 px-2.5 py-1 rounded-sm border border-white/10">
                  <span className="text-[9px] tracking-wider text-neutral-400 uppercase font-sans">Font Size:</span>
                  <input
                    type="range"
                    min="14"
                    max="64"
                    value={theme?.pressFontSize || 28}
                    onChange={(e) => onThemeUpdated({ ...theme, pressFontSize: parseInt(e.target.value, 10) })}
                    className="w-16 md:w-24 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#C9A227]"
                  />
                  <input
                    type="number"
                    min="14"
                    max="64"
                    value={theme?.pressFontSize || 28}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val)) {
                        onThemeUpdated({ ...theme, pressFontSize: Math.max(14, Math.min(64, val)) });
                      }
                    }}
                    className="w-10 bg-black/40 border border-white/10 text-center text-[10px] text-white p-0.5 rounded-sm focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (theme) {
                        const { pressFontSize, ...rest } = theme;
                        onThemeUpdated(rest);
                        showNotification("Font size reset to default");
                      }
                    }}
                    className="text-[9px] uppercase tracking-widest text-neutral-400 hover:text-white px-1.5 py-0.5 border border-white/10 rounded-sm hover:bg-white/5 cursor-pointer"
                  >
                    Reset
                  </button>
                </div>

                <button
                  type="button"
                  onClick={startNewPress}
                  className="inline-flex items-center space-x-1.5 text-[10px] uppercase tracking-widest px-3.5 py-2 bg-[#C9A227]/10 hover:bg-[#C9A227]/20 border border-[#C9A227]/30 text-[#C9A227] rounded-sm transition-all cursor-pointer font-sans"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Quote</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const hasChanges = editingItem !== null;
                    if (hasChanges) {
                      if (true) {
                        setEditingItem(null);
                        setIsEditMode(false);
                      }
                    } else {
                      setIsEditMode(false);
                    }
                  }}
                  className="inline-flex items-center space-x-1.5 text-[10px] uppercase tracking-widest px-3.5 py-2 border border-white/10 hover:border-white/25 hover:bg-white/5 rounded-sm text-neutral-400 hover:text-white transition-all cursor-pointer font-sans"
                >
                  <X className="w-3 h-3" />
                  <span>Exit Edit Mode</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          EDIT MODE INTERFACE
          ======================================================== */}
      {isEditMode ? (
        <div className="space-y-6">
          
          {/* Live Preview Box */}
          <div className="bg-white/[0.01] border border-white/5 rounded-sm p-6 text-center max-w-3xl mx-auto space-y-3">
            <div className="flex justify-center items-center space-x-1.5">
              <Sparkles className="w-3 h-3 text-[#C9A227] animate-pulse" />
              <span className="text-[9px] font-mono tracking-widest text-neutral-400 uppercase">FONT SIZE LIVE PREVIEW</span>
            </div>
            <blockquote 
              className="font-serif italic text-neutral-100 max-w-2xl mx-auto leading-relaxed"
              style={{ fontSize: theme?.pressFontSize ? `clamp(16px, 4vw, ${theme.pressFontSize}px)` : undefined }}
            >
              “{editingItem?.quote?.[currentLang] || pressItems[0]?.quote[currentLang] || pressItems[0]?.quote['EN'] || 'Enter your press quote translations to see them displayed here in real-time.'}”
            </blockquote>
            <p className="text-[10px] text-neutral-400 font-sans font-semibold uppercase">
              {editingItem?.source || pressItems[0]?.source || 'Publication Source'}
            </p>
          </div>

          {/* Active Item Form Editor */}
          {editingItem ? (
            <form onSubmit={handleSaveChanges} className="bg-white/[0.02] border border-[#C9A227]/20 p-6 md:p-8 rounded-lg space-y-6 max-w-3xl mx-auto transition-all">
              <div className="flex justify-between items-center pb-3 border-b border-white/5">
                <h4 className="text-xs tracking-widest uppercase font-sans font-semibold text-[#C9A227]">
                  {editingItem.id ? 'Edit Review Quote' : 'New Review Quote'}
                </h4>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="p-1 hover:bg-white/5 rounded text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  title="Close Form"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] tracking-wider text-neutral-400 font-sans uppercase block">Type</label>
                  <select
                    value={editingItem.type || 'Review'}
                    onChange={(e) => setEditingItem({ ...editingItem, type: e.target.value as any })}
                    className="w-full bg-black/40 border border-white/10 focus:border-[#C9A227] rounded-sm px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#C9A227] select-none"
                  >
                    <option value="Review" className="bg-neutral-900 text-white">Review</option>
                    <option value="Interview" className="bg-neutral-900 text-white">Interview</option>
                    <option value="Article" className="bg-neutral-900 text-white">Article</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] tracking-wider text-neutral-400 font-sans uppercase block">Source</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Opera Magazine"
                    value={editingItem.source || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, source: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 focus:border-[#C9A227] rounded-sm px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#C9A227]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] tracking-wider text-neutral-400 font-sans uppercase block">Date</label>
                  <input
                    type="date"
                    required
                    value={editingItem.date || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, date: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 focus:border-[#C9A227] rounded-sm px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#C9A227]"
                  />
                </div>
              </div>

              {/* Multi-language Quote (displayed for the selected language only) */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] tracking-wider text-neutral-300 font-sans uppercase block font-semibold">
                    Quote Excerpt ({currentLang})
                  </label>
                  <span className="text-[9px] font-mono text-neutral-500 uppercase">
                    Select tabs EN | DE | KO above to translate
                  </span>
                </div>
                <textarea
                  required
                  rows={3}
                  placeholder={`Enter translation quote in ${currentLang === 'KO' ? 'Korean' : currentLang === 'DE' ? 'German' : 'English'}...`}
                  value={editingItem.quote?.[currentLang] || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEditingItem(prev => {
                      if (!prev) return null;
                      return {
                        ...prev,
                        quote: {
                          ...prev.quote,
                          [currentLang]: val
                        }
                      } as Partial<PressItem>;
                    });
                  }}
                  className="w-full bg-black/40 border border-white/10 focus:border-[#C9A227] rounded-sm px-4 py-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#C9A227] resize-none leading-relaxed font-serif italic"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] tracking-wider text-neutral-400 font-sans uppercase block">Author</label>
                  <input
                    type="text"
                    placeholder="e.g. Richard Morrison (Optional)"
                    value={editingItem.author || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, author: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 focus:border-[#C9A227] rounded-sm px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#C9A227]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] tracking-wider text-neutral-400 font-sans uppercase block">Article URL / Link</label>
                  <input
                    type="url"
                    placeholder="https://... (Optional)"
                    value={editingItem.link || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, link: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 focus:border-[#C9A227] rounded-sm px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#C9A227]"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2 border border-white/10 hover:border-white/30 hover:bg-white/5 rounded-sm text-neutral-400 hover:text-white text-xs tracking-wider uppercase font-sans transition-all cursor-pointer"
                >
                  {t.adminCancel}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-[#C9A227] hover:bg-[#ebd04e] text-black font-semibold rounded-sm text-xs tracking-wider uppercase transition-all flex items-center space-x-1.5 cursor-pointer font-sans active:scale-95 shadow-md"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? t.adminSaving : t.adminSave}</span>
                </button>
              </div>
            </form>
          ) : (
            /* Drag-and-drop management list */
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs tracking-wider text-neutral-400 font-sans uppercase">
                  Drag and drop to sort • Click edit icon to change
                </h3>
              </div>

              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <div className="divide-y divide-white/5 border border-white/10 bg-black/20 rounded-sm overflow-hidden">
                  {pressItems.length === 0 ? (
                    <div className="p-12 text-center text-neutral-500 text-xs font-sans">No reviews created yet. Click Add Quote above to get started.</div>
                  ) : (
                    <SortableContext items={pressItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
                      {pressItems.map((item, index) => {
                        const translatedQuote = item.quote[currentLang] || item.quote['EN'] || '';
                        const isCurrentlySelected = selectedItemId === item.id;
                        
                        return (
                          <SortableItem 
                            key={item.id} 
                            id={item.id} 
                            className={`bg-transparent hover:bg-white/[0.02] flex items-center pl-12 pr-4 py-4 relative transition-all duration-300 ${isCurrentlySelected ? 'border-l-2 border-[#C9A227] bg-white/[0.01]' : ''}`} 
                            handleClassName="absolute left-2.5 top-1/2 -translate-y-1/2 p-2"
                          >
                            <div className="flex-1 min-w-0 pr-4">
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-1">
                                <span className="text-[11px] font-sans font-semibold text-white tracking-wide">
                                  {item.source}
                                </span>
                                <span className="text-[10px] font-mono text-neutral-500">
                                  {item.date}
                                </span>
                                <span className="text-[9px] font-mono text-[#C9A227] uppercase tracking-widest bg-white/5 px-1.5 py-0.5 rounded accent-color">
                                  {item.type || 'Review'}
                                </span>
                              </div>
                              <p className="text-xs text-neutral-400 italic line-clamp-1 font-serif">
                                "{translatedQuote}"
                              </p>
                            </div>
                            <div className="flex items-center space-x-2 shrink-0">
                              {/* Highlight select indicator */}
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedItemId(item.id);
                                  showNotification(`Carousel set to: ${item.source}`);
                                }}
                                className={`px-2.5 py-1 text-[9px] font-sans tracking-wider rounded border transition-colors uppercase ${
                                  isCurrentlySelected
                                    ? 'bg-[#C9A227]/10 border-[#C9A227] text-[#C9A227] accent-color font-bold'
                                    : 'border-white/10 text-neutral-500 hover:text-white'
                                }`}
                              >
                                {isCurrentlySelected ? 'Selected' : 'Select'}
                              </button>
                              
                              <button
                                type="button"
                                onClick={() => startEditPress(item)}
                                className="p-2 border border-white/5 hover:border-white/20 text-neutral-400 hover:text-white rounded transition-colors cursor-pointer"
                                title="Edit"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeletePress(item.id)}
                                className="p-2 border border-rose-500/10 hover:border-rose-500/35 text-rose-400 hover:bg-rose-950/20 rounded transition-colors cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </SortableItem>
                        );
                      })}
                    </SortableContext>
                  )}
                </div>
              </DndContext>
            </div>
          )}
        </div>
      ) : (
        /* ========================================================
            READ-ONLY COMPACT EDITORIAL PRESS CAROUSEL
            ======================================================== */
        <div className="max-w-4xl mx-auto">
          {pressItems.length === 0 ? (
            <div className="text-center py-16 text-neutral-500 text-xs font-sans">
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
                          <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-[#C9A227] accent-color">
                            {currentItem.type || 'Review'}
                          </span>
                        </div>
                        
                        <blockquote 
                          className="font-serif italic leading-relaxed tracking-wide text-neutral-100 max-w-3xl mx-auto"
                          style={{
                            fontSize: theme?.pressFontSize ? `clamp(16px, 4vw, ${theme.pressFontSize}px)` : undefined,
                            fontWeight: 300
                          }}
                        >
                          “{currentItem.quote[currentLang] || currentItem.quote['EN']}”
                        </blockquote>
                      </div>

                      {/* Source details and publication */}
                      <div className="mt-6 md:mt-8 pt-6 border-t border-white/5 max-w-sm mx-auto w-full space-y-1">
                        <h4 className="font-serif text-sm md:text-base tracking-widest uppercase font-semibold text-white">
                          {currentItem.source}
                        </h4>
                        
                        {currentItem.author && (
                          <p className="text-[10px] sm:text-xs text-neutral-400 font-sans">
                            {currentItem.author}
                          </p>
                        )}
                        
                        <p className="text-[9px] sm:text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
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
                              className="inline-flex items-center space-x-1 text-xs text-neutral-300 hover:text-[#C9A227] transition-colors uppercase tracking-[0.15em] font-sans accent-hover-text"
                            >
                              <span>{t.readArticle}</span>
                              <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                            </a>
                          ) : null}
                          {user && (
                            <button
                              onClick={() => handleDeletePress(currentItem.id)}
                              className="absolute right-0 top-1/2 -translate-y-1/2 p-2 border border-rose-500/10 hover:border-rose-500/35 text-rose-400 hover:bg-rose-950/20 rounded transition-colors cursor-pointer"
                              title="Delete from main page"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
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
                      className="w-12 h-12 flex items-center justify-center rounded-full border border-white/10 hover:border-[#C9A227] hover:bg-white/[0.03] text-neutral-400 hover:text-white transition-all duration-300 cursor-pointer active:scale-95"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    
                    <span className="text-[10px] md:text-[11px] font-mono tracking-[0.25em] text-neutral-400 uppercase select-none font-semibold">
                      PRESS · {String(currentIndex + 1).padStart(2, '0')} / {String(pressItems.length).padStart(2, '0')}
                    </span>
                    
                    <button
                      onClick={handleNext}
                      aria-label="Next review"
                      className="w-12 h-12 flex items-center justify-center rounded-full border border-white/10 hover:border-[#C9A227] hover:bg-white/[0.03] text-neutral-400 hover:text-white transition-all duration-300 cursor-pointer active:scale-95"
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
