import re

with open('src/components/Navbar.tsx', 'r') as f:
    content = f.read()

# Fix mobile-lang-cycle button
content = re.sub(
    r'className="text-\[10px\] tracking-wider border border-neutral-800 px-2 py-1 bg-neutral-950 text-neutral-300 rounded flex items-center space-x-1"',
    r'className="text-[10px] tracking-wider rounded flex items-center space-x-1 nav-bg" style={{ padding: "0.25rem 0.5rem" }}',
    content
)

# Fix globe in mobile
content = re.sub(
    r'<Globe className="w-3 h-3 text-text-main" />',
    r'<Globe className="w-3 h-3" style={{ color: "var(--nav-text, var(--color-text-main))" }} />',
    content
)

# Fix language dropdown
content = re.sub(
    r'className="absolute right-0 top-full mt-2 w-20 bg-neutral-950 border border-neutral-800 rounded shadow-xl overflow-hidden flex flex-col z-50"',
    r'className="absolute right-0 top-full mt-2 w-20 rounded shadow-xl overflow-hidden flex flex-col z-50 nav-bg"',
    content
)

# Fix language dropdown buttons
content = re.sub(
    r'className={`px-3 py-2 text-xs text-left \$\{currentLang === lang \? \'text-text-main bg-white/10\' : \'text-text-main/60 hover:bg-text-main/20 hover:text-text-main\'\}`}',
    r'className={`px-3 py-2 text-xs text-left nav-link ${currentLang === lang ? "active" : ""}`}\n                      style={currentLang === lang ? { backgroundColor: "rgba(255,255,255,0.1)" } : {}}',
    content
)

# Fix hamburger
content = re.sub(
    r'className="text-text-main hover:text-text-main transition-colors p-1"',
    r'className="transition-colors p-1" style={{ color: "var(--nav-text, var(--color-text-main))" }}',
    content
)

# Fix mobile drawer text link
content = re.sub(
    r'className={`text-left font-nav text-lg tracking-\[0\.1em\] py-2 transition-all \$\{\n\s*activeSection === item\.id\n\s*\? \'text-text-main font-bold pl-2 border-l border-white\'\n\s*: \'text-text-main/60 hover:text-text-main font-normal\'\n\s*\}`\}',
    r'className={`text-left font-nav text-lg tracking-[0.1em] py-2 transition-all nav-link ${activeSection === item.id ? "active font-bold pl-2 border-l" : "font-normal"}`}\n                  style={activeSection === item.id ? { borderColor: "var(--nav-active, var(--color-text-main))" } : {}}',
    content
)

# Fix mobile drawer language options Globe
content = re.sub(
    r'<Globe className="w-4 h-4 text-text-main/60" />',
    r'<Globe className="w-4 h-4" style={{ color: "var(--nav-text, var(--color-text-main))", opacity: 0.6 }} />',
    content
)

# Fix mobile drawer language buttons
content = re.sub(
    r'className={`px-2\.5 py-1 text-xs rounded border \$\{\n\s*currentLang === lang\n\s*\? \'text-text-main border-white bg-white/5\'\n\s*: \'text-text-main/60 border-neutral-800\'\n\s*\}`\}',
    r'className={`px-2.5 py-1 text-xs rounded border nav-link ${currentLang === lang ? "active" : ""}`}\n                      style={currentLang === lang ? { borderColor: "var(--nav-active, var(--color-text-main))", backgroundColor: "rgba(255,255,255,0.05)" } : { borderColor: "var(--nav-border, var(--color-borders))" }}',
    content
)

with open('src/components/Navbar.tsx', 'w') as f:
    f.write(content)
