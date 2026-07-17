const fs = require('fs');
let code = fs.readFileSync('src/components/PressSection.tsx', 'utf8');

// Inside handleSaveChanges
code = code.replace(
  /const saved = await savePressItem\(editingItem as PressItem\);\s*\/\/ Reload everything\s*const data = await fetchPress\(\);\s*setPressItems\(data\);\s*if \(onItemsUpdated\) onItemsUpdated\(data\);\s*\/\/ Keep the same selected Press item visible after saving\s*setSelectedItemId\(saved\.id\);/,
  `const saved = { ...editingItem };
      if (!saved.id) {
        saved.id = 'temp_' + Date.now();
      }
      if (saved.order === undefined) {
        saved.order = pressItems.length;
      }
      const newItems = pressItems.find(i => i.id === saved.id)
        ? pressItems.map(i => i.id === saved.id ? saved : i)
        : [...pressItems, saved];
      
      setPressItems(newItems);
      if (onItemsUpdated) onItemsUpdated(newItems);
      setSelectedItemId(saved.id);`
);

fs.writeFileSync('src/components/PressSection.tsx', code);
