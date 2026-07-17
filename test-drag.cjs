const fs = require('fs');

let items = [
  { id: '1', category: 'Portrait', order: 0 },
  { id: '2', category: 'Stage', order: 1 },
  { id: '3', category: 'Portrait', order: 2 },
  { id: '4', category: 'Portrait', order: 3 },
];

let activeCategory = 'Portrait';
let filteredItems = items.filter(item => item.category === activeCategory);
// [1, 3, 4]

// Drag item 4 to index 0
let newItems = [
  filteredItems[2],
  filteredItems[0],
  filteredItems[1]
];
// [4, 1, 3]

const newMasterItems = [...items];
const indices = filteredItems.map(fi => items.findIndex(i => i.id === fi.id));
indices.forEach((masterIndex, i) => {
  if (masterIndex !== -1) {
    newMasterItems[masterIndex] = newItems[i];
  }
});

const finalizedItems = newMasterItems.map((item, idx) => ({ ...item, order: idx }));

console.log("Original items:", items.map(i => i.id));
console.log("Filtered items:", filteredItems.map(i => i.id));
console.log("New filtered items:", newItems.map(i => i.id));
console.log("Finalized items:", finalizedItems.map(i => i.id));
console.log("Finalized filtered items:", finalizedItems.filter(item => item.category === activeCategory).map(i => i.id));
