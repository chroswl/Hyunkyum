const fs = require('fs');

let file = fs.readFileSync('src/components/AdminPanel.tsx', 'utf-8');
const bioBlock = fs.readFileSync('bio_block.txt', 'utf-8');

const bioStart = file.indexOf('{/* TAB: BIOGRAPHY */}');
const bioEnd = file.indexOf('{/* TAB 6: CONTACT MESSAGES */}');

file = file.substring(0, bioStart) + bioBlock + file.substring(bioEnd);

fs.writeFileSync('src/components/AdminPanel.tsx', file);
console.log("Restored bio block");
