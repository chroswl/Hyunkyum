import os
import glob

files = glob.glob("src/components/*.tsx")
for filepath in files:
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # Remove the !window.confirm blocks
    import re
    # Match: if (!window.confirm("...")) return;
    content = re.sub(r'if\s*\(\s*!window\.confirm\([^)]+\)\s*\)\s*return\s*;', '', content)
    # Match: if (window.confirm("...")) {
    # It's a bit harder. We shouldn't blindly replace `window.confirm` because some are used in logic like `if (hasChanges && !window.confirm(...)) return;`
    content = re.sub(r'if\s*\(\s*hasChanges\s*&&\s*!window\.confirm\([^)]+\)\s*\)\s*return\s*;', '', content)

    # Some uses of confirm: if (!hasChanges || window.confirm("...")) {
    # Let's replace `window.confirm(...)` with `true`
    content = re.sub(r'window\.confirm\([^)]+\)', 'true', content)

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

print("Removed window.confirm from all files")
