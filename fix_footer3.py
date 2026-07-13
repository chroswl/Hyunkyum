import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

content = re.sub(
    r'<button\s*onClick=\{\(\) => setLegalModal\(\{ isOpen: true, type: \'impressum\' \}\)\}\s*className=" hover: transition-colors duration-300 uppercase tracking-widest text-\[10px\] cursor-pointer"\s*>',
    r'<button onClick={() => setLegalModal({ isOpen: true, type: \'impressum\' })} className="footer-link transition-colors duration-300 uppercase tracking-widest text-[10px] cursor-pointer">',
    content
)

content = re.sub(
    r'<button\s*onClick=\{\(\) => setLegalModal\(\{ isOpen: true, type: \'privacy\' \}\)\}\s*className=" hover: transition-colors duration-300 uppercase tracking-widest text-\[10px\] cursor-pointer"\s*>',
    r'<button onClick={() => setLegalModal({ isOpen: true, type: \'privacy\' })} className="footer-link transition-colors duration-300 uppercase tracking-widest text-[10px] cursor-pointer">',
    content
)

content = re.sub(
    r'className="justify-self-center md:justify-self-end flex items-center space-x-1\.5 hover: transition-colors p-2 rounded cursor-pointer"',
    r'className="justify-self-center md:justify-self-end flex items-center space-x-1.5 footer-link transition-colors p-2 rounded cursor-pointer"',
    content
)


with open('src/App.tsx', 'w') as f:
    f.write(content)

