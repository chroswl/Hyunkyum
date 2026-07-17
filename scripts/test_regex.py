import re
with open('src/components/AdminPanel.tsx', 'r') as f:
    content = f.read()

settings_pattern = re.compile(r"\{\/\* TAB 5: SYSTEM GENERAL SETTINGS \*\/\}\s*\{activeTab === 'settings' && \([\s\S]*?\}\s*</>\s*\)\}\s*</div>\s*\)\}", re.MULTILINE)
print(len(settings_pattern.findall(content)))
