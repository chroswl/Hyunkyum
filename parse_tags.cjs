const fs = require('fs');
const code = fs.readFileSync('src/components/admin/AdminAppearance.tsx', 'utf8');

let stack = [];
let lines = code.split('\n');

for (let i = 0; i < lines.length; i++) {
  let line = lines[i];
  
  // ignore comments simply
  if (line.includes('//')) line = line.split('//')[0];
  
  let openMatches = line.match(/<[a-zA-Z]+/g) || [];
  let closeMatches = line.match(/<\/[a-zA-Z]+/g) || [];
  let selfClosing = line.match(/<[a-zA-Z]+[^>]*\/>/g) || [];
  
  let opens = openMatches.length - selfClosing.length;
  let closes = closeMatches.length;
  
  for(let j=0; j<opens; j++) stack.push(i+1);
  for(let j=0; j<closes; j++) stack.pop();
}

console.log("Unclosed tags opened at lines:", stack);
