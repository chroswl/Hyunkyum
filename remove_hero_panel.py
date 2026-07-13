with open('src/App.tsx', 'r') as f:
    content = f.read()

start_idx = content.find('<div key="hero-editor"')
if start_idx != -1:
    # Find matching closing div
    open_divs = 0
    end_idx = -1
    i = start_idx
    while i < len(content):
        if content[i:i+4] == '<div':
            open_divs += 1
        elif content[i:i+5] == '</div':
            open_divs -= 1
            if open_divs == 0:
                end_idx = i + 6
                break
        i += 1

    if end_idx != -1:
        # Replace it with our new component
        new_component = """{isAdminOpen ? null : (
     <HeroEditorPanel 
       theme={theme} 
       setTheme={setTheme} 
       isEditingText={isEditingHeroText} 
       setIsEditingText={setIsEditingHeroText} 
       onSave={async () => await saveThemeSettings(theme)}
       onReset={() => setTheme(prev => ({ 
          ...prev, 
          heroSubtitleSize: 14, heroTitleSize: 64, heroDescSize: 16, heroButtonSize: 12,
          heroSubtitleOffsetX: 0, heroSubtitleOffsetY: 0,
          heroTitleOffsetX: 0, heroTitleOffsetY: 0,
          heroDescOffsetX: 0, heroDescOffsetY: 0,
          heroButtonOffsetX: 0, heroButtonOffsetY: 0,
          heroOffsetY: 0
       }))}
       initialTheme={initialThemeRef.current}
     />
   )}"""
        content = content[:start_idx] + new_component + content[end_idx:]
        with open('src/App.tsx', 'w') as f:
            f.write(content)
        print("Panel removed and replaced!")
    else:
        print("Could not find matching end div")
else:
    print("Could not find start div")
