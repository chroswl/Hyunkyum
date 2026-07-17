with open('src/App.tsx', 'r') as f:
    content = f.read()

content = content.replace("flex items-center justify-center", "flex items-center ${theme.heroAlign === 'left' ? 'justify-start' : theme.heroAlign === 'right' ? 'justify-end' : 'justify-center'}")

with open('src/App.tsx', 'w') as f:
    f.write(content)

print("Alignment fixed!")
