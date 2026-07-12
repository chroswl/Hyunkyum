const fs = require('fs');

let file = fs.readFileSync('src/components/AdminPanel.tsx', 'utf-8');

const bioStart = file.indexOf('{/* TAB: BIOGRAPHY */}');
const bioEnd = file.indexOf('{/* TAB 6: CONTACT MESSAGES */}');

let bioBlock = file.substring(bioStart, bioEnd);

// 1. Remove accordion wrapper start
bioBlock = bioBlock.replace('{/* Biography Admin Accordion */}\n<div className="space-y-4">', '<div className="space-y-8">');

// 2. Remove Biography Image Accordion button
const imageBtnStart = bioBlock.indexOf('<button\n      type="button"');
const imageBtnEnd = bioBlock.indexOf('</button>', imageBtnStart) + '</button>'.length;
bioBlock = bioBlock.substring(0, imageBtnStart) + bioBlock.substring(imageBtnEnd);

// 3. Remove conditional rendering for image
bioBlock = bioBlock.replace("{activeBioGroup === 'image' && (\n      <div className=\"p-5\">", "<div className=\"p-5 border border-neutral-900 bg-[var(--color-bg)] rounded-sm space-y-4\">\n<h4 className=\"font-serif text-sm tracking-widest text-[var(--color-text)] uppercase mb-4 border-b border-neutral-900 pb-2\">1. Biography Image</h4>");
bioBlock = bioBlock.replace(/<\/div>\n    \)}\n  <\/div>/, '</div>');

// 4. Remove Narratives Accordion button
const narBtnStart = bioBlock.indexOf('<button\n      type="button"');
if (narBtnStart !== -1) {
  const narBtnEnd = bioBlock.indexOf('</button>', narBtnStart) + '</button>'.length;
  bioBlock = bioBlock.substring(0, narBtnStart) + bioBlock.substring(narBtnEnd);
}

// 5. Remove conditional rendering for narratives
bioBlock = bioBlock.replace("{activeBioGroup === 'narratives' && (\n      <div className=\"p-5 space-y-6\">", "<div className=\"p-5 border border-neutral-900 bg-[var(--color-bg)] rounded-sm space-y-6\">\n<h4 className=\"font-serif text-sm tracking-widest text-[var(--color-text)] uppercase mb-4 border-b border-neutral-900 pb-2\">2. Biography Narratives</h4>");
bioBlock = bioBlock.replace(/<\/div>\n    \)}\n  <\/div>/, '</div>');

// 6. Remove Sections Accordion button
const secBtnStart = bioBlock.indexOf('<button\n      type="button"');
if (secBtnStart !== -1) {
  const secBtnEnd = bioBlock.indexOf('</button>', secBtnStart) + '</button>'.length;
  bioBlock = bioBlock.substring(0, secBtnStart) + bioBlock.substring(secBtnEnd);
}

// 7. Remove conditional rendering for sections
bioBlock = bioBlock.replace("{activeBioGroup === 'sections' && (\n      <div className=\"p-5 space-y-6\">", "<div className=\"p-5 border border-neutral-900 bg-[var(--color-bg)] rounded-sm space-y-6\">\n<h4 className=\"font-serif text-sm tracking-widest text-[var(--color-text)] uppercase mb-4 border-b border-neutral-900 pb-2\">3. Biography Sections</h4>");
bioBlock = bioBlock.replace(/<\/div>\n    \)}\n  <\/div>/, '</div>');

// 8. Fix closing tags if any. Since we did replace, let's just make sure there are no floating `)}`.
bioBlock = bioBlock.replace(/<\/div>\n    \)}\n  <\/div>/g, '</div></div>');

file = file.substring(0, bioStart) + bioBlock + file.substring(bioEnd);

fs.writeFileSync('src/components/AdminPanel.tsx', file);
console.log("Transformed bio block successfully");
