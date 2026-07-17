import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Trophy, Compass, Save, X, Plus, Trash2, GripVertical, Upload } from 'lucide-react';
import { BiographySettings, TimelineData, TimelineItem, Language } from '../../types';
import { FloatingEditor } from './FloatingEditor';
import { MediaEngine } from '../../lib/editing/mediaEngine';
import { MediaCropWrapper, MediaPreview } from './media';
import { GoogleDrivePicker } from './GoogleDrivePicker';
import { saveBiographySettings } from '../../firebase';

interface BiographyEditorPanelProps {
  isOpen: boolean;
  onClose: () => void;
  bio: BiographySettings;
  currentLang: Language;
  setLang: (lang: Language) => void;
  onBioUpdated: (newBio: BiographySettings) => void;
}

export function BiographyEditorPanel({ isOpen, onClose, bio: initialBio, currentLang, setLang, onBioUpdated }: BiographyEditorPanelProps) {
  const [editedBio, setEditedBio] = useState<BiographySettings>(initialBio);
  
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizeProgress, setOptimizeProgress] = useState<number | null>(null);
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [cropTarget, setCropTarget] = useState<{ src: string, aspect?: number, onCrop: (base64: string, copyright?: string, copyrightUrl?: string) => void, copyright?: string, copyrightUrl?: string } | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setEditedBio(JSON.parse(JSON.stringify(initialBio)));
    }
  }, [isOpen, initialBio]);

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setUploadProgress(0);
    try {
      let finalBio = { ...editedBio };
      if (editedBio.bioImage && editedBio.bioImage.startsWith('data:image')) {
        const downloadUrl = await MediaEngine.upload(editedBio.bioImage, 'admin', (progress) => {
          setUploadProgress(progress);
        });
        finalBio.bioImage = downloadUrl;
        setEditedBio(finalBio);
      }
      await saveBiographySettings(finalBio);
      onBioUpdated(finalBio);
      showNotification('Biography saved successfully!');
    } catch (err) {
      console.error(err);
      showNotification('Failed to save', 'error');
    } finally {
      setIsSaving(false);
      setUploadProgress(null);
    }
  };

  return (
    <FloatingEditor isOpen={isOpen} onClose={onClose} title="Biography Editor">
      {/* Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`mb-6 p-3 rounded text-[10px] tracking-widest uppercase font-sans font-medium text-center ${
              notification.type === 'success' ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30' : 'bg-rose-950/80 text-rose-400 border border-rose-500/30'
            }`}
          >
            {notification.text}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center space-x-2 mb-6">
        <button 
          onClick={handleSave} 
          disabled={isSaving}
          className="flex-1 py-2 rounded-sm text-xs font-semibold uppercase tracking-widest transition-colors bg-[#C9A227] text-black hover:bg-[#ebd04e] shadow-[0_0_15px_rgba(201,162,39,0.3)]"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="space-y-8">
        
        {/* Photo Upload Section */}
        <div className="bg-white/[0.02] border border-white/5 p-4 rounded-sm space-y-4">
          <h3 className="text-[10px] font-sans tracking-widest uppercase text-[#C9A227]">Biography Photo</h3>
          <div className="space-y-1.5">
            <label className="text-[10px] tracking-wider text-neutral-400 font-sans uppercase block font-semibold">Image Source URL</label>
            <input 
              type="url" 
              value={editedBio.bioImage || ''}
              onChange={(e) => setEditedBio({...editedBio, bioImage: e.target.value})}
              className="w-full bg-[var(--color-bg)] border border-white/10 focus:border-[#C9A227] rounded-sm px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#C9A227]"
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-[10px] tracking-wider text-neutral-400 font-sans uppercase block font-semibold">Upload Local Photo</label>
            <label className="flex flex-col items-center justify-center w-full h-28 border border-white/10 border-dashed rounded-sm cursor-pointer bg-[var(--color-bg)]/20 hover:bg-[var(--color-bg)]/40 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-6 h-6 text-neutral-500 mb-2" />
                <div className="text-[10px] text-neutral-400 tracking-wider font-sans uppercase">Click to Select Photo</div>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setIsOptimizing(true);
                    setOptimizeProgress(0);
                    try {
                      const optimizedBase64 = await MediaEngine.optimize(file, (progress) => setOptimizeProgress(progress));
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
                    } catch (err) {
                      showNotification('Failed to optimize image', 'error');
                    } finally {
                      setIsOptimizing(false);
                      setOptimizeProgress(null);
                    }
                  }
                  e.target.value = '';
                }}
                className="hidden"
                disabled={isOptimizing}
              />
            </label>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] tracking-wider text-[color:inherit] font-sans uppercase block font-semibold">Media Live Preview</label>
            <div className="w-full h-40 relative group/preview">
              <MediaPreview 
                url={editedBio.bioImage}
                className="w-full h-full bg-[var(--color-bg)]/40 rounded-sm border border-[var(--color-text)]"
                imageClassName="object-contain"
              />
              {editedBio.bioImage && (
                <button
                  type="button"
                  onClick={() => setEditedBio({...editedBio, bioImage: ''})}
                  className="absolute top-2 right-2 bg-black/60 p-1.5 rounded text-white/50 hover:text-white transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {cropTarget && (
          <MediaCropWrapper
            target={{
              src: cropTarget.src,
              aspect: cropTarget.aspect,
              copyright: cropTarget.copyright,
              copyrightUrl: cropTarget.copyrightUrl,
              onCrop: (base64, crpt, crptUrl) => cropTarget.onCrop(base64, crpt, crptUrl),
              onCancel: () => setCropTarget(null)
            }}
          />
        )}
      </AnimatePresence>
    </FloatingEditor>
  );
}
