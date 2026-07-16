import React from 'react';
import { motion } from 'motion/react';
import { X, Shield, FileText, ExternalLink, Mail, Phone, MapPin, Award } from 'lucide-react';
import { Language, ThemeSettings } from '../types';
import { translations } from '../translations';

interface LegalModalProps {
  key?: string;
  isOpen: boolean;
  onClose: () => void;
  type: 'impressum' | 'privacy';
  currentLang: Language;
  theme?: ThemeSettings;
}

export const LegalModal: React.FC<LegalModalProps> = ({ isOpen, onClose, type, currentLang, theme }) => {
  if (!isOpen) return null;

  // Render Impressum Content
  const renderImpressum = () => {
    const t = translations[currentLang] as any;

    return (
      <div className="space-y-8 font-sans text-neutral-300 leading-relaxed text-sm md:text-base">
        <div>
          <h3 className="font-serif text-lg md:text-xl text-white uppercase tracking-wider mb-2">
            {t.impressumTitle || "Legal Notice (Impressum)"}
          </h3>
          <p className="text-xs text-neutral-500 font-mono tracking-widest uppercase mb-6">
            {t.impressumInfoTitle}
          </p>
        </div>

        {/* Address and Contact details Card */}
        <div className="bg-neutral-950 border border-neutral-900 rounded-sm p-6 space-y-4">
          <div className="flex items-start space-x-3">
            <MapPin className="w-5 h-5 text-neutral-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-serif text-white font-medium text-base tracking-wide">{t.impressumAddressName}</p>
              <p className="text-neutral-400 mt-1">{t.impressumAddressStreet}</p>
              <p className="text-neutral-400">{t.impressumAddressCity}, {t.impressumAddressCountry}</p>
            </div>
          </div>

          <div className="border-t border-neutral-900/60 pt-4 mt-4 space-y-3">
            <div className="flex items-center space-x-3 text-sm">
              <Mail className="w-4 h-4 text-neutral-400 flex-shrink-0" />
              <span className="text-neutral-400">{t.impressumEmailLabel}: </span>
              <a href="mailto:contact@hyunkyumkim.com" className="text-white hover:underline transition-colors">
                contact@hyunkyumkim.com
              </a>
            </div>
          </div>
        </div>

        {/* Responsible Section */}
        <div className="space-y-4 pt-4 border-t border-neutral-900">
          <h4 className="font-serif text-sm tracking-wider text-white uppercase">{t.impressumResponsibleTitle}</h4>
          <div className="text-neutral-400 text-sm space-y-1">
            <p>{t.impressumAddressName}</p>
            <p>{t.impressumAddressStreet}</p>
            <p>{t.impressumAddressCity}</p>
            <p>{t.impressumAddressCountry}</p>
          </div>
        </div>
      </div>
    );
  };

  // Render Privacy Policy Content
  const renderPrivacy = () => {
    const t = translations[currentLang] as any;

    return (
      <div className="space-y-6 font-sans text-neutral-300 leading-relaxed text-sm md:text-base">
        <div>
          <h3 className="font-serif text-lg md:text-xl text-white uppercase tracking-wider mb-2">
            {t.privacyTitle || "Privacy Policy"}
          </h3>
          <p className="text-xs text-neutral-500 font-mono tracking-widest uppercase mb-6">
            {t.privacySubtitle || "Data Protection Information"}
          </p>
        </div>

        <div className="space-y-4">
          <p className="text-white text-base">
            {t.privacyIntro}
          </p>
        </div>

        <div className="border-t border-neutral-900 pt-6 space-y-4">
          <h4 className="font-serif text-sm tracking-wider text-white uppercase">{t.privacySec1Title}</h4>
          <p className="text-neutral-400 text-sm">
            {t.privacySec1Text}
          </p>
        </div>

        <div className="border-t border-neutral-900 pt-6 space-y-4">
          <h4 className="font-serif text-sm tracking-wider text-white uppercase">{t.privacySec2Title}</h4>
          <p className="text-neutral-400 text-sm">
            {t.privacySec2Text}
          </p>
        </div>

        <div className="border-t border-neutral-900 pt-6 space-y-4">
          <h4 className="font-serif text-sm tracking-wider text-white uppercase">{t.privacySec3Title}</h4>
          <p className="text-neutral-400 text-sm">
            {t.privacySec3Text}
          </p>
        </div>

        <div className="border-t border-neutral-900 pt-6 space-y-4">
          <h4 className="font-serif text-sm tracking-wider text-white uppercase">{t.privacySec4Title}</h4>
          <p className="text-neutral-400 text-sm">
            {t.privacySec4Text}
          </p>
        </div>

        <div className="border-t border-neutral-900 pt-6 space-y-4">
          <h4 className="font-serif text-sm tracking-wider text-white uppercase">{t.privacySec5Title}</h4>
          <p className="text-neutral-400 text-sm">
            {t.privacySec5Text}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6"
      id={`legal-modal-overlay-${type}`}
    >
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />

      {/* Modal Container */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', duration: 0.5 }}
        id={`legal-modal-content-${type}`}
        className="relative w-full max-w-2xl max-h-[85vh] bg-neutral-950 border border-neutral-900 rounded-sm overflow-hidden shadow-2xl flex flex-col z-10"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-neutral-900 flex justify-between items-center bg-black/40">
          <div className="flex items-center space-x-2.5">
            {type === 'impressum' ? (
              <FileText className="w-5 h-5 text-neutral-400" />
            ) : (
              <Shield className="w-5 h-5 text-neutral-400" />
            )}
            <h2 className="font-serif text-sm md:text-base tracking-widest text-white uppercase font-light">
              {type === 'impressum' ? (translations[currentLang] as any).impressumTitle : (translations[currentLang] as any).privacyTitle}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="text-neutral-500 hover:text-white transition-colors p-1 rounded-sm cursor-pointer hover:bg-neutral-900/50"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 md:p-8 overflow-y-auto flex-1 custom-scrollbar scroll-smooth">
          {type === 'impressum' ? renderImpressum() : renderPrivacy()}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-900 flex justify-end bg-black/20 text-[10px] text-neutral-500 font-mono">
          <span>Baritone Hyunkyum Kim • Official Website</span>
        </div>
      </motion.div>
    </div>
  );
};
