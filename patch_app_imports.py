with open('src/App.tsx', 'r') as f:
    content = f.read()

import_statement = "import HeroEditorPanel from './components/HeroEditorPanel';\n"
if "HeroEditorPanel" not in content:
    content = content.replace("import Reveal from './components/Reveal';", "import Reveal from './components/Reveal';\n" + import_statement)

# Now add initialThemeRef
if "const initialThemeRef" not in content:
    content = content.replace("const [theme, setTheme] = useState<ThemeSettings>({});", "const [theme, setTheme] = useState<ThemeSettings>({});\n const initialThemeRef = useRef<ThemeSettings | null>(null);")

# We need to set initialThemeRef when theme is fetched
fetch_theme_code = "const t = await fetchThemeSettings();\n        setTheme(t);"
new_fetch_theme_code = "const t = await fetchThemeSettings();\n        setTheme(t);\n        initialThemeRef.current = t;"
content = content.replace(fetch_theme_code, new_fetch_theme_code)

with open('src/App.tsx', 'w') as f:
    f.write(content)

print("Imports and refs patched!")
