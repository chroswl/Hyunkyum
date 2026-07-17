const fs = require('fs');

let code = fs.readFileSync('src/components/BiographySection.tsx', 'utf8');

// The image ternary is:
// {isEditMode ? (
//   <div className="p-4 bg-[var(--color-bg)] min-h-[400px] flex flex-col space-y-4 relative">
//     ...
//   </div>
// ) : (
//   <div 
//     className="relative cursor-pointer w-full h-full overflow-hidden group"

// Replace the image ternary
const imageStart = code.indexOf('{isEditMode ? (\\n                  <div className="p-4 bg-[var(--color-bg)] min-h-[400px] flex flex-col space-y-4 relative">');
// Since whitespace might be slightly different, let's use regex for safer replacement.
code = code.replace(/\{isEditMode \? \([\s\S]*?\) : \([\s\S]*?(<div \s*className="relative cursor-pointer w-full h-full overflow-hidden group"[\s\S]*?<\/div>)\s*\)\}/, '$1');

// Replace the text ternary
// {!isEditMode ? ( <article ... ) : ( <div ... )}
code = code.replace(/\{!isEditMode \? \([\s\S]*?(<article itemScope itemType="https:\/\/schema\.org\/Person">[\s\S]*?<\/article>)\s*\) : \([\s\S]*?<div className="space-y-4 border border-\[var\(--color-text\)\] p-4 rounded bg-\[var\(--color-bg\)\]">[\s\S]*?<\/div>\s*\)\}/, '$1');

// Replace the timeline ternary
// {isEditMode ? ( <div className="bg-[var(--color-bg)]/30 p-6 min-h-[160px] ... ) : ( <div id="timeline-content-area" ... )}
code = code.replace(/\{isEditMode \? \([\s\S]*?<div className="bg-\[var\(--color-bg\)\]\/30 p-6 min-h-\[160px\] border border-\[var\(--color-text\)\] rounded-b mt-\[-1px\]">[\s\S]*?\) : \([\s\S]*?(<div id="timeline-content-area" className="bg-\[var\(--color-bg\)\]\/\[0\.03\] p-6 min-h-\[160px\]">[\s\S]*?<\/div>\s*)\)\}/, '$1');

fs.writeFileSync('src/components/BiographySection.tsx', code);
