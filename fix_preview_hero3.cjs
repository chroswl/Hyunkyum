const fs = require('fs');
let prev = fs.readFileSync('src/components/admin/HeroPreview.tsx', 'utf-8');
prev = prev.replace(/style=\{\{ opacity: settings\?\.homeOverlayOpacity[\s\S]*?\}\}/g, "style={{ opacity: 0.6 }}");
prev = prev.replace(/style=\{\{ backdropFilter: \`blur\(\$\{settings\?\.homeBlurAmount[\s\S]*?\}\}/g, "style={{ backdropFilter: 'blur(0px)' }}");
fs.writeFileSync('src/components/admin/HeroPreview.tsx', prev);
console.log("Fixed overlay opacity");
