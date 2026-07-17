import React from 'react';
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
import { useEditing } from '../../../contexts/EditingContext';

interface SortableCollectionProps<T extends { id: string }> {
  items: T[];
  onReorder: (items: T[]) => void;
  onAdd?: () => void;
  renderItem: (item: T, index: number) => React.ReactNode;
  strategy?: 'rect' | 'vertical';
  className?: string;
  gridClassName?: string;
  isAdmin?: boolean;
}

export function SortableCollection<T extends { id: string }>({ 
  items, 
  onReorder, 
  onAdd, 
  renderItem,
  strategy = 'rect',
  className = '',
  gridClassName = '',
  isAdmin = false
}: SortableCollectionProps<T>) {
  
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

  // Generate unique keys and IDs to prevent React duplicate key errors and dnd-kit mismatch issues
  const uniqueIds = React.useMemo(() => {
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

  if (!isAdmin) {
    return (
      <div className={`${className} ${gridClassName}`}>
        {items.map((item, index) => {
          const uniqueId = uniqueIds[index];
          return (
            <React.Fragment key={uniqueId}>
              {renderItem({ ...item, id: uniqueId }, index)}
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
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
                  {renderItem({ ...item, id: uniqueId }, index)}
                </React.Fragment>
              );
            })}
          </SortableContext>
          
          {onAdd && (
            <div 
              onClick={onAdd}
              className="group cursor-pointer flex flex-col items-center justify-center min-h-[200px] border border-dashed border-white/20 hover:border-[#C9A227] bg-white/5 hover:bg-[#C9A227]/5 rounded-sm transition-all duration-300 h-full"
            >
              <div className="w-12 h-12 rounded-full bg-white/10 group-hover:bg-[#C9A227]/20 flex items-center justify-center transition-colors mb-3">
                <Plus className="w-6 h-6 text-white/50 group-hover:text-[#C9A227]" />
              </div>
              <span className="text-xs uppercase tracking-widest text-white/50 group-hover:text-[#C9A227] font-sans">
                Add Item
              </span>
            </div>
          )}
        </div>
      </DndContext>
    </div>
  );
}
