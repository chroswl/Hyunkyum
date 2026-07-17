const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf-8');

// Replace the padded container with a full-height, flex container
content = content.replace(
  /<div className="flex-1 overflow-y-auto p-6 lg:p-10">\s*<div className="max-w-5xl mx-auto w-full">([\s\S]*?)<\/div>\s*<\/div>/,
  '<div className="flex-1 overflow-hidden flex flex-col">\n              <div className="w-full h-full overflow-y-auto">\n$1\n              </div>\n            </div>'
);

fs.writeFileSync('src/components/AdminPanel.tsx', content);
console.log("Updated AdminPanel layout");
