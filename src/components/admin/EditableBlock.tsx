import React from 'react';

export default function EditableBlock({
  id,
  adminMode,
  selectedBlock,
  onSelect,
  children,
  className = ""
}: {
  id: string;
  adminMode?: boolean;
  selectedBlock?: string | null;
  onSelect?: (id: string) => void;
  children: React.ReactNode;
  className?: string;
}) {
  if (!adminMode) {
    return <div className={className}>{children}</div>;
  }
  
  const isSelected = selectedBlock === id;
  
  return (
    <div 
      className={`relative cursor-pointer transition-all duration-200 ${className} ${
        isSelected 
          ? 'ring-1 ring-[#C9A227] ring-offset-2 ring-offset-black/50 rounded-sm' 
          : 'hover:ring-1 hover:ring-white/20 hover:ring-offset-2 hover:ring-offset-black/50 rounded-sm'
      }`}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        if (onSelect) onSelect(id);
      }}
    >
      {children}
    </div>
  );
}