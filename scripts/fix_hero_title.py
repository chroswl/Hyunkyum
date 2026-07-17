import re

with open("src/components/HeroSection.tsx", "r") as f:
    content = f.read()

# Title Responsive Font Size
content = content.replace(
    "className={`text-4xl sm:text-6xl md:text-8xl font-serif font-light tracking-[0.1em] uppercase leading-none`}",
    "className={`text-[36px] md:text-[52px] lg:text-[length:var(--hero-title-size,64px)] font-serif font-light tracking-[0.1em] uppercase leading-none`}"
)
content = content.replace(
    "style={{ fontSize: theme.heroTitleSize ? `${theme.heroTitleSize}px` : undefined }}",
    ""
)

# Button Responsive Font Size
content = content.replace(
    "className=\"group px-8 py-3.5 border border-white/20 font-sans text-xs tracking-[0.25em] uppercase rounded-sm transition-all duration-250 flex items-center space-x-2 mx-auto cursor-pointer\"",
    "className=\"group px-8 py-3.5 border border-white/20 font-sans text-xs lg:text-[length:var(--hero-btn-size,11px)] tracking-[0.25em] uppercase rounded-sm transition-all duration-250 flex items-center space-x-2 mx-auto cursor-pointer\""
)
content = content.replace(
    "style={{ fontSize: theme.heroButtonSize ? `${theme.heroButtonSize}px` : undefined, color: theme.text || \"#ffffff\" }}",
    "style={{ color: theme.text || \"#ffffff\" }}"
)

# Add CSS variables to hero-content div
# style={{ transform: `translate(${theme.heroContentOffsetX ?? 0}px, ${theme.heroContentOffsetY ?? theme.heroOffsetY ?? 0}px)` }}
new_style = "style={{ transform: `translate(${theme.heroContentOffsetX ?? 0}px, ${theme.heroContentOffsetY ?? theme.heroOffsetY ?? 0}px)`, '--hero-title-size': theme.heroTitleSize ? `${theme.heroTitleSize}px` : '64px', '--hero-btn-size': theme.heroButtonSize ? `${theme.heroButtonSize}px` : '11px' } as React.CSSProperties}"
content = content.replace(
    "style={{ transform: `translate(${theme.heroContentOffsetX ?? 0}px, ${theme.heroContentOffsetY ?? theme.heroOffsetY ?? 0}px)` }}",
    new_style
)

with open("src/components/HeroSection.tsx", "w") as f:
    f.write(content)
