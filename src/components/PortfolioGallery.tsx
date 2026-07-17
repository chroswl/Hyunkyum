import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Maximize2, X, ChevronLeft, ChevronRight, Edit3, Plus, Trash2, Save, GripVertical, Check, Sparkles, Image as ImageIcon 
} from 'lucide-react';
import { 
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent 
} from '@dnd-kit/core';
import { 
  arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable 
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GoogleDrivePicker } from './admin/GoogleDrivePicker';
import { PortfolioItem, Language, ThemeSettings } from '../types';
import { translations } from '../translations';
import { User } from 'firebase/auth';
import { db, deletePortfolioItem, savePortfolioItem } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { getMediaSource } from '../lib/mediaUtils';
import { MediaCropWrapper, MediaPreview } from './admin/media';
import { MediaEngine, useMediaUpload } from '../lib/editing/mediaEngine';
import { CollectionManager } from './admin/collection';


interface PortfolioGalleryProps {
  items: PortfolioItem[];
  currentLang: Language;
  setLang: (lang: Language) => void;
  user: User | null;
  activeEditSection: 'none' | 'biography' | 'press' | 'gallery' | 'videos' | 'schedule';
  setActiveEditSection: (section: 'none' | 'biography' | 'press' | 'gallery' | 'videos' | 'schedule') => void;
  onItemsUpdated: (items: PortfolioItem[]) => void;
  theme?: ThemeSettings;
}

export default function PortfolioGallery({ 
  items, 
  currentLang, 
  setLang, 
  user, 
  activeEditSection, 
  setActiveEditSection,
  onItemsUpdated,
  
  theme
}: PortfolioGalleryProps) {
  const [activeCategory, setActiveCategory] = useState<'Portrait' | 'Stage' | 'Backstage' | null>(null);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
  
  // Edit mode states
  const isEditMode = activeEditSection === 'gallery';
  const setIsEditMode = (mode: boolean) => setActiveEditSection(mode ? 'gallery' : 'none');
  const [editingItem, setEditingItem] = useState<Partial<PortfolioItem> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
    const originalItemRef = useRef<Partial<PortfolioItem> | null>(null);
  const startNewPhoto = () => {
    const newItem: Partial<PortfolioItem> = {
      category: 'Portrait',
      url: '',
      title: { EN: '', DE: '', KO: '' },
      copyright: '',
      copyrightUrl: '',
      order: items.length
    };
    setEditingItem(newItem);
    originalItemRef.current = newItem;
    setIsEditMode(true);
  };
  
  const handleCancelEdit = () => {
    setEditingItem(null);
  };
  
  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.url) {
      showNotification("Image is required", "error");
      return;
    }
    
    setIsSaving(true);
    try {
      const savedItem = await savePortfolioItem(editingItem as any);
      
      // Update local state if needed
      const newItems = editingItem.id 
        ? items.map(i => i.id === editingItem.id ? { ...i, ...editingItem } as PortfolioItem : i)
        : [...items, savedItem];
        
      onItemsUpdated(newItems);
      setEditingItem(null);
      showNotification("Saved successfully!");
    } catch (err) {
      console.error(err);
      showNotification("Failed to save", "error");
    } finally {
      setIsSaving(false);
    }
  };
  // Notifications
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  
  const { progress: mediaProgress, isUploading: mediaUploading, uploadMedia } = useMediaUpload({ folder: 'portfolio' });

  const isOptimizing = mediaProgress.status === 'optimizing';
  const optimizeProgress = isOptimizing ? Math.min(100, Math.round(mediaProgress.percentage * 2.5)) : null;
  const uploadProgress = mediaProgress.status === 'uploading'
    ? Math.min(100, Math.round((mediaProgress.percentage - 40) / 0.6))
    : mediaProgress.status === 'completed' ? 100 : null;

  const [cropTarget, setCropTarget] = useState<{ src: string, aspect?: number, onCrop: (base64: string, copyright?: string, copyrightUrl?: string) => void, copyright?: string, copyrightUrl?: string } | null>(null);

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 3000);
  };

    const handleDeletePhoto = async (id: string) => {
    try {
      const newItems = items.filter(item => item.id !== id);
      onItemsUpdated(newItems);
      showNotification("Photo deleted successfully");
    } catch (err: any) {
      console.error("Error deleting portfolio photo:", err);
      showNotification(`Failed to delete photo: ${err.message || 'Unknown error'}`, "error");
    }
  };

  const t = translations[currentLang];
  const categories: ('Portrait' | 'Stage' | 'Backstage')[] = ['Portrait', 'Stage', 'Backstage'];

  const filteredItems = activeCategory === null 
    ? [
        items.find(item => item.category === 'Portrait'),
        items.find(item => item.category === 'Stage'),
        items.find(item => item.category === 'Backstage')
      ].filter(Boolean) as PortfolioItem[]
    : items.filter(item => item.category === activeCategory);

  const getTranslatedTitle = (item: PortfolioItem) => {
    if (item.title) {
      return item.title[currentLang] || item.title['EN'] || '';
    }
    return '';
  };

  const handleNext = (e?: React.MouseEvent | KeyboardEvent) => {
    e?.stopPropagation();
    if (selectedItemIndex !== null) {
      setSelectedItemIndex((selectedItemIndex + 1) % filteredItems.length);
    }
  };

  const handlePrev = (e?: React.MouseEvent | KeyboardEvent) => {
    e?.stopPropagation();
    if (selectedItemIndex !== null) {
      setSelectedItemIndex((selectedItemIndex - 1 + filteredItems.length) % filteredItems.length);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedItemIndex !== null) {
        if (e.key === 'Escape') {
          setSelectedItemIndex(null);
        } else if (e.key === 'ArrowLeft') {
          handlePrev(e);
        } else if (e.key === 'ArrowRight') {
          handleNext(e);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItemIndex, filteredItems.length]);

  return (
    <div id="portfolio-gallery-root" className="w-full relative transition-all duration-500 pb-4" style={{ backgroundColor: theme?.bg, color: theme?.text }}>
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

      
      {/* Admin Panel Header & Trigger */}
      {user && (
        <div className="flex flex-wrap justify-between items-center mb-10 pb-4 border-b border-white/5 gap-4 px-4">
          <div className="flex items-center space-x-3">
            <span className="text-[9px] font-mono tracking-widest text-[#C9A227] uppercase bg-white/5 px-2 py-1 rounded">
              ADMIN ACCESS
            </span>
          </div>
          <div className="flex items-center space-x-3">
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
        </div>
      )}

      <div className="w-full">
        {/* Category Tabs */}
        <div 
          id="portfolio-tabs" 
          className="flex flex-wrap justify-center gap-2 sm:gap-4 transition-all duration-500 mb-8 px-4"
        >
          {categories.map((cat) => (
            <button
              key={cat}
              id={`portfolio-tab-${cat.toLowerCase()}`}
              onClick={() => setActiveCategory(prev => prev === cat ? null : cat)}
              className={`px-3 sm:px-5 py-2 text-[10px] sm:text-xs tracking-wider sm:tracking-[0.2em] uppercase transition-all border rounded-full duration-300 whitespace-nowrap ${
                activeCategory === cat ? 'font-semibold shadow-sm' : 'font-normal'
              }`}
              style={{
                backgroundColor: activeCategory === cat 
                  ? ('rgba(var(--color-text-rgb), 0.15)') 
                  : 'transparent',
                borderColor: activeCategory === cat 
                  ? (theme?.text || 'var(--color-text)') 
                  : (theme?.text ? `${theme.text}40` : 'var(--color-text)'),
                color: activeCategory === cat 
                  ? (theme?.text || 'var(--color-text)') 
                  : (theme?.text || 'var(--color-text)')
              }}
            >
              {cat === 'Portrait' ? t.portraitCat : cat === 'Stage' ? t.stageCat : t.backstageCat}
            </button>
          ))}
        </div>

        {/* Grid Container & CollectionManager */}
        <div className="w-full">
          <CollectionManager<PortfolioItem>
            items={filteredItems}
            isAdmin={!!user}
            title="Photo"
            strategy="rect"
            gridClassName={`grid gap-2 sm:gap-4 md:gap-6 pb-6 pt-1 w-full ${
              activeCategory === null 
                ? 'grid-cols-3' 
                : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
            }`}
            onReorder={(newItems) => {
              // Create a clone of the master items array
              const newMasterItems = [...items];
              
              // Find the original indices of the filtered items in the master array
              const indices = filteredItems.map(fi => items.findIndex(i => i.id === fi.id)).filter(idx => idx !== -1);
              
              // Ensure we are assigning them in increasing order of their original slots
              indices.sort((a, b) => a - b);
              
              // Assign the reordered items (newItems) into these original slots
              indices.forEach((masterIndex, i) => {
                newMasterItems[masterIndex] = newItems[i];
              });
              
              // Re-assign global 'order' sequentially based on the new array order
              const finalizedItems = newMasterItems.map((item, idx) => ({ ...item, order: idx }));
              
              // Immediately update the local state in App.tsx to avoid UI snapback
              onItemsUpdated(finalizedItems);
              showNotification("Order updated in draft");
            }}
            onAdd={(newItem) => {
              if (!newItem.url) {
                showNotification("Image is required", "error");
                throw new Error("Image is required");
              }
              const savedItem = {
                ...newItem,
                id: newItem.id || `portfolio_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                order: items.length
              };
              const newItems = [...items, savedItem];
              onItemsUpdated(newItems);
              showNotification("Photo added to draft");
            }}
            onUpdate={(updatedItem) => {
              if (!updatedItem.url) {
                showNotification("Image is required", "error");
                throw new Error("Image is required");
              }
              const newItems = items.map(i => i.id === updatedItem.id ? updatedItem : i);
              onItemsUpdated(newItems);
              showNotification("Photo updated in draft");
            }}
            onDelete={(id) => {
              const newItems = items.filter(item => item.id !== id);
              onItemsUpdated(newItems);
              showNotification("Photo deleted from draft");
            }}
            itemSchema={() => ({
              id: '',
              category: activeCategory || 'Portrait',
              url: '',
              title: { EN: '', DE: '', KO: '' },
              copyright: '',
              copyrightUrl: '',
              order: items.length
            })}
            editorForm={({ item, onChange, onSave, onCancel, isSaving }) => (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] tracking-wider text-neutral-400 font-sans uppercase block font-semibold">Category</label>
                    <select
                      value={item.category || 'Portrait'}
                      onChange={(e) => onChange({ ...item, category: e.target.value as any })}
                      className="w-full bg-black/40 border border-white/10 focus:border-[#C9A227] rounded-sm px-3 py-2 text-xs text-[#ffffff] focus:outline-none focus:ring-1 focus:ring-[#C9A227]"
                    >
                      <option value="Portrait">Portrait</option>
                      <option value="Stage">Stage</option>
                      <option value="Backstage">Backstage</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] tracking-wider text-neutral-400 font-sans uppercase block font-semibold">Image Asset</label>
                    <div className="flex flex-col space-y-2">
                      <div className="flex space-x-2">
                        <input
                          type="url"
                          placeholder="https://..."
                          value={item.url || ''}
                          onChange={(e) => onChange({ ...item, url: e.target.value })}
                          className="flex-1 bg-black/40 border border-white/10 focus:border-[#C9A227] rounded-sm px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#C9A227]"
                        />
                      </div>
                      {item.url && (
                        <div className="relative border border-white/10 rounded overflow-hidden aspect-video bg-black/50">
                           <MediaPreview url={item.url} altText="Preview" className="w-full h-full" imageClassName="w-full h-full object-contain" />
                        </div>
                      )}
                      {/* Google Drive Picker & Local Upload */}
                      <div className="pt-2 flex items-center space-x-3">
                        <GoogleDrivePicker onPick={url => onChange({ ...item, url })} />
                        <div className="relative">
                          <button type="button" className="inline-flex items-center space-x-1.5 text-[10px] uppercase tracking-widest px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-sm transition-all cursor-pointer font-sans border border-neutral-700">
                            <span>Upload Photo</span>
                          </button>
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                const url = URL.createObjectURL(e.target.files[0]);
                                setCropTarget({ 
                                  src: url, 
                                  aspect: 3/4,
                                  onCrop: (base64, copyright, copyrightUrl) => {
                                    onChange({ ...item, url: base64, copyright: copyright || item.copyright, copyrightUrl: copyrightUrl || item.copyrightUrl });
                                    setCropTarget(null);
                                  } 
                                });
                              }
                              e.target.value = '';
                            }} 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-3 border-t border-white/5">
                  <span className="text-[9px] font-mono text-[#C9A227] uppercase tracking-widest block font-bold mb-1">METADATA TRANSLATIONS</span>
                  
                  <div className="space-y-2">
                    <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest block font-semibold">Title / Description</span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input
                        type="text"
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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3 border-t border-white/5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] tracking-wider text-neutral-400 font-sans uppercase block font-semibold">Copyright Name</label>
                    <input
                      type="text"
                      placeholder="e.g. John Doe (Optional)"
                      value={item.copyright || ''}
                      onChange={(e) => onChange({ ...item, copyright: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 focus:border-[#C9A227] rounded-sm px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#C9A227]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] tracking-wider text-neutral-400 font-sans uppercase block font-semibold">Copyright URL</label>
                    <input
                      type="url"
                      placeholder="https://... (Optional)"
                      value={item.copyrightUrl || ''}
                      onChange={(e) => onChange({ ...item, copyrightUrl: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 focus:border-[#C9A227] rounded-sm px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#C9A227]"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-3 border-t border-white/5">
                  <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 border border-white/10 hover:border-white/30 hover:bg-white/5 rounded-sm text-neutral-400 hover:text-white text-xs tracking-wider uppercase font-sans transition-all cursor-pointer"
                  >
                    {t.adminCancel}
                  </button>
                  <button
                    type="button"
                    onClick={onSave}
                    disabled={isSaving}
                    className="px-5 py-2 bg-[#C9A227] hover:bg-[#ebd04e] text-black font-semibold rounded-sm text-xs tracking-wider uppercase transition-all flex items-center space-x-1.5 cursor-pointer font-sans active:scale-95 shadow-md"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSaving ? t.adminSaving : t.adminSave}</span>
                  </button>
                </div>
              </div>
            )}
            renderItem={(item, index) => (
              <div 
                className="relative overflow-hidden w-full h-full aspect-square cursor-pointer"
                onClick={() => setSelectedItemIndex(index)}
                onContextMenu={(e) => e.preventDefault()}
              >
                <MediaPreview
                  url={item.url}
                  altText={getTranslatedTitle(item) || item.category}
                  className="w-full h-full"
                  imageClassName="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                />
                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              </div>
            )}
          />
        </div>

        {/* Lightbox / Modal */}
        <AnimatePresence>
          {selectedItemIndex !== null && (
            <motion.div
              id="portfolio-lightbox"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 md:p-8"
              onClick={() => setSelectedItemIndex(null)}
            >
              <button
                className="absolute top-4 right-4 md:top-8 md:right-8 p-2 text-white/50 hover:text-white transition-colors z-50 bg-black/20 hover:bg-black/40 rounded-full"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedItemIndex(null);
                }}
              >
                <X className="w-6 h-6 md:w-8 md:h-8" />
              </button>
              
              {filteredItems.length > 1 && (
                <>
                  <button
                    className="absolute left-2 md:left-8 top-1/2 -translate-y-1/2 p-3 text-white/50 hover:text-white transition-colors z-50 bg-black/20 hover:bg-black/40 rounded-full"
                    onClick={handlePrev}
                  >
                    <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
                  </button>
                  <button
                    className="absolute right-2 md:right-8 top-1/2 -translate-y-1/2 p-3 text-white/50 hover:text-white transition-colors z-50 bg-black/20 hover:bg-black/40 rounded-full"
                    onClick={handleNext}
                  >
                    <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
                  </button>
                </>
              )}

              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="relative max-w-[90vw] max-h-[90vh] flex flex-col items-center"
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  onClick={() => setSelectedItemIndex(null)}
                  onContextMenu={(e) => e.preventDefault()}
                  className="cursor-pointer max-w-full max-h-[75vh]"
                >
                  <MediaPreview
                    url={filteredItems[selectedItemIndex].url}
                    altText="Stage photography of Opera Singer Hyunkyum Kim performing"
                    className="max-w-full max-h-[75vh]"
                    imageClassName="max-w-full max-h-[75vh] object-contain rounded-sm border border-black/10 shadow-2xl"
                  />
                </div>
                
                <div className="mt-4 text-center max-w-2xl px-4">
                  <span className="text-[10px] tracking-[0.2em] uppercase font-semibold">
                    {filteredItems[selectedItemIndex].category === 'Portrait' 
                      ? t.portraitCat 
                      : filteredItems[selectedItemIndex].category === 'Stage' 
                      ? t.stageCat 
                      : t.backstageCat}
                  </span>
                  <h3 className="text-lg md:text-xl font-serif font-light tracking-wide mt-1">
                    {getTranslatedTitle(filteredItems[selectedItemIndex])}
                  </h3>
                  {filteredItems[selectedItemIndex].copyright && (
                    <div className="mt-2 text-[11px] font-sans tracking-[0.15em] uppercase" style={{ color: theme?.text ? `${theme.text}B3` : undefined }}>
                      {filteredItems[selectedItemIndex].copyrightUrl ? (
                        <a href={filteredItems[selectedItemIndex].copyrightUrl} target="_blank" rel="noopener noreferrer" className="hover:text-[#C9A227] transition-colors" onClick={(e) => e.stopPropagation()}>
                          {filteredItems[selectedItemIndex].copyright.startsWith('©') ? filteredItems[selectedItemIndex].copyright : `© ${filteredItems[selectedItemIndex].copyright}`}
                        </a>
                      ) : (
                        <span>{filteredItems[selectedItemIndex].copyright.startsWith('©') ? filteredItems[selectedItemIndex].copyright : `© ${filteredItems[selectedItemIndex].copyright}`}</span>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <MediaCropWrapper target={cropTarget ? {
        src: cropTarget.src,
        aspect: cropTarget.aspect,
        copyright: cropTarget.copyright,
        copyrightUrl: cropTarget.copyrightUrl,
        onCrop: (base64, copyright, copyrightUrl) => cropTarget.onCrop(base64, copyright, copyrightUrl),
        onCancel: () => setCropTarget(null)
      } : null} />
    </div>
  );
}
