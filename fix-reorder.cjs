const fs = require('fs');
let content = fs.readFileSync('src/components/PortfolioGallery.tsx', 'utf8');

const newOnReorder = `onReorder={async (newItems) => {
              const newMasterItems = [...items];
              const indices = filteredItems.map(fi => items.findIndex(i => i.id === fi.id));
              indices.forEach((masterIndex, i) => {
                if (masterIndex !== -1) {
                  newMasterItems[masterIndex] = newItems[i];
                }
              });
              
              const finalizedItems = newMasterItems.map((item, idx) => ({ ...item, order: idx }));
              onItemsUpdated(finalizedItems);
              
              try {
                const changedItems = finalizedItems.filter((item, idx) => item.id !== items[idx]?.id || item.order !== items[idx]?.order);
                const batchUpdates = changedItems.map(item => {
                  return updateDoc(doc(db, "portfolio", item.id), { order: item.order });
                });
                await Promise.all(batchUpdates);
                showNotification("Order updated successfully");
              } catch (err) {
                console.error("Error saving order:", err);
                showNotification("Failed to update order", "error");
              }
            }}`;

content = content.replace(
  /onReorder=\{async \(newItems\) => \{[\s\S]*?console\.error\("Error saving order:", err\);\s*showNotification\("Failed to update order", "error"\);\s*\}\s*\}\}/,
  newOnReorder
);

fs.writeFileSync('src/components/PortfolioGallery.tsx', content);
