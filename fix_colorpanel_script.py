import re
with open('src/components/admin/appearance/ColorPanel.tsx', 'r') as f:
    content = f.read()

replacement = """      {/* Navigation (Scrolled) Section */}
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
        <div className="flex flex-col p-2 hover:bg-white/5 rounded border border-transparent hover:border-neutral-800 transition-colors">
          <div className="flex flex-col mb-2">
            <span className="text-[10px] text-neutral-300 uppercase tracking-widest mb-1">Navigation Shadow</span>
            <input 
              type="text" 
              value={colors.navigation?.shadow || 'none'}
              onChange={(e) => onChange('navigation', { ...(colors.navigation as any), shadow: e.target.value })}
              className="bg-black border border-neutral-800 rounded px-2 py-1.5 text-[9px] text-white focus:outline-none focus:border-neutral-600 font-mono w-full"
            />
          </div>
        </div>
      </div>

      {/* Navigation (Transparent) Section */}
      <div className="space-y-1 bg-[#0a0a0a] p-3 rounded-lg border border-neutral-900 mt-4">
        <h4 className="text-[9px] uppercase tracking-[0.2em] text-neutral-500 font-bold mb-3 px-2 flex items-center space-x-2">
          <span>Navigation (Transparent)</span>
          <div className="h-px bg-neutral-800 flex-1"></div>
        </h4>
        {renderColorRow('navigationTransparent.background', 'Background', 'appColorBgTip')}
        {renderColorRow('navigationTransparent.text', 'Text', 'appColorTextTip')}
        {renderColorRow('navigationTransparent.hover', 'Hover', 'appColorHoverTip')}
        {renderColorRow('navigationTransparent.active', 'Active', 'appColorAccentTip')}
        {renderColorRow('navigationTransparent.border', 'Border', 'appColorBordersTip')}
        <div className="flex flex-col p-2 hover:bg-white/5 rounded border border-transparent hover:border-neutral-800 transition-colors">
          <div className="flex flex-col mb-2">
            <span className="text-[10px] text-neutral-300 uppercase tracking-widest mb-1">Navigation Shadow</span>
            <input 
              type="text" 
              value={(colors as any).navigationTransparent?.shadow || 'none'}
              onChange={(e) => onChange('navigationTransparent' as any, { ...((colors as any).navigationTransparent as any), shadow: e.target.value })}
              className="bg-black border border-neutral-800 rounded px-2 py-1.5 text-[9px] text-white focus:outline-none focus:border-neutral-600 font-mono w-full"
            />
          </div>
        </div>
      </div>"""

content = re.sub(
    r'\{\/\* Navigation Section \*\/\}[\s\S]*?\{\/\* Footer Section \*\/\}',
    replacement + '\n      {/* Footer Section */}',
    content
)

with open('src/components/admin/appearance/ColorPanel.tsx', 'w') as f:
    f.write(content)
