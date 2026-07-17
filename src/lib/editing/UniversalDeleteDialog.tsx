import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';

interface UniversalDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  itemName?: string;
}

export function UniversalDeleteDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete Item",
  description = "Are you sure you want to delete",
  itemName = "this item"
}: UniversalDeleteDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl p-6 w-full max-w-sm"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3 text-red-500">
                <div className="p-2 bg-red-500/10 rounded-full">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-medium text-white">{title}</h3>
              </div>
              <button 
                onClick={onClose}
                className="text-neutral-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-neutral-400 mb-6">
              {description} <strong className="text-white">"{itemName}"</strong>? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-neutral-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className="px-4 py-2 text-sm font-medium bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
