with open('src/components/AdminPanel.tsx', 'r') as f:
    text = f.read()

text = text.replace("          </div>\n        )}", "          </div>")

with open('src/components/AdminPanel.tsx', 'w') as f:
    f.write(text)
