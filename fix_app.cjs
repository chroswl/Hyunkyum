const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

// The string was:
// {user && activeEditSection === 'hero' && !isAdminOpen && (
//   
// )}
content = content.replace(/\{user && activeEditSection === 'hero' && !isAdminOpen && \([\s\S]*?\)\}/, '');
fs.writeFileSync('src/App.tsx', content);
console.log("Fixed App.tsx");
