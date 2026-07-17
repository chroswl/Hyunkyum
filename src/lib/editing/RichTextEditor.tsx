import React, { useState, useRef, useEffect } from 'react';
import { useEditable } from '../../contexts/EditingContext';
import { Bold, Italic, Link as LinkIcon } from 'lucide-react';

interface RichTextEditorProps {
  id: string;
  initialValue: string;
  className?: string;
  placeholder?: string;
}

export function RichTextEditor({
  id,
  initialValue,
  className = '',
  placeholder = 'Add text...'
}: RichTextEditorProps) {
  const [value, setValue, dirty] = useEditable<string>(id, initialValue);
  const [isEditing, setIsEditing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  const lastCommittedValue = useRef<string>(value);
  const lastSeenValueRef = useRef<string>(value);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  // Sync content when value changes externally (e.g. undo/redo)
  useEffect(() => {
    if (elementRef.current) {
      if (value !== lastSeenValueRef.current) {
        elementRef.current.innerHTML = value || '';
        lastSeenValueRef.current = value;
      }
    }
  }, [value]);

  useEffect(() => {
    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, []);

  const startEditing = () => {
    setIsEditing(true);
    lastCommittedValue.current = value;
    lastSeenValueRef.current = value;
    if (elementRef.current) {
      elementRef.current.innerHTML = value || '';
    }
    setTimeout(() => {
      if (elementRef.current) {
        elementRef.current.focus();
      }
    }, 0);
  };

  const finishEditing = () => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    setIsEditing(false);
    if (elementRef.current) {
      const html = elementRef.current.innerHTML;
      if (html !== lastCommittedValue.current) {
        setValue(html, true);
        lastSeenValueRef.current = html;
        lastCommittedValue.current = html;
      }
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
    if (elementRef.current) {
      elementRef.current.innerHTML = lastCommittedValue.current || '';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      cancelEditing();
    }
    // Note: Enter naturally adds new lines in contentEditable, so we let it happen.
  };

  const executeCommand = (command: string, arg?: string) => {
    document.execCommand(command, false, arg);
    if (elementRef.current) {
      elementRef.current.focus();
    }
  };

  const isEmpty = !value && !isEditing;

  return (
    <div 
      className={`relative transition-all ${className} ${
        isEditing 
          ? 'ring-2 ring-[#C9A227] rounded-sm ring-offset-4 ring-offset-neutral-900 bg-neutral-900/50' 
          : isHovered 
            ? 'ring-1 ring-white/20 rounded-sm ring-offset-4 ring-offset-neutral-900 cursor-text' 
            : ''
      }`}
      onMouseEnter={() => !isEditing && setIsHovered(true)}
      onMouseLeave={() => !isEditing && setIsHovered(false)}
      onClick={(e) => {
        if (!isEditing) {
          e.stopPropagation();
          startEditing();
        }
      }}
    >
      {/* Floating Toolbar */}
      {isEditing && (
        <div className="absolute -top-12 left-0 flex items-center space-x-1 bg-neutral-800 border border-neutral-700 p-1 rounded shadow-xl z-20">
          <button 
            onMouseDown={(e) => { e.preventDefault(); executeCommand('bold'); }}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-700 rounded"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button 
            onMouseDown={(e) => { e.preventDefault(); executeCommand('italic'); }}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-700 rounded"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button 
            onMouseDown={(e) => { 
              e.preventDefault(); 
              const url = prompt('Enter URL:');
              if (url) executeCommand('createLink', url);
            }}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-700 rounded"
          >
            <LinkIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      <div
        ref={elementRef}
        contentEditable={isEditing}
        suppressContentEditableWarning
        onBlur={(e) => {
          // Avoid blurring when clicking toolbar buttons
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            finishEditing();
          }
        }}
        onInput={() => {
          if (elementRef.current) {
            const html = elementRef.current.innerHTML;
            lastSeenValueRef.current = html;

            if (debounceTimeout.current) {
              clearTimeout(debounceTimeout.current);
            }
            debounceTimeout.current = setTimeout(() => {
              if (html !== lastCommittedValue.current) {
                setValue(html, true);
                lastCommittedValue.current = html;
              }
            }, 500);
          }
        }}
        onKeyDown={handleKeyDown}
        className={`outline-none min-h-[3em] p-2 -m-2 ${isEmpty ? 'text-neutral-500 italic opacity-50' : ''}`}
        style={{ cursor: isEditing ? 'text' : 'pointer' }}
        dangerouslySetInnerHTML={{
          __html: isEditing 
            ? lastSeenValueRef.current 
            : (isEmpty ? placeholder : value)
        }}
      />

      {/* Dirty Indicator */}
      {!isEditing && dirty && (
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#C9A227] rounded-full shadow-sm shadow-black z-10" title="Unsaved changes" />
      )}
    </div>
  );
}
