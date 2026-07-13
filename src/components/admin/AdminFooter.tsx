import React, { useState, useEffect } from 'react';
import type { Language, ThemeSettings } from '../../types';
import { fetchThemeSettings, saveThemeSettings } from '../../firebase';
import AdminLayout from './AdminLayout';
import PropertyAccordion from './PropertyAccordion';
import { PropertyInput, PropertyTextarea } from './PropertyFields';
import { translations } from '../../translations';
import { Instagram, Youtube, Facebook, Twitter, Lock, Mail } from 'lucide-react';
import { LegalModal } from '../LegalModals';

export default function AdminFooter({ currentLang, onRefreshData }: { currentLang: Language; onRefreshData?: () => void }) {
  const [theme, setTheme] = useState<ThemeSettings | null>(null);
  const [initialTheme, setInitialTheme] = useState<ThemeSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [openModal, setOpenModal] = useState<'impressum' | 'privacy' | null>(null);

  useEffect(() => {
    fetchThemeSettings().then(data => {
      setTheme(data);
      setInitialTheme(data);
    });
  }, []);

  if (!theme) return <div className="p-8 text-neutral-500">Loading editor...</div>;

  const hasChanges = JSON.stringify(theme) !== JSON.stringify(initialTheme);

  const handleSave = async () => {
    setIsSaving(true);
    await saveThemeSettings(theme);
    setInitialTheme(theme);
    if (onRefreshData) onRefreshData();
    setIsSaving(false);
    // Dispatch event so live site updates immediately
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: theme }));
  };

  const handleReset = () => {
    if (initialTheme) setTheme(initialTheme);
  };

  const updateField = (key: keyof ThemeSettings, val: any) => {
    setTheme(prev => prev ? { ...prev, [key]: val } : prev);
  };

  const t = translations[currentLang];

  const properties = (
    <div className="pb-20">
      <PropertyAccordion title="Brand & Copyright" defaultOpen>
        <PropertyInput 
          label="Brand Name" 
          value={theme.footerBrandName || ''} 
          placeholder={t.heroTitle} 
          onChange={(v) => updateField('footerBrandName', v)} 
        />
        <PropertyInput 
          label="Singer Subtitle / Description" 
          value={theme.footerContactEmail || ''} 
          placeholder="Baritone & Opera Singer based in Germany" 
          onChange={(v) => updateField('footerContactEmail', v)} 
        />
        <PropertyInput 
          label="Copyright Text ({year} is dynamic)" 
          value={theme.footerCopyrightText || ''} 
          placeholder={`© {year} ${theme.footerBrandName || t.heroTitle}. ${t.footerRights}.`}
          onChange={(v) => updateField('footerCopyrightText', v)} 
        />
      </PropertyAccordion>

      <PropertyAccordion title="Legal Information" defaultOpen>
        <PropertyTextarea 
          label="Custom Impressum Text (Plaintext or HTML)" 
          value={theme.footerImpressum || ''} 
          placeholder="Enter custom Impressum text... (Falls back to default if left empty)"
          rows={6}
          onChange={(v) => updateField('footerImpressum', v)} 
        />
        <PropertyTextarea 
          label="Custom Privacy Policy Text (Plaintext or HTML)" 
          value={theme.footerPrivacyPolicy || ''} 
          placeholder="Enter custom Privacy Policy text... (Falls back to default if left empty)"
          rows={6}
          onChange={(v) => updateField('footerPrivacyPolicy', v)} 
        />
      </PropertyAccordion>

      <PropertyAccordion title="Social Links">
        <PropertyInput 
          label="Instagram Link" 
          value={theme.footerSocialInstagram || ''} 
          placeholder="https://instagram.com/..." 
          onChange={(v) => updateField('footerSocialInstagram', v)} 
        />
        <PropertyInput 
          label="YouTube Link" 
          value={theme.footerSocialYoutube || ''} 
          placeholder="https://youtube.com/..." 
          onChange={(v) => updateField('footerSocialYoutube', v)} 
        />
        <PropertyInput 
          label="Facebook Link" 
          value={theme.footerSocialFacebook || ''} 
          placeholder="https://facebook.com/..." 
          onChange={(v) => updateField('footerSocialFacebook', v)} 
        />
        <PropertyInput 
          label="Twitter/X Link" 
          value={theme.footerSocialTwitter || ''} 
          placeholder="https://twitter.com/..." 
          onChange={(v) => updateField('footerSocialTwitter', v)} 
        />
      </PropertyAccordion>
    </div>
  );

  const preview = (
    <div 
      className="w-full h-full flex flex-col justify-between p-8 md:p-12 transition-all duration-300"
      style={{ backgroundColor: theme.bg || '#000000', color: theme.text || '#ffffff' }}
    >
      <div className="flex-1 flex flex-col justify-center items-center text-center max-w-xl mx-auto space-y-4">
        <span className="text-[10px] tracking-[0.4em] text-neutral-500 uppercase font-mono">Live Footer Preview</span>
        <h4 className="text-sm font-sans tracking-widest text-neutral-400">
          This shows how the live homepage footer adapts instantly to your changes.
        </h4>
      </div>

      <div className="border-t border-neutral-900/60 pt-10 grid grid-cols-1 md:grid-cols-3 gap-6 items-center w-full">
        <div className="space-y-2 text-center md:text-left">
          <h4 className="font-serif text-sm tracking-widest uppercase">
            {theme.footerBrandName || t.heroTitle}
          </h4>
          <p className="text-[10px] tracking-wider opacity-60">
            {theme.footerContactEmail || t.footerDesc}
          </p>
        </div>

        <div className="flex flex-col items-center text-center gap-3 text-[10px] tracking-wider">
          <div className="opacity-75">
            {theme.footerCopyrightText ? (
              theme.footerCopyrightText.replace('{year}', new Date().getFullYear().toString())
            ) : (
              `© ${new Date().getFullYear()} ${theme.footerBrandName || t.heroTitle}. All Rights Reserved.`
            )}
          </div>
          <div className="flex items-center space-x-3 opacity-60">
            <button onClick={() => setOpenModal('impressum')} className="uppercase tracking-widest text-[9px] hover:text-white">Impressum</button>
            <span>|</span>
            <button onClick={() => setOpenModal('privacy')} className="uppercase tracking-widest text-[9px] hover:text-white">Privacy Policy</button>
          </div>
        </div>

        <div className="flex items-center space-x-4 justify-center md:justify-end">
          {theme.footerSocialInstagram && (
            <Instagram className="w-4 h-4 text-neutral-400 hover:text-white transition-colors" />
          )}
          {theme.footerSocialYoutube && (
            <Youtube className="w-4 h-4 text-neutral-400 hover:text-white transition-colors" />
          )}
          {theme.footerSocialFacebook && (
            <Facebook className="w-4 h-4 text-neutral-400 hover:text-white transition-colors" />
          )}
          {theme.footerSocialTwitter && (
            <Twitter className="w-4 h-4 text-neutral-400 hover:text-white transition-colors" />
          )}
          <div className="flex items-center space-x-1 p-1 bg-white/5 rounded-sm opacity-50">
            <Lock className="w-3 h-3 text-[#C9A227]" />
            <span className="text-[8px] uppercase tracking-widest font-mono">Secure</span>
          </div>
        </div>
      </div>
      {openModal && (
        <LegalModal
          isOpen={!!openModal}
          onClose={() => setOpenModal(null)}
          type={openModal}
          currentLang={currentLang}
          theme={theme}
        />
      )}
    </div>
  );

  return (
    <AdminLayout 
      title="Footer"
      hasChanges={hasChanges}
      isSaving={isSaving}
      onSave={handleSave}
      onReset={handleReset}
      preview={preview}
      properties={properties}
    />
  );
}
