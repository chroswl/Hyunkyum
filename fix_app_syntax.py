import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

content = content.replace("type: \\'impressum\\'", "type: 'impressum'")
content = content.replace("type: \\'privacy\\'", "type: 'privacy'")

with open('src/App.tsx', 'w') as f:
    f.write(content)

