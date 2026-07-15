import React from 'react';
import { Instagram, Youtube } from 'lucide-react';
import Reveal from './Reveal';
import ContactForm from './ContactForm';
import { ContactSettings, Language, ThemeSettings } from '../types';

interface ContactSectionProps {
  contact: ContactSettings;
  currentLang: Language;
  t: any;
  theme?: ThemeSettings;
}

export default function ContactSection({
  contact,
  currentLang,
  t,
  theme
}: ContactSectionProps) {
  return (
    <div className="w-full space-y-8 md:space-y-10">
      <div className="mx-auto w-full">
        <div id="contact-grid" className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 xl:gap-20 items-start">
          
          {/* Left Col: Contact Info details (5 cols) */}
          <div id="contact-info-col" className="lg:col-span-5 py-2">
            <Reveal delay={0.15}>
              <div className="flex flex-col space-y-12">
                <div className="space-y-4">
                  <h3 className="text-[11px] md:text-xs tracking-[0.2em] uppercase font-sans font-medium opacity-80" style={{ color: theme?.text }}>
                    {contact.connectTitle?.[currentLang] || 'CONNECT'}
                  </h3>
                  <p className="text-sm md:text-base font-sans leading-relaxed font-light opacity-90">
                    {contact.connectDescription?.[currentLang] || 'Always open to new stages and conversations. Reach out directly via email or use the form below.'}
                  </p>
                </div>

                <div className="space-y-3">
                  <span className="text-[10px] tracking-[0.25em] uppercase block font-sans opacity-80" style={{ color: theme?.text }}>
                    {t.email}
                  </span>
                  <a 
                    href={`mailto:${contact.email || 'contact@hyunkyumkim.com'}`} 
                    className="text-base font-serif font-light hover:opacity-70 transition-opacity duration-300 break-all block"
                  >
                    {contact.email || 'contact@hyunkyumkim.com'}
                  </a>
                </div>

                {/* Social Channels */}
                <div className="space-y-4">
                  <span className="text-[10px] tracking-[0.25em] uppercase block font-sans opacity-80" style={{ color: theme?.text }}>
                    Social Channels
                  </span>
                  <div className="flex space-x-4">
                    <a 
                      href={contact.instagramLink || 'https://instagram.com'} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="w-12 h-12 rounded-sm border border-current opacity-60 flex items-center justify-center hover:opacity-100 hover:bg-white/5 transition-all cursor-pointer"
                      title={t.instagram}
                      style={{ borderColor: theme?.text }}
                    >
                      <Instagram className="w-5 h-5" />
                    </a>
                    <a 
                      href={contact.youtubeLink || 'https://youtube.com'} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="w-12 h-12 rounded-sm border border-current opacity-60 flex items-center justify-center hover:opacity-100 hover:bg-white/5 transition-all cursor-pointer"
                      title={t.youtube}
                      style={{ borderColor: theme?.text }}
                    >
                      <Youtube className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Right Col: Contact Form (7 cols) */}
          <div id="contact-form-col" className="lg:col-span-7 w-full">
            <Reveal delay={0.25}>
              <ContactForm currentLang={currentLang} theme={theme} />
            </Reveal>
          </div>

        </div>
      </div>
    </div>
  );
}
