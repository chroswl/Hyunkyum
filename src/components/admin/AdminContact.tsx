import React, { useState, useEffect } from 'react';
import type { Language, ContactSettings } from '../../types';
import { fetchContactSettings, saveContactSettings } from '../../firebase';
import AdminLayout from './AdminLayout';
import PropertyAccordion from './PropertyAccordion';
import { PropertyInput, PropertyTextarea } from './PropertyFields';
import ContactSection from '../ContactSection';
import { translations } from '../../translations';
import { useAppearance } from '../../contexts/AppearanceContext';

export default function AdminContact({ 
  currentLang, 
  onRefreshData,
  onClose,
  contact,
  setContact
}: { 
  currentLang: Language; 
  onRefreshData?: () => void;
  onClose?: () => void;
  contact: ContactSettings;
  setContact: (c: ContactSettings) => void;
}) {
  const { theme } = useAppearance();
  const [initialSettings, setInitialSettings] = useState<ContactSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchContactSettings().then(data => {
      // Provide defaults if null
      const safeData = data || { email: '', phone: '', management: '' };
      setInitialSettings(safeData);
    });
  }, []);

  if (!contact) return <div className="p-8 text-neutral-500">Loading editor...</div>;

  const hasChanges = JSON.stringify(contact) !== JSON.stringify(initialSettings);

  const handleSave = async () => {
    setIsSaving(true);
    await saveContactSettings(contact);
    setInitialSettings(contact);
    if (onRefreshData) onRefreshData();
    setIsSaving(false);
  };

  const handleReset = () => {
    if (initialSettings) setContact(initialSettings);
  };

  const updateField = (key: keyof ContactSettings, val: any) => {
    setContact({ ...contact, [key]: val });
  };

  const updateMultilingualField = (key: 'connectTitle' | 'connectDescription', lang: Language, val: string) => {
    const currentField = contact[key] || { EN: '', DE: '', KO: '' };
    setContact({
      ...contact,
      [key]: {
        ...currentField,
        [lang]: val
      }
    });
  };

  const properties = (
    <div className="pb-20">
      <PropertyAccordion title="Contact Information" defaultOpen>
         <PropertyInput label="Direct Email" value={contact.email || ''} onChange={(v) => updateField('email', v)} type="email" />
         <PropertyInput label="Phone Number" value={contact.phone || ''} onChange={(v) => updateField('phone', v)} type="tel" />
      </PropertyAccordion>
      <PropertyAccordion title="Connect Section" defaultOpen>
         <PropertyInput label="Connect Title" value={contact.connectTitle?.[currentLang] || ''} onChange={(v) => updateMultilingualField('connectTitle', currentLang, v)} />
         <PropertyTextarea label="Connect Description" value={contact.connectDescription?.[currentLang] || ''} onChange={(v) => updateMultilingualField('connectDescription', currentLang, v)} rows={3} />
         <PropertyInput label="Instagram Link" value={contact.instagramLink || ''} onChange={(v) => updateField('instagramLink', v)} />
         <PropertyInput label="YouTube Link" value={contact.youtubeLink || ''} onChange={(v) => updateField('youtubeLink', v)} />
      </PropertyAccordion>
      <PropertyAccordion title="Management" defaultOpen>
         <PropertyTextarea label="Management Info (Name & Address)" value={contact.management || ''} onChange={(v) => updateField('management', v)} rows={5} />
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
      onClose={onClose}
      properties={properties}
    />
  );
}
