import re

with open("src/components/HeroSection.tsx", "r") as f:
    content = f.read()

# Remove individual offsets in Button
content = re.sub(
    r"initial={{ opacity: 0, y: 20 \+ \(theme\.heroButtonOffsetY \?\? 0\), x: theme\.heroButtonOffsetX \?\? 0 }}",
    r"initial={{ opacity: 0, y: 20 }}",
    content
)
content = re.sub(
    r"animate={{ opacity: 1, y: theme\.heroButtonOffsetY \?\? 0, x: theme\.heroButtonOffsetX \?\? 0 }}",
    r"animate={{ opacity: 1, y: 0 }}",
    content
)

with open("src/components/HeroSection.tsx", "w") as f:
    f.write(content)
