with open('src/App.tsx', 'r') as f:
    lines = f.read().splitlines()

for i, line in enumerate(lines):
    if "isEditingHeroText ?" in line and "cursor-move" in line and "flex items-center" in line:
        if "text-4xl" in line:
            # Title
            lines[i] = "     className={`text-4xl sm:text-6xl md:text-8xl font-serif font-light tracking-[0.1em] uppercase leading-none ${isEditingHeroText ? `cursor-move p-2 border border-dashed border-[#C9A227]/50 hover:bg-white/5 rounded relative w-full flex items-center ${theme.heroAlign === 'left' ? 'justify-start' : theme.heroAlign === 'right' ? 'justify-end' : 'justify-center'}` : ''}`}"
        elif "tracking-[0.2em]" in line:
            # Desc
            lines[i] = "     className={`font-sans text-xs sm:text-sm md:text-base tracking-[0.2em] font-light max-w-xl uppercase pt-6 ${isEditingHeroText ? `cursor-move p-2 border border-dashed border-[#C9A227]/50 hover:bg-white/5 rounded relative w-full flex items-center ${theme.heroAlign === 'left' ? 'justify-start' : theme.heroAlign === 'right' ? 'justify-end' : 'justify-center'}` : ''}`}"
        elif "tracking-[0.4em]" in line:
            # Subtitle
            lines[i] = "     className={`font-sans text-xs md:text-sm tracking-[0.4em] uppercase font-semibold ${isEditingHeroText ? `cursor-move p-2 border border-dashed border-[#C9A227]/50 hover:bg-white/5 rounded relative w-full flex items-center ${theme.heroAlign === 'left' ? 'justify-start' : theme.heroAlign === 'right' ? 'justify-end' : 'justify-center'}` : ''}`}"

with open('src/App.tsx', 'w') as f:
    f.write("\n".join(lines))

print("Fixed with backticks")
