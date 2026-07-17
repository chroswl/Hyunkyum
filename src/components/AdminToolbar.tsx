import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, LogOut, Save, X, Undo2, Redo2, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { auth } from '../firebase';
import { useEditing } from '../contexts/EditingContext';

export default function AdminToolbar() {
  const { status, canUndo, canRedo, saveChanges, cancelChanges, undo, redo } = useEditing();

  return (
    <motion.div 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-wrap justify-center items-center bg-neutral-900/95 backdrop-blur-md border border-neutral-800 rounded-2xl sm:rounded-full shadow-2xl px-2 sm:px-4 py-2 gap-2 sm:gap-3 w-[calc(100vw-1rem)] sm:w-auto max-w-[500px]"
    >
      <div className="flex items-center space-x-2 text-white px-2 min-h-[40px]">
        {status === 'saving' ? (
          <Loader2 className="w-4 h-4 text-[#C9A227] animate-spin" />
        ) : status === 'saved' ? (
          <CheckCircle2 className="w-4 h-4 text-green-500" />
        ) : status === 'error' ? (
          <AlertCircle className="w-4 h-4 text-red-500" />
        ) : (
          <ShieldCheck className="w-4 h-4 text-[#C9A227]" />
        )}
        <span className="text-[10px] tracking-widest uppercase font-medium">
          {status === 'saving' ? 'Saving...' : 
           status === 'saved' ? 'Saved' : 
           status === 'error' ? 'Error' : 
           status === 'unsaved' ? 'Unsaved Changes' : 
           status === 'editing' ? 'Editing...' : 'Admin Mode'}
        </span>
        {status === 'idle' && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse ml-2" />}
        {status === 'unsaved' && <span className="w-1.5 h-1.5 rounded-full bg-[#C9A227] animate-pulse ml-2" />}
      </div>
      
      <div className="hidden sm:block w-[1px] h-4 bg-neutral-700 mx-1" />

      <div className="flex items-center space-x-1">
        <button 
          onClick={undo}
          disabled={!canUndo}
          className={`p-2 sm:p-1.5 rounded-full transition-colors flex items-center justify-center min-w-[40px] min-h-[40px] sm:min-w-0 sm:min-h-0 ${canUndo ? 'text-neutral-300 hover:text-white hover:bg-white/10' : 'text-neutral-600 cursor-not-allowed'}`}
          title="Undo"
        >
          <Undo2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
        </button>
        <button 
          onClick={redo}
          disabled={!canRedo}
          className={`p-2 sm:p-1.5 rounded-full transition-colors flex items-center justify-center min-w-[40px] min-h-[40px] sm:min-w-0 sm:min-h-0 ${canRedo ? 'text-neutral-300 hover:text-white hover:bg-white/10' : 'text-neutral-600 cursor-not-allowed'}`}
          title="Redo"
        >
          <Redo2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
        </button>
      </div>

      <AnimatePresence>
        {(status === 'unsaved' || status === 'error') && (
          <motion.div 
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            className="flex items-center justify-center gap-2 overflow-hidden whitespace-nowrap w-full sm:w-auto mt-1 sm:mt-0"
          >
            <div className="hidden sm:block w-[1px] h-4 bg-neutral-700 mx-1" />
            
            <button 
              onClick={cancelChanges}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-4 sm:px-3 py-2.5 sm:py-1.5 rounded-full text-neutral-300 hover:text-white hover:bg-white/10 transition-colors bg-white/5 sm:bg-transparent min-h-[40px]"
            >
              <X className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
              <span className="text-[11px] sm:text-[10px] tracking-wider uppercase font-medium">Cancel</span>
            </button>

            <button 
              onClick={saveChanges}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-4 sm:px-3 py-2.5 sm:py-1.5 rounded-full bg-[#C9A227] text-black hover:bg-[#ebd04e] transition-colors shadow-lg min-h-[40px]"
            >
              <Save className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
              <span className="text-[11px] sm:text-[10px] tracking-wider uppercase font-medium">Save</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
      {status === 'idle' && (
        <>
          <div className="hidden sm:block w-[1px] h-4 bg-neutral-700 mx-1" />
          <button 
            onClick={() => auth.signOut()}
            className="flex items-center justify-center space-x-1.5 text-neutral-400 hover:text-white transition-colors px-4 sm:px-2 min-h-[40px]"
          >
            <span className="text-[11px] sm:text-[10px] tracking-wider uppercase">Exit</span>
            <LogOut className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
          </button>
        </>
      )}
    </motion.div>
  );
}
