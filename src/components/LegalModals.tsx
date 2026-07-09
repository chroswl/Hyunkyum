import React from 'react';
import { motion } from 'motion/react';
import { X, Shield, FileText, ExternalLink, Mail, Phone, MapPin, Award } from 'lucide-react';
import { Language } from '../types';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'impressum' | 'privacy';
  currentLang: Language;
}

export const LegalModal: React.FC<LegalModalProps> = ({ isOpen, onClose, type, currentLang }) => {
  if (!isOpen) return null;

  // Render Impressum Content
  const renderImpressum = () => {
    return (
      <div className="space-y-8 font-sans text-neutral-300 leading-relaxed text-sm md:text-base">
        <div>
          <h3 className="font-serif text-lg md:text-xl text-white uppercase tracking-wider mb-2">
            Information provided according to Sec. 5 German Telemedia Act (TMG)
          </h3>
          <p className="text-xs text-neutral-500 font-mono tracking-widest uppercase mb-6">
            Angaben gemäß § 5 TMG
          </p>
        </div>

        {/* Address and Contact details Card */}
        <div className="bg-neutral-950 border border-neutral-900 rounded-sm p-6 space-y-4">
          <div className="flex items-start space-x-3">
            <MapPin className="w-5 h-5 text-neutral-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-serif text-white font-medium text-base tracking-wide">Hyunkyum Kim</p>
              <p className="text-neutral-400 mt-1">[Street Address / 도로명 주소]</p>
              <p className="text-neutral-400">[Postal Code & City / 우편번호 및 도시], Germany</p>
            </div>
          </div>

          <div className="border-t border-neutral-900/60 pt-4 mt-4 space-y-3">
            <div className="flex items-center space-x-3 text-sm">
              <Phone className="w-4 h-4 text-neutral-400 flex-shrink-0" />
              <span className="text-neutral-400">Phone: </span>
              <span className="text-white hover:text-neutral-200 transition-colors">[Your Phone Number / 예: +49 (0) 123 45678]</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <Mail className="w-4 h-4 text-neutral-400 flex-shrink-0" />
              <span className="text-neutral-400">Email: </span>
              <a href="mailto:info@hyunkyumbaritone.de" className="text-white hover:underline transition-colors">
                info@hyunkyumbaritone.de
              </a>
            </div>
          </div>
        </div>

        {/* VAT Section */}
        <div className="space-y-2">
          <h4 className="font-serif text-sm tracking-wider text-white uppercase">VAT (Umsatzsteuer-ID)</h4>
          <p className="text-neutral-400 text-sm">
            VAT identification number according to Sec. 27 a of the German Value Added Tax Act:
          </p>
          <p className="text-white font-mono text-sm bg-neutral-950 border border-neutral-900 px-3 py-1.5 rounded-sm inline-block">
            [Your VAT ID / 예: DE123456789 - 없다면 이 항목은 삭제 가능]
          </p>
        </div>

        {/* Photo Credits Section */}
        <div className="space-y-3">
          <h4 className="font-serif text-sm tracking-wider text-white uppercase flex items-center space-x-2">
            <Award className="w-4 h-4 text-neutral-400" />
            <span>Photo Credits (Bildnachweis)</span>
          </h4>
          <p className="text-neutral-400 text-sm">
            The photos used on this website were taken by:
          </p>
          <ul className="list-disc pl-5 text-sm space-y-1 text-neutral-400">
            <li>
              Portrait Photos: <span className="text-white">[Name of Photographer]</span>
            </li>
            <li>
              Stage Photos: <span className="text-white">[Name of Photographer]</span>
            </li>
          </ul>
        </div>

        {/* Legal Disclaimer */}
        <div className="pt-6 border-t border-neutral-900 text-xs text-neutral-500 space-y-4">
          <p>
            <strong>Disclaimer:</strong> Although we carefully check external links, we cannot assume liability for their content. The operators of linked pages are solely responsible for their content.
          </p>
        </div>
      </div>
    );
  };

  // Render Privacy Policy Content
  const renderPrivacy = () => {
    return (
      <div className="space-y-6 font-sans text-neutral-300 leading-relaxed text-sm md:text-base">
        <div>
          <h3 className="font-serif text-lg md:text-xl text-white uppercase tracking-wider mb-2">
            Privacy Policy
          </h3>
          <p className="text-xs text-neutral-500 font-mono tracking-widest uppercase mb-6">
            Datenschutzerklärung (Summary)
          </p>
        </div>

        <div className="space-y-4">
          <p className="font-medium text-white text-base">
            We take the protection of your personal data seriously.
          </p>
          <p>
            Personal data collected via the contact form on this website will only be used to process your inquiry and will not be shared with third parties.
          </p>
        </div>

        <div className="border-t border-neutral-900 pt-6 space-y-4">
          <h4 className="font-serif text-sm tracking-wider text-white uppercase">1. Server Log Files</h4>
          <p className="text-neutral-400 text-sm">
            The provider of this website automatically collects and stores information that your browser transmits to us in "server log files". These are typically IP address, browser type/version, operating system, referrer URL, and time of the server request. This data is not merged with other data sources and serves solely to ensure the secure and stable operation of the website.
          </p>
        </div>

        <div className="border-t border-neutral-900 pt-6 space-y-4">
          <h4 className="font-serif text-sm tracking-wider text-white uppercase">2. Contact Form Data</h4>
          <p className="text-neutral-400 text-sm">
            If you send us inquiries via the contact form, your details from the inquiry form, including the contact details you provided there (Name, Email, Message), will be stored with us for the purpose of processing the inquiry and in the event of follow-up questions. We do not pass on this data without your explicit consent.
          </p>
        </div>

        <div className="border-t border-neutral-900 pt-6 space-y-4">
          <h4 className="font-serif text-sm tracking-wider text-white uppercase">3. Your Rights (Access, Correction, Erasure)</h4>
          <p className="text-neutral-400 text-sm">
            You have the right at any time to free information about your stored personal data, its origin and recipient and the purpose of the data processing, as well as a right to correction or erasure of this data. For this and other questions on the subject of personal data, you can contact us at any time at the email address provided in the Impressum.
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
              {type === 'impressum' ? 'IMPRESSUM' : 'PRIVACY POLICY'}
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
