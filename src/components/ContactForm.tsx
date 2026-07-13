import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { saveContactMessage } from '../firebase';
import { Language } from '../types';
import { translations } from '../translations';

interface ContactFormProps {
  currentLang: Language;
}

export default function ContactForm({ currentLang }: ContactFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errors, setErrors] = useState<{ name?: string; email?: string; message?: string }>({});

  const t = translations[currentLang];

  // 폼 스피리(Formspree) 또는 Web3Forms 등의 무료 이메일 전송 API 엔드포인트 URL입니다.
  // 이메일(barikyum@gmail.com) 수신을 위해 Formspree(https://formspree.io/)에 로그인 후
  // 새로 생성한 폼의 엔드포인트 URL(예: https://formspree.io/f/xxxxxxxx)을 아래에 입력해 주세요!
  const FORM_ENDPOINT = "https://formspree.io/f/your_form_id_here"; 

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
      // 1. Firebase Firestore 백업 저장 (관리자 패널에서도 실시간 확인 가능하도록 유지)
      await saveContactMessage({
        name,
        email,
        message,
        createdAt: new Date().toISOString()
      });

      // 2. Formspree/Web3Forms 엔드포인트가 세팅되어 있는 경우 이메일 전송 실행
      if (FORM_ENDPOINT && !FORM_ENDPOINT.includes("your_form_id_here")) {
        const response = await fetch(FORM_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            name: name,
            email: email,
            message: message
          })
        });

        if (!response.ok) {
          throw new Error('Formspree submission failed');
        }
      } else {
        console.warn("Formspree URL이 기본값입니다. 이메일 전송은 생략되며, Firebase 데이터베이스에만 백업용으로 저장되었습니다. 이메일 수신을 원하시면 FORM_ENDPOINT 값을 본인의 Formspree URL로 변경해 주세요.");
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
        action={FORM_ENDPOINT} 
        method="POST" 
        onSubmit={handleSubmit} 
        noValidate
        className="space-y-5"
      >
        {/* Row for Name & Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1.5 pb-5 relative">
            <label htmlFor="name" className="text-[10px] tracking-widest text-[var(--color-text)]/60 font-sans uppercase font-medium">
              {t.formName} *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Jean-Pierre"
              className={`forms-input w-full border ${errors.name ? "border-rose-500/50" : ""} rounded-sm px-4 py-3 text-sm transition-colors`}
              
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
            <label htmlFor="email" className="text-[10px] tracking-widest text-[var(--color-text)]/60 font-sans uppercase font-medium">
              {t.formEmail} *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              placeholder="e.g. jp@example.com"
              className={`forms-input w-full border ${errors.email ? "border-rose-500/50" : ""} rounded-sm px-4 py-3 text-sm transition-colors`}
              
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
          <label htmlFor="message" className="text-[10px] tracking-widest text-[var(--color-text)]/60 font-sans uppercase font-medium">
            {t.formMessage} *
          </label>
          <textarea
            id="message"
            name="message"
            rows={5}
            value={message}
            onChange={(e) => handleMessageChange(e.target.value)}
            placeholder="..."
            className={`forms-input w-full border ${errors.message ? "border-rose-500/50" : ""} rounded-sm px-4 py-3 text-sm transition-colors resize-none`}
            
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
          className="forms-btn border-transparent w-full sm:w-auto px-8 py-3.5 font-sans text-xs tracking-widest uppercase font-medium rounded-sm flex items-center justify-center space-x-2.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
