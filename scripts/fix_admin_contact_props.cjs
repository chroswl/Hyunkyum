const fs = require('fs');
let text = fs.readFileSync('src/components/admin/AdminContact.tsx', 'utf-8');
text = text.replace(/<ContactSection[\s\S]*?\/>/, `<ContactSection 
  contact={settings || {}}
  currentLang={currentLang}
  t={translations[currentLang]}
/>`);
fs.writeFileSync('src/components/admin/AdminContact.tsx', text);
console.log('Fixed props in AdminContact');
