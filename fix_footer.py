import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

content = re.sub(
    r'<h4 className="font-serif text-sm tracking-widest uppercase">',
    r'<h4 className="font-serif text-sm tracking-widest uppercase footer-heading">',
    content
)

content = re.sub(
    r'<p className="text-\[10px\] tracking-wider opacity-75">',
    r'<p className="text-[10px] tracking-wider opacity-75 footer-text">',
    content
)

content = re.sub(
    r'<div className="flex flex-col items-center text-center gap-2 text-\[10px\] tracking-wider ">',
    r'<div className="flex flex-col items-center text-center gap-2 text-[10px] tracking-wider footer-text">',
    content
)

# Also fix the links in the center
content = re.sub(
    r'<button onClick=\{.*\} className="hover:text-white transition-colors">',
    r'<button onClick={() => {}} className="footer-link transition-colors">',
    content
)

content = re.sub(
    r'<button onClick=\{.*setIsLegalModalOpen\(\'imprint\'\).*\} className="hover:text-white transition-colors">',
    r'<button onClick={() => setIsLegalModalOpen(\'imprint\')} className="footer-link transition-colors">',
    content
)

content = re.sub(
    r'<button onClick=\{.*setIsLegalModalOpen\(\'privacy\'\).*\} className="hover:text-white transition-colors">',
    r'<button onClick={() => setIsLegalModalOpen(\'privacy\')} className="footer-link transition-colors">',
    content
)

with open('src/App.tsx', 'w') as f:
    f.write(content)
