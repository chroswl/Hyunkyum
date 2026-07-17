import re
with open('src/App.tsx', 'r') as f:
    content = f.read()

# Replace all 4 occurrences of the bad className logic
def fix_match(m):
    return "className={`font-sans text-xs md:text-sm tracking-[0.4em] uppercase font-semibold ${isEditingHeroText ? `cursor-move p-2 border border-dashed border-[#C9A227]/50 hover:bg-white/5 rounded relative w-full flex items-center ${theme.heroAlign === 'left' ? 'justify-start' : theme.heroAlign === 'right' ? 'justify-end' : 'justify-center'}` : ''}`}"

# Let's just manually replace the entire line for Subtitle
line1 = content.splitlines()[515]
print("Line 1:", line1)
# I will just write a python script to fix this by using template literals inside template literals
