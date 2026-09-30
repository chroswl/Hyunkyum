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
  singleLine?: boolean;
}

export function InlineEditor({
  id,
  initialValue,
  as: Component = 'span',
  className = '',
  wrapperClassName = 'inline-block',
  placeholder = 'Add text...',
  readonly = false,
  toolbarTools = ['bold', 'italic', 'fontSize', 'separator', 'link'],
  displayValue,
  contextName,
  singleLine = false
}: InlineEditorProps) {
  const [value, setValue, dirty] = useEditable<string>(id, initialValue);
  const [isEditing, setIsEditing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const elementRef = useRef<HTMLElement>(null);
  const lastCommittedValue = useRef<string>(value);
  const lastSeenValueRef = useRef<string>(value);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const isInternalInput = useRef(false);

  // Keep the DOM synchronized when value changes from outside (e.g. language switch, undo/redo)
  useEffect(() => {
    if (elementRef.current) {
      if (isInternalInput.current) {
        isInternalInput.current = false;
        return;
      }
      if (value !== lastSeenValueRef.current) {
        elementRef.current.innerHTML = value || '';
        lastSeenValueRef.current = value || '';
        lastCommittedValue.current = value || '';
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

  const handleFocus = () => {
    if (readonly) return;
    setIsEditing(true);
    lastCommittedValue.current = value;
    // Clear placeholder text if previously empty
    if (elementRef.current && (!value || value.trim() === '')) {
      if (elementRef.current.innerHTML === placeholder) {
        elementRef.current.innerHTML = '';
      }
    }
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
      if (!text || text.trim() === '' || text === '<br>') {
        elementRef.current.innerHTML = placeholder || '';
      }
    }
  };

  const handleBlur = (e: React.FocusEvent) => {
    // If blur was caused by clicking into the toolbar or its dropdowns, ignore
    const related = e.relatedTarget as HTMLElement | null;
    if (related && (
      related.closest('[role="toolbar"]') ||
      related.closest('.floating-toolbar-portal') ||
      related.closest('.floating-toolbar-dropdown')
    )) {
      return;
    }
    finishEditing();
  };

  const cancelEditing = () => {
    setIsEditing(false);
    if (elementRef.current) {
      elementRef.current.innerHTML = lastCommittedValue.current || '';
      lastSeenValueRef.current = lastCommittedValue.current;
    }
  };

  const handleInput = () => {
    if (elementRef.current) {
      const text = elementRef.current.innerHTML;
      lastSeenValueRef.current = text;
      isInternalInput.current = true;

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
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      cancelEditing();
      elementRef.current?.blur();
      return;
    }

    if (e.key === 'Enter') {
      if (singleLine) {
        e.preventDefault();
        finishEditing();
        elementRef.current?.blur();
        return;
      }
      // For multiline (Biography, paragraphs, etc.):
      // DO NOT preventDefault! Let browser insert paragraph/line break natively at cursor position.
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text/plain');
    if (text) {
      e.preventDefault();
      // Insert plain text at the current caret position, preserving line breaks
      const success = document.execCommand('insertText', false, text);
      if (!success) {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          range.deleteContents();
          const lines = text.split(/\r\n|\r|\n/);
          const frag = document.createDocumentFragment();
          lines.forEach((line, idx) => {
            if (idx > 0) {
              frag.appendChild(document.createElement('br'));
            }
            if (line) {
              frag.appendChild(document.createTextNode(line));
            }
          });
          const lastNode = frag.lastChild;
          range.insertNode(frag);
          if (lastNode) {
            range.setStartAfter(lastNode);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
          }
        }
      }
      handleInput();
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
    >
      <Component
        ref={elementRef}
        contentEditable={!readonly}
        suppressContentEditableWarning
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        onPaste={handlePaste}
        className={`outline-none min-w-[20px] min-h-[1em] ${className} ${isEmpty && !readonly ? 'text-neutral-500 italic opacity-50' : ''}`}
        style={{ cursor: readonly ? 'default' : 'text' }}
        dangerouslySetInnerHTML={
          !isEditing
            ? {
                __html: isEmpty 
                  ? (placeholder || '') 
                  : (displayValue ? displayValue(value || '') : (value || ''))
              }
            : undefined
        }
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
        <div 
          className="absolute -top-3 -right-3 p-1 bg-neutral-800 border border-neutral-700 rounded-full shadow-lg z-10 cursor-pointer pointer-events-auto"
          onClick={(e) => {
            e.stopPropagation();
            if (elementRef.current) {
              elementRef.current.focus();
            }
          }}
          title="Click to edit"
        >
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
