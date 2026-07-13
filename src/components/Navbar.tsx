import { useAppearance } from '../contexts/AppearanceContext';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, Globe, Lock, ShieldCheck } from 'lucide-react';
import { Language, ThemeSettings } from '../types';
import { translations } from '../translations';
import { User } from 'firebase/auth';

interface NavbarProps {
  currentLang: Language;
  setLang: (lang: Language) => void;
  user: User | null;
  onAdminToggle: () => void;
  theme?: ThemeSettings;
}

export default function Navbar({ currentLang, setLang, user, onAdminToggle, theme }: NavbarProps) {
  const { appearance } = useAppearance();
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

  const isCurrentlyTransparent = appearance.navigation.transparent && !isScrolled;

  return (
    <nav 
      id="navbar-root"
      className={`nav-container ${appearance.navigation.sticky ? 'fixed' : 'absolute'} top-0 left-0 w-full z-50 transition-all duration-700 border-b ${
        isCurrentlyTransparent 
          ? `nav-transparent ${appearance.navigation.blur ? 'backdrop-blur-sm' : ''}` 
          : `nav-scrolled ${appearance.navigation.blur ? 'backdrop-blur-md' : ''}`
      }`}
      style={{
        height: isScrolled ? `calc(var(--nav-height, 80px) * 0.7)` : `calc(var(--nav-height, 80px) - 16px)`
      }}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex justify-between items-center h-full">
        {/* Logo / Brand Name */}
        <div 
          id="nav-logo"
          onClick={() => scrollTo('home')}
          className="cursor-pointer font-hero font-light tracking-[0.2em] nav-logo transition-all"
          style={{ fontSize: 'var(--nav-logo-size, 24px)' }}
        >
          {theme?.footerBrandName || 'HYUNKYUM KIM'}
        </div>

        {/* Desktop Navigation */}
        <div id="desktop-menu" className="hidden lg:flex items-center" style={{ gap: 'var(--nav-menu-gap, 32px)' }}>
          <div className="flex items-center" style={{ gap: 'calc(var(--nav-menu-gap, 32px) * 0.75)' }}>
            {menuItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
              <button
                key={item.id}
                id={`nav-link-${item.id}`}
                onClick={() => scrollTo(item.id)}
                className="relative font-nav text-xs tracking-[0.15em] transition-colors uppercase cursor-pointer py-1"
              >
                <span className={`transition-all duration-300 block nav-link ${isActive ? "active font-medium" : ""}`}>
                  {item.label}
                </span>
                {isActive && (
                  <motion.div 
                    layoutId="navbarMainIndicator"
                    className="absolute bottom-0 left-0 right-0 h-[1.5px]"
                    style={{ backgroundColor: 'var(--current-nav-active)' }}
                    transition={{ type: 'spring', stiffness: 350, damping: 35 }}
                  />
                )}
              </button>
              );
            })}
          </div>

          <div className="h-4 w-[1px]" style={{ backgroundColor: 'var(--current-nav-text)', opacity: 0.2 }} />

          {/* Lang Selector */}
          <div className="flex items-center space-x-2 text-xs font-nav">
            <Globe className="w-3 h-3" style={{ color: "var(--current-nav-text)", opacity: 0.6 }} />
            {(['EN', 'DE', 'KO'] as Language[]).map((lang) => (
              <button
                key={lang}
                id={`lang-btn-${lang}`}
                onClick={() => setLang(lang)}
                className={`px-1.5 py-0.5 rounded transition-all tracking-wider nav-link ${currentLang === lang ? 'active font-semibold' : ''}`}
                style={currentLang === lang ? { 
                  border: '1px solid var(--current-nav-active)', 
                  backgroundColor: 'color-mix(in srgb, var(--current-nav-active) 15%, transparent)' 
                } : {}}
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
              className="text-[10px] tracking-wider rounded flex items-center space-x-1 nav-dropdown-bg" style={{ padding: "0.25rem 0.5rem", color: "var(--current-nav-text)" }}
            >
              <Globe className="w-3 h-3" style={{ color: "var(--current-nav-text)" }} />
              <span>{currentLang}</span>
            </button>
            <AnimatePresence>
              {isLangDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="absolute right-0 top-full mt-2 w-20 rounded shadow-xl overflow-hidden flex flex-col z-50 nav-dropdown-bg border nav-border-color"
                >
                  {(['EN', 'DE', 'KO'] as Language[]).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => {
                        setLang(lang);
                        setIsLangDropdownOpen(false);
                      }}
                      className={`px-3 py-2 text-xs text-left nav-link ${currentLang === lang ? "active font-medium" : ""}`}
                      style={currentLang === lang ? { backgroundColor: "color-mix(in srgb, var(--current-nav-active) 20%, transparent)", color: "var(--current-nav-active)", opacity: 1 } : {}}
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
            className="transition-colors p-1" style={{ color: "var(--current-nav-text)" }}
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
            className="lg:hidden w-full nav-dropdown-bg absolute top-full left-0 overflow-y-auto scroll-smooth border-b nav-border-color"
            style={{
              maxHeight: 'calc(100vh - 100%)',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            <div className="px-6 py-6 flex flex-col space-y-4">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  id={`mobile-nav-link-${item.id}`}
                  onClick={() => scrollTo(item.id)}
                  className={`text-left font-nav text-lg tracking-[0.1em] py-2 transition-all nav-link ${activeSection === item.id ? 'active font-bold pl-2 border-l' : 'font-normal'}`}
                  style={activeSection === item.id ? { borderColor: 'var(--current-nav-active)' } : {}}
                >
                  {item.label}
                </button>
              ))}

              <div className="h-[1px] my-2" style={{ backgroundColor: 'var(--current-nav-border)' }} />

              {/* Language selection inside mobile drawer */}
              <div className="flex items-center space-x-3 py-2">
                <Globe className="w-4 h-4" style={{ color: "var(--current-nav-text)", opacity: 0.6 }} />
                <div className="flex space-x-2">
                  {(['EN', 'DE', 'KO'] as Language[]).map((lang) => (
                    <button
                      key={lang}
                      id={`mobile-lang-btn-${lang}`}
                      onClick={() => {
                        setLang(lang);
                        setIsOpen(false);
                      }}
                      className={`px-2.5 py-1 text-xs rounded border nav-link ${currentLang === lang ? 'active font-semibold' : ''}`}
                      style={currentLang === lang ? { 
                        borderColor: 'var(--current-nav-active)', 
                        backgroundColor: 'color-mix(in srgb, var(--current-nav-active) 15%, transparent)' 
                      } : { 
                        borderColor: 'color-mix(in srgb, var(--current-nav-text) 15%, transparent)' 
                      }}
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
