with open('src/contexts/AppearanceContext.tsx', 'r') as f:
    content = f.read()

content = content.replace("    // Typography    const useGlobalFont = !settings.typography.overrideIndividualFonts;", "    // Typography\\n    const useGlobalFont = !settings.typography.overrideIndividualFonts;")

with open('src/contexts/AppearanceContext.tsx', 'w') as f:
    f.write(content)
