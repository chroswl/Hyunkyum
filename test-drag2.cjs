const fs = require('fs');

let items = [
  { id: '1', category: 'Portrait', order: 0 },
  { id: '2', category: 'Stage', order: 1 },
  { id: '3', category: 'Portrait', order: 2 },
  { id: '4', category: 'Backstage', order: 3 },
];

let activeCategory = null;
let filteredItems = [
  items.find(item => item.category === 'Portrait'),
  items.find(item => item.category === 'Stage'),
  items.find(item => item.category === 'Backstage')
].filter(Boolean);
// [1, 2, 4]

// Drag 4 to front
let newItems = [
  filteredItems[2],
  filteredItems[0],
  filteredItems[1]
];
// [4, 1, 2]

const newMasterItems = [...items];
const indices = filteredItems.map(fi => items.findIndex(i => i.id === fi.id));
indices.forEach((masterIndex, i) => {
  if (masterIndex !== -1) {
    newMasterItems[masterIndex] = newItems[i];
  }
});

const finalizedItems = newMasterItems.map((item, idx) => ({ ...item, order: idx }));

let newFilteredItems = [
  finalizedItems.find(item => item.category === 'Portrait'),
  finalizedItems.find(item => item.category === 'Stage'),
  finalizedItems.find(item => item.category === 'Backstage')
].filter(Boolean);

console.log("Original items:", items.map(i => i.id));
console.log("Filtered items:", filteredItems.map(i => i.id));
console.log("New filtered items:", newItems.map(i => i.id));
console.log("Finalized items:", finalizedItems.map(i => i.id));
console.log("Finalized filtered items:", newFilteredItems.map(i => i.id));
