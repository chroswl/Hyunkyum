import re

with open('src/components/admin/appearance/FloatingWindow.tsx', 'r') as f:
    content = f.read()

content = re.sub(
    r'<Rnd',
    r'<Rnd\n      style={{ position: "fixed", zIndex: 9999 }}',
    content
)

with open('src/components/admin/appearance/FloatingWindow.tsx', 'w') as f:
    f.write(content)
