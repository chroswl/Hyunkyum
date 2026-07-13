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
import { PortfolioItem, Language } from '../types';
import { translations } from '../translations';
import { User } from 'firebase/auth';
import { db, storage, savePortfolioItem, deletePortfolioItem } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { uploadToR2, isAIStudioPreview } from '../r2';
import { compressFile, compressBase64, optimizeImageFile } from '../lib/imageCompressor';
import { getMediaSource } from '../lib/mediaUtils';
import ImageCropperModal from './ImageCropperModal';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

interface SortableItemProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  handleClassName?: string;
  key?: string | number;
}

function SortableItem({ id, children, className = '', handleClassName = '' }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={`${className} ${isDragging ? 'opacity-70' : ''}`}>
      <div className={`${handleClassName} cursor-grab touch-none text-neutral-500 hover:text-white`} {...attributes} {...listeners}>
        <GripVertical className="w-4 h-4" />
      </div>
      {children}
    </div>
  );
}

interface PortfolioGalleryProps {
  items: PortfolioItem[];
  currentLang: Language;
  setLang: (lang: Language) => void;
  user: User | null;
  activeEditSection: 'none' | 'biography' | 'press' | 'gallery' | 'videos' | 'schedule';
  setActiveEditSection: (section: 'none' | 'biography' | 'press' | 'gallery' | 'videos' | 'schedule') => void;
  onItemsUpdated: (items: PortfolioItem[]) => void;
  onRefreshData: () => void;
}

export default function PortfolioGallery({ 
  items, 
  currentLang, 
  setLang, 
  user, 
  activeEditSection, 
  setActiveEditSection,
  onItemsUpdated,
  onRefreshData
}: PortfolioGalleryProps) {
  const [activeCategory, setActiveCategory] = useState<'Portrait' | 'Stage' | 'Backstage' | null>(null);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
  
  // Edit mode states
  const isEditMode = activeEditSection === 'gallery';
  const setIsEditMode = (mode: boolean) => {
    setActiveEditSection(mode ? 'gallery' : 'none');
  };
  const [editingItem, setEditingItem] = useState<Partial<PortfolioItem> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const originalItemRef = useRef<Partial<PortfolioItem> | null>(null);

  // Notifications
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [cropTarget, setCropTarget] = useState<{ src: string, aspect?: number, onCrop: (base64: string, copyright?: string, copyrightUrl?: string) => void, copyright?: string, copyrightUrl?: string } | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizeProgress, setOptimizeProgress] = useState<number | null>(null);

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const t = translations[currentLang];
  const categories: ('Portrait' | 'Stage' | 'Backstage')[] = ['Portrait', 'Stage', 'Backstage'];

  const filteredItems = activeCategory === null 
    ? [] 
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

  // Drag sensors
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

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);

    const newOrder = arrayMove(items, oldIndex, newIndex) as PortfolioItem[];
    const updatedList = newOrder.map((item, idx) => ({
      ...item,
      order: idx
    }));

    onItemsUpdated(updatedList);

    try {
      const batchUpdates = updatedList.map((item) => {
        return updateDoc(doc(db, "portfolio", item.id), { order: item.order });
      });
      await Promise.all(batchUpdates);
      showNotification("Order updated successfully");
      onRefreshData();
    } catch (err) {
      console.error("Error saving order:", err);
      showNotification("Failed to update order", "error");
    }
  };

  const startNewPhoto = () => {
    const newItem: Partial<PortfolioItem> = {
      url: '',
      category: activeCategory || 'Portrait',
      title: { EN: '', DE: '', KO: '' }
    };
    setEditingItem(newItem);
    originalItemRef.current = newItem;
  };

  const startEditPhoto = (item: PortfolioItem) => {
    const parsedItem = {
      ...item,
      title: item.title || { EN: '', DE: '', KO: '' }
    };
    setEditingItem(parsedItem);
    originalItemRef.current = JSON.parse(JSON.stringify(parsedItem));
  };

  const handleDeletePhoto = async (id: string) => {
    
    try {
      await deletePortfolioItem(id);
      const newItems = items.filter(item => item.id !== id);
      onItemsUpdated(newItems);
      showNotification("Photo deleted successfully");
    } catch (err: any) {
      console.error("Error deleting portfolio photo:", err);
      showNotification(`Failed to delete photo: ${err.message || 'Unknown error'}`, "error");
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
    if (!editingItem || !editingItem.url) {
      alert("Please upload an image or provide a raw Image URL");
      return;
    }
    setIsSaving(true);
    setUploadProgress(0);
    try {
      const saveItem = { ...editingItem };
      if (saveItem.url && saveItem.url.startsWith('data:image')) {
        if (isAIStudioPreview()) {
          console.log("Running in AI Studio Preview: Skipping R2 upload and using direct compressed Base64 workflow.");
          try {
            const compressedBase64 = await compressBase64(saveItem.url, 750, 0.55);
            saveItem.url = compressedBase64;
          } catch (fallbackErr: any) {
            console.error("Direct storage fallback compression failed:", fallbackErr);
            showNotification(`Upload failed: ${fallbackErr.message || fallbackErr}`, "error");
          }
        } else {
          try {
            const downloadURL = await uploadToR2(saveItem.url, (progress) => {
              setUploadProgress(progress);
            }, 'gallery');
            saveItem.url = downloadURL;
          } catch (r2Err: any) {
            console.warn("R2 upload failed, falling back to compressed Base64...", r2Err);
            try {
              const compressedBase64 = await compressBase64(saveItem.url, 750, 0.55);
              saveItem.url = compressedBase64;
            } catch (fallbackErr: any) {
              console.error("All upload and fallback providers failed:", fallbackErr);
              showNotification(`Upload failed: ${fallbackErr.message || fallbackErr}`, "error");
            }
          }
        }
      }

      // Set the order field if it is a new item
      if (!saveItem.order) {
        saveItem.order = items.length;
      }
      await savePortfolioItem(saveItem as PortfolioItem);
      showNotification("Photo saved successfully");
      setEditingItem(null);
      originalItemRef.current = null;
      onRefreshData();
    } catch (err) {
      console.error("Error saving photo:", err);
      showNotification("Failed to save photo", "error");
    } finally {
      setIsSaving(false);
      setUploadProgress(null);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert("Please upload a valid image file.");
      return;
    }

    if (file.size > 30 * 1024 * 1024) {
      alert("Image is too large. Please upload an image smaller than 30MB.");
      return;
    }

    setIsOptimizing(true);
    setOptimizeProgress(0);

    try {
      const optimizedBase64 = await optimizeImageFile(file, (progress) => {
        setOptimizeProgress(progress);
      });
      setCropTarget({
        src: optimizedBase64,
        aspect: undefined,
        copyright: editingItem?.copyright,
        copyrightUrl: editingItem?.copyrightUrl,
        onCrop: (base64, crpt, crptUrl) => {
          setEditingItem(prev => prev ? { 
            ...prev, 
            url: base64,
            ...(crpt !== undefined && { copyright: crpt }),
            ...(crptUrl !== undefined && { copyrightUrl: crptUrl })
          } : null);
          setCropTarget(null);
        }
      });
    } catch (err: any) {
      console.error(err);
      alert("Failed to optimize image");
    } finally {
      setIsOptimizing(false);
      setOptimizeProgress(null);
    }
    e.target.value = '';
  };

  return (
    <div id="portfolio-gallery-root" className={`w-full relative transition-all duration-500 ${isEditMode || activeCategory !== null ? 'min-h-[400px]' : 'min-h-0'}`}>
      
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

      {/* Admin Panel Header & Trigger */}
      {user && (activeEditSection === 'none' || activeEditSection === 'gallery') && (
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
                <span>Edit Gallery</span>
              </button>
            ) : (
              <div className="flex items-center space-x-3 flex-wrap gap-2">
                {/* Embedded Language switcher inside Gallery Edit Mode */}
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

                <button
                  type="button"
                  onClick={startNewPhoto}
                  className="inline-flex items-center space-x-1.5 text-[10px] uppercase tracking-widest px-3.5 py-2 bg-[#C9A227]/10 hover:bg-[#C9A227]/20 border border-[#C9A227]/30 text-[#C9A227] rounded-sm transition-all cursor-pointer font-sans"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Photo</span>
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
          
          {editingItem ? (
            <form onSubmit={handleSaveChanges} className="bg-white/[0.02] border border-[#C9A227]/20 p-6 md:p-8 rounded-lg space-y-6 max-w-3xl mx-auto transition-all relative">
              <AnimatePresence>
                {isOptimizing && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/85 backdrop-blur-xs z-50 flex flex-col items-center justify-center space-y-3 font-sans rounded-lg"
                  >
                    <div className="relative flex items-center justify-center">
                      <div className="w-10 h-10 border-2 border-[#C9A227] border-t-transparent rounded-full animate-spin" />
                      {optimizeProgress !== null && (
                        <span className="absolute text-[9px] font-mono text-[#C9A227] font-semibold">
                          {optimizeProgress}%
                        </span>
                      )}
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-[11px] text-white uppercase tracking-wider font-semibold">
                        Optimizing Image...
                      </p>
                      <p className="text-[9px] text-neutral-400 tracking-wide px-4">
                        Resizing and compressing file for seamless upload
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex justify-between items-center pb-3 border-b border-white/5">
                <h4 className="text-xs tracking-widest uppercase font-sans font-semibold text-[#C9A227]">
                  {editingItem.id ? 'Edit Photo Details' : 'New Gallery Photo'}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Left Side: Upload & Media source */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] tracking-wider text-neutral-400 font-sans uppercase block font-semibold">Image Source URL</label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/photo-..."
                      value={editingItem.url || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, url: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 focus:border-[#C9A227] rounded-sm px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#C9A227]"
                    />
                    <GoogleDrivePicker onPick={url => setEditingItem({ ...editingItem, url: url })} />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] tracking-wider text-neutral-400 font-sans uppercase block font-semibold">Or Upload Local Photo</label>
                    <div className="flex items-center justify-center w-full relative">
                      <label className={`flex flex-col items-center justify-center w-full h-28 border border-white/10 border-dashed rounded-sm ${uploadProgress !== null ? 'bg-black/60 cursor-not-allowed' : 'cursor-pointer bg-black/20 hover:bg-black/40'} transition-colors`}>
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          {uploadProgress !== null ? (
                            <>
                              <div className="w-8 h-8 border-2 border-[#C9A227] border-t-transparent rounded-full animate-spin mb-2" />
                              <p className="text-[10px] text-[#C9A227] tracking-wider font-sans uppercase">Uploading: {Math.round(uploadProgress)}%</p>
                            </>
                          ) : (
                            <>
                              <ImageIcon className="w-8 h-8 text-neutral-500 mb-2" />
                              <p className="text-[10px] text-neutral-400 tracking-wider font-sans uppercase">Drag & Drop or Click to Select File</p>
                            </>
                          )}
                        </div>
                        <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" disabled={uploadProgress !== null} />
                      </label>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] tracking-wider text-neutral-400 font-sans uppercase block font-semibold">Category</label>
                    <select
                      value={editingItem.category || 'Portrait'}
                      onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value as any })}
                      className="w-full bg-black/40 border border-white/10 focus:border-[#C9A227] rounded-sm px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#C9A227]"
                    >
                      <option value="Portrait">Portrait</option>
                      <option value="Stage">Stage</option>
                      <option value="Backstage">Backstage</option>
                    </select>
                  </div>
                </div>

                {/* Right Side: Preview & Metadata */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] tracking-wider text-neutral-400 font-sans uppercase block font-semibold">Image Live Preview</label>
                    <div className="w-full h-40 bg-black/40 rounded-sm border border-white/5 overflow-hidden flex items-center justify-center p-2 relative group/preview">
                      {editingItem.url ? (
                        <>
                          <img src={editingItem.url} alt="Uploaded source" className="max-w-full max-h-full object-contain rounded-sm" referrerPolicy="no-referrer" />
                          <button
                            type="button"
                            onClick={() => {
                              setCropTarget({
                                src: editingItem.url!,
                                aspect: undefined,
                                copyright: editingItem.copyright,
                                copyrightUrl: editingItem.copyrightUrl,
                                onCrop: (base64, crpt, crptUrl) => {
                                  setEditingItem(prev => prev ? { 
                                    ...prev, 
                                    url: base64,
                                    ...(crpt !== undefined && { copyright: crpt }),
                                    ...(crptUrl !== undefined && { copyrightUrl: crptUrl })
                                  } : null);
                                  setCropTarget(null);
                                }
                              });
                            }}
                            className="absolute inset-0 m-auto w-36 h-9 bg-black/80 hover:bg-black border border-[#C9A227] text-[#C9A227] hover:text-white text-[10px] tracking-wider uppercase font-sans font-medium rounded flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            <span>Crop & Adjust</span>
                          </button>
                        </>
                      ) : (
                        <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">No Image Loaded</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <label className="text-[10px] tracking-wider text-neutral-400 font-sans uppercase block font-semibold">Photo Credit / Copyright</label>
                    <input
                      type="text"
                      placeholder="Photo © Klaudia Hart"
                      value={editingItem.copyright || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, copyright: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 focus:border-[#C9A227] rounded-sm px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#C9A227]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] tracking-wider text-neutral-400 font-sans uppercase block font-semibold">Copyright Link (URL)</label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={editingItem.copyrightUrl || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, copyrightUrl: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 focus:border-[#C9A227] rounded-sm px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#C9A227]"
                    />
                  </div>

                  <div className="space-y-2 border-t border-white/5 pt-3">
                    <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest block font-bold mb-1">TRANSLATIONS (ALL LANGUAGES)</span>
                    <div className="space-y-2">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-1">
                          <span className="text-[10px] font-sans font-bold text-neutral-500 uppercase block py-2">EN</span>
                        </div>
                        <div className="col-span-2">
                          <input
                            type="text"
                            placeholder="Title in English"
                            value={editingItem.title?.EN || ''}
                            onChange={(e) => setEditingItem({
                              ...editingItem,
                              title: { ...editingItem.title, EN: e.target.value } as any
                            })}
                            className="w-full bg-black/40 border border-white/10 focus:border-[#C9A227] rounded-sm px-2.5 py-1.5 text-xs text-white focus:outline-none"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-1">
                          <span className="text-[10px] font-sans font-bold text-neutral-500 uppercase block py-2">DE</span>
                        </div>
                        <div className="col-span-2">
                          <input
                            type="text"
                            placeholder="Title in German"
                            value={editingItem.title?.DE || ''}
                            onChange={(e) => setEditingItem({
                              ...editingItem,
                              title: { ...editingItem.title, DE: e.target.value } as any
                            })}
                            className="w-full bg-black/40 border border-white/10 focus:border-[#C9A227] rounded-sm px-2.5 py-1.5 text-xs text-white focus:outline-none"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-1">
                          <span className="text-[10px] font-sans font-bold text-neutral-500 uppercase block py-2">KO</span>
                        </div>
                        <div className="col-span-2">
                          <input
                            type="text"
                            placeholder="Title in Korean"
                            value={editingItem.title?.KO || ''}
                            onChange={(e) => setEditingItem({
                              ...editingItem,
                              title: { ...editingItem.title, KO: e.target.value } as any
                            })}
                            className="w-full bg-black/40 border border-white/10 focus:border-[#C9A227] rounded-sm px-2.5 py-1.5 text-xs text-white focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
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
            /* Drag-and-drop Photo Listing Sortable */
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs tracking-wider text-neutral-400 font-sans uppercase">
                  Sort Photo Gallery • Drag handle on left • Click edit details
                </h3>
              </div>

              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <div className="divide-y divide-white/5 border border-white/10 bg-black/20 rounded-sm overflow-hidden">
                  {items.length === 0 ? (
                    <div className="p-12 text-center text-neutral-500 text-xs font-sans">No photos in the gallery. Click Add Photo above to upload some!</div>
                  ) : (
                    <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                      {items.map((item) => {
                        const titleText = getTranslatedTitle(item);
                        return (
                          <SortableItem 
                            key={item.id} 
                            id={item.id} 
                            className="bg-transparent hover:bg-white/[0.02] flex items-center pl-12 pr-4 py-3 relative transition-all duration-300 border-b border-white/5" 
                            handleClassName="absolute left-2.5 top-1/2 -translate-y-1/2 p-2"
                          >
                            <div className="flex items-center space-x-4 flex-1 min-w-0 pr-4">
                              {(() => {
                                const media = getMediaSource(item.url);
                                if (media.type === 'video' || media.type === 'youtube' || media.type === 'drive') {
                                  return <div className="w-16 h-12 flex items-center justify-center text-[10px] text-neutral-500 bg-neutral-900 border border-white/5 rounded-sm shrink-0">{media.type}</div>;
                                }
                                return <img src={media.src} alt="Thumbnail preview" className="w-16 h-12 object-cover border border-white/5 rounded-sm shrink-0" referrerPolicy="no-referrer" />;
                              })()}
                              <div className="min-w-0">
                                <span className="text-[9px] font-mono text-[#C9A227] uppercase tracking-widest bg-white/5 px-1.5 py-0.5 rounded mr-2 inline-block">
                                  {item.category}
                                </span>
                                <h4 className="text-xs font-sans text-neutral-200 truncate mt-1 inline-block">
                                  {titleText || "(Untitled Photo)"}
                                </h4>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => startEditPhoto(item)}
                                className="p-2 border border-white/5 hover:border-white/20 text-neutral-400 hover:text-white rounded transition-colors cursor-pointer"
                                title="Edit Photo Details"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeletePhoto(item.id)}
                                className="p-2 border border-rose-500/10 hover:border-rose-500/35 text-rose-400 hover:bg-rose-950/20 rounded transition-colors cursor-pointer"
                                title="Delete Photo"
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
            PUBLIC READ-ONLY EXPERIENCE
            ======================================================== */
        <div className="w-full">
          {/* Category Tabs */}
          <div 
            id="portfolio-tabs" 
            className={`flex justify-center space-x-2 md:space-x-4 overflow-x-auto pb-2 transition-all duration-500 ${
              activeCategory !== null ? 'mb-8' : 'mb-0'
            }`}
          >
            {categories.map((cat) => (
              <button
                key={cat}
                id={`portfolio-tab-${cat.toLowerCase()}`}
                onClick={() => setActiveCategory(prev => prev === cat ? null : cat)}
                className={`px-5 py-2 text-xs tracking-[0.2em] uppercase transition-all border rounded-full duration-300 whitespace-nowrap ${
                  activeCategory === cat
                    ? 'bg-white/10 border-white font-semibold shadow-sm'
                    : 'bg-transparent border-black/10 hover:border-black/20 font-normal hover:border-white/20'
                }`}
              >
                {cat === 'Portrait' ? t.portraitCat : cat === 'Stage' ? t.stageCat : t.backstageCat}
              </button>
            ))}
          </div>

          {/* Smooth height-expanding container for grid */}
          <motion.div
            initial={false}
            animate={{
              height: activeCategory !== null ? 'auto' : 0,
              opacity: activeCategory !== null ? 1 : 0
            }}
            transition={{
              height: { duration: 0.55, ease: [0.16, 1, 0.3, 1] }, // Ultra smooth easeOutExpo
              opacity: { duration: 0.4, ease: 'easeInOut' }
            }}
            className="overflow-hidden w-full"
          >
            {/* Grid Layout (Columns approach for standard elegant masonry feel) */}
            <motion.div 
              id="portfolio-grid"
              layout 
              className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6 pb-6 pt-1"
            >
              <AnimatePresence mode="popLayout">
                {filteredItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    layout
                    id={`portfolio-item-${item.id}`}
                    initial={{ opacity: 0, scale: 0.97, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97, y: 8 }}
                    transition={{ 
                      duration: 0.45, 
                      ease: [0.16, 1, 0.3, 1] // Custom premium easeOutExpo for ultra fluid motion
                    }}
                    className="break-inside-avoid relative group overflow-hidden cursor-pointer bg-transparent/5 rounded-sm border border-black/10/60"
                    onClick={() => setSelectedItemIndex(index)}
                  >
                  {/* Premium image wrapper */}
                  <div className="relative overflow-hidden w-full h-full">
                    <img
                      src={item.url}
                      alt={getTranslatedTitle(item) || item.category}
                      className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      onContextMenu={(e) => e.preventDefault()}
                    />
                    
                    {/* Luxury gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-6">
                      <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] tracking-widest uppercase font-sans font-semibold">
                            {item.category === 'Portrait' ? t.portraitCat : item.category === 'Stage' ? t.stageCat : item.category === 'Backstage' ? t.backstageCat : ''}
                          </span>
                          {user && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeletePhoto(item.id);
                              }}
                              className="p-2 bg-rose-500/80 hover:bg-rose-600 text-white rounded transition-colors"
                              title="Delete Photo directly from Main Page"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <h4 className="text-sm font-serif font-light tracking-wide mt-1">
                          {getTranslatedTitle(item)}
                        </h4>
                        {item.copyright && (
                          <div className="mt-1 text-[9px] font-sans tracking-[0.15em] text-white/70 uppercase">
                            {item.copyrightUrl ? (
                              <a href={item.copyrightUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors" onClick={(e) => e.stopPropagation()}>
                                {item.copyright.trim().startsWith('©') ? item.copyright : `© ${item.copyright.trim()}`}
                              </a>
                            ) : (
                              <span>{item.copyright.trim().startsWith('©') ? item.copyright : `© ${item.copyright.trim()}`}</span>
                            )}
                          </div>
                        )}
                        <div className="mt-3 flex items-center space-x-1.5 text-[10px]">
                          <Maximize2 className="w-3 h-3" />
                          <span className="tracking-wider">{t.clickZoom}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </motion.div>

          {/* Lightbox / Modal */}
          <AnimatePresence>
            {selectedItemIndex !== null && (
              <motion.div
                id="portfolio-lightbox"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-100 bg-transparent/98 backdrop-blur-md flex items-center justify-center p-4 md:p-8"
                onClick={() => setSelectedItemIndex(null)}
              >
                {/* Close Button */}
                <button
                  id="lightbox-close"
                  onClick={() => setSelectedItemIndex(null)}
                  className="absolute top-6 right-6 hover:transition-colors p-2 bg-transparent/5/40 rounded-full border border-black/10"
                  aria-label="Close Lightbox"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Navigation Buttons */}
                {filteredItems.length > 1 && (
                  <>
                    <button
                      id="lightbox-prev"
                      onClick={handlePrev}
                      className="absolute left-4 md:left-8 hover:transition-colors p-3 bg-transparent/5/40 hover:bg-transparent/5/60 border border-black/10 rounded-full"
                      aria-label="Previous Image"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      id="lightbox-next"
                      onClick={handleNext}
                      className="absolute right-4 md:right-8 hover:transition-colors p-3 bg-transparent/5/40 hover:bg-transparent/5/60 border border-black/10 rounded-full"
                      aria-label="Next Image"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </>
                )}

                {/* Main Content Area */}
                <motion.div
                  id="lightbox-content"
                  initial={{ scale: 0.95, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, y: 20 }}
                  transition={{ type: 'spring', duration: 0.5 }}
                  className="max-w-5xl w-full max-h-[85vh] flex flex-col items-center justify-center relative"
                  onClick={(e) => e.stopPropagation()}
                >
                  <img
                    src={filteredItems[selectedItemIndex].url}
                    alt="Enlarged stage photography"
                    className="max-w-full max-h-[75vh] object-contain rounded-sm border border-black/10 shadow-2xl cursor-pointer"
                    referrerPolicy="no-referrer"
                    onContextMenu={(e) => e.preventDefault()}
                    onClick={() => setSelectedItemIndex(null)}
                  />
                  
                  {/* Image Description Block */}
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
                      <div className="mt-2 text-[11px] font-sans tracking-[0.15em] text-neutral-400 uppercase">
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
      )}
      {cropTarget && (
        <ImageCropperModal
          imageSrc={cropTarget.src}
          aspect={cropTarget.aspect}
          copyright={(cropTarget.copyright || '').trim().startsWith('©') ? (cropTarget.copyright || '') : `© ${(cropTarget.copyright || '').trim()}`}
          copyrightUrl={cropTarget.copyrightUrl}
          onCropDone={(base64, copyright, copyrightUrl) => cropTarget.onCrop(base64, copyright, copyrightUrl)}
          onCropCancel={() => setCropTarget(null)}
        />
      )}
    </div>
  );
}
