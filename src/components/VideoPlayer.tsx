import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, Tv, Disc, Award, Video, Edit3, Plus, Trash2, Save, GripVertical, Check, X, Sparkles 
} from 'lucide-react';
import { VideoItem, Language, ThemeSettings } from '../types';
import { translations } from '../translations';
import { getMediaSource } from '../lib/mediaUtils';
import { User } from 'firebase/auth';
import { db, saveVideoItem, deleteVideoItem } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { CollectionManager } from './admin/collection';
import { MediaPreview } from './admin/media';

interface VideoPlayerProps {
  items: VideoItem[];
  currentLang: Language;
  setLang: (lang: Language) => void;
  user: User | null;
  activeEditSection: 'none' | 'biography' | 'press' | 'gallery' | 'videos' | 'schedule';
  setActiveEditSection: (section: 'none' | 'biography' | 'press' | 'gallery' | 'videos' | 'schedule') => void;
  onItemsUpdated: (items: VideoItem[]) => void;
  theme?: ThemeSettings;
}

export default function VideoPlayer({ 
  items, 
  currentLang, 
  setLang, 
  user, 
  activeEditSection, 
  setActiveEditSection,
  onItemsUpdated,
  
  theme
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

  const onReorderVideos = (newItems: VideoItem[]) => {
    const finalized = newItems.map((item, idx) => ({ ...item, order: idx }));
    onItemsUpdated(finalized);
    showNotification("Videos reordered in draft");
  };

  const onAddVideo = (newItem: VideoItem) => {
    const savedItem = {
      ...newItem,
      id: newItem.id || `video_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      order: items.length
    };
    const newItems = [...items, savedItem];
    onItemsUpdated(newItems);
    setActiveVideo(savedItem);
    showNotification("Video added to draft");
  };

  const onUpdateVideo = (updatedItem: VideoItem) => {
    const newItems = items.map(i => i.id === updatedItem.id ? updatedItem : i);
    onItemsUpdated(newItems);
    if (activeVideo?.id === updatedItem.id) {
      setActiveVideo(updatedItem);
    }
    showNotification("Video updated in draft");
  };

  const onDeleteVideo = (id: string) => {
    const newItems = items.filter(i => i.id !== id);
    onItemsUpdated(newItems);
    if (activeVideo?.id === id) {
      setActiveVideo(newItems.length > 0 ? newItems[0] : undefined);
    }
    showNotification("Video deleted from draft");
  };

  const videoItemSchema = (): VideoItem => ({
    id: `video-item-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    youtubeId: '',
    title: { EN: '', DE: '', KO: '' },
    role: { EN: '', DE: '', KO: '' },
    order: items.length
  });

  // Helper to get nice opera icons based on roles or title
  const getIcon = (role?: string) => {
    const text = role?.toLowerCase() || '';
    const iconStyle = { color: 'color-mix(in srgb, var(--color-text) 50.196078%, transparent)' };
    if (text.includes('giovanni') || text.includes('don')) return <Disc className="w-4 h-4" style={iconStyle} />;
    if (text.includes('figaro')) return <Award className="w-4 h-4" style={iconStyle} />;
    return <Tv className="w-4 h-4" style={iconStyle} />;
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
      // delete local only
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

      const saved = { ...saveItem };
      if (!saved.id) saved.id = 'temp_' + Date.now();
      
      const newItems = items.find(i => i.id === saved.id)
        ? items.map(i => i.id === saved.id ? saved : i)
        : [...items, saved];
      
      onItemsUpdated(newItems);
      setActiveVideo(saved);
      setEditingItem(null);
      originalItemRef.current = null;
      
    } catch (err) {
      console.error("Error saving video:", err);
      showNotification("Failed to save video", "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (items.length === 0 && !user) {
    return null;
  }

  const media = (activeVideo ? getMediaSource(activeVideo.youtubeId) : { type: 'none', src: '', ytId: '' }) as any;
  const isYouTube = media.type === 'youtube' && media.ytId;

  return (
    <div id="video-player-section-wrapper" className="w-full relative min-h-[400px]" style={{ backgroundColor: theme?.bg, color: theme?.text }}>
      
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
          <CollectionManager<VideoItem>
            items={items}
            isAdmin={true}
            title="Video Reel"
            strategy="vertical"
            gridClassName="space-y-4 w-full"
            onReorder={onReorderVideos}
            onAdd={onAddVideo}
            onUpdate={onUpdateVideo}
            onDelete={onDeleteVideo}
            itemSchema={videoItemSchema}
            editorForm={({ item, onChange, onSave, onCancel, isSaving }) => (
              <div className="space-y-6">
                <div className="space-y-1 text-left">
                  <label className="text-[10px] text-neutral-400 font-sans uppercase block font-bold">YouTube ID or Video URL</label>
                  <input
                    type="text"
                    placeholder="e.g. dQw4w9WgXcQ or https://www.youtube.com/watch?v=..."
                    value={item.youtubeId || ''}
                    onChange={(e) => {
                      let val = e.target.value;
                      const parsed = getMediaSource(val);
                      if (parsed.ytId) {
                        val = parsed.ytId;
                      }
                      onChange({ ...item, youtubeId: val });
                    }}
                    className="w-full bg-black/40 border border-white/10 focus:border-[#C9A227] rounded-sm px-2.5 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-3 pt-3 border-t border-white/5">
                  <span className="text-[9px] font-mono text-[#C9A227] uppercase tracking-widest block font-bold mb-1 text-left">
                    TITLE TRANSLATIONS
                  </span>
                  <div className="space-y-3 text-left">
                    <div className="space-y-1">
                      <label className="text-[10px] text-neutral-400 font-sans uppercase block font-semibold">Title (EN)</label>
                      <input
                        type="text"
                        placeholder="English title"
                        value={item.title?.EN || ''}
                        onChange={(e) => onChange({ ...item, title: { ...item.title, EN: e.target.value } })}
                        className="w-full bg-black/40 border border-white/10 focus:border-[#C9A227] rounded-sm px-2.5 py-1.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-neutral-400 font-sans uppercase block font-semibold">Title (DE)</label>
                      <input
                        type="text"
                        placeholder="German title"
                        value={item.title?.DE || ''}
                        onChange={(e) => onChange({ ...item, title: { ...item.title, DE: e.target.value } })}
                        className="w-full bg-black/40 border border-white/10 focus:border-[#C9A227] rounded-sm px-2.5 py-1.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-neutral-400 font-sans uppercase block font-semibold">Title (KO)</label>
                      <input
                        type="text"
                        placeholder="Korean title"
                        value={item.title?.KO || ''}
                        onChange={(e) => onChange({ ...item, title: { ...item.title, KO: e.target.value } })}
                        className="w-full bg-black/40 border border-white/10 focus:border-[#C9A227] rounded-sm px-2.5 py-1.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-white/5">
                  <span className="text-[9px] font-mono text-[#C9A227] uppercase tracking-widest block font-bold mb-1 text-left">
                    ROLE / SUBTITLE TRANSLATIONS
                  </span>
                  <div className="space-y-3 text-left">
                    <div className="space-y-1">
                      <label className="text-[10px] text-neutral-400 font-sans uppercase block font-semibold">Role/Subtitle (EN)</label>
                      <input
                        type="text"
                        placeholder="English role"
                        value={item.role?.EN || ''}
                        onChange={(e) => onChange({ ...item, role: { ...item.role, EN: e.target.value } })}
                        className="w-full bg-black/40 border border-white/10 focus:border-[#C9A227] rounded-sm px-2.5 py-1.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-neutral-400 font-sans uppercase block font-semibold">Role/Subtitle (DE)</label>
                      <input
                        type="text"
                        placeholder="German role"
                        value={item.role?.DE || ''}
                        onChange={(e) => onChange({ ...item, role: { ...item.role, DE: e.target.value } })}
                        className="w-full bg-black/40 border border-white/10 focus:border-[#C9A227] rounded-sm px-2.5 py-1.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-neutral-400 font-sans uppercase block font-semibold">Role/Subtitle (KO)</label>
                      <input
                        type="text"
                        placeholder="Korean role"
                        value={item.role?.KO || ''}
                        onChange={(e) => onChange({ ...item, role: { ...item.role, KO: e.target.value } })}
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
              <div className="w-full p-4 border border-white/5 bg-white/[0.01] rounded-sm flex items-start space-x-4 text-left">
                <div className="w-32 aspect-video bg-cover bg-center rounded-sm relative shrink-0 overflow-hidden border border-white/10" style={{ backgroundImage: `url('https://img.youtube.com/vi/${item.youtubeId}/mqdefault.jpg')` }}>
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <Play className="w-6 h-6 text-white/90" />
                  </div>
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <h4 className="text-sm font-sans tracking-wide text-white font-semibold truncate">
                    {item.title ? (item.title[currentLang] || item.title['EN']) : ''}
                  </h4>
                  {item.role && typeof item.role === 'object' && (
                    <p className="text-xs text-neutral-400 truncate">
                      {item.role[currentLang] || item.role['EN']}
                    </p>
                  )}
                  <p className="text-[10px] font-mono text-[#C9A227] uppercase tracking-wider pt-1">
                    YouTube ID: {item.youtubeId}
                  </p>
                </div>
              </div>
            )}
          />
        </div>
      ) : (
        <div id="video-player-root" className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Main Theater Screen (8 cols) */}
          <div id="video-screen-container" className="lg:col-span-8 space-y-4">
            {/* Elegant Cinematic Media Frame */}
            <div className="relative aspect-video w-full bg-[#050505] p-2 md:p-3 shadow-2xl rounded-sm">
              <div className="relative w-full h-full bg-black overflow-hidden rounded-sm">
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
                            className="relative z-10 w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-white/90 hover:bg-white rounded-full flex items-center justify-center text-black shadow-[0_0_40px_rgba(255,255,255,0.3)] cursor-pointer transition-all duration-500 backdrop-blur-sm shrink-0"
                            aria-label="Play Performance Video"
                          >
                            <Play className="w-6 h-6 sm:w-8 sm:h-8 fill-black translate-x-0.5" />
                          </motion.button>
                          <div className="relative z-10 text-center mt-4 sm:mt-8 px-2 sm:px-4 max-w-full sm:max-w-2xl w-full mx-auto overflow-hidden flex flex-col items-center">
                            <span className="text-[9px] sm:text-[10px] tracking-widest sm:tracking-[0.4em] uppercase font-sans block mb-1.5 sm:mb-2 truncate w-full" style={{ color: 'var(--color-text)' }}>
                              {t.watchNow}
                            </span>
                            <h3 className="text-sm sm:text-xl md:text-2xl font-serif font-light tracking-wide line-clamp-2 px-2" style={{ color: 'var(--color-text)' }}>
                              {activeVideo.title ? (activeVideo.title[currentLang] || activeVideo.title['EN']) : ''}
                            </h3>
                            {activeVideo.role && typeof activeVideo.role === 'object' && (
                              <p className="text-xs sm:text-sm font-sans tracking-widest mt-1 sm:mt-2 truncate w-full px-2" style={{ color: 'var(--color-text)' }}>
                                {activeVideo.role[currentLang] || activeVideo.role['EN']}
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <MediaPreview
                          url={activeVideo.youtubeId}
                          altText={activeVideo.title ? (activeVideo.title[currentLang] || activeVideo.title['EN']) : ''}
                          className="absolute inset-0 w-full h-full"
                          autoPlay={true}
                          controls={true}
                          muted={false}
                          loop={false}
                          showPlayIcon={false}
                          onEnded={() => setIsPlaying(false)}
                        />
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Right Column: Playlist Sidebar (4 cols) */}
          <div id="video-playlist-sidebar" className="lg:col-span-4 space-y-3">
            <h3 className="text-xs tracking-[0.25em] uppercase font-sans font-semibold mb-4 px-2" style={{ color: 'var(--color-text)' }}>
              Repertoire Reels
            </h3>
            <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
              {items.map((video, idx) => {
                const isSelected = activeVideo && activeVideo.id === video.id;
                return (
                  <button
                    key={video.id || `video-list-item-${idx}`}
                    id={`video-list-item-${video.id}`}
                    onClick={() => {
                      setActiveVideo(video);
                      setIsPlaying(true); // Auto play when selecting from sidebar
                    }}
                    className={`w-full text-left p-4 rounded-sm border transition-all duration-300 flex items-start space-x-3.5 group cursor-pointer ${
                      isSelected
                        ? 'shadow-md'
                        : ''
                    }`}
                    style={{
                        backgroundColor: 'var(--color-bg)',
                        borderColor: isSelected ? 'var(--color-text)' : 'var(--color-border)',
                        color: 'var(--color-text)'
                    }}
                  >
                    <div className="mt-0.5 shrink-0">
                      {getIcon(video.role?.EN)}
                    </div>
                    <div className="space-y-1">
                      <h4 className={`text-xs md:text-sm font-sans tracking-wide transition-colors ${
                        isSelected ? 'font-bold' : 'group-hover:opacity-100'
                      }`} style={{ color: 'var(--color-text)' }}>
                        {video.title ? (video.title[currentLang] || video.title['EN']) : ''}
                      </h4>
                      {video.role && typeof video.role === 'object' && (
                        <p className="text-[11px] tracking-wider" style={{ color: 'var(--color-text)' }}>
                          {video.role[currentLang] || video.role['EN']}
                        </p>
                      )}
                    </div>
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
