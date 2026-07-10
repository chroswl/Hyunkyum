import re

files = [
    'src/App.tsx',
    'src/components/PressSection.tsx',
    'src/components/ScheduleSection.tsx',
    'src/components/PortfolioGallery.tsx'
]

bg_replacements = {
    'bg-neutral-900': 'bg-black/5',
    'bg-neutral-950': 'bg-black/5',
    'bg-neutral-980': 'bg-black/5',
    'bg-neutral-800': 'bg-black/10',
    'bg-black': 'bg-transparent',
    'bg-black/95': 'bg-black/5 backdrop-blur-md',
    'bg-neutral-900/50': 'bg-black/5',
    'bg-neutral-980/30': 'bg-black/5',
    'border-neutral-900': 'border-black/10',
    'border-neutral-800': 'border-black/10',
    'border-neutral-950': 'border-black/10',
    'border-white/10': 'border-black/10',
    'border-white/20': 'border-black/10',
    'hover:bg-neutral-800': 'hover:bg-black/10',
    'hover:bg-neutral-900': 'hover:bg-black/10',
    'hover:bg-white/10': 'hover:bg-black/10',
    'hover:border-neutral-700': 'hover:border-black/20',
}

text_classes_to_remove = [
    r'\btext-white\b',
    r'\btext-neutral-100\b',
    r'\btext-neutral-200\b',
    r'\btext-neutral-300\b',
    r'\btext-neutral-400\b',
    r'\btext-neutral-500\b',
    r'\btext-neutral-600\b',
    r'\btext-neutral-700\b',
    r'\btext-neutral-800\b',
    r'\btext-neutral-900\b',
    r'\btext-gray-\d+\b',
    r'\btext-\[#A0A0A0\]\b'
]

for filepath in files:
    with open(filepath, 'r') as f:
        text = f.read()

    # 1. Replace Background and Border classes
    for old_cls, new_cls in bg_replacements.items():
        text = re.sub(r'\b' + re.escape(old_cls) + r'\b', new_cls, text)

    # 2. Remove Text classes
    for pattern in text_classes_to_remove:
        text = re.sub(pattern, '', text)
        
    # Clean up multiple spaces
    text = re.sub(r' +', ' ', text)
    text = re.sub(r' \]', ']', text)
    text = re.sub(r'\" >', '">', text)

    with open(filepath, 'w') as f:
        f.write(text)

