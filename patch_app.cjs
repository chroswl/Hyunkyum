const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /batch\.set\(doc\(db, '([^']+)', item\.id\), \{ \.\.\.item, order: index \}\);/g;
code = code.replace(regex, (match, collection) => {
  return `const itemToSave = { ...item, order: index };
        const initialItem = initial.find((i: any) => i.id === item.id);
        if (!initialItem || JSON.stringify({ ...initialItem, order: initial.findIndex((i: any) => i.id === item.id) }) !== JSON.stringify(itemToSave)) {
          batch.set(doc(db, '${collection}', item.id), itemToSave);
        }`;
});

fs.writeFileSync('src/App.tsx', code);
