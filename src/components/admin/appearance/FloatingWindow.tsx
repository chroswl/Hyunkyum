import React, { useState, useEffect } from 'react';
import { X, Minus, Square, Maximize2 } from 'lucide-react';
import { Rnd } from 'react-rnd';

interface FloatingWindowProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export default function FloatingWindow({ title, onClose, children, footer }: FloatingWindowProps) {
  const [isMinimized, setIsMinimized] = useState(() => localStorage.getItem('appearance_minimized') === 'true');
  const [isMaximized, setIsMaximized] = useState(() => localStorage.getItem('appearance_maximized') === 'true');
  
  const [size, setSize] = useState(() => {
    const saved = localStorage.getItem('appearance_size');
    const parsed = saved ? JSON.parse(saved) : null;
    // Comfortable widescreen size on desktop, scale responsively on smaller viewports
    if (parsed && parsed.width >= 280) {
      return parsed;
    }
    const defaultWidth = window.innerWidth < 900 ? Math.max(300, window.innerWidth - 32) : 840;
    const defaultHeight = window.innerHeight < 800 ? Math.max(400, window.innerHeight - 80) : 700;
    return { width: defaultWidth, height: defaultHeight };
  });

  const [position, setPosition] = useState(() => {
    const saved = localStorage.getItem('appearance_position');
    const parsed = saved ? JSON.parse(saved) : null;
    if (parsed) {
      // Clamp position to keep it accessible inside the current viewport boundaries
      const x = Math.min(Math.max(10, parsed.x), Math.max(10, window.innerWidth - 120));
      const y = Math.min(Math.max(10, parsed.y), Math.max(10, window.innerHeight - 80));
      return { x, y };
    }
    const defaultWidth = window.innerWidth < 900 ? Math.max(300, window.innerWidth - 32) : 840;
    const defaultX = Math.max(16, window.innerWidth - defaultWidth - 32);
    const defaultY = window.innerWidth < 900 ? 16 : 80;
    return { x: defaultX, y: defaultY };
  });

  // Save state to localStorage
  useEffect(() => {
    localStorage.setItem('appearance_minimized', isMinimized.toString());
    localStorage.setItem('appearance_maximized', isMaximized.toString());
    localStorage.setItem('appearance_position', JSON.stringify(position));
    localStorage.setItem('appearance_size', JSON.stringify(size));
  }, [isMinimized, isMaximized, position, size]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (isMaximized) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col bg-[#0b0b0b]/98 backdrop-blur-2xl border border-neutral-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)]">
        <div className="h-12 px-5 flex items-center justify-between border-b border-neutral-800/80 select-none shrink-0 bg-[#0d0d0d]">
          <div className="flex items-center space-x-2.5">
            <span className="w-2 h-2 rounded-full bg-accent shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
            <h3 className="text-xs font-bold tracking-widest uppercase text-neutral-200">{title}</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={() => { setIsMaximized(!isMaximized); setIsMinimized(false); }} className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-all">
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button onClick={onClose} className="p-2 text-neutral-400 hover:text-rose-400 hover:bg-rose-950/25 rounded-lg transition-all border border-transparent hover:border-rose-500/10">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
          {children}
        </div>
        {footer && (
          <div className="p-4 border-t border-neutral-800 bg-[#070707] shrink-0">
            {footer}
          </div>
        )}
      </div>
    );
  }

  return (
    <Rnd
      style={{ position: "fixed", zIndex: 9999 }}
      size={{ width: size.width, height: isMinimized ? 48 : size.height }}
      position={{ x: position.x, y: position.y }}
      onDragStop={(e, d) => setPosition({ x: d.x, y: d.y })}
      onResizeStop={(e, direction, ref, delta, position) => {
        setSize({ width: parseInt(ref.style.width, 10), height: parseInt(ref.style.height, 10) });
        setPosition(position);
      }}
      minWidth={320}
      minHeight={isMinimized ? 48 : 450}
      maxWidth={window.innerWidth - 16}
      maxHeight={window.innerHeight - 16}
      disableDragging={isMaximized}
      enableResizing={!isMaximized && !isMinimized}
      dragHandleClassName="drag-handle"
      bounds="window"
      className="z-[9999] flex flex-col bg-[#0b0b0b]/98 backdrop-blur-2xl border border-neutral-800/80 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] rounded-xl overflow-hidden"
    >
      {/* Header */}
      <div 
        className="drag-handle h-12 px-5 flex items-center justify-between border-b border-neutral-800/60 cursor-move select-none shrink-0 bg-[#0e0e0e] hover:bg-[#121212] transition-colors"
        onDoubleClick={() => setIsMaximized(true)}
      >
        <div className="flex items-center space-x-2.5 pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-accent shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
          <h3 className="text-xs font-bold tracking-widest uppercase text-neutral-200">{title}</h3>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={() => setIsMinimized(!isMinimized)} className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-all" onPointerDown={e => e.stopPropagation()}>
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => { setIsMaximized(!isMaximized); setIsMinimized(false); }} className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-all" onPointerDown={e => e.stopPropagation()}>
            <Square className="w-3 h-3" />
          </button>
          <button onClick={onClose} className="p-2 text-neutral-400 hover:text-rose-400 hover:bg-rose-950/25 rounded-lg transition-all border border-transparent hover:border-rose-500/10" onPointerDown={e => e.stopPropagation()}>
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      {!isMinimized && (
        <div className="flex-1 flex flex-col h-[calc(100%-48px)]">
          <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
            {children}
          </div>
          {footer && (
            <div className="p-4 border-t border-neutral-800/80 bg-[#070707] shrink-0">
              {footer}
            </div>
          )}
        </div>
      )}
    </Rnd>
  );
}
