import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { Language, ThemeSettings } from '../types';
import { translations } from '../translations';

interface ContactFormProps {
  currentLang: Language;
  theme?: ThemeSettings;
}

export default function ContactForm({ currentLang, theme }: ContactFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errors, setErrors] = useState<{ name?: string; email?: string; message?: string }>({});

  const t = translations[currentLang];

  // 문의 내용을 이메일(contact@hyunkyumkim.com)로 직접 전송하기 위한 API 엔드포인트입니다.
  const API_ENDPOINT = "/api/contact"; 

  const validationMessages = {
    EN: {
      nameRequired: "Please enter your name.",
      emailRequired: "Please enter your email address.",
      messageRequired: "Please enter your message.",
      emailInvalid: "Please enter a valid email address."
    },
    DE: {
      nameRequired: "Bitte geben Sie Ihren Namen ein.",
      emailRequired: "Bitte geben Sie Ihre E-Mail-Adresse ein.",
      messageRequired: "Bitte geben Sie Ihre Nachricht ein.",
      emailInvalid: "Bitte geben Sie eine gültige E-Mail-Adresse ein."
    },
    KO: {
      nameRequired: "이름을 입력해 주세요.",
      emailRequired: "이메일 주소를 입력해 주세요.",
      messageRequired: "메시지를 입력해 주세요.",
      emailInvalid: "올바른 이메일 주소를 입력해 주세요."
    }
  };

  const msgs = validationMessages[currentLang] || validationMessages.EN;

  const handleNameChange = (val: string) => {
    setName(val);
    if (val.trim()) {
      setErrors(prev => ({ ...prev, name: undefined }));
    }
  };

  const handleEmailChange = (val: string) => {
    setEmail(val);
    if (val.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(val.trim())) {
        setErrors(prev => ({ ...prev, email: undefined }));
      }
    }
  };

  const handleMessageChange = (val: string) => {
    setMessage(val);
    if (val.trim()) {
      setErrors(prev => ({ ...prev, message: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Custom Validation
    const newErrors: { name?: string; email?: string; message?: string } = {};
    if (!name.trim()) {
      newErrors.name = msgs.nameRequired;
    }
    if (!email.trim()) {
      newErrors.email = msgs.emailRequired;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        newErrors.email = msgs.emailInvalid;
      }
    }
    if (!message.trim()) {
      newErrors.message = msgs.messageRequired;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          email,
          message
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`Contact API error: Status ${response.status}`, errorData);
        throw new Error('Email submission failed');
      }

      setSubmitStatus('success');
      setName('');
      setEmail('');
      setMessage('');
      setErrors({});
    } catch (error) {
      console.error("Error submitting contact message:", error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="contact-form-container" className="w-full">
      {/* 
        Formspree/Web3Forms 등의 Fallback 지원을 위해 action 및 method 속성을 추가해 둡니다. 
        handleSubmit 이벤트 핸들러(e.preventDefault())에 의해 비동기(fetch)로 처리되므로 
        페이지 새로고침(Reload)이 일어나지 않고 성공 메시지를 UI에 미니멀하게 띄워 줍니다.
      */}
      <form 
        id="contact-form" 
        onSubmit={handleSubmit} 
        noValidate
        className="space-y-5"
      >
        {/* Row for Name & Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1.5 pb-5 relative">
            <label htmlFor="name" className="text-[10px] tracking-widest font-sans uppercase font-medium opacity-60" style={{ color: theme?.text }}>
              {t.formName} *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder={t.formNamePlaceholder || "e.g. Jean-Pierre"}
              className={`w-full border ${errors.name ? 'border-rose-500/50 focus:border-rose-500/70' : 'focus:border-white/40'} focus:ring-0 rounded-sm px-4 py-3 text-sm transition-colors`}
              style={{ 
                backgroundColor: theme?.contactFormBg || 'color-mix(in srgb, var(--color-text) 6%, transparent)',
                color: theme?.text, 
                borderColor: 'color-mix(in srgb, var(--color-text) 20%, transparent)' 
              }}
            />
            <AnimatePresence>
              {errors.name && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute bottom-0 left-0 text-[11px] text-rose-400 font-sans font-light tracking-wide"
                >
                  {errors.name}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
          <div className="space-y-1.5 pb-5 relative">
            <label htmlFor="email" className="text-[10px] tracking-widest font-sans uppercase font-medium opacity-60" style={{ color: theme?.text }}>
              {t.formEmail} *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              placeholder={t.formEmailPlaceholder || "e.g. jp@example.com"}
              className={`w-full border ${errors.email ? 'border-rose-500/50 focus:border-rose-500/70' : 'focus:border-white/40'} focus:ring-0 rounded-sm px-4 py-3 text-sm transition-colors`}
              style={{ 
                backgroundColor: theme?.contactFormBg || 'color-mix(in srgb, var(--color-text) 6%, transparent)',
                color: theme?.text, 
                borderColor: 'color-mix(in srgb, var(--color-text) 20%, transparent)' 
              }}
            />
            <AnimatePresence>
              {errors.email && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute bottom-0 left-0 text-[11px] text-rose-400 font-sans font-light tracking-wide"
                >
                  {errors.email}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Message area */}
        <div className="space-y-1.5 pb-5 relative">
          <label htmlFor="message" className="text-[10px] tracking-widest font-sans uppercase font-medium opacity-60" style={{ color: theme?.text }}>
            {t.formMessage} *
          </label>
          <textarea
            id="message"
            name="message"
            rows={5}
            value={message}
            onChange={(e) => handleMessageChange(e.target.value)}
            placeholder={t.formMessagePlaceholder || "..."}
            className={`w-full border ${errors.message ? 'border-rose-500/50 focus:border-rose-500/70' : 'focus:border-white/40'} focus:ring-0 rounded-sm px-4 py-3 text-sm transition-colors resize-none`}
            style={{ 
              backgroundColor: theme?.contactFormBg || 'color-mix(in srgb, var(--color-text) 6%, transparent)',
              color: theme?.text, 
              borderColor: 'color-mix(in srgb, var(--color-text) 20%, transparent)' 
            }}
          />
          <AnimatePresence>
            {errors.message && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute bottom-0 left-0 text-[11px] text-rose-400 font-sans font-light tracking-wide"
              >
                {errors.message}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Status displays */}
        <AnimatePresence mode="wait">
          {submitStatus === 'success' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center space-x-2.5 p-4 border border-emerald-500/30 bg-emerald-500/5 text-emerald-400 text-xs rounded-sm"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{t.formSuccess}</span>
            </motion.div>
          )}

          {submitStatus === 'error' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center space-x-2.5 p-4 border border-rose-500/30 bg-rose-500/5 text-rose-400 text-xs rounded-sm"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{t.formError}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit button */}
        <button
          type="submit"
          id="contact-submit-btn"
          disabled={isSubmitting}
          className="w-full sm:w-auto px-8 py-3.5 bg-transparent border border-current opacity-60 hover:opacity-100 hover:bg-white/5 font-sans text-xs tracking-widest uppercase font-medium rounded-sm flex items-center justify-center space-x-2.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          style={{ color: theme?.text }}
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>{t.formSending}</span>
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              <span>{t.formSend}</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
