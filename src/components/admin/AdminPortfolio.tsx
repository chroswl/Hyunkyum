import React, { useState, useEffect } from 'react';
import type { Language, PortfolioItem } from '../../types';
import { translations } from '../../translations';
import { fetchPortfolio } from '../../firebase';
import { writeBatch, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Plus, Trash2, Edit, GripVertical, Image as ImageIcon } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableItem } from '../SortableItem';
import AdminLayout from './AdminLayout';
import PropertyAccordion from './PropertyAccordion';
import { PropertyInput, PropertySelect } from './PropertyFields';
import PortfolioGallery from '../PortfolioGallery';
import ImageCropperModal from '../ImageCropperModal';
import { getMediaSource } from '../../lib/mediaUtils';

export default function AdminPortfolio({ currentLang }: { currentLang: Language }) {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [initialItems, setInitialItems] = useState<PortfolioItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [cropTarget, setCropTarget] = useState<{ id: string, src: string } | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    fetchPortfolio().then(data => {
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
        batch.delete(doc(db, 'portfolio', item.id));
      }
    });

    // Items to add/update
    items.forEach((item, index) => {
       const ref = doc(db, 'portfolio', item.id);
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

  const updateItem = (id: string, updates: Partial<PortfolioItem>) => {
    setItems(items.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const handleDeleteConfirm = (id: string) => {
    const newItems = items.filter(i => i.id !== id);
    setItems(newItems);
    if (editingId === id) setEditingId(null);
    setDeleteTargetId(null);
  };

  const handleAdd = () => {
    const newItem: PortfolioItem = {
      id: `new-${Date.now()}`,
      url: '',
      title: { EN: '', DE: '', KO: '' },
      category: 'Portrait'
    };
    setItems([newItem, ...items]);
    setEditingId(newItem.id);
  };

  const editingItem = items.find(i => i.id === editingId);

  const properties = (
    <div className="pb-20">
      <div className="px-6 py-4 border-b border-neutral-900 flex justify-between items-center">
         <span className="text-xs uppercase tracking-widest text-neutral-500">Gallery Items</span>
         <button onClick={handleAdd} className="text-[#C9A227] hover:text-[#ebd04e] flex items-center space-x-1 text-[10px] uppercase tracking-widest">
           <Plus className="w-3 h-3" /> <span>Add</span>
         </button>
      </div>
      
      {!editingId ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
            <div className="p-2 space-y-1 custom-scrollbar overflow-y-auto max-h-[400px]">
              {items.map(item => (
                <SortableItem key={item.id} id={item.id} className="relative pl-8 pr-12 bg-black/40 hover:bg-white/5 border border-neutral-900 p-3 rounded group cursor-pointer" handleClassName="absolute left-2 top-1/2 -translate-y-1/2 p-1 text-neutral-600 hover:text-white" onClick={() => setEditingId(item.id)}>
                  <div className="text-xs text-neutral-300 truncate">{item.title?.[currentLang] || item.title?.EN || 'Untitled Image'}</div>
                  <div className="text-[9px] text-[#C9A227] tracking-widest uppercase mt-0.5">{item.category}</div>
                  <button onClick={(e) => { e.stopPropagation(); setDeleteTargetId(item.id); }} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-neutral-600 hover:text-rose-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </SortableItem>
              ))}
              {items.length === 0 && <div className="text-center p-4 text-neutral-500 text-xs">No gallery items.</div>}
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
              <PropertyAccordion title="Image Asset" defaultOpen>
                <div className="space-y-4">
                   {editingItem.url ? (
                     <div className="relative border border-neutral-800 rounded bg-black aspect-[3/4] overflow-hidden">
                        {(() => {
                          const media = getMediaSource(editingItem.url);
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
                     <div className="aspect-[3/4] bg-neutral-900 border border-neutral-800 rounded flex items-center justify-center">
                        <span className="text-xs text-neutral-500">No Image</span>
                     </div>
                   )}
                   <div className="relative bg-neutral-900 border border-neutral-800 hover:border-[#C9A227] transition-colors rounded p-4 text-center cursor-pointer">
                      <span className="text-xs text-neutral-400">Upload Image</span>
                      <input type="file" accept="image/*" onChange={(e) => {
                         if (e.target.files && e.target.files[0]) {
                           setCropTarget({ id: editingItem.id, src: URL.createObjectURL(e.target.files[0]) });
                         }
                         e.target.value = '';
                      }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                   </div>
                </div>
              </PropertyAccordion>
              <PropertyAccordion title="Details" defaultOpen>
                 <PropertySelect label="Category" value={editingItem.category} options={[{label: 'Portrait', value: 'Portrait'}, {label: 'Stage', value: 'Stage'}, {label: 'Backstage', value: 'Backstage'}]} onChange={v => updateItem(editingItem.id, { category: v as any })} />
                 <PropertyInput label={`Title (${currentLang})`} value={(currentLang === 'KO' ? editingItem.title?.KO : currentLang === 'DE' ? editingItem.title?.DE : editingItem.title?.EN) || ''} onChange={v => updateItem(editingItem.id, { title: {...(editingItem.title||{EN:'',DE:'',KO:''}), [currentLang]: v} })} />
                 <PropertyInput label="Copyright Name" value={editingItem.copyright || ''} onChange={v => updateItem(editingItem.id, { copyright: v })} />
                 <PropertyInput label="Copyright URL" value={editingItem.copyrightUrl || ''} onChange={v => updateItem(editingItem.id, { copyrightUrl: v })} />
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
        title="Gallery Editor"
        hasChanges={hasChanges}
        isSaving={isSaving}
        onSave={handleSave}
        onReset={handleReset}
        preview={
          <div className="w-full h-full overflow-y-auto bg-black custom-scrollbar">
            <PortfolioGallery 
              items={items} 
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
          aspect={3/4}
          onCropDone={(base64, copyright, copyrightUrl) => {
            updateItem(cropTarget.id, { url: base64, copyright, copyrightUrl });
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
