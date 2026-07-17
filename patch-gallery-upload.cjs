const fs = require('fs');
let content = fs.readFileSync('src/components/PortfolioGallery.tsx', 'utf8');

const uploadUI = `                  {/* Google Drive Picker & Local Upload */}
                  <div className="pt-2 flex items-center space-x-3">
                    <GoogleDrivePicker onPick={url => setEditingItem({ ...editingItem, url })} />
                    <div className="relative">
                      <button type="button" className="inline-flex items-center space-x-1.5 text-[10px] uppercase tracking-widest px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-sm transition-all cursor-pointer font-sans border border-neutral-700">
                        <span>Upload Photo</span>
                      </button>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const url = URL.createObjectURL(e.target.files[0]);
                            setCropTarget({ 
                              src: url, 
                              aspect: 3/4,
                              onCrop: (base64, copyright, copyrightUrl) => {
                                setEditingItem({ ...editingItem, url: base64, copyright: copyright || editingItem.copyright, copyrightUrl: copyrightUrl || editingItem.copyrightUrl });
                                setCropTarget(null);
                              } 
                            });
                          }
                          e.target.value = '';
                        }} 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                      />
                    </div>
                  </div>`;

content = content.replace(
  /\{\/\* Google Drive Picker \*\/\}\s*<div className="pt-2">\s*<GoogleDrivePicker onPick=\{url => setEditingItem\(\{ \.\.\.editingItem, url \}\)\} \/>\s*<\/div>/,
  uploadUI
);

// We should also add a Reset button next to Cancel and Save
const resetUI = `<button
                type="button"
                onClick={() => {
                  if (originalItemRef.current) {
                    setEditingItem({...originalItemRef.current});
                  } else {
                    setEditingItem({
                      category: 'Portrait',
                      url: '',
                      title: { EN: '', DE: '', KO: '' },
                      copyright: '',
                      copyrightUrl: '',
                      order: items.length
                    });
                  }
                }}
                className="px-4 py-2 border border-white/10 hover:border-white/30 hover:bg-white/5 rounded-sm text-neutral-400 hover:text-white text-xs tracking-wider uppercase font-sans transition-all cursor-pointer"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}`;

content = content.replace(
  /<button\s*type="button"\s*onClick=\{handleCancelEdit\}/,
  resetUI
);

// We need to restore originalItemRef
const originalItemRef = `  const originalItemRef = useRef<Partial<PortfolioItem> | null>(null);
  const startNewPhoto = () => {`;
  
content = content.replace(
  /const startNewPhoto = \(\) => \{/,
  originalItemRef
);

// And when editing an existing item, set the ref:
content = content.replace(
  /onEdit=\{\(\) => \{ setEditingItem\(item\); setIsEditMode\(true\); \}\}/,
  "onEdit={() => { setEditingItem(item); originalItemRef.current = item; setIsEditMode(true); }}"
);

// Also set ref on new photo:
content = content.replace(
  /setEditingItem\(newItem\);\s*setIsEditMode\(true\);/,
  "setEditingItem(newItem);\n    originalItemRef.current = newItem;\n    setIsEditMode(true);"
);

fs.writeFileSync('src/components/PortfolioGallery.tsx', content);
