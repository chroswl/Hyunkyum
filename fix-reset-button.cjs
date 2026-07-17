const fs = require('fs');
let content = fs.readFileSync('src/components/PortfolioGallery.tsx', 'utf8');

// The first replacement wrongly added the Reset button to the top X button.
// We can just revert it and do it properly at the bottom.

// First remove the wrong Reset button at the top
content = content.replace(
  /<button\s*type="button"\s*onClick=\{\(\) => \{\s*if \(originalItemRef\.current\) \{\s*setEditingItem\(\{\.\.\.originalItemRef\.current\}\);\s*\} else \{\s*setEditingItem\(\{\s*category: 'Portrait',\s*url: '',\s*title: \{ EN: '', DE: '', KO: '' \},\s*copyright: '',\s*copyrightUrl: '',\s*order: items\.length\s*\}\);\s*\}\s*\}\}\s*className="px-4 py-2 border border-white\/10 hover:border-white\/30 hover:bg-white\/5 rounded-sm text-neutral-400 hover:text-white text-xs tracking-wider uppercase font-sans transition-all cursor-pointer"\s*>\s*Reset\s*<\/button>\s*/,
  ""
);

// Now add it correctly at the bottom, before {t.adminCancel}
const bottomResetUI = `<button
                type="button"
                onClick={() => {
                  if (originalItemRef.current) {
                    setEditingItem({...originalItemRef.current});
                  } else {
                    setEditingItem({
                      category: 'Portrait',
                      url: '',
                      title: { EN: '', DE: '', KO: '' },
                      copyright: '',
                      copyrightUrl: '',
                      order: items.length
                    });
                  }
                }}
                className="px-4 py-2 border border-white/10 hover:border-white/30 hover:bg-white/5 rounded-sm text-neutral-400 hover:text-white text-xs tracking-wider uppercase font-sans transition-all cursor-pointer"
              >
                Reset
              </button>\n              `;

content = content.replace(
  /<button\s*type="button"\s*onClick=\{handleCancelEdit\}\s*className="px-4 py-2 border border-white\/10 hover:border-white\/30 hover:bg-white\/5 rounded-sm text-neutral-400 hover:text-white text-xs tracking-wider uppercase font-sans transition-all cursor-pointer"\s*>\s*\{t\.adminCancel\}\s*<\/button>/,
  bottomResetUI + `<button
                type="button"
                onClick={handleCancelEdit}
                className="px-4 py-2 border border-white/10 hover:border-white/30 hover:bg-white/5 rounded-sm text-neutral-400 hover:text-white text-xs tracking-wider uppercase font-sans transition-all cursor-pointer"
              >
                {t.adminCancel}
              </button>`
);

fs.writeFileSync('src/components/PortfolioGallery.tsx', content);

