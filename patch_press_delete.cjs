const fs = require('fs');
let code = fs.readFileSync('src/components/PressSection.tsx', 'utf8');

code = code.replace(
  /await deletePressItem\(id\);\s*\/\/ Update local state and adjust selection if needed/,
  `// Update local state and adjust selection if needed`
);

// Also we need to check if we removed the batchUpdates in onReorder
code = code.replace(
  /const batchUpdates = updatedList\.map\(\(item\) => \{\s*return updateDoc\(doc\(db, "press", item\.id\), \{ order: item\.order \}\);\s*\}\);\s*await Promise\.all\(batchUpdates\);\s*showNotification\("Press order updated successfully"\);/g,
  `// showNotification("Press order updated successfully");`
);

fs.writeFileSync('src/components/PressSection.tsx', code);
