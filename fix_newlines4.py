with open('src/contexts/AppearanceContext.tsx', 'r') as f:
    content = f.read()

content = content.replace("    // Typography\\n    const useGlobalFont = !settings.typography.overrideIndividualFonts;", "    // Typography\\n    const useGlobalFont = !settings.typography.overrideIndividualFonts;")

import re
content = re.sub(r'// Typography\\n\s+const useGlobalFont = !settings.typography.overrideIndividualFonts;', '// Typography\n    const useGlobalFont = !settings.typography.overrideIndividualFonts;', content)

with open('src/contexts/AppearanceContext.tsx', 'w') as f:
    f.write(content)
