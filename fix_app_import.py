with open('src/App.tsx', 'r') as f:
    content = f.read()

if "import HeroEditorPanel" not in content:
    content = content.replace("import Reveal from './components/Reveal';", "import Reveal from './components/Reveal';\nimport HeroEditorPanel from './components/HeroEditorPanel';")
    with open('src/App.tsx', 'w') as f:
        f.write(content)
    print("Import added")
else:
    print("Already imported")
