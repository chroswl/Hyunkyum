with open("src/App.tsx", "r") as f:
    content = f.read()

content = content.replace("Sliders, AlignCenter, AlignLeft, AlignRight, Save, Edit3", "Sliders, AlignCenter, AlignLeft, AlignRight, Save, Edit3, X")

with open("src/App.tsx", "w") as f:
    f.write(content)
