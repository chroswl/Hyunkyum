const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

// Remove HeroEditorPanel import
content = content.replace("import HeroEditorPanel from './components/HeroEditorPanel';\n", '');

// Remove HeroEditorPanel tag and its props
content = content.replace(/<HeroEditorPanel[\s\S]*?\/>/, '');

fs.writeFileSync('src/App.tsx', content);
console.log("Removed HeroEditorPanel from App.tsx");
