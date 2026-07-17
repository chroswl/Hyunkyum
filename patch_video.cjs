const fs = require('fs');
let code = fs.readFileSync('src/components/VideoPlayer.tsx', 'utf8');

code = code.replace(
  /const saved = await saveVideoItem\(saveItem as VideoItem\);\s*showNotification\("Video saved successfully"\);\s*setActiveVideo\(saved\); \/\/ Update active video in player immediately after saving\s*setEditingItem\(null\);\s*originalItemRef\.current = null;/,
  `const saved = { ...saveItem };
      if (!saved.id) saved.id = 'temp_' + Date.now();
      
      const newItems = items.find(i => i.id === saved.id)
        ? items.map(i => i.id === saved.id ? saved : i)
        : [...items, saved];
      
      onItemsUpdated(newItems);
      setActiveVideo(saved);
      setEditingItem(null);
      originalItemRef.current = null;`
);

code = code.replace(
  /await deleteVideoItem\(id\);/,
  `// delete local only`
);

code = code.replace(
  /const batchUpdates = updatedList\.map\(\(item\) => \{\s*return updateDoc\(doc\(db, "videos", item\.id\), \{ order: item\.order \}\);\s*\}\);\s*await Promise\.all\(batchUpdates\);\s*showNotification\("Videos order updated successfully"\);/,
  `// order updated in state`
);

fs.writeFileSync('src/components/VideoPlayer.tsx', code);
