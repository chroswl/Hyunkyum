const fs = require('fs');
let contactContent = fs.readFileSync('contact_section.txt', 'utf-8');

const componentStr = `import React from 'react';
import { Instagram, Youtube } from 'lucide-react';
import Reveal from './Reveal';
import ContactForm from './ContactForm';
import { ContactSettings, Language } from '../types';

interface ContactSectionProps {
  contact: ContactSettings;
  currentLang: Language;
  t: any;
}

export default function ContactSection({
  contact,
  currentLang,
  t
}: ContactSectionProps) {
  return (
    ${contactContent}
  );
}
`;
fs.writeFileSync('src/components/ContactSection.tsx', componentStr);
console.log('ContactSection.tsx generated successfully.');
