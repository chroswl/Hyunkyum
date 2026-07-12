import React, { useState, useEffect } from 'react';
import type { Language, PressItem } from '../../types';
import { fetchPress, savePressItem, deletePressItem } from '../../firebase';
import { Plus, Trash2, Edit, GripVertical, FileText } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableItem } from '../SortableItem';
import AdminLayout from './AdminLayout';
import PropertyAccordion from './PropertyAccordion';
import { PropertyInput, PropertyTextarea } from './PropertyFields';
import PressSection from '../PressSection';
import { translations } from '../../translations';
import { writeBatch, doc } from 'firebase/firestore';
import { db } from '../../firebase';

export default function AdminPress({ currentLang }: { currentLang: Language }) {
  const [items, setItems] = useState<PressItem[]>([]);
  const [initialItems, setInitialItems] = useState<PressItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    fetchPress().then(data => {
      setItems(data);
      setInitialItems(data);
    });
  }, []);

  const hasChanges = JSON.stringify(items) !== JSON.stringify(initialItems);

  const handleSave = async () => {
    setIsSaving(true);
    const batch = writeBatch(db);
    items.forEach((item, index) => {
       const ref = doc(db, 'press', item.id);
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

  const updateItem = (id: string, updates: Partial<PressItem>) => {
    setItems(items.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this press item?')) {
      await deletePressItem(id);
      const newItems = items.filter(i => i.id !== id);
      setItems(newItems);
      setInitialItems(newItems);
      if (editingId === id) setEditingId(null);
    }
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
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-neutral-600 hover:text-rose-500">
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
                 <PropertyInput label="Article Link (Optional)" value={editingItem.link || ''} onChange={v => updateItem(editingItem.id, { link: v })} type="url" />
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
    <AdminLayout 
      title="Press Editor"
      hasChanges={hasChanges}
      isSaving={isSaving}
      onSave={handleSave}
      onReset={handleReset}
      preview={
        <div className="w-full h-full overflow-y-auto bg-black custom-scrollbar">
          <PressSection 
            items={items} 
            currentLang={currentLang} 
            setLang={() => {}} 
            t={translations[currentLang]} 
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
  );
}
