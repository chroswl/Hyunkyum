with open('src/components/AdminPanel.tsx', 'r') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if line.strip() == 'accept="image/*"':
        if i > 1680 and i < 1700:
            lines[i] = line.replace('accept="image/*"', 'accept="image/*,video/*"')

with open('src/components/AdminPanel.tsx', 'w') as f:
    f.writelines(lines)
print("Done")
