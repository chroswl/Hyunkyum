import re

with open('src/components/AdminPanel.tsx', 'r') as f:
    content = f.read()

content = content.replace("Settings, Palette, FileText, Info, Upload, ChevronUp, ChevronDown", "Settings, Palette, FileText, Info, Upload, ChevronUp, ChevronDown, GripVertical")

with open('src/components/AdminPanel.tsx', 'w') as f:
    f.write(content)
print("Added GripVertical to imports")
