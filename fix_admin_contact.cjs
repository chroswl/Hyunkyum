const fs = require('fs');
let text = fs.readFileSync('src/components/admin/AdminContact.tsx', 'utf-8');
text = text.replace("import ContactForm from '../ContactForm';", "import ContactSection from '../ContactSection';");
text = text.replace("<ContactForm ", "<ContactSection ");
fs.writeFileSync('src/components/admin/AdminContact.tsx', text);

let appTsx = fs.readFileSync('src/App.tsx', 'utf-8');
appTsx = appTsx.replace(/<section\s+id="contact"[\s\S]*?<\/section>/, `<ContactSection 
  contact={contact}
  currentLang={currentLang}
  t={t}
/>`);

if (!appTsx.includes("import ContactSection from './components/ContactSection';")) {
  appTsx = appTsx.replace("import ContactForm from './components/ContactForm';", "import ContactSection from './components/ContactSection';");
}
fs.writeFileSync('src/App.tsx', appTsx);
console.log('Fixed AdminContact and App.tsx');
