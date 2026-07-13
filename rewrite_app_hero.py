import re
with open('src/App.tsx', 'r') as f:
    content = f.read()

# First, let's remove the old Hero Design Editor panel from App.tsx
panel_pattern = re.compile(r'<div key="hero-editor" className="admin-panel-exclude fixed bottom-24 left-6.*?</div>\n     </div>\n     </div>', re.DOTALL)
content = panel_pattern.sub('{/* Hero Design Editor extracted to HeroEditorPanel */}', content)

# Remove any remaining parts of the hero panel if the regex missed it
# We can also just replace from `<div key="hero-editor"` up to the exact end.
