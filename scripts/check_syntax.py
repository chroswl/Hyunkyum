import re

with open('src/components/AdminPanel.tsx', 'r') as f:
    lines = f.readlines()

print(f"Total lines: {len(lines)}")

# Let's check for unbalanced brackets
braces = 0
parens = 0
brackets = 0

for idx, line in enumerate(lines):
    # Strip comments to avoid false positives
    clean_line = re.sub(r'//.*', '', line)
    clean_line = re.sub(r'/\*.*?\*/', '', clean_line)
    
    for char in clean_line:
        if char == '{': braces += 1
        elif char == '}': braces -= 1
        elif char == '(': parens += 1
        elif char == ')': parens -= 1
        elif char == '[': brackets += 1
        elif char == ']': brackets -= 1
        
    if braces < 0:
        print(f"Braces went negative at line {idx + 1}: {line.strip()}")
        braces = 0
    if parens < 0:
        print(f"Parens went negative at line {idx + 1}: {line.strip()}")
        parens = 0
    if brackets < 0:
        print(f"Brackets went negative at line {idx + 1}: {line.strip()}")
        brackets = 0

print(f"Final counts - Braces: {braces}, Parens: {parens}, Brackets: {brackets}")
