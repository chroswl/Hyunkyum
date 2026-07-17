import React, { useState } from 'react';
import type { Language, PerformanceSlide, ThemeSettings } from '../../types';
import { Plus, Trash2, Edit, GripVertical, Image as ImageIcon, Upload } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableItem } from '../SortableItem';
import AdminLayout from './AdminLayout';
import PropertyAccordion from './PropertyAccordion';
import { PropertyInput, PropertySelect, PropertySlider } from './PropertyFields';
import { GoogleDrivePicker } from './GoogleDrivePicker';
import SelectedPerformances from '../SelectedPerformances';
import { MediaEngine, useMediaUpload } from '../../lib/editing/mediaEngine';
import { MediaCropWrapper, MediaPreview } from './media';
import { useEditing } from '../../contexts/EditingContext';

export default function AdminSlides({ 
  currentLang, 
  theme,
  setTheme,
  onRefreshData,
  onClose,
  slides: items,
  setSlides: setItems
}: { 
  currentLang: Language; 
  theme: ThemeSettings | null;
  setTheme: (t: ThemeSettings) => void;
  onRefreshData?: () => void;
  onClose?: () => void;
  slides: PerformanceSlide[];
  setSlides: (s: PerformanceSlide[]) => void;
}) {
  const { status, saveChanges, cancelChanges, isDirty } = useEditing();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [cropTarget, setCropTarget] = useState<{
    src: string;
    aspect?: number;
    copyright?: string;
    copyrightUrl?: string;
    onCrop: (base64: string, copyright?: string, copyrightUrl?: string) => void;
    onCancel: () => void;
  } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const { progress, isUploading, uploadMedia } = useMediaUpload({
    folder: 'hero_slides',
    maxSizeMB: 30
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const hasChanges = isDirty('slides') || isDirty('theme');
  const isSaving = status === 'saving';

  const handleSave = async () => {
    await saveChanges();
    
  };

  const handleReset = () => {
    cancelChanges();
    setEditingId(null);
  };

  const updateTheme = (next: ThemeSettings) => {
    setTheme(next);
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: next }));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex(item => item.id === active.id);
      const newIndex = items.findIndex(item => item.id === over.id);
      setItems(arrayMove(items, oldIndex, newIndex));
    }
  };

  const updateItem = (id: string, updates: Partial<PerformanceSlide>) => {
    setItems(items.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const handleFile = async (id: string, file: File) => {
    if (file.type.startsWith('image/')) {
      try {
        const optimizedBase64 = await MediaEngine.optimize(file);
        setCropTarget({
          src: optimizedBase64,
          aspect: 16/9,
          onCrop: async (base64) => {
            setCropTarget(null);
            try {
              const url = await MediaEngine.upload(base64, 'hero_slides');
              updateItem(id, { image: url, mediaType: 'image' });
            } catch (err) {
              console.error("Upload failed after crop:", err);
              updateItem(id, { image: base64, mediaType: 'image' });
            }
          },
          onCancel: () => setCropTarget(null)
        });
        updateItem(id, { mediaType: 'image' });
      } catch (err) {
        console.error("Failed to process image:", err);
        alert("Failed to process image.");
      }
    } else if (file.type.startsWith('video/')) {
      try {
        const url = await uploadMedia(file);
        updateItem(id, { image: url, mediaType: 'video' });
      } catch (err) {
        console.error("Failed to upload video:", err);
        alert("Failed to upload video: " + (err as Error).message);
      }
    } else {
      alert("Please select a valid image or video file.");
    }
  };

  const handleDeleteConfirm = (id: string) => {
    const newItems = items.filter(i => i.id !== id);
    setItems(newItems);
    if (editingId === id) setEditingId(null);
    setDeleteTargetId(null);
  };

  const handleAdd = () => {
    const newItem: PerformanceSlide = {
      id: `new-${Date.now()}`,
      production: { EN: '', DE: '', KO: '' },
      role: { EN: '', DE: '', KO: '' },
      house: { EN: '', DE: '', KO: '' },
      image: '',
      mediaType: 'image',
      order: items.length
    };
    setItems([...items, newItem]);
    setEditingId(newItem.id);
  };

  const editingItem = items.find(i => i.id === editingId);

  const properties = (
    <div className="pb-20">
      <div className="px-6 py-4 border-b border-neutral-900 flex justify-between items-center">
         <span className="text-xs uppercase tracking-widest text-neutral-500">Slides</span>
         <button onClick={handleAdd} className="text-[#C9A227] hover:text-[#ebd04e] flex items-center space-x-1 text-[10px] uppercase tracking-widest">
           <Plus className="w-3 h-3" /> <span>Add</span>
         </button>
      </div>
      
      <PropertyAccordion title="Section Settings" defaultOpen={true}>
         <PropertySlider label="Title Size" value={theme?.perfTitleSize ?? 24} min={12} max={64} onChange={(v) => {
            updateTheme({ ...theme!, perfTitleSize: v });
         }} />
         <PropertySlider label="Text Size" value={theme?.perfTextSize ?? 16} min={8} max={32} onChange={(v) => {
            updateTheme({ ...theme!, perfTextSize: v });
         }} />
         <PropertySlider label="House Text Size" value={theme?.perfHouseSize ?? 12} min={8} max={32} onChange={(v) => {
            updateTheme({ ...theme!, perfHouseSize: v });
         }} />
         <PropertySlider label="Section Title Size" value={theme?.perfSectionTitleSize ?? 10} min={8} max={32} onChange={(v) => {
            updateTheme({ ...theme!, perfSectionTitleSize: v });
         }} />
         <PropertyInput label="Section Title" value={theme?.perfSectionTitle || 'Selected Performances'} onChange={(v) => {
            updateTheme({ ...theme!, perfSectionTitle: v });
         }} />
         <button className="text-[10px] uppercase text-[#C9A227] tracking-widest font-semibold hover:underline mt-2" onClick={() => {
             const base = (theme?.websiteTextSize || 100) / 100;
             updateTheme({ 
               ...theme!, 
               perfTitleSize: Math.round(24 * base),
               perfTextSize: Math.round(16 * base),
               perfHouseSize: Math.round(12 * base),
               perfSectionTitleSize: Math.round(10 * base)
             });
         }}>Sync to Website Text Size</button>
      </PropertyAccordion>

      {!editingId ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
            <div className="p-2 space-y-1 custom-scrollbar overflow-y-auto max-h-[500px]">
              {items.map(item => (
                <SortableItem key={item.id} id={item.id} className="relative pl-8 pr-12 bg-black/40 hover:bg-white/5 border border-neutral-900 p-3 rounded group cursor-pointer" handleClassName="absolute left-2 top-1/2 -translate-y-1/2 p-1 text-neutral-600 hover:text-white" onClick={() => setEditingId(item.id)}>
                  <div className="text-xs text-neutral-300 truncate">{item.production?.[currentLang] || item.production?.EN || 'Untitled'}</div>
                  <div className="text-[9px] text-[#C9A227] tracking-widest uppercase mt-0.5 truncate">{item.house?.[currentLang] || item.house?.EN || 'No house'}</div>
                  <button onClick={(e) => { e.stopPropagation(); setDeleteTargetId(item.id); }} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-neutral-600 hover:text-rose-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </SortableItem>
              ))}
              {items.length === 0 && <div className="text-center p-4 text-neutral-500 text-xs">No slides.</div>}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <>
          <div className="px-6 py-3 border-b border-neutral-900 flex items-center space-x-2 bg-neutral-950">
             <button onClick={() => setEditingId(null)} className="text-xs text-neutral-500 hover:text-white uppercase tracking-widest">← Back to List</button>
          </div>
          {editingItem && (
            <>
              <PropertyAccordion title="Background Media Settings" defaultOpen>
                <div className="space-y-4">
                   <PropertySelect 
                     label="Media Type" 
                     value={editingItem.mediaType || 'image'} 
                     options={[
                       { label: 'Image', value: 'image' },
                       { label: 'Video', value: 'video' },
                       { label: 'YouTube', value: 'youtube' }
                     ]} 
                     onChange={(v) => updateItem(editingItem.id, { mediaType: v as any })} 
                   />
                   
                   <PropertyInput 
                     label="Media URL / YouTube Video ID" 
                     value={editingItem.image || ''} 
                     onChange={(v) => updateItem(editingItem.id, { image: v })} 
                   />
                   <GoogleDrivePicker onPick={url => updateItem(editingItem.id, { image: url })} />

                   {editingItem.image ? (
                      <MediaPreview 
                        url={editingItem.image}
                        explicitType={editingItem.mediaType as any}
                        className="relative border border-neutral-800 rounded bg-black aspect-[16/9] overflow-hidden"
                      />
                    ) : (
                     <div className="aspect-[16/9] bg-neutral-900 border border-neutral-800 rounded flex items-center justify-center">
                        <span className="text-xs text-neutral-500">No Media Loaded</span>
                     </div>
                   )}

                   <div className="space-y-2 mt-2">
                     <label className="text-[10px] uppercase text-[#C9A227] tracking-widest font-semibold block">Drag & Drop Upload (Photo/Video)</label>
                     <div 
                       className={`relative border-2 border-dashed rounded p-5 text-center transition-all ${
                         isDragOver 
                           ? 'border-[#C9A227] bg-[#C9A227]/5' 
                           : 'border-neutral-800 bg-neutral-900/40 hover:border-neutral-700'
                       }`}
                       onDragOver={(e) => {
                         e.preventDefault();
                         setIsDragOver(true);
                       }}
                       onDragLeave={() => setIsDragOver(false)}
                       onDrop={(e) => {
                         e.preventDefault();
                         setIsDragOver(false);
                         if (e.dataTransfer.files?.[0]) {
                           handleFile(editingItem.id, e.dataTransfer.files[0]);
                         }
                       }}
                     >
                       {isUploading ? (
                          <div className="flex flex-col items-center justify-center space-y-2 py-4">
                            <div className="w-6 h-6 border-2 border-[#C9A227] border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs text-neutral-400 font-mono">
                              {progress.status === 'optimizing' ? 'Optimizing' : 'Uploading'}: {progress.percentage}%
                            </span>
                          </div>
                        ) : (
                         <label className="cursor-pointer flex flex-col items-center justify-center space-y-1 py-1 w-full h-full">
                           <Upload className="w-5 h-5 text-neutral-500 mb-1" />
                           <span className="text-[11px] text-neutral-300 font-sans font-medium">
                             Drag & Drop file here or <span className="text-[#C9A227] hover:underline">Browse</span>
                           </span>
                           <span className="text-[9px] text-neutral-500 font-sans">
                             Images and Videos up to 30MB • Drive Links Compatible
                           </span>
                           <input 
                             type="file" 
                             accept="image/*,video/*" 
                             className="hidden" 
                             onChange={(e) => {
                               if (e.target.files?.[0]) {
                                 handleFile(editingItem.id, e.target.files[0]);
                               }
                             }} 
                           />
                         </label>
                       )}
                     </div>
                   </div>
                   
                   <PropertyInput 
                     label="Copyright Credit" 
                     value={editingItem.copyright || ''} 
                     onChange={(v) => updateItem(editingItem.id, { copyright: v })} 
                   />
                   <PropertyInput 
                     label="Copyright Link" 
                     value={editingItem.copyrightUrl || ''} 
                     onChange={(v) => updateItem(editingItem.id, { copyrightUrl: v })} 
                   />
                </div>
              </PropertyAccordion>
              <PropertyAccordion title="Slide Text" defaultOpen>
                 <PropertyInput label={`Production (${currentLang})`} value={(currentLang === 'KO' ? editingItem.production?.KO : currentLang === 'DE' ? editingItem.production?.DE : editingItem.production?.EN) || ''} onChange={v => updateItem(editingItem.id, { production: {...(editingItem.production||{EN:'',DE:'',KO:''}), [currentLang]: v} })} />
                 <PropertyInput label={`Role (${currentLang})`} value={(currentLang === 'KO' ? editingItem.role?.KO : currentLang === 'DE' ? editingItem.role?.DE : editingItem.role?.EN) || ''} onChange={v => updateItem(editingItem.id, { role: {...(editingItem.role||{EN:'',DE:'',KO:''}), [currentLang]: v} })} />
                 <PropertyInput label={`House (${currentLang})`} value={(currentLang === 'KO' ? editingItem.house?.KO : currentLang === 'DE' ? editingItem.house?.DE : editingItem.house?.EN) || ''} onChange={v => updateItem(editingItem.id, { house: {...(editingItem.house||{EN:'',DE:'',KO:''}), [currentLang]: v} })} />
              </PropertyAccordion>
            </>
          )}
        </>
      )}
    </div>
  );

  return (
    <>
      <AdminLayout 
        title="Hero Slides Editor"
        hasChanges={hasChanges}
        isSaving={isSaving}
        onSave={handleSave}
        onReset={handleReset}
      onClose={onClose}
        properties={properties}
      />
      <MediaCropWrapper target={cropTarget} />
      {deleteTargetId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <div className="bg-neutral-950 border border-neutral-900 p-6 rounded max-w-sm w-full space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="space-y-2">
              <h3 className="text-sm font-serif text-white tracking-widest uppercase">Delete Confirmation</h3>
              <p className="text-xs text-neutral-400">Are you sure you want to delete this item? This action cannot be undone.</p>
            </div>
            <div className="flex space-x-3">
              <button 
                onClick={() => setDeleteTargetId(null)} 
                className="flex-1 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded text-xs uppercase tracking-wider transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  const id = deleteTargetId;
                  setDeleteTargetId(null);
                  await handleDeleteConfirm(id);
                }} 
                className="flex-1 py-2 bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-200 rounded text-xs uppercase tracking-wider transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
