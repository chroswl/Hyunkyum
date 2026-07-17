import React, { useState } from 'react';
import type { Language, PressItem } from '../../types';
import { Plus, Trash2, Edit, GripVertical, FileText } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableItem } from '../SortableItem';
import AdminLayout from './AdminLayout';
import PropertyAccordion from './PropertyAccordion';
import { PropertyInput, PropertyTextarea } from './PropertyFields';
import { GoogleDrivePicker } from './GoogleDrivePicker';
import PressSection from '../PressSection';
import { translations } from '../../translations';
import { useAppearance } from '../../contexts/AppearanceContext';
import { useEditing } from '../../contexts/EditingContext';

export default function AdminPress({ 
  currentLang, 
  onRefreshData,
  onClose,
  pressItems: items,
  setPressItems: setItems
}: { 
  currentLang: Language; 
  onRefreshData?: () => void;
  onClose?: () => void;
  pressItems: PressItem[];
  setPressItems: (items: PressItem[]) => void;
}) {
  const { theme } = useAppearance();
  const { status, saveChanges, cancelChanges, isDirty } = useEditing();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const hasChanges = isDirty('pressItems');
  const isSaving = status === 'saving';

  const handleSave = async () => {
    await saveChanges();
    
  };

  const handleReset = () => {
    cancelChanges();
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

  const updateItem = (id: string, updates: Partial<PressItem>) => {
    setItems(items.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const handleDeleteConfirm = (id: string) => {
    const newItems = items.filter(i => i.id !== id);
    setItems(newItems);
    if (editingId === id) setEditingId(null);
    setDeleteTargetId(null);
  };

  const handleAdd = () => {
    const newItem: PressItem = {
      id: `new-${Date.now()}`,
      source: 'New Publication',
      author: '',
      date: '',
      type: 'Review',
      quote: { EN: '', DE: '', KO: '' },
      order: items.length
    };
    setItems([...items, newItem]);
    setEditingId(newItem.id);
  };

  const editingItem = items.find(i => i.id === editingId);

  const properties = (
    <div className="pb-20">
      <div className="px-6 py-4 border-b border-neutral-900 flex justify-between items-center">
         <span className="text-xs uppercase tracking-widest text-neutral-500">Press Clippings</span>
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
                  <div className="text-xs text-neutral-300 truncate">{item.source || 'Untitled'}</div>
                  <div className="text-[9px] text-[#C9A227] tracking-widest uppercase mt-0.5 truncate">{item.quote?.[currentLang] || item.quote?.EN || 'No quote'}</div>
                  <button onClick={(e) => { e.stopPropagation(); setDeleteTargetId(item.id); }} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-neutral-600 hover:text-rose-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </SortableItem>
              ))}
              {items.length === 0 && <div className="text-center p-4 text-neutral-500 text-xs">No press items.</div>}
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
              <PropertyAccordion title="Details" defaultOpen>
                 <PropertyInput label="Publication / Source" value={editingItem.source || ''} onChange={v => updateItem(editingItem.id, { source: v })} />
                 <PropertyInput label="Author / Critic" value={editingItem.author || ''} onChange={v => updateItem(editingItem.id, { author: v })} />
                 <PropertyInput label="Date (e.g. Oct 2026)" value={editingItem.date || ''} onChange={v => updateItem(editingItem.id, { date: v })} />
                 <div className="flex justify-between items-end gap-2">
                    <PropertyInput label="Article Link or Google Drive link (Optional)" value={editingItem.link || ''} onChange={v => updateItem(editingItem.id, { link: v })} type="url" />
                    <GoogleDrivePicker onPick={url => updateItem(editingItem.id, { link: url })} />
                 </div>
              </PropertyAccordion>
              <PropertyAccordion title="Quote" defaultOpen>
                 <PropertyTextarea label={`Quote Text (${currentLang})`} value={(currentLang === 'KO' ? editingItem.quote?.KO : currentLang === 'DE' ? editingItem.quote?.DE : editingItem.quote?.EN) || ''} onChange={v => updateItem(editingItem.id, { quote: {...(editingItem.quote||{EN:'',DE:'',KO:''}), [currentLang]: v} })} rows={8} />
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
        title="Press Editor"
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
