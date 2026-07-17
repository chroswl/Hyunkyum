const fs = require('fs');
let code = fs.readFileSync('src/components/ScheduleSection.tsx', 'utf8');

code = code.replace(
  /await saveScheduleItem\(saveItem as ScheduleItem\);\s*showNotification\("Performance saved successfully"\);\s*setEditingItem\(null\);\s*originalItemRef\.current = null;/,
  `const saved = { ...saveItem };
      if (!saved.id) saved.id = 'temp_' + Date.now();
      
      const newItems = items.find(i => i.id === saved.id)
        ? items.map(i => i.id === saved.id ? saved : i)
        : [...items, saved];
      
      onItemsUpdated(newItems);
      setEditingItem(null);
      originalItemRef.current = null;`
);

code = code.replace(
  /await deleteScheduleItem\(id\);/,
  `// local delete`
);

code = code.replace(
  /const batchUpdates = updatedList\.map\(\(item\) => \{\s*return updateDoc\(doc\(db, "schedule", item\.id\), \{ order: item\.order \}\);\s*\}\);\s*await Promise\.all\(batchUpdates\);/,
  `// order updated in state`
);

fs.writeFileSync('src/components/ScheduleSection.tsx', code);
