const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminTheme.tsx', 'utf8');

code = code.replace(
  "import { Monitor, Smartphone, Tablet }",
  "import { Monitor, Smartphone, Tablet } from 'lucide-react';\nimport IFramePreview from './IFramePreview';"
);

code = code.replace(
  '<div id="theme-preview-scope" className="w-full h-full overflow-y-auto bg-black custom-scrollbar selection:bg-white selection:text-black scroll-smooth">',
  '<IFramePreview className="w-full h-full bg-black">'
);

code = code.replace(
  '</div>\n            </div>\n          )}',
  '</div>\n            </IFramePreview>\n          )}'
);

fs.writeFileSync('src/components/admin/AdminTheme.tsx', code);
