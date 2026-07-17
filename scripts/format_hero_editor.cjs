const fs = require('fs');
let content = fs.readFileSync('src/components/HeroEditorPanel.tsx', 'utf-8');

// General sizing and paddings
content = content.replace(/className="p-3 space-y-4 overflow-y-auto max-h-\[55vh\] custom-scrollbar"/, 'className="p-2 space-y-3 overflow-y-auto max-h-[70vh] custom-scrollbar"');
content = content.replace(/space-y-3 pt-3 border-t border-neutral-900/g, 'space-y-2 pt-2 border-t border-neutral-900');
content = content.replace(/space-y-1\.5/g, 'space-y-1');

// Sliders and inputs spacing
content = content.replace(/className="flex items-center space-x-2"/g, 'className="flex items-center space-x-1.5"');
content = content.replace(/gap-1\.5/g, 'gap-1');

// Text sizing and height
content = content.replace(/px-3 py-2/g, 'px-2 py-1.5');
content = content.replace(/w-64/g, 'w-60');
content = content.replace(/h-1\.5/g, 'h-1'); // Slider height
content = content.replace(/h-3 w-3/g, 'h-2.5 w-2.5'); // thumb size might be handled differently, let's just make it tighter.
content = content.replace(/text-\[9px\]/g, 'text-[10px]'); // Slightly more readable but tighter
content = content.replace(/text-\[8px\]/g, 'text-[9px]');

fs.writeFileSync('src/components/HeroEditorPanel.tsx', content);
console.log("Refined Hero Editor Panel styling");
