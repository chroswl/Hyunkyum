import re
import os

# Fix ConfigPanel
with open('src/components/admin/appearance/ConfigPanel.tsx', 'r') as f:
    content = f.read()

content = content.replace("t('appAnimStyle')", "t('appAnimStyle' as any) as string")
content = content.replace("t('appPortCols')", "t('appPortCols' as any) as string")
content = content.replace("t('appPortGap')", "t('appPortGap' as any) as string")
content = content.replace("t('appPortHover')", "t('appPortHover' as any) as string")
content = content.replace("t('appPortRound')", "t('appPortRound' as any) as string")

with open('src/components/admin/appearance/ConfigPanel.tsx', 'w') as f:
    f.write(content)

# Fix LayoutPanel
with open('src/components/admin/appearance/LayoutPanel.tsx', 'r') as f:
    content = f.read()

content = content.replace("t('appLayoutMaxW')", "t('appLayoutMaxW' as any) as string")
content = content.replace("t('appLayoutSecSpace')", "t('appLayoutSecSpace' as any) as string")
content = content.replace("t('appLayoutConSpace')", "t('appLayoutConSpace' as any) as string")
content = content.replace("t('appLayoutVerticalRhythm')", "t('appLayoutVerticalRhythm' as any) as string")
content = content.replace("t('appLayoutRadius')", "t('appLayoutRadius' as any) as string")
content = content.replace("t('appLayoutCardPad')", "t('appLayoutCardPad' as any) as string")

with open('src/components/admin/appearance/LayoutPanel.tsx', 'w') as f:
    f.write(content)

# Fix ThemeLibrary
with open('src/components/admin/appearance/ThemeLibrary.tsx', 'r') as f:
    content = f.read()

content = content.replace("t('appBuiltIn')", "t('appBuiltIn' as any) as string")

with open('src/components/admin/appearance/ThemeLibrary.tsx', 'w') as f:
    f.write(content)

# Fix TypographyPanel
with open('src/components/admin/appearance/TypographyPanel.tsx', 'r') as f:
    content = f.read()

content = content.replace("t('appFontHero')", "t('appFontHero' as any) as string")
content = content.replace("t('appFontHeading')", "t('appFontHeading' as any) as string")
content = content.replace("t('appFontBody')", "t('appFontBody' as any) as string")
content = content.replace("t('appFontNav')", "t('appFontNav' as any) as string")
content = content.replace("t('appFontButton')", "t('appFontButton' as any) as string")
content = content.replace("t('appFontQuote')", "t('appFontQuote' as any) as string")
content = content.replace("t('appFontBaseSize')", "t('appFontBaseSize' as any) as string")
content = content.replace("t('appFontHeadingScale')", "t('appFontHeadingScale' as any) as string")
content = content.replace("t('appFontLineHeight')", "t('appFontLineHeight' as any) as string")
content = content.replace("t('appFontWeight')", "t('appFontWeight' as any) as string")

with open('src/components/admin/appearance/TypographyPanel.tsx', 'w') as f:
    f.write(content)

