import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, Globe, Lock, ShieldCheck } from 'lucide-react';
import { Language, ThemeSettings } from '../types';
import { translations } from '../translations';
import { User } from 'firebase/auth';
import { useAppearance } from '../contexts/AppearanceContext';

interface NavbarProps {
  currentLang: Language;
  setLang: (lang: Language) => void;
  user: User | null;
  onAdminToggle: () => void;
  theme?: ThemeSettings;
}

export default function Navbar({ currentLang, setLang, user, onAdminToggle }: NavbarProps) {
  const { theme } = useAppearance();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const t = translations[currentLang];

  const menuItems = React.useMemo(() => {
    if (currentLang === 'KO') {
      return [
        { id: 'home', label: '홈' },
        { id: 'biography', label: '소개' },
        { id: 'press', label: '언론보도' },
        { id: 'portfolio', label: '갤러리' },
        { id: 'videos', label: '영상' },
        { id: 'schedule', label: '일정' },
        { id: 'contact', label: '연락처' },
      ];
    }
    return currentLang === 'DE' ? [
      { id: 'home', label: 'STARTSEITE' },
      { id: 'biography', label: 'ICH' },
      { id: 'press', label: 'PRESSE' },
      { id: 'portfolio', label: 'GALERIE' },
      { id: 'videos', label: 'VIDEOS' },
      { id: 'schedule', label: 'TERMINE' },
      { id: 'contact', label: 'KONTAKT' },
    ] : [
      { id: 'home', label: 'HOME' },
      { id: 'biography', label: 'ME' },
      { id: 'press', label: 'PRESS' },
      { id: 'portfolio', label: 'GALLERY' },
      { id: 'videos', label: 'VIDEOS' },
      { id: 'schedule', label: 'SCHEDULE' },
      { id: 'contact', label: 'CONTACT' },
    ];
  }, [currentLang]);

  const clickScrollInProgress = React.useRef(false);
  const clickScrollTimeout = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);

      if (clickScrollInProgress.current) return;

      // Use middle of screen for better intersection tracking
      const scrollPosition = window.scrollY + window.innerHeight / 2;
      
      // Check if we are at the very bottom of the page
      const isBottom = window.innerHeight + Math.round(window.scrollY) >= document.documentElement.scrollHeight - 50;

      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 150) {
        setActiveSection(menuItems[menuItems.length - 1].id);
        return;
      }

      let current = menuItems[0].id;
      for (const item of menuItems) {
        const el = document.getElementById(item.id);
        if (el && scrollPosition >= el.offsetTop - 100) {
          current = item.id;
        }
      }
      setActiveSection(current);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [menuItems]);

  const scrollTo = (id: string) => {
    setActiveSection(id);
    setIsOpen(false);
    
    clickScrollInProgress.current = true;
    if (clickScrollTimeout.current) clearTimeout(clickScrollTimeout.current);
    
    // Release the scroll lock after smooth scrolling completes
    clickScrollTimeout.current = setTimeout(() => {
      clickScrollInProgress.current = false;
    }, 1200);

    // Defer scroll slightly to allow the mobile drawer to start closing and 
    // prevent animation conflicts on mobile and tablet touch devices.
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        const navHeight = theme?.spacingNavHeight ?? 80;
        let offset = navHeight + 48; // Base offset to clear navbar + elegant extra gap
        if (id === 'home') {
          offset = 0;
        }
        
        const rect = element.getBoundingClientRect();
        const offsetPosition = rect.top + window.scrollY - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }, 120);
  };

  return (
    <nav 
      id="navbar-root"
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 border-b ${
        isScrolled 
          ? 'bg-black/95 backdrop-blur-md border-neutral-900' 
          : 'bg-transparent border-transparent'
      }`}
    >
      <div className="global-container h-full px-6 md:px-12 flex justify-between items-center">
        {/* Logo / Brand Name */}
        <div 
          id="nav-logo"
          onClick={() => scrollTo('home')}
          className="cursor-pointer font-serif text-xl md:text-2xl font-light tracking-[0.2em] text-[var(--color-text)] hover:text-[var(--color-text)]/80 transition-all"
        >
          {theme?.footerBrandName || 'HYUNKYUM KIM'}
        </div>

        {/* Desktop Navigation */}
        <div id="desktop-menu" className="hidden lg:flex items-center space-x-8">
          <div id="desktop-menu-links" className="flex items-center">
            {menuItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
              <button
                key={item.id}
                id={`nav-link-${item.id}`}
                onClick={() => scrollTo(item.id)}
                className="relative font-sans text-xs tracking-[0.15em] transition-colors uppercase cursor-pointer py-1"
              >
                <span className={`transition-all duration-300 block ${isActive ? 'text-[var(--color-text)]' : 'text-[var(--color-text)]/60 hover:text-[var(--color-text)]'}`} style={{ textShadow: isActive ? '0 0 0.5px var(--color-text)' : 'none' }}>
                  {item.label}
                </span>
                {isActive && (
                  <motion.div 
                    layoutId="navbarMainIndicator"
                    className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-[var(--color-text)]"
                    transition={{ type: 'spring', stiffness: 350, damping: 35 }}
                  />
                )}
              </button>
              );
            })}
          </div>

          <div className="h-4 w-[1px] bg-[var(--color-text)]/10" />

          {/* Lang Selector */}
          <div className="flex items-center space-x-2 text-xs font-sans">
            <Globe className="w-3 h-3 text-[var(--color-text)]/70" />
            {(['EN', 'DE', 'KO'] as Language[]).map((lang) => (
              <button
                key={lang}
                id={`lang-btn-${lang}`}
                onClick={() => setLang(lang)}
                className={`px-1.5 py-0.5 rounded transition-all tracking-wider ${
                  currentLang === lang 
                    ? 'text-[var(--color-text)] font-medium border border-[var(--color-text)]/30 bg-[var(--color-text)]/5' 
                    : 'text-[var(--color-text)]/70 hover:text-[var(--color-text)]'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>

          {/* Admin Indicator */}
          {user && (
            <button
              id="nav-admin-indicator"
              onClick={onAdminToggle}
              className="flex items-center space-x-1.5 px-3 py-1 border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-400 rounded-full text-[10px] tracking-widest transition-all uppercase"
            >
              <ShieldCheck className="w-3 h-3" />
              <span>Admin</span>
            </button>
          )}
        </div>

        {/* Mobile menu toggle & lang toggle */}
        <div className="flex items-center space-x-4 lg:hidden">
          {/* Quick Lang Select for Mobile */}
          <div className="relative">
            <button
              id="mobile-lang-cycle"
              onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
              className="text-[10px] tracking-wider border border-[var(--color-text)]/20 px-2 py-1 bg-[var(--color-bg)] text-[var(--color-text)] rounded flex items-center space-x-1"
            >
              <Globe className="w-3 h-3 text-[var(--color-text)]" />
              <span>{currentLang}</span>
            </button>
            <AnimatePresence>
              {isLangDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="absolute right-0 top-full mt-2 w-20 bg-[var(--color-bg)] border border-[var(--color-text)]/20 rounded shadow-xl overflow-hidden flex flex-col z-50"
                >
                  {(['EN', 'DE', 'KO'] as Language[]).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => {
                        setLang(lang);
                        setIsLangDropdownOpen(false);
                      }}
                      className={`px-3 py-2 text-xs text-left ${currentLang === lang ? 'text-[var(--color-text)] bg-[var(--color-text)]/10' : 'text-[var(--color-text)]/70 hover:bg-[var(--color-text)]/10 hover:text-[var(--color-text)]'}`}
                    >
                      {lang}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Hamburger */}
          <button 
            id="hamburger-btn"
            onClick={() => setIsOpen(!isOpen)}
            className="text-[var(--color-text)] hover:text-[var(--color-text)] transition-colors p-1"
            aria-label="Toggle Menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="mobile-drawer"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden w-full bg-[var(--color-bg)]/98 border-b border-[var(--color-text)]/10 absolute top-full left-0 overflow-hidden"
          >
            <div className="px-6 py-6 flex flex-col space-y-4">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  id={`mobile-nav-link-${item.id}`}
                  onClick={() => scrollTo(item.id)}
                  className={`text-left font-serif text-lg tracking-[0.1em] py-2 transition-all ${
                    activeSection === item.id 
                      ? 'text-[var(--color-text)] font-bold pl-2 border-l border-[var(--color-text)]' 
                      : 'text-[var(--color-text)]/70 hover:text-[var(--color-text)] font-normal'
                  }`}
                >
                  {item.label}
                </button>
              ))}

              <div className="h-[1px] bg-[var(--color-text)]/10 my-2" />

              {/* Language selection inside mobile drawer */}
              <div className="flex items-center space-x-3 py-2">
                <Globe className="w-4 h-4 text-[var(--color-text)]/70" />
                <div className="flex space-x-2">
                  {(['EN', 'DE', 'KO'] as Language[]).map((lang) => (
                    <button
                      key={lang}
                      id={`mobile-lang-btn-${lang}`}
                      onClick={() => {
                        setLang(lang);
                        setIsOpen(false);
                      }}
                      className={`px-2.5 py-1 text-xs rounded border ${
                        currentLang === lang 
                          ? 'text-[var(--color-text)] border-[var(--color-text)] bg-[var(--color-text)]/10' 
                          : 'text-[var(--color-text)]/70 border-[var(--color-text)]/20'
                      }`}
                    >
                      {lang === 'EN' ? 'EN' : lang === 'DE' ? 'DE' : 'KO'}
                    </button>
                  ))}
                </div>
              </div>

              {user && (
                <button
                  id="mobile-nav-admin-toggle"
                  onClick={() => {
                    setIsOpen(false);
                    onAdminToggle();
                  }}
                  className="w-full text-center py-2 bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/20 rounded text-emerald-400 text-xs tracking-widest uppercase flex items-center justify-center space-x-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{t.navAdmin}</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
