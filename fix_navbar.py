import re

with open('src/components/Navbar.tsx', 'r') as f:
    content = f.read()

# Replace <nav className="..." style="...">
# We'll build the className string using isScrolled
# Note: we need to handle the blur and height
nav_match = re.search(r'<nav\s+id="navbar"\s+className=\{`([^`]+)`\}\s+style=\{\{([^\}]+)\}\}', content)
if nav_match:
    class_str = nav_match.group(1)
    
    # We replace the inline styles for color, we will keep height
    content = re.sub(
        r'<nav\s+id="navbar"\s+className=\{`([^`]+)`\}\s+style=\{\{([^\}]+)\}\}',
        r'<nav\n      id="navbar"\n      className={`nav-container ${appearance.navigation.sticky ? \'fixed\' : \'absolute\'} top-0 left-0 w-full z-50 transition-all duration-500 border-b ${isScrolled ? \'nav-scrolled py-4\' : \'py-6\'} ${appearance.navigation.blur && isScrolled ? \'backdrop-blur-md\' : \'\'}`}\n      style={{ height: isScrolled ? `calc(var(--nav-height, 80px) * 0.8)` : \'var(--nav-height, 80px)\' }}',
        content
    )

# Fix Logo
content = re.sub(
    r'className="cursor-pointer font-hero font-light tracking-\[0\.2em\] nav-link transition-all"\s+style=\{\{ fontSize: \'var\(--nav-logo-size, 24px\)\', color: \'var\(--nav-text, var\(--color-text-main\)\)\' \}\}',
    r'className="cursor-pointer font-hero font-light tracking-[0.2em] nav-logo transition-all"\n          style={{ fontSize: \'var(--nav-logo-size, 24px)\' }}',
    content
)

# Fix active indicator
content = re.sub(
    r'className="absolute bottom-0 left-0 right-0 h-\[1\.5px\]"\s+style=\{\{ backgroundColor: \'var\(--nav-active, var\(--color-text-main\)\)\' \}\}',
    r'className="absolute bottom-0 left-0 right-0 h-[1.5px]"\n                    style={{ backgroundColor: \'var(--current-nav-active)\' }}',
    content
)

# Fix desktop menu separator
content = re.sub(
    r'className="h-4 w-\[1px\]" style=\{\{ backgroundColor: \'var\(--nav-text, var\(--color-text-main\)\)\', opacity: 0\.2 \}\}',
    r'className="h-4 w-[1px]" style={{ backgroundColor: \'var(--current-nav-text)\', opacity: 0.2 }}',
    content
)

# Fix Globe icons
content = re.sub(
    r'<Globe className="([^"]+)" style=\{\{ color: "var\(--nav-text, var\(--color-text-main\)\)"(?:, opacity: 0\.6)? \}\} />',
    r'<Globe className="\1" style={{ color: "var(--current-nav-text)", opacity: 0.6 }} />',
    content
)
# Make sure any without opacity are also fixed properly
content = re.sub(
    r'<Globe className="([^"]+)" style=\{\{ color: "var\(--current-nav-text\)", opacity: 0\.6 \}\} />\s*<span',
    r'<Globe className="\1" style={{ color: "var(--current-nav-text)" }} />\n              <span',
    content
)


# Fix language buttons desktop
content = re.sub(
    r'className={`px-1\.5 py-0\.5 rounded transition-all tracking-wider nav-link \$\{currentLang === lang \? \'active\' : \'\'\}`}\s+style=\{currentLang === lang \? \{ border: \'1px solid var\(--nav-border, var\(--color-borders\)\)\', backgroundColor: \'rgba\(255,255,255,0\.05\)\' \} : \{\}\}',
    r'className={`px-1.5 py-0.5 rounded transition-all tracking-wider nav-link ${currentLang === lang ? \'active\' : \'\'}`}\n                style={currentLang === lang ? { border: \'1px solid var(--current-nav-border)\', backgroundColor: \'var(--current-nav-border)\', opacity: 0.8 } : {}}',
    content
)

# Fix mobile language trigger
content = re.sub(
    r'className="text-\[10px\] tracking-wider rounded flex items-center space-x-1 nav-bg" style=\{\{ padding: "0\.25rem 0\.5rem" \}\}',
    r'className="text-[10px] tracking-wider rounded flex items-center space-x-1 nav-dropdown-bg" style={{ padding: "0.25rem 0.5rem", color: "var(--current-nav-text)" }}',
    content
)

# Fix mobile language dropdown container
content = re.sub(
    r'className="absolute right-0 top-full mt-2 w-20 rounded shadow-xl overflow-hidden flex flex-col z-50 nav-bg"',
    r'className="absolute right-0 top-full mt-2 w-20 rounded shadow-xl overflow-hidden flex flex-col z-50 nav-dropdown-bg border nav-border-color"',
    content
)

# Fix mobile language dropdown items
content = re.sub(
    r'className={`px-3 py-2 text-xs text-left nav-link \$\{currentLang === lang \? "active" : ""\}`}\s+style=\{currentLang === lang \? \{ backgroundColor: "rgba\(255,255,255,0\.1\)" \} : \{\}\}',
    r'className={`px-3 py-2 text-xs text-left nav-link ${currentLang === lang ? "active" : ""}`}\n                      style={currentLang === lang ? { backgroundColor: "var(--current-nav-border)", opacity: 0.8 } : {}}',
    content
)

# Fix Hamburger button
content = re.sub(
    r'className="transition-colors p-1" style=\{\{ color: "var\(--nav-text, var\(--color-text-main\)\)" \}\}',
    r'className="transition-colors p-1" style={{ color: "var(--current-nav-text)" }}',
    content
)

# Fix mobile drawer
content = re.sub(
    r'className="lg:hidden w-full nav-bg absolute top-full left-0 overflow-hidden"',
    r'className="lg:hidden w-full nav-dropdown-bg absolute top-full left-0 overflow-hidden border-b nav-border-color"',
    content
)

# Fix mobile nav links
content = re.sub(
    r'className={`text-left font-nav text-lg tracking-\[0\.1em\] py-2 transition-all nav-link \$\{activeSection === item\.id \? \'active font-bold pl-2 border-l\' : \'font-normal\'\}`}\s+style=\{activeSection === item\.id \? \{ borderColor: \'var\(--nav-active, var\(--color-text-main\)\)\' \} : \{\}\}',
    r'className={`text-left font-nav text-lg tracking-[0.1em] py-2 transition-all nav-link ${activeSection === item.id ? \'active font-bold pl-2 border-l\' : \'font-normal\'}`}\n                  style={activeSection === item.id ? { borderColor: \'var(--current-nav-active)\' } : {}}',
    content
)

# Fix mobile drawer separator
content = re.sub(
    r'className="h-\[1px\] my-2" style=\{\{ backgroundColor: \'var\(--nav-border, var\(--color-borders\)\)\' \}\}',
    r'className="h-[1px] my-2" style={{ backgroundColor: \'var(--current-nav-border)\' }}',
    content
)

# Fix mobile drawer language buttons
content = re.sub(
    r'className={`px-2\.5 py-1 text-xs rounded border nav-link \$\{currentLang === lang \? \'active\' : \'\'\}`}\s+style=\{currentLang === lang \? \{ borderColor: \'var\(--nav-active, var\(--color-text-main\)\)\', backgroundColor: \'rgba\(255,255,255,0\.05\)\' \} : \{ borderColor: \'var\(--nav-border, var\(--color-borders\)\)\' \}\}',
    r'className={`px-2.5 py-1 text-xs rounded border nav-link ${currentLang === lang ? \'active\' : \'\'}`}\n                      style={currentLang === lang ? { borderColor: \'var(--current-nav-active)\', backgroundColor: \'var(--current-nav-border)\' } : { borderColor: \'var(--current-nav-border)\' }}',
    content
)


with open('src/components/Navbar.tsx', 'w') as f:
    f.write(content)
