import re

with open('src/components/admin/appearance/TypographyPanel.tsx', 'r') as f:
    content = f.read()

typo_assignments = """      <div>
        <h4 className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-bold mb-3 border-b border-neutral-800 pb-2">Global Font</h4>
        {renderFontSelect('globalFont', 'Global Font Family', 'appFontGlobalTip')}
        
        <div className="mt-4 mb-2 flex items-center justify-between bg-[#111] p-3 rounded border border-neutral-800">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-widest text-white font-bold">Override Individual Fonts</span>
            <span className="text-[9px] text-neutral-500 mt-1">Allow custom fonts for headings, buttons, etc.</span>
          </div>
          <button
            onClick={() => onChange('overrideIndividualFonts', !typography.overrideIndividualFonts)}
            className={`w-10 h-5 rounded-full relative transition-colors ${typography.overrideIndividualFonts ? 'bg-accent' : 'bg-neutral-700'}`}
          >
            <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${typography.overrideIndividualFonts ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>
      
      {typography.overrideIndividualFonts && (
        <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <h4 className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-bold mb-3 border-b border-neutral-800 pb-2">Individual Assignments</h4>
          {renderFontSelect('heroFont', t('appFontHero') as string, 'appFontHeroTip')}
          {renderFontSelect('headingFont', t('appFontHeading') as string, 'appFontHeadingTip')}
          {renderFontSelect('bodyFont', t('appFontBody') as string, 'appFontBodyTip')}
          {renderFontSelect('navigationFont', t('appFontNav') as string, 'appFontNavTip')}
          {renderFontSelect('buttonFont', t('appFontButton') as string, 'appFontButtonTip')}
          {renderFontSelect('quoteFont', t('appFontQuote') as string, 'appFontQuoteTip')}
        </div>
      )}"""

content = re.sub(
    r'<div>\s*<h4 className="text-\[10px\] uppercase tracking-\[0\.2em\] text-neutral-500 font-bold mb-3 border-b border-neutral-800 pb-2">Assignments</h4>[\s\S]*?\{renderFontSelect\(\'quoteFont\', t\(\'appFontQuote\'\) as string, \'appFontQuoteTip\'\)\}\s*<\/div>',
    typo_assignments,
    content
)

with open('src/components/admin/appearance/TypographyPanel.tsx', 'w') as f:
    f.write(content)
