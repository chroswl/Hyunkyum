import { InlineEditor } from "../lib/editing/InlineEditor";
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
  adminMode?: boolean;
}

export const LegalModal: React.FC<LegalModalProps> = ({ isOpen, onClose, type, currentLang, theme, adminMode }) => {
  if (!isOpen) return null;

  const renderEditableText = (key: string, defaultText: string, asComp: React.ElementType = 'span', className?: string) => {
    return (
      <InlineEditor
        id={`theme.legal.${key}.${currentLang}`}
        initialValue={theme?.legal?.[key]?.[currentLang] || defaultText}
        readonly={!adminMode}
        placeholder={defaultText}
        as={asComp as any}
        className={className}
        wrapperClassName={asComp === 'div' ? 'block' : 'inline-block'}
        toolbarTools={["heading", "list", "link"]}
      />
    );
  };

  // Render Impressum Content
  const renderImpressum = () => {
    const t = translations[currentLang] as any;

    return (
      <div className="space-y-8 font-sans text-neutral-300 leading-relaxed text-sm md:text-base">
        <div>
          <h3 className="font-serif text-lg md:text-xl text-white uppercase tracking-wider mb-2">
            {renderEditableText('impressumTitle', t.impressumTitle || "Legal Notice (Impressum)")}
          </h3>
          <div className="text-xs text-neutral-500 font-mono tracking-widest uppercase mb-6">
            {renderEditableText('impressumInfoTitle', t.impressumInfoTitle || "Information according to § 5 DDG")}
          </div>
        </div>

        {/* Address and Contact details Card */}
        <div className="bg-neutral-950 border border-neutral-900 rounded-sm p-6 space-y-4">
          <div className="flex items-start space-x-3">
            <MapPin className="w-5 h-5 text-neutral-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-serif text-white font-medium text-base tracking-wide">
                {renderEditableText('impressumAddressName', t.impressumAddressName || "Hyunkyum Kim")}
              </div>
              <div className="text-neutral-400 mt-1">
                {renderEditableText('impressumAddressStreet', t.impressumAddressStreet || "Ludwigstraße 65")}
              </div>
              <div className="text-neutral-400">
                {renderEditableText('impressumAddressCity', t.impressumAddressCity || "67657 Kaiserslautern")}, {renderEditableText('impressumAddressCountry', t.impressumAddressCountry || "Germany")}
              </div>
            </div>
          </div>

          <div className="border-t border-neutral-900/60 pt-4 mt-4 space-y-3">
            <div className="flex items-center space-x-3 text-sm">
              <Mail className="w-4 h-4 text-neutral-400 flex-shrink-0" />
              <span className="text-neutral-400">
                {renderEditableText('impressumEmailLabel', t.impressumEmailLabel || "Email")}: 
              </span>
              <a href="mailto:contact@hyunkyumkim.com" className="text-white hover:underline transition-colors">
                contact@hyunkyumkim.com
              </a>
            </div>
          </div>
        </div>

        {/* Responsible Section */}
        <div className="space-y-4 pt-4 border-t border-neutral-900">
          <h4 className="font-serif text-sm tracking-wider text-white uppercase">
            {renderEditableText('impressumResponsibleTitle', t.impressumResponsibleTitle || "Responsible for content pursuant to § 18 MStV")}
          </h4>
          <div className="text-neutral-400 text-sm space-y-1">
            <div>{renderEditableText('impressumAddressName', t.impressumAddressName || "Hyunkyum Kim")}</div>
            <div>{renderEditableText('impressumAddressStreet', t.impressumAddressStreet || "Ludwigstraße 65")}</div>
            <div>{renderEditableText('impressumAddressCity', t.impressumAddressCity || "67657 Kaiserslautern")}</div>
            <div>{renderEditableText('impressumAddressCountry', t.impressumAddressCountry || "Germany")}</div>
          </div>
        </div>

        {/* Image & Video Credits */}
        <div className="space-y-4 pt-4 border-t border-neutral-900">
          <h4 className="font-serif text-sm tracking-wider text-white uppercase">
            {renderEditableText('impressumCreditsTitle', t.impressumCreditsTitle || "Image & Video Credits")}
          </h4>
          <div className="space-y-5 text-sm text-neutral-400">
            <div>
              <div className="font-serif text-xs text-neutral-300 uppercase tracking-widest mb-2 font-medium">
                {renderEditableText('impressumPhotographyTitle', t.impressumPhotographyTitle || "Photography")}
              </div>
              <ul className="space-y-1 text-neutral-400 pl-0.5">
                <li>• Klaudia Taday</li>
                <li>• Andreas J. Etter</li>
                <li>• Thomas Brenner</li>
                <li>• Felix Grünschloß</li>
              </ul>
            </div>

            <div>
              <div className="font-serif text-xs text-neutral-300 uppercase tracking-widest mb-2 font-medium">
                {renderEditableText('impressumHeroVideoTitle', t.impressumHeroVideoTitle || "Hero Video")}
              </div>
              <div className="space-y-1 text-neutral-400">
                <div>{renderEditableText('impressumHeroVideoText1', t.impressumHeroVideoText1 || "Footage courtesy of Pfalztheater Kaiserslautern.")}</div>
                <div>{renderEditableText('impressumHeroVideoText2', t.impressumHeroVideoText2 || "Filmed and produced by Siegerbusch Film.")}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright Notice */}
        <div className="space-y-3 pt-4 border-t border-neutral-900">
          <h4 className="font-serif text-sm tracking-wider text-white uppercase">
            {renderEditableText('impressumCopyrightTitle', t.impressumCopyrightTitle || "Copyright Notice")}
          </h4>
          <div className="space-y-2 text-sm text-neutral-400 leading-relaxed">
            <div>
              {renderEditableText('impressumCopyrightText1', t.impressumCopyrightText1 || "Unless otherwise stated, all texts, designs, and original content on this website are the intellectual property of Hyunkyum Kim.")}
            </div>
            <div>
              {renderEditableText('impressumCopyrightText2', t.impressumCopyrightText2 || "Photographs and video material remain the copyright of their respective creators or rights holders and are used with permission.")}
            </div>
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
            {renderEditableText('privacyTitle', t.privacyTitle || "Privacy Policy")}
          </h3>
          <div className="text-xs text-neutral-500 font-mono tracking-widest uppercase mb-6">
            {renderEditableText('privacySubtitle', t.privacySubtitle || "Data Protection Information")}
          </div>
        </div>

        <div className="space-y-4">
          <div className="text-white text-base">
            {renderEditableText('privacyIntro', t.privacyIntro || "Welcome to my website...", 'div')}
          </div>
        </div>

        <div className="border-t border-neutral-900 pt-6 space-y-4">
          <h4 className="font-serif text-sm tracking-wider text-white uppercase">
            {renderEditableText('privacySec1Title', t.privacySec1Title || "1. Data Collection on our Website")}
          </h4>
          <div className="text-neutral-400 text-sm">
            {renderEditableText('privacySec1Text', t.privacySec1Text || "We take the protection of your personal data very seriously...", 'div')}
          </div>
        </div>

        <div className="border-t border-neutral-900 pt-6 space-y-4">
          <h4 className="font-serif text-sm tracking-wider text-white uppercase">
            {renderEditableText('privacySec2Title', t.privacySec2Title || "2. Hosting")}
          </h4>
          <div className="text-neutral-400 text-sm">
            {renderEditableText('privacySec2Text', t.privacySec2Text || "Our website is hosted...", 'div')}
          </div>
        </div>

        <div className="border-t border-neutral-900 pt-6 space-y-4">
          <h4 className="font-serif text-sm tracking-wider text-white uppercase">
            {renderEditableText('privacySec3Title', t.privacySec3Title || "3. General Information and Mandatory Information")}
          </h4>
          <div className="text-neutral-400 text-sm">
            {renderEditableText('privacySec3Text', t.privacySec3Text || "Information about your rights...", 'div')}
          </div>
        </div>

        <div className="border-t border-neutral-900 pt-6 space-y-4">
          <h4 className="font-serif text-sm tracking-wider text-white uppercase">
            {renderEditableText('privacySec4Title', t.privacySec4Title || "4. Data Collection on this Website")}
          </h4>
          <div className="text-neutral-400 text-sm">
            {renderEditableText('privacySec4Text', t.privacySec4Text || "How data is collected...", 'div')}
          </div>
        </div>

        <div className="border-t border-neutral-900 pt-6 space-y-4">
          <h4 className="font-serif text-sm tracking-wider text-white uppercase">
            {renderEditableText('privacySec5Title', t.privacySec5Title || "5. Plugins and Tools")}
          </h4>
          <div className="text-neutral-400 text-sm">
            {renderEditableText('privacySec5Text', t.privacySec5Text || "We use third party tools...", 'div')}
          </div>
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
