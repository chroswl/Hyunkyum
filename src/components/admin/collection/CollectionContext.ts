import { createContext, useContext } from 'react';

interface CollectionItemContextType {
  attributes: any;
  listeners: any;
  isDragging: boolean;
}

export const CollectionItemContext = createContext<CollectionItemContextType | null>(null);

export function useCollectionItem() {
  const context = useContext(CollectionItemContext);
  if (!context) {
    throw new Error('useCollectionItem must be used within a CollectionItem');
  }
  return context;
}
