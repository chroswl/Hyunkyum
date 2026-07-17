const fs = require('fs');
let code = fs.readFileSync('src/components/PressSection.tsx', 'utf8');

// Replace {isEditMode ? ( ... ) : ( ... )}
// The public view starts at: <div className="w-full mx-auto"> ... {pressItems.length === 0 ? ...
code = code.replace(/\{isEditMode \? \([\s\S]*?\) : \([\s\S]*?\/\* ========================================================\n\s*READ-ONLY COMPACT EDITORIAL PRESS CAROUSEL\n\s*======================================================== \*\/\n\s*(<div className="w-full mx-auto">[\s\S]*?<\/div>)\n\s*\)\}/, '$1');

fs.writeFileSync('src/components/PressSection.tsx', code);
