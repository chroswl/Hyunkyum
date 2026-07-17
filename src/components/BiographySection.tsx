import { InlineEditor } from "../lib/editing/InlineEditor";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Trophy, Compass, Star, Edit3, Save, X, GripVertical, Trash2, Plus, Upload } from 'lucide-react';
import Reveal from './Reveal';
import { CollectionManager } from './admin/collection';
import { User } from 'firebase/auth';
import { GoogleDrivePicker } from './admin/GoogleDrivePicker';
import { BiographySettings, TimelineData, TimelineItem } from '../types';
import { saveBiographySettings } from '../firebase';
import { MediaEngine, useMediaUpload } from '../lib/editing/mediaEngine';
import { MediaCropWrapper, MediaPreview } from './admin/media';
import { getMediaSource, ensureAbsoluteUrl } from '../lib/mediaUtils';
import { BiographyEditorPanel } from './admin/BiographyEditorPanel';

interface BiographySectionProps {
  bio: BiographySettings;
  currentLang: 'EN' | 'DE' | 'KO';
  setLang: (lang: 'EN' | 'DE' | 'KO') => void;
  t: any;
  user: User | null;
  onBioUpdated: (newBio: BiographySettings) => void;
  activeEditSection: 'none' | 'biography' | 'press' | 'gallery' | 'videos' | 'schedule';
  setActiveEditSection: (section: 'none' | 'biography' | 'press' | 'gallery' | 'videos' | 'schedule') => void;
}

export default function BiographySection({ bio: initialBio, currentLang, setLang, t, user, onBioUpdated, activeEditSection, setActiveEditSection }: BiographySectionProps) {
  const [activeTimelineTab, setActiveTimelineTab] = useState<'education' | 'awards' | 'roles' | 'concert'>('education');
  
  const isEditMode = activeEditSection === 'biography';
  const setIsEditMode = (mode: boolean) => {
    setActiveEditSection(mode ? 'biography' : 'none');
  };
  const [editedBio, setEditedBio] = useState<BiographySettings>(initialBio);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [cropTarget, setCropTarget] = useState<{ src: string, aspect?: number, onCrop: (base64: string, copyright?: string, copyrightUrl?: string) => void, copyright?: string, copyrightUrl?: string } | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizeProgress, setOptimizeProgress] = useState<number | null>(null);
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const { uploadMedia, progress: mediaProgress, isUploading: mediaUploading } = useMediaUpload({ folder: 'admin' });

  React.useEffect(() => {
    if (mediaUploading) {
      if (mediaProgress.status === 'optimizing') {
        setIsOptimizing(true);
        setOptimizeProgress(mediaProgress.percentage);
      } else if (mediaProgress.status === 'uploading') {
        setIsOptimizing(false);
        setOptimizeProgress(null);
        setUploadProgress(mediaProgress.percentage);
      }
    } else {
      setIsOptimizing(false);
      setOptimizeProgress(null);
      setUploadProgress(null);
    }
  }, [mediaUploading, mediaProgress]);

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Sync initialBio to editedBio and generate stable IDs when entering edit mode or when initialBio changes
  React.useEffect(() => {
    if (isEditMode) {
      const parsed = JSON.parse(JSON.stringify(initialBio));
      let hasMissingIds = false;
      // Ensure all items have a stable id
      if (parsed.timeline) {
        Object.keys(parsed.timeline).forEach(key => {
          parsed.timeline[key] = parsed.timeline[key].map((item: any, idx: number) => {
            if (!item.id) {
              hasMissingIds = true;
              return {
                ...item,
                id: `bio-item-${Date.now()}-${Math.random().toString(36).substring(2, 11)}-${idx}`
              };
            }
            return item;
          });
        });
      }
      setEditedBio(parsed);
      
      if (hasMissingIds) {
        saveBiographySettings(parsed)
          .then(() => {
            onBioUpdated(parsed);
            showNotification('Generated and persisted stable item IDs');
          })
          .catch(err => {
            console.error("Failed to persist generated IDs:", err);
          });
      }
    } else {
      setEditedBio(initialBio);
    }
  }, [isEditMode, initialBio]);

  const handleEnterEditMode = () => {
    setIsEditMode(true);
  };

  const handleCancelEditMode = () => {
    setIsEditMode(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setUploadProgress(0);
    try {
      let finalBio = { ...editedBio };
      if (editedBio.bioImage && editedBio.bioImage.startsWith('data:image')) {
        try {
          const downloadUrl = await MediaEngine.upload(editedBio.bioImage, 'admin', (progress) => {
            setUploadProgress(progress);
          });
          finalBio.bioImage = downloadUrl;
        } catch (uploadErr) {
          console.error("Failed to upload biography image:", uploadErr);
          throw uploadErr;
        }
        setEditedBio(finalBio);
      }
      await saveBiographySettings(finalBio);
      onBioUpdated(finalBio);
      showNotification('Biography updated successfully');
      setTimeout(() => setIsEditMode(false), 800);
    } catch (err: any) {
      console.error(err);
      showNotification(`Failed to save biography: ${err.message || 'Unknown error'}`, 'error');
    } finally {
      setIsSaving(false);
      setUploadProgress(null);
    }
  };

  const handleTimelineItemsUpdate = async (newTimelineItems: TimelineItem[]) => {
    const updatedBio = {
      ...activeBio,
      timeline: {
        ...activeBio.timeline,
        [activeTimelineTab]: newTimelineItems
      }
    };
    onBioUpdated(updatedBio);
    try {
      await saveBiographySettings(updatedBio);
    } catch (err) {
      console.error("Error saving timeline updates:", err);
      showNotification("Failed to save changes to database", "error");
    }
  };

  const onReorderTimeline = async (newItems: TimelineItem[]) => {
    await handleTimelineItemsUpdate(newItems);
  };

  const onAddTimeline = async (newItem: TimelineItem) => {
    const currentItems = activeBio.timeline?.[activeTimelineTab] || [];
    const newItems = [...currentItems, newItem];
    await handleTimelineItemsUpdate(newItems);
    showNotification("Item added successfully");
  };

  const onUpdateTimeline = async (updatedItem: TimelineItem) => {
    const currentItems = activeBio.timeline?.[activeTimelineTab] || [];
    const newItems = currentItems.map(item => item.id === updatedItem.id ? updatedItem : item);
    await handleTimelineItemsUpdate(newItems);
    showNotification("Item updated successfully");
  };

  const onDeleteTimeline = async (id: string) => {
    const currentItems = activeBio.timeline?.[activeTimelineTab] || [];
    const newItems = currentItems.filter(item => item.id !== id);
    await handleTimelineItemsUpdate(newItems);
    showNotification("Item deleted successfully");
  };

  const timelineItemSchema = (): TimelineItem => ({
    id: `bio-item-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    year: '',
    yearEN: '',
    yearDE: '',
    yearKO: '',
    textEN: '',
    textDE: '',
    textKO: ''
  });

  const activeBio = isEditMode ? editedBio : initialBio;

  const timelineTabs = [
    { id: 'education', label: activeBio.timelineTitles?.education?.[currentLang] || t.eduTitle, icon: <BookOpen className="w-4 h-4" /> },
    { id: 'awards', label: activeBio.timelineTitles?.awards?.[currentLang] || t.awardsTitle, icon: <Trophy className="w-4 h-4" /> },
    { id: 'roles', label: (activeBio.timelineTitles?.roles?.[currentLang] || t.rolesTitle).replace(/\n/g, ' '), icon: <Compass className="w-4 h-4" /> },
    { id: 'concert', label: activeBio.timelineTitles?.concert?.[currentLang] || t.concertTitle, icon: <Star className="w-4 h-4" /> }
  ];

  return (
    <>
      <div className="w-full space-y-8 md:space-y-10" style={{ color: 'var(--color-text)' }}>
        {/* Toast Notifications */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 border rounded-full text-xs tracking-wider uppercase font-sans flex items-center space-x-2 shadow-lg ${
              notification.type === 'success' ? 'border-emerald-500/30 bg-[var(--color-bg)] text-emerald-400' : 'border-rose-500/30 bg-[var(--color-bg)] text-rose-400'
            }`}
          >
            <span>{notification.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

        {/* Admin Header & Edit Trigger */}
        {user && (
          <div className="absolute top-0 right-6 z-50 pointer-events-auto">
            <button 
              onClick={handleEnterEditMode}
              className="flex items-center space-x-2 bg-black/60 hover:bg-black border border-white/10 hover:border-[#C9A227] backdrop-blur-md px-4 py-2 rounded-sm text-xs font-sans tracking-widest uppercase transition-all shadow-xl group"
            >
              <Edit3 className="w-3.5 h-3.5 text-[#C9A227] group-hover:scale-110 transition-transform duration-300" />
              <span className="text-white/90 group-hover:text-white">Biography Editor</span>
            </button>
          </div>
        )}

        <BiographyEditorPanel 
          isOpen={isEditMode} 
          onClose={() => setIsEditMode(false)}
          bio={initialBio}
          currentLang={currentLang}
          setLang={setLang}
          onBioUpdated={onBioUpdated}
        />

      


        <div className="mx-auto w-full">
          <div id="bio-grid" className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 xl:gap-20 items-start">
          {/* Left: Image */}
          <div id="bio-image-col" className="lg:col-span-5 relative group">
            <Reveal delay={0.15}>
              <div className="absolute -inset-1.5 bg-gradient-to-r from-white/10 to-transparent rounded-sm blur-md opacity-30 group-hover:opacity-45 transition-all duration-700" />
              <div className="relative border border-[var(--color-text)] rounded-sm overflow-hidden bg-neutral-900/10">
                <div 
                    className="relative cursor-pointer w-full h-full overflow-hidden group"
                    onClick={() => setIsLightboxOpen(true)}
                  >
                    <MediaPreview
                      url={activeBio.bioImage || "/src/assets/images/hyunkyum_portrait_1783548337837.jpg"}
                      altText="Portrait of Opera Singer Hyunkyum Kim"
                      className="w-full h-full pointer-events-none"
                      imageClassName="w-full h-auto object-cover aspect-[3/4] transition-transform duration-700 group-hover:scale-[1.02]"
                    />
                  </div>
              </div>
            </Reveal>
          </div>

          {/* Right: Text & Timeline */}
          <div id="bio-text-col" className="lg:col-span-7 space-y-10">
            <Reveal delay={0.25}>
              <div className="space-y-6 font-sans text-sm md:text-base leading-relaxed font-light max-w-xl">
                <article itemScope itemType="https://schema.org/Person">
                    <meta itemProp="name" content="Hyunkyum Kim" />
                    <meta itemProp="alternateName" content="바리톤 김현겸" />
                    <meta itemProp="jobTitle" content="South Korean Baritone, Opera Singer" />
                    <div itemProp="description" className="font-medium text-base md:text-lg leading-relaxed">
                      <InlineEditor 
                        id={`bio.bioIntro.${currentLang}`} 
                        initialValue={activeBio.bioIntro[currentLang] || t.bioIntro} 
                        readonly={!user} 
                        placeholder="Short Intro"
                        toolbarTools={["bold", "italic", "link"]}
                        wrapperClassName="block"
                      />
                    </div>
                    <div className="whitespace-pre-line">
                      <InlineEditor 
                        id={`bio.bioLong.${currentLang}`} 
                        initialValue={activeBio.bioLong[currentLang] || t.bioLong} 
                        readonly={!user} 
                        placeholder="Main Biography"
                        toolbarTools={["bold", "italic", "link"]}
                        wrapperClassName="block"
                        as="div"
                      />
                    </div>
                  </article>
              </div>
            </Reveal>

            <Reveal delay={0.35}>
              <div id="timeline-tabs-container" className="space-y-0 pt-4 w-full max-w-xl">
                <div className="grid grid-cols-2 md:grid-cols-4 border-b border-current/10 relative w-full gap-x-1 sm:gap-x-2 md:gap-x-4 px-1 md:px-0">
                  {timelineTabs.map((tab) => {
                    const isActive = activeTimelineTab === tab.id;
                    return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTimelineTab(tab.id as any)}
                      className="relative flex items-center justify-center px-1.5 py-3 sm:py-4 text-[10px] min-[360px]:text-[11px] sm:text-xs md:text-[10.5px] lg:text-[11px] xl:text-xs font-sans tracking-wide uppercase transition-colors cursor-pointer select-none border-b border-current/5 md:border-b-0 w-full text-center min-w-0"
                    >
                      <span className={`flex items-center justify-center space-x-1.5 sm:space-x-2 transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-50 hover:opacity-100'} text-center break-words max-w-full`} style={{ textShadow: isActive ? '0 0 0.5px currentColor' : 'none' }}>
                        <span className="hidden sm:inline-flex flex-shrink-0">{tab.icon}</span>
                        <span className="leading-tight break-words max-w-full">{tab.label}</span>
                      </span>
                      {isActive && (
                        <motion.div
                          layoutId="activeBioTab"
                          className="absolute bottom-[-1px] left-0 right-0 h-[1.5px] bg-current z-10"
                          transition={{ type: 'spring', stiffness: 350, damping: 35 }}
                        />
                      )}
                    </button>
                    );
                  })}
                </div>

                <div id="timeline-content-area" className="bg-[var(--color-bg)]/[0.03] p-6 min-h-[160px]">
                  <CollectionManager<TimelineItem>
                    items={activeBio.timeline?.[activeTimelineTab] || []}
                    isAdmin={!!user}
                    title={activeTimelineTab === 'roles' ? 'Role' : activeTimelineTab === 'concert' ? 'Concert' : activeTimelineTab === 'awards' ? 'Award' : 'Education'}
                    strategy="vertical"
                    gridClassName="space-y-4 w-full"
                    onReorder={onReorderTimeline}
                    onAdd={onAddTimeline}
                    onUpdate={onUpdateTimeline}
                    onDelete={onDeleteTimeline}
                    itemSchema={timelineItemSchema}
                    editorForm={({ item, onChange, onSave, onCancel, isSaving }) => (
                      <div className="space-y-6">
                        <div className="space-y-3">
                          <span className="text-[9px] font-mono text-[#C9A227] uppercase tracking-widest block font-bold mb-1">
                            YEAR / DATE TRANSLATIONS
                          </span>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="space-y-1">
                              <label className="text-[10px] text-neutral-400 font-sans uppercase">Year/Date (EN)</label>
                              <input
                                type="text"
                                placeholder="e.g. 2026 or 2025/2026"
                                value={item.yearEN || item.year || ''}
                                onChange={(e) => onChange({ ...item, yearEN: e.target.value, year: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 focus:border-[#C9A227] rounded-sm px-2.5 py-1.5 text-xs text-white focus:outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] text-neutral-400 font-sans uppercase">Year/Date (DE)</label>
                              <input
                                type="text"
                                placeholder="e.g. 2026"
                                value={item.yearDE || ''}
                                onChange={(e) => onChange({ ...item, yearDE: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 focus:border-[#C9A227] rounded-sm px-2.5 py-1.5 text-xs text-white focus:outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] text-neutral-400 font-sans uppercase">Year/Date (KO)</label>
                              <input
                                type="text"
                                placeholder="e.g. 2026"
                                value={item.yearKO || ''}
                                onChange={(e) => onChange({ ...item, yearKO: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 focus:border-[#C9A227] rounded-sm px-2.5 py-1.5 text-xs text-white focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3 pt-3 border-t border-white/5">
                          <span className="text-[9px] font-mono text-[#C9A227] uppercase tracking-widest block font-bold mb-1">
                            TEXT / DESCRIPTION TRANSLATIONS
                          </span>
                          <div className="space-y-3">
                            <div className="space-y-1">
                              <label className="text-[10px] text-neutral-400 font-sans uppercase block">Description (EN)</label>
                              <textarea
                                rows={2}
                                placeholder="English description"
                                value={item.textEN || ''}
                                onChange={(e) => onChange({ ...item, textEN: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 focus:border-[#C9A227] rounded-sm px-2.5 py-1.5 text-xs text-white focus:outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] text-neutral-400 font-sans uppercase block">Description (DE)</label>
                              <textarea
                                rows={2}
                                placeholder="German description"
                                value={item.textDE || ''}
                                onChange={(e) => onChange({ ...item, textDE: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 focus:border-[#C9A227] rounded-sm px-2.5 py-1.5 text-xs text-white focus:outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] text-neutral-400 font-sans uppercase block">Description (KO)</label>
                              <textarea
                                rows={2}
                                placeholder="Korean description"
                                value={item.textKO || ''}
                                onChange={(e) => onChange({ ...item, textKO: e.target.value })}
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
                    renderItem={(item) => {
                      const text = (currentLang === 'KO' ? item.textKO : currentLang === 'DE' ? item.textDE : item.textEN) || item.textEN || '';
                      const isRepertoire = activeTimelineTab === 'roles' || activeTimelineTab === 'concert';
                      const displayYear = isRepertoire 
                        ? ((currentLang === 'KO' ? item.yearKO : currentLang === 'DE' ? item.yearDE : item.yearEN) ?? item.year) 
                        : item.year;

                      if (isRepertoire) {
                        return (
                          <div className="text-left w-full group py-1.5 border-b border-current/5 last:border-0">
                            <div className="grid grid-cols-1 md:grid-cols-[14rem_1fr] gap-y-1 md:gap-x-6 md:items-center">
                              <div className="font-serif font-medium text-sm md:text-base tracking-wide">
                                {displayYear}
                              </div>
                              <div className="text-xs md:text-sm font-sans leading-relaxed opacity-90">
                                {text}
                              </div>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div className="text-left w-full group py-1.5 border-b border-current/5 last:border-0">
                          <div className="text-xs md:text-sm font-sans leading-relaxed">
                            {displayYear && (
                              <div className="font-serif font-medium text-sm md:text-base tracking-wide mb-1">
                                {displayYear}
                              </div>
                            )}
                            <div className="whitespace-pre-line">{text}</div>
                          </div>
                        </div>
                      );
                    }}
                  />
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </div>
      <MediaCropWrapper target={cropTarget ? {
        src: cropTarget.src,
        aspect: cropTarget.aspect,
        copyright: cropTarget.copyright,
        copyrightUrl: cropTarget.copyrightUrl,
        onCrop: (base64, copyright, copyrightUrl) => cropTarget.onCrop(base64, copyright, copyrightUrl),
        onCancel: () => setCropTarget(null)
      } : null} />

      {/* Biography Media Lightbox / Zoom Overlay */}
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-100 bg-transparent/98 backdrop-blur-md flex items-center justify-center p-4 md:p-8 select-none cursor-zoom-out"
            onClick={() => setIsLightboxOpen(false)}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-6 right-6 hover:transition-colors p-2 rounded-full border border-[var(--color-text)]/10 bg-[var(--color-text)]/5 hover:bg-[var(--color-text)]/10 transition-all cursor-pointer z-50 text-[var(--color-text)]"
              aria-label="Close Lightbox"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Media Content Container */}
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="max-w-5xl w-full max-h-[85vh] flex flex-col items-center justify-center relative"
              onClick={(e) => e.stopPropagation()}
            >
              {(() => {
                const media = getMediaSource(activeBio.bioImage || "/src/assets/images/hyunkyum_portrait_1783548337837.jpg");
                if (media.type === 'video') {
                  return (
                    <video 
                      src={media.src} 
                      className="max-w-full max-h-[75vh] object-contain rounded-sm border border-[var(--color-text)]/10 shadow-2xl cursor-pointer"
                      muted 
                      loop 
                      autoPlay 
                      playsInline 
                      onClick={() => setIsLightboxOpen(false)}
                      onContextMenu={(e) => e.preventDefault()}
                    />
                  );
                } else if (media.type === 'youtube') {
                  return (
                    <div className="w-[85vw] h-[47.8vw] max-w-[960px] max-h-[540px]" onClick={(e) => e.stopPropagation()}>
                      <iframe src={`https://www.youtube.com/embed/${media.ytId}?start=${media.start}`} className="w-full h-full rounded-sm border border-[var(--color-text)]/10 shadow-2xl" frameBorder="0" allowFullScreen />
                    </div>
                  );
                } else if (media.type === 'drive') {
                  return (
                    <div className="w-[85vw] h-[113vw] max-w-[500px] max-h-[75vh]" onClick={(e) => e.stopPropagation()}>
                      <iframe src={media.src} className="w-full h-full rounded-sm border border-[var(--color-text)]/10 shadow-2xl" frameBorder="0" allowFullScreen />
                    </div>
                  );
                }
                return (
                  <img 
                    src={media.src} 
                    alt="High resolution portrait of South Korean Baritone Hyunkyum Kim" 
                    className="max-w-full max-h-[75vh] object-contain rounded-sm border border-[var(--color-text)]/10 shadow-2xl cursor-pointer"
                    referrerPolicy="no-referrer"
                    onClick={() => setIsLightboxOpen(false)}
                    onContextMenu={(e) => e.preventDefault()}
                  />
                );
              })()}

              {/* Image Description Block */}
              <div className="mt-4 text-center max-w-2xl px-4">
                <span className="text-[10px] tracking-[0.2em] uppercase font-semibold text-[var(--color-text)]/60">
                  Hyunkyum Kim
                </span>
                {activeBio.photoCredit && (
                  <div className="mt-2 text-[11px] font-sans tracking-[0.15em] uppercase text-[var(--color-text)]/70">
                    {activeBio.photoCreditLink ? (
                      <a 
                        href={ensureAbsoluteUrl(activeBio.photoCreditLink)} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="hover:text-[#C9A227] transition-colors font-medium" 
                        onClick={(e) => e.stopPropagation()}
                      >
                        {activeBio.photoCredit.startsWith('©') ? activeBio.photoCredit : `© ${activeBio.photoCredit}`}
                      </a>
                    ) : (
                      <span>{activeBio.photoCredit.startsWith('©') ? activeBio.photoCredit : `© ${activeBio.photoCredit}`}</span>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
