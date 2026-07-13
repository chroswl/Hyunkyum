import re

with open('src/components/ScheduleSection.tsx', 'r') as f:
    content = f.read()

# Fix Schedule card background
content = re.sub(
    r'className="group relative bg-transparent/5/60 hover:bg-transparent/5/40 border border-black/10 hover:border-black/10 rounded-sm p-6 transition-all duration-300 grid grid-cols-1 md:grid-cols-12 gap-6 items-center"',
    r'className="schedule-card group relative rounded-sm p-6 transition-all duration-300 grid grid-cols-1 md:grid-cols-12 gap-6 items-center border"',
    content
)

# Fix Schedule Ticket button
content = re.sub(
    r'className="px-5 py-2 text-\[10px\] tracking-widest hover:text-black border border-borders/25 hover:bg-white transition-all duration-300 rounded-sm uppercase font-body font-medium whitespace-nowrap cursor-pointer"',
    r'className="schedule-btn px-5 py-2 text-[10px] tracking-widest transition-all duration-300 rounded-sm uppercase font-body font-medium whitespace-nowrap cursor-pointer border-transparent"',
    content
)

# Fix Tag colors inside schedule (the badges like PREMIERE)
content = re.sub(
    r'const getTagColor = \(category: string\) => \{\n\s*switch \(category\) \{\n\s*case \'opera\': return \'text-emerald-400 border-emerald-500/30 bg-emerald-500/5\';\n\s*case \'concert\': return \'text-blue-400 border-blue-500/30 bg-blue-500/5\';\n\s*case \'recital\': return \'text-purple-400 border-purple-500/30 bg-purple-500/5\';\n\s*default: return \'text-neutral-400 border-neutral-500/30 bg-neutral-500/5\';\n\s*\}\n\s*\};',
    r'const getTagColor = (category: string) => {\n    switch (category) {\n      case \'opera\': return \'schedule-text border-current opacity-80\';\n      case \'concert\': return \'schedule-text border-current opacity-80\';\n      case \'recital\': return \'schedule-text border-current opacity-80\';\n      default: return \'schedule-text border-current opacity-80\';\n    }\n  };',
    content
)

with open('src/components/ScheduleSection.tsx', 'w') as f:
    f.write(content)

