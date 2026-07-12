import sys

# Extract new_settings from rewrite_settings.py
with open('rewrite_settings.py', 'r') as f:
    rewrite_content = f.read()

import re
match = re.search(r'new_settings = """(.*?)"""\n\ncontent = settings_pattern\.sub', rewrite_content, re.DOTALL)
if not match:
    print("Could not find new_settings")
    sys.exit(1)

new_settings = match.group(1)

# Now apply to AdminPanel.tsx
with open('src/components/AdminPanel.tsx', 'r') as f:
    content = f.read()

start_marker = "{/* TAB 5: SYSTEM GENERAL SETTINGS */}"
end_marker = "{/* TAB: BIOGRAPHY */}"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker, start_idx)

if start_idx == -1 or end_idx == -1:
    print("Could not find markers")
    sys.exit(1)

new_content = content[:start_idx] + new_settings + "\n              " + content[end_idx:]

with open('src/components/AdminPanel.tsx', 'w') as f:
    f.write(new_content)

print("Settings applied successfully!")
