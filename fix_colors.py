import re

with open('src/components/admin/appearance/ColorPanel.tsx', 'r') as f:
    content = f.read()

nav_section = """      {/* Navigation (Scrolled) */}
      <div className="space-y-1 bg-[#0a0a0a] p-3 rounded-lg border border-neutral-900 mt-4">
        <h4 className="text-[9px] uppercase tracking-[0.2em] text-neutral-500 font-bold mb-3 px-2 flex items-center space-x-2">
          <span>Navigation (Scrolled)</span>
          <div className="h-px bg-neutral-800 flex-1"></div>
        </h4>
        {renderColorRow('navigation.background', 'Navigation Background', 'appColorBgTip')}
        {renderColorRow('navigation.text', 'Navigation Text', 'appColorTextTip')}
        {renderColorRow('navigation.hover', 'Navigation Hover', 'appColorHoverTip')}
        {renderColorRow('navigation.active', 'Navigation Active', 'appColorAccentTip')}
        {renderColorRow('navigation.border', 'Navigation Border', 'appColorBordersTip')}
      </div>

      {/* Navigation (Transparent) */}
      <div className="space-y-1 bg-[#0a0a0a] p-3 rounded-lg border border-neutral-900 mt-4">
        <h4 className="text-[9px] uppercase tracking-[0.2em] text-neutral-500 font-bold mb-3 px-2 flex items-center space-x-2">
          <span>Navigation (Transparent)</span>
          <div className="h-px bg-neutral-800 flex-1"></div>
        </h4>
        {renderColorRow('navigationTransparent.background', 'Navigation Background', 'appColorBgTip')}
        {renderColorRow('navigationTransparent.text', 'Navigation Text', 'appColorTextTip')}
        {renderColorRow('navigationTransparent.hover', 'Navigation Hover', 'appColorHoverTip')}
        {renderColorRow('navigationTransparent.active', 'Navigation Active', 'appColorAccentTip')}
        {renderColorRow('navigationTransparent.border', 'Navigation Border', 'appColorBordersTip')}
      </div>"""

content = re.sub(
    r'\{\/\* Navigation Section \*\/\}[\s\S]*?renderColorRow\(\'navigation\.border\', \'Navigation Border\', \'appColorBordersTip\'\)\s*\}?\s*<\/div>',
    nav_section,
    content
)

with open('src/components/admin/appearance/ColorPanel.tsx', 'w') as f:
    f.write(content)
