const fs = require('fs');
let code = fs.readFileSync('src/components/VideoPlayer.tsx', 'utf8');

const regex = /\{\s*user\s*&&\s*\([\s\S]*?activeEditSection\s*===\s*'videos'\)[\s\S]*?Exit Edit Mode<\/span>\s*<\/button>\s*<\/div>\s*\)\}\s*<\/div>\s*<\/div>\s*\)\}/;

const replacement = `{user && (
        <div className="absolute top-0 right-6 z-50 pointer-events-auto">
          <button 
            onClick={() => setIsEditMode(true)}
            className="flex items-center space-x-2 bg-black/60 hover:bg-black border border-white/10 hover:border-[#C9A227] backdrop-blur-md px-4 py-2 rounded-sm text-xs font-sans tracking-widest uppercase transition-all shadow-xl group"
          >
            <Edit3 className="w-3.5 h-3.5 text-[#C9A227] group-hover:scale-110 transition-transform duration-300" />
            <span className="text-white/90 group-hover:text-white">Video Editor</span>
          </button>
        </div>
      )}

      <VideoEditorPanel
        isOpen={isEditMode}
        onClose={() => setIsEditMode(false)}
        items={items}
        currentLang={currentLang}
        onSaveItem={async (item) => {
          let saved = { ...item };
          if (!saved.id) {
            saved.id = 'temp_' + Date.now();
            saved.order = items.length;
          }
          const newItems = items.find(i => i.id === saved.id)
            ? items.map(i => i.id === saved.id ? saved as VideoItem : i)
            : [...items, saved as VideoItem];
          if (onItemsUpdated) onItemsUpdated(newItems);
          await saveVideoItem(saved as VideoItem);
        }}
        onDeleteItem={async (id) => {
          const newItems = items.filter(i => i.id !== id);
          if (onItemsUpdated) onItemsUpdated(newItems);
          await deleteVideoItem(id);
        }}
        onReorder={async (newItems) => {
          if (onItemsUpdated) onItemsUpdated(newItems);
          for (let i = 0; i < newItems.length; i++) {
            if (newItems[i].order !== i) {
              newItems[i].order = i;
              await saveVideoItem(newItems[i]);
            }
          }
        }}
      />`;

code = code.replace(regex, replacement);

// Remove the ternary {isEditMode ? ... : ... }
// The read-only view starts at <div id="video-player-root"
code = code.replace(/\{isEditMode \? \([\s\S]*?\) : \([\s\S]*?\/\* ========================================================\n\s*PUBLIC READ-ONLY INTERFACE\n\s*======================================================== \*\/\n\s*(<div id="video-player-root"[\s\S]*?<\/div>)\n\s*\)\}/, '$1');

// Add import
code = code.replace(/import \{ SortableCollection, CollectionItem, HoverOverlay \} from '\.\/admin\/collection';/, 
`import { SortableCollection, CollectionItem, HoverOverlay } from './admin/collection';
import { VideoEditorPanel } from './admin/VideoEditorPanel';`);

// Because we removed the ternary, the final `)}` might still be there for `isEditMode` at the bottom!
// Wait! Let's check if the replacement matches up to `)}` for isEditMode.
// `code.replace(/\{isEditMode \? ... \n\s*(<div id="video-player-root"[\s\S]*?<\/div>)\n\s*\)\}/`
// The `\)\}` at the end captures the `)}`. So the trailing `)}` is removed!

fs.writeFileSync('src/components/VideoPlayer.tsx', code);
