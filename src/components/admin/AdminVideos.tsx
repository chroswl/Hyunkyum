import React, { useState, useEffect } from 'react';
import type { Language, VideoItem } from '../../types';
import { fetchVideos, saveVideoItem } from '../../firebase';
import { Plus, Trash2, Edit, GripVertical, Video as VideoIcon } from 'lucide-react';
import { getMediaSource } from '../../lib/mediaUtils';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableItem } from '../SortableItem';
import AdminLayout from './AdminLayout';
import PropertyAccordion from './PropertyAccordion';
import { PropertyInput, PropertyTextarea } from './PropertyFields';
import { GoogleDrivePicker } from './GoogleDrivePicker';
import VideoPlayer from '../VideoPlayer';
import { translations } from '../../translations';

// Helper to save entire list for ordering (if we want to support it eventually)
import { collection, writeBatch, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAppearance } from '../../contexts/AppearanceContext';

export default function AdminVideos({ 
  currentLang, 
  onRefreshData,
  onClose,
  videoItems: items,
  setVideoItems: setItems
}: { 
  currentLang: Language; 
  onRefreshData?: () => void;
  onClose?: () => void;
  videoItems: VideoItem[];
  setVideoItems: (items: VideoItem[]) => void;
}) {
  const { theme } = useAppearance();
  const [initialItems, setInitialItems] = useState<VideoItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    fetchVideos().then(data => {
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
        batch.delete(doc(db, 'videos', item.id));
      }
    });

    // Items to add/update
    items.forEach((item, index) => {
       const ref = doc(db, 'videos', item.id);
       batch.set(ref, { ...item, order: index });
    });
    await batch.commit();
    setInitialItems(items);
    if (onRefreshData) onRefreshData();
    setIsSaving(false);
  };

  const handleReset = () => {
    setItems(initialItems);
    setEditingId(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex(item => item.id === active.id);
      const newIndex = items.findIndex(item => item.id === over.id);
      setItems(arrayMove(items, oldIndex, newIndex));
    }
  };

  const updateItem = (id: string, updates: Partial<VideoItem>) => {
    setItems(items.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const handleDeleteConfirm = (id: string) => {
    const newItems = items.filter(i => i.id !== id);
    setItems(newItems);
    if (editingId === id) setEditingId(null);
    setDeleteTargetId(null);
  };

  const handleAdd = () => {
    const newItem: VideoItem = {
      id: `new-${Date.now()}`,
      youtubeId: '',
      title: { EN: '', DE: '', KO: '' },
      role: { EN: '', DE: '', KO: '' },
      
      order: items.length
    };
    setItems([...items, newItem]);
    setEditingId(newItem.id);
  };

  const editingItem = items.find(i => i.id === editingId);

  const properties = (
    <div className="pb-20">
      <div className="px-6 py-4 border-b border-neutral-900 flex justify-between items-center">
         <span className="text-xs uppercase tracking-widest" style={{ color: theme?.text || 'inherit' }}>Video Catalog</span>
         <button onClick={handleAdd} className="hover:opacity-70 flex items-center space-x-1 text-[10px] uppercase tracking-widest" style={{ color: theme?.text || 'inherit' }}>
           <Plus className="w-3 h-3" /> <span>Add</span>
         </button>
      </div>
      
      {!editingId ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
            <div className="p-2 space-y-1 custom-scrollbar overflow-y-auto max-h-[500px]">
              {items.map(item => (
                <SortableItem key={item.id} id={item.id} className="relative pl-8 pr-12 bg-black/40 hover:bg-white/5 border border-neutral-900 p-3 rounded group cursor-pointer" handleClassName="absolute left-2 top-1/2 -translate-y-1/2 p-1" style={{ color: theme?.text || 'inherit' }} onClick={() => setEditingId(item.id)}>
                  <div className="text-xs truncate" style={{ color: theme?.text || 'inherit' }}>{item.title?.[currentLang] || item.title?.EN || 'Untitled Video'}</div>
                  <div className="text-[9px] tracking-widest uppercase mt-0.5" style={{ color: theme?.text || 'inherit' }}>{item.role?.[currentLang] || item.role?.EN || 'No Role'}</div>
                  <button onClick={(e) => { e.stopPropagation(); setDeleteTargetId(item.id); }} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:text-rose-500" style={{ color: theme?.text || 'inherit' }}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </SortableItem>
              ))}
              {items.length === 0 && <div className="text-center p-4 text-[color:inherit] text-xs">No videos.</div>}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <>
          <div className="px-6 py-3 border-b border-neutral-900 flex items-center space-x-2 bg-neutral-950">
             <button onClick={() => setEditingId(null)} className="text-xs uppercase tracking-widest" style={{ color: theme?.text || 'inherit' }}>← Back to List</button>
          </div>
          {editingItem && (
            <div>
              <PropertyAccordion title="Media" defaultOpen>
                <div className="flex justify-between items-end gap-2">
                  <PropertyInput label="YouTube ID or Drive Link" value={editingItem.youtubeId || editingItem.videoUrl || ''} onChange={v => updateItem(editingItem.id, { youtubeId: v, videoUrl: v })} />
                  <GoogleDrivePicker onPick={url => updateItem(editingItem.id, { videoUrl: url, youtubeId: url })} />
                </div>
                {(editingItem.youtubeId || editingItem.videoUrl) && (
                  <div className="mt-4 aspect-video bg-black rounded overflow-hidden border border-neutral-800 relative pointer-events-none">
                     <img src={`https://img.youtube.com/vi/${editingItem.youtubeId}/hqdefault.jpg`} className="w-full h-full object-cover" alt="Preview" />
                  </div>
                )}
              </PropertyAccordion>
              <PropertyAccordion title="Details" defaultOpen>
                 <PropertyInput label={`Title (${currentLang})`} value={(currentLang === 'KO' ? editingItem.title?.KO : currentLang === 'DE' ? editingItem.title?.DE : editingItem.title?.EN) || ''} onChange={v => updateItem(editingItem.id, { title: {...(editingItem.title||{EN:'',DE:'',KO:''}), [currentLang]: v} })} />
                 <PropertyInput label={`Role (${currentLang})`} value={(currentLang === 'KO' ? editingItem.role?.KO : currentLang === 'DE' ? editingItem.role?.DE : editingItem.role?.EN) || ''} onChange={v => updateItem(editingItem.id, { role: {...(editingItem.role||{EN:'',DE:'',KO:''}), [currentLang]: v} })} />
              </PropertyAccordion>
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <>
      <AdminLayout 
        title="Video Editor"
        hasChanges={hasChanges}
        isSaving={isSaving}
        onSave={handleSave}
        onReset={handleReset}
      onClose={onClose}
        properties={properties}
      />
      {deleteTargetId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <div className="bg-neutral-950 border border-neutral-900 p-6 rounded max-w-sm w-full space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="space-y-2">
              <h3 className="text-sm font-serif tracking-widest uppercase" style={{ color: theme?.text || 'inherit' }}>Delete Confirmation</h3>
              <p className="text-xs" style={{ color: theme?.text ? `${theme.text}99` : 'inherit' }}>Are you sure you want to delete this item? This action cannot be undone.</p>
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
