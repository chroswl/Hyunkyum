const fs = require('fs');
let code = fs.readFileSync('src/components/PressSection.tsx', 'utf8');

const regex = /\{\s*user\s*&&\s*\([\s\S]*?activeEditSection\s*===\s*'press'\)[\s\S]*?Exit Edit Mode<\/span>\s*<\/button>\s*<\/div>\s*\)\}\s*<\/div>\s*<\/div>\s*\)\}/;

const replacement = `{user && (
        <div className="absolute top-0 right-6 z-50 pointer-events-auto">
          <button 
            onClick={() => setIsEditMode(true)}
            className="flex items-center space-x-2 bg-black/60 hover:bg-black border border-white/10 hover:border-[#C9A227] backdrop-blur-md px-4 py-2 rounded-sm text-xs font-sans tracking-widest uppercase transition-all shadow-xl group"
          >
            <Edit3 className="w-3.5 h-3.5 text-[#C9A227] group-hover:scale-110 transition-transform duration-300" />
            <span className="text-white/90 group-hover:text-white">Press Editor</span>
          </button>
        </div>
      )}

      <PressEditorPanel
        isOpen={isEditMode}
        onClose={() => setIsEditMode(false)}
        items={pressItems}
        currentLang={currentLang}
        onSaveItem={async (item) => {
          let saved = { ...item };
          if (!saved.id) {
            saved.id = 'temp_' + Date.now();
            saved.order = pressItems.length;
          }
          const newItems = pressItems.find(i => i.id === saved.id)
            ? pressItems.map(i => i.id === saved.id ? saved as PressItem : i)
            : [...pressItems, saved as PressItem];
          setPressItems(newItems);
          if (onItemsUpdated) onItemsUpdated(newItems);
          await savePressItem(saved as PressItem);
        }}
        onDeleteItem={async (id) => {
          const newItems = pressItems.filter(i => i.id !== id);
          setPressItems(newItems);
          if (onItemsUpdated) onItemsUpdated(newItems);
          await deletePressItem(id);
        }}
        onReorder={async (newItems) => {
          setPressItems(newItems);
          if (onItemsUpdated) onItemsUpdated(newItems);
          for (let i = 0; i < newItems.length; i++) {
            if (newItems[i].order !== i) {
              newItems[i].order = i;
              await savePressItem(newItems[i]);
            }
          }
        }}
      />`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/components/PressSection.tsx', code);
