const fs = require('fs');
let code = fs.readFileSync('src/components/admin/VideoEditorPanel.tsx', 'utf8');

code = code.replace(/videoUrl/g, 'youtubeId');

fs.writeFileSync('src/components/admin/VideoEditorPanel.tsx', code);
