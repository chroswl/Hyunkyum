import re
with open('src/App.tsx', 'r') as f:
    content = f.read()

bad_str = "flex items-center ${theme.heroAlign === 'left' ? 'justify-start' : theme.heroAlign === 'right' ? 'justify-end' : 'justify-center'}"
good_str = "\" + (theme.heroAlign === 'left' ? 'justify-start' : theme.heroAlign === 'right' ? 'justify-end' : 'justify-center') + \" "

# The surrounding context is:
# ${isEditingHeroText ? '... flex items-center ${...}' : ''}
# So if we replace it with ... flex items-center ' + (theme.heroAlign...) + '

content = content.replace("flex items-center ${theme.heroAlign === 'left' ? 'justify-start' : theme.heroAlign === 'right' ? 'justify-end' : 'justify-center'}'", "flex items-center \" + (theme.heroAlign === 'left' ? 'justify-start' : theme.heroAlign === 'right' ? 'justify-end' : 'justify-center') + \"'")

with open('src/App.tsx', 'w') as f:
    f.write(content)

print("Fixed quotes")
