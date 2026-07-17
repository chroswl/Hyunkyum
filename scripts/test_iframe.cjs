const fs = require('fs');
const admintheme = fs.readFileSync('src/components/admin/AdminTheme.tsx', 'utf8');
console.log(admintheme.includes('IFramePreview'));
