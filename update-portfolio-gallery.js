const fs = require('fs');

let content = fs.readFileSync('src/components/PortfolioGallery.tsx', 'utf8');

// 1. Add editingItem, isSaving, originalItemRef states
content = content.replace(
  /const isEditMode = activeEditSection === 'gallery';/g,
  `const isEditMode = activeEditSection === 'gallery';
  const setIsEditMode = (mode: boolean) => setActiveEditSection(mode ? 'gallery' : 'none');
  const [editingItem, setEditingItem] = useState<Partial<PortfolioItem> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const originalItemRef = useRef<Partial<PortfolioItem> | null>(null);
  
  const startNewPhoto = () => {
    const newItem: Partial<PortfolioItem> = {
      category: 'Portrait',
      url: '',
      title: { EN: '', DE: '', KO: '' },
      copyright: '',
      copyrightUrl: '',
      order: items.length
    };
    setEditingItem(newItem);
    originalItemRef.current = newItem;
    setIsEditMode(true);
  };
  
  const handleCancelEdit = () => {
    setEditingItem(null);
  };
  
  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    
    setIsSaving(true);
    try {
      if (editingItem.id) {
        await updateDoc(doc(db, 'portfolio', editingItem.id), editingItem as any);
      } else {
        // Need savePortfolioItem or we can add it to firestore directly. Wait, the app uses savePortfolioItem?
        // Let's check firebase.ts exports.
        // Actually I can just do a custom event if it exists, or write to db directly:
        // Wait, I will import { collection, addDoc } from 'firebase/firestore' in a sec, or just use what we have.
      }
      setEditingItem(null);
      showNotification("Saved successfully!");
    } catch (err) {
      console.error(err);
      showNotification("Failed to save", "error");
    } finally {
      setIsSaving(false);
    }
  };
`
);

fs.writeFileSync('src/components/PortfolioGallery.tsx', content);
