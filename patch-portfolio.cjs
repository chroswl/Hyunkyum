const fs = require('fs');

let content = fs.readFileSync('src/components/PortfolioGallery.tsx', 'utf8');

content = content.replace(
  "import { db, deletePortfolioItem } from '../firebase';",
  "import { db, deletePortfolioItem, savePortfolioItem } from '../firebase';"
);

content = content.replace(
  "const isEditMode = activeEditSection === 'gallery';",
  `const isEditMode = activeEditSection === 'gallery';
  const setIsEditMode = (mode: boolean) => setActiveEditSection(mode ? 'gallery' : 'none');
  const [editingItem, setEditingItem] = useState<Partial<PortfolioItem> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
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
    setIsEditMode(true);
  };
  
  const handleCancelEdit = () => {
    setEditingItem(null);
  };
  
  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.url) {
      showNotification("Image is required", "error");
      return;
    }
    
    setIsSaving(true);
    try {
      const savedItem = await savePortfolioItem(editingItem as any);
      
      // Update local state if needed
      const newItems = editingItem.id 
        ? items.map(i => i.id === editingItem.id ? { ...i, ...editingItem } as PortfolioItem : i)
        : [...items, savedItem];
        
      onItemsUpdated(newItems);
      setEditingItem(null);
      showNotification("Saved successfully!");
    } catch (err) {
      console.error(err);
      showNotification("Failed to save", "error");
    } finally {
      setIsSaving(false);
    }
  };`
);

// We also need to add the edit UI rendering block inside the component
// The edit UI block goes before the category tabs. Wait, let's look at where ScheduleSection puts it.
// ScheduleSection puts it before the items grid, inside an {isEditMode ? (...) : (...)} block.

// We should replace the old global event triggers with local state changes.
content = content.replace(
  /onAdd=\{user \? \(\) => \{ window\.dispatchEvent\(new CustomEvent\('add-portfolio-item'\)\); window\.dispatchEvent\(new CustomEvent\('open-portfolio-modal'\)\); \} : undefined\}/,
  "onAdd={user ? startNewPhoto : undefined}"
);

content = content.replace(
  /onEdit=\{\(\) => \{\s*window\.dispatchEvent\(new CustomEvent\('edit-portfolio-item', \{ detail: item\.id \}\)\);\s*window\.dispatchEvent\(new CustomEvent\('open-portfolio-modal'\)\);\s*\}\}/,
  `onEdit={() => { setEditingItem(item); setIsEditMode(true); }}`
);

// We need to inject the Edit Mode Interface.
const editModeUI = `
      {/* Admin Panel Header & Trigger */}
      {user && (activeEditSection === 'none' || activeEditSection === 'gallery') && (
        <div className="flex flex-wrap justify-between items-center mb-10 pb-4 border-b border-white/5 gap-4 px-4">
          <div className="flex items-center space-x-3">
            <span className="text-[9px] font-mono tracking-widest text-[#C9A227] uppercase bg-white/5 px-2 py-1 rounded">
              ADMIN ACCESS
            </span>
          </div>
          <div className="flex items-center space-x-3">
            {!isEditMode ? (
              <button
                type="button"
                onClick={() => setIsEditMode(true)}
                className="inline-flex items-center space-x-2 text-[10px] uppercase tracking-widest px-4 py-2 bg-white/5 border border-white/10 hover:border-[#C9A227] hover:bg-white/10 rounded-sm text-neutral-300 transition-all cursor-pointer font-sans font-medium"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#C9A227]" />
                <span>Edit Gallery</span>
              </button>
            ) : (
              <div className="flex items-center space-x-3 flex-wrap gap-2">
                <div className="flex items-center space-x-1 bg-white/5 px-1.5 py-1 rounded-sm border border-white/10">
                  {(['EN', 'DE', 'KO'] as Language[]).map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setLang(lang)}
                      className={\`px-2.5 py-0.5 text-[10px] font-sans font-bold tracking-wider rounded-sm transition-all \${
                        currentLang === lang
                          ? 'bg-[#C9A227] text-black font-extrabold shadow-sm'
                          : 'text-neutral-400 hover:text-white'
                      }\`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={startNewPhoto}
                  className="inline-flex items-center space-x-1.5 text-[10px] uppercase tracking-widest px-3.5 py-2 bg-[#C9A227]/10 hover:bg-[#C9A227]/20 border border-[#C9A227]/30 text-[#C9A227] rounded-sm transition-all cursor-pointer font-sans"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Photo</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (editingItem) {
                      setEditingItem(null);
                      setIsEditMode(false);
                    } else {
                      setIsEditMode(false);
                    }
                  }}
                  className="inline-flex items-center space-x-1.5 text-[10px] uppercase tracking-widest px-3.5 py-2 border border-white/10 hover:border-white/25 hover:bg-white/5 rounded-sm text-neutral-400 hover:text-white transition-all cursor-pointer font-sans"
                >
                  <X className="w-3 h-3" />
                  <span>Exit Edit Mode</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          EDIT MODE INTERFACE
          ======================================================== */}
      {isEditMode && editingItem ? (
        <div className="space-y-6 mb-12 px-4">
          <form onSubmit={handleSaveChanges} className="bg-white/[0.02] border border-[#C9A227]/20 p-6 md:p-8 rounded-lg space-y-6 max-w-3xl mx-auto transition-all">
            <div className="flex justify-between items-center pb-3 border-b border-white/5">
              <h4 className="text-xs tracking-widest uppercase font-sans font-semibold text-[#C9A227]">
                {editingItem.id ? 'Edit Photo' : 'New Photo'}
              </h4>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="p-1 hover:bg-white/5 rounded text-neutral-400 hover:text-white transition-colors cursor-pointer"
                title="Close Form"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-[10px] tracking-wider text-[color:inherit] font-sans uppercase block font-semibold">Category</label>
                <select
                  value={editingItem.category || 'Portrait'}
                  onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value as any })}
                  className="w-full bg-black/40 border border-white/10 focus:border-[#C9A227] rounded-sm px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#C9A227]"
                >
                  <option value="Portrait">Portrait</option>
                  <option value="Stage">Stage</option>
                  <option value="Backstage">Backstage</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] tracking-wider text-[color:inherit] font-sans uppercase block font-semibold">Image Asset</label>
                <div className="flex flex-col space-y-2">
                  <div className="flex space-x-2">
                    <input
                      type="url"
                      placeholder="https://..."
                      value={editingItem.url || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, url: e.target.value })}
                      className="flex-1 bg-black/40 border border-white/10 focus:border-[#C9A227] rounded-sm px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#C9A227]"
                    />
                  </div>
                  {editingItem.url && (
                    <div className="relative border border-white/10 rounded overflow-hidden aspect-video bg-black/50">
                       <MediaPreview url={editingItem.url} altText="Preview" className="w-full h-full" imageClassName="w-full h-full object-contain" />
                    </div>
                  )}
                  {/* Google Drive Picker */}
                  <div className="pt-2">
                    <GoogleDrivePicker onPick={url => setEditingItem({ ...editingItem, url })} />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-3 border-t border-white/5">
              <span className="text-[9px] font-mono text-[#C9A227] uppercase tracking-widest block font-bold mb-1">METADATA TRANSLATIONS</span>
              
              <div className="space-y-2">
                <span className="text-[9px] font-mono text-[color:inherit] uppercase tracking-widest block font-semibold">Title / Description</span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="Title (EN)"
                    value={editingItem.title?.EN || ''}
                    onChange={(e) => setEditingItem({
                      ...editingItem,
                      title: { ...editingItem.title, EN: e.target.value } as any
                    })}
                    className="w-full bg-black/40 border border-white/10 rounded-sm px-2.5 py-1.5 text-xs text-white focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Title (DE)"
                    value={editingItem.title?.DE || ''}
                    onChange={(e) => setEditingItem({
                      ...editingItem,
                      title: { ...editingItem.title, DE: e.target.value } as any
                    })}
                    className="w-full bg-black/40 border border-white/10 rounded-sm px-2.5 py-1.5 text-xs text-white focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Title (KO)"
                    value={editingItem.title?.KO || ''}
                    onChange={(e) => setEditingItem({
                      ...editingItem,
                      title: { ...editingItem.title, KO: e.target.value } as any
                    })}
                    className="w-full bg-black/40 border border-white/10 rounded-sm px-2.5 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3 border-t border-white/5">
              <div className="space-y-1.5">
                <label className="text-[10px] tracking-wider text-[color:inherit] font-sans uppercase block font-semibold">Copyright Name</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe (Optional)"
                  value={editingItem.copyright || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, copyright: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 focus:border-[#C9A227] rounded-sm px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#C9A227]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] tracking-wider text-[color:inherit] font-sans uppercase block font-semibold">Copyright URL</label>
                <input
                  type="url"
                  placeholder="https://... (Optional)"
                  value={editingItem.copyrightUrl || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, copyrightUrl: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 focus:border-[#C9A227] rounded-sm px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#C9A227]"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-white/5">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-4 py-2 border border-white/10 hover:border-white/30 hover:bg-white/5 rounded-sm text-neutral-400 hover:text-white text-xs tracking-wider uppercase font-sans transition-all cursor-pointer"
              >
                {t.adminCancel}
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 bg-[#C9A227] hover:bg-[#ebd04e] text-black font-semibold rounded-sm text-xs tracking-wider uppercase transition-all flex items-center space-x-1.5 cursor-pointer font-sans active:scale-95 shadow-md"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? t.adminSaving : t.adminSave}</span>
              </button>
            </div>
          </form>
        </div>
      ) : (
        <>
`;

content = content.replace(
  '<div className="w-full">',
  editModeUI + '\n<div className="w-full">'
);

content = content.replace(
  /<\/AnimatePresence>\s*<\/div>\s*<MediaCropWrapper/g,
  `</AnimatePresence>\n      </div>\n      </>\n      )} <!-- end isEditMode wrapper -->\n      <MediaCropWrapper`
);

fs.writeFileSync('src/components/PortfolioGallery.tsx', content);

