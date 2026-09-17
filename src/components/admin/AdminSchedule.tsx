import React, { useState } from 'react';
import type { Language, ScheduleItem, Production, Performance } from '../../types';
import { translations } from '../../translations';
import { Plus, Trash2, Edit, GripVertical, Calendar, Sparkles, Clock, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableItem } from '../SortableItem';
import AdminLayout from './AdminLayout';
import PropertyAccordion from './PropertyAccordion';
import { PropertyInput, PropertySelect } from './PropertyFields';
import { GoogleDrivePicker } from './GoogleDrivePicker';
import { useAppearance } from '../../contexts/AppearanceContext';
import { useEditing } from '../../contexts/EditingContext';
import SmartImportModal from './SmartImportModal';
import { normalizeProduction, createEmptyProduction } from '../../lib/scheduleUtils';

export default function AdminSchedule({ 
  currentLang, 
  onRefreshData,
  onClose,
  scheduleItems: rawItems,
  setScheduleItems: setItems
}: { 
  currentLang: Language; 
  onRefreshData?: () => void;
  onClose?: () => void;
  scheduleItems: ScheduleItem[];
  setScheduleItems: (items: ScheduleItem[]) => void;
}) {
  const { theme } = useAppearance();
  const { status, saveChanges, cancelChanges, isDirty } = useEditing();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isSmartImportOpen, setIsSmartImportOpen] = useState(false);

  // Normalize all items to valid Production objects
  const items: Production[] = (rawItems || []).map(normalizeProduction);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const hasChanges = isDirty('scheduleItems');
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

  const updateItem = (id: string, updates: Partial<Production>) => {
    setItems(items.map(item => item.id === id ? normalizeProduction({ ...item, ...updates }) : item));
  };

  const handleDeleteConfirm = (id: string) => {
    const newItems = items.filter(i => i.id !== id);
    setItems(newItems);
    if (editingId === id) setEditingId(null);
    setDeleteTargetId(null);
  };

  const handleAdd = () => {
    const newProd = createEmptyProduction();
    newProd.order = items.length;
    setItems([newProd, ...items]);
    setEditingId(newProd.id);
  };

  const handleSmartImportApply = (updatedList: Production[]) => {
    setItems(updatedList.map(normalizeProduction));
  };

  const editingItem = items.find(i => i.id === editingId);

  // Performance dates management inside the currently editing production
  const handleAddPerformance = () => {
    if (!editingItem) return;
    const newPerf: Performance = {
      id: `perf-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      date: new Date().toISOString().split('T')[0],
      startTime: '19:30',
      venue: editingItem.location?.EN ? editingItem.location.EN.split(',')[0].trim() : '',
      city: editingItem.location?.EN && editingItem.location.EN.includes(',') ? editingItem.location.EN.split(',')[1].trim() : '',
      ticketUrl: '',
      ticketStatus: 'available',
      isPremiere: !editingItem.performances || editingItem.performances.length === 0,
      notes: ''
    };
    updateItem(editingItem.id, {
      performances: [...(editingItem.performances || []), newPerf]
    });
  };

  const handleUpdatePerformance = (perfIndex: number, perfUpdates: Partial<Performance>) => {
    if (!editingItem) return;
    const updatedPerfs = [...(editingItem.performances || [])];
    updatedPerfs[perfIndex] = { ...updatedPerfs[perfIndex], ...perfUpdates };
    updateItem(editingItem.id, { performances: updatedPerfs });
  };

  const handleDeletePerformance = (perfIndex: number) => {
    if (!editingItem) return;
    const updatedPerfs = (editingItem.performances || []).filter((_, i) => i !== perfIndex);
    updateItem(editingItem.id, { performances: updatedPerfs });
  };

  const properties = (
    <div className="pb-20">
      <div className="px-6 py-4 border-b border-neutral-900 flex justify-between items-center gap-2">
         <span className="text-xs uppercase tracking-widest text-neutral-500">Productions</span>
         <div className="flex items-center space-x-2">
           <button 
             onClick={() => setIsSmartImportOpen(true)}
             className="px-2.5 py-1 rounded bg-[#C9A227]/10 border border-[#C9A227]/30 text-[#C9A227] hover:bg-[#C9A227]/20 flex items-center space-x-1 text-[10px] uppercase tracking-widest transition-colors font-semibold"
           >
             <Sparkles className="w-3 h-3" />
             <span>Smart Import</span>
           </button>
           <button 
             onClick={handleAdd} 
             className="px-2.5 py-1 rounded bg-neutral-900 hover:bg-neutral-800 text-white flex items-center space-x-1 text-[10px] uppercase tracking-widest transition-colors"
           >
             <Plus className="w-3 h-3 text-[#C9A227]" /> 
             <span>Add</span>
           </button>
         </div>
      </div>
      
      {!editingId ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
            <div className="p-2 space-y-1.5 custom-scrollbar overflow-y-auto max-h-[550px]">
              {items.map(item => {
                const perfCount = item.performances?.length || 0;
                const nearestDate = item.performances?.[0]?.date || item.date || 'No Date';
                return (
                  <SortableItem 
                    key={item.id} 
                    id={item.id} 
                    className="relative pl-8 pr-12 bg-black/40 hover:bg-white/5 border border-neutral-900 p-3 rounded group cursor-pointer" 
                    handleClassName="absolute left-2 top-1/2 -translate-y-1/2 p-1 text-neutral-600 hover:text-white" 
                    onClick={() => setEditingId(item.id)}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-[#C9A227] uppercase tracking-wider font-mono">
                        {item.category}
                      </span>
                      <span className="text-xs text-neutral-200 font-medium truncate">
                        {item.title?.[currentLang] || item.title?.EN || item.title?.DE || 'Untitled Production'}
                      </span>
                    </div>
                    
                    <div className="text-[10px] text-neutral-400 mt-1 truncate">
                      {item.role?.[currentLang] || item.role?.EN || 'No Role'} • {item.location?.[currentLang] || item.location?.EN || 'No Location'}
                    </div>

                    <div className="flex items-center space-x-2 mt-1.5 text-[9px] font-mono text-neutral-500">
                      <Calendar className="w-3 h-3 text-[#C9A227]" />
                      <span>{nearestDate}</span>
                      <span>•</span>
                      <span className="text-[#C9A227]">{perfCount} {perfCount === 1 ? 'Date' : 'Dates'}</span>
                    </div>

                    <button 
                      onClick={(e) => { e.stopPropagation(); setDeleteTargetId(item.id); }} 
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-neutral-600 hover:text-rose-500 transition-colors"
                      title="Delete Production"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </SortableItem>
                );
              })}
              {items.length === 0 && (
                <div className="text-center p-8 text-neutral-500 text-xs border border-dashed border-neutral-900 rounded">
                  No productions yet. Click "+ Add" or "Smart Import" to add schedule items.
                </div>
              )}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <>
          <div className="px-6 py-3 border-b border-neutral-900 flex items-center justify-between bg-neutral-950">
             <button onClick={() => setEditingId(null)} className="text-xs text-neutral-500 hover:text-white uppercase tracking-widest flex items-center space-x-1">
               <span>← Back to Productions List</span>
             </button>
             <span className="text-[10px] px-2 py-0.5 rounded bg-[#C9A227]/10 text-[#C9A227] uppercase tracking-wider font-mono">
               {editingItem?.category}
             </span>
          </div>
          {editingItem && (
            <div className="space-y-4">
              {/* 1. Production Metadata */}
              <PropertyAccordion title="Production Details" defaultOpen>
                 <PropertySelect 
                   label="Category" 
                   value={editingItem.category} 
                   options={[
                     {label: 'Opera', value: 'Opera'}, 
                     {label: 'Concert', value: 'Concert'}, 
                     {label: 'Recital', value: 'Recital'}, 
                     {label: 'Gala', value: 'Gala'}
                   ]} 
                   onChange={v => updateItem(editingItem.id, { category: v as any })} 
                 />
                 <PropertyInput 
                   label={`Production / Title (EN)`} 
                   value={editingItem.title?.EN || ''} 
                   onChange={v => updateItem(editingItem.id, { title: {...editingItem.title, EN: v} })} 
                 />
                 <PropertyInput 
                   label={`Production / Title (DE)`} 
                   value={editingItem.title?.DE || ''} 
                   onChange={v => updateItem(editingItem.id, { title: {...editingItem.title, DE: v} })} 
                 />
                 <PropertyInput 
                   label={`Production / Title (KO)`} 
                   value={editingItem.title?.KO || ''} 
                   onChange={v => updateItem(editingItem.id, { title: {...editingItem.title, KO: v} })} 
                 />
                 <PropertyInput 
                   label={`Role (EN)`} 
                   value={editingItem.role?.EN || ''} 
                   onChange={v => updateItem(editingItem.id, { role: {...editingItem.role, EN: v} })} 
                 />
                 <PropertyInput 
                   label={`Role (DE)`} 
                   value={editingItem.role?.DE || ''} 
                   onChange={v => updateItem(editingItem.id, { role: {...editingItem.role, DE: v} })} 
                 />
                 <PropertyInput 
                   label={`Location / Theatre (EN)`} 
                   value={editingItem.location?.EN || ''} 
                   onChange={v => updateItem(editingItem.id, { location: {...editingItem.location, EN: v} })} 
                 />
                 <PropertyInput 
                   label={`Location / Theatre (DE)`} 
                   value={editingItem.location?.DE || ''} 
                   onChange={v => updateItem(editingItem.id, { location: {...editingItem.location, DE: v} })} 
                 />
                 <PropertyInput 
                   label="Season (e.g. 2026/27)" 
                   value={editingItem.season || ''} 
                   onChange={v => updateItem(editingItem.id, { season: v })} 
                 />
              </PropertyAccordion>

              {/* 2. Performances Dates */}
              <PropertyAccordion title={`Performance Dates (${editingItem.performances?.length || 0})`} defaultOpen>
                <div className="space-y-3 pt-1">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleAddPerformance}
                      className="px-2 py-1 rounded bg-[#C9A227]/10 hover:bg-[#C9A227]/20 text-[#C9A227] text-[10px] uppercase tracking-wider font-semibold flex items-center space-x-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Date</span>
                    </button>
                  </div>

                  {(editingItem.performances || []).map((perf, pIndex) => (
                    <div key={perf.id || pIndex} className="p-3 bg-neutral-900/80 border border-neutral-800 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase text-[#C9A227]">
                          Performance #{pIndex + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeletePerformance(pIndex)}
                          className="p-1 text-neutral-500 hover:text-red-400 transition-colors"
                          title="Remove Date"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[9px] uppercase text-neutral-500 mb-0.5">Date</label>
                          <input 
                            type="date"
                            value={perf.date}
                            onChange={(e) => handleUpdatePerformance(pIndex, { date: e.target.value })}
                            className="w-full bg-neutral-950 border border-neutral-800 text-white text-xs rounded px-2 py-1 focus:outline-none focus:border-[#C9A227] font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] uppercase text-neutral-500 mb-0.5">Start Time</label>
                          <input 
                            type="text"
                            value={perf.startTime || ''}
                            onChange={(e) => handleUpdatePerformance(pIndex, { startTime: e.target.value })}
                            placeholder="19:00"
                            className="w-full bg-neutral-950 border border-neutral-800 text-white text-xs rounded px-2 py-1 focus:outline-none focus:border-[#C9A227] font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[9px] uppercase text-neutral-500 mb-0.5">Venue / Stage</label>
                          <input 
                            type="text"
                            value={perf.venue || ''}
                            onChange={(e) => handleUpdatePerformance(pIndex, { venue: e.target.value })}
                            placeholder="Werkstattbühne"
                            className="w-full bg-neutral-950 border border-neutral-800 text-white text-xs rounded px-2 py-1 focus:outline-none focus:border-[#C9A227]"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] uppercase text-neutral-500 mb-0.5">City</label>
                          <input 
                            type="text"
                            value={perf.city || ''}
                            onChange={(e) => handleUpdatePerformance(pIndex, { city: e.target.value })}
                            placeholder="Kaiserslautern"
                            className="w-full bg-neutral-950 border border-neutral-800 text-white text-xs rounded px-2 py-1 focus:outline-none focus:border-[#C9A227]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center">
                        <div>
                          <label className="block text-[9px] uppercase text-neutral-500 mb-0.5">Ticket Status</label>
                          <select
                            value={perf.ticketStatus || 'no_ticket'}
                            onChange={(e) => handleUpdatePerformance(pIndex, { ticketStatus: e.target.value })}
                            className="w-full bg-neutral-950 border border-neutral-800 text-white text-xs rounded px-2 py-1 focus:outline-none focus:border-[#C9A227]"
                          >
                            <option value="available">Available (Tickets)</option>
                            <option value="sold_out">Sold Out (Ausverkauft)</option>
                            <option value="few_tickets">Few Tickets (Restkarten)</option>
                            <option value="no_ticket">No Ticket Link</option>
                            <option value="free">Free Entry (Kostenlos)</option>
                            <option value="cancelled">Cancelled (Abgesagt)</option>
                          </select>
                        </div>
                        <div className="pt-3 sm:pt-4">
                          <label className="flex items-center space-x-2 cursor-pointer select-none">
                            <input 
                              type="checkbox"
                              checked={!!perf.isPremiere}
                              onChange={(e) => handleUpdatePerformance(pIndex, { isPremiere: e.target.checked })}
                              className="rounded border-neutral-700 text-[#C9A227] focus:ring-[#C9A227] bg-neutral-950"
                            />
                            <span className={`text-[10px] uppercase tracking-wider font-semibold ${perf.isPremiere ? 'text-[#C9A227]' : 'text-neutral-400'}`}>
                              Premiere Performance
                            </span>
                          </label>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[9px] uppercase text-neutral-500 mb-0.5">Ticket Link / URL</label>
                        <input 
                          type="url"
                          value={perf.ticketUrl || ''}
                          onChange={(e) => handleUpdatePerformance(pIndex, { ticketUrl: e.target.value })}
                          placeholder="https://..."
                          className="w-full bg-neutral-950 border border-neutral-800 text-white text-xs rounded px-2 py-1 focus:outline-none focus:border-[#C9A227] font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] uppercase text-neutral-500 mb-0.5">Notes (e.g. Wiederaufnahme, Derniere)</label>
                        <input 
                          type="text"
                          value={perf.notes || ''}
                          onChange={(e) => handleUpdatePerformance(pIndex, { notes: e.target.value })}
                          placeholder="Wiederaufnahme, Matinee..."
                          className="w-full bg-neutral-950 border border-neutral-800 text-white text-xs rounded px-2 py-1 focus:outline-none focus:border-[#C9A227]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </PropertyAccordion>

              {/* 3. General Links */}
              <PropertyAccordion title="General Information & Links">
                 <PropertyInput 
                   label="Production Link (Optional)" 
                   value={editingItem.generalLink || editingItem.link || ''} 
                   onChange={v => updateItem(editingItem.id, { generalLink: v, link: v })} 
                   type="url" 
                 />
                 <GoogleDrivePicker onPick={url => updateItem(editingItem.id, { generalLink: url, link: url })} />
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
        title="Schedule Editor"
        hasChanges={hasChanges}
        isSaving={isSaving}
        onSave={handleSave}
        onReset={handleReset}
        onClose={onClose}
        properties={properties}
      />

      {/* Smart Import Modal */}
      <SmartImportModal
        isOpen={isSmartImportOpen}
        onClose={() => setIsSmartImportOpen(false)}
        existingProductions={items}
        onApply={handleSmartImportApply}
        currentLang={currentLang}
      />

      {/* Delete Confirmation Modal */}
      {deleteTargetId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <div className="bg-neutral-950 border border-neutral-900 p-6 rounded max-w-sm w-full space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="space-y-2">
              <h3 className="text-sm font-serif text-white tracking-widest uppercase">Delete Confirmation</h3>
              <p className="text-xs text-neutral-400">Are you sure you want to delete this production and all its performance dates? This action cannot be undone.</p>
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
