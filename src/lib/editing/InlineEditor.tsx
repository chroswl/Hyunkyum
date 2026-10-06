import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { FloatingToolbar } from '../../components/admin/FloatingToolbar';
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

function isContentEmpty(html: string | null | undefined): boolean {
  if (!html) return true;
  const stripped = html
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim();
  if (stripped.length > 0) return false;
  // If there are void media elements, it is not considered empty
  if (/<(img|iframe|video|audio|table|svg)[^>]*>/i.test(html)) return false;
  return true;
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
  singleLine = false,
}: InlineEditorProps) {
  const [value, setValue, dirty] = useEditable<string>(id, initialValue);
  const [isEditing, setIsEditing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Stable DOM element reference - NEVER recreated
  const elementRef = useRef<HTMLElement>(null);

  // Guard refs to decouple React render cycle from active contentEditable DOM
  const isEditingRef = useRef(false);
  const lastKnownHtmlRef = useRef<string>(value || '');
  const lastCommittedValueRef = useRef<string>(value || '');
  const isInternalInputRef = useRef(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevIdRef = useRef(id);

  // Populate DOM on initial mount before paint
  useLayoutEffect(() => {
    if (elementRef.current) {
      const valToSet = value || '';
      const empty = isContentEmpty(valToSet);
      const targetHtml = empty && !isEditingRef.current
        ? (placeholder || '')
        : (displayValue ? displayValue(valToSet) : valToSet);

      elementRef.current.innerHTML = targetHtml;
      lastKnownHtmlRef.current = valToSet;
      lastCommittedValueRef.current = valToSet;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Synchronize when ID changes (e.g. language switch EN -> DE -> KO)
  useLayoutEffect(() => {
    if (!elementRef.current) return;

    const isIdChanged = prevIdRef.current !== id;
    if (isIdChanged) {
      prevIdRef.current = id;
      const valToSet = value || '';
      const empty = isContentEmpty(valToSet);
      const targetHtml = empty && !isEditingRef.current
        ? (placeholder || '')
        : (displayValue ? displayValue(valToSet) : valToSet);

      elementRef.current.innerHTML = targetHtml;
      lastKnownHtmlRef.current = valToSet;
      lastCommittedValueRef.current = valToSet;
    }
  }, [id, value, placeholder, displayValue]);

  // Synchronize when value changes externally (e.g. Undo/Redo, external state load)
  useEffect(() => {
    if (!elementRef.current) return;

    // Skip DOM overwrite if this change was triggered by our own typing
    if (isInternalInputRef.current) {
      isInternalInputRef.current = false;
      return;
    }

    // While user is actively typing, NEVER overwrite DOM from React state
    // unless it came from an external operation (like global undo/redo)
    if (isEditingRef.current) {
      if (value !== lastKnownHtmlRef.current) {
        elementRef.current.innerHTML = value || '';
        lastKnownHtmlRef.current = value || '';
        lastCommittedValueRef.current = value || '';
      }
      return;
    }

    // When NOT actively editing, synchronize if value differs from what is committed
    if (value !== lastCommittedValueRef.current) {
      const valToSet = value || '';
      const empty = isContentEmpty(valToSet);
      const targetHtml = empty
        ? (placeholder || '')
        : (displayValue ? displayValue(valToSet) : valToSet);

      elementRef.current.innerHTML = targetHtml;
      lastKnownHtmlRef.current = valToSet;
      lastCommittedValueRef.current = valToSet;
    }
  }, [value, placeholder, displayValue]);

  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
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
    isEditingRef.current = true;
    lastCommittedValueRef.current = value || '';

    // If editor was displaying empty placeholder text, clear it so user starts typing cleanly
    if (elementRef.current && isContentEmpty(value)) {
      elementRef.current.innerHTML = '';
      lastKnownHtmlRef.current = '';
    }
    // CRITICAL: When value already contains content, DO NOT modify innerHTML.
    // The browser's native event has already placed the cursor precisely where clicked.
  };

  const handleInput = useCallback(() => {
    if (!elementRef.current) return;

    const currentHtml = elementRef.current.innerHTML;
    lastKnownHtmlRef.current = currentHtml;
    isInternalInputRef.current = true;

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      if (currentHtml !== lastCommittedValueRef.current) {
        setValue(currentHtml, true);
        lastCommittedValueRef.current = currentHtml;
      }
    }, 400);
  }, [setValue]);

  const finishEditing = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
    setIsEditing(false);
    isEditingRef.current = false;

    if (elementRef.current) {
      const currentHtml = elementRef.current.innerHTML;
      const empty = isContentEmpty(currentHtml);

      if (empty) {
        if (lastCommittedValueRef.current !== '') {
          setValue('', true);
          lastCommittedValueRef.current = '';
        }
        elementRef.current.innerHTML = placeholder || '';
        lastKnownHtmlRef.current = '';
      } else {
        if (currentHtml !== lastCommittedValueRef.current) {
          setValue(currentHtml, true);
          lastCommittedValueRef.current = currentHtml;
        }
        lastKnownHtmlRef.current = currentHtml;
      }
    }
  }, [placeholder, setValue]);

  const cancelEditing = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
    setIsEditing(false);
    isEditingRef.current = false;

    if (elementRef.current) {
      const val = lastCommittedValueRef.current || '';
      const empty = isContentEmpty(val);
      elementRef.current.innerHTML = empty ? (placeholder || '') : val;
      lastKnownHtmlRef.current = val;
    }
  }, [placeholder]);

  const handleBlur = (e: React.FocusEvent) => {
    // If blur was caused by clicking into the floating toolbar or any dropdowns, ignore blur
    const related = e.relatedTarget as HTMLElement | null;
    if (
      related &&
      (related.closest('[role="toolbar"]') ||
        related.closest('.floating-toolbar-portal') ||
        related.closest('.floating-toolbar-dropdown'))
    ) {
      return;
    }
    finishEditing();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      cancelEditing();
      elementRef.current?.blur();
      return;
    }

    if ((e.metaKey || e.ctrlKey) && (e.key === 'b' || e.key === 'B' || e.key === 'i' || e.key === 'I')) {
      // Allow native browser formatting shortcut and immediately sync internal input state
      setTimeout(() => {
        handleInput();
      }, 10);
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
      // Surrounding content remains completely intact.
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    if (!text) return;

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const range = sel.getRangeAt(0);
    range.deleteContents();

    if (singleLine) {
      // Clean single line text
      const cleanText = text.replace(/[\r\n]+/g, ' ');
      const textNode = document.createTextNode(cleanText);
      range.insertNode(textNode);
      range.setStartAfter(textNode);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    } else {
      // Multiline: parse plain text lines and create clean DOM fragment with text nodes and <br>
      const lines = text.split(/\r\n|\r|\n/);
      const fragment = document.createDocumentFragment();
      let lastNode: Node | null = null;

      lines.forEach((line, index) => {
        if (index > 0) {
          const br = document.createElement('br');
          fragment.appendChild(br);
          lastNode = br;
        }
        if (line.length > 0) {
          const textNode = document.createTextNode(line);
          fragment.appendChild(textNode);
          lastNode = textNode;
        }
      });

      if (fragment.childNodes.length > 0) {
        range.insertNode(fragment);
        if (lastNode) {
          range.setStartAfter(lastNode);
          range.collapse(true);
          sel.removeAllRanges();
          sel.addRange(range);
        }
      }
    }

    handleInput();
  };

  const isDisplayEmpty = isContentEmpty(value) && !isEditing;

  return (
    <div
      className={`relative transition-all duration-300 ${wrapperClassName} ${
        isEditing
          ? 'ring-1 ring-[#C9A227]/60 rounded-sm bg-[#C9A227]/5 shadow-[0_0_15px_rgba(201,162,39,0.1)]'
          : isHovered && !readonly
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
        className={`outline-none min-w-[20px] min-h-[1em] ${className} ${
          isDisplayEmpty && !readonly ? 'text-neutral-500 italic opacity-50' : ''
        }`}
        style={{
          cursor: readonly ? 'default' : 'text',
          whiteSpace: singleLine ? 'normal' : 'pre-wrap',
          wordBreak: 'break-word',
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
        <div
          className="absolute -top-1 -right-1 w-2 h-2 bg-[#C9A227] rounded-full shadow-sm shadow-black z-10"
          title="Unsaved changes"
        />
      )}
    </div>
  );
}
