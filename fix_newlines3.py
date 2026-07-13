import re
with open('src/contexts/AppearanceContext.tsx', 'r') as f:
    content = f.read()

replacement = """    // Typography
    const useGlobalFont = !settings.typography.overrideIndividualFonts;
    const globalFont = settings.typography.globalFont || 'Inter';
    root.style.setProperty('--font-hero', useGlobalFont ? globalFont : settings.typography.heroFont);
    root.style.setProperty('--font-heading', useGlobalFont ? globalFont : settings.typography.headingFont);
    root.style.setProperty('--font-navigation', useGlobalFont ? globalFont : settings.typography.navigationFont);
    root.style.setProperty('--font-button', useGlobalFont ? globalFont : settings.typography.buttonFont);
    root.style.setProperty('--font-quote', useGlobalFont ? globalFont : settings.typography.quoteFont);
    root.style.setProperty('--font-body', useGlobalFont ? globalFont : settings.typography.bodyFont);
"""

# Find the line that starts with // Typography\n    const useGlobalFont
content = re.sub(r'    // Typography\\n    const useGlobalFont = !settings.typography.overrideIndividualFonts;    const globalFont = settings.typography.globalFont \|\| \'Inter\';    root.style.setProperty\(\'--font-hero\', useGlobalFont \? globalFont : settings.typography.heroFont\);    root.style.setProperty\(\'--font-heading\', useGlobalFont \? globalFont : settings.typography.headingFont\);    root.style.setProperty\(\'--font-navigation\', useGlobalFont \? globalFont : settings.typography.navigationFont\);    root.style.setProperty\(\'--font-button\', useGlobalFont \? globalFont : settings.typography.buttonFont\);    root.style.setProperty\(\'--font-quote\', useGlobalFont \? globalFont : settings.typography.quoteFont\);    root.style.setProperty\(\'--font-body\', useGlobalFont \? globalFont : settings.typography.bodyFont\);', replacement, content)

with open('src/contexts/AppearanceContext.tsx', 'w') as f:
    f.write(content)
