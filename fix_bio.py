import re

with open('src/components/BiographySection.tsx', 'r') as f:
    content = f.read()

# Fix Section wrapper
content = re.sub(
    r'<section id="biography" className="page-section bg-transparent relative">',
    r'<section id="biography" className="page-section bio-bg relative border-t-0">',
    content
)

content = re.sub(
    r'<h2 className="text-2xl md:text-3xl lg:text-4xl font-heading font-light tracking-wide uppercase">',
    r'<h2 className="bio-title text-2xl md:text-3xl lg:text-4xl font-heading font-light tracking-wide uppercase">',
    content
)

content = re.sub(
    r'<p className="font-medium text-base md:text-lg leading-relaxed">',
    r'<p className="bio-highlight font-medium text-base md:text-lg leading-relaxed">',
    content
)

content = re.sub(
    r'<p className="font-light text-sm md:text-base leading-relaxed opacity-90">',
    r'<p className="bio-text font-light text-sm md:text-base leading-relaxed">',
    content
)

# Tabs text
content = re.sub(
    r'<div id="timeline-content-area" className="bg-current/\[0\.03\] p-6 min-h-\[160px\]">',
    r'<div id="timeline-content-area" className="bio-text bg-current/[0.03] p-6 min-h-[160px]">',
    content
)

# Timeline text
content = re.sub(
    r'<div className="group-hover: transition-colors text-xs md:text-sm font-body leading-relaxed">',
    r'<div className="bio-text text-xs md:text-sm font-body leading-relaxed">',
    content
)


with open('src/components/BiographySection.tsx', 'w') as f:
    f.write(content)

