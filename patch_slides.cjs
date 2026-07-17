const fs = require('fs');
let code = fs.readFileSync('src/components/SelectedPerformances.tsx', 'utf8');

code = code.replace(
  /await saveSelectedPerformance\(saveItem as PerformanceSlide\);\s*showNotification\("Slide saved successfully!"\);\s*setEditingItem\(null\);\s*originalItemRef\.current = null;/g,
  `const saved = { ...saveItem };
      if (!saved.id) saved.id = 'temp_' + Date.now();
      
      const newItems = slides.find(i => i.id === saved.id)
        ? slides.map(i => i.id === saved.id ? saved : i)
        : [...slides, saved];
      
      setSlides(newItems);
      if (onItemsUpdated) onItemsUpdated(newItems);
      setEditingItem(null);
      originalItemRef.current = null;`
);

code = code.replace(
  /await deleteSelectedPerformance\(id\);/g,
  `// local delete`
);

code = code.replace(
  /const batchUpdates = updatedList\.map\(\(item, index\) => \{\s*if \(slides\[index\]\?\.id !== item\.id \|\| slides\[index\]\?\.order !== item\.order\) \{\s*return updateDoc\(doc\(db, "selected_performances", item\.id \|\| ''\), \{ order: item\.order \}\);\s*\}\s*return Promise\.resolve\(\);\s*\}\);\s*await Promise\.all\(batchUpdates\);/g,
  `// order updated in state`
);

fs.writeFileSync('src/components/SelectedPerformances.tsx', code);
