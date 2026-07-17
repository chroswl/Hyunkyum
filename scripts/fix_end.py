with open('src/components/AdminPanel.tsx', 'r') as f:
    text = f.read()

# Let's find the position of the last slides.map
idx = text.rfind("slides.map((s, index)")
if idx == -1:
    idx = text.rfind("slides.map((s)")

# We will cut the string from idx and just rebuild the end of the file.
# But we need to keep the exact content of the slide map.
