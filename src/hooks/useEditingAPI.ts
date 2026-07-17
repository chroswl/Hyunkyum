import { useState, useCallback, useEffect } from 'react';
import { useEditing } from '../contexts/EditingContext';

export type LifecycleState = 'idle' | 'editing' | 'dirty';

/**
 * Universal Editing API for atomic content blocks
 * (Text, Rich Text, Images, Legal Documents, etc.)
 */
export function useEditableBlock<T>(id: string, initialValue: T) {
  const { setStatus, registerChange } = useEditing();
  const [lifecycle, setLifecycle] = useState<LifecycleState>('idle');
  const [value, setValue] = useState<T>(initialValue);

  // Keep value in sync if not actively editing
  useEffect(() => {
    if (lifecycle === 'idle') {
      setValue(initialValue);
    }
  }, [initialValue, lifecycle]);

  const beginEditing = useCallback(() => {
    setLifecycle('editing');
    setStatus('editing');
  }, [setStatus]);

  const updateContent = useCallback((newValue: T) => {
    setValue(newValue);
    setLifecycle('dirty');
    registerChange();
  }, [registerChange]);

  const commitChanges = useCallback(() => {
    setLifecycle('idle');
    // Future: push update action to the global editing session history
  }, []);

  const cancelEditing = useCallback(() => {
    setValue(initialValue);
    setLifecycle('idle');
    // Future: revert local state and notify global session if needed
  }, [initialValue]);

  return {
    value,
    lifecycle,
    beginEditing,
    updateContent,
    commitChanges,
    cancelEditing
  };
}

/**
 * Universal Editing API for collections
 * (Gallery, Press, Videos, Schedule, Biography Lists, etc.)
 */
export function useEditableCollection<T>(collectionId: string) {
  const { registerChange } = useEditing();

  const create = useCallback((item: T) => {
    // Future: push create action to global history
    registerChange();
  }, [registerChange]);

  const update = useCallback((itemId: string, updates: Partial<T>) => {
    // Future: push update action to global history
    registerChange();
  }, [registerChange]);

  const remove = useCallback((itemId: string) => {
    // Future: push delete action to global history
    registerChange();
  }, [registerChange]);

  const reorder = useCallback((newOrder: T[]) => {
    // Future: push reorder action to global history
    registerChange();
  }, [registerChange]);

  return {
    create,
    update,
    remove,
    reorder
  };
}
