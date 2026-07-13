import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

content = re.sub(
    r'<button\s*onClick=\{.*type: \'impressum\'\}\}\s*className=" hover: transition-colors duration-300 uppercase tracking-widest text-\[10px\] cursor-pointer"\s*>',
    r'<button onClick={() => setLegalModal({ isOpen: true, type: ' + "'impressum'" + r'})} className="footer-link transition-colors duration-300 uppercase tracking-widest text-[10px] cursor-pointer">',
    content
)

content = re.sub(
    r'<button\s*onClick=\{.*type: \'privacy\'\}\}\s*className=" hover: transition-colors duration-300 uppercase tracking-widest text-\[10px\] cursor-pointer"\s*>',
    r'<button onClick={() => setLegalModal({ isOpen: true, type: ' + "'privacy'" + r'})} className="footer-link transition-colors duration-300 uppercase tracking-widest text-[10px] cursor-pointer">',
    content
)

content = re.sub(
    r'<button id="admin-lock-btn" onClick=\{\(\) => setIsAdminOpen\(true\)\} className="justify-self-center md:justify-self-end flex items-center space-x-1\.5 hover: transition-colors p-2 rounded cursor-pointer"',
    r'<button id="admin-lock-btn" onClick={() => setIsAdminOpen(true)} className="justify-self-center md:justify-self-end flex items-center space-x-1.5 footer-link transition-colors p-2 rounded cursor-pointer"',
    content
)

with open('src/App.tsx', 'w') as f:
    f.write(content)
