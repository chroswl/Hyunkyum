const fs = require('fs');

const createEditor = (name, itemType, categoryText, fetchFn, saveFn, deleteFn) => `import React, { useState, useEffect } from 'react';
import type { Language, ${itemType} } from '../../types';
import { ${fetchFn}, ${saveFn}, ${deleteFn} } from '../../firebase';
import { Save, Plus, Trash2 } from 'lucide-react';

export default function Admin${name}({ currentLang }: { currentLang: Language }) {
  const [items, setItems] = useState<${itemType}[]>([]);
  const [editingItem, setEditingItem] = useState<${itemType} | null>(null);

  useEffect(() => {
    ${fetchFn}().then(setItems);
  }, []);

  const handleSave = async () => {
    if (editingItem) {
      await ${saveFn}(editingItem);
      setItems(await ${fetchFn}());
      setEditingItem(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this item?")) {
      await ${deleteFn}(id);
      setItems(await ${fetchFn}());
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-serif text-[#C9A227] tracking-widest uppercase text-sm">${name} Management</h3>
        <button onClick={() => setEditingItem({ id: '', title: {EN:'',DE:'',KO:''} } as any)} className="bg-[#C9A227] text-black px-4 py-2 rounded text-xs flex items-center space-x-2">
          <Plus className="w-3 h-3" /> <span>Add Item</span>
        </button>
      </div>

      {editingItem && (
        <div className="bg-[#111] border border-neutral-900 p-6 rounded space-y-4">
          <h4 className="text-sm text-white border-b border-neutral-800 pb-2">Content Editor</h4>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] uppercase text-neutral-500">Title (EN)</label>
              <input type="text" value={editingItem.title?.EN || ''} onChange={e => setEditingItem({...editingItem, title: {...(editingItem.title||{}), EN: e.target.value}})} className="w-full bg-black border border-neutral-800 p-2 text-sm text-white" />
            </div>
            ${name === 'Portfolio' ? `
            <div>
              <label className="text-[10px] uppercase text-neutral-500">Copyright</label>
              <input type="text" value={editingItem.copyright || ''} onChange={e => setEditingItem({...editingItem, copyright: e.target.value})} className="w-full bg-black border border-neutral-800 p-2 text-sm text-white" />
            </div>
            ` : ''}
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button onClick={() => setEditingItem(null)} className="px-4 py-2 text-xs text-neutral-400">Cancel</button>
            <button onClick={handleSave} className="flex items-center space-x-2 bg-[#C9A227] text-black px-6 py-2 rounded text-xs font-semibold">
              <Save className="w-3 h-3" />
              <span>Save ${name}</span>
            </button>
          </div>
        </div>
      )}

      <div className="bg-[#111] border border-neutral-900 rounded">
        {items.map(item => (
          <div key={item.id} className="flex items-center justify-between p-4 border-b border-neutral-900 last:border-0">
            <div className="text-sm text-white">{item.title?.EN || 'Untitled'}</div>
            <div className="flex space-x-3">
              <button onClick={() => setEditingItem(item)} className="text-xs text-[#C9A227]">Edit</button>
              <button onClick={() => handleDelete(item.id)} className="text-xs text-red-500">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
`;

fs.writeFileSync('src/components/admin/AdminPortfolio.tsx', createEditor('Portfolio', 'PortfolioItem', 'Category', 'fetchPortfolio', 'savePortfolioItem', 'deletePortfolioItem'));
fs.writeFileSync('src/components/admin/AdminVideos.tsx', createEditor('Videos', 'VideoItem', 'Category', 'fetchVideos', 'saveVideoItem', 'deleteVideoItem'));
fs.writeFileSync('src/components/admin/AdminPress.tsx', createEditor('Press', 'PressItem', 'Type', 'fetchPress', 'savePressItem', 'deletePressItem'));
fs.writeFileSync('src/components/admin/AdminSlides.tsx', createEditor('Slides', 'PerformanceSlide', 'Type', 'fetchSelectedPerformances', 'saveSelectedPerformance', 'deleteSelectedPerformance'));

// Admin Settings
const settingsCode = `import React from 'react';
import type { Language } from '../../types';

export default function AdminSettings({ currentLang }: { currentLang: Language }) {
  return (
    <div className="space-y-6">
      <div className="bg-[#111] border border-neutral-900 p-8 rounded text-center space-y-4">
        <h3 className="font-serif text-[#C9A227] tracking-widest uppercase">System Settings</h3>
        <p className="text-neutral-500 text-sm">Global configuration for Cloudflare R2, Storage, and Upload defaults.</p>
        <div className="text-left text-xs text-neutral-400 max-w-sm mx-auto space-y-2 mt-4 border border-neutral-900 p-4 rounded bg-black">
           <p><strong>Storage Region:</strong> Europe</p>
           <p><strong>Bucket:</strong> hyunkyum</p>
           <p><strong>CDN:</strong> Active</p>
        </div>
      </div>
    </div>
  );
}
`;
fs.writeFileSync('src/components/admin/AdminSettings.tsx', settingsCode);

// Admin Contact
const contactCode = `import React from 'react';
import type { Language } from '../../types';

export default function AdminContact({ currentLang }: { currentLang: Language }) {
  return (
    <div className="space-y-6">
      <div className="bg-[#111] border border-neutral-900 p-8 rounded text-center">
        <h3 className="font-serif text-[#C9A227] tracking-widest uppercase">Contact Messages</h3>
        <p className="text-neutral-500 mt-2 text-sm">View user inquiries here.</p>
      </div>
    </div>
  );
}
`;
fs.writeFileSync('src/components/admin/AdminContact.tsx', contactCode);

