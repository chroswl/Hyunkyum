import re

with open('src/components/admin/appearance/ColorPanel.tsx', 'r') as f:
    content = f.read()

portfolio_section = """      {/* Portfolio Section */}
      <div className="space-y-1 bg-[#0a0a0a] p-3 rounded-lg border border-neutral-900 mt-4">
        <h4 className="text-[9px] uppercase tracking-[0.2em] text-neutral-500 font-bold mb-3 px-2 flex items-center space-x-2">
          <span>Portfolio</span>
          <div className="h-px bg-neutral-800 flex-1"></div>
        </h4>
        {renderColorRow('portfolio.background', 'Background', 'appColorBgTip')}
        {renderColorRow('portfolio.title', 'Title Text', 'appColorPrimaryTip')}
        {renderColorRow('portfolio.description', 'Description Text', 'appColorMutedTip')}
        {renderColorRow('portfolio.cardBg', 'Card Background', 'appColorSurfaceTip')}
        {renderColorRow('portfolio.cardText', 'Card Text', 'appColorTextTip')}
      </div>

      {/* Bio Section */}"""

content = re.sub(r'\{\/\* Bio Section \*\/\}', portfolio_section, content)

with open('src/components/admin/appearance/ColorPanel.tsx', 'w') as f:
    f.write(content)

