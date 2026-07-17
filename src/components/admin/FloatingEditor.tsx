import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface FloatingEditorProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function FloatingEditor({ isOpen, onClose, title, children }: FloatingEditorProps) {
  // Prevent body scroll when panel is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90]"
          />
          
          {/* Panel */}
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-[400px] md:w-[480px] bg-neutral-950 border-l border-white/10 z-[100] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-neutral-900/50">
              <h3 className="text-sm font-sans tracking-widest uppercase font-semibold text-[#C9A227]">
                {title}
              </h3>
              <button
                onClick={onClose}
                className="p-2 -mr-2 text-neutral-400 hover:text-white hover:bg-white/5 rounded-sm transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
