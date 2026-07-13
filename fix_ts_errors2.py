import re

# Fix AppearanceControlCenter.tsx
with open('src/components/admin/appearance/AppearanceControlCenter.tsx', 'r') as f:
    content = f.read()

content = content.replace("import { useAppearance } from '../../../contexts/AppearanceContext';", "import { useAppearance } from '../../../contexts/AppearanceContext';\nimport { AppearanceSettings } from '../../../types/appearance';")
content = content.replace("<AppearanceHistoryPanel currentAppearance={localState} onRestore={", "<AppearanceHistoryPanel currentLang={currentLang} currentAppearance={localState} onRestore={")
content = content.replace("<ThemeLibrary \n            currentAppearance={localState}", "<ThemeLibrary \n            currentLang={currentLang}\n            currentAppearance={localState}")

with open('src/components/admin/appearance/AppearanceControlCenter.tsx', 'w') as f:
    f.write(content)

# Fix AppearanceHistoryPanel.tsx
with open('src/components/admin/AppearanceHistoryPanel.tsx', 'r') as f:
    content = f.read()

keys = ["appHistTitle", "appHistSearch", "appHistNewest", "appHistOldest", "appHistLoading", "appHistEmpty", "appHistCompare", "appHistRestore", "appHistIdentical"]
for key in keys:
    content = content.replace(f"t('{key}')", f"t('{key}' as any) as string")

with open('src/components/admin/AppearanceHistoryPanel.tsx', 'w') as f:
    f.write(content)

# Fix ConfigPanel.tsx
with open('src/components/admin/appearance/ConfigPanel.tsx', 'r') as f:
    content = f.read()

keys = ["appNavSticky", "appNavTrans", "appNavBlur", "appNavHeight", "appNavLogoSize", "appNavMenuGap", "appAnimEnabled", "appAnimSpeed", "appAnimStyle"]
for key in keys:
    content = content.replace(f"t('{key}')", f"t('{key}' as any) as string")

with open('src/components/admin/appearance/ConfigPanel.tsx', 'w') as f:
    f.write(content)

