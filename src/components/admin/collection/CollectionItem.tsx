import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CollectionItemContext } from './CollectionContext';

interface CollectionItemProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

export function CollectionItem({ id, children, className = '' }: CollectionItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
  };

  return (
    <CollectionItemContext.Provider value={{ attributes, listeners, isDragging }}>
      <div 
        ref={setNodeRef} 
        style={style} 
        className={`relative group ${className} ${isDragging ? 'opacity-70 shadow-2xl scale-105 ring-2 ring-[#C9A227]' : ''}`}
      >
        {children}
      </div>
    </CollectionItemContext.Provider>
  );
}
