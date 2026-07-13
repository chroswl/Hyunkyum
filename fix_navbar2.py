import re

with open('src/components/Navbar.tsx', 'r') as f:
    content = f.read()

# Replace <nav className="..." style="...">
# It currently is:
#     <nav 
#       id="navbar-root"
#       className={`${appearance.navigation.sticky ? 'fixed' : 'absolute'} top-0 left-0 w-full z-50 transition-all duration-500 border-b ${
#         isScrolled 
#           ? `nav-bg ${appearance.navigation.blur ? 'backdrop-blur-md' : ''} py-4` 
#           : `${appearance.navigation.transparent ? 'bg-transparent border-transparent' : 'nav-bg'} py-6`
#       }`}
#       style={{
#         height: isScrolled ? `calc(var(--nav-height, 80px) * 0.8)` : 'var(--nav-height, 80px)',
#         color: 'var(--nav-text, var(--color-text-main))'
#       }}
#     >

replacement = """    <nav 
      id="navbar-root"
      className={`nav-container ${appearance.navigation.sticky ? 'fixed' : 'absolute'} top-0 left-0 w-full z-50 transition-all duration-500 border-b ${
        isScrolled 
          ? `nav-scrolled py-4 ${appearance.navigation.blur ? 'backdrop-blur-md' : ''}` 
          : `nav-transparent py-6 ${appearance.navigation.transparent && appearance.navigation.blur ? 'backdrop-blur-sm' : ''}`
      }`}
      style={{
        height: isScrolled ? `calc(var(--nav-height, 80px) * 0.8)` : 'var(--nav-height, 80px)'
      }}
    >"""

content = re.sub(
    r'<nav\s+id="navbar-root"\s+className=\{`[^`]+`\}\s+style=\{\{[^\}]+\}\}\s+>',
    replacement,
    content,
    flags=re.DOTALL
)

with open('src/components/Navbar.tsx', 'w') as f:
    f.write(content)
