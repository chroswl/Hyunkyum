const fs = require('fs');
let code = fs.readFileSync('src/components/BiographySection.tsx', 'utf8');

code = code.replace(/\{isEditMode \? \([\s\S]*?\) : \([\s\S]*?(<div \n\s*className="relative cursor-pointer w-full h-full overflow-hidden group"[\s\S]*?<\/div>)\n\s*\)\}/, '$1');

code = code.replace(/\{\!isEditMode \? \([\s\S]*?(<article itemScope itemType="https:\/\/schema\.org\/Person">[\s\S]*?<\/article>)\n\s*\) : \([\s\S]*?<div className="space-y-4 border border-\[var\(--color-text\)\] p-4 rounded bg-\[var\(--color-bg\)\]">[\s\S]*?<\/div>\n\s*\)\}/, '$1');

code = code.replace(/\{isEditMode \? \([\s\S]*?<div className="bg-\[var\(--color-bg\)\]\/30 p-6 min-h-\[160px\] border border-\[var\(--color-text\)\] rounded-b mt-\[-1px\]">[\s\S]*?\) : \([\s\S]*?(<div id="timeline-content-area" className="bg-\[var\(--color-bg\)\]\/\[0\.03\] p-6 min-h-\[160px\]">[\s\S]*?<\/div>\n\s*)\)\}/, '$1');

fs.writeFileSync('src/components/BiographySection.tsx', code);
