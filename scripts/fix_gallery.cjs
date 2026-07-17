const fs = require('fs');
let code = fs.readFileSync('src/components/PortfolioGallery.tsx', 'utf8');

// remove `)}` from the end of the public read-only section
code = code.replace(/<\/AnimatePresence>\n\s*<\/div>\n\s*\)}/, '</AnimatePresence>\n        </div>');

// also remove `/* ========================================================` comment if it exists
// let's just make it valid
fs.writeFileSync('src/components/PortfolioGallery.tsx', code);
