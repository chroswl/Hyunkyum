import re

with open('src/components/HeroSection.tsx', 'r') as f:
    content = f.read()

content = re.sub(
    r'<ChevronDown className="w-4 h-4 transform group-hover:translate-y-1 transition-transform group-hover:text-black" />',
    r'<ChevronDown className="w-4 h-4 transform group-hover:translate-y-1 transition-transform" />',
    content
)

with open('src/components/HeroSection.tsx', 'w') as f:
    f.write(content)
