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
    <div className={`absolute top-2 right-2 z-30 pointer-events-auto flex items-center ${className}`}>
      <div className="flex items-center space-x-1 bg-black/85 backdrop-blur-md border border-white/20 rounded-full p-1 shadow-xl opacity-90 group-hover:opacity-100 hover:opacity-100 transition-all">
        <div 
          className="p-1.5 hover:bg-white/20 rounded-full text-neutral-300 hover:text-white transition-colors cursor-grab active:cursor-grabbing touch-none"
          title="Drag to reorder / 드래그하여 순서 변경"
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
          {...attributes} 
          {...listeners}
        >
          <GripVertical className="w-3.5 h-3.5" />
        </div>

        {!isDragHandleOnly && onEdit && (
          <button 
            type="button"
            onClick={(e) => { 
              e.preventDefault(); 
              e.stopPropagation(); 
              onEdit(); 
            }}
            className="p-1.5 hover:bg-[#C9A227] hover:text-black rounded-full text-neutral-300 transition-colors cursor-pointer"
            title="Edit / 수정"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
        )}
        
        {!isDragHandleOnly && onDelete && (
          <button 
            type="button"
            onClick={(e) => { 
              e.preventDefault(); 
              e.stopPropagation(); 
              onDelete(); 
            }}
            className="p-1.5 hover:bg-red-500 hover:text-white rounded-full text-neutral-300 transition-colors cursor-pointer"
            title="Delete / 삭제"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

