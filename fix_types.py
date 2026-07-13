import re

with open('src/types/appearance.ts', 'r') as f:
    content = f.read()

# Add navigationTransparent to colors
content = re.sub(
    r'(\s+)navigation: \{',
    r'\1navigation: {\n\1  background: string;\n\1  text: string;\n\1  hover: string;\n\1  active: string;\n\1  border: string;\n\1  shadow: string;\n\1};\n\1navigationTransparent: {',
    content, count=1
)

# Also fix the defaultAppearanceSettings
content = re.sub(
    r'(\s+)navigation: \{\s+background: "#000000",\s+text: "#ffffff",\s+hover: "#C9A227",\s+active: "#ffffff",\s+border: "#333333",\s+shadow: "none"\s+\},',
    r'\1navigation: {\n\1  background: "#000000",\n\1  text: "#ffffff",\n\1  hover: "#C9A227",\n\1  active: "#ffffff",\n\1  border: "#333333",\n\1  shadow: "none"\n\1},\n\1navigationTransparent: {\n\1  background: "transparent",\n\1  text: "#ffffff",\n\1  hover: "#C9A227",\n\1  active: "#ffffff",\n\1  border: "transparent",\n\1  shadow: "none"\n\1},',
    content
)


# Add globalFont and overrideIndividualFonts to typography
content = re.sub(
    r'(\s+)typography: \{',
    r'\1typography: {\n\1  globalFont: string;\n\1  overrideIndividualFonts: boolean;',
    content, count=1
)

content = re.sub(
    r'(\s+)typography: \{\s+heroFont: "Space Grotesk",',
    r'\1typography: {\n\1  globalFont: "Inter",\n\1  overrideIndividualFonts: true,\n\1  heroFont: "Space Grotesk",',
    content
)

with open('src/types/appearance.ts', 'w') as f:
    f.write(content)
