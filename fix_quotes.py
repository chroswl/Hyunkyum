import re
with open('src/components/Navbar.tsx', 'r') as f:
    content = f.read()

content = content.replace("\\'", "'")

with open('src/components/Navbar.tsx', 'w') as f:
    f.write(content)
