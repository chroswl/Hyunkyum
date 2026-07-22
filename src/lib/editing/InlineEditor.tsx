import { FloatingToolbar } from "../../components/admin/FloatingToolbar";
import React, { useState, useRef, useEffect } from 'react';
import { useEditable } from '../../contexts/EditingContext';
import { Edit3 } from 'lucide-react';

interface InlineEditorProps {
  key?: React.Key;
  id: string;
  initialValue: string;
  as?: React.ElementType;
  className?: string;
  wrapperClassName?: string;
  placeholder?: string;
  readonly?: boolean;
  toolbarTools?: string[];
  displayValue?: (value: string) => string;
  contextName?: string;
}

export function InlineEditor({
  id,
  initialValue,
  as: Component = 'span',
  className = '',
  wrapperClassName = 'inline-block',
  placeholder = 'Add text...',
  readonly = false,
  toolbarTools = ['bold', 'italic', 'separator', 'link'],
  displayValue,
  contextName
}: InlineEditorProps) {
  const [value, setValue, dirty] = useEditable<string>(id, initialValue);
  const [isEditing, setIsEditing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const elementRef = useRef<HTMLElement>(null);
  const lastCommittedValue = useRef<string>(value);
  const lastSeenValueRef = useRef<string>(value);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  // Keep the DOM synchronized when value changes from outside (e.g. undo/redo)
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

  const derivedContextName = contextName || (() => {
    if (id.startsWith('bio.')) return 'Biography';
    if (id.startsWith('theme.hero')) return 'Hero';
    if (id.startsWith('theme.footer')) return 'Footer';
    if (id.startsWith('contact.')) return 'Contact';
    if (id.startsWith('gallery.')) return 'Archive';
    if (id.startsWith('videos.')) return 'Performances';
    if (id.startsWith('schedule.')) return 'Upcoming';
    if (id.startsWith('press.')) return 'Press';
    return 'Text';
  })();

  const startEditing = () => {
    if (readonly) return;
    setIsEditing(true);
    lastCommittedValue.current = value;
    lastSeenValueRef.current = value;
    if (elementRef.current) {
      elementRef.current.innerHTML = value || '';
    }
    // Focus happens automatically if we use click, but we can ensure caret is placed
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
      const text = elementRef.current.innerHTML;
      if (text !== lastCommittedValue.current) {
        setValue(text, true); // Push to history
        lastSeenValueRef.current = text;
        lastCommittedValue.current = text;
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
    if (e.key === 'Enter') {
      e.preventDefault();
      finishEditing();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEditing();
    }
  };

  const isEmpty = !value && !isEditing;

  return (
    <div 
      className={`relative transition-all duration-300 ${wrapperClassName} ${
        isEditing 
          ? 'ring-1 ring-[#C9A227]/60 rounded-sm bg-[#C9A227]/5 shadow-[0_0_15px_rgba(201,162,39,0.1)]' 
          : (isHovered && !readonly)
            ? 'ring-1 ring-white/20 rounded-sm cursor-text' 
            : ''
      }`}
      onMouseEnter={() => !readonly && !isEditing && setIsHovered(true)}
      onMouseLeave={() => !readonly && !isEditing && setIsHovered(false)}
      onClick={(e) => {
        if (!readonly && !isEditing) {
          e.stopPropagation();
          startEditing();
        }
      }}
    >
      <Component
        ref={elementRef}
        contentEditable={!readonly && isEditing}
        suppressContentEditableWarning
        onBlur={finishEditing}
        onKeyDown={handleKeyDown}
        onInput={() => {
          if (elementRef.current) {
            const text = elementRef.current.innerHTML;
            lastSeenValueRef.current = text;

            if (debounceTimeout.current) {
              clearTimeout(debounceTimeout.current);
            }
            debounceTimeout.current = setTimeout(() => {
              if (text !== lastCommittedValue.current) {
                setValue(text, true);
                lastCommittedValue.current = text;
              }
            }, 500);
          }
        }}
        className={`outline-none min-w-[20px] min-h-[1em] ${className} ${isEmpty && !readonly ? 'text-neutral-500 italic opacity-50' : ''}`}
        style={{ cursor: readonly ? 'default' : (isEditing ? 'text' : 'pointer') }}
        dangerouslySetInnerHTML={{
          __html: isEditing 
            ? lastSeenValueRef.current 
            : (isEmpty ? placeholder : (displayValue ? displayValue(value || '') : (value || '')))
        }}
      />

      {/* Floating Toolbar */}
      <FloatingToolbar 
        isOpen={isEditing} 
        targetRef={elementRef as React.RefObject<HTMLElement>} 
        tools={toolbarTools} 
        contextName={derivedContextName}
      />

      {/* Hover Edit Icon */}
      {!readonly && !isEditing && isHovered && (
        <div className="absolute -top-3 -right-3 p-1 bg-neutral-800 border border-neutral-700 rounded-full shadow-lg z-10">
          <Edit3 className="w-3 h-3 text-neutral-400" />
        </div>
      )}

      {/* Dirty Indicator */}
      {!readonly && !isEditing && dirty && (
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#C9A227] rounded-full shadow-sm shadow-black z-10" title="Unsaved changes" />
      )}
    </div>
  );
}
