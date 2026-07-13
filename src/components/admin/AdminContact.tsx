import React, { useState, useEffect } from 'react';
import type { Language, ContactSettings } from '../../types';
import { fetchContactSettings, saveContactSettings } from '../../firebase';
import AdminLayout from './AdminLayout';
import PropertyAccordion from './PropertyAccordion';
import { PropertyInput, PropertyTextarea } from './PropertyFields';
import ContactSection from '../ContactSection';
import { translations } from '../../translations';
import { useAppearance } from '../../contexts/AppearanceContext';

export default function AdminContact({ currentLang, onRefreshData }: { currentLang: Language; onRefreshData?: () => void }) {
  const { theme } = useAppearance();
  const [settings, setSettings] = useState<ContactSettings | null>(null);
  const [initialSettings, setInitialSettings] = useState<ContactSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchContactSettings().then(data => {
      // Provide defaults if null
      const safeData = data || { email: '', phone: '', management: '' };
      setSettings(safeData);
      setInitialSettings(safeData);
    });
  }, []);

  if (!settings) return <div className="p-8 text-neutral-500">Loading editor...</div>;

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(initialSettings);

  const handleSave = async () => {
    setIsSaving(true);
    await saveContactSettings(settings);
    setInitialSettings(settings);
    if (onRefreshData) onRefreshData();
    window.dispatchEvent(new CustomEvent('contactChanged', { detail: settings }));
    setIsSaving(false);
  };

  const handleReset = () => {
    if (initialSettings) setSettings(initialSettings);
  };

  const updateField = (key: keyof ContactSettings, val: any) => {
    setSettings(prev => prev ? { ...prev, [key]: val } : prev);
  };

  const updateMultilingualField = (key: 'connectTitle' | 'connectDescription', lang: Language, val: string) => {
    setSettings(prev => {
      if (!prev) return prev;
      const currentField = prev[key] || { EN: '', DE: '', KO: '' };
      return {
        ...prev,
        [key]: {
          ...currentField,
          [lang]: val
        }
      };
    });
  };

  const properties = (
    <div className="pb-20">
      <PropertyAccordion title="Contact Information" defaultOpen>
         <PropertyInput label="Direct Email" value={settings.email || ''} onChange={(v) => updateField('email', v)} type="email" />
         <PropertyInput label="Phone Number" value={settings.phone || ''} onChange={(v) => updateField('phone', v)} type="tel" />
      </PropertyAccordion>
      <PropertyAccordion title="Connect Section" defaultOpen>
         <PropertyInput label="Connect Title" value={settings.connectTitle?.[currentLang] || ''} onChange={(v) => updateMultilingualField('connectTitle', currentLang, v)} />
         <PropertyTextarea label="Connect Description" value={settings.connectDescription?.[currentLang] || ''} onChange={(v) => updateMultilingualField('connectDescription', currentLang, v)} rows={3} />
         <PropertyInput label="Instagram Link" value={settings.instagramLink || ''} onChange={(v) => updateField('instagramLink', v)} />
         <PropertyInput label="YouTube Link" value={settings.youtubeLink || ''} onChange={(v) => updateField('youtubeLink', v)} />
      </PropertyAccordion>
      <PropertyAccordion title="Management" defaultOpen>
         <PropertyTextarea label="Management Info (Name & Address)" value={settings.management || ''} onChange={(v) => updateField('management', v)} rows={5} />
      </PropertyAccordion>
    </div>
  );

  return (
    <AdminLayout 
      title="Contact Settings"
      hasChanges={hasChanges}
      isSaving={isSaving}
      onSave={handleSave}
      onReset={handleReset}
      preview={
        <div className="w-full h-full overflow-y-auto custom-scrollbar" style={{ backgroundColor: theme?.bg || 'black' }}>
          <ContactSection 
            contact={settings || {}}
            currentLang={currentLang}
            t={translations[currentLang]}
            theme={theme || undefined}
          />
        </div>
      }
      properties={properties}
    />
  );
}
