import re

with open("src/components/HeroSection.tsx", "r") as f:
    content = f.read()

content = content.replace(
    "text-xs lg:text-[length:var(--hero-btn-size,11px)]",
    "text-[length:var(--hero-btn-size,11px)]"
)

with open("src/components/HeroSection.tsx", "w") as f:
    f.write(content)
