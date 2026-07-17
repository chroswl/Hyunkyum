import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Bold, Italic, Link2, ChevronDown, Type } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FloatingToolbarProps {
  isOpen: boolean;
  targetRef: React.RefObject<HTMLElement>;
  tools?: string[];
  contextName?: string;
}

export function FloatingToolbar({ isOpen, targetRef, tools = ['bold', 'italic', 'link'], contextName }: FloatingToolbarProps) {
  const [position, setPosition] = useState<{ top: number; left: number; placement: 'top' | 'bottom'; xOffset: number } | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);

  const updatePosition = () => {
    if (!targetRef.current || !isOpen) return;
    const rect = targetRef.current.getBoundingClientRect();
    const toolbarEl = toolbarRef.current;
    
    let toolbarWidth = 200; // Default estimate
    let toolbarHeight = 40;
    if (toolbarEl) {
      toolbarWidth = toolbarEl.offsetWidth;
      toolbarHeight = toolbarEl.offsetHeight;
    }

    const SPACING = 10;
    
    let placement: 'top' | 'bottom' = 'top';
    let top = rect.top + window.scrollY - toolbarHeight - SPACING;
    
    // If there's not enough space at the top of the viewport, place it below the element
    if (rect.top < toolbarHeight + SPACING) {
      placement = 'bottom';
      top = rect.bottom + window.scrollY + SPACING;
    }

    // Viewport-relative center of the target element
    let viewLeft = rect.left + (rect.width / 2);
    
    // Viewport boundaries
    const minViewLeft = (toolbarWidth / 2) + SPACING;
    const maxViewLeft = window.innerWidth - (toolbarWidth / 2) - SPACING;
    
    let xOffset = 0;
    
    if (viewLeft < minViewLeft) {
      xOffset = viewLeft - minViewLeft; // How much we had to shift right (negative value)
      viewLeft = minViewLeft;
    } else if (viewLeft > maxViewLeft) {
      xOffset = viewLeft - maxViewLeft; // How much we had to shift left (positive value)
      viewLeft = maxViewLeft;
    }

    // Final document-relative left position
    const left = viewLeft + window.scrollX;

    // clamp xOffset so the pointer doesnt leave the toolbar
    const maxOffset = (toolbarWidth / 2) - 15;
    if (xOffset > maxOffset) xOffset = maxOffset;
    if (xOffset < -maxOffset) xOffset = -maxOffset;

    setPosition((prev) => {
      // Prevent unnecessary state updates if values are close enough (subpixel differences)
      if (prev && 
          Math.abs(prev.top - top) < 1 && 
          Math.abs(prev.left - left) < 1 && 
          prev.placement === placement && 
          Math.abs(prev.xOffset - xOffset) < 1) {
        return prev;
      }
      return { top, left, placement, xOffset };
    });
  };

  useEffect(() => {
    if (!isOpen || !targetRef.current) {
      setPosition(null);
      setIsDropdownOpen(false); // Close dropdown when toolbar closes
      return;
    }

    let animationFrameId: number;

    const handleScrollOrResize = () => {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(updatePosition);
    };

    // Initial position
    updatePosition();
    animationFrameId = requestAnimationFrame(updatePosition);

    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [isOpen, targetRef]);

  // Re-measure when tools change or toolbar mounts
  useLayoutEffect(() => {
    if (isOpen) {
      updatePosition();
    }
  }, [isOpen, tools]);

  if (!isOpen) return null;

  const renderTool = (tool: string, index: number) => {
    switch (tool) {
      case 'typography':
        return (
          <React.Fragment key={`typography-group-${index}`}>
            {index > 0 && tools[index - 1] !== 'separator' && <div className="w-px h-5 bg-neutral-700 mx-1 self-center" />}
            <div 
              className="relative flex items-center group cursor-pointer"
              onMouseEnter={() => setIsDropdownOpen(true)}
              onMouseLeave={() => setIsDropdownOpen(false)}
              onPointerDown={(e) => {
                e.preventDefault();
                            e.stopPropagation();
                setIsDropdownOpen(!isDropdownOpen);
              }}
            >
              <Type className="w-3.5 h-3.5 text-neutral-400 ml-2 group-hover:text-white transition-colors" />
              <div className="flex items-center text-[11px] font-sans pl-1.5 pr-2 py-1.5 uppercase tracking-wider text-neutral-300 group-hover:text-white transition-colors">
                ROLE
                <ChevronDown className="w-3 h-3 text-neutral-500 ml-1 group-hover:text-white transition-colors" />
              </div>
              
              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: position?.placement === 'top' ? -5 : 5, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: position?.placement === 'top' ? -5 : 5, scale: 0.95 }}
                    transition={{ duration: 0.1 }}
                    className={`absolute left-0 bg-neutral-800 border border-neutral-700 rounded shadow-xl flex flex-col py-1 min-w-[120px] z-50 ${
                      position?.placement === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'
                    }`}
                  >
                     {['display', 'heading', 'body', 'small'].map(role => (
                       <div 
                         key={role}
                         className="px-3 py-2 text-[10px] uppercase tracking-wider text-neutral-300 hover:bg-neutral-700 hover:text-white cursor-pointer transition-colors"
                         onPointerDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            
                            const selection = window.getSelection();
                            if (!selection || selection.rangeCount === 0) return;
                            
                            const range = selection.getRangeAt(0);
                            if (range.collapsed) return;
                            
                            const div = document.createElement('div');
                            div.appendChild(range.cloneContents());
                            
                            const html = `<span class="typography-${role}">${div.innerHTML}</span>`;
                            document.execCommand('insertHTML', false, html);
                            
                            setIsDropdownOpen(false);
                         }}
                       >
                         {role}
                       </div>
                     ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </React.Fragment>
        );
      case 'bold':
        return (
          <button 
            key={`bold-${index}`}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors focus:outline-none focus:ring-1 focus:ring-white/20"
            onPointerDown={(e) => { e.preventDefault();
                            e.stopPropagation(); document.execCommand('bold', false, undefined); }}
            title="Bold"
            aria-label="Bold"
          >
            <Bold className="w-4 h-4" />
          </button>
        );
      case 'italic':
        return (
          <button 
            key={`italic-${index}`}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors focus:outline-none focus:ring-1 focus:ring-white/20"
            onPointerDown={(e) => { e.preventDefault();
                            e.stopPropagation(); document.execCommand('italic', false, undefined); }}
            title="Italic"
            aria-label="Italic"
          >
            <Italic className="w-4 h-4" />
          </button>
        );
      case 'link':
        return (
          <React.Fragment key={`link-group-${index}`}>
            {index > 0 && tools[index - 1] !== 'separator' && <div className="w-px h-5 bg-neutral-700 mx-1 self-center" />}
            <button 
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors focus:outline-none focus:ring-1 focus:ring-white/20"
              onPointerDown={(e) => { 
                e.preventDefault();
                            e.stopPropagation(); 
                const url = prompt('Enter link URL:');
                if (url) {
                  document.execCommand('createLink', false, url);
                }
              }}
              title="Link"
              aria-label="Link"
            >
              <Link2 className="w-4 h-4" />
            </button>
          </React.Fragment>
        );
      case 'separator':
        return <div key={`sep-${index}`} className="w-px h-5 bg-neutral-700 mx-1 self-center" />;
      default:
        return null;
    }
  };

  const activeTools = tools.map((t, i) => renderTool(t, i)).filter(Boolean);

  if (activeTools.length === 0) return null;

  return createPortal(
    <AnimatePresence>
      {position && (
        <motion.div
          ref={toolbarRef}
          initial={{ opacity: 0, y: position.placement === 'top' ? 10 : -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: position.placement === 'top' ? 10 : -10, scale: 0.95 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="absolute z-[9999] bg-neutral-900 border border-neutral-700/50 rounded-md shadow-xl flex items-center px-1 py-1"
          onMouseDown={(e) => e.preventDefault()}
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
            transform: 'translateX(-50%)',
            willChange: 'top, left, transform'
          }}
          role="toolbar"
          aria-label="Text Formatting"
        >
          <div className="flex space-x-1 items-center">
            {contextName && (
              <>
                <div className="text-[10px] uppercase tracking-wider text-neutral-500 font-sans pl-2 pr-3 border-r border-neutral-700/50 py-1 whitespace-nowrap">
                  Editing: <span className="text-neutral-300 font-medium ml-1">{contextName}</span>
                </div>
              </>
            )}
            {activeTools}
          </div>
          
          {/* Triangle pointer */}
          <div 
            className={`absolute w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent transition-all duration-150 ${
              position.placement === 'top' 
                ? '-bottom-[6px] border-t-[6px] border-t-neutral-900 border-b-0' 
                : '-top-[6px] border-b-[6px] border-b-neutral-900 border-t-0'
            }`}
            style={{ 
              left: `calc(50% + ${position.xOffset}px)`,
              transform: 'translateX(-50%)'
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
