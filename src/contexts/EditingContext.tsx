import React, { createContext, useContext, useState, useCallback, useRef, useEffect, useMemo } from 'react';
import cloneDeep from 'lodash/cloneDeep';
import get from 'lodash/get';
import set from 'lodash/set';

export type EditingStatus = 'idle' | 'editing' | 'unsaved' | 'saving' | 'saved' | 'error';

interface EditingContextType {
  status: EditingStatus;
  setStatus: (status: EditingStatus) => void;
  canUndo: boolean;
  canRedo: boolean;
  setCanUndo: (can: boolean) => void;
  setCanRedo: (can: boolean) => void;
  registerChange: () => void;
  saveChanges: () => Promise<void>;
  cancelChanges: () => void;
  undo: () => void;
  redo: () => void;
  
  // State Management
  getValue: <T>(key: string, defaultValue: T) => T;
  setValue: <T>(key: string, value: T, commitToHistory?: boolean) => void;
  isDirty: (key: string) => boolean;
  isPrefixDirty: (prefix: string) => boolean;
  subscribe: (key: string | null, callback: () => void) => () => void;
}

const EditingContext = createContext<EditingContextType | undefined>(undefined);

import type { ThemeSettings, BiographySettings, ContactSettings } from '../types';

interface EditingProviderProps {
  children: React.ReactNode;
  onSave?: (state: Record<string, any>, baseState: Record<string, any>) => Promise<void>;
  theme?: ThemeSettings;
  setTheme?: (t: ThemeSettings) => void;
  bio?: BiographySettings;
  setBio?: (b: BiographySettings) => void;
  contact?: ContactSettings;
  setContact?: (c: ContactSettings) => void;

  portfolioItems?: any[];
  setPortfolioItems?: (items: any[]) => void;
  scheduleItems?: any[];
  setScheduleItems?: (items: any[]) => void;
  videoItems?: any[];
  setVideoItems?: (items: any[]) => void;
  pressItems?: any[];
  setPressItems?: (items: any[]) => void;
  slides?: any[];
  setSlides?: (slides: any[]) => void;
}

export function EditingProvider({
  children,
  onSave,
  theme,
  setTheme,
  bio,
  setBio,
  contact,
  setContact,
  portfolioItems,
  setPortfolioItems,
  scheduleItems,
  setScheduleItems,
  videoItems,
  setVideoItems,
  pressItems,
  setPressItems,
  slides,
  setSlides
}: EditingProviderProps) {
  const [status, setStatus] = useState<EditingStatus>('idle');
  
  // State tracking
  const stateRef = useRef<Record<string, any>>({});
  const baseStateRef = useRef<Record<string, any>>({});
  const subscribers = useRef<Map<string, Set<() => void>>>(new Map());
  
  // History stack
  const historyRef = useRef<Record<string, any>[]>([]);
  const historyIndexRef = useRef(-1);
  const initialHistoryStateRef = useRef<Record<string, any>>({});
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const isUndoingOrRedoing = useRef(false);
  const isSavingRef = useRef(false);

  const notifySubscribers = useCallback((key?: string) => {
    if (!key) {
      subscribers.current.forEach(set => set.forEach(cb => cb()));
      return;
    }

    // 1. Notify exact key
    subscribers.current.get(key)?.forEach(cb => cb());

    // 2. If key is a parent (e.g. 'bio', 'theme', 'contact'), notify all child keys (e.g. 'bio.bioIntro.EN')
    const prefix = key + '.';
    subscribers.current.forEach((set, subKey) => {
      if (subKey.startsWith(prefix)) {
        set.forEach(cb => cb());
      }
    });

    // 3. If key is a child (e.g. 'bio.bioIntro.EN'), notify parent ('bio')
    const dotIndex = key.indexOf('.');
    if (dotIndex > 0) {
      const parentKey = key.substring(0, dotIndex);
      subscribers.current.get(parentKey)?.forEach(cb => cb());
    }

    subscribers.current.get('__GLOBAL__')?.forEach(cb => cb());
  }, []);

  const updateHistoryState = useCallback(() => {
    setCanUndo(historyIndexRef.current >= 0);
    setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
  }, []);

  const pushHistory = useCallback((oldState?: Record<string, any>) => {
    const currentState = cloneDeep(stateRef.current);
    
    // Ignore duplicate snapshots
    if (historyRef.current.length > 0 && historyIndexRef.current >= 0) {
      const prevSavedState = historyRef.current[historyIndexRef.current];
      if (JSON.stringify(prevSavedState) === JSON.stringify(currentState)) {
        return; // Ignore duplicate
      }
    }
    
    const newHistory = historyRef.current.slice(0, historyIndexRef.current + 1);
    
    if (newHistory.length === 0 && oldState) {
      initialHistoryStateRef.current = cloneDeep(oldState);
    }
    
    newHistory.push(currentState);
    
    // Limit history size to 100 states
    if (newHistory.length > 100) {
      const discarded = newHistory.shift();
      if (discarded) {
        initialHistoryStateRef.current = discarded;
      }
    }
    
    historyRef.current = newHistory;
    historyIndexRef.current = newHistory.length - 1;
    updateHistoryState();
  }, [updateHistoryState]);

  // Synchronize incoming props to EditingContext state
  // and trigger history push when they are changed by the editors.
  useEffect(() => {
    if (theme && !isUndoingOrRedoing.current) {
      const prevVal = stateRef.current['theme'];
      if (JSON.stringify(prevVal) !== JSON.stringify(theme)) {
        if (!('theme' in baseStateRef.current) || isSavingRef.current) {
          baseStateRef.current['theme'] = cloneDeep(theme);
          stateRef.current['theme'] = cloneDeep(theme);
          notifySubscribers('theme');
          return;
        }
        const oldState = cloneDeep(stateRef.current);
        stateRef.current['theme'] = cloneDeep(theme);
        if (prevVal !== undefined) {
          pushHistory(oldState);
          setStatus('unsaved');
        } else {
          baseStateRef.current['theme'] = cloneDeep(theme);
        }
        notifySubscribers('theme');
      }
    }
  }, [theme, pushHistory, notifySubscribers]);

  useEffect(() => {
    if (bio && !isUndoingOrRedoing.current) {
      const prevVal = stateRef.current['bio'];
      if (JSON.stringify(prevVal) !== JSON.stringify(bio)) {
        // If not initialized in baseState, or if incoming update is from save/initial fetch
        if (!('bio' in baseStateRef.current) || isSavingRef.current || !prevVal) {
          baseStateRef.current['bio'] = cloneDeep(bio);
          stateRef.current['bio'] = cloneDeep(bio);
          notifySubscribers('bio');
          return;
        }
        const oldState = cloneDeep(stateRef.current);
        stateRef.current['bio'] = cloneDeep(bio);
        if (prevVal !== undefined) {
          pushHistory(oldState);
          setStatus('unsaved');
        } else {
          baseStateRef.current['bio'] = cloneDeep(bio);
        }
        notifySubscribers('bio');
      }
    }
  }, [bio, pushHistory, notifySubscribers]);

  useEffect(() => {
    if (contact && !isUndoingOrRedoing.current) {
      const prevVal = stateRef.current['contact'];
      if (JSON.stringify(prevVal) !== JSON.stringify(contact)) {
        if (!('contact' in baseStateRef.current) || isSavingRef.current || !prevVal) {
          baseStateRef.current['contact'] = cloneDeep(contact);
          stateRef.current['contact'] = cloneDeep(contact);
          notifySubscribers('contact');
          return;
        }
        const oldState = cloneDeep(stateRef.current);
        stateRef.current['contact'] = cloneDeep(contact);
        if (prevVal !== undefined) {
          pushHistory(oldState);
          setStatus('unsaved');
        } else {
          baseStateRef.current['contact'] = cloneDeep(contact);
        }
        notifySubscribers('contact');
      }
    }
  }, [contact, pushHistory, notifySubscribers]);

  useEffect(() => {
    if (portfolioItems && !isUndoingOrRedoing.current) {
      const prevVal = stateRef.current['portfolioItems'];
      if (JSON.stringify(prevVal) !== JSON.stringify(portfolioItems)) {
        if (!('portfolioItems' in baseStateRef.current) || isSavingRef.current || !prevVal) {
          baseStateRef.current['portfolioItems'] = cloneDeep(portfolioItems);
          stateRef.current['portfolioItems'] = cloneDeep(portfolioItems);
          notifySubscribers('portfolioItems');
          return;
        }
        const oldState = cloneDeep(stateRef.current);
        stateRef.current['portfolioItems'] = cloneDeep(portfolioItems);
        if (prevVal !== undefined) {
          pushHistory(oldState);
          setStatus('unsaved');
        } else {
          baseStateRef.current['portfolioItems'] = cloneDeep(portfolioItems);
        }
        notifySubscribers('portfolioItems');
      }
    }
  }, [portfolioItems, pushHistory, notifySubscribers]);

  useEffect(() => {
    if (scheduleItems && !isUndoingOrRedoing.current) {
      const prevVal = stateRef.current['scheduleItems'];
      if (JSON.stringify(prevVal) !== JSON.stringify(scheduleItems)) {
        if (!('scheduleItems' in baseStateRef.current) || isSavingRef.current || !prevVal) {
          baseStateRef.current['scheduleItems'] = cloneDeep(scheduleItems);
          stateRef.current['scheduleItems'] = cloneDeep(scheduleItems);
          notifySubscribers('scheduleItems');
          return;
        }
        const oldState = cloneDeep(stateRef.current);
        stateRef.current['scheduleItems'] = cloneDeep(scheduleItems);
        if (prevVal !== undefined) {
          pushHistory(oldState);
          setStatus('unsaved');
        } else {
          baseStateRef.current['scheduleItems'] = cloneDeep(scheduleItems);
        }
        notifySubscribers('scheduleItems');
      }
    }
  }, [scheduleItems, pushHistory, notifySubscribers]);

  useEffect(() => {
    if (videoItems && !isUndoingOrRedoing.current) {
      const prevVal = stateRef.current['videoItems'];
      if (JSON.stringify(prevVal) !== JSON.stringify(videoItems)) {
        if (!('videoItems' in baseStateRef.current) || isSavingRef.current || !prevVal) {
          baseStateRef.current['videoItems'] = cloneDeep(videoItems);
          stateRef.current['videoItems'] = cloneDeep(videoItems);
          notifySubscribers('videoItems');
          return;
        }
        const oldState = cloneDeep(stateRef.current);
        stateRef.current['videoItems'] = cloneDeep(videoItems);
        if (prevVal !== undefined) {
          pushHistory(oldState);
          setStatus('unsaved');
        } else {
          baseStateRef.current['videoItems'] = cloneDeep(videoItems);
        }
        notifySubscribers('videoItems');
      }
    }
  }, [videoItems, pushHistory, notifySubscribers]);

  useEffect(() => {
    if (pressItems && !isUndoingOrRedoing.current) {
      const prevVal = stateRef.current['pressItems'];
      if (JSON.stringify(prevVal) !== JSON.stringify(pressItems)) {
        if (!('pressItems' in baseStateRef.current) || isSavingRef.current || !prevVal) {
          baseStateRef.current['pressItems'] = cloneDeep(pressItems);
          stateRef.current['pressItems'] = cloneDeep(pressItems);
          notifySubscribers('pressItems');
          return;
        }
        const oldState = cloneDeep(stateRef.current);
        stateRef.current['pressItems'] = cloneDeep(pressItems);
        if (prevVal !== undefined) {
          pushHistory(oldState);
          setStatus('unsaved');
        } else {
          baseStateRef.current['pressItems'] = cloneDeep(pressItems);
        }
        notifySubscribers('pressItems');
      }
    }
  }, [pressItems, pushHistory, notifySubscribers]);

  useEffect(() => {
    if (slides && !isUndoingOrRedoing.current) {
      const prevVal = stateRef.current['slides'];
      if (JSON.stringify(prevVal) !== JSON.stringify(slides)) {
        if (!('slides' in baseStateRef.current) || isSavingRef.current || !prevVal) {
          baseStateRef.current['slides'] = cloneDeep(slides);
          stateRef.current['slides'] = cloneDeep(slides);
          notifySubscribers('slides');
          return;
        }
        const oldState = cloneDeep(stateRef.current);
        stateRef.current['slides'] = cloneDeep(slides);
        if (prevVal !== undefined) {
          pushHistory(oldState);
          setStatus('unsaved');
        } else {
          baseStateRef.current['slides'] = cloneDeep(slides);
        }
        notifySubscribers('slides');
      }
    }
  }, [slides, pushHistory, notifySubscribers]);

  const getValue = useCallback(<T,>(key: string, defaultValue: T): T => {
    if (stateRef.current[key] !== undefined) {
      return stateRef.current[key];
    }
    if (key.startsWith('theme.')) {
      const path = key.substring(6);
      const themeObj = stateRef.current['theme'];
      if (themeObj && typeof themeObj === 'object') {
        const val = get(themeObj, path);
        if (val !== undefined) return val;
      }
    }
    if (key.startsWith('bio.')) {
      const path = key.substring(4);
      const bioObj = stateRef.current['bio'];
      if (bioObj && typeof bioObj === 'object') {
        const val = get(bioObj, path);
        if (val !== undefined) return val;
      }
    }
    if (key.startsWith('contact.')) {
      const path = key.substring(8);
      const contactObj = stateRef.current['contact'];
      if (contactObj && typeof contactObj === 'object') {
        const val = get(contactObj, path);
        if (val !== undefined) return val;
      }
    }
    return defaultValue;
  }, []);

  const setValue = useCallback(<T,>(key: string, value: T, commitToHistory = true) => {
    // If not initialized in base state, initialize it with current resolved value
    if (!(key in baseStateRef.current)) {
       baseStateRef.current[key] = cloneDeep(getValue(key, value));
    }

    const oldState = cloneDeep(stateRef.current);
    stateRef.current[key] = value;

    // Keep parent composite objects in sync so save always captures subfield changes
    if (key.startsWith('bio.')) {
      const path = key.substring(4);
      if (!stateRef.current['bio'] || typeof stateRef.current['bio'] !== 'object') {
        stateRef.current['bio'] = {};
      }
      set(stateRef.current['bio'], path, value);
    } else if (key.startsWith('theme.')) {
      const path = key.substring(6);
      if (!stateRef.current['theme'] || typeof stateRef.current['theme'] !== 'object') {
        stateRef.current['theme'] = {};
      }
      set(stateRef.current['theme'], path, value);
    } else if (key.startsWith('contact.')) {
      const path = key.substring(8);
      if (!stateRef.current['contact'] || typeof stateRef.current['contact'] !== 'object') {
        stateRef.current['contact'] = {};
      }
      set(stateRef.current['contact'], path, value);
    }

    notifySubscribers(key);

    if (commitToHistory) {
      pushHistory(oldState);
      setStatus('unsaved');
    }
  }, [notifySubscribers, pushHistory, getValue]);

  const isDirty = useCallback((key: string): boolean => {
    if (!(key in baseStateRef.current)) return false;
    return JSON.stringify(baseStateRef.current[key]) !== JSON.stringify(stateRef.current[key]);
  }, []);

  const isPrefixDirty = useCallback((prefix: string): boolean => {
    for (const key of Object.keys(baseStateRef.current)) {
      if (key.startsWith(prefix)) {
        if (JSON.stringify(baseStateRef.current[key]) !== JSON.stringify(stateRef.current[key])) {
          return true;
        }
      }
    }
    return false;
  }, []);

  const subscribe = useCallback((key: string | null, callback: () => void) => {
    const subscribeKey = key || '__GLOBAL__';
    if (!subscribers.current.has(subscribeKey)) {
      subscribers.current.set(subscribeKey, new Set());
    }
    subscribers.current.get(subscribeKey)!.add(callback);
    return () => {
      subscribers.current.get(subscribeKey)?.delete(callback);
    };
  }, []);

  const registerChange = useCallback(() => {
    setStatus('unsaved');
  }, []);

  const saveChanges = useCallback(async () => {
    // If an editable element is currently focused, blur it to ensure in-flight changes are committed
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    setStatus('saving');
    isSavingRef.current = true;
    
    try {
      if (onSave) {
        await onSave(stateRef.current, baseStateRef.current);
      }
      
      baseStateRef.current = cloneDeep(stateRef.current);
      // History is explicitly preserved during save to maintain undo stack
      updateHistoryState();
      
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 2000);
    } catch (err) {
      console.error('Failed to save changes:', err);
      setStatus('error');
    } finally {
      isSavingRef.current = false;
    }
  }, [onSave, updateHistoryState]);

  const cancelChanges = useCallback(() => {
    isUndoingOrRedoing.current = true;
    // Revert to base state
    stateRef.current = cloneDeep(baseStateRef.current);
    historyRef.current = [];
    historyIndexRef.current = -1;
    initialHistoryStateRef.current = cloneDeep(baseStateRef.current);
    updateHistoryState();
    setStatus('idle');
    notifySubscribers();

    if (setTheme && baseStateRef.current['theme'] !== undefined) setTheme(baseStateRef.current['theme']);
    if (setBio && baseStateRef.current['bio'] !== undefined) setBio(baseStateRef.current['bio']);
    if (setContact && baseStateRef.current['contact'] !== undefined) setContact(baseStateRef.current['contact']);
    if (setPortfolioItems && baseStateRef.current['portfolioItems'] !== undefined) setPortfolioItems(baseStateRef.current['portfolioItems']);
    if (setScheduleItems && baseStateRef.current['scheduleItems'] !== undefined) setScheduleItems(baseStateRef.current['scheduleItems']);
    if (setVideoItems && baseStateRef.current['videoItems'] !== undefined) setVideoItems(baseStateRef.current['videoItems']);
    if (setPressItems && baseStateRef.current['pressItems'] !== undefined) setPressItems(baseStateRef.current['pressItems']);
    if (setSlides && baseStateRef.current['slides'] !== undefined) setSlides(baseStateRef.current['slides']);

  }, [notifySubscribers, updateHistoryState, setTheme, setBio, setContact, setPortfolioItems, setScheduleItems, setVideoItems, setPressItems, setSlides]);

  const undo = useCallback(() => {
    if (historyIndexRef.current >= 0) {
      isUndoingOrRedoing.current = true;
      const newIndex = historyIndexRef.current - 1;
      const snapshot = newIndex >= 0 ? cloneDeep(historyRef.current[newIndex]) : cloneDeep(initialHistoryStateRef.current);
      stateRef.current = snapshot;
      historyIndexRef.current = newIndex;
      updateHistoryState();
      notifySubscribers();
      
      if (setTheme && snapshot['theme'] !== undefined) setTheme(snapshot['theme']);
      if (setBio && snapshot['bio'] !== undefined) setBio(snapshot['bio']);
      if (setContact && snapshot['contact'] !== undefined) setContact(snapshot['contact']);
      if (setPortfolioItems && snapshot['portfolioItems'] !== undefined) setPortfolioItems(snapshot['portfolioItems']);
      if (setScheduleItems && snapshot['scheduleItems'] !== undefined) setScheduleItems(snapshot['scheduleItems']);
      if (setVideoItems && snapshot['videoItems'] !== undefined) setVideoItems(snapshot['videoItems']);
      if (setPressItems && snapshot['pressItems'] !== undefined) setPressItems(snapshot['pressItems']);
      if (setSlides && snapshot['slides'] !== undefined) setSlides(snapshot['slides']);
      
      // Determine if we are back to base state
      if (newIndex < 0) {
        setStatus('idle');
      } else {
        setStatus('unsaved');
      }
    }
  }, [updateHistoryState, notifySubscribers, setTheme, setBio, setContact, setPortfolioItems, setScheduleItems, setVideoItems, setPressItems, setSlides]);

  const redo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      isUndoingOrRedoing.current = true;
      const newIndex = historyIndexRef.current + 1;
      const snapshot = cloneDeep(historyRef.current[newIndex]);
      stateRef.current = snapshot;
      historyIndexRef.current = newIndex;
      updateHistoryState();
      setStatus('unsaved');
      notifySubscribers();
      
      if (setTheme && snapshot['theme'] !== undefined) setTheme(snapshot['theme']);
      if (setBio && snapshot['bio'] !== undefined) setBio(snapshot['bio']);
      if (setContact && snapshot['contact'] !== undefined) setContact(snapshot['contact']);
      if (setPortfolioItems && snapshot['portfolioItems'] !== undefined) setPortfolioItems(snapshot['portfolioItems']);
      if (setScheduleItems && snapshot['scheduleItems'] !== undefined) setScheduleItems(snapshot['scheduleItems']);
      if (setVideoItems && snapshot['videoItems'] !== undefined) setVideoItems(snapshot['videoItems']);
      if (setPressItems && snapshot['pressItems'] !== undefined) setPressItems(snapshot['pressItems']);
      if (setSlides && snapshot['slides'] !== undefined) setSlides(snapshot['slides']);
    }
  }, [updateHistoryState, notifySubscribers, setTheme, setBio, setContact, setPortfolioItems, setScheduleItems, setVideoItems, setPressItems, setSlides]);

  // Reset the undoing/redoing/cancelling flag after all sync effects of the current render pass have run.
  useEffect(() => {
    if (isUndoingOrRedoing.current) {
      isUndoingOrRedoing.current = false;
    }
  });

  // Keyboard Shortcuts: Ctrl+Z, Ctrl+Shift+Z, Cmd+Z, Cmd+Shift+Z
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMeta = e.ctrlKey || e.metaKey;
      if (!isMeta) return;

      if (e.key === 'z' || e.key === 'Z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if (e.key === 'y' || e.key === 'Y') {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [undo, redo]);

  const contextValue = useMemo(() => ({
    status, setStatus,
    canUndo, canRedo, setCanUndo, setCanRedo,
    registerChange, saveChanges, cancelChanges,
    undo, redo,
    getValue, setValue, isDirty, isPrefixDirty, subscribe
  }), [status, canUndo, canRedo, registerChange, saveChanges, cancelChanges, undo, redo, getValue, setValue, isDirty, isPrefixDirty, subscribe]);

  return (
    <EditingContext.Provider value={contextValue}>
      {children}
    </EditingContext.Provider>
  );
}

export function useEditing() {
  const context = useContext(EditingContext);
  if (context === undefined) {
    throw new Error('useEditing must be used within an EditingProvider');
  }
  return context;
}

export function useEditable<T>(key: string, initialValue: T): [T, (val: T, commit?: boolean) => void, boolean] {
  const context = useEditing();
  const { getValue, setValue: contextSetValue, isDirty, subscribe } = context;

  const [value, setLocalValue] = useState<T>(() => getValue(key, initialValue));
  const [dirty, setDirty] = useState(false);
  const prevKeyRef = useRef(key);

  // Synchronize state when the target key changes (e.g. language switch EN -> DE -> KO)
  if (prevKeyRef.current !== key) {
    prevKeyRef.current = key;
    const currentVal = getValue(key, initialValue);
    setLocalValue(currentVal);
    setDirty(isDirty(key));
  }
  
  const initialValueRef = useRef(initialValue);
  useEffect(() => {
    initialValueRef.current = initialValue;
  }, [initialValue]);

  useEffect(() => {
    // Make sure initial value is set without pushing to history if not set
    if (getValue(key, undefined) === undefined) {
      contextSetValue(key, initialValueRef.current, false);
    }
    
    const checkState = () => {
      const currentVal = getValue(key, initialValueRef.current);
      const currentDirty = isDirty(key);
      setLocalValue(prev => (prev !== currentVal ? currentVal : prev));
      setDirty(prev => (prev !== currentDirty ? currentDirty : prev));
    };
    
    checkState();
    return subscribe(key, checkState);
  }, [key, getValue, contextSetValue, isDirty, subscribe]);

  const setValue = useCallback((newValue: T, commitToHistory = true) => {
    contextSetValue(key, newValue, commitToHistory);
  }, [key, contextSetValue]);

  return [value, setValue, dirty];
}
