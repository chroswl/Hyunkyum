import React, { useState, useEffect } from 'react';
import type { Language, PerformanceSlide } from '../../types';
import { fetchSelectedPerformances, saveSelectedPerformance } from '../../firebase';
import { Plus, Trash2, Edit, GripVertical, Image as ImageIcon, Upload } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableItem } from '../SortableItem';
import AdminLayout from './AdminLayout';
import PropertyAccordion from './PropertyAccordion';
import { PropertyInput, PropertySelect } from './PropertyFields';
import SelectedPerformances from '../SelectedPerformances';
import ImageCropperModal from '../ImageCropperModal';
import { writeBatch, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { optimizeImageFile } from '../../lib/imageCompressor';
import { getMediaSource } from '../../lib/mediaUtils';

export default function AdminSlides({ currentLang }: { currentLang: Language }) {
  const [items, setItems] = useState<PerformanceSlide[]>([]);
  const [initialItems, setInitialItems] = useState<PerformanceSlide[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [cropTarget, setCropTarget] = useState<{ id: string, src: string } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    fetchSelectedPerformances().then(data => {
      setItems(data);
      setInitialItems(data);
    });
  }, []);

  const hasChanges = JSON.stringify(items) !== JSON.stringify(initialItems);

  const handleSave = async () => {
    setIsSaving(true);
    const batch = writeBatch(db);
    
    // Items to delete
    initialItems.forEach(item => {
      if (!items.find(i => i.id === item.id)) {
        batch.delete(doc(db, 'selectedPerformances', item.id));
      }
    });

    // Items to add/update
    items.forEach((item, index) => {
       const ref = doc(db, 'selectedPerformances', item.id);
       batch.set(ref, { ...item, order: index });
    });
    await batch.commit();
    setInitialItems(items);
    setIsSaving(false);
  };

  const handleReset = () => {
    setItems(initialItems);
    setEditingId(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setItems(items => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const updateItem = (id: string, updates: Partial<PerformanceSlide>) => {
    setItems(items.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const handleFile = async (id: string, file: File) => {
    if (file.size > 30 * 1024 * 1024) {
      alert("File is too large. Maximum size is 30MB.");
      return;
    }
    
    if (file.type.startsWith('image/')) {
      setIsOptimizing(true);
      setUploadProgress(0);
      try {
        const optimizedBase64 = await optimizeImageFile(file, (p) => {
          setUploadProgress(p);
        });
        setCropTarget({ id, src: optimizedBase64 });
        updateItem(id, { mediaType: 'image' });
      } catch (err) {
        console.error("Failed to optimize image:", err);
      } finally {
        setIsOptimizing(false);
        setUploadProgress(null);
      }
    } else if (file.type.startsWith('video/')) {
      setIsOptimizing(true);
      setUploadProgress(10);
      try {
        const reader = new FileReader();
        reader.onprogress = (e) => {
          if (e.lengthComputable) {
            setUploadProgress(Math.round((e.loaded / e.total) * 100));
          }
        };
        reader.onload = (e) => {
          const base64 = e.target?.result as string;
          updateItem(id, { image: base64, mediaType: 'video' });
          setIsOptimizing(false);
          setUploadProgress(null);
        };
        reader.readAsDataURL(file);
      } catch (err) {
        console.error("Failed to read video:", err);
        setIsOptimizing(false);
        setUploadProgress(null);
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

                   {editingItem.image ? (
                     <div className="relative border border-neutral-800 rounded bg-black aspect-[16/9] overflow-hidden">
                        {(() => {
                          const media = getMediaSource(editingItem.image, editingItem.mediaType as any);
                          if (media.type === 'video') {
                            return <video src={media.src} className="w-full h-full object-cover" muted loop autoPlay playsInline />;
                          } else if (media.type === 'youtube') {
                            return <iframe src={`https://www.youtube.com/embed/${media.ytId}?start=${media.start}`} className="w-full h-full" frameBorder="0" allowFullScreen />;
                          } else if (media.type === 'drive') {
                            return <iframe src={media.src} className="w-full h-full" frameBorder="0" allowFullScreen />;
                          } else {
                            return <img src={media.src} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />;
                          }
                        })()}
                     </div>
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
                       {uploadProgress !== null ? (
                         <div className="flex flex-col items-center justify-center space-y-2 py-4">
                           <div className="w-6 h-6 border-2 border-[#C9A227] border-t-transparent rounded-full animate-spin" />
                           <span className="text-xs text-neutral-400 font-mono">Processing: {uploadProgress}%</span>
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
        preview={
          <div className="w-full h-full overflow-y-auto bg-black custom-scrollbar">
            <SelectedPerformances 
              slides={items} 
              currentLang={currentLang} 
              setLang={() => {}} 
              user={null}
              activeEditSection="none"
              setActiveEditSection={() => {}}
              onItemsUpdated={() => {}}
              onRefreshData={() => {}}
            />
          </div>
        }
        properties={properties}
      />
      {cropTarget && (
        <ImageCropperModal
          imageSrc={cropTarget.src}
          aspect={16/9}
          onCropDone={(base64) => {
            updateItem(cropTarget.id, { image: base64 });
            setCropTarget(null);
          }}
          onCropCancel={() => setCropTarget(null)}
        />
      )}
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
