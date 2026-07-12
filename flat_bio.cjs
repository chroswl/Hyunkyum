const fs = require('fs');
let file = fs.readFileSync('src/components/AdminPanel.tsx', 'utf-8');

// We know the exact structure of the accordion.
// Let's replace button components.
file = file.replace(/<button[\s\S]*?onClick=\{\(\) => setActiveBioGroup[\s\S]*?<\/button>/g, '');

// We need to replace `{activeBioGroup === 'image' && (` with just the inner div
file = file.replace(/\{activeBioGroup === 'image' && \(\s*<div className="p-5">/g, '<div className="border border-neutral-900 bg-[var(--color-bg)] p-5 rounded space-y-4">\n<h4 className="font-serif text-sm tracking-widest text-[var(--color-text)] uppercase mb-4 border-b border-neutral-900 pb-2">1. Biography Image</h4>');

file = file.replace(/\{activeBioGroup === 'narratives' && \(\s*<div className="p-5 space-y-6">/g, '<div className="border border-neutral-900 bg-[var(--color-bg)] p-5 rounded space-y-4 mt-6">\n<h4 className="font-serif text-sm tracking-widest text-[var(--color-text)] uppercase mb-4 border-b border-neutral-900 pb-2">2. Biography Narratives</h4>');

file = file.replace(/\{activeBioGroup === 'sections' && \(\s*<div className="p-5 space-y-6">/g, '<div className="border border-neutral-900 bg-[var(--color-bg)] p-5 rounded space-y-4 mt-6">\n<h4 className="font-serif text-sm tracking-widest text-[var(--color-text)] uppercase mb-4 border-b border-neutral-900 pb-2">3. Biography Sections</h4>');

// We need to remove the matching `)}` that closed the conditionals.
// These are located right before the `</div>` that closes each accordion section.
// A safe way is to replace `</div>\n    )}\n  </div>` with `</div>\n</div>`. But let's check the indentation.

// Since there are 3 sections, there should be 3 instances of `)}` closing the condition.
file = file.replace(/\n\s*\}\)\}\n\s*<\/div>/g, '\n</div>');

// The outer accordion wrapper:
file = file.replace('{/* Biography Admin Accordion */}\n<div className="space-y-4">', '{/* Biography Admin Flat */}\n<div className="space-y-8">');

fs.writeFileSync('src/components/AdminPanel.tsx', file);
console.log("Flattened bio");
