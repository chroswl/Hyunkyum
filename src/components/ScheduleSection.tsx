import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, MapPin, Tag, Edit3, Plus, Trash2, Save, GripVertical, Check, X, Sparkles, ExternalLink 
} from 'lucide-react';
import { 
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent 
} from '@dnd-kit/core';
import { 
  arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable 
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ScheduleItem, Language } from '../types';
import { translations } from '../translations';
import { User } from 'firebase/auth';
import { db, saveScheduleItem, deleteScheduleItem } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';

interface SortableItemProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  handleClassName?: string;
  key?: string | number;
}

function SortableItem({ id, children, className = '', handleClassName = '' }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={`${className} ${isDragging ? 'opacity-70' : ''}`}>
      <div className={`${handleClassName} cursor-grab touch-none text-text-main/50 hover:text-text-main`} {...attributes} {...listeners}>
        <GripVertical className="w-4 h-4" />
      </div>
      {children}
    </div>
  );
}

interface ScheduleSectionProps {
  items: ScheduleItem[];
  currentLang: Language;
  setLang: (lang: Language) => void;
  user: User | null;
  activeEditSection: 'none' | 'biography' | 'press' | 'gallery' | 'videos' | 'schedule';
  setActiveEditSection: (section: 'none' | 'biography' | 'press' | 'gallery' | 'videos' | 'schedule') => void;
  onItemsUpdated: (items: ScheduleItem[]) => void;
  onRefreshData: () => void;
}

export default function ScheduleSection({ 
  items, 
  currentLang, 
  setLang, 
  user, 
  activeEditSection, 
  setActiveEditSection,
  onItemsUpdated,
  onRefreshData
}: ScheduleSectionProps) {
  const t = translations[currentLang];

  // Edit mode states
  const isEditMode = activeEditSection === 'schedule';
  const setIsEditMode = (mode: boolean) => {
    setActiveEditSection(mode ? 'schedule' : 'none');
  };
  const [editingItem, setEditingItem] = useState<Partial<ScheduleItem> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const originalItemRef = useRef<Partial<ScheduleItem> | null>(null);

  // Notifications
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  
  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Helper to format date elegantly
  const formatDate = (dateStr: string) => {
    const dateObj = new Date(dateStr);
    if (isNaN(dateObj.getTime())) return { day: '', monthYear: dateStr };

    const day = dateObj.getDate().toString().padStart(2, '0');
    
    // Custom translation of month based on language
    let month = '';
    if (currentLang === 'KO') {
      month = `${dateObj.getMonth() + 1}월`;
    } else {
      const monthsEN = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const monthsDE = ['JAN', 'FEB', 'MÄR', 'APR', 'MAI', 'JUN', 'JUL', 'AUG', 'SEP', 'OKT', 'NOV', 'DEZ'];
      month = currentLang === 'DE' ? monthsDE[dateObj.getMonth()] : monthsEN[dateObj.getMonth()];
    }

    const year = dateObj.getFullYear();
    return {
      day,
      month,
      year,
      fullDisplay: `${month} ${day}, ${year}`
    };
  };

  const getTagColor = (category: string) => {
    switch (category) {
      case 'Opera': return 'border-neutral-200/30 text-neutral-200 bg-neutral-200/5';
      case 'Concert': return 'border-neutral-400/30 text-neutral-400 bg-neutral-400/5';
      case 'Recital': return 'border-neutral-300/30 text-neutral-300 bg-neutral-300/5';
      default: return 'border-neutral-500/30 text-neutral-400 bg-neutral-500/5';
    }
  };

  // Drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);

    const newOrder = arrayMove(items, oldIndex, newIndex) as ScheduleItem[];
    const updatedList = newOrder.map((item, idx) => ({
      ...item,
      order: idx
    }));

    onItemsUpdated(updatedList);

    try {
      const batchUpdates = updatedList.map((item) => {
        return updateDoc(doc(db, "schedule", item.id), { order: item.order });
      });
      await Promise.all(batchUpdates);
      showNotification("Schedule order updated successfully");
      onRefreshData();
    } catch (err) {
      console.error("Error saving schedule order:", err);
      showNotification("Failed to update schedule order", "error");
    }
  };

  const startNewPerformance = () => {
    const newItem: Partial<ScheduleItem> = {
      date: new Date().toISOString().split('T')[0],
      category: 'Opera',
      title: { EN: '', DE: '', KO: '' },
      role: { EN: '', DE: '', KO: '' },
      location: { EN: '', DE: '', KO: '' },
      link: ''
    };
    setEditingItem(newItem);
    originalItemRef.current = newItem;
  };

  const startEditPerformance = (item: ScheduleItem) => {
    const parsedItem = {
      ...item,
      title: item.title || { EN: '', DE: '', KO: '' },
      role: item.role || { EN: '', DE: '', KO: '' },
      location: item.location || { EN: '', DE: '', KO: '' }
    };
    setEditingItem(parsedItem);
    originalItemRef.current = JSON.parse(JSON.stringify(parsedItem));
  };

  const handleDeletePerformance = async (id: string) => {
    
    try {
      await deleteScheduleItem(id);
      const newItems = items.filter(item => item.id !== id);
      onItemsUpdated(newItems);
      showNotification("Performance deleted successfully");
    } catch (err: any) {
      console.error("Error deleting performance:", err);
      showNotification(`Failed to delete performance: ${err.message || 'Unknown error'}`, "error");
    }
  };

  const handleCancelEdit = () => {
    const hasChanges = JSON.stringify(editingItem) !== JSON.stringify(originalItemRef.current);
    if (!hasChanges || true) {
      setEditingItem(null);
      originalItemRef.current = null;
    }
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.date) {
      alert("Please provide a valid date");
      return;
    }
    setIsSaving(true);
    try {
      const saveItem = { ...editingItem };
      if (saveItem.order === undefined) {
        saveItem.order = items.length;
      }
      await saveScheduleItem(saveItem as ScheduleItem);
      showNotification("Performance saved successfully");
      setEditingItem(null);
      originalItemRef.current = null;
      onRefreshData();
    } catch (err) {
      console.error("Error saving schedule:", err);
      showNotification("Failed to save schedule", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div id="schedule-section-root" className="w-full relative min-h-[400px]">
      
      {/* Toast notifications */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`absolute -top-12 left-1/2 -translate-x-1/2 z-50 px-4 py-2 border rounded-full text-xs tracking-wider uppercase font-body flex items-center space-x-2 shadow-lg ${
              notification.type === 'success'
                ? 'border-emerald-500/30 bg-emerald-950/80 text-emerald-400 backdrop-blur-sm'
                : 'border-rose-500/30 bg-rose-950/80 text-rose-400 backdrop-blur-sm'
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            <span>{notification.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Panel Header & Trigger */}
      {user && (activeEditSection === 'none' || activeEditSection === 'schedule') && (
        <div className="flex flex-wrap justify-between items-center mb-10 pb-4 border-b border-borders/5 gap-4">
          <div className="flex items-center space-x-3">
            <span className="text-[9px] font-mono tracking-widest text-accent uppercase bg-white/5 px-2 py-1 rounded">
              ADMIN ACCESS
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {!isEditMode ? (
              <button
                type="button"
                onClick={() => setIsEditMode(true)}
                className="inline-flex items-center space-x-2 text-[10px] uppercase tracking-widest px-4 py-2 bg-white/5 border border-borders/10 hover:border-accent hover:bg-white/10 rounded-sm text-neutral-300 transition-all cursor-pointer font-body font-medium"
              >
                <Edit3 className="w-3.5 h-3.5 text-accent" />
                <span>Edit Schedule</span>
              </button>
            ) : (
              <div className="flex items-center space-x-3 flex-wrap gap-2">
                {/* Embedded Language switcher inside Schedule Edit Mode */}
                <div className="flex items-center space-x-1 bg-white/5 px-1.5 py-1 rounded-sm border border-borders/10">
                  {(['EN', 'DE', 'KO'] as Language[]).map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setLang(lang)}
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
                  onClick={startNewPerformance}
                  className="inline-flex items-center space-x-1.5 text-[10px] uppercase tracking-widest px-3.5 py-2 bg-accent/10 hover:bg-accent/20 border border-accent/30 text-accent rounded-sm transition-all cursor-pointer font-body"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Event</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const hasChanges = editingItem !== null;
                    if (hasChanges) {
                      if (true) {
                        setEditingItem(null);
                        setIsEditMode(false);
                      }
                    } else {
                      setIsEditMode(false);
                    }
                  }}
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

      {/* ========================================================
          EDIT MODE INTERFACE
          ======================================================== */}
      {isEditMode ? (
        <div className="space-y-6">
          
          {editingItem ? (
            <form onSubmit={handleSaveChanges} className="bg-white/[0.02] border border-accent/20 p-6 md:p-8 rounded-lg space-y-6 max-w-3xl mx-auto transition-all">
              <div className="flex justify-between items-center pb-3 border-b border-borders/5">
                <h4 className="text-xs tracking-widest uppercase font-body font-semibold text-accent">
                  {editingItem.id ? 'Edit Performance' : 'New Performance Event'}
                </h4>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="p-1 hover:bg-white/5 rounded text-text-main/60 hover:text-text-main transition-colors cursor-pointer"
                  title="Close Form"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] tracking-wider text-text-main/60 font-body uppercase block font-semibold">Date</label>
                  <input
                    type="date"
                    required
                    value={editingItem.date || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, date: e.target.value })}
                    className="w-full bg-black/40 border border-borders/10 focus:border-accent rounded-sm px-3 py-2 text-xs text-text-main focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] tracking-wider text-text-main/60 font-body uppercase block font-semibold">Category</label>
                  <select
                    value={editingItem.category || 'Opera'}
                    onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value as any })}
                    className="w-full bg-black/40 border border-borders/10 focus:border-accent rounded-sm px-3 py-2 text-xs text-text-main focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                  >
                    <option value="Opera">Opera</option>
                    <option value="Concert">Concert</option>
                    <option value="Recital">Recital</option>
                    <option value="Gala">Gala</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] tracking-wider text-text-main/60 font-body uppercase block font-semibold">Ticket URL / Link</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={editingItem.link || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, link: e.target.value })}
                    className="w-full bg-black/40 border border-borders/10 focus:border-accent rounded-sm px-3 py-2 text-xs text-text-main focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                  />
                </div>
              </div>

              {/* Translation Inputs */}
              <div className="space-y-4 pt-3 border-t border-borders/5">
                <span className="text-[9px] font-mono text-accent uppercase tracking-widest block font-bold mb-1">MULTILINGUAL METADATA TRANSLATIONS</span>
                
                {/* Title Translations */}
                <div className="space-y-2">
                  <span className="text-[9px] font-mono text-text-main/60 uppercase tracking-widest block font-semibold">Performance Title</span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      type="text"
                      required
                      placeholder="Title (EN)"
                      value={editingItem.title?.EN || ''}
                      onChange={(e) => setEditingItem({
                        ...editingItem,
                        title: { ...editingItem.title, EN: e.target.value } as any
                      })}
                      className="w-full bg-black/40 border border-borders/10 rounded-sm px-2.5 py-1.5 text-xs text-text-main focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Title (DE)"
                      value={editingItem.title?.DE || ''}
                      onChange={(e) => setEditingItem({
                        ...editingItem,
                        title: { ...editingItem.title, DE: e.target.value } as any
                      })}
                      className="w-full bg-black/40 border border-borders/10 rounded-sm px-2.5 py-1.5 text-xs text-text-main focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Title (KO)"
                      value={editingItem.title?.KO || ''}
                      onChange={(e) => setEditingItem({
                        ...editingItem,
                        title: { ...editingItem.title, KO: e.target.value } as any
                      })}
                      className="w-full bg-black/40 border border-borders/10 rounded-sm px-2.5 py-1.5 text-xs text-text-main focus:outline-none"
                    />
                  </div>
                </div>

                {/* Role Translations */}
                <div className="space-y-2">
                  <span className="text-[9px] font-mono text-text-main/60 uppercase tracking-widest block font-semibold">Role Description</span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder="Role (EN)"
                      value={editingItem.role?.EN || ''}
                      onChange={(e) => setEditingItem({
                        ...editingItem,
                        role: { ...editingItem.role, EN: e.target.value } as any
                      })}
                      className="w-full bg-black/40 border border-borders/10 rounded-sm px-2.5 py-1.5 text-xs text-text-main focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Role (DE)"
                      value={editingItem.role?.DE || ''}
                      onChange={(e) => setEditingItem({
                        ...editingItem,
                        role: { ...editingItem.role, DE: e.target.value } as any
                      })}
                      className="w-full bg-black/40 border border-borders/10 rounded-sm px-2.5 py-1.5 text-xs text-text-main focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Role (KO)"
                      value={editingItem.role?.KO || ''}
                      onChange={(e) => setEditingItem({
                        ...editingItem,
                        role: { ...editingItem.role, KO: e.target.value } as any
                      })}
                      className="w-full bg-black/40 border border-borders/10 rounded-sm px-2.5 py-1.5 text-xs text-text-main focus:outline-none"
                    />
                  </div>
                </div>

                {/* Location Translations */}
                <div className="space-y-2">
                  <span className="text-[9px] font-mono text-text-main/60 uppercase tracking-widest block font-semibold">Theatre / Location / City</span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder="Location (EN)"
                      value={editingItem.location?.EN || ''}
                      onChange={(e) => setEditingItem({
                        ...editingItem,
                        location: { ...editingItem.location, EN: e.target.value } as any
                      })}
                      className="w-full bg-black/40 border border-borders/10 rounded-sm px-2.5 py-1.5 text-xs text-text-main focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Location (DE)"
                      value={editingItem.location?.DE || ''}
                      onChange={(e) => setEditingItem({
                        ...editingItem,
                        location: { ...editingItem.location, DE: e.target.value } as any
                      })}
                      className="w-full bg-black/40 border border-borders/10 rounded-sm px-2.5 py-1.5 text-xs text-text-main focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Location (KO)"
                      value={editingItem.location?.KO || ''}
                      onChange={(e) => setEditingItem({
                        ...editingItem,
                        location: { ...editingItem.location, KO: e.target.value } as any
                      })}
                      className="w-full bg-black/40 border border-borders/10 rounded-sm px-2.5 py-1.5 text-xs text-text-main focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-borders/5">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2 border border-borders/10 hover:border-borders/30 hover:bg-white/5 rounded-sm text-text-main/60 hover:text-text-main text-xs tracking-wider uppercase font-body transition-all cursor-pointer"
                >
                  {t.adminCancel}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-[var(--color-buttons)] text-background hover:bg-[var(--color-hover)] font-semibold rounded-sm text-xs tracking-wider uppercase transition-all flex items-center space-x-1.5 cursor-pointer font-body active:scale-95 shadow-md"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? t.adminSaving : t.adminSave}</span>
                </button>
              </div>
            </form>
          ) : (
            /* Drag-and-drop Reorder Listing */
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs tracking-wider text-text-main/60 font-body uppercase">
                  Sort Schedule • Drag handle on left • Click edit to translate
                </h3>
              </div>

              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <div className="divide-y divide-white/5 border border-borders/10 bg-black/20 rounded-sm overflow-hidden">
                  {items.length === 0 ? (
                    <div className="p-12 text-center text-text-main/50 text-xs font-body">No events published. Click Add Event above to schedule performances!</div>
                  ) : (
                    <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                      {items.map((item) => {
                        const formatted = formatDate(item.date);
                        return (
                          <SortableItem 
                            key={item.id} 
                            id={item.id} 
                            className="bg-transparent hover:bg-white/[0.02] flex items-center pl-12 pr-4 py-4 relative transition-all duration-300 border-b border-borders/5" 
                            handleClassName="absolute left-2.5 top-1/2 -translate-y-1/2 p-2"
                          >
                            <div className="flex-1 min-w-0 pr-4">
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                <span className="text-[10px] font-mono font-bold text-text-main/60">
                                  {formatted.fullDisplay || item.date}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-[8px] tracking-widest border uppercase font-body ${getTagColor(item.category)}`}>
                                  {item.category}
                                </span>
                              </div>
                              <h4 className="text-xs font-body font-bold text-neutral-200 mt-1 truncate">
                                {item.title[currentLang] || item.title['EN']}
                              </h4>
                              {item.role && (
                                <p className="text-[11px] text-text-main/50 font-body mt-0.5">
                                  {item.role[currentLang] || item.role['EN']} · {item.location[currentLang] || item.location['EN']}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center space-x-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => startEditPerformance(item)}
                                className="p-2 border border-borders/5 hover:border-borders/20 text-text-main/60 hover:text-text-main rounded transition-colors cursor-pointer"
                                title="Edit Event"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeletePerformance(item.id)}
                                className="p-2 border border-rose-500/10 hover:border-rose-500/35 text-rose-400 hover:bg-rose-950/20 rounded transition-colors cursor-pointer"
                                title="Delete Event"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </SortableItem>
                        );
                      })}
                    </SortableContext>
                  )}
                </div>
              </DndContext>
            </div>
          )}
        </div>
      ) : (
        /* ========================================================
            PUBLIC READ-ONLY EXPERIENCE
            ======================================================== */
        items.length === 0 ? (
          <div className="text-center py-16 border border-black/10 bg-transparent/5/40 rounded-sm">
            <Calendar className="w-10 h-10 mx-auto mb-3 text-text-main/60" />
            <p className="text-sm tracking-wider">No scheduled performances found.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {items.map((item) => {
              const formattedDate = formatDate(item.date);
              return (
                <div
                  key={item.id}
                  id={`schedule-row-${item.id}`}
                  className="schedule-card group relative rounded-sm p-6 transition-all duration-300 grid grid-cols-1 md:grid-cols-12 gap-6 items-center border"
                >
                  {/* Date column (3 cols) */}
                  <div className="md:col-span-3 flex md:flex-col items-center md:items-start space-x-4 md:space-x-0 md:space-y-1 md:border-r border-black/10 md:pr-4">
                    <div className="text-4xl md:text-5xl font-heading font-light tracking-tight group-hover:group-hover:font-medium transition-all">
                      {formattedDate.day}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs md:text-sm tracking-[0.2em] font-body font-medium uppercase">
                        {formattedDate.month}
                      </span>
                      <span className="text-[10px] tracking-widest font-mono">
                        {formattedDate.year}
                      </span>
                    </div>
                  </div>

                  {/* Content details column (7 cols) */}
                  <div className="md:col-span-7 space-y-2.5">
                    <div className="flex items-center space-x-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] tracking-widest border uppercase font-semibold font-body ${getTagColor(item.category)}`}>
                        {item.category}
                      </span>
                    </div>

                    <h3 className="text-base md:text-lg font-heading font-light tracking-wide leading-tight group-hover:translate-x-1 transition-transform duration-300">
                      {item.title[currentLang] || item.title['EN']}
                    </h3>

                    <div className="flex flex-col sm:flex-row sm:items-center space-y-1.5 sm:space-y-0 sm:space-x-4 text-xs font-body">
                      {item.role && (item.role[currentLang] || item.role['EN']) && (
                        <div className="flex items-center space-x-1.5">
                          <Tag className="w-3.5 h-3.5 text-text-main/60" />
                          <span>
                            <strong className="font-normal text-text-main/60">{t.roleLabel}:</strong> {item.role[currentLang] || item.role['EN']}
                          </span>
                        </div>
                      )}
                      {item.location && (item.location[currentLang] || item.location['EN']) && (
                        <div className="flex items-center space-x-1.5">
                          <MapPin className="w-3.5 h-3.5 text-text-main/60" />
                          <span className="text-neutral-300">{item.location[currentLang] || item.location['EN']}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Link / Action column (2 cols) */}
                  <div className="md:col-span-2 flex justify-end items-center space-x-3 mt-4 md:mt-0">
                    {item.link && (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="schedule-btn px-5 py-2 text-[10px] tracking-widest transition-all duration-300 rounded-sm uppercase font-body font-medium whitespace-nowrap cursor-pointer border-transparent"
                      >
                        Tickets
                      </a>
                    )}
                    {user && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDeletePerformance(item.id);
                        }}
                        className="p-2 border border-rose-500/10 hover:border-rose-500/35 text-rose-400 hover:bg-rose-950/20 rounded transition-colors cursor-pointer"
                        title="Delete from main page"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
