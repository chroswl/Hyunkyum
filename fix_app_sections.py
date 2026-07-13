import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

content = re.sub(
    r'<section\s+id="portfolio"\s+className="page-section bg-transparent/5/30"',
    r'<section id="portfolio" className="page-section portfolio-bg"',
    content
)

content = re.sub(
    r'<section\s+id="videos"\s+className="page-section bg-transparent"',
    r'<section id="videos" className="page-section videos-bg"',
    content
)

content = re.sub(
    r'<section\s+id="schedule"\s+className="page-section bg-transparent/5/30"',
    r'<section id="schedule" className="page-section schedule-bg"',
    content
)

with open('src/App.tsx', 'w') as f:
    f.write(content)
