#!/bin/bash
sed -i 's/import { Monitor, Smartphone, Tablet }/import { Monitor, Smartphone, Tablet } from "lucide-react";\nimport IFramePreview from ".\/IFramePreview";/g' src/components/admin/AdminTheme.tsx
sed -i 's/<div id="theme-preview-scope" className="w-full h-full overflow-y-auto bg-black custom-scrollbar selection:bg-white selection:text-black scroll-smooth">/<IFramePreview className="w-full h-full bg-black">/g' src/components/admin/AdminTheme.tsx
sed -i 's/<\/div>\n            <\/div>\n          )}/<\/div>\n            <\/IFramePreview>\n          )}/g' src/components/admin/AdminTheme.tsx
