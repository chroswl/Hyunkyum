import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, Tv, Disc, Award, Video, Edit3, Plus, Trash2, Save, GripVertical, Check, X, Sparkles 
} from 'lucide-react';
import { 
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent 
} from '@dnd-kit/core';
import { 
  arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable 
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { VideoItem, Language } from '../types';
import { translations } from '../translations';
import { getMediaSource } from '../lib/mediaUtils';
import { User } from 'firebase/auth';
import { db, saveVideoItem, deleteVideoItem } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';

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

interface VideoPlayerProps {
  items: VideoItem[];
  currentLang: Language;
  setLang: (lang: Language) => void;
  user: User | null;
  activeEditSection: 'none' | 'biography' | 'press' | 'gallery' | 'videos' | 'schedule';
  setActiveEditSection: (section: 'none' | 'biography' | 'press' | 'gallery' | 'videos' | 'schedule') => void;
  onItemsUpdated: (items: VideoItem[]) => void;
  onRefreshData: () => void;
}

export default function VideoPlayer({ 
  items, 
  currentLang, 
  setLang, 
  user, 
  activeEditSection, 
  setActiveEditSection,
  onItemsUpdated,
  onRefreshData
}: VideoPlayerProps) {
  const [activeVideo, setActiveVideo] = useState<VideoItem | undefined>(items[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const t = translations[currentLang];

  // Sync activeVideo when items load or change
  useEffect(() => {
    if (items.length > 0) {
      if (!activeVideo || !items.some(item => item.id === activeVideo.id)) {
        setActiveVideo(items[0]);
      }
    } else {
      setActiveVideo(undefined);
    }
  }, [items, activeVideo]);

  // Edit mode states
  const isEditMode = activeEditSection === 'videos';
  const setIsEditMode = (mode: boolean) => {
    setActiveEditSection(mode ? 'videos' : 'none');
  };
  const [editingItem, setEditingItem] = useState<Partial<VideoItem> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const originalItemRef = useRef<Partial<VideoItem> | null>(null);

  // Notifications
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  
  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Helper to get nice opera icons based on roles or title
  const getIcon = (role?: string) => {
    const text = role?.toLowerCase() || '';
    if (text.includes('giovanni') || text.includes('don')) return <Disc className="w-4 h-4 text-neutral-400" />;
    if (text.includes('figaro')) return <Award className="w-4 h-4 text-neutral-400" />;
    return <Tv className="w-4 h-4 text-neutral-400" />;
  };

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

    const newOrder = arrayMove(items, oldIndex, newIndex) as VideoItem[];
    const updatedList = newOrder.map((item, idx) => ({
      ...item,
      order: idx
    }));

    onItemsUpdated(updatedList);

    try {
      const batchUpdates = updatedList.map((item) => {
        return updateDoc(doc(db, "videos", item.id), { order: item.order });
      });
      await Promise.all(batchUpdates);
      showNotification("Videos order updated successfully");
      onRefreshData();
    } catch (err) {
      console.error("Error saving video order:", err);
      showNotification("Failed to update video order", "error");
    }
  };

  const startNewVideo = () => {
    const newItem: Partial<VideoItem> = {
      youtubeId: '',
      title: { EN: '', DE: '', KO: '' },
      role: { EN: '', DE: '', KO: '' }
    };
    setEditingItem(newItem);
    originalItemRef.current = newItem;
  };

  const startEditVideo = (item: VideoItem) => {
    const parsedItem = {
      ...item,
      title: item.title || { EN: '', DE: '', KO: '' },
      role: item.role || { EN: '', DE: '', KO: '' }
    };
    setEditingItem(parsedItem);
    originalItemRef.current = JSON.parse(JSON.stringify(parsedItem));
  };

  const handleDeleteVideo = async (id: string) => {
    
    try {
      await deleteVideoItem(id);
      const newItems = items.filter(item => item.id !== id);
      onItemsUpdated(newItems);
      showNotification("Video deleted successfully");
    } catch (err: any) {
      console.error("Error deleting video:", err);
      showNotification(`Failed to delete video: ${err.message || 'Unknown error'}`, "error");
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
    if (!editingItem || !editingItem.youtubeId) {
      alert("Please provide a valid YouTube ID or Video URL");
      return;
    }
    setIsSaving(true);
    try {
      // Clean up YouTube ID input if they pasted a full URL
      let ytId = editingItem.youtubeId;
      const parsed = getMediaSource(ytId);
      if (parsed.ytId) {
        ytId = parsed.ytId;
      }

      const saveItem = {
        ...editingItem,
        youtubeId: ytId
      };

      if (!saveItem.order) {
        saveItem.order = items.length;
      }

      const saved = await saveVideoItem(saveItem as VideoItem);
      showNotification("Video saved successfully");
      setActiveVideo(saved); // Update active video in player immediately after saving
      setEditingItem(null);
      originalItemRef.current = null;
      onRefreshData();
    } catch (err) {
      console.error("Error saving video:", err);
      showNotification("Failed to save video", "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (items.length === 0 && !isEditMode) {
    return (
      <div id="video-player-loading" className="w-full py-24 text-center border border-neutral-900 rounded bg-[var(--color-bg)] animate-pulse">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-[1px] bg-[var(--color-bg)]" />
          <span className="text-[10px] tracking-[0.3em] text-neutral-400 uppercase font-sans">
            Loading Repertoire Videos...
          </span>
        </div>
      </div>
    );
  }

  const media = (activeVideo ? getMediaSource(activeVideo.youtubeId) : { type: 'none', src: '', ytId: '' }) as any;
  const isYouTube = media.type === 'youtube' && media.ytId;

  return (
    <div id="video-player-section-wrapper" className="w-full relative min-h-[400px]">
      
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
      {user && (activeEditSection === 'none' || activeEditSection === 'videos') && (
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
                <span>Edit Videos</span>
              </button>
            ) : (
              <div className="flex items-center space-x-3 flex-wrap gap-2">
                {/* Embedded Language switcher inside Videos Edit Mode */}
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
                  onClick={startNewVideo}
                  className="inline-flex items-center space-x-1.5 text-[10px] uppercase tracking-widest px-3.5 py-2 bg-[#C9A227]/10 hover:bg-[#C9A227]/20 border border-[#C9A227]/30 text-[#C9A227] rounded-sm transition-all cursor-pointer font-sans"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Video</span>
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
            <form onSubmit={handleSaveChanges} className="bg-white/[0.02] border border-[#C9A227]/20 p-6 md:p-8 rounded-lg space-y-6 max-w-3xl mx-auto transition-all">
              <div className="flex justify-between items-center pb-3 border-b border-white/5">
                <h4 className="text-xs tracking-widest uppercase font-sans font-semibold text-[#C9A227]">
                  {editingItem.id ? 'Edit Video Details' : 'New Repertoire Video'}
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
                
                {/* Left Side: Video Source */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] tracking-wider text-neutral-400 font-sans uppercase block font-semibold">YouTube ID or Video URL</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. qR_b_V8_K8M or https://www.youtube.com/watch?v=..."
                      value={editingItem.youtubeId || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, youtubeId: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 focus:border-[#C9A227] rounded-sm px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#C9A227]"
                    />
                  </div>

                  <div className="space-y-3">
                    <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest block font-bold">TRANSLATIONS (ALL LANGUAGES)</span>
                    
                    {/* Role EN, DE, KO */}
                    <div className="space-y-2">
                      <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest block font-semibold">Role / Opera / Occasion</span>
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          placeholder="Role (EN)"
                          value={editingItem.role?.EN || ''}
                          onChange={(e) => setEditingItem({
                            ...editingItem,
                            role: { ...editingItem.role, EN: e.target.value } as any
                          })}
                          className="w-full bg-black/40 border border-white/10 rounded-sm px-2.5 py-1.5 text-xs text-white focus:outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Role (DE)"
                          value={editingItem.role?.DE || ''}
                          onChange={(e) => setEditingItem({
                            ...editingItem,
                            role: { ...editingItem.role, DE: e.target.value } as any
                          })}
                          className="w-full bg-black/40 border border-white/10 rounded-sm px-2.5 py-1.5 text-xs text-white focus:outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Role (KO)"
                          value={editingItem.role?.KO || ''}
                          onChange={(e) => setEditingItem({
                            ...editingItem,
                            role: { ...editingItem.role, KO: e.target.value } as any
                          })}
                          className="w-full bg-black/40 border border-white/10 rounded-sm px-2.5 py-1.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Venue / Theatre / Description EN, DE, KO */}
                    <div className="space-y-2">
                      <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest block font-semibold">Theatre / Venue / Description</span>
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          placeholder="Venue (EN)"
                          value={editingItem.description?.EN || ''}
                          onChange={(e) => setEditingItem({
                            ...editingItem,
                            description: { ...editingItem.description, EN: e.target.value } as any
                          })}
                          className="w-full bg-black/40 border border-white/10 rounded-sm px-2.5 py-1.5 text-xs text-white focus:outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Venue (DE)"
                          value={editingItem.description?.DE || ''}
                          onChange={(e) => setEditingItem({
                            ...editingItem,
                            description: { ...editingItem.description, DE: e.target.value } as any
                          })}
                          className="w-full bg-black/40 border border-white/10 rounded-sm px-2.5 py-1.5 text-xs text-white focus:outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Venue (KO)"
                          value={editingItem.description?.KO || ''}
                          onChange={(e) => setEditingItem({
                            ...editingItem,
                            description: { ...editingItem.description, KO: e.target.value } as any
                          })}
                          className="w-full bg-black/40 border border-white/10 rounded-sm px-2.5 py-1.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side: Title & Info */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <span className="text-[9px] font-mono text-[#C9A227] uppercase tracking-widest block font-bold mb-1">REPERTOIRE PIECE TITLE</span>
                    <div className="space-y-2.5">
                      <div>
                        <label className="text-[9px] tracking-wider text-neutral-400 font-sans uppercase block mb-1">Title (EN)</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Madamina, il catalogo è questo"
                          value={editingItem.title?.EN || ''}
                          onChange={(e) => setEditingItem({
                            ...editingItem,
                            title: { ...editingItem.title, EN: e.target.value } as any
                          })}
                          className="w-full bg-black/40 border border-white/10 focus:border-[#C9A227] rounded-sm px-3 py-2 text-xs text-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] tracking-wider text-neutral-400 font-sans uppercase block mb-1">Title (DE)</label>
                        <input
                          type="text"
                          placeholder="e.g. Madamina, il catalogo è questo (German)"
                          value={editingItem.title?.DE || ''}
                          onChange={(e) => setEditingItem({
                            ...editingItem,
                            title: { ...editingItem.title, DE: e.target.value } as any
                          })}
                          className="w-full bg-black/40 border border-white/10 focus:border-[#C9A227] rounded-sm px-3 py-2 text-xs text-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] tracking-wider text-neutral-400 font-sans uppercase block mb-1">Title (KO)</label>
                        <input
                          type="text"
                          placeholder="e.g. 카탈로그의 노래 (Korean)"
                          value={editingItem.title?.KO || ''}
                          onChange={(e) => setEditingItem({
                            ...editingItem,
                            title: { ...editingItem.title, KO: e.target.value } as any
                          })}
                          className="w-full bg-black/40 border border-white/10 focus:border-[#C9A227] rounded-sm px-3 py-2 text-xs text-white focus:outline-none"
                        />
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
            /* Drag-and-drop Reorder List */
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs tracking-wider text-neutral-400 font-sans uppercase">
                  Reorder Repertoire reels • Drag handle on left • Click edit to translate
                </h3>
              </div>

              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <div className="divide-y divide-white/5 border border-white/10 bg-black/20 rounded-sm overflow-hidden">
                  {items.length === 0 ? (
                    <div className="p-12 text-center text-neutral-500 text-xs font-sans">No videos available. Click Add Video above to publish repertoire!</div>
                  ) : (
                    <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                      {items.map((item) => {
                        return (
                          <SortableItem 
                            key={item.id} 
                            id={item.id} 
                            className="bg-transparent hover:bg-white/[0.02] flex items-center pl-12 pr-4 py-4 relative transition-all duration-300 border-b border-white/5" 
                            handleClassName="absolute left-2.5 top-1/2 -translate-y-1/2 p-2"
                          >
                            <div className="flex-1 min-w-0 pr-4">
                              <div className="flex items-center space-x-2">
                                <span className="text-xs font-sans font-bold text-neutral-200">
                                  {item.title[currentLang] || item.title['EN']}
                                </span>
                                <span className="text-[9px] font-mono text-[#C9A227] uppercase tracking-widest bg-white/5 px-1.5 py-0.5 rounded">
                                  YT: {item.youtubeId}
                                </span>
                              </div>
                              {item.role && (
                                <p className="text-[11px] text-neutral-400 mt-0.5 font-sans">
                                  {item.role[currentLang] || item.role['EN']}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center space-x-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => startEditVideo(item)}
                                className="p-2 border border-white/5 hover:border-white/20 text-neutral-400 hover:text-white rounded transition-colors cursor-pointer"
                                title="Edit Video"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteVideo(item.id)}
                                className="p-2 border border-rose-500/10 hover:border-rose-500/35 text-rose-400 hover:bg-rose-950/20 rounded transition-colors cursor-pointer"
                                title="Delete Video"
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
            PUBLIC READ-ONLY INTERFACE
            ======================================================== */
        <div id="video-player-root" className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Main Theater Screen (8 cols) */}
          <div id="video-screen-container" className="lg:col-span-8 space-y-4">
            {/* Elegant Cinematic Media Frame */}
            <div className="relative aspect-video w-full bg-[#050505] p-2 md:p-3 shadow-2xl ring-1 ring-white/10 rounded-sm">
              <div className="relative w-full h-full bg-black overflow-hidden rounded-sm border border-white/5">
                <AnimatePresence mode="wait">
                  {activeVideo && (
                    <motion.div
                      key={activeVideo.id + (isPlaying ? '-playing' : '-poster')}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.6, ease: "easeInOut" }}
                      className="absolute inset-0"
                    >
                      {!isPlaying ? (
                        <div 
                          className="absolute inset-0 flex flex-col items-center justify-center bg-cover bg-center" 
                          style={isYouTube ? { backgroundImage: `url('https://img.youtube.com/vi/${media.ytId}/maxresdefault.jpg')` } : { backgroundColor: '#111' }}
                        >
                          <div className="absolute inset-0 bg-black/75 transition-all duration-700 group-hover:bg-black/60" />
                          <motion.button
                            id="play-button"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsPlaying(true)}
                            className="relative z-10 w-16 h-16 md:w-20 md:h-20 bg-white/90 hover:bg-white rounded-full flex items-center justify-center text-black shadow-[0_0_40px_rgba(255,255,255,0.3)] cursor-pointer transition-all duration-500 backdrop-blur-sm"
                            aria-label="Play Performance Video"
                          >
                            <Play className="w-8 h-8 fill-black translate-x-0.5" />
                          </motion.button>
                          <div className="relative z-10 text-center mt-8 px-4">
                            <span className="text-[10px] tracking-[0.4em] text-white/60 uppercase font-sans block mb-2">
                              {t.watchNow}
                            </span>
                            <h3 className="text-xl md:text-2xl font-serif font-light text-white tracking-wide">
                              {activeVideo.title[currentLang] || activeVideo.title['EN']}
                            </h3>
                            {activeVideo.role && (
                              <p className="text-sm text-white/70 font-sans tracking-widest mt-2">
                                {activeVideo.role[currentLang] || activeVideo.role['EN']}
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        isYouTube ? (
                          <iframe
                            id="youtube-iframe"
                            src={`https://www.youtube.com/embed/${media.ytId}?autoplay=1&rel=0&modestbranding=1${media.start ? `&start=${media.start}` : ''}`}
                            title={activeVideo.title[currentLang] || activeVideo.title['EN']}
                            className="absolute inset-0 w-full h-full border-0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        ) : media.type === 'drive' ? (
                          <iframe
                            id="drive-iframe"
                            src={media.src}
                            title={activeVideo.title[currentLang] || activeVideo.title['EN']}
                            className="absolute inset-0 w-full h-full border-0"
                            allow="autoplay"
                            allowFullScreen
                          />
                        ) : (
                          <video
                            src={media.src}
                            autoPlay
                            controls
                            playsInline
                            className="absolute inset-0 w-full h-full object-contain bg-black"
                            onEnded={() => setIsPlaying(false)}
                          />
                        )
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Right Column: Playlist Sidebar (4 cols) */}
          <div id="video-playlist-sidebar" className="lg:col-span-4 space-y-3">
            <h3 className="text-xs tracking-[0.25em] text-neutral-400 uppercase font-sans font-semibold mb-4 px-2">
              Repertoire Reels
            </h3>
            <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
              {items.map((video) => {
                const isSelected = activeVideo && activeVideo.id === video.id;
                return (
                  <button
                    key={video.id}
                    id={`video-list-item-${video.id}`}
                    onClick={() => {
                      setActiveVideo(video);
                      setIsPlaying(true); // Auto play when selecting from sidebar
                    }}
                    className={`w-full text-left p-4 rounded-sm border transition-all duration-300 flex items-start space-x-3.5 group cursor-pointer ${
                      isSelected
                        ? 'bg-[var(--color-bg)] border-white text-[var(--color-text)] shadow-md'
                        : 'bg-[var(--color-bg)] border-neutral-900 text-neutral-400 hover:bg-[var(--color-bg)] hover:border-neutral-800 hover:text-[var(--color-text)]'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {getIcon(video.role?.EN)}
                    </div>
                    <div className="space-y-1">
                      <h4 className={`text-xs md:text-sm font-sans tracking-wide transition-colors ${
                        isSelected ? 'text-[var(--color-text)] font-bold' : 'text-neutral-300 group-hover:text-[var(--color-text)]'
                      }`}>
                        {video.title[currentLang] || video.title['EN']}
                      </h4>
                      {video.role && (
                        <p className="text-[11px] text-neutral-500 tracking-wider">
                          {video.role[currentLang] || video.role['EN']}
                        </p>
                      )}
                    </div>
                    {user && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteVideo(video.id);
                        }}
                        className="ml-auto p-1.5 border border-rose-500/10 hover:border-rose-500/35 text-rose-400 hover:bg-rose-950/20 rounded transition-colors cursor-pointer"
                        title="Delete from main page"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
