import { useState, useEffect } from 'react';
import { useEditing } from '../contexts/EditingContext';

export function useSectionDirty(sectionId: string) {
  const { isPrefixDirty, subscribe } = useEditing();
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    let prefix = sectionId;
    if (sectionId === 'biography') prefix = 'bio';
    else if (sectionId === 'hero') prefix = 'theme.hero';
    else if (sectionId === 'footer') prefix = 'theme.footer';
    else if (sectionId === 'portfolio') prefix = 'gallery'; // if needed

    const checkDirty = () => {
      setIsDirty(isPrefixDirty(prefix));
    };

    checkDirty();
    return subscribe(null, checkDirty);
  }, [sectionId, isPrefixDirty, subscribe]);

  return isDirty;
}
