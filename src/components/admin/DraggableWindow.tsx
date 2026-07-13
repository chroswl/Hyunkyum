import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Minus, Maximize2, Minimize2 } from 'lucide-react';

interface DraggableWindowProps {
  title: string;
  icon?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  id: string; // for localstorage keys
}

export default function DraggableWindow({ title, icon, onClose, children, id }: DraggableWindowProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [size, setSize] = useState({ width: 450, height: window.innerHeight * 0.8 });
  const [isDragging, setIsDragging] = useState(false);
  const windowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedState = localStorage.getItem(`window-state-${id}`);
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        if (parsed.position) setPosition(parsed.position);
        if (parsed.size) setSize(parsed.size);
        if (parsed.isMinimized !== undefined) setIsMinimized(parsed.isMinimized);
      } catch (e) {}
    }
    
    // Add ESC listener
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [id, onClose]);

  useEffect(() => {
    localStorage.setItem(`window-state-${id}`, JSON.stringify({
      position, size, isMinimized
    }));
  }, [position, size, isMinimized, id]);

  // Drag handler
  const handleDragStart = (e: React.MouseEvent) => {
    if (isMaximized) return;
    setIsDragging(true);
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startPosX = position.x;
    const startPosY = position.y;
    
    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      setPosition({
        x: Math.max(0, Math.min(window.innerWidth - 100, startPosX + deltaX)),
        y: Math.max(0, Math.min(window.innerHeight - 44, startPosY + deltaY))
      });
    };
    
    const onMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  // Resize handler
  const handleResize = (e: React.MouseEvent, direction: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (isMaximized || isMinimized) return;
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = size.width;
    const startHeight = size.height;
    
    const onMouseMove = (moveEvent: MouseEvent) => {
      let newWidth = startWidth;
      let newHeight = startHeight;
      
      if (direction.includes('right')) {
        newWidth = Math.max(300, startWidth + (moveEvent.clientX - startX));
      }
      if (direction.includes('bottom')) {
        newHeight = Math.max(200, startHeight + (moveEvent.clientY - startY));
      }
      
      setSize({ width: newWidth, height: newHeight });
    };
    
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  return (
    <motion.div
      ref={windowRef}
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      transition={{ duration: 0.2 }}
      style={{
        position: 'fixed',
        left: isMaximized ? 0 : position.x,
        top: isMaximized ? 0 : position.y,
        width: isMaximized ? '100vw' : size.width,
        height: isMinimized ? 44 : (isMaximized ? '100vh' : size.height),
        zIndex: 99999,
      }}
      className={`flex flex-col bg-[#111] border border-neutral-800 shadow-2xl overflow-hidden font-sans ${isMaximized ? '' : 'rounded-xl'} ${isDragging ? 'opacity-95 shadow-[0_20px_50px_rgba(0,0,0,0.5)]' : ''}`}
    >
      {/* Header - Drag Handle */}
      <div 
        className="h-11 shrink-0 flex items-center justify-between px-3 border-b border-neutral-800 bg-[#0a0a0a] cursor-move select-none"
        onMouseDown={handleDragStart}
      >
        <div className="flex items-center space-x-2 text-neutral-300">
          {icon}
          <span className="text-xs font-medium tracking-wider">{title}</span>
        </div>
        
        <div className="flex items-center space-x-1" onMouseDown={e => e.stopPropagation()}>
          <button onClick={() => setIsMinimized(!isMinimized)} className="p-1.5 hover:bg-white/10 rounded text-neutral-400 hover:text-white transition-colors">
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => {setIsMaximized(!isMaximized); setIsMinimized(false);}} className="p-1.5 hover:bg-white/10 rounded text-neutral-400 hover:text-white transition-colors">
            {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <button onClick={onClose} className="p-1.5 hover:bg-red-500/20 rounded text-neutral-400 hover:text-red-400 transition-colors ml-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      
      {/* Body */}
      {!isMinimized && (
        <div className="flex-1 overflow-hidden flex flex-col relative bg-[#111]">
          {children}
          
          {/* Resize handles */}
          {!isMaximized && (
            <>
              <div 
                className="absolute right-0 top-0 bottom-0 w-1.5 cursor-e-resize hover:bg-accent/20 transition-colors z-50"
                onMouseDown={(e) => handleResize(e, 'right')}
              />
              <div 
                className="absolute left-0 bottom-0 right-0 h-1.5 cursor-s-resize hover:bg-accent/20 transition-colors z-50"
                onMouseDown={(e) => handleResize(e, 'bottom')}
              />
              <div 
                className="absolute right-0 bottom-0 w-4 h-4 cursor-se-resize flex items-end justify-end p-0.5 z-50"
                onMouseDown={(e) => handleResize(e, 'bottom-right')}
              >
                <svg className="w-3 h-3 text-neutral-600 hover:text-accent transition-colors" viewBox="0 0 10 10">
                  <path d="M8 10L10 8M5 10L10 5M2 10L10 2" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                </svg>
              </div>
            </>
          )}
        </div>
      )}
    </motion.div>
  );
}
