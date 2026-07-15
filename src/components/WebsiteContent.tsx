import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Edit3, X, Instagram, Youtube, Facebook, Twitter, Lock } from 'lucide-react';

import Navbar from './Navbar';
import HeroSection from './HeroSection';
import SelectedPerformances from './SelectedPerformances';
import BiographySection from './BiographySection';
import PressSection from './PressSection';
import PortfolioGallery from './PortfolioGallery';
import VideoPlayer from './VideoPlayer';
import ScheduleSection from './ScheduleSection';
import ContactSection from './ContactSection';
import { LegalModal } from './LegalModals';
import Reveal from './Reveal';
import GenericSection from './GenericSection';
import HeroEditorPanel from './HeroEditorPanel';
import { getMediaSource } from '../lib/mediaUtils';
import { saveThemeSettings } from '../firebase';

export default function WebsiteContent(props: any) {
  const {
    currentLang, setLang, user, setIsAdminOpen,
    scheduleItems, setScheduleItems, portfolioItems, setPortfolioItems,
    videoItems, setVideoItems, pressItems, setPressItems,
    theme, setTheme, bio, setBio, contact, setContact, slides, setSlides,
    activeEditSection, setActiveEditSection,
    isEditingHeroText, setIsEditingHeroText,
    initialThemeRef, loadAllData, legalModal, setLegalModal, t,
    isHeroVideoPlaying, setIsHeroVideoPlaying, heroVideoRef,
    adminMode, selectedBlock, onBlockSelect
  } = props;

  const containerRef = React.useRef<HTMLDivElement>(null);

  const scrollToSection = (id: string) => {
    const currentDoc = containerRef.current?.ownerDocument || document;
    const currentWin = currentDoc.defaultView || window;

    if (id === 'home') {
      currentWin.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
      return;
    }

    // Locate the section's Landing Anchor or section container as fallback
    const anchorEl = currentDoc.getElementById(`${id}-anchor`) || currentDoc.getElementById(id);
    if (anchorEl) {
      const navEl = currentDoc.getElementById('navbar-root');
      const navHeight = navEl ? navEl.offsetHeight : (theme?.spacingNavHeight ?? 80);

      const anchorRect = anchorEl.getBoundingClientRect();
      const anchorTop = anchorRect.top + currentWin.scrollY;

      // Apply one shared Landing Padding
      const sharedLandingPadding = 48; 
      const offsetPosition = anchorTop - navHeight - sharedLandingPadding;

      currentWin.scrollTo({
        top: Math.max(0, offsetPosition),
        behavior: 'smooth'
      });
    }
  };

  const getGoogleFontImport = () => {
    if (!theme) return '';
    const fontsToLoad = [
      theme.websiteFont
    ].filter(Boolean) as string[];
    const systemFonts = ['Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Georgia', 'serif', 'sans-serif', 'monospace', 'system-ui', 'inherit'];
    const uniqueGoogleFonts = Array.from(new Set(fontsToLoad)).filter(f => f && !systemFonts.includes(f));
    if (uniqueGoogleFonts.length === 0) return '';
    const fontParams = uniqueGoogleFonts.map(f => `family=${f.replace(/\s+/g, '+')}:wght@300;400;500;600;700`).join('&');
    return `@import url('https://fonts.googleapis.com/css2?${fontParams}&display=swap');`;
  };

  const scale = (theme?.websiteTextSize ?? 100) / 100;

  return (
    <div ref={containerRef} id="app-container" className="min-h-screen relative font-sans selection:bg-white selection:text-black" style={{ backgroundColor: theme?.bg, color: theme?.text }}>
      <style>{`
        ${getGoogleFontImport()}
        #app-container {
          --color-bg: ${theme?.bg};
          --color-text: ${theme?.text};
          --color-contact-bg: ${theme?.contactFormBg || '#0a0a0a'};
          --color-hero-slide-text: ${theme?.colorHeroSlideText || theme?.text || '#ffffff'};
          
          /* Spacing Customization */
          --content-max-width: ${theme?.spacingContentWidth ?? 1440}px;
          --section-spacing: ${theme?.spacingSection ?? 96}px;
          --nav-height: ${theme?.spacingNavHeight ?? 80}px;
          --nav-gap: ${theme?.spacingNavGap ?? 32}px;
          
          /* Typography Scale */
          --text-xs: ${0.75 * scale}rem;
          --text-sm: ${0.875 * scale}rem;
          --text-base: ${1 * scale}rem;
          --text-lg: ${1.125 * scale}rem;
          --text-xl: ${1.25 * scale}rem;
          --text-2xl: ${1.5 * scale}rem;
          --text-3xl: ${1.875 * scale}rem;
          --text-4xl: ${2.25 * scale}rem;
          --text-5xl: ${3 * scale}rem;
          --text-6xl: ${3.75 * scale}rem;
          --text-7xl: ${4.5 * scale}rem;
          --text-8xl: ${6 * scale}rem;
          --text-9xl: ${8 * scale}rem;
        }
        #app-container .text-\\[8px\\] { font-size: ${8 * scale}px !important; }
        #app-container .text-\\[9px\\] { font-size: ${9 * scale}px !important; }
        #app-container .text-\\[10px\\] { font-size: ${10 * scale}px !important; }
        #app-container .text-\\[11px\\] { font-size: ${11 * scale}px !important; }
        
        #app-container, #app-container * {
          color: var(--color-text) !important;
        }
        #app-container .page-section {
          background-color: var(--color-bg) !important;
          padding-top: 0px !important;
          padding-bottom: 0px !important;
        }
        #app-container footer {
          background-color: var(--color-bg) !important;
          padding-top: var(--section-spacing) !important;
          padding-bottom: var(--section-spacing) !important;
        }
        #navbar-root {
          --nav-scale: ${(theme?.navFontSize ?? 100) / 100};
          --text-xs: calc(0.75rem * var(--nav-scale));
          --text-sm: calc(0.875rem * var(--nav-scale));
          --text-base: calc(1rem * var(--nav-scale));
          --text-lg: calc(1.125rem * var(--nav-scale));
          --text-xl: calc(1.25rem * var(--nav-scale));
          --text-2xl: calc(1.5rem * var(--nav-scale));
          --text-3xl: calc(1.875rem * var(--nav-scale));
          background-color: ${theme?.bg ? `${theme.bg}e6` : 'rgba(0,0,0,0.85)'} !important;
          backdrop-filter: blur(12px);
          border-color: ${theme?.text}1a !important;
          min-height: var(--nav-height) !important;
          height: auto !important;
        }
        #navbar-root .text-\\[10px\\] { font-size: calc(10px * var(--nav-scale)) !important; }
        #desktop-menu-links {
          gap: var(--nav-gap) !important;
        }
        #desktop-menu button, .nav-link {
          color: var(--color-text) !important;
          opacity: 0.65;
          transition: all 0.3s ease;
        }
        #desktop-menu button:hover, .nav-link:hover { opacity: 1 !important; }
        #desktop-menu button[id^="nav-link-"].text-white, .nav-link.text-white {
          opacity: 1 !important; font-weight: 700 !important;
        }
        ${theme?.websiteFont ? `
          #app-container, #app-container * {
            font-family: "${theme.websiteFont}", sans-serif !important;
          }
        ` : ''}
        ${theme?.colorHeroSlideText ? `
          #home, #home *, #performances-slider-root, #performances-slider-root * { color: var(--color-hero-slide-text) !important; }
          #discover-button { border-color: var(--color-hero-slide-text) !important; }
          #discover-button:hover { border-color: var(--color-hero-slide-text) !important; }
        ` : ''}
      `}</style>

      {/* 1. STICKY NAVBAR */}
      <Navbar currentLang={currentLang} setLang={setLang} user={user} onAdminToggle={() => setIsAdminOpen(true)} theme={theme} scrollToSection={scrollToSection} />

      {/* 2. HERO / HOME SECTION */}
      <HeroSection 
        theme={theme}
        setTheme={setTheme}
        currentLang={currentLang}
        t={t}
        user={user}
        isAdminOpen={false}
        activeEditSection={activeEditSection}
        setActiveEditSection={setActiveEditSection}
        isEditingHeroText={isEditingHeroText}
        setIsEditingHeroText={setIsEditingHeroText}
        scrollToSection={scrollToSection}
        adminMode={adminMode}
        selectedBlock={selectedBlock}
        onBlockSelect={onBlockSelect}
      />

      {/* 2.5 SELECTED PERFORMANCES SLIDER */}
      <section id="performances">
        <SelectedPerformances 
          key={JSON.stringify(theme)}
          currentLang={currentLang} setLang={setLang} slides={slides} user={user}
          theme={theme}
          activeEditSection={activeEditSection} setActiveEditSection={setActiveEditSection}
          onItemsUpdated={(items: any) => setSlides(items)} onRefreshData={() => { if (loadAllData) loadAllData(false); }}
        />
      </section>

      {/* 3. BIOGRAPHY SECTION */}
      <GenericSection id="biography" heading="BIOGRAPHY">
        <BiographySection 
          bio={bio} currentLang={currentLang} setLang={setLang} t={t} user={user}
          onBioUpdated={(b: any) => {
            setBio(b);
            const event = new CustomEvent('bioChanged', { detail: b });
            window.dispatchEvent(event);
            try {
              if (window.parent && window.parent !== window) {
                window.parent.dispatchEvent(new CustomEvent('bioChanged', { detail: b }));
              }
            } catch (e) {
              // Ignore cross-origin errors
            }
          }}
          activeEditSection={activeEditSection} setActiveEditSection={setActiveEditSection}
        />
      </GenericSection>

      {/* 3.5 PRESS REVIEWS SECTION */}
      <GenericSection id="press" heading="PRESS">
        <Reveal delay={0.15}>
          <PressSection 
            items={pressItems} currentLang={currentLang} setLang={setLang} user={user}
            activeEditSection={activeEditSection} setActiveEditSection={setActiveEditSection}
            theme={theme} onThemeUpdated={setTheme}
          />
        </Reveal>
      </GenericSection>

      {/* 4. PORTFOLIO SECTION */}
      <GenericSection id="portfolio" heading="ARCHIVE">
        <Reveal delay={0.15}>
          <PortfolioGallery 
            items={portfolioItems} currentLang={currentLang} setLang={setLang} user={user}
            activeEditSection={activeEditSection} setActiveEditSection={setActiveEditSection}
            onItemsUpdated={(items: any) => setPortfolioItems(items)} onRefreshData={() => { if (loadAllData) loadAllData(false); }}
          />
        </Reveal>
      </GenericSection>

      {/* 5. VIDEOS SECTION */}
      <GenericSection id="videos" heading="PERFORMANCES">
        <Reveal delay={0.15}>
          <VideoPlayer 
            items={videoItems} currentLang={currentLang} setLang={setLang} user={user}
            activeEditSection={activeEditSection} setActiveEditSection={setActiveEditSection}
            onItemsUpdated={(items: any) => setVideoItems(items)} onRefreshData={() => { if (loadAllData) loadAllData(false); }}
          />
        </Reveal>
      </GenericSection>

      {/* 6. SCHEDULE SECTION */}
      <GenericSection id="schedule" heading="UPCOMING">
        <Reveal delay={0.15}>
          <ScheduleSection 
            items={scheduleItems} currentLang={currentLang} setLang={setLang} user={user}
            activeEditSection={activeEditSection} setActiveEditSection={setActiveEditSection}
            onItemsUpdated={(items: any) => setScheduleItems(items)} onRefreshData={() => { if (loadAllData) loadAllData(false); }}
          />
        </Reveal>
      </GenericSection>

      {/* 7. CONTACT SECTION */}
      <GenericSection id="contact" heading="INQUIRIES">
        <ContactSection contact={contact} currentLang={currentLang} t={t} theme={theme} />
      </GenericSection>

      {/* 8. FOOTER */}
      <footer id="main-footer" className="bg-transparent border-t border-black/10 py-12 px-6 text-center text-xs">
        <div className="global-container grid grid-cols-1 md:grid-cols-3 items-center gap-6">
          <div className="space-y-1 text-center md:text-left">
            <h4 className="font-serif text-sm tracking-widest uppercase">{theme?.footerBrandName || t.heroTitle}</h4>
            <p className="text-[10px] tracking-wider opacity-75">{theme?.footerContactEmail || t.footerDesc}</p>
          </div>
          <div className="flex flex-col items-center text-center gap-2 text-[10px] tracking-wider">
            <div>
              {theme?.footerCopyrightText ? theme.footerCopyrightText.replace('{year}', new Date().getFullYear().toString()) : `© ${new Date().getFullYear()} ${theme?.footerBrandName || t.heroTitle}. ${t.footerRights}.`}
            </div>
            <div className="flex items-center space-x-3">
              <button onClick={() => setLegalModal({ isOpen: true, type: 'impressum' })} className="hover:text-[var(--color-text)] transition-colors duration-300 uppercase tracking-widest text-[10px] cursor-pointer">Impressum</button>
              <span className="opacity-30">|</span>
              <button onClick={() => setLegalModal({ isOpen: true, type: 'privacy' })} className="hover:text-[var(--color-text)] transition-colors duration-300 uppercase tracking-widest text-[10px] cursor-pointer">Privacy Policy</button>
            </div>
          </div>
          {!props.isPreviewMode && (
            <button id="admin-lock-btn" onClick={() => setIsAdminOpen(true)} className="justify-self-center md:justify-self-end flex items-center space-x-1.5 hover:text-[var(--color-text)] transition-colors p-2 rounded cursor-pointer" title="Secure Admin Access">
              <Lock className="w-3.5 h-3.5" />
              <span className="text-[9px] uppercase tracking-widest">Secure Access</span>
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
