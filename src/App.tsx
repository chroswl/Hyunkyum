import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronDown, MapPin, Calendar, Mail, Phone, Instagram, Youtube, 
  BookOpen, Trophy, Compass, Star, Lock, Info, ExternalLink
} from 'lucide-react';
import { Language, ScheduleItem, PortfolioItem, VideoItem, ThemeSettings, BiographySettings, ContactSettings, PressItem, PerformanceSlide } from './types';
import { translations } from './translations';
import { 
  auth, 
  fetchSchedule, 
  fetchPortfolio, 
  deleteScheduleItem,
  fetchVideos,
  fetchPress,
  fetchThemeSettings,
  fetchBiographySettings,
  fetchContactSettings,
  fetchSelectedPerformances
} from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

// Component Imports
import Navbar from './components/Navbar';
import PortfolioGallery from './components/PortfolioGallery';
import VideoPlayer from './components/VideoPlayer';
import ScheduleSection from './components/ScheduleSection';
import ContactForm from './components/ContactForm';
import AdminPanel from './components/AdminPanel';
import SelectedPerformances from './components/SelectedPerformances';
import PressSection from './components/PressSection';
import { LegalModal } from './components/LegalModals';
import Reveal from './components/Reveal';

export default function App() {
  const [currentLang, setLang] = useState<Language>('EN');
  const [user, setUser] = useState<User | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [activeTimelineTab, setActiveTimelineTab] = useState<'education' | 'awards' | 'roles' | 'concert'>('education');
  const [legalModal, setLegalModal] = useState<{ isOpen: boolean; type: 'impressum' | 'privacy' }>({ isOpen: false, type: 'impressum' });

  // Database States
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [videoItems, setVideoItems] = useState<VideoItem[]>([]);
  const [pressItems, setPressItems] = useState<PressItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [slides, setSlides] = useState<PerformanceSlide[]>([]);

  // Dynamic CMS States with default placeholders
  const [theme, setTheme] = useState<ThemeSettings>({ bg: '#000000', text: '#ffffff', accent: '#ffffff' });
  const [bio, setBio] = useState<BiographySettings>({
    bioIntro: { EN: '', DE: '', KO: '' },
    bioLong: { EN: '', DE: '', KO: '' }
  });
  const [contact, setContact] = useState<ContactSettings>({
    email: 'info@hyunkyumbaritone.de',
    phone: '+49 (0) 30 1234 5678',
    management: 'Aura Classical Artists Management GmbH, Berlin'
  });

  const t = translations[currentLang];

  useEffect(() => {
    // Listen for Auth changes
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser && firebaseUser.email !== 'chroswl@gmail.com') {
        auth.signOut();
        setUser(null);
      } else {
        setUser(firebaseUser);
      }
    });

    // Load initial Firestore data
    loadAllData();

    // Event listeners for admin settings changes
    const handleThemeChange = (e: any) => {
      if (e.detail) setTheme(e.detail);
    };
    const handleBioChange = (e: any) => {
      if (e.detail) setBio(e.detail);
    };
    const handleContactChange = (e: any) => {
      if (e.detail) setContact(e.detail);
    };

    window.addEventListener('themeChanged', handleThemeChange);
    window.addEventListener('bioChanged', handleBioChange);
    window.addEventListener('contactChanged', handleContactChange);

    return () => {
      unsubscribe();
      window.removeEventListener('themeChanged', handleThemeChange);
      window.removeEventListener('bioChanged', handleBioChange);
      window.removeEventListener('contactChanged', handleContactChange);
    };
  }, []);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [sch, port, vids, press, themeData, bioData, contactData, sld] = await Promise.all([
        fetchSchedule(),
        fetchPortfolio(),
        fetchVideos(),
        fetchPress(),
        fetchThemeSettings(),
        fetchBiographySettings(),
        fetchContactSettings(),
        fetchSelectedPerformances()
      ]);
      setScheduleItems(sch);
      setPortfolioItems(port);
      setVideoItems(vids);
      setPressItems(press);
      setTheme(themeData);
      setBio(bioData);
      setContact(contactData);
      setSlides(sld);
    } catch (error) {
      console.error("Error loading database content:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    try {
      await deleteScheduleItem(id);
      loadAllData();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleEditSchedule = (item: ScheduleItem) => {
    setIsAdminOpen(true);
    // The editing item will be set inside the Admin Panel
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const offsetPosition = element.offsetTop - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  // Timeline category definitions
  const timelineTabs = [
    { id: 'education', label: t.eduTitle, icon: <BookOpen className="w-4 h-4" /> },
    { id: 'awards', label: t.awardsTitle, icon: <Trophy className="w-4 h-4" /> },
    { id: 'roles', label: t.rolesTitle, icon: <Compass className="w-4 h-4" /> },
    { id: 'concert', label: t.concertTitle, icon: <Star className="w-4 h-4" /> }
  ];

  return (
    <div id="app-container" className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black" style={{ backgroundColor: theme.bg, color: theme.text }}>
      {/* Dynamic Theme Color Injection overrides */}
      <style>{`
        :root {
          --color-bg: ${theme.bg};
          --color-text: ${theme.text};
          --color-accent: ${theme.accent};
        }
        body, html, #app-container, #biography, #contact, #videos, #main-footer, #navbar-root, #press, #portfolio, #schedule {
          background-color: ${theme.bg} !important;
          color: ${theme.text} !important;
        }
        .accent-color {
          color: ${theme.accent} !important;
        }
        .accent-bg {
          background-color: ${theme.accent} !important;
        }
        .accent-border {
          border-color: ${theme.accent} !important;
        }
        .accent-hover-bg:hover {
          background-color: ${theme.accent} !important;
          color: ${theme.bg} !important;
        }
        .accent-hover-text:hover {
          color: ${theme.accent} !important;
        }
        .accent-hover-border:hover {
          border-color: ${theme.accent} !important;
        }
        ::selection {
          background-color: ${theme.accent} !important;
          color: ${theme.bg} !important;
        }
        /* Custom scrollbars */
        ::-webkit-scrollbar-thumb {
          background: ${theme.accent}80 !important;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: ${theme.accent} !important;
        }
      `}</style>

      {/* 1. STICKY NAVBAR */}
      <Navbar 
        currentLang={currentLang} 
        setLang={setLang} 
        user={user}
        onAdminToggle={() => setIsAdminOpen(true)}
      />

      {/* 2. HERO / HOME SECTION */}
      <section 
        id="home" 
        className="relative h-screen flex items-center justify-center overflow-hidden"
      >
        {/* Background opera stage image or video */}
        {theme.homeBgType === 'video' ? (
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover animate-kenburns pointer-events-none"
            src={theme.homeBg}
            onCanPlay={(e) => {
              e.currentTarget.play().catch((err) => {
                console.log("Home video autoplay prevented:", err);
              });
            }}
          />
        ) : theme.homeBgType === 'youtube' ? (
          <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
            <iframe
              className="absolute top-1/2 left-1/2 w-[300vw] h-[300vh] min-w-[100vw] min-h-[100vh] -translate-x-1/2 -translate-y-1/2 opacity-70 pointer-events-none"
              src={`https://www.youtube.com/embed/${(() => {
                const match = theme.homeBg?.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
                return match ? match[1] : '';
              })()}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&loop=1&iv_load_policy=3&modestbranding=1&disablekb=1&fs=0&enablejsapi=1&playsinline=1&playlist=${(() => {
                const match = theme.homeBg?.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
                return match ? match[1] : '';
              })()}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div 
            id="hero-bg"
            className="absolute inset-0 bg-cover bg-center animate-kenburns"
            style={{ 
              backgroundImage: `url('${theme.homeBg || '/src/assets/images/opera_stage_1783548365279.jpg'}')` 
            }}
          />
        )}
        {/* Dark classic curtain gradient overlay */}
        <div id="hero-overlay" className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/45 to-black" />

        {/* Hero Content */}
        <div id="hero-content" className="relative z-10 text-center px-6 max-w-4xl space-y-6">
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="text-white font-sans text-xs md:text-sm tracking-[0.4em] uppercase font-semibold"
          >
            {t.heroSubtitle}
          </motion.p>
          
          <motion.h1 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.2 }}
            className="text-4xl sm:text-6xl md:text-8xl font-serif font-light text-white tracking-[0.1em] uppercase leading-none"
          >
            {t.heroTitle}
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="text-neutral-300 font-sans text-xs sm:text-sm md:text-base tracking-[0.2em] font-light max-w-xl mx-auto uppercase pt-6"
          >
            {t.heroDescription}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="pt-8"
          >
            <button
              id="discover-button"
              onClick={() => scrollToSection('biography')}
              className="group px-8 py-3.5 border border-white/20 text-white hover:text-black hover:bg-white font-sans text-xs tracking-[0.25em] uppercase rounded-sm transition-all duration-500 flex items-center space-x-2 mx-auto cursor-pointer"
            >
              <span>{t.discoverBtn}</span>
              <ChevronDown className="w-4 h-4 transform group-hover:translate-y-1 transition-transform text-white group-hover:text-black" />
            </button>
          </motion.div>
        </div>

        {/* Scroll helper */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 flex flex-col items-center animate-scroll-elegant select-none pointer-events-none">
          <span className="text-[10px] tracking-[0.5em] uppercase text-white font-light mb-2">
            SCROLL
          </span>
          <div className="w-[1px] h-10 bg-white/60" />
        </div>
      </section>

      {/* 2.5 SELECTED PERFORMANCES SLIDER */}
      <SelectedPerformances currentLang={currentLang} slides={slides} />

      {/* 3. BIOGRAPHY SECTION */}
      <section 
        id="biography" 
        className="page-section bg-black"
      >
        <div className="max-w-7xl mx-auto space-y-8 md:space-y-10">
          <Reveal>
            <div className="text-center">
              <h2 className="text-xl md:text-3xl font-serif font-light text-white uppercase tracking-[0.25em] leading-none">
                BIOGRAPHY
              </h2>
            </div>
          </Reveal>

          <div id="bio-grid" className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            
            {/* Left: Artistic Portrait Photo (5 cols) */}
            <div id="bio-image-col" className="lg:col-span-5 relative group">
              <Reveal delay={0.15}>
                <div className="absolute -inset-1.5 bg-gradient-to-r from-white/10 to-transparent rounded-sm blur-md opacity-30 group-hover:opacity-45 transition-all duration-700" />
                <div className="relative border border-neutral-900 rounded-sm overflow-hidden bg-neutral-950">
                  <img 
                    src={bio.bioImage || "/src/assets/images/hyunkyum_portrait_1783548337837.jpg"} 
                    alt="Portrait of Baritone Hyunkyum Kim" 
                    className="w-full h-auto object-cover aspect-[3/4] filter grayscale-[15%] hover:grayscale-0 transition-all duration-1000 scale-100 hover:scale-[1.02]"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                </div>
              </Reveal>
            </div>

            {/* Right: Narrative Bio & Tabbed Timeline (7 cols) */}
            <div id="bio-text-col" className="lg:col-span-7 space-y-8">
              <Reveal delay={0.25}>
                <div className="space-y-5 font-sans text-neutral-300 text-sm md:text-base leading-relaxed font-light">
                  <p className="font-medium text-white text-base md:text-lg leading-relaxed">
                    {bio.bioIntro[currentLang] || t.bioIntro}
                  </p>
                  <p className="whitespace-pre-line">
                    {bio.bioLong[currentLang] || t.bioLong}
                  </p>
                </div>
              </Reveal>

              <Reveal delay={0.35}>
                {/* Timelines tab navigation */}
                <div id="timeline-tabs-container" className="space-y-6 pt-4">
                  <div className="flex flex-wrap border-b border-neutral-900 pb-2 gap-1">
                    {timelineTabs.map((tab) => (
                      <button
                        key={tab.id}
                        id={`timeline-tab-btn-${tab.id}`}
                        onClick={() => setActiveTimelineTab(tab.id as any)}
                        className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-sans tracking-wider uppercase transition-all rounded-sm cursor-pointer ${
                          activeTimelineTab === tab.id
                            ? 'text-white font-bold bg-neutral-950 border border-neutral-900 border-b-transparent -mb-[9px] relative z-10'
                            : 'text-neutral-500 hover:text-white hover:bg-neutral-950/20'
                        }`}
                      >
                        {tab.icon}
                        <span>{tab.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Timeline Items lists */}
                  <div id="timeline-content-area" className="bg-neutral-950/30 p-6 rounded-sm border border-neutral-950/80 min-h-[160px]">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeTimelineTab}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-5"
                      >
                        {t.timeline[activeTimelineTab].map((item: any, idx: number) => (
                          <div key={idx} className="flex items-start space-x-4 group">
                            <div className="text-white font-serif font-medium text-sm md:text-base tracking-wide whitespace-nowrap min-w-[100px] pt-0.5">
                              {item.year}
                            </div>
                            <div className="h-4 w-[1px] bg-neutral-800 self-center hidden sm:block" />
                            <div className="text-neutral-400 group-hover:text-white transition-colors text-xs md:text-sm font-sans leading-relaxed">
                              {currentLang === 'KO' ? item.textKO : currentLang === 'DE' ? item.textDE : item.textEN}
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              </Reveal>

            </div>
          </div>
        </div>
      </section>

      {/* 3.5 PRESS REVIEWS SECTION */}
      <section 
        id="press" 
        className="page-section bg-black"
      >
        <div className="max-w-7xl mx-auto space-y-8 md:space-y-10">
          <Reveal>
            <div className="text-center">
              <h2 className="text-xl md:text-3xl font-serif font-light text-white uppercase tracking-[0.25em] leading-none">
                PRESS
              </h2>
            </div>
          </Reveal>

          <Reveal delay={0.15}>
            <PressSection currentLang={currentLang} />
          </Reveal>
        </div>
      </section>

      {/* 4. PORTFOLIO SECTION */}
      <section 
        id="portfolio" 
        className="page-section bg-neutral-980/30"
      >
        <div className="max-w-7xl mx-auto space-y-8 md:space-y-10">
          <Reveal>
            <div className="text-center">
              <h2 className="text-xl md:text-3xl font-serif font-light text-white uppercase tracking-[0.25em] leading-none">
                ARCHIVE
              </h2>
            </div>
          </Reveal>

          <Reveal delay={0.15}>
            <PortfolioGallery 
              items={portfolioItems} 
              currentLang={currentLang} 
            />
          </Reveal>
        </div>
      </section>

      {/* 5. VIDEOS SECTION */}
      <section 
        id="videos" 
        className="page-section bg-black"
      >
        <div className="max-w-7xl mx-auto space-y-8 md:space-y-10">
          <Reveal>
            <div className="text-center -mt-4 md:-mt-8">
              <h2 className="text-xl md:text-3xl font-serif font-light text-white uppercase tracking-[0.25em] leading-none">
                PERFORMANCES
              </h2>
            </div>
          </Reveal>

          <Reveal delay={0.15}>
            <VideoPlayer 
              items={videoItems} 
              currentLang={currentLang} 
            />
          </Reveal>
        </div>
      </section>

      {/* 6. SCHEDULE SECTION */}
      <section 
        id="schedule" 
        className="page-section bg-neutral-980/30"
      >
        <div className="max-w-4xl mx-auto space-y-8 md:space-y-10">
          <Reveal>
            <div className="text-center">
              <h2 className="text-xl md:text-3xl font-serif font-light text-white uppercase tracking-[0.25em] leading-none">
                UPCOMING
              </h2>
            </div>
          </Reveal>

          {/* Schedule List */}
          <Reveal delay={0.15}>
            <ScheduleSection 
              items={scheduleItems} 
              currentLang={currentLang} 
              user={user} 
              onEditItem={handleEditSchedule} 
              onDeleteItem={handleDeleteSchedule} 
            />
          </Reveal>
        </div>
      </section>

      {/* 7. CONTACT SECTION */}
      <section 
        id="contact" 
        className="page-section bg-black"
      >
        <div className="max-w-7xl mx-auto space-y-8 md:space-y-10">
          <Reveal>
            <div className="text-center">
              <h2 className="text-xl md:text-3xl font-serif font-light text-white uppercase tracking-[0.25em] leading-none">
                INQUIRIES
              </h2>
            </div>
          </Reveal>

          <div id="contact-grid" className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
            
            {/* Left Col: Contact Info details (5 cols) */}
            <div id="contact-info-col" className="lg:col-span-5 space-y-8 py-2">
              <Reveal delay={0.15}>
                <div className="space-y-2">
                  <h3 className="text-[11px] md:text-xs text-[#A0A0A0] tracking-[0.18em] uppercase font-sans font-medium">
                    CONNECT
                  </h3>
                  <p className="text-sm md:text-base text-neutral-200 font-sans leading-relaxed font-light">
                    Always open to new stages and conversations. Reach out directly via email or use the form below.
                  </p>
                </div>

                <div className="h-[1px] bg-neutral-900" />

                {/* Info Rows - Centering around Email with larger, elegant font */}
                <div className="space-y-2">
                  <span className="text-[10px] tracking-[0.25em] text-neutral-500 uppercase block font-sans">
                    {t.email}
                  </span>
                  <a 
                    href={`mailto:${contact.email || 'info@hyunkyumbaritone.de'}`} 
                    className="text-[17px] font-serif font-light text-neutral-200 hover:text-white transition-colors duration-300 break-all"
                  >
                    {contact.email || 'info@hyunkyumbaritone.de'}
                  </a>
                </div>

                <div className="h-[1px] bg-neutral-900" />

                {/* Social Channels */}
                <div className="space-y-4">
                  <span className="text-[10px] tracking-[0.25em] text-neutral-500 uppercase block font-sans">
                    Social Channels
                  </span>
                  <div className="flex space-x-3">
                    <a 
                      href="https://instagram.com" 
                      target="_blank" 
                      rel="noreferrer" 
                      className="w-11 h-11 rounded-sm border border-neutral-900 flex items-center justify-center text-neutral-400 hover:text-white hover:border-neutral-700 hover:bg-neutral-950 transition-all cursor-pointer"
                      title={t.instagram}
                    >
                      <Instagram className="w-4 h-4" />
                    </a>
                    <a 
                      href="https://youtube.com" 
                      target="_blank" 
                      rel="noreferrer" 
                      className="w-11 h-11 rounded-sm border border-neutral-900 flex items-center justify-center text-neutral-400 hover:text-white hover:border-neutral-700 hover:bg-neutral-950 transition-all cursor-pointer"
                      title={t.youtube}
                    >
                      <Youtube className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </Reveal>
            </div>

            {/* Right Col: Contact Form (7 cols) */}
            <div id="contact-form-col" className="lg:col-span-7">
              <Reveal delay={0.25}>
                <ContactForm currentLang={currentLang} />
              </Reveal>
            </div>

          </div>
        </div>
      </section>

      {/* 8. FOOTER */}
      <footer id="main-footer" className="bg-black border-t border-neutral-950 py-12 px-6 text-center text-neutral-600 text-xs">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 items-center gap-6">
          <div className="space-y-1 text-center md:text-left">
            <h4 className="font-serif text-sm tracking-widest text-neutral-400 uppercase">
              {t.heroTitle}
            </h4>
            <p className="text-[10px] tracking-wider">
              {t.footerDesc}
            </p>
          </div>

          <div className="flex flex-col items-center text-center gap-2 text-[10px] tracking-wider text-neutral-500">
            <div>
              &copy; {new Date().getFullYear()} {t.heroTitle}. {t.footerRights}.
            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => setLegalModal({ isOpen: true, type: 'impressum' })}
                className="text-neutral-500 hover:text-neutral-300 transition-colors duration-300 uppercase tracking-widest text-[10px] cursor-pointer"
              >
                Impressum
              </button>
              <span className="text-neutral-800">|</span>
              <button 
                onClick={() => setLegalModal({ isOpen: true, type: 'privacy' })}
                className="text-neutral-500 hover:text-neutral-300 transition-colors duration-300 uppercase tracking-widest text-[10px] cursor-pointer"
              >
                Privacy Policy
              </button>
            </div>
          </div>

          {/* Secure Admin door lock icon */}
          <button
            id="admin-lock-btn"
            onClick={() => setIsAdminOpen(true)}
            className="justify-self-center md:justify-self-end flex items-center space-x-1.5 text-neutral-700 hover:text-white transition-colors p-2 rounded cursor-pointer"
            title="Secure Admin Access"
          >
            <Lock className="w-3.5 h-3.5" />
            <span className="text-[9px] uppercase tracking-widest">Secure Access</span>
          </button>
        </div>
      </footer>

      {/* 9. FIREBASE DRAWER ADMIN MANAGEMENT PANEL */}
      <AnimatePresence>
        {isAdminOpen && (
          <AdminPanel
            currentLang={currentLang}
            isOpen={isAdminOpen}
            onClose={() => setIsAdminOpen(false)}
            user={user}
            scheduleItems={scheduleItems}
            portfolioItems={portfolioItems}
            refreshData={loadAllData}
          />
        )}
        {legalModal.isOpen && (
          <LegalModal
            isOpen={legalModal.isOpen}
            type={legalModal.type}
            currentLang={currentLang}
            onClose={() => setLegalModal(prev => ({ ...prev, isOpen: false }))}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
