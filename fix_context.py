import re

with open('src/contexts/AppearanceContext.tsx', 'r') as f:
    content = f.read()

nav_vars = """    // Navigation Customization
    if (settings.colors.navigation) {
      root.style.setProperty('--nav-bg', settings.colors.navigation.background || '#000000');
      root.style.setProperty('--nav-text', settings.colors.navigation.text || '#ffffff');
      root.style.setProperty('--nav-hover', settings.colors.navigation.hover || '#C9A227');
      root.style.setProperty('--nav-active', settings.colors.navigation.active || '#ffffff');
      root.style.setProperty('--nav-border', settings.colors.navigation.border || '#333333');
      root.style.setProperty('--nav-shadow', settings.colors.navigation.shadow || 'none');
    }
    if (settings.colors.navigationTransparent) {
      root.style.setProperty('--nav-transparent-bg', settings.colors.navigationTransparent.background || 'transparent');
      root.style.setProperty('--nav-transparent-text', settings.colors.navigationTransparent.text || '#ffffff');
      root.style.setProperty('--nav-transparent-hover', settings.colors.navigationTransparent.hover || '#C9A227');
      root.style.setProperty('--nav-transparent-active', settings.colors.navigationTransparent.active || '#ffffff');
      root.style.setProperty('--nav-transparent-border', settings.colors.navigationTransparent.border || 'transparent');
      root.style.setProperty('--nav-transparent-shadow', settings.colors.navigationTransparent.shadow || 'none');
    }"""

content = re.sub(
    r'(\s+)// Navigation Customization\s+if \(settings\.colors\.navigation\) \{.*?\}',
    nav_vars,
    content,
    flags=re.DOTALL
)

typo_vars = """    const useGlobalFont = !settings.typography.overrideIndividualFonts;
    const globalFont = settings.typography.globalFont || 'Inter';

    root.style.setProperty('--font-hero', useGlobalFont ? globalFont : settings.typography.heroFont);
    root.style.setProperty('--font-heading', useGlobalFont ? globalFont : settings.typography.headingFont);
    root.style.setProperty('--font-navigation', useGlobalFont ? globalFont : settings.typography.navigationFont);
    root.style.setProperty('--font-button', useGlobalFont ? globalFont : settings.typography.buttonFont);
    root.style.setProperty('--font-quote', useGlobalFont ? globalFont : settings.typography.quoteFont);
    root.style.setProperty('--font-body', useGlobalFont ? globalFont : settings.typography.bodyFont);"""

content = re.sub(
    r'(\s+)root\.style\.setProperty\(\'--font-hero\', settings\.typography\.heroFont\);\s+root\.style\.setProperty\(\'--font-heading\', settings\.typography\.headingFont\);\s+root\.style\.setProperty\(\'--font-navigation\', settings\.typography\.navigationFont\);\s+root\.style\.setProperty\(\'--font-button\', settings\.typography\.buttonFont\);\s+root\.style\.setProperty\(\'--font-quote\', settings\.typography\.quoteFont\);\s+root\.style\.setProperty\(\'--font-body\', settings\.typography\.bodyFont\);',
    typo_vars,
    content,
    flags=re.DOTALL
)

# Also update the uniqueGoogleFonts array extraction
font_arr = """    const uniqueGoogleFonts = Array.from(new Set([
      appearance.typography.globalFont,
      appearance.typography.heroFont,
      appearance.typography.headingFont,
      appearance.typography.bodyFont,
      appearance.typography.navigationFont,
      appearance.typography.buttonFont,
      appearance.typography.quoteFont
    ]))"""

content = re.sub(
    r'(\s+)const uniqueGoogleFonts = Array\.from\(new Set\(\[appearance\.typography\.heroFont.*?\]\)\)',
    font_arr,
    content,
    flags=re.DOTALL
)

with open('src/contexts/AppearanceContext.tsx', 'w') as f:
    f.write(content)
