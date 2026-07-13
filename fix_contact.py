import re

with open('src/components/ContactForm.tsx', 'r') as f:
    content = f.read()

# Fix Inputs
content = re.sub(
    r'className={`w-full bg-\[var\(--color-bg\)\] border \$\{errors\.name \? \'border-rose-500/50 focus:border-rose-500/70\' : \'border-\[var\(--color-text\)\]/10 focus:border-\[var\(--color-text\)\]/40\'\} focus:ring-0 rounded-sm px-4 py-3 text-sm text-\[var\(--color-text\)\] placeholder-neutral-700 transition-colors`}',
    r'className={`forms-input w-full border ${errors.name ? "border-rose-500/50" : ""} rounded-sm px-4 py-3 text-sm transition-colors`}',
    content
)
content = re.sub(
    r'style=\{\{ backgroundColor: \'var\(--color-surface\)\' \}\}',
    r'',
    content
)

content = re.sub(
    r'className={`w-full bg-\[var\(--color-bg\)\] border \$\{errors\.email \? \'border-rose-500/50 focus:border-rose-500/70\' : \'border-\[var\(--color-text\)\]/10 focus:border-\[var\(--color-text\)\]/40\'\} focus:ring-0 rounded-sm px-4 py-3 text-sm text-\[var\(--color-text\)\] placeholder-neutral-700 transition-colors`}',
    r'className={`forms-input w-full border ${errors.email ? "border-rose-500/50" : ""} rounded-sm px-4 py-3 text-sm transition-colors`}',
    content
)

content = re.sub(
    r'className={`w-full bg-\[var\(--color-bg\)\] border \$\{errors\.message \? \'border-rose-500/50 focus:border-rose-500/70\' : \'border-\[var\(--color-text\)\]/10 focus:border-\[var\(--color-text\)\]/40\'\} focus:ring-0 rounded-sm px-4 py-3 text-sm text-\[var\(--color-text\)\] placeholder-neutral-700 transition-colors resize-none`}',
    r'className={`forms-input w-full border ${errors.message ? "border-rose-500/50" : ""} rounded-sm px-4 py-3 text-sm transition-colors resize-none`}',
    content
)

content = re.sub(
    r'className="w-full sm:w-auto px-8 py-3\.5 bg-transparent border border-current opacity-60 hover:opacity-100 hover:bg-\[var\(--color-text\)\]/5 text-\[var\(--color-text\)\] font-sans text-xs tracking-widest uppercase font-medium rounded-sm flex items-center justify-center space-x-2\.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"',
    r'className="forms-btn border-transparent w-full sm:w-auto px-8 py-3.5 font-sans text-xs tracking-widest uppercase font-medium rounded-sm flex items-center justify-center space-x-2.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"',
    content
)

with open('src/components/ContactForm.tsx', 'w') as f:
    f.write(content)
