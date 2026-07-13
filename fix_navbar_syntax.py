import re

with open('src/components/Navbar.tsx', 'r') as f:
    content = f.read()

content = content.replace("\\'bg-transparent border-transparent\\'", "'bg-transparent border-transparent'")
content = content.replace("\\'nav-bg\\'", "'nav-bg'")

with open('src/components/Navbar.tsx', 'w') as f:
    f.write(content)

