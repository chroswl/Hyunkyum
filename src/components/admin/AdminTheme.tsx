import React, { useState, useEffect } from 'react';
import type { Language, ThemeSettings } from '../../types';
import { 
  fetchThemeSettings, 
  saveThemeSettings,
  fetchSchedule, 
  fetchPortfolio, 
  fetchVideos, 
  fetchPress, 
  fetchBiographySettings, 
  fetchContactSettings, 
  fetchSelectedPerformances
} from '../../firebase';
import AdminLayout from './AdminLayout';
import PropertyAccordion from './PropertyAccordion';
import { PropertyColorPicker } from './PropertyFields';
import HeroSection from '../HeroSection';
import Navbar from '../Navbar';
import SelectedPerformances from '../SelectedPerformances';
import BiographySection from '../BiographySection';
import PressSection from '../PressSection';
import PortfolioGallery from '../PortfolioGallery';
import VideoPlayer from '../VideoPlayer';
import ScheduleSection from '../ScheduleSection';
import ContactSection from '../ContactSection';
import Reveal from '../Reveal';
import { translations } from '../../translations';
import { Monitor, Tablet, Smartphone, Instagram, Youtube, Facebook, Twitter, Lock } from 'lucide-react';
import { useAppearance } from '../../contexts/AppearanceContext';

export default function AdminTheme({ currentLang, onRefreshData }: { currentLang: Language; onRefreshData?: () => void }) {
  const { theme, setTheme } = useAppearance();
  const [initialTheme, setInitialTheme] = useState<ThemeSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Viewport responsive preview size state
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  // Live mirroring section data states
  const [scheduleItems, setScheduleItems] = useState<any[]>([]);
  const [portfolioItems, setPortfolioItems] = useState<any[]>([]);
  const [videoItems, setVideoItems] = useState<any[]>([]);
  const [pressItems, setPressItems] = useState<any[]>([]);
  const [slides, setSlides] = useState<any[]>([]);
  const [bio, setBio] = useState<any>({
    bioIntro: { EN: '', DE: '', KO: '' },
    bioLong: { EN: '', DE: '', KO: '' }
  });
  const [contact, setContact] = useState<any>({
    email: 'info@hyunkyumbaritone.de',
    phone: '+49 (0) 30 1234 5678',
    management: 'Aura Classical Artists Management GmbH, Berlin'
  });
  const [isPreviewLoading, setIsPreviewLoading] = useState(true);

  useEffect(() => {
    // 1. Fetch initial theme for reset/compare
    fetchThemeSettings().then(data => {
      setInitialTheme(data);
    });

    // 2. Fetch all other sections for live mirroring
    setIsPreviewLoading(true);
    Promise.all([
      fetchSchedule(),
      fetchPortfolio(),
      fetchVideos(),
      fetchPress(),
      fetchBiographySettings(),
      fetchContactSettings(),
      fetchSelectedPerformances()
    ]).then(([sch, port, vids, press, bioData, contactData, sld]) => {
      setScheduleItems(sch);
      setPortfolioItems(port);
      setVideoItems(vids);
      setPressItems(press);
      setBio(bioData);
      setContact(contactData);
      setSlides(sld);
      setIsPreviewLoading(false);
    }).catch(err => {
      console.error("Preview data load failed:", err);
      setIsPreviewLoading(false);
    });
  }, []);

  if (!theme) {
    return (
      <div className="p-8 text-neutral-500 animate-pulse flex items-center space-x-3">
        <div className="w-4 h-4 border-2 border-t-transparent border-[#C9A227] rounded-full animate-spin"></div>
        <span>Loading Theme Editor...</span>
      </div>
    );
  }

  const hasChanges = JSON.stringify(theme) !== JSON.stringify(initialTheme);

  const handleSave = async () => {
    setIsSaving(true);
    await saveThemeSettings(theme);
    setInitialTheme(theme);
    if (onRefreshData) onRefreshData();
    setIsSaving(false);
  };

  const handleReset = () => {
    if (initialTheme) setTheme(initialTheme);
  };

  const updateField = (key: keyof ThemeSettings, val: any) => {
    if (!theme) return;
    const next = { ...theme, [key]: val };
    setTheme(next);
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: next }));
  };

  // Google Font Import String generator for the scoped preview
  const getGoogleFontImport = () => {
    const fontsToLoad = [
      theme.fontSans,
      theme.fontSerif,
      theme.fontMono,
      theme.fontNavbar
    ].filter(Boolean) as string[];
    
    const systemFonts = ['Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Georgia', 'serif', 'sans-serif', 'monospace', 'system-ui', 'inherit'];
    const uniqueGoogleFonts = Array.from(new Set(fontsToLoad))
      .filter(f => f && !systemFonts.includes(f));
    
    if (uniqueGoogleFonts.length === 0) return '';
    
    const fontParams = uniqueGoogleFonts
      .map(f => `family=${f.replace(/\s+/g, '+')}:wght@300;400;500;600;700`)
      .join('&');
    
    return `@import url('https://fonts.googleapis.com/css2?${fontParams}&display=swap');`;
  };

  const toolbar = (
    <div className="flex items-center space-x-2 bg-neutral-900 border border-neutral-800 p-0.5 rounded-md shrink-0">
      <button
        onClick={() => setViewport('desktop')}
        className={`px-3 py-1 rounded text-[10px] tracking-wider uppercase font-medium transition-all flex items-center space-x-1.5 cursor-pointer ${viewport === 'desktop' ? 'bg-[#C9A227] text-black font-semibold' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'}`}
        title="Desktop / Current Screen Size"
      >
        <Monitor className="w-3 h-3" />
        <span className="hidden sm:inline">Current Screen Size</span>
      </button>
      <button
        onClick={() => setViewport('tablet')}
        className={`px-3 py-1 rounded text-[10px] tracking-wider uppercase font-medium transition-all flex items-center space-x-1.5 cursor-pointer ${viewport === 'tablet' ? 'bg-[#C9A227] text-black font-semibold' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'}`}
        title="Tablet (768px)"
      >
        <Tablet className="w-3 h-3" />
        <span className="hidden sm:inline">Tablet</span>
      </button>
      <button
        onClick={() => setViewport('mobile')}
        className={`px-3 py-1 rounded text-[10px] tracking-wider uppercase font-medium transition-all flex items-center space-x-1.5 cursor-pointer ${viewport === 'mobile' ? 'bg-[#C9A227] text-black font-semibold' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'}`}
        title="Mobile (375px)"
      >
        <Smartphone className="w-3 h-3" />
        <span className="hidden sm:inline">Mobile</span>
      </button>
    </div>
  );

  const properties = (
    <div className="pb-20">
      <PropertyAccordion title="기본 테마 색상 (Base Colors)" defaultOpen>
        <div className="space-y-4">
          <PropertyColorPicker 
            label="배경 색상 (Background)" 
            value={theme.bg || '#000000'} 
            onChange={(v) => updateField('bg', v)} 
          />
          <PropertyColorPicker 
            label="기본 글씨 색상 (Text)" 
            value={theme.text || '#ffffff'} 
            onChange={(v) => updateField('text', v)} 
          />
          <PropertyColorPicker 
            label="악센트 색상 (Accent)" 
            value={theme.accent || '#C9A227'} 
            onChange={(v) => updateField('accent', v)} 
          />
        </div>
      </PropertyAccordion>

      <PropertyAccordion title="섹션별 글씨 색상 개별 설정 (Section Text Overrides)">
        <div className="space-y-4">
          <PropertyColorPicker 
            label="히어로 및 슬라이드 글씨 (Hero & Slides Text)" 
            value={theme.colorHeroSlideText || '#ffffff'} 
            onChange={(v) => updateField('colorHeroSlideText', v)} 
          />
        </div>
      </PropertyAccordion>
    </div>
  );

  return (
    <AdminLayout 
      title="테마 설정 (Theme)"
      hasChanges={hasChanges}
      isSaving={isSaving}
      onSave={handleSave}
      onReset={handleReset}
      toolbar={toolbar}
      preview={
        <div className={`transition-all duration-300 h-full mx-auto relative flex flex-col bg-black overflow-hidden ${
          viewport === 'desktop' ? 'w-full' :
          viewport === 'tablet' ? 'w-[768px] max-w-full border-x border-neutral-800 ring-4 ring-neutral-900/50 rounded-md' :
          'w-[375px] max-w-full border-x border-neutral-800 ring-4 ring-neutral-900/50 rounded-md'
        }`}>
          {/* Indicator badge for viewport */}
          <div className="absolute top-4 right-4 z-[200] bg-black/80 border border-neutral-800 text-[9px] font-mono uppercase tracking-widest text-neutral-400 px-2 py-0.5 rounded backdrop-blur-sm pointer-events-none select-none">
            {viewport === 'desktop' ? 'Desktop' : viewport === 'tablet' ? 'Tablet (768px)' : 'Mobile (375px)'}
          </div>

          {isPreviewLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-neutral-500 space-y-3 bg-black">
              <div className="w-8 h-8 border-2 border-[#C9A227] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs tracking-widest uppercase">Loading Full Preview...</span>
            </div>
          ) : (
            <div id="theme-preview-scope" className="w-full h-full overflow-y-auto bg-black custom-scrollbar selection:bg-white selection:text-black scroll-smooth">
              <style key={JSON.stringify(theme)}>{`
                ${getGoogleFontImport()}
                #theme-preview-scope {
                  --color-bg: ${theme.bg};
                  --color-text: ${theme.text};
                  --color-accent: ${theme.accent};
                  --color-contact-bg: ${theme.contactFormBg || '#0a0a0a'};
                }
                #theme-preview-scope, #theme-preview-scope * {
                  color: var(--color-text) !important;
                }
                #theme-preview-scope #preview-biography,
                #theme-preview-scope #preview-press,
                #theme-preview-scope #preview-portfolio,
                #theme-preview-scope #preview-videos,
                #theme-preview-scope #preview-schedule,
                #theme-preview-scope #preview-contact,
                #theme-preview-scope #preview-footer {
                  background-color: var(--color-bg) !important;
                }
                #theme-preview-scope #navbar-root {
                  background-color: ${theme.bg ? `${theme.bg}e6` : 'rgba(0,0,0,0.85)'} !important;
                  backdrop-filter: blur(12px);
                  border-color: ${theme.text}1a !important;
                }
                #theme-preview-scope #desktop-menu button, #theme-preview-scope .nav-link {
                  color: var(--color-text) !important;
                  opacity: 0.65;
                  transition: all 0.3s ease;
                }
                #theme-preview-scope #desktop-menu button:hover, #theme-preview-scope .nav-link:hover {
                  opacity: 1 !important;
                }
                #theme-preview-scope #desktop-menu button[id^="nav-link-"].text-white, #theme-preview-scope .nav-link.text-white {
                  opacity: 1 !important;
                  font-weight: 700 !important;
                }
                ${theme.fontSans ? `
                  #theme-preview-scope, 
                  #theme-preview-scope * { 
                    font-family: "${theme.fontSans}", sans-serif !important; 
                  }
                ` : ''}
                ${theme.colorHeroSlideText ? `
                  #theme-preview-scope #home,
                  #theme-preview-scope #home * {
                    color: ${theme.colorHeroSlideText} !important;
                  }
                  #theme-preview-scope #discover-button {
                    border-color: ${theme.colorHeroSlideText}4d !important;
                  }
                  #theme-preview-scope #discover-button:hover {
                    background-color: ${theme.colorHeroSlideText} !important;
                    color: ${theme.bg || '#000000'} !important;
                  }
                ` : ''}
                #theme-preview-scope .accent-color {
                  color: var(--color-accent) !important;
                }
                #theme-preview-scope .accent-bg {
                  background-color: var(--color-accent) !important;
                }
                #theme-preview-scope .accent-border {
                  border-color: var(--color-accent) !important;
                }
                #theme-preview-scope .accent-hover-bg:hover {
                  background-color: var(--color-accent) !important;
                  color: var(--color-bg) !important;
                }
                #theme-preview-scope .accent-hover-text:hover {
                  color: var(--color-accent) !important;
                }
                #theme-preview-scope .accent-hover-border:hover {
                  border-color: var(--color-accent) !important;
                }
              `}</style>

              <div className="relative min-h-screen">
                {/* 2. HERO / HOME SECTION */}
                <HeroSection 
                  theme={theme}
                  setTheme={setTheme as any}
                  currentLang={currentLang}
                  t={translations[currentLang]}
                  user={null}
                  isAdminOpen={true}
                  activeEditSection="none"
                  setActiveEditSection={() => {}}
                  isEditingHeroText={false}
                  setIsEditingHeroText={() => {}}
                  scrollToSection={(id) => {
                    const el = document.getElementById(`preview-${id}`);
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                />

                {/* 2.5 SELECTED PERFORMANCES SLIDER */}
                <div id="preview-performances">
                  <SelectedPerformances 
                    currentLang={currentLang} 
                    setLang={() => {}}
                    slides={slides} 
                    user={null}
                    activeEditSection="none"
                    setActiveEditSection={() => {}}
                    onItemsUpdated={() => {}}
                    onRefreshData={() => {}}
                  />
                </div>

                {/* 3. BIOGRAPHY SECTION */}
                <div id="preview-biography">
                  <BiographySection 
                    bio={bio}
                    currentLang={currentLang}
                    setLang={() => {}}
                    t={translations[currentLang]}
                    user={null}
                    onBioUpdated={() => {}}
                    activeEditSection="none"
                    setActiveEditSection={() => {}}
                  />
                </div>

                {/* 3.5 PRESS REVIEWS SECTION */}
                <section id="preview-press" className="page-section bg-transparent p-12 md:p-20">
                  <div className="max-w-7xl mx-auto space-y-8">
                    <Reveal>
                      <div className="text-center">
                        <h2 className="text-xl md:text-3xl font-serif font-light uppercase tracking-[0.25em] leading-none">
                          PRESS
                        </h2>
                      </div>
                    </Reveal>
                    <Reveal delay={0.15}>
                      <PressSection 
                        items={pressItems}
                        currentLang={currentLang} 
                        setLang={() => {}} 
                        user={null} 
                        activeEditSection="none"
                        setActiveEditSection={() => {}}
                        theme={theme}
                        onThemeUpdated={() => {}}
                      />
                    </Reveal>
                  </div>
                </section>

                {/* 4. PORTFOLIO SECTION */}
                <section id="preview-portfolio" className="page-section bg-transparent/5/30 p-12 md:p-20">
                  <div className="max-w-7xl mx-auto space-y-8">
                    <Reveal>
                      <div className="text-center">
                        <h2 className="text-xl md:text-3xl font-serif font-light uppercase tracking-[0.25em] leading-none">
                          ARCHIVE
                        </h2>
                      </div>
                    </Reveal>
                    <Reveal delay={0.15}>
                      <PortfolioGallery 
                        items={portfolioItems} 
                        currentLang={currentLang} 
                        setLang={() => {}}
                        user={null}
                        activeEditSection="none"
                        setActiveEditSection={() => {}}
                        onItemsUpdated={() => {}}
                        onRefreshData={() => {}}
                      />
                    </Reveal>
                  </div>
                </section>

                {/* 5. VIDEOS SECTION */}
                <section id="preview-videos" className="page-section bg-transparent p-12 md:p-20">
                  <div className="max-w-7xl mx-auto space-y-8">
                    <Reveal>
                      <div className="text-center">
                        <h2 className="text-xl md:text-3xl font-serif font-light uppercase tracking-[0.25em] leading-none">
                          PERFORMANCES
                        </h2>
                      </div>
                    </Reveal>
                    <Reveal delay={0.15}>
                      <VideoPlayer 
                        items={videoItems} 
                        currentLang={currentLang} 
                        setLang={() => {}}
                        user={null}
                        activeEditSection="none"
                        setActiveEditSection={() => {}}
                        onItemsUpdated={() => {}}
                        onRefreshData={() => {}}
                      />
                    </Reveal>
                  </div>
                </section>

                {/* 6. SCHEDULE SECTION */}
                <section id="preview-schedule" className="page-section bg-transparent/5/30 p-12 md:p-20">
                  <div className="max-w-4xl mx-auto space-y-8">
                    <Reveal>
                      <div className="text-center">
                        <h2 className="text-xl md:text-3xl font-serif font-light uppercase tracking-[0.25em] leading-none">
                          UPCOMING
                        </h2>
                      </div>
                    </Reveal>
                    <Reveal delay={0.15}>
                      <ScheduleSection 
                        items={scheduleItems} 
                        currentLang={currentLang} 
                        setLang={() => {}}
                        user={null} 
                        activeEditSection="none"
                        setActiveEditSection={() => {}}
                        onItemsUpdated={() => {}}
                        onRefreshData={() => {}}
                      />
                    </Reveal>
                  </div>
                </section>

                {/* 7. CONTACT SECTION */}
                <div id="preview-contact">
                  <ContactSection 
                    contact={contact}
                    currentLang={currentLang}
                    t={translations[currentLang]}
                  />
                </div>

                {/* 8. FOOTER */}
                <footer id="preview-footer" className="bg-transparent border-t border-black/10 py-12 px-6 text-center text-xs">
                  <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 items-center gap-6">
                    <div className="space-y-1 text-center md:text-left">
                      <h4 className="font-serif text-sm tracking-widest uppercase">
                        {theme?.footerBrandName || translations[currentLang].heroTitle}
                      </h4>
                      <p className="text-[10px] tracking-wider opacity-75">
                        {theme?.footerContactEmail || translations[currentLang].footerDesc}
                      </p>
                      <div className="flex items-center space-x-3 justify-center md:justify-start pt-1.5">
                        {theme?.footerSocialInstagram && (
                          <a href={theme.footerSocialInstagram} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--color-accent)] transition-colors">
                            <Instagram className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {theme?.footerSocialYoutube && (
                          <a href={theme.footerSocialYoutube} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--color-accent)] transition-colors">
                            <Youtube className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {theme?.footerSocialFacebook && (
                          <a href={theme.footerSocialFacebook} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--color-accent)] transition-colors">
                            <Facebook className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {theme?.footerSocialTwitter && (
                          <a href={theme.footerSocialTwitter} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--color-accent)] transition-colors">
                            <Twitter className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-center text-center gap-2 text-[10px] tracking-wider">
                      <div>
                        {theme?.footerCopyrightText ? (
                          theme.footerCopyrightText.replace('{year}', new Date().getFullYear().toString())
                        ) : (
                          `© ${new Date().getFullYear()} ${theme?.footerBrandName || translations[currentLang].heroTitle}. All rights reserved.`
                        )}
                      </div>
                    </div>

                    <div className="justify-self-center md:justify-self-end flex items-center space-x-1.5 opacity-50 p-2 rounded">
                      <Lock className="w-3.5 h-3.5" />
                      <span className="text-[9px] uppercase tracking-widest">Secure Access</span>
                    </div>
                  </div>
                </footer>
              </div>
            </div>
          )}
        </div>
      }
      properties={properties}
    />
  );
}

