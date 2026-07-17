const fs = require('fs');
let code = fs.readFileSync('src/components/PortfolioGallery.tsx', 'utf8');

// Remove SortableItem and interface
code = code.replace(/interface SortableItemProps \{[\s\S]*?\}\n\nfunction SortableItem[\s\S]*?\}\n/, '');

// Add imports
code = code.replace(/import \{ ref, uploadBytesResumable, getDownloadURL \} from 'firebase\/storage';/, `import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';\nimport { SortableCollection, CollectionItem, HoverOverlay } from './admin/collection';`);

// Find the isEditMode check and remove the whole admin interface
const editModeIndex = code.indexOf('{isEditMode ? (');
const elseIndex = code.indexOf(') : (', editModeIndex);
const readOnlyCommentIndex = code.indexOf('/* ========================================================', elseIndex);

if (editModeIndex > -1 && readOnlyCommentIndex > -1) {
  // Replace the whole isEditMode branch with just the read-only part (which will be modified)
  const before = code.substring(0, editModeIndex);
  const after = code.substring(readOnlyCommentIndex);
  code = before + after;
  
  // also need to close the tag where it was closed
  // Let's just do a manual replacement using sed or rewrite it carefully
}

fs.writeFileSync('src/components/PortfolioGallery.tsx', code);
