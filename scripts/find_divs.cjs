const fs = require('fs');
const content = fs.readFileSync('src/components/WebsiteContent.tsx', 'utf8');
let openCount = 0;
let lines = content.split('\n');
lines.forEach((line, i) => {
  const opens = (line.match(/<div/g) || []).length;
  const closes = (line.match(/<\/div/g) || []).length;
  openCount += opens - closes;
  if (opens !== closes) {
    console.log(`Line ${i + 1}: opens ${opens}, closes ${closes}, balance ${openCount}`);
  }
});
