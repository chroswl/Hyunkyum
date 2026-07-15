import re

with open("src/components/HeroSection.tsx", "r") as f:
    content = f.read()

# Replace transform on hero-content
content = re.sub(
    r"style={{ transform: `translateY\(\${theme\.heroOffsetY \?\? 0}px\)` }}",
    r"style={{ transform: `translate(${theme.heroContentOffsetX ?? 0}px, ${theme.heroContentOffsetY ?? theme.heroOffsetY ?? 0}px)` }}",
    content
)

# Remove individual offsets in Subtitle
content = re.sub(
    r"initial={{ opacity: 0, y: 15 \+ \(theme\.heroSubtitleOffsetY \?\? 0\), x: theme\.heroSubtitleOffsetX \?\? 0 }}",
    r"initial={{ opacity: 0, y: 15 }}",
    content
)
content = re.sub(
    r"animate={{ opacity: 1, y: theme\.heroSubtitleOffsetY \?\? 0, x: theme\.heroSubtitleOffsetX \?\? 0 }}",
    r"animate={{ opacity: 1, y: 0 }}",
    content
)

# Remove individual offsets in Title
content = re.sub(
    r"initial={{ opacity: 0, scale: 0\.98, y: theme\.heroTitleOffsetY \?\? 0, x: theme\.heroTitleOffsetX \?\? 0 }}",
    r"initial={{ opacity: 0, scale: 0.98, y: 0 }}",
    content
)
content = re.sub(
    r"animate={{ opacity: 1, scale: 1, y: theme\.heroTitleOffsetY \?\? 0, x: theme\.heroTitleOffsetX \?\? 0 }}",
    r"animate={{ opacity: 1, scale: 1, y: 0 }}",
    content
)

# Remove individual offsets in Description
content = re.sub(
    r"initial={{ opacity: 0, y: 15 \+ \(theme\.heroDescOffsetY \?\? 0\), x: theme\.heroDescOffsetX \?\? 0 }}",
    r"initial={{ opacity: 0, y: 15 }}",
    content
)
content = re.sub(
    r"animate={{ opacity: 1, y: theme\.heroDescOffsetY \?\? 0, x: theme\.heroDescOffsetX \?\? 0 }}",
    r"animate={{ opacity: 1, y: 0 }}",
    content
)

with open("src/components/HeroSection.tsx", "w") as f:
    f.write(content)
