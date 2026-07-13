import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Replace ARCHIVE with portfolio-title
content = re.sub(
    r'<h2 className="text-xl md:text-3xl font-serif font-light uppercase tracking-\[0\.25em\] leading-none">\s*ARCHIVE\s*</h2>',
    r'<h2 className="portfolio-title text-xl md:text-3xl font-serif font-light uppercase tracking-[0.25em] leading-none">\n              ARCHIVE\n            </h2>',
    content
)

# Replace PERFORMANCES with videos-title
content = re.sub(
    r'<h2 className="text-xl md:text-3xl font-serif font-light uppercase tracking-\[0\.25em\] leading-none">\s*PERFORMANCES\s*</h2>',
    r'<h2 className="videos-title text-xl md:text-3xl font-serif font-light uppercase tracking-[0.25em] leading-none">\n              PERFORMANCES\n            </h2>',
    content
)

# Replace UPCOMING with schedule-title
content = re.sub(
    r'<h2 className="text-xl md:text-3xl font-serif font-light uppercase tracking-\[0\.25em\] leading-none">\s*UPCOMING\s*</h2>',
    r'<h2 className="schedule-title text-xl md:text-3xl font-serif font-light uppercase tracking-[0.25em] leading-none">\n              UPCOMING\n            </h2>',
    content
)

with open('src/App.tsx', 'w') as f:
    f.write(content)
