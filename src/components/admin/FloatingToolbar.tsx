import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Bold, Italic, Link2, ChevronDown, Type, ALargeSmall } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FloatingToolbarProps {
  isOpen: boolean;
  targetRef: React.RefObject<HTMLElement>;
  tools?: string[];
  contextName?: string;
}

const FONT_SIZES = [
  { label: 'Default', value: 'inherit', sub: 'Reset' },
  { label: '12px', value: '12px', sub: 'Small' },
  { label: '14px', value: '14px', sub: 'Compact' },
  { label: '16px', value: '16px', sub: 'Body' },
  { label: '18px', value: '18px', sub: 'Medium' },
  { label: '20px', value: '20px', sub: 'Large' },
  { label: '24px', value: '24px', sub: 'XL' },
  { label: '28px', value: '28px', sub: '2XL' },
  { label: '32px', value: '32px', sub: '3XL' },
];

function isRangeInsideTarget(range: Range | null | undefined, target: HTMLElement | null | undefined): boolean {
  if (!target || !range) return false;
  try {
    const ancestor = range.commonAncestorContainer;
    if (ancestor === target || target.contains(ancestor)) {
      return true;
    }
    if (target.contains(range.startContainer) && target.contains(range.endContainer)) {
      return true;
    }
  } catch (e) {
    return false;
  }
  return false;
}

function expandRangeToWord(range: Range): Range {
  let node: Node | null = range.startContainer;
  let offset = range.startOffset;

  // If node is an element node, find the relevant text child node
  if (node && node.nodeType === Node.ELEMENT_NODE) {
    const el = node as HTMLElement;
    if (el.childNodes.length > 0) {
      if (offset < el.childNodes.length && el.childNodes[offset].nodeType === Node.TEXT_NODE) {
        node = el.childNodes[offset];
        offset = 0;
      } else if (offset > 0 && el.childNodes[offset - 1].nodeType === Node.TEXT_NODE) {
        node = el.childNodes[offset - 1];
        offset = (node.textContent || '').length;
      } else {
        const textChild = document.createTreeWalker(el, NodeFilter.SHOW_TEXT).nextNode();
        if (textChild) {
          node = textChild;
          offset = 0;
        }
      }
    }
  }

  if (node && node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent || '';
    if (text.length > 0) {
      let start = Math.min(Math.max(offset, 0), text.length);
      let end = Math.min(Math.max(offset, 0), text.length);

      // If at end of word or whitespace, adjust if preceding character is non-whitespace
      if (start > 0 && (start === text.length || /\s/.test(text[start]))) {
        if (!/\s/.test(text[start - 1])) {
          start--;
          end = start;
        }
      }

      while (start > 0 && !/\s/.test(text[start - 1])) {
        start--;
      }
      while (end < text.length && !/\s/.test(text[end])) {
        end++;
      }

      if (end > start) {
        const expanded = document.createRange();
        expanded.setStart(node, start);
        expanded.setEnd(node, end);
        return expanded;
      }
    }
  }
  return range;
}

export function FloatingToolbar({ isOpen, targetRef, tools = ['bold', 'italic', 'link'], contextName }: FloatingToolbarProps) {
  const [position, setPosition] = useState<{ top: number; left: number; placement: 'top' | 'bottom'; xOffset: number } | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isFontSizeOpen, setIsFontSizeOpen] = useState(false);
  const [activeFontSize, setActiveFontSize] = useState<string | null>(null);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const fontSizeContainerRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);

  const detectIsBold = (): boolean => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !targetRef.current) return false;
    const range = sel.getRangeAt(0);
    if (!isRangeInsideTarget(range, targetRef.current)) return false;

    // 1. Check if common ancestor or node within targetRef is explicitly inside <b>, <strong>, or has bold style
    let node: Node | null = range.commonAncestorContainer;
    if (node && node.nodeType === Node.TEXT_NODE) node = node.parentNode;

    while (node && node !== targetRef.current && targetRef.current.contains(node)) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        const tag = el.tagName.toLowerCase();
        if (tag === 'b' || tag === 'strong') return true;
        const styleWeight = el.style.fontWeight;
        if (styleWeight === 'bold' || styleWeight === '700' || styleWeight === '800' || styleWeight === '900') return true;
        if (styleWeight === 'normal' || styleWeight === '400' || styleWeight === '300') return false;
      }
      node = node.parentNode;
    }

    // 2. If range is not collapsed, check if any bold elements exist within range contents
    if (!range.collapsed) {
      try {
        const fragment = range.cloneContents();
        if (fragment.querySelector('b, strong, [style*="font-weight: bold"], [style*="font-weight:bold"], [style*="font-weight: 700"], [style*="font-weight:700"]')) {
          return true;
        }
      } catch (e) {}
    }

    // 3. Fallback to queryCommandState only if targetRef itself is not inherently styled with semibold/bold
    try {
      if (document.queryCommandState('bold')) {
        const targetComputed = window.getComputedStyle(targetRef.current).fontWeight;
        const targetWeightNum = parseInt(targetComputed, 10) || 400;
        if (targetWeightNum < 600) {
          return true;
        }
      }
    } catch (e) {}

    return false;
  };

  const detectIsItalic = (): boolean => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !targetRef.current) return false;
    const range = sel.getRangeAt(0);
    if (!isRangeInsideTarget(range, targetRef.current)) return false;

    let node: Node | null = range.commonAncestorContainer;
    if (node && node.nodeType === Node.TEXT_NODE) node = node.parentNode;

    while (node && node !== targetRef.current && targetRef.current.contains(node)) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        const tag = el.tagName.toLowerCase();
        if (tag === 'i' || tag === 'em') return true;
        const styleStyle = el.style.fontStyle;
        if (styleStyle === 'italic') return true;
        if (styleStyle === 'normal') return false;
      }
      node = node.parentNode;
    }

    if (!range.collapsed) {
      try {
        const fragment = range.cloneContents();
        if (fragment.querySelector('i, em, [style*="font-style: italic"], [style*="font-style:italic"]')) {
          return true;
        }
      } catch (e) {}
    }

    try {
      if (document.queryCommandState('italic')) return true;
    } catch (e) {}

    return false;
  };

  const detectCurrentFontSize = (): string | null => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    const range = sel.getRangeAt(0);
    const node = range.startContainer;
    if (!node) return null;
    const el = node.nodeType === Node.ELEMENT_NODE ? (node as HTMLElement) : node.parentElement;
    if (!el) return null;
    const styledEl = el.closest('[style*="font-size"]') as HTMLElement | null;
    if (styledEl && styledEl.style.fontSize) {
      return styledEl.style.fontSize;
    }
    return null;
  };

  const saveSelection = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (targetRef.current && isRangeInsideTarget(range, targetRef.current)) {
      savedRangeRef.current = range.cloneRange();
    }
  };

  const restoreSelection = (): Range | null => {
    if (!targetRef.current) return null;
    const sel = window.getSelection();
    if (!sel) return null;

    // Check if active selection in window is already inside targetRef
    if (sel.rangeCount > 0) {
      const currentRange = sel.getRangeAt(0);
      if (isRangeInsideTarget(currentRange, targetRef.current)) {
        savedRangeRef.current = currentRange.cloneRange();
        return currentRange;
      }
    }

    // Otherwise restore from savedRangeRef
    if (savedRangeRef.current && isRangeInsideTarget(savedRangeRef.current, targetRef.current)) {
      try {
        sel.removeAllRanges();
        sel.addRange(savedRangeRef.current);
        return savedRangeRef.current;
      } catch (err) {
        console.warn('Could not restore selection range:', err);
      }
    }

    return null;
  };

  const prepareExecution = (): Range | null => {
    if (!targetRef.current) return null;

    // 1. Restore range first so we maintain the exact selection
    const range = restoreSelection();
    if (!range) return null;

    // 2. Ensure targetRef is focused without resetting selection
    if (document.activeElement !== targetRef.current && !targetRef.current.contains(document.activeElement)) {
      try {
        targetRef.current.focus({ preventScroll: true });
      } catch (e) {
        // ignore
      }
    }

    // 3. Ensure window.getSelection has this range
    const sel = window.getSelection();
    if (sel) {
      try {
        sel.removeAllRanges();
        sel.addRange(range);
      } catch (e) {
        // ignore
      }
    }

    return range;
  };

  // Keep savedRangeRef continuously in sync whenever user selects text
  useEffect(() => {
    if (!isOpen) return;

    const handleSelectionChange = () => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      const range = sel.getRangeAt(0);
      
      if (targetRef.current && isRangeInsideTarget(range, targetRef.current)) {
        savedRangeRef.current = range.cloneRange();
        if (!range.collapsed) {
          const detected = detectCurrentFontSize();
          if (detected) {
            setActiveFontSize(detected);
          }
        }
        setIsBold(detectIsBold());
        setIsItalic(detectIsItalic());
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [isOpen, targetRef]);

  // Clean up selection when toolbar closes
  useEffect(() => {
    if (!isOpen) {
      savedRangeRef.current = null;
      setIsDropdownOpen(false);
      setIsFontSizeOpen(false);
      setActiveFontSize(null);
      setIsBold(false);
      setIsItalic(false);
    }
  }, [isOpen]);

  const toggleBold = () => {
    const range = prepareExecution();
    if (!range || !targetRef.current) return;

    let activeRange = range;
    if (activeRange.collapsed) {
      const expanded = expandRangeToWord(activeRange);
      if (expanded && !expanded.collapsed) {
        activeRange = expanded;
        const sel = window.getSelection();
        if (sel) {
          try {
            sel.removeAllRanges();
            sel.addRange(activeRange);
          } catch (e) {}
        }
      }
    }

    const wasBold = detectIsBold();
    const targetEl = targetRef.current;

    try {
      document.execCommand('styleWithCSS', false, 'false');
    } catch (e) {}

    try {
      document.execCommand('bold', false, undefined);
    } catch (e) {}

    const nowBold = detectIsBold();

    // Direct DOM fallback if execCommand failed to toggle state cleanly
    if (wasBold && nowBold && targetEl) {
      // Unbold fallback: remove b or strong tags in selection or ancestor
      try {
        let ancestor: Node | null = activeRange.commonAncestorContainer;
        if (ancestor.nodeType === Node.TEXT_NODE) ancestor = ancestor.parentNode;
        while (ancestor && ancestor !== targetEl && targetEl.contains(ancestor)) {
          if (ancestor.nodeType === Node.ELEMENT_NODE) {
            const el = ancestor as HTMLElement;
            const tag = el.tagName.toLowerCase();
            if (tag === 'b' || tag === 'strong') {
              const parent = el.parentNode;
              if (parent) {
                while (el.firstChild) {
                  parent.insertBefore(el.firstChild, el);
                }
                parent.removeChild(el);
              }
              break;
            } else if (el.style.fontWeight) {
              el.style.fontWeight = '';
            }
          }
          ancestor = ancestor.parentNode;
        }
      } catch (e) {
        console.warn('Fallback unbold error:', e);
      }
    } else if (!wasBold && !nowBold && targetEl && !activeRange.collapsed) {
      // Bold fallback: wrap in <b>
      try {
        const b = document.createElement('b');
        b.style.fontWeight = '700';
        const fragment = activeRange.extractContents();
        b.appendChild(fragment);
        activeRange.insertNode(b);
        const newRange = document.createRange();
        newRange.selectNodeContents(b);
        const sel = window.getSelection();
        if (sel) {
          sel.removeAllRanges();
          sel.addRange(newRange);
        }
        activeRange = newRange;
      } catch (e) {
        console.warn('Fallback bold error:', e);
      }
    }

    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const newRange = sel.getRangeAt(0);
      if (targetRef.current && isRangeInsideTarget(newRange, targetRef.current)) {
        savedRangeRef.current = newRange.cloneRange();
      }
    }

    setIsBold(detectIsBold());

    if (targetRef.current) {
      targetRef.current.dispatchEvent(new Event('input', { bubbles: true }));
    }
  };

  const toggleItalic = () => {
    const range = prepareExecution();
    if (!range || !targetRef.current) return;

    let activeRange = range;
    if (activeRange.collapsed) {
      const expanded = expandRangeToWord(activeRange);
      if (expanded && !expanded.collapsed) {
        activeRange = expanded;
        const sel = window.getSelection();
        if (sel) {
          try {
            sel.removeAllRanges();
            sel.addRange(activeRange);
          } catch (e) {}
        }
      }
    }

    const wasItalic = detectIsItalic();
    const targetEl = targetRef.current;

    try {
      document.execCommand('styleWithCSS', false, 'false');
    } catch (e) {}

    try {
      document.execCommand('italic', false, undefined);
    } catch (e) {}

    const nowItalic = detectIsItalic();

    if (wasItalic && nowItalic && targetEl) {
      try {
        let ancestor: Node | null = activeRange.commonAncestorContainer;
        if (ancestor.nodeType === Node.TEXT_NODE) ancestor = ancestor.parentNode;
        while (ancestor && ancestor !== targetEl && targetEl.contains(ancestor)) {
          if (ancestor.nodeType === Node.ELEMENT_NODE) {
            const el = ancestor as HTMLElement;
            const tag = el.tagName.toLowerCase();
            if (tag === 'i' || tag === 'em') {
              const parent = el.parentNode;
              if (parent) {
                while (el.firstChild) {
                  parent.insertBefore(el.firstChild, el);
                }
                parent.removeChild(el);
              }
              break;
            } else if (el.style.fontStyle) {
              el.style.fontStyle = '';
            }
          }
          ancestor = ancestor.parentNode;
        }
      } catch (e) {
        console.warn('Fallback un-italic error:', e);
      }
    } else if (!wasItalic && !nowItalic && targetEl && !activeRange.collapsed) {
      try {
        const i = document.createElement('i');
        const fragment = activeRange.extractContents();
        i.appendChild(fragment);
        activeRange.insertNode(i);
        const newRange = document.createRange();
        newRange.selectNodeContents(i);
        const sel = window.getSelection();
        if (sel) {
          sel.removeAllRanges();
          sel.addRange(newRange);
        }
        activeRange = newRange;
      } catch (e) {
        console.warn('Fallback italic error:', e);
      }
    }

    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const newRange = sel.getRangeAt(0);
      if (targetRef.current && isRangeInsideTarget(newRange, targetRef.current)) {
        savedRangeRef.current = newRange.cloneRange();
      }
    }

    setIsItalic(detectIsItalic());

    if (targetRef.current) {
      targetRef.current.dispatchEvent(new Event('input', { bubbles: true }));
    }
  };

  const executeCommand = (command: string, value: string | undefined = undefined) => {
    if (command === 'bold') {
      toggleBold();
      return;
    }
    if (command === 'italic') {
      toggleItalic();
      return;
    }

    const range = prepareExecution();
    if (!range) return;

    document.execCommand(command, false, value);

    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const newRange = sel.getRangeAt(0);
      if (targetRef.current && isRangeInsideTarget(newRange, targetRef.current)) {
        savedRangeRef.current = newRange.cloneRange();
      }
    }

    if (targetRef.current) {
      targetRef.current.dispatchEvent(new Event('input', { bubbles: true }));
    }
  };

  const applyFontSize = (sizeValue: string) => {
    const range = prepareExecution();

    if (!range || !targetRef.current || !isRangeInsideTarget(range, targetRef.current)) {
      setIsFontSizeOpen(false);
      return;
    }

    if (range.collapsed) {
      setIsFontSizeOpen(false);
      return;
    }

    if (sizeValue === 'inherit') {
      const success = document.execCommand('fontSize', false, '7');
      if (success && targetRef.current) {
        const fontTags = targetRef.current.querySelectorAll('font[size="7"]');
        fontTags.forEach((fontEl) => {
          const parent = fontEl.parentNode;
          if (parent) {
            fontEl.querySelectorAll('[style*="font-size"]').forEach((el: any) => {
              el.style.fontSize = '';
            });
            while (fontEl.firstChild) {
              const child = fontEl.firstChild;
              if (child.nodeType === Node.ELEMENT_NODE && (child as HTMLElement).style) {
                (child as HTMLElement).style.fontSize = '';
              }
              parent.insertBefore(child, fontEl);
            }
            parent.removeChild(fontEl);
          }
        });

        let ancestor: Node | null = range.commonAncestorContainer;
        if (ancestor.nodeType === Node.TEXT_NODE) ancestor = ancestor.parentNode;
        while (ancestor && ancestor !== targetRef.current) {
          if (ancestor.nodeType === Node.ELEMENT_NODE && (ancestor as HTMLElement).style?.fontSize) {
            (ancestor as HTMLElement).style.fontSize = '';
          }
          ancestor = ancestor.parentNode;
        }
      } else {
        const fragment = range.cloneContents();
        const tempDiv = document.createElement('div');
        tempDiv.appendChild(fragment);
        tempDiv.querySelectorAll('*').forEach((el: any) => {
          if (el.style && el.style.fontSize) {
            el.style.fontSize = '';
          }
        });
        document.execCommand('insertHTML', false, tempDiv.innerHTML);
      }
    } else {
      const success = document.execCommand('fontSize', false, '7');
      let applied = false;
      if (success && targetRef.current) {
        const fontTags = targetRef.current.querySelectorAll('font[size="7"]');
        if (fontTags.length > 0) {
          fontTags.forEach((fontEl) => {
            const span = document.createElement('span');
            span.style.fontSize = sizeValue;
            fontEl.querySelectorAll('[style*="font-size"]').forEach((inner: any) => {
              inner.style.fontSize = '';
            });
            while (fontEl.firstChild) {
              span.appendChild(fontEl.firstChild);
            }
            fontEl.parentNode?.replaceChild(span, fontEl);
          });
          applied = true;
        }
      }

      if (!applied) {
        const fragment = range.cloneContents();
        const tempDiv = document.createElement('div');
        tempDiv.appendChild(fragment);
        tempDiv.querySelectorAll('[style*="font-size"]').forEach((inner: any) => {
          inner.style.fontSize = '';
        });
        const htmlToInsert = `<span style="font-size: ${sizeValue};">${tempDiv.innerHTML}</span>`;
        document.execCommand('insertHTML', false, htmlToInsert);
      }
    }

    if (targetRef.current) {
      targetRef.current.dispatchEvent(new Event('input', { bubbles: true }));
    }

    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const newRange = sel.getRangeAt(0);
      if (isRangeInsideTarget(newRange, targetRef.current)) {
        savedRangeRef.current = newRange.cloneRange();
      }
    }

    setActiveFontSize(sizeValue === 'inherit' ? null : sizeValue);
    setIsFontSizeOpen(false);
  };

  const applyRole = (role: string) => {
    const range = prepareExecution();
    if (!range || !targetRef.current || !isRangeInsideTarget(range, targetRef.current)) {
      setIsDropdownOpen(false);
      return;
    }

    if (range.collapsed) {
      setIsDropdownOpen(false);
      return;
    }

    const fragment = range.cloneContents();
    const tempDiv = document.createElement('div');
    tempDiv.appendChild(fragment);

    // Remove any existing typography-* classes inside to prevent clutter
    tempDiv.querySelectorAll('[class*="typography-"]').forEach((el: any) => {
      el.className = el.className.replace(/\btypography-\S+/g, '').trim();
    });

    const html = `<span class="typography-${role}">${tempDiv.innerHTML}</span>`;
    document.execCommand('insertHTML', false, html);

    if (targetRef.current) {
      targetRef.current.dispatchEvent(new Event('input', { bubbles: true }));
    }

    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const newRange = sel.getRangeAt(0);
      if (isRangeInsideTarget(newRange, targetRef.current)) {
        savedRangeRef.current = newRange.cloneRange();
      }
    }

    setIsDropdownOpen(false);
  };

  const applyLink = () => {
    saveSelection();
    const currentRange = savedRangeRef.current;
    if (!currentRange || !targetRef.current || !isRangeInsideTarget(currentRange, targetRef.current)) {
      return;
    }

    const url = prompt('Enter link URL:');
    if (!url) {
      prepareExecution();
      return;
    }

    const range = prepareExecution();
    if (!range) return;

    document.execCommand('createLink', false, url);

    if (targetRef.current) {
      targetRef.current.dispatchEvent(new Event('input', { bubbles: true }));
    }

    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const newRange = sel.getRangeAt(0);
      if (isRangeInsideTarget(newRange, targetRef.current)) {
        savedRangeRef.current = newRange.cloneRange();
      }
    }
  };

  // Close font size dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (fontSizeContainerRef.current && !fontSizeContainerRef.current.contains(e.target as Node)) {
        setIsFontSizeOpen(false);
      }
    };
    if (isFontSizeOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isFontSizeOpen]);

  const updatePosition = () => {
    if (!targetRef.current || !isOpen) return;

    // Check if selection is inside targetRef to anchor toolbar above caret/selection
    const sel = window.getSelection();
    let rect = targetRef.current.getBoundingClientRect();
    let activeRange: Range | null = null;

    if (sel && sel.rangeCount > 0 && isRangeInsideTarget(sel.getRangeAt(0), targetRef.current)) {
      activeRange = sel.getRangeAt(0);
    } else if (savedRangeRef.current && isRangeInsideTarget(savedRangeRef.current, targetRef.current)) {
      activeRange = savedRangeRef.current;
    }

    if (activeRange) {
      const rangeRect = activeRange.getBoundingClientRect();
      if (rangeRect.width > 0 || rangeRect.height > 0) {
        rect = rangeRect;
      }
    }

    const toolbarEl = toolbarRef.current;
    
    let toolbarWidth = 220; // Default estimate
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
      xOffset = viewLeft - minViewLeft;
      viewLeft = minViewLeft;
    } else if (viewLeft > maxViewLeft) {
      xOffset = viewLeft - maxViewLeft;
      viewLeft = maxViewLeft;
    }

    // Final document-relative left position
    const left = viewLeft + window.scrollX;

    // clamp xOffset so the pointer doesnt leave the toolbar
    const maxOffset = (toolbarWidth / 2) - 15;
    if (xOffset > maxOffset) xOffset = maxOffset;
    if (xOffset < -maxOffset) xOffset = -maxOffset;

    setPosition((prev) => {
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
      setIsDropdownOpen(false);
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
            >
              <button
                type="button"
                className="flex items-center cursor-pointer focus:outline-none focus:ring-1 focus:ring-white/20 rounded"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  saveSelection();
                  setIsDropdownOpen(!isDropdownOpen);
                  setIsFontSizeOpen(false);
                }}
                title="Typography Role"
                aria-label="Role"
              >
                <Type className="w-3.5 h-3.5 text-neutral-400 ml-2 group-hover:text-white transition-colors" />
                <div className="flex items-center text-[11px] font-sans pl-1.5 pr-2 py-1.5 uppercase tracking-wider text-neutral-300 group-hover:text-white transition-colors">
                  ROLE
                  <ChevronDown className="w-3 h-3 text-neutral-500 ml-1 group-hover:text-white transition-colors" />
                </div>
              </button>
              
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
                       <button 
                         key={role}
                         type="button"
                         className="px-3 py-2 text-[10px] text-left uppercase tracking-wider text-neutral-300 hover:bg-neutral-700 hover:text-white cursor-pointer transition-colors"
                         onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            applyRole(role);
                         }}
                       >
                         {role}
                       </button>
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
            type="button"
            className={`p-1.5 rounded transition-colors focus:outline-none focus:ring-1 focus:ring-white/20 cursor-pointer ${
              isBold ? 'text-white bg-white/20 ring-1 ring-white/30' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleBold();
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            title="Bold"
            aria-label="Bold"
            aria-pressed={isBold}
          >
            <Bold className="w-4 h-4" />
          </button>
        );
      case 'italic':
        return (
          <button 
            key={`italic-${index}`}
            type="button"
            className={`p-1.5 rounded transition-colors focus:outline-none focus:ring-1 focus:ring-white/20 cursor-pointer ${
              isItalic ? 'text-white bg-white/20 ring-1 ring-white/30' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleItalic();
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            title="Italic"
            aria-label="Italic"
            aria-pressed={isItalic}
          >
            <Italic className="w-4 h-4" />
          </button>
        );
      case 'fontSize':
      case 'fontsize': {
        const isOpeningUpward = position && (
          position.placement === 'top' || (toolbarRef.current && (window.innerHeight - toolbarRef.current.getBoundingClientRect().bottom < 250))
        );
        return (
          <React.Fragment key={`fontSize-group-${index}`}>
            {index > 0 && tools[index - 1] !== 'separator' && <div className="w-px h-5 bg-neutral-700/60 mx-1 self-center" />}
            <div 
              ref={fontSizeContainerRef}
              className="relative flex items-center"
            >
              <button 
                type="button"
                className={`flex items-center space-x-1 px-2 py-1 rounded text-xs transition-colors focus:outline-none focus:ring-1 focus:ring-white/20 cursor-pointer ${
                  isFontSizeOpen ? 'bg-neutral-800 text-white' : 'text-neutral-300 hover:text-white hover:bg-neutral-800/80'
                }`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  saveSelection();
                  const currentSize = detectCurrentFontSize();
                  if (currentSize) setActiveFontSize(currentSize);
                  setIsFontSizeOpen(!isFontSizeOpen);
                  setIsDropdownOpen(false);
                }}
                title="Font Size"
                aria-label="Font Size"
              >
                <ALargeSmall className="w-3.5 h-3.5 text-neutral-400 group-hover:text-white" />
                <span className="text-[11px] font-mono tracking-tight font-medium">
                  {activeFontSize || 'Size'}
                </span>
                <ChevronDown className={`w-3 h-3 text-neutral-500 transition-transform duration-150 ${isFontSizeOpen ? 'rotate-180 text-white' : ''}`} />
              </button>

              <AnimatePresence>
                {isFontSizeOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: isOpeningUpward ? 5 : -5, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: isOpeningUpward ? 5 : -5, scale: 0.95 }}
                    transition={{ duration: 0.12 }}
                    className={`absolute left-0 ${
                      isOpeningUpward ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
                    } bg-neutral-900 border border-neutral-700/80 rounded-lg shadow-2xl py-1.5 min-w-[130px] max-h-[250px] overflow-y-auto z-50 text-neutral-200 backdrop-blur-md floating-toolbar-dropdown`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  >
                    <div className="px-2.5 py-1 text-[9px] uppercase tracking-wider text-neutral-500 font-semibold border-b border-neutral-800 mb-1">
                      Font Size
                    </div>
                    {FONT_SIZES.map(item => {
                      const isSelected = (activeFontSize === item.value) || (!activeFontSize && item.value === 'inherit');
                      return (
                        <button
                          key={item.value}
                          type="button"
                          className={`w-full px-2.5 py-1.5 text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                            isSelected 
                              ? 'bg-[#C9A227]/20 text-[#C9A227] font-semibold' 
                              : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
                          }`}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            applyFontSize(item.value);
                          }}
                        >
                          <span className="flex items-center">
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#C9A227] mr-1.5" />}
                            <span style={{ fontSize: item.value === 'inherit' ? '12px' : item.value }}>
                              {item.label}
                            </span>
                          </span>
                          <span className="text-[10px] text-neutral-500 font-mono ml-2">
                            {item.sub}
                          </span>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </React.Fragment>
        );
      }
      case 'link':
        return (
          <React.Fragment key={`link-group-${index}`}>
            {index > 0 && tools[index - 1] !== 'separator' && <div className="w-px h-5 bg-neutral-700 mx-1 self-center" />}
            <button 
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors focus:outline-none focus:ring-1 focus:ring-white/20 cursor-pointer"
              type="button"
              onMouseDown={(e) => { 
                e.preventDefault();
                e.stopPropagation(); 
                applyLink();
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
          className="absolute z-[9999] bg-neutral-900 border border-neutral-700/50 rounded-md shadow-xl flex items-center px-1 py-1 floating-toolbar-portal"
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
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

