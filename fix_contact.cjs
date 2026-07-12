const fs = require('fs');
let text = fs.readFileSync('src/components/ContactSection.tsx', 'utf-8');
text = text.replace('return (\n     id="contact"', 'return (\n    <section id="contact"');
fs.writeFileSync('src/components/ContactSection.tsx', text);
