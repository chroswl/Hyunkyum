import React from 'react';
import { Edit3, Trash2, GripVertical } from 'lucide-react';
import { useCollectionItem } from './CollectionContext';

interface HoverOverlayProps {
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
  isDragHandleOnly?: boolean;
}

export function HoverOverlay({ onEdit, onDelete, className = '', isDragHandleOnly = false }: HoverOverlayProps) {
  const { attributes, listeners, isDragging } = useCollectionItem();

  if (isDragging) return null;

  return (
    <div className={`absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3 md:gap-4 z-20 ${className}`}>
      {onEdit && (
        <button 
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(); }}
          className="p-2.5 md:p-3 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md transition-colors border border-white/20"
          title="Edit"
        >
          <Edit3 className="w-4 h-4 md:w-5 md:h-5" />
        </button>
      )}
      
      {onDelete && (
        <button 
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); }}
          className="p-2.5 md:p-3 bg-red-500/80 hover:bg-red-500 rounded-full text-white backdrop-blur-md transition-colors border border-white/20"
          title="Delete"
        >
          <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
        </button>
      )}
      
      <div 
        className="p-2.5 md:p-3 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md transition-colors cursor-grab touch-none border border-white/20"
        title="Drag to reorder"
        onMouseDown={(e) => {
          // Prevent drag from firing click events underneath
        }}
        {...attributes} 
        {...listeners}
      >
        <GripVertical className="w-4 h-4 md:w-5 md:h-5" />
      </div>
    </div>
  );
}
