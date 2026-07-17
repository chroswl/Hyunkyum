with open('src/App.tsx', 'r') as f:
    content = f.read()

content = content.replace("const [theme, setTheme] = useState<ThemeSettings>({ bg: '#000000', text: '#ffffff', accent: '#ffffff' });", "const [theme, setTheme] = useState<ThemeSettings>({ bg: '#000000', text: '#ffffff', accent: '#ffffff' });\n  const initialThemeRef = useRef<ThemeSettings | null>(null);")

content = content.replace("setTheme(themeData);", "setTheme(themeData);\n        initialThemeRef.current = themeData;")

with open('src/App.tsx', 'w') as f:
    f.write(content)
