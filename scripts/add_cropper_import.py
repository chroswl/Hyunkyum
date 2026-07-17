with open('src/components/AdminPanel.tsx', 'r') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if line.startswith('import {'):
        lines.insert(i, "import ImageCropperModal from './ImageCropperModal';\n")
        break

with open('src/components/AdminPanel.tsx', 'w') as f:
    f.writelines(lines)
print("Done")
