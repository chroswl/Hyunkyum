import re

with open('src/components/AdminPanel.tsx', 'r') as f:
    content = f.read()

new_state = """  const [loadingAction, setLoadingAction] = useState(false);
  const [settingsGroup, setSettingsGroup] = useState<'appearance' | 'typography' | 'hero' | 'contact' | 'advanced'>('appearance');
  const [heroLangTab, setHeroLangTab] = useState<'EN' | 'DE' | 'KO'>('EN');
  const [heroBgTab, setHeroBgTab] = useState<'image' | 'video' | 'youtube'>('image');"""

content = content.replace("  const [loadingAction, setLoadingAction] = useState(false);", new_state)

with open('src/components/AdminPanel.tsx', 'w') as f:
    f.write(content)
print("State variables added")
