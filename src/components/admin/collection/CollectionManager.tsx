import React, { useState, useMemo } from 'react';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragEndEvent 
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  rectSortingStrategy,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { CollectionItem } from './CollectionItem';
import { HoverOverlay } from './HoverOverlay';
import { FloatingEditor } from '../FloatingEditor';

interface CollectionManagerProps<T extends { id: string }> {
  items: T[];
  onReorder: (newItems: T[]) => void;
  onAdd: (item: T) => Promise<void> | void;
  onUpdate: (item: T) => Promise<void> | void;
  onDelete: (id: string) => void;
  renderItem: (item: T, index: number) => React.ReactNode;
  itemSchema: () => T;
  editorForm: (props: {
    item: T;
    onChange: (updated: T) => void;
    onSave: () => void;
    onCancel: () => void;
    isSaving: boolean;
  }) => React.ReactNode;
  isAdmin: boolean;
  title: string; // Item name for display (e.g. "Photo", "Education", "Award", etc.)
  gridClassName?: string;
  className?: string;
  strategy?: 'rect' | 'vertical';
  emptyMessage?: string;
}

export function CollectionManager<T extends { id: string }>({
  items = [],
  onReorder,
  onAdd,
  onUpdate,
  onDelete,
  renderItem,
  itemSchema,
  editorForm,
  isAdmin,
  title,
  gridClassName = '',
  className = '',
  strategy = 'rect',
  emptyMessage = 'No items found'
}: CollectionManagerProps<T>) {
  
  const [editingItem, setEditingItem] = useState<T | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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

  // Generate unique stable IDs for dnd-kit
  const uniqueIds = useMemo(() => {
    const seen = new Set<string>();
    return items.map((item, index) => {
      const baseId = item.id || `fallback-${index}`;
      let id = baseId;
      if (seen.has(id)) {
        id = `${baseId}-dup-${index}`;
      }
      seen.add(id);
      return id;
    });
  }, [items]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = uniqueIds.indexOf(active.id as string);
      const newIndex = uniqueIds.indexOf(over.id as string);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newItems = arrayMove(items, oldIndex, newIndex);
        onReorder(newItems);
      }
    }
  };

  const sortingStrategy = strategy === 'rect' ? rectSortingStrategy : verticalListSortingStrategy;

  const handleStartAdd = () => {
    const newTemplate = itemSchema();
    // Ensure the new template has some unique ID
    if (!newTemplate.id) {
      newTemplate.id = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    setEditingItem(newTemplate);
    setIsCreating(true);
  };

  const handleSave = async () => {
    if (!editingItem) return;
    setIsSaving(true);
    try {
      if (isCreating) {
        await onAdd(editingItem);
      } else {
        await onUpdate(editingItem);
      }
      setEditingItem(null);
    } catch (err) {
      console.error("CollectionManager: Failed to save item:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingItem(null);
  };

  // Render Public View
  if (!isAdmin) {
    if (items.length === 0) {
      return null; // Don't show anything for empty public collections
    }
    return (
      <div className={`${className} ${gridClassName}`}>
        {items.map((item, index) => (
          <React.Fragment key={item.id || index}>
            {renderItem(item, index)}
          </React.Fragment>
        ))}
      </div>
    );
  }

  // Render Admin View
  return (
    <div className={`relative ${className}`}>
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 border border-dashed border-white/10 rounded bg-white/5 text-neutral-400 font-sans text-xs">
          {emptyMessage}
        </div>
      ) : (
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className={gridClassName}>
            <SortableContext 
              items={uniqueIds}
              strategy={sortingStrategy}
            >
              {items.map((item, index) => {
                const uniqueId = uniqueIds[index];
                return (
                  <React.Fragment key={uniqueId}>
                    <CollectionItem 
                      id={uniqueId}
                      className="relative group h-full"
                    >
                      {renderItem(item, index)}
                      <HoverOverlay
                        onEdit={() => {
                          setEditingItem(item);
                          setIsCreating(false);
                        }}
                        onDelete={() => {
                          onDelete(item.id);
                        }}
                      />
                    </CollectionItem>
                  </React.Fragment>
                );
              })}
            </SortableContext>
          </div>
        </DndContext>
      )}

      {/* "+ Add Item" Button (Always appears AFTER the final item) */}
      <div className="mt-4 flex justify-end">
        {strategy === 'rect' ? (
          <button
            onClick={handleStartAdd}
            className="group flex flex-col items-center justify-center min-h-[160px] w-full border border-dashed border-white/20 hover:border-[#C9A227] bg-white/5 hover:bg-[#C9A227]/5 rounded-sm transition-all duration-300"
          >
            <div className="w-10 h-10 rounded-full bg-white/10 group-hover:bg-[#C9A227]/20 flex items-center justify-center transition-colors mb-2">
              <Plus className="w-5 h-5 text-white/50 group-hover:text-[#C9A227]" />
            </div>
            <span className="text-[10px] uppercase tracking-widest text-white/50 group-hover:text-[#C9A227] font-sans">
              Add {title}
            </span>
          </button>
        ) : (
          <button
            onClick={handleStartAdd}
            className="group flex items-center justify-center gap-2 py-3 w-full border border-dashed border-white/20 hover:border-[#C9A227] bg-white/5 hover:bg-[#C9A227]/5 rounded-sm transition-all duration-300"
          >
            <Plus className="w-4 h-4 text-white/50 group-hover:text-[#C9A227] transition-colors" />
            <span className="text-[10px] uppercase tracking-widest text-white/50 group-hover:text-[#C9A227] font-sans transition-colors">
              Add {title}
            </span>
          </button>
        )}
      </div>

      {/* Floating Editor Panel */}
      <FloatingEditor
        isOpen={editingItem !== null}
        onClose={handleCancel}
        title={isCreating ? `Add ${title}` : `Edit ${title}`}
      >
        {editingItem && editorForm({
          item: editingItem,
          onChange: setEditingItem,
          onSave: handleSave,
          onCancel: handleCancel,
          isSaving: isSaving
        })}
      </FloatingEditor>
    </div>
  );
}
