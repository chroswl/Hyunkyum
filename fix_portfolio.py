import re

with open('src/components/PortfolioGallery.tsx', 'r') as f:
    content = f.read()

content = re.sub(
    r'className={`break-inside-avoid relative group overflow-hidden cursor-pointer bg-transparent/5 border border-black/10/60',
    r'className={`portfolio-card break-inside-avoid relative group overflow-hidden cursor-pointer border-transparent',
    content
)

# And inside the modal viewer:
# className="fixed inset-0 z-100 bg-transparent/98 backdrop-blur-md flex items-center justify-center p-4 md:p-8"
# Could be mapped to overlay

with open('src/components/PortfolioGallery.tsx', 'w') as f:
    f.write(content)
