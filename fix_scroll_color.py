import re

with open('src/components/HeroSection.tsx', 'r') as f:
    content = f.read()

content = re.sub(
    r'<span className="text-\[10px\] tracking-\[0\.5em\] uppercase font-light mb-2">',
    r'<span className="text-[10px] tracking-[0.5em] uppercase font-light mb-2" style={{ color: "var(--hero-arrow, rgba(255,255,255,0.6))" }}>',
    content
)

with open('src/components/HeroSection.tsx', 'w') as f:
    f.write(content)
