import re

with open("src/components/HeroSection.tsx", "r") as f:
    content = f.read()

# 1. Update Subtitle
content = content.replace(
    "className={`font-sans text-xs md:text-sm tracking-[0.4em] uppercase font-semibold`}\n            style={{ fontSize: theme.heroSubtitleSize ? `${theme.heroSubtitleSize}px` : undefined }}",
    "className={`font-sans text-[length:min(var(--hero-subtitle-size,12px),20px)] lg:text-[length:var(--hero-subtitle-size,14px)] tracking-[0.4em] uppercase font-semibold`}"
)

# 2. Update Description
content = content.replace(
    "className={`font-sans text-xs sm:text-sm md:text-base tracking-[0.2em] font-light max-w-xl uppercase pt-6`}\n            style={{ \n              fontSize: theme.heroDescSize ? `${theme.heroDescSize}px` : undefined,",
    "className={`font-sans text-[length:min(var(--hero-desc-size,16px),20px)] lg:text-[length:var(--hero-desc-size,16px)] tracking-[0.2em] font-light max-w-xl uppercase pt-6`}\n            style={{ \n"
)

# 3. Update Button
content = content.replace(
    "text-[length:var(--hero-btn-size,11px)]",
    "text-[length:min(var(--hero-btn-size,11px),15px)] lg:text-[length:max(var(--hero-btn-size,11px),15px)]"
)

# Add CSS Variables to container
# transform: `...`, '--hero-title-size': ..., '--hero-btn-size': ...
content = content.replace(
    "'--hero-btn-size': theme.heroButtonSize ? `${theme.heroButtonSize}px` : '11px' } as React.CSSProperties",
    "'--hero-btn-size': theme.heroButtonSize ? `${theme.heroButtonSize}px` : '11px', '--hero-subtitle-size': theme.heroSubtitleSize ? `${theme.heroSubtitleSize}px` : undefined, '--hero-desc-size': theme.heroDescSize ? `${theme.heroDescSize}px` : undefined } as React.CSSProperties"
)

with open("src/components/HeroSection.tsx", "w") as f:
    f.write(content)
