import sys

new_content = """import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ArrowRight, Edit3, Plus, Trash2, X, Save, GripVertical, Check, Image as ImageIcon } from 'lucide-react';
import { Language, PerformanceSlide } from '../types';
import { fetchSelectedPerformances, saveSelectedPerformance, deleteSelectedPerformance, db, storage } from '../firebase';
import { getMediaSource } from '../lib/mediaUtils';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
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

interface SelectedPerformancesProps {
  currentLang: Language;
  setLang: (lang: Language) => void;
  slides?: PerformanceSlide[];
  user?: User | null;
  activeEditSection?: string;
  setActiveEditSection?: (section: any) => void;
  onItemsUpdated?: (items: PerformanceSlide[]) => void;
  onRefreshData?: () => void;
}

export default function SelectedPerformances({ 
  currentLang, 
  setLang,
  slides: propSlides,
  user,
  activeEditSection,
  setActiveEditSection,
  onItemsUpdated,
  onRefreshData
}: SelectedPerformancesProps) {
  const [slides, setSlides] = useState<PerformanceSlide[]>(propSlides && propSlides.length > 0 ? propSlides : []);
  const [currentIdx, setCurrentIdx] = useState(0);

  // Edit mode states
  const isEditMode = activeEditSection === 'slides';
  const setIsEditMode = (mode: boolean) => {
    if (setActiveEditSection) {
      setActiveEditSection(mode ? 'slides' : 'none');
    }
  };
  const [editingItem, setEditingItem] = useState<Partial<PerformanceSlide> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const originalItemRef = useRef<Partial<PerformanceSlide> | null>(null);

  // Notification Toast state
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    if (propSlides && propSlides.length > 0) {
      setSlides(propSlides);
    } else if (propSlides && propSlides.length === 0) {
      setSlides([]);
    }
  }, [propSlides]);

  useEffect(() => {
    if (!propSlides || propSlides.length === 0) {
      let active = true;
      fetchSelectedPerformances().then((data) => {
        if (active) {
          setSlides(data || []);
        }
      });
      return () => { active = false; };
    }
  }, [propSlides]);

  useEffect(() => {
    if (currentIdx >= slides.length && slides.length > 0) {
      setCurrentIdx(0);
    }
  }, [slides, currentIdx]);

  useEffect(() => {
    if (slides.length <= 1 || isEditMode) return;
    const interval = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % slides.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [slides.length, currentIdx, isEditMode]);

  const handleNext = () => {
    if (slides.length === 0) return;
    setCurrentIdx((prev) => (prev + 1) % slides.length);
  };

  const handlePrev = () => {
    if (slides.length === 0) return;
    setCurrentIdx((prev) => (prev - 1 + slides.length) % slides.length);
  };

  // --- Edit Mode Methods ---
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = slides.findIndex((item) => item.id === active.id);
    const newIndex = slides.findIndex((item) => item.id === over.id);

    const newOrder = arrayMove(slides, oldIndex, newIndex);
    const updatedList = newOrder.map((item, index) => ({ ...item, order: index }));

    setSlides(updatedList);
    if (onItemsUpdated) onItemsUpdated(updatedList);

    try {
      const batchUpdates = updatedList.map((item, index) => {
        if (slides[index]?.id !== item.id || slides[index]?.order !== item.order) {
          return updateDoc(doc(db, "selected_performances", item.id || ''), { order: item.order });
        }
        return Promise.resolve();
      });
      await Promise.all(batchUpdates);
      showNotification("Order updated");
    } catch (err) {
      console.error("Error saving new order:", err);
      showNotification("Failed to save new order", "error");
      if (onRefreshData) onRefreshData();
    }
  };

  const startNewSlide = () => {
    const newItem: Partial<PerformanceSlide> = {
      image: '',
      mediaType: 'image',
      production: { EN: '', DE: '', KO: '' },
      role: { EN: '', DE: '', KO: '' },
      house: { EN: '', DE: '', KO: '' }
    };
    setEditingItem(newItem);
    originalItemRef.current = newItem;
  };

  const startEditSlide = (item: PerformanceSlide) => {
    setEditingItem({ ...item });
    originalItemRef.current = { ...item };
  };

  const handleDeleteSlide = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this slide?")) return;
    try {
      await deleteSelectedPerformance(id);
      const filtered = slides.filter(item => item.id !== id);
      setSlides(filtered);
      if (onItemsUpdated) onItemsUpdated(filtered);
      showNotification("Slide deleted successfully");
    } catch (err: any) {
      console.error("Error deleting slide:", err);
      showNotification(`Failed to delete slide: ${err.message || 'Unknown error'}`, "error");
    }
  };

  const handleCancelEdit = () => {
    const hasChanges = JSON.stringify(editingItem) !== JSON.stringify(originalItemRef.current);
    if (hasChanges && !window.confirm("Discard unsaved changes?")) return;
    setEditingItem(null);
    originalItemRef.current = null;
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setIsSaving(true);
    try {
      const saveItem = { ...editingItem };
      if (saveItem.order === undefined) saveItem.order = slides.length;
      await saveSelectedPerformance(saveItem as PerformanceSlide);
      
      showNotification("Slide saved successfully!");
      setEditingItem(null);
      originalItemRef.current = null;
      if (onRefreshData) onRefreshData();
    } catch (err) {
      console.error("Error saving slide:", err);
      showNotification("Failed to save changes", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      alert("Please upload a valid image or video file.");
      return;
    }

    const storageRef = ref(storage, `hero_slides/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    setUploadProgress(0);

    uploadTask.on('state_changed', 
      (snapshot) => setUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
      (error) => {
        console.error("Upload error:", error);
        showNotification(`Failed to upload file: ${error.message}`, "error");
        setUploadProgress(null);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          setEditingItem(prev => prev ? { 
            ...prev, 
            image: downloadURL, 
            mediaType: file.type.startsWith('video/') ? 'video' : 'image' 
          } : null);
          showNotification("File uploaded successfully");
        } catch (error: any) {
          showNotification(`Failed to process URL: ${error.message}`, "error");
        } finally {
          setUploadProgress(null);
        }
      }
    );
  };

  const slide = slides[currentIdx] || slides[0];
  const media = slide ? getMediaSource(slide.image || '', slide.mediaType) : null;

  return (
    <div id="performances-slider-root" className={`w-full relative ${isEditMode ? 'min-h-[500px] py-12' : 'h-[450px] md:h-[550px] overflow-hidden'} bg-[var(--color-bg)] border-y border-neutral-900 flex flex-col justify-end`}>
      
      {/* Toast Notifications */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 border rounded-full text-xs tracking-wider uppercase font-sans flex items-center space-x-2 shadow-lg ${
              notification.type === 'success' ? 'border-emerald-500/30 bg-emerald-950/80 text-emerald-400' : 'border-rose-500/30 bg-rose-950/80 text-rose-400'
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            <span>{notification.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Panel Header & Trigger */}
      {user && (activeEditSection === 'none' || activeEditSection === 'slides') && (
        <div className={`absolute top-4 left-6 right-6 z-50 flex justify-between items-center ${isEditMode ? '' : 'bg-black/40 backdrop-blur-sm'} p-4 border border-white/10 rounded-lg`}>
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
                <span>Edit Hero Slides</span>
              </button>
            ) : (
              <div className="flex items-center space-x-3 flex-wrap gap-2">
                <div className="flex items-center space-x-1 bg-white/5 px-1.5 py-1 rounded-sm border border-white/10">
                  {(['EN', 'DE', 'KO'] as Language[]).map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setLang(lang)}
                      className={`px-2.5 py-0.5 text-[10px] font-sans font-bold tracking-wider rounded-sm transition-all ${
                        currentLang === lang ? 'bg-[#C9A227] text-black font-extrabold shadow-sm' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={startNewSlide}
                  className="inline-flex items-center space-x-1.5 text-[10px] uppercase tracking-widest px-3.5 py-2 bg-[#C9A227]/10 hover:bg-[#C9A227]/20 border border-[#C9A227]/30 text-[#C9A227] rounded-sm transition-all cursor-pointer font-sans"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Slide</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditMode(false)}
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

      {/* --- EDIT MODE --- */}
      {isEditMode ? (
        <div className="relative z-10 max-w-4xl mx-auto w-full px-6 pt-16">
          {editingItem ? (
            <form onSubmit={handleSaveChanges} className="bg-white/[0.02] border border-[#C9A227]/20 p-6 rounded-lg space-y-6">
              <div className="flex justify-between items-center pb-3 border-b border-white/5">
                <h4 className="text-xs tracking-widest uppercase font-sans font-semibold text-[#C9A227]">
                  {editingItem.id ? 'Edit Slide' : 'New Slide'}
                </h4>
                <button type="button" onClick={handleCancelEdit} className="p-1 hover:bg-white/5 rounded text-neutral-400">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Media Upload */}
                <div className="space-y-1.5">
                  <label className="text-[10px] tracking-wider text-neutral-400 font-sans uppercase block font-semibold">Media Upload (Image or Video)</label>
                  <div className="relative">
                    <label className={`flex flex-col items-center justify-center w-full h-28 border border-white/10 border-dashed rounded-sm ${uploadProgress !== null ? 'bg-black/60 cursor-not-allowed' : 'cursor-pointer bg-black/20 hover:bg-black/40'} transition-colors`}>
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {uploadProgress !== null ? (
                          <>
                            <div className="w-6 h-6 border-2 border-[#C9A227] border-t-transparent rounded-full animate-spin mb-2" />
                            <p className="text-[9px] text-[#C9A227] tracking-wider font-sans uppercase">Uploading: {Math.round(uploadProgress)}%</p>
                          </>
                        ) : (
                          <>
                            <ImageIcon className="w-6 h-6 text-neutral-500 mb-2" />
                            <p className="text-[9px] text-neutral-400 tracking-wider font-sans uppercase text-center px-4">Upload New File</p>
                          </>
                        )}
                      </div>
                      <input type="file" accept="image/*,video/*" onChange={handleFileChange} className="hidden" disabled={uploadProgress !== null} />
                    </label>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] tracking-wider text-neutral-400 font-sans uppercase block font-semibold">Or Media URL (YouTube / Drive / Image)</label>
                  <input
                    type="text"
                    value={editingItem.image || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, image: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 focus:border-[#C9A227] rounded-sm px-3 py-2 text-xs text-white"
                  />
                  <div className="flex space-x-2 mt-2">
                    {['image', 'video', 'youtube', 'drive'].map(type => (
                      <label key={type} className="flex items-center space-x-1 cursor-pointer">
                        <input
                          type="radio"
                          checked={editingItem.mediaType === type}
                          onChange={() => setEditingItem({ ...editingItem, mediaType: type as any })}
                          className="accent-[#C9A227]"
                        />
                        <span className="text-[10px] uppercase text-neutral-400">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Multilingual Text */}
              <div className="space-y-4 pt-3 border-t border-white/5">
                <span className="text-[9px] font-mono text-[#C9A227] uppercase tracking-widest block font-bold mb-1">TRANSLATIONS</span>
                
                {['production', 'role', 'house'].map((field) => (
                  <div key={field} className="space-y-2">
                    <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest block font-semibold">
                      {field === 'production' ? 'Production Title' : field === 'role' ? 'Role' : 'Theatre / House'}
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {(['EN', 'DE', 'KO'] as const).map(lang => (
                        <input
                          key={lang}
                          type="text"
                          placeholder={`${lang}`}
                          value={(editingItem as any)[field]?.[lang] || ''}
                          onChange={(e) => setEditingItem({
                            ...editingItem,
                            [field]: { ...(editingItem as any)[field], [lang]: e.target.value }
                          })}
                          className="w-full bg-black/40 border border-white/10 rounded-sm px-2.5 py-1.5 text-xs text-white"
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-white/5">
                <button type="button" onClick={handleCancelEdit} className="px-4 py-2 border border-white/10 hover:border-white/30 rounded-sm text-neutral-400 text-xs uppercase font-sans">
                  Cancel
                </button>
                <button type="submit" disabled={isSaving} className="px-5 py-2 bg-[#C9A227] hover:bg-[#ebd04e] text-black font-semibold rounded-sm text-xs uppercase shadow-md">
                  <Save className="w-3.5 h-3.5 inline mr-1.5" />
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <div className="divide-y divide-white/5 border border-white/10 bg-black/20 rounded-sm overflow-hidden">
                  {slides.length === 0 ? (
                    <div className="p-12 text-center text-neutral-500 text-xs">No slides yet. Click Add Slide above.</div>
                  ) : (
                    <SortableContext items={slides.map(i => i.id || '')} strategy={verticalListSortingStrategy}>
                      {slides.map((item) => (
                        <SortableItem 
                          key={item.id} 
                          id={item.id || ''} 
                          className="bg-transparent hover:bg-white/[0.02] flex items-center pl-12 pr-4 py-4 relative transition-all duration-300 border-b border-white/5" 
                          handleClassName="absolute left-2.5 top-1/2 -translate-y-1/2 p-2"
                        >
                          <div className="flex-1 min-w-0 pr-4 flex items-center space-x-4">
                            {item.image && (
                              <div className="w-16 h-10 bg-neutral-900 rounded overflow-hidden flex-shrink-0 border border-white/10">
                                {item.mediaType === 'image' && <img src={item.image} alt="thumb" className="w-full h-full object-cover" />}
                                {item.mediaType !== 'image' && <div className="w-full h-full flex items-center justify-center text-[8px] text-neutral-500 uppercase">{item.mediaType}</div>}
                              </div>
                            )}
                            <div>
                              <h4 className="text-xs font-sans font-bold text-neutral-200 mt-1 truncate">
                                {item.production[currentLang] || item.production['EN']}
                              </h4>
                              <p className="text-[11px] text-neutral-500 font-sans mt-0.5">
                                {item.role[currentLang] || item.role['EN']} · {item.house[currentLang] || item.house['EN']}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 shrink-0">
                            <button onClick={() => startEditSlide(item)} className="p-2 border border-white/5 hover:border-white/20 text-neutral-400 hover:text-white rounded">
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDeleteSlide(item.id || '')} className="p-2 border border-rose-500/10 hover:border-rose-500/35 text-rose-400 hover:bg-rose-950/20 rounded">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </SortableItem>
                      ))}
                    </SortableContext>
                  )}
                </div>
              </DndContext>
            </div>
          )}
        </div>
      ) : (
        /* --- PUBLIC DISPLAY MODE --- */
        <>
          {slides.length > 0 && slide && media && (
            <>
              {/* Background Slides with Zoom animation */}
              <AnimatePresence>
                <motion.div
                  key={`slide-bg-${slide.id || 'slide'}-${currentIdx}`}
                  initial={{ opacity: 0, scale: 1.03 }}
                  animate={{ opacity: 0.8, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 1.4, ease: 'easeInOut' }}
                  className="absolute inset-0"
                >
                  {media.type === 'video' ? (
                    <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover pointer-events-none" src={media.src} />
                  ) : media.type === 'drive' ? (
                    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
                      <iframe className="absolute top-1/2 left-1/2 w-[300vw] h-[300vh] min-w-[100vw] min-h-[100vh] -translate-x-1/2 -translate-y-1/2 opacity-70 pointer-events-none" src={`${media.src}?autoplay=1&mute=1&controls=0&loop=1`} allow="autoplay" allowFullScreen />
                    </div>
                  ) : media.type === 'youtube' ? (
                    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
                      <iframe className="absolute top-1/2 left-1/2 w-[300vw] h-[300vh] min-w-[100vw] min-h-[100vh] -translate-x-1/2 -translate-y-1/2 opacity-70 pointer-events-none" src={`https://www.youtube.com/embed/${media.ytId}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&loop=1&iv_load_policy=3&modestbranding=1&disablekb=1&fs=0&enablejsapi=1&playsinline=1${media.start ? `&start=${media.start}` : ''}&playlist=${media.ytId}`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                    </div>
                  ) : (
                    <div className="w-full h-full bg-cover" style={{ backgroundImage: `url('${media.src}')`, backgroundPosition: slide.bgPosition || 'center' }} onContextMenu={(e) => e.preventDefault()} />
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Curtain Overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/80" />
              <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-black to-transparent hidden md:block" />
              <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-black to-transparent hidden md:block" />

              {/* Floating UI Content */}
              <div className="relative z-10 max-w-7xl mx-auto w-full px-6 md:px-12 pb-16 md:pb-20 flex flex-col md:flex-row md:justify-between md:items-end gap-8">
                
                {/* Caption Info */}
                <div className="space-y-4 max-w-lg">
                  <span className="text-[10px] tracking-[0.4em] text-neutral-400 uppercase font-semibold block">
                    Selected Performances
                  </span>
                  <div className="space-y-1">
                    <h3 className="font-serif text-3xl md:text-4xl lg:text-5xl font-light text-[var(--color-text)] uppercase tracking-wider">
                      {slide.production[currentLang]}
                    </h3>
                    <p className="font-serif text-sm md:text-base text-neutral-300 tracking-wide">
                      {slide.role[currentLang]}
                    </p>
                  </div>
                  <p className="text-xs text-neutral-400 font-sans tracking-widest uppercase">
                    {slide.house[currentLang]}
                  </p>
                </div>

                {/* Navigation Controls */}
                <div className="flex items-center space-x-6">
                  <div className="flex space-x-2.5">
                    {slides.map((s, idx) => (
                      <button key={`slider-tick-${s.id || 'slide'}-${idx}`} onClick={() => setCurrentIdx(idx)} className={`h-1 rounded-full transition-all duration-500 cursor-pointer ${currentIdx === idx ? 'w-8 bg-white' : 'w-2 bg-[var(--color-bg)] hover:bg-[var(--color-bg)]'}`} aria-label={`Go to slide ${idx + 1}`} />
                    ))}
                  </div>
                  <div className="h-6 w-[1px] bg-[var(--color-bg)]" />
                  <div className="flex space-x-2">
                    <button onClick={handlePrev} className="w-10 h-10 rounded-full border border-neutral-800 hover:border-neutral-500 text-neutral-400 hover:text-[var(--color-text)] flex items-center justify-center transition-all cursor-pointer accent-hover-border">
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <button onClick={handleNext} className="w-10 h-10 rounded-full border border-neutral-800 hover:border-neutral-500 text-neutral-400 hover:text-[var(--color-text)] flex items-center justify-center transition-all cursor-pointer accent-hover-border">
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
"""

with open('src/components/SelectedPerformances.tsx', 'w') as f:
    f.write(new_content)
