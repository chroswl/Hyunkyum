import re

with open("src/components/HeroSection.tsx", "r") as f:
    content = f.read()

content = content.replace(
    "text-[36px] md:text-[52px] lg:text-[length:var(--hero-title-size,64px)]",
    "text-[length:min(var(--hero-title-size,64px),36px)] md:text-[length:min(var(--hero-title-size,64px),52px)] lg:text-[length:var(--hero-title-size,64px)]"
)

with open("src/components/HeroSection.tsx", "w") as f:
    f.write(content)
