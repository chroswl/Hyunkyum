import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Trophy, Compass, Star, Edit3, Save, X, GripVertical, Trash2, Plus, Upload } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SortableItem } from './SortableItem';
import Reveal from './Reveal';
import { User } from 'firebase/auth';
import { GoogleDrivePicker } from './admin/GoogleDrivePicker';
import { BiographySettings, TimelineData } from '../types';
import { saveBiographySettings } from '../firebase';
import { uploadToR2, isAIStudioPreview } from '../r2';
import { compressBase64, optimizeImageFile } from '../lib/imageCompressor';
import ImageCropperModal from './ImageCropperModal';
import { getMediaSource } from '../lib/mediaUtils';

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

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Sync initialBio to editedBio when we enter edit mode
  const handleEnterEditMode = () => {
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
              id: `bio-item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${idx}`
            };
          }
          return item;
        });
      });
    }
    setEditedBio(parsed);
    setIsEditMode(true);
    
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
  };

  const handleCancelEditMode = () => {
    const hasChanges = JSON.stringify(editedBio) !== JSON.stringify(initialBio);
    if (!hasChanges || true) {
      setIsEditMode(false);
      setEditedBio(initialBio);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setUploadProgress(0);
    try {
      let finalBio = { ...editedBio };
      if (editedBio.bioImage && editedBio.bioImage.startsWith('data:image')) {
        if (isAIStudioPreview()) {
          console.log("Running in AI Studio Preview: Skipping R2 upload and using direct compressed Base64 workflow.");
          const compressedUrl = await compressBase64(editedBio.bioImage, 750, 0.55);
          finalBio.bioImage = compressedUrl;
        } else {
          try {
            const downloadUrl = await uploadToR2(editedBio.bioImage, (progress) => {
              setUploadProgress(progress);
            }, 'admin');
            finalBio.bioImage = downloadUrl;
          } catch (r2Err) {
            console.warn("R2 upload failed, falling back to local compressed base64...", r2Err);
            const compressedUrl = await compressBase64(editedBio.bioImage, 750, 0.55);
            finalBio.bioImage = compressedUrl;
          }
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

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const activeIdx = editedBio.timeline?.[activeTimelineTab]?.findIndex((i: any) => i.id === active.id) ?? -1;
      const overIdx = editedBio.timeline?.[activeTimelineTab]?.findIndex((i: any) => i.id === over.id) ?? -1;
      
      if (activeIdx !== -1 && overIdx !== -1) {
        const newTimeline = { ...editedBio.timeline } as TimelineData;
        const items = [...(newTimeline[activeTimelineTab] || [])];
        const newItems = arrayMove(items, activeIdx, overIdx);
        newTimeline[activeTimelineTab] = newItems;
        const newBio = { ...editedBio, timeline: newTimeline };
        
        setEditedBio(newBio);
        
        // Save automatically after dropping as requested
        try {
          await saveBiographySettings(newBio);
          onBioUpdated(newBio);
          showNotification('Order updated');
          
        } catch (err) {
          console.error('Failed to auto-save drag order', err);
        }
      }
    }
  };

  const activeBio = isEditMode ? editedBio : initialBio;

  const timelineTabs = [
    { id: 'education', label: activeBio.timelineTitles?.education?.[currentLang] || t.eduTitle, icon: <BookOpen className="w-4 h-4" /> },
    { id: 'awards', label: activeBio.timelineTitles?.awards?.[currentLang] || t.awardsTitle, icon: <Trophy className="w-4 h-4" /> },
    { id: 'roles', label: activeBio.timelineTitles?.roles?.[currentLang] || t.rolesTitle, icon: <Compass className="w-4 h-4" /> },
    { id: 'concert', label: activeBio.timelineTitles?.concert?.[currentLang] || t.concertTitle, icon: <Star className="w-4 h-4" /> }
  ];

  return (
    <section id="biography" className="page-section bio-bg relative border-t-0">
      <div className={`max-w-7xl mx-auto px-6 pt-10 pb-4 ${isEditMode ? '' : 'hidden'}`}></div>
      <div className={`max-w-7xl mx-auto w-full px-6 md:px-12 pt-12 space-y-8 md:space-y-10`}>
        {/* Toast Notifications */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 border rounded-full text-xs tracking-wider uppercase font-body flex items-center space-x-2 shadow-lg ${
              notification.type === 'success' ? 'border-emerald-500/30 bg-emerald-950/80 text-emerald-400' : 'border-rose-500/30 bg-rose-950/80 text-rose-400'
            }`}
          >
            <span>{notification.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

        {/* Admin Header & Edit Trigger */}
        {user && (activeEditSection === 'none' || activeEditSection === 'biography') && (
          <div className="flex flex-wrap justify-between items-center mb-6 pb-4 border-b border-borders/5 gap-4">
            <div className="flex items-center space-x-3">
              <span className="text-[9px] font-mono tracking-widest text-accent uppercase bg-white/5 px-2 py-1 rounded">
                ADMIN ACCESS
              </span>
            </div>

            <div className="flex items-center space-x-3">
              {!isEditMode ? (
                <button
                  type="button"
                  onClick={handleEnterEditMode}
                  className="inline-flex items-center space-x-2 text-[10px] uppercase tracking-widest px-4 py-2 bg-white/5 border border-borders/10 hover:border-accent hover:bg-white/10 rounded-sm text-neutral-300 transition-all cursor-pointer font-body font-medium"
                >
                  <Edit3 className="w-3.5 h-3.5 text-accent" />
                  <span>Edit Biography</span>
                </button>
              ) : (
                <div className="flex items-center space-x-3 flex-wrap gap-2">
                  <div className="flex items-center space-x-1 bg-white/5 px-1.5 py-1 rounded-sm border border-borders/10">
                    {(['EN', 'DE', 'KO'] as const).map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => setLang(lang as any)}
                        className={`px-2.5 py-0.5 text-[10px] font-body font-bold tracking-wider rounded-sm transition-all ${
                          currentLang === lang
                            ? 'bg-accent text-black font-extrabold shadow-sm'
                            : 'text-text-main/60 hover:text-text-main'
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="inline-flex items-center space-x-1.5 text-[10px] uppercase tracking-widest px-3.5 py-2 bg-accent/10 hover:bg-accent/20 border border-accent/30 text-accent rounded-sm transition-all cursor-pointer font-body"
                  >
                    <Save className="w-3 h-3" />
                    <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCancelEditMode}
                    className="inline-flex items-center space-x-1.5 text-[10px] uppercase tracking-widest px-3.5 py-2 border border-borders/10 hover:border-borders/25 hover:bg-white/5 rounded-sm text-text-main/60 hover:text-text-main transition-all cursor-pointer font-body"
                  >
                    <X className="w-3 h-3" />
                    <span>Exit Edit Mode</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

      
        <Reveal>
          <div className="text-center">
            <h2 className="text-xl md:text-3xl font-heading font-light uppercase tracking-[0.25em] leading-none">
              BIOGRAPHY
            </h2>
          </div>
        </Reveal>

        <div id="bio-grid" className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left: Image */}
          <div id="bio-image-col" className="lg:col-span-5 relative group">
            <Reveal delay={0.15}>
              <div className="absolute -inset-1.5 bg-gradient-to-r from-white/10 to-transparent rounded-sm blur-md opacity-30 group-hover:opacity-45 transition-all duration-700" />
              <div className="relative border border-black/10 rounded-sm overflow-hidden bg-transparent/5">
                {isEditMode ? (
                  <div className="p-4 bg-neutral-900 min-h-[400px] flex flex-col space-y-4 relative">
                    <AnimatePresence>
                      {isOptimizing && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 bg-black/80 backdrop-blur-xs z-50 flex flex-col items-center justify-center space-y-3 font-body rounded-sm"
                        >
                          <div className="relative flex items-center justify-center">
                            <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                            {optimizeProgress !== null && (
                              <span className="absolute text-[9px] font-mono text-accent font-semibold">
                                {optimizeProgress}%
                              </span>
                            )}
                          </div>
                          <div className="text-center space-y-1">
                            <p className="text-[11px] text-text-main uppercase tracking-wider font-semibold">
                              Optimizing Image...
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="space-y-1.5">
                      <label className="text-[10px] tracking-wider text-text-main/60 font-body uppercase block font-semibold">Image Source URL</label>
                      <input 
                        type="url" 
                        value={editedBio.bioImage || ''}
                        onChange={(e) => setEditedBio({...editedBio, bioImage: e.target.value})}
                        className="w-full bg-black/40 border border-borders/10 focus:border-accent rounded-sm px-3 py-2 text-xs text-text-main focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                        placeholder="https://images.unsplash.com/photo-..."
                      />
                      <GoogleDrivePicker onPick={url => setEditedBio({...editedBio, bioImage: url})} />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] tracking-wider text-text-main/60 font-body uppercase block font-semibold">Or Upload Local Photo</label>
                      <div className="flex items-center justify-center w-full relative">
                        <label className={`flex flex-col items-center justify-center w-full h-28 border border-borders/10 border-dashed rounded-sm ${uploadProgress !== null ? 'bg-black/60 cursor-not-allowed' : 'cursor-pointer bg-black/20 hover:bg-black/40'} transition-colors`}>
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            {uploadProgress !== null ? (
                              <>
                                <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mb-2" />
                                <p className="text-[10px] text-accent tracking-wider font-body uppercase">Uploading: {Math.round(uploadProgress)}%</p>
                              </>
                            ) : (
                              <>
                                <Upload className="w-8 h-8 text-text-main/50 mb-2" />
                                <p className="text-[10px] text-text-main/60 tracking-wider font-body uppercase">Drag & Drop or Click to Select Photo/Video</p>
                              </>
                            )}
                          </div>
                          <input
                            type="file"
                            accept="image/*,video/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (file.size > 30 * 1024 * 1024) {
                                  showNotification('File is too large. Max limit is 30 MB.', 'error');
                                  return;
                                }
                                
                                if (file.type.startsWith('image/')) {
                                  setIsOptimizing(true);
                                  setOptimizeProgress(0);
                                  try {
                                    const optimizedBase64 = await optimizeImageFile(file, (progress) => {
                                      setOptimizeProgress(progress);
                                    });
                                    setCropTarget({
                                      src: optimizedBase64,
                                      aspect: 3 / 4,
                                      copyright: editedBio.photoCredit,
                                      copyrightUrl: editedBio.photoCreditLink,
                                      onCrop: (base64, crpt, crptUrl) => {
                                        setEditedBio(prev => ({ 
                                          ...prev, 
                                          bioImage: base64,
                                          ...(crpt !== undefined && { photoCredit: crpt }),
                                          ...(crptUrl !== undefined && { photoCreditLink: crptUrl })
                                        }));
                                        setCropTarget(null);
                                      }
                                    });
                                  } catch (err: any) {
                                    console.error(err);
                                    showNotification('Failed to optimize image', 'error');
                                  } finally {
                                    setIsOptimizing(false);
                                    setOptimizeProgress(null);
                                  }
                                } else if (file.type.startsWith('video/')) {
                                  setIsOptimizing(true);
                                  setOptimizeProgress(20);
                                  try {
                                    const reader = new FileReader();
                                    reader.onprogress = (evt) => {
                                      if (evt.lengthComputable) {
                                        setOptimizeProgress(Math.round((evt.loaded / evt.total) * 100));
                                      }
                                    };
                                    reader.onload = (evt) => {
                                      const base64 = evt.target?.result as string;
                                      setEditedBio(prev => ({ ...prev, bioImage: base64 }));
                                      setIsOptimizing(false);
                                      setOptimizeProgress(null);
                                      showNotification('Video loaded successfully');
                                    };
                                    reader.readAsDataURL(file);
                                  } catch (err) {
                                    console.error(err);
                                    showNotification('Failed to read video file', 'error');
                                    setIsOptimizing(false);
                                    setOptimizeProgress(null);
                                  }
                                } else {
                                  showNotification('Unsupported file type', 'error');
                                }
                              }
                              e.target.value = '';
                            }}
                            className="hidden"
                            disabled={uploadProgress !== null}
                          />
                        </label>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] tracking-wider text-text-main/60 font-body uppercase block font-semibold">Media Live Preview</label>
                      <div className="w-full h-40 bg-black/40 rounded-sm border border-borders/5 overflow-hidden flex items-center justify-center p-2 relative group/preview">
                        {editedBio.bioImage ? (
                          <>
                            {(() => {
                              const media = getMediaSource(editedBio.bioImage);
                              if (media.type === 'video') {
                                return <video src={media.src} className="max-w-full max-h-full object-contain rounded-sm" muted loop autoPlay playsInline />;
                              } else if (media.type === 'youtube') {
                                return <iframe src={`https://www.youtube.com/embed/${media.ytId}?start=${media.start}`} className="max-w-full max-h-full" frameBorder="0" allowFullScreen />;
                              } else if (media.type === 'drive') {
                                return <iframe src={media.src} className="max-w-full max-h-full" frameBorder="0" allowFullScreen />;
                              } else {
                                return <img src={media.src} alt="Preview" className="max-w-full max-h-full object-contain rounded-sm" referrerPolicy="no-referrer" />;
                              }
                            })()}
                            {getMediaSource(editedBio.bioImage).type === 'image' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setCropTarget({
                                    src: editedBio.bioImage!,
                                    aspect: 3 / 4,
                                    copyright: editedBio.photoCredit,
                                    copyrightUrl: editedBio.photoCreditLink,
                                    onCrop: (base64, crpt, crptUrl) => {
                                      setEditedBio(prev => ({ 
                                        ...prev, 
                                        bioImage: base64,
                                        ...(crpt !== undefined && { photoCredit: crpt }),
                                        ...(crptUrl !== undefined && { photoCreditLink: crptUrl })
                                      }));
                                      setCropTarget(null);
                                    }
                                  });
                                }}
                                className="absolute inset-0 m-auto w-36 h-9 bg-black/80 hover:bg-black border border-accent text-accent hover:text-text-main text-[10px] tracking-wider uppercase font-body font-medium rounded flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                <span>Crop & Adjust</span>
                              </button>
                            )}
                          </>
                        ) : (
                          <span className="text-[10px] font-mono text-text-main/50 uppercase tracking-widest">No Media Loaded</span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2">
                      <label className="text-[10px] tracking-wider text-text-main/60 font-body uppercase block font-semibold">Photo Credit / Copyright</label>
                      <input 
                        type="text" 
                        value={editedBio.photoCredit || ''}
                        onChange={(e) => setEditedBio({...editedBio, photoCredit: e.target.value})}
                        className="w-full bg-black/40 border border-borders/10 focus:border-accent rounded-sm px-3 py-2 text-xs text-text-main focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                        placeholder="Photo © Klaudia Hart"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] tracking-wider text-text-main/60 font-body uppercase block font-semibold">Copyright Link (URL)</label>
                      <input 
                        type="url" 
                        value={editedBio.photoCreditLink || ''}
                        onChange={(e) => setEditedBio({...editedBio, photoCreditLink: e.target.value})}
                        className="w-full bg-black/40 border border-borders/10 focus:border-accent rounded-sm px-3 py-2 text-xs text-text-main focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    {(() => {
                      const media = getMediaSource(activeBio.bioImage || "/src/assets/images/hyunkyum_portrait_1783548337837.jpg");
                      if (media.type === 'video') {
                        return (
                          <video 
                            src={media.src} 
                            className="w-full h-auto object-cover aspect-[3/4] filter grayscale-[15%] group-hover:grayscale-0 transition-all duration-[800ms] scale-100 group-hover:scale-[1.02] group-hover:blur-[2px]"
                            muted 
                            loop 
                            autoPlay 
                            playsInline 
                            onContextMenu={(e) => e.preventDefault()}
                          />
                        );
                      } else if (media.type === 'youtube') {
                        return <iframe src={`https://www.youtube.com/embed/${media.ytId}?start=${media.start}`} className="w-full h-auto object-cover aspect-[3/4] filter grayscale-[15%] group-hover:grayscale-0 transition-all duration-[800ms] scale-100 group-hover:scale-[1.02] group-hover:blur-[2px]" frameBorder="0" allowFullScreen />;
                      } else if (media.type === 'drive') {
                        return <iframe src={media.src} className="w-full h-auto object-cover aspect-[3/4] filter grayscale-[15%] group-hover:grayscale-0 transition-all duration-[800ms] scale-100 group-hover:scale-[1.02] group-hover:blur-[2px]" frameBorder="0" allowFullScreen />;
                      }
                      return (
                        <img 
                          src={media.src} 
                          alt="Portrait" 
                          className="w-full h-auto object-cover aspect-[3/4] filter grayscale-[15%] group-hover:grayscale-0 transition-all duration-[800ms] scale-100 group-hover:scale-[1.02] group-hover:blur-[2px]"
                          referrerPolicy="no-referrer"
                          onContextMenu={(e) => e.preventDefault()}
                        />
                      );
                    })()}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none transition-opacity duration-700" />
                    
                    {/* Premium museum/gallery style dark gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/45 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-[700ms] ease-out flex flex-col justify-end p-6 pointer-events-none group-hover:pointer-events-auto">
                      {activeBio.photoCredit && (
                        <div className="text-text-main/90 text-[11px] font-body tracking-[0.2em] uppercase transition-all duration-[700ms] transform translate-y-3 group-hover:translate-y-0 ease-out">
                          {activeBio.photoCreditLink ? (
                            <a 
                              href={activeBio.photoCreditLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-accent transition-colors inline-flex items-center space-x-1.5 cursor-pointer font-medium"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span>{activeBio.photoCredit.startsWith('©') ? activeBio.photoCredit : `© ${activeBio.photoCredit}`}</span>
                            </a>
                          ) : (
                            <span className="font-light">{activeBio.photoCredit.startsWith('©') ? activeBio.photoCredit : `© ${activeBio.photoCredit}`}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </Reveal>
          </div>

          {/* Right: Text & Timeline */}
          <div id="bio-text-col" className="lg:col-span-7 space-y-8">
            <Reveal delay={0.25}>
              <div className="space-y-5 font-body text-sm md:text-base leading-relaxed font-light">
                {isEditMode ? (
                  <div className="space-y-4 border border-borders/20 p-4 rounded bg-neutral-900/50">
                    <div>
                      <label className="text-[10px] text-text-main/50 font-mono">SHORT INTRO ({currentLang})</label>
                      <textarea
                        rows={3}
                        value={editedBio.bioIntro[currentLang]}
                        onChange={(e) => setEditedBio({...editedBio, bioIntro: {...editedBio.bioIntro, [currentLang]: e.target.value}})}
                        className="w-full bg-black border border-neutral-700 p-2 text-sm text-text-main rounded resize-y mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-text-main/50 font-mono">MAIN TEXT ({currentLang})</label>
                      <textarea
                        rows={8}
                        value={editedBio.bioLong[currentLang]}
                        onChange={(e) => setEditedBio({...editedBio, bioLong: {...editedBio.bioLong, [currentLang]: e.target.value}})}
                        className="w-full bg-black border border-neutral-700 p-2 text-sm text-text-main rounded resize-y mt-1"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="bio-highlight font-medium text-base md:text-lg leading-relaxed">
                      {activeBio.bioIntro[currentLang] || t.bioIntro}
                    </p>
                    <p className="whitespace-pre-line">
                      {activeBio.bioLong[currentLang] || t.bioLong}
                    </p>
                  </>
                )}
              </div>
            </Reveal>

            <Reveal delay={0.35}>
              <div id="timeline-tabs-container" className="space-y-0 pt-4">
                <div className="grid grid-cols-2 md:flex md:flex-wrap border-b border-current/10 relative">
                  {timelineTabs.map((tab) => {
                    const isActive = activeTimelineTab === tab.id;
                    const borderClass = 
                      tab.id === 'education' ? 'border-r border-b border-current/5 md:border-0' :
                      tab.id === 'awards' ? 'border-b border-current/5 md:border-0' :
                      tab.id === 'roles' ? 'border-r border-current/5 md:border-0' :
                      'md:border-0';
                    return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTimelineTab(tab.id as any)}
                      className={`relative flex items-center justify-center px-3 py-3.5 md:px-6 md:py-4 text-[10px] sm:text-xs font-body tracking-wider uppercase transition-colors cursor-pointer select-none ${borderClass}`}
                    >
                      <span className={`flex items-center space-x-1.5 md:space-x-2 transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-50 hover:opacity-100'}`} style={{ textShadow: isActive ? '0 0 0.5px currentColor' : 'none' }}>
                        {tab.icon}<span className="truncate">{tab.label}</span>
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

                {isEditMode ? (
                  <div className="bg-neutral-900/30 p-6 min-h-[160px] border border-borders/20 rounded-b mt-[-1px]">
                    {/* Category Title Edit */}
                    <div className="mb-6">
                      <label className="text-[10px] text-text-main/50 font-mono">CATEGORY TITLE ({currentLang})</label>
                      <input 
                        type="text" 
                        value={editedBio.timelineTitles?.[activeTimelineTab]?.[currentLang] || timelineTabs.find(t=>t.id===activeTimelineTab)?.label || ''}
                        onChange={(e) => {
                          const newTitles = { ...(editedBio.timelineTitles || {}) };
                          if (!newTitles[activeTimelineTab]) newTitles[activeTimelineTab] = { EN: '', DE: '', KO: '' };
                          newTitles[activeTimelineTab][currentLang] = e.target.value;
                          setEditedBio({ ...editedBio, timelineTitles: newTitles as any });
                        }}
                        className="w-full bg-black border border-neutral-700 p-2 text-sm text-text-main rounded mt-1"
                      />
                    </div>

                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                      <SortableContext items={(editedBio.timeline?.[activeTimelineTab] || []).map((item) => item.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-4">
                          {(editedBio.timeline?.[activeTimelineTab] || []).map((item: any, idx: number) => {
                            const isRoles = activeTimelineTab === 'roles';
                            const isConcert = activeTimelineTab === 'concert';
                            const isEduOrAwards = activeTimelineTab === 'education' || activeTimelineTab === 'awards';
                            const yearLabel = (isRoles || isConcert) ? 'ROLE' : 'YEAR';
                            const textLabel = isRoles ? `OPERA (${currentLang})` : isConcert ? `ORATORIO (${currentLang})` : `TEXT (${currentLang})`;

                            return (
                              <SortableItem 
                                key={item.id} 
                                id={item.id}
                                className="relative pl-10 bg-black/40 border border-borders/20 p-4 rounded group"
                                handleClassName="absolute left-3 top-1/2 -translate-y-1/2 p-2"
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newTimeline = { ...editedBio.timeline } as any;
                                    newTimeline[activeTimelineTab].splice(idx, 1);
                                    setEditedBio({ ...editedBio, timeline: newTimeline });
                                  }}
                                  className="absolute top-2 right-2 p-1 text-neutral-600 hover:text-red-400 cursor-pointer z-10"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                                
                                <div className="space-y-3 pr-6">
                                  {!isEduOrAwards && (
                                    <div>
                                      <label className="text-[10px] text-text-main/50 font-mono">{yearLabel}</label>
                                      <input
                                        type="text"
                                        value={item.year || ''}
                                        onChange={(e) => {
                                          const newTimeline = { ...editedBio.timeline } as any;
                                          newTimeline[activeTimelineTab][idx].year = e.target.value;
                                          setEditedBio({ ...editedBio, timeline: newTimeline });
                                        }}
                                        className="w-full bg-black border border-neutral-700 p-1.5 text-xs text-text-main rounded mt-1"
                                      />
                                    </div>
                                  )}
                                  <div>
                                    <label className="text-[10px] text-text-main/50 font-mono">{textLabel}</label>
                                    <textarea
                                      rows={2}
                                      value={currentLang === 'KO' ? item.textKO : currentLang === 'DE' ? item.textDE : item.textEN}
                                      onChange={(e) => {
                                        const newTimeline = { ...editedBio.timeline } as any;
                                        const field = currentLang === 'KO' ? 'textKO' : currentLang === 'DE' ? 'textDE' : 'textEN';
                                        newTimeline[activeTimelineTab][idx][field] = e.target.value;
                                        setEditedBio({ ...editedBio, timeline: newTimeline });
                                      }}
                                      className="w-full bg-black border border-neutral-700 p-1.5 text-xs text-text-main rounded mt-1 resize-y"
                                    />
                                  </div>
                                </div>
                              </SortableItem>
                            );
                          })}
                        </div>
                      </SortableContext>
                    </DndContext>

                    <button
                      onClick={() => {
                        const newTimeline = { ...editedBio.timeline } as any;
                        if (!newTimeline[activeTimelineTab]) newTimeline[activeTimelineTab] = [];
                        newTimeline[activeTimelineTab].push({ id: `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, year: '', textEN: '', textDE: '', textKO: '' });
                        setEditedBio({ ...editedBio, timeline: newTimeline });
                      }}
                      className="w-full mt-6 py-3 border border-dashed border-neutral-700 text-text-main/60 hover:text-text-main hover:border-neutral-500 rounded text-xs tracking-wider uppercase transition-colors flex items-center justify-center space-x-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Item</span>
                    </button>
                  </div>
                ) : (
                  <div id="timeline-content-area" className="bio-text bg-current/[0.03] p-6 min-h-[160px]">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeTimelineTab}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.3 }}
                        className="divide-y divide-current/5"
                      >
                        {(activeBio.timeline?.[activeTimelineTab] || []).map((item: any, idx: number) => (
                          <div key={`${activeTimelineTab}-${item.year || idx}-${idx}`} className="flex flex-col sm:flex-row items-start py-3 first:pt-0 last:pb-0 group sm:space-x-4">
                            {item.year ? (
                              <>
                                <div className="font-heading font-medium text-xs sm:text-sm md:text-base tracking-wide w-full sm:w-36 md:w-48 shrink-0 pb-1 sm:pb-0 sm:pt-0.5 text-text-main pr-3 break-words whitespace-normal">
                                  {item.year}
                                </div>
                                <div className="flex-1 bio-text text-xs md:text-sm font-body leading-relaxed pl-0 sm:pl-4 border-l-0 sm:border-l border-current/10 min-h-[20px]">
                                  {currentLang === 'KO' ? item.textKO : currentLang === 'DE' ? item.textDE : item.textEN}
                                </div>
                              </>
                            ) : (
                              <div className="flex-1 bio-text text-xs md:text-sm font-body leading-relaxed min-h-[20px]">
                                {currentLang === 'KO' ? item.textKO : currentLang === 'DE' ? item.textDE : item.textEN}
                              </div>
                            )}
                          </div>
                        ))}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </Reveal>
          </div>
        </div>
      </div>
      {cropTarget && (
        <ImageCropperModal
          imageSrc={cropTarget.src}
          aspect={cropTarget.aspect}
          copyright={(cropTarget.copyright || '').trim().startsWith('©') ? (cropTarget.copyright || '') : `© ${(cropTarget.copyright || '').trim()}`}
          copyrightUrl={cropTarget.copyrightUrl}
          onCropCancel={() => setCropTarget(null)}
          onCropDone={(base64, copyright, copyrightUrl) => cropTarget.onCrop(base64, copyright, copyrightUrl)}
        />
      )}
    </section>
  );
}
