import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

interface SortableItemProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  handleClassName?: string;
  handleType?: 'icon' | 'full';
}

export const SortableItem = React.forwardRef<HTMLDivElement, SortableItemProps>(
  ({ id, children, className, handleClassName, handleType = 'icon' }, _ref) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      zIndex: isDragging ? 50 : 1,
      position: 'relative' as const,
    };

    if (handleType === 'full') {
      return (
        <div 
          ref={setNodeRef} 
          style={style} 
          {...attributes} 
          {...listeners} 
          className={`${className || ''} ${isDragging ? 'opacity-50 shadow-2xl scale-105 z-50' : ''}`}
        >
          {children}
        </div>
      );
    }

    return (
      <div 
        ref={setNodeRef} 
        style={style} 
        className={`${className || ''} ${isDragging ? 'opacity-50 shadow-2xl scale-[1.02] z-50 bg-neutral-900/50' : ''}`}
      >
        <button 
          type="button"
          {...attributes} 
          {...listeners} 
          style={{ touchAction: 'none' }}
          className={`cursor-grab active:cursor-grabbing text-neutral-500 hover:text-white flex items-center justify-center border-none bg-transparent p-0 outline-none focus:outline-none ${handleClassName || ''}`}
          aria-label="Drag handle"
        >
          <GripVertical className="w-4 h-4" />
        </button>
        {children}
      </div>
    );
  }
);
SortableItem.displayName = 'SortableItem';
