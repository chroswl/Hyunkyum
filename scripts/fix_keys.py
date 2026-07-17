with open('src/App.tsx', 'r') as f:
    content = f.read()

content = content.replace('<AdminPanel\n currentLang={currentLang}', '<AdminPanel\n key="admin-panel"\n currentLang={currentLang}')
content = content.replace('<LegalModal\n isOpen={legalModal.isOpen}', '<LegalModal\n key="legal-modal"\n isOpen={legalModal.isOpen}')
content = content.replace('{user && (\n   <div className="admin-panel-exclude', '{user && (\n   <div key="hero-editor" className="admin-panel-exclude')

with open('src/App.tsx', 'w') as f:
    f.write(content)
print("Keys added")
