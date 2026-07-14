import React, { useState, useEffect } from 'react';
import type { Language, ThemeSettings } from '../../types';
import { fetchThemeSettings, saveThemeSettings } from '../../firebase';
import AdminLayout from './AdminLayout';
import PropertyAccordion from './PropertyAccordion';
import { PropertyInput, PropertyTextarea } from './PropertyFields';
import { translations } from '../../translations';
import { Instagram, Youtube, Facebook, Twitter, Lock, Mail } from 'lucide-react';
import { LegalModal } from '../LegalModals';

export default function AdminFooter({ 
  currentLang, 
  onRefreshData,
  onClose,
  theme,
  setTheme,
  initialTheme
}: { 
  currentLang: Language; 
  onRefreshData?: () => void;
  onClose?: () => void;
  theme: ThemeSettings;
  setTheme: (t: ThemeSettings) => void;
  initialTheme: ThemeSettings;
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [openModal, setOpenModal] = useState<'impressum' | 'privacy' | null>(null);

  if (!theme) return <div className="p-8 text-neutral-500">Loading editor...</div>;

  const hasChanges = JSON.stringify(theme) !== JSON.stringify(initialTheme);

  const handleSave = async () => {
    setIsSaving(true);
    await saveThemeSettings(theme);
    if (onRefreshData) onRefreshData();
    setIsSaving(false);
    // Dispatch event so live site updates immediately
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: theme }));
  };

  const handleReset = () => {
    if (initialTheme) setTheme(initialTheme);
  };

  const updateField = (key: keyof ThemeSettings, val: any) => {
    setTheme({ ...theme, [key]: val });
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

  return (
    <>
      <AdminLayout 
        title="Footer"
        hasChanges={hasChanges}
        isSaving={isSaving}
        onSave={handleSave}
        onReset={handleReset}
      onClose={onClose}
        properties={properties}
      />
      {openModal && (
        <LegalModal
          isOpen={!!openModal}
          onClose={() => setOpenModal(null)}
          type={openModal}
          currentLang={currentLang}
          theme={theme}
        />
      )}
    </>
  );
}
