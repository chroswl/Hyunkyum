import re

with open('src/components/Navbar.tsx', 'r') as f:
    content = f.read()

content = content.replace("\\'var(--nav-height, 80px)\\'", "'var(--nav-height, 80px)'")
content = content.replace("\\'var(--nav-text, var(--color-text-main))\\'", "'var(--nav-text, var(--color-text-main))'")

with open('src/components/Navbar.tsx', 'w') as f:
    f.write(content)

