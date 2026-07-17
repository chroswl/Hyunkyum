with open('src/App.tsx', 'r') as f:
    content = f.read()

bad_str1 = "flex items-center \" + (theme.heroAlign === 'left' ? 'justify-start' : theme.heroAlign === 'right' ? 'justify-end' : 'justify-center') + \"'"
good_str1 = "flex items-center ' + (theme.heroAlign === 'left' ? 'justify-start' : theme.heroAlign === 'right' ? 'justify-end' : 'justify-center') + '"

content = content.replace(bad_str1, good_str1)

with open('src/App.tsx', 'w') as f:
    f.write(content)

print("Fixed")
