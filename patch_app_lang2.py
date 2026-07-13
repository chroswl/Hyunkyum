with open('src/App.tsx', 'r') as f:
    content = f.read()

old_logic = """const getInitialLang = (): Language => {
  const saved = localStorage.getItem('preferredLang');
  if (saved === 'EN' || saved === 'DE' || saved === 'KO') {
    return saved as Language;
  }
  
  const browserLangs = navigator.languages || [navigator.language];
  for (let lang of browserLangs) {
    if (!lang) continue;
    const lowerLang = lang.toLowerCase();
    if (lowerLang.startsWith('de')) {
      localStorage.setItem('preferredLang', 'DE');
      return 'DE';
    }
    if (lowerLang.startsWith('ko')) {
      localStorage.setItem('preferredLang', 'KO');
      return 'KO';
    }
  }
  
  localStorage.setItem('preferredLang', 'EN');
  return 'EN';
};

export default function App() {
 const [currentLang, setLangState] = useState<Language>(getInitialLang);

 const setLang = (lang: Language) => {
   setLangState(lang);
   localStorage.setItem('preferredLang', lang);
 };"""

new_logic = """const getInitialLang = (): Language => {
  try {
    const saved = localStorage.getItem('preferredLang');
    if (saved === 'EN' || saved === 'DE' || saved === 'KO') {
      return saved as Language;
    }
    
    const browserLangs = navigator.languages || [navigator.language];
    for (let lang of browserLangs) {
      if (!lang) continue;
      const lowerLang = lang.toLowerCase();
      if (lowerLang.startsWith('de')) {
        localStorage.setItem('preferredLang', 'DE');
        return 'DE';
      }
      if (lowerLang.startsWith('ko')) {
        localStorage.setItem('preferredLang', 'KO');
        return 'KO';
      }
    }
    
    localStorage.setItem('preferredLang', 'EN');
  } catch (e) {
    // Ignore localStorage errors in restricted iframes
  }
  return 'EN';
};

export default function App() {
 const [currentLang, setLangState] = useState<Language>(getInitialLang);

 const setLang = (lang: Language) => {
   setLangState(lang);
   try {
     localStorage.setItem('preferredLang', lang);
   } catch (e) {}
 };"""

if old_logic in content:
    content = content.replace(old_logic, new_logic)
    with open('src/App.tsx', 'w') as f:
        f.write(content)
    print("Replaced logic safely")
else:
    print("Old logic not found!")
