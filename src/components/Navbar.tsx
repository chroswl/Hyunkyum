import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, Globe, Lock, ShieldCheck } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';
import { User } from 'firebase/auth';

interface NavbarProps {
  currentLang: Language;
  setLang: (lang: Language) => void;
  user: User | null;
  onAdminToggle: () => void;
}

export default function Navbar({ currentLang, setLang, user, onAdminToggle }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const t = translations[currentLang];

  const menuItems = React.useMemo(() => {
    return currentLang === 'DE' ? [
      { id: 'home', label: 'STARTSEITE' },
      { id: 'biography', label: 'ICH' },
      { id: 'portfolio', label: 'GALERIE' },
      { id: 'videos', label: 'VIDEOS' },
      { id: 'schedule', label: 'TERMINE' },
      { id: 'contact', label: 'KONTAKT' },
    ] : [
      { id: 'home', label: 'HOME' },
      { id: 'biography', label: 'ME' },
      { id: 'portfolio', label: 'GALLERY' },
      { id: 'videos', label: 'VIDEOS' },
      { id: 'schedule', label: 'SCHEDULE' },
      { id: 'contact', label: 'CONTACT' },
    ];
  }, [currentLang]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);

      // Simple intersection tracker
      const scrollPosition = window.scrollY + 200;
      for (const item of menuItems) {
        const el = document.getElementById(item.id);
        if (el) {
          const offsetTop = el.offsetTop;
          const offsetHeight = el.offsetHeight;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(item.id);
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [menuItems]);

  const scrollTo = (id: string) => {
    setActiveSection(id);
    setIsOpen(false);
    
    // Defer scroll slightly to allow the mobile drawer to start closing and 
    // prevent animation conflicts on mobile and tablet touch devices.
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        let offset = window.innerWidth >= 768 ? 80 : 60; // Base offset to clear navbar
        
        // Fine-tune offsets per user request:
        // - Me (biography): arrow down once (~40px scroll down, so offset is reduced by 40)
        // - Gallery (portfolio): arrow down once and a half (~60px scroll down, so offset is reduced by 60)
        // - Schedule (schedule): arrow down once (~40px scroll down, so offset is reduced by 40)
        if (id === 'biography') {
          offset -= 80; // Biography (Me): Scrolled down further ("한칸정도 더 좁게")
        } else if (id === 'portfolio' || id === 'schedule') {
          offset -= 60; // Gallery (portfolio): -60, Schedule: -60 ("정말 반칸 더")
        }

        const offsetPosition = element.offsetTop - offset;

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
          ? 'bg-black/95 backdrop-blur-md border-neutral-900 py-4' 
          : 'bg-transparent border-transparent py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex justify-between items-center">
        {/* Logo / Brand Name */}
        <div 
          id="nav-logo"
          onClick={() => scrollTo('home')}
          className="cursor-pointer font-serif text-xl md:text-2xl font-light tracking-[0.2em] text-white hover:text-white/80 transition-all"
        >
          HYUNKYUM KIM
        </div>

        {/* Desktop Navigation */}
        <div id="desktop-menu" className="hidden lg:flex items-center space-x-8">
          <div className="flex items-center space-x-6">
            {menuItems.map((item) => (
              <button
                key={item.id}
                id={`nav-link-${item.id}`}
                onClick={() => scrollTo(item.id)}
                className={`relative font-sans text-xs tracking-[0.15em] transition-all uppercase ${
                  activeSection === item.id 
                    ? 'text-white font-bold' 
                    : 'text-neutral-400 hover:text-white font-normal'
                }`}
              >
                {item.label}
                {activeSection === item.id && (
                  <motion.div 
                    layoutId="activeIndicator"
                    className="absolute -bottom-1 left-0 right-0 h-[1px] bg-white"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>

          <div className="h-4 w-[1px] bg-neutral-800" />

          {/* Lang Selector */}
          <div className="flex items-center space-x-2 text-xs font-sans">
            <Globe className="w-3 h-3 text-neutral-400" />
            {(['EN', 'DE', 'KO'] as Language[]).map((lang) => (
              <button
                key={lang}
                id={`lang-btn-${lang}`}
                onClick={() => setLang(lang)}
                className={`px-1.5 py-0.5 rounded transition-all tracking-wider ${
                  currentLang === lang 
                    ? 'text-white font-medium border border-white/30 bg-white/5' 
                    : 'text-neutral-400 hover:text-white'
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
              className="text-[10px] tracking-wider border border-neutral-800 px-2 py-1 bg-neutral-950 text-neutral-300 rounded flex items-center space-x-1"
            >
              <Globe className="w-3 h-3 text-white" />
              <span>{currentLang}</span>
            </button>
            <AnimatePresence>
              {isLangDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="absolute right-0 top-full mt-2 w-20 bg-neutral-950 border border-neutral-800 rounded shadow-xl overflow-hidden flex flex-col z-50"
                >
                  {(['EN', 'DE', 'KO'] as Language[]).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => {
                        setLang(lang);
                        setIsLangDropdownOpen(false);
                      }}
                      className={`px-3 py-2 text-xs text-left ${currentLang === lang ? 'text-white bg-white/10' : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'}`}
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
            className="text-white hover:text-white transition-colors p-1"
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
            className="lg:hidden w-full bg-black/98 border-b border-neutral-900 absolute top-full left-0 overflow-hidden"
          >
            <div className="px-6 py-6 flex flex-col space-y-4">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  id={`mobile-nav-link-${item.id}`}
                  onClick={() => scrollTo(item.id)}
                  className={`text-left font-serif text-lg tracking-[0.1em] py-2 transition-all ${
                    activeSection === item.id 
                      ? 'text-white font-bold pl-2 border-l border-white' 
                      : 'text-neutral-400 hover:text-white font-normal'
                  }`}
                >
                  {item.label}
                </button>
              ))}

              <div className="h-[1px] bg-neutral-900 my-2" />

              {/* Language selection inside mobile drawer */}
              <div className="flex items-center space-x-3 py-2">
                <Globe className="w-4 h-4 text-neutral-400" />
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
                          ? 'text-white border-white bg-white/5' 
                          : 'text-neutral-400 border-neutral-800'
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
