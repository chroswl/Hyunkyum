import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
 ChevronDown, ChevronUp, MapPin, Calendar, Mail, Phone, Instagram, Youtube, 
 Lock, Info, ExternalLink,
 Sliders, AlignCenter, AlignLeft, AlignRight, Save, Edit3, X, Facebook, Twitter
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
 fetchSelectedPerformances,
 saveThemeSettings
} from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

// Component Imports
import Navbar from './components/Navbar';
import PortfolioGallery from './components/PortfolioGallery';
import VideoPlayer from './components/VideoPlayer';
import ScheduleSection from './components/ScheduleSection';
import ContactSection from './components/ContactSection';
import AdminPanel from './components/AdminPanel';
import BiographySection from './components/BiographySection';
import SelectedPerformances from './components/SelectedPerformances';
import PressSection from './components/PressSection';
import { LegalModal } from './components/LegalModals';
import Reveal from './components/Reveal';
import HeroEditorPanel from './components/HeroEditorPanel';
import { getMediaSource } from './lib/mediaUtils';

const getInitialLang = (): Language => {
  try {
    const saved = localStorage.getItem('preferredLang');
    if (saved === 'EN' || saved === 'DE' || saved === 'KO') {
      return saved as Language;
    }
    
    const browserLangs = navigator.languages || [navigator.language];
    for (let lang of browserLangs) {
      if (!lang) continue;
      const lowerLang = lang.toLowerCase();
      if (lowerLang.startsWith('de')) {
        localStorage.setItem('preferredLang', 'DE');
        return 'DE';
      }
      if (lowerLang.startsWith('ko')) {
        localStorage.setItem('preferredLang', 'KO');
        return 'KO';
      }
    }
    
    localStorage.setItem('preferredLang', 'EN');
  } catch (e) {
    // Ignore localStorage errors in restricted iframes
  }
  return 'EN';
};

export default function App() {
 const [currentLang, setLangState] = useState<Language>(getInitialLang);

 const setLang = (lang: Language) => {
   setLangState(lang);
   try {
     localStorage.setItem('preferredLang', lang);
   } catch (e) {}
 };
 const [user, setUser] = useState<User | null>(null);
 const [isAdminOpen, setIsAdminOpen] = useState(false);
 
 const [isHeroVideoPlaying, setIsHeroVideoPlaying] = useState(false);
 const heroVideoRef = useRef<HTMLVideoElement | null>(null);
  const [legalModal, setLegalModal] = useState<{ isOpen: boolean; type: 'impressum' | 'privacy' }>({ isOpen: false, type: 'impressum' });

 // Database States
 const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
 const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
 const [videoItems, setVideoItems] = useState<VideoItem[]>([]);
 const [pressItems, setPressItems] = useState<PressItem[]>([]);
 const [isLoading, setIsLoading] = useState(true);
 const [slides, setSlides] = useState<PerformanceSlide[]>([]);
 const [activeEditSection, setActiveEditSection] = useState<'none' | 'hero' | 'slides' | 'biography' | 'press' | 'gallery' | 'videos' | 'schedule'>('none');

 // Dynamic CMS States with default placeholders
 const [theme, setTheme] = useState<ThemeSettings>({ bg: '#000000', text: '#ffffff', accent: '#ffffff' });
  const initialThemeRef = useRef<ThemeSettings | null>(null);
 const [isEditingHeroText, setIsEditingHeroText] = useState(false);
 const [heroEditorMessage, setHeroEditorMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
 const [isHeroEditorExpanded, setIsHeroEditorExpanded] = useState(() => {
   const saved = sessionStorage.getItem('heroEditorExpanded');
   return saved ? JSON.parse(saved) : true;
 });
 useEffect(() => {
   sessionStorage.setItem('heroEditorExpanded', JSON.stringify(isHeroEditorExpanded));
 }, [isHeroEditorExpanded]);

 const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
   const saved = sessionStorage.getItem('heroEditorSections');
   return saved ? JSON.parse(saved) : {};
 });
 const toggleSection = (id: string) => {
   setExpandedSections(prev => {
     const next = { ...prev, [id]: !prev[id] };
     sessionStorage.setItem('heroEditorSections', JSON.stringify(next));
     return next;
   });
 };

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

 useEffect(() => {
  const video = heroVideoRef.current;
  if (!video) return;

  // Force muted on mount/update
  video.muted = true;
  video.defaultMuted = true;

  const playVideo = () => {
    video.play()
      .then(() => {
        setIsHeroVideoPlaying(true);
      })
      .catch((err) => {
        console.log("Autoplay prevented, waiting for interaction:", err);
      });
  };

  // Try playing immediately
  playVideo();

  // Re-try on any user interaction with the window/document
  const handleInteraction = () => {
    if (video.paused) {
      video.play()
        .then(() => {
          setIsHeroVideoPlaying(true);
          removeInteractionListeners();
        })
        .catch((err) => {
          console.log("Interaction play failed:", err);
        });
    } else {
      setIsHeroVideoPlaying(true);
      removeInteractionListeners();
    }
  };

  const removeInteractionListeners = () => {
    window.removeEventListener('click', handleInteraction);
    window.removeEventListener('touchstart', handleInteraction);
    window.removeEventListener('scroll', handleInteraction);
  };

  const handlePlayEvent = () => {
    setIsHeroVideoPlaying(true);
  };

  video.addEventListener('playing', handlePlayEvent);
  video.addEventListener('play', handlePlayEvent);

  window.addEventListener('click', handleInteraction, { passive: true });
  window.addEventListener('touchstart', handleInteraction, { passive: true });
  window.addEventListener('scroll', handleInteraction, { passive: true });

  return () => {
    removeInteractionListeners();
    video.removeEventListener('playing', handlePlayEvent);
    video.removeEventListener('play', handlePlayEvent);
  };
 }, [theme.homeBg, theme.homeBgType]);

 const loadAllData = async (showLoadingScreen = true) => {
 if (showLoadingScreen) setIsLoading(true);
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
        initialThemeRef.current = themeData;
 setBio(bioData);
 setContact(contactData);
 setSlides(sld);
 } catch (error) {
 console.error("Error loading database content:", error);
 } finally {
 if (showLoadingScreen) setIsLoading(false);
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

 // Hero text helpers
 const getHeroTitle = () => {
   if (currentLang === 'KO' && theme.heroTitleKO) return theme.heroTitleKO;
   if (currentLang === 'DE' && theme.heroTitleDE) return theme.heroTitleDE;
   if (theme.heroTitle) return theme.heroTitle;
   return t.heroTitle;
 };
 const getHeroSubtitle = () => {
   if (currentLang === 'KO' && theme.heroSubtitleKO) return theme.heroSubtitleKO;
   if (currentLang === 'DE' && theme.heroSubtitleDE) return theme.heroSubtitleDE;
   if (theme.heroSubtitle) return theme.heroSubtitle;
   return t.heroSubtitle;
 };
 const getHeroDescription = () => {
   if (currentLang === 'KO' && theme.heroDescriptionKO) return theme.heroDescriptionKO;
   if (currentLang === 'DE' && theme.heroDescriptionDE) return theme.heroDescriptionDE;
   if (theme.heroDescription) return theme.heroDescription;
   return t.heroDescription;
 };
 const getHeroDiscover = () => {
   if (currentLang === 'KO' && theme.heroDiscoverKO) return theme.heroDiscoverKO;
   if (currentLang === 'DE' && theme.heroDiscoverDE) return theme.heroDiscoverDE;
   if (theme.heroDiscover) return theme.heroDiscover;
   return t.discoverBtn;
 };

 // Google Font Import String generator
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

 // Timeline category definitions
 

 if (isLoading) {
  return (
   <div 
    id="loading-container" 
    className="min-h-screen flex flex-col items-center justify-center bg-[#000000] text-white font-sans"
    style={{ backgroundColor: theme.bg || "#000000", color: theme.text || "#ffffff" }}
   >
    <div className="relative flex flex-col items-center">
     <div className="w-16 h-16 border-2 border-[#C9A227] border-t-transparent rounded-full animate-spin mb-4" style={{ borderColor: theme.accent || "#C9A227", borderTopColor: "transparent" }} />
     <h1 className="text-lg tracking-widest uppercase font-light animate-pulse mb-1">
      HYUNKYUM KIM
     </h1>
     <p className="text-xs tracking-wider opacity-60 uppercase font-mono">
      Loading...
     </p>
    </div>
   </div>
  );
 }

 return (
 <div id="app-container" className="min-h-screen bg-transparent font-sans selection:bg-white selection:text-black" style={{ backgroundColor: theme.bg, color: theme.text }}>
 {/* Dynamic Theme Color Injection overrides */}
 <style>{`
 ${getGoogleFontImport()}

 :root {
 --color-bg: ${theme.bg};
 --color-text: ${theme.text};
 --color-accent: ${theme.accent};
 --color-contact-bg: ${theme.contactFormBg || '#0a0a0a'};
 }
 
 /* Apply Background Color to Public Website Sections */
 body, html, #app-container, #biography, #contact, #videos, #main-footer, #navbar-root, #press, #portfolio, #schedule {
 background-color: ${theme.bg} !important;
 }

 /* Global website text color overrides (Applying theme.text to all public sections and items) */
 #navbar-root, #navbar-root *,
 #home, #home *,
 #biography, #biography *,
 #press, #press *,
 #portfolio, #portfolio *,
 #videos, #videos *,
 #schedule, #schedule *,
 #contact, #contact *,
 #main-footer, #main-footer *,
 #app-container, #app-container * {
   color: ${theme.text};
 }

 /* Specific Sticky Navbar Styling with Opacity/Blur and Custom Scroll Background */
 #navbar-root {
   background-color: ${theme.bg ? `${theme.bg}e6` : 'rgba(0,0,0,0.85)'} !important; /* e6 is ~90% opacity */
   backdrop-filter: blur(12px);
   border-color: ${theme.text}1a !important; /* light 10% opacity border */
 }
 #desktop-menu button, .nav-link {
   color: ${theme.text} !important;
   opacity: 0.65;
   transition: all 0.3s ease;
 }
 #desktop-menu button:hover, .nav-link:hover {
   opacity: 1 !important;
 }
 #desktop-menu button[id^="nav-link-"].text-white, .nav-link.text-white {
   opacity: 1 !important;
   font-weight: 700 !important;
 }

 /* Unified Font Override (Applies website-wide unified font except for the Admin Panel) */
 ${theme.fontSans ? `
   body, html, #app-container, #navbar-root, .navbar-item, .nav-link, .nav-font, p, span, h1, h2, h3, h4, h5, h6, input, textarea, button, select, a, li, label, .font-sans, .font-serif, .font-mono { 
     font-family: "${theme.fontSans}", sans-serif !important; 
   }
 ` : ''}

 /* Slider (Selected Performances) text label color override */
 ${theme.colorHeroSlideText ? `
   #performances-slider-root,
   #performances-slider-root h3,
   #performances-slider-root p,
   #performances-slider-root span,
   #performances-slider-root div,
   #performances-slider-root button,
   #performances-slider-root svg {
     color: ${theme.colorHeroSlideText} !important;
   }
 ` : ''}

 /* Videos/Performances section text colors override */
 ${theme.colorPerformancesText ? `
   #videos, 
   #videos h2, 
   #videos h3, 
   #videos h4, 
   #videos p, 
   #videos span {
     color: ${theme.colorPerformancesText} !important;
   }
 ` : ''}

 /* Contact/Inquiries section text colors override */
 ${theme.colorContactText ? `
   #contact, 
   #contact h2, 
   #contact h3, 
   #contact p, 
   #contact span, 
   #contact label, 
   #contact a {
     color: ${theme.colorContactText} !important;
   }
 ` : ''}

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

 /* EXCLUDE ADMIN PANEL - COMPLETELY PROTECT IT FROM OVERRIDES */
 .admin-panel-exclude, 
 .admin-panel-exclude *, 
 [id^="admin-"], 
 [id^="admin-"] *, 
 #admin-panel-backdrop, 
 #admin-panel-backdrop * {
   font-family: 'Inter', sans-serif !important;
 }
 `}</style>

 {/* 1. STICKY NAVBAR */}
 <Navbar 
 currentLang={currentLang} 
 setLang={setLang} 
 user={user}
 onAdminToggle={() => setIsAdminOpen(true)}
	theme={theme}
 />

 {/* 2. HERO / HOME SECTION */}
 <section 
 id="home" 
 className={`relative h-screen flex items-center ${theme.heroAlign === 'left' ? 'justify-start' : theme.heroAlign === 'right' ? 'justify-end' : 'justify-center'} overflow-hidden`}
 >
  {user && (activeEditSection === 'none' || activeEditSection === 'hero') && (
    <div className="absolute top-24 left-6 right-6 z-50 flex justify-between items-center bg-black/40 backdrop-blur-sm p-4 border border-white/10 rounded-lg">
      <div className="flex items-center space-x-3">
        <span className="text-[9px] font-mono tracking-widest text-[#C9A227] uppercase bg-white/5 px-2 py-1 rounded">
          ADMIN ACCESS
        </span>
      </div>
      <div className="flex items-center space-x-3">
        {activeEditSection !== 'hero' ? (
          <button
            type="button"
            onClick={() => setActiveEditSection('hero')}
            className="inline-flex items-center space-x-2 text-[10px] uppercase tracking-widest px-4 py-2 bg-white/5 border border-white/10 hover:border-[#C9A227] hover:bg-white/10 rounded-sm text-neutral-300 transition-all cursor-pointer font-sans font-medium"
          >
            <Edit3 className="w-3.5 h-3.5 text-[#C9A227]" />
            <span>Edit Hero</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setActiveEditSection('none')}
            className="inline-flex items-center space-x-1.5 text-[10px] uppercase tracking-widest px-3.5 py-2 border border-white/10 hover:border-white/25 hover:bg-white/5 rounded-sm text-neutral-400 hover:text-white transition-all cursor-pointer font-sans"
          >
            <X className="w-3 h-3" />
            <span>Exit Edit Mode</span>
          </button>
        )}
      </div>
    </div>
  )}

  {user && activeEditSection === 'hero' && !isAdminOpen && (
    <HeroEditorPanel 
      theme={theme}
      setTheme={setTheme}
      isEditingText={isEditingHeroText}
      setIsEditingText={setIsEditingHeroText}
      onSave={async () => {
        try {
          await saveThemeSettings(theme);
          initialThemeRef.current = theme;
          window.dispatchEvent(new CustomEvent('themeChanged', { detail: theme }));
          setActiveEditSection('none');
          setIsEditingHeroText(false);
        } catch (err) {
          console.error("Failed to save theme:", err);
        }
      }}
      onReset={() => {
        if (initialThemeRef.current) {
          setTheme(initialThemeRef.current);
        }
      }}
      initialTheme={initialThemeRef.current}
    />
  )}

 {/* Background opera stage image or video */}
 {(() => {
 const media = getMediaSource(theme.homeBg || '', theme.homeBgType as any);
 if (media.type === 'video') {
 return (
 <div className="absolute inset-0 w-full h-full pointer-events-none">
 <video
 ref={(el) => {
   heroVideoRef.current = el;
   if (el) {
     el.muted = true;
   }
 }}
 autoPlay
 loop
 muted
 playsInline
 preload="auto"
 className="absolute inset-0 w-full h-full object-cover animate-kenburns pointer-events-none"
 src={media.src}
 onCanPlay={(e) => {
 e.currentTarget.play().catch((err) => {
 console.log("Home video autoplay prevented:", err);
 });
 }}
 onLoadStart={() => setIsHeroVideoPlaying(false)}
 onLoadedData={() => setIsHeroVideoPlaying(true)}
 onPlaying={() => setIsHeroVideoPlaying(true)}
 />
 <AnimatePresence>
 {!isHeroVideoPlaying && (
 <motion.div
 initial={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 transition={{ duration: 0.8, ease: "easeInOut" }}
 className="absolute inset-0 z-10 pointer-events-none"
 style={{ backgroundColor: theme.bg || '#000000' }}
 />
 )}
 </AnimatePresence>
 </div>
 );
 } else if (media.type === 'youtube') {
 return (
 <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
 <iframe
 className="absolute top-1/2 left-1/2 w-[300vw] h-[300vh] min-w-[100vw] min-h-[100vh] -translate-x-1/2 -translate-y-1/2 opacity-70 pointer-events-none"
 src={`https://www.youtube.com/embed/${media.ytId}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&loop=1&iv_load_policy=3&modestbranding=1&disablekb=1&fs=0&enablejsapi=1&playsinline=1${media.start ? `&start=${media.start}` : ''}&playlist=${media.ytId}`}
 allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
 allowFullScreen
 />
 {/* Shield overlay to block any pointer hover/click interactions which can show YouTube HUD */}
 <div className="absolute inset-0 bg-transparent z-10 pointer-events-auto" />
 </div>
 );
 } else {
 return (
 <div 
 id="hero-bg"
 className="absolute inset-0 bg-cover bg-center animate-kenburns"
 style={{ 
 backgroundImage: `url('${media.src || '/src/assets/images/opera_stage_1783548365279.jpg'}')` 
 }}
 />
 );
 }
 })()}
 {/* Dark classic curtain gradient overlay */}
 <div id="hero-overlay" className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/45 to-black" />

 {/* Hero Content */}
 <div 
   id="hero-content" 
   className={`relative z-10 px-6 max-w-4xl space-y-6 flex flex-col transition-all duration-300 ${
     theme.heroAlign === 'left' ? 'text-left items-start mr-auto' :
     theme.heroAlign === 'right' ? 'text-right items-end ml-auto' :
     'text-center items-center mx-auto'
   }`}
   style={{ 
     transform: `translateY(${theme.heroOffsetY || 0}px)`
   }}
 >
   {/* Subtitle */}
   <motion.div
     drag={isEditingHeroText}
     dragMomentum={false}
     onDragEnd={(e, info) => {
       setTheme(prev => ({
         ...prev,
         heroSubtitleOffsetX: (prev.heroSubtitleOffsetX || 0) + info.offset.x,
         heroSubtitleOffsetY: (prev.heroSubtitleOffsetY || 0) + info.offset.y
       }));
     }}
     initial={{ opacity: 0, y: 15 + (theme.heroSubtitleOffsetY || 0), x: theme.heroSubtitleOffsetX || 0 }}
     animate={{ opacity: 1, y: theme.heroSubtitleOffsetY || 0, x: theme.heroSubtitleOffsetX || 0 }}
     transition={isEditingHeroText ? { duration: 0 } : { duration: 1 }}
     className={`font-sans text-xs md:text-sm tracking-[0.4em] uppercase font-semibold ${isEditingHeroText ? `cursor-move p-2 border border-dashed border-[#C9A227]/50 hover:bg-white/5 rounded relative w-full flex items-center ${theme.heroAlign === 'left' ? 'justify-start' : theme.heroAlign === 'right' ? 'justify-end' : 'justify-center'}` : ''}`}
     style={{ fontSize: theme.heroSubtitleSize ? `${theme.heroSubtitleSize}px` : undefined }}
   >
     {isEditingHeroText && <span className="absolute -top-4 left-0 text-[8px] text-[#C9A227] tracking-widest uppercase">Subtitle</span>}
     {isEditingHeroText ? (
       <input
         type="text"
         className="bg-transparent border-none w-full focus:outline-none focus:ring-1 focus:ring-[#C9A227]/50 rounded cursor-text"
         style={{ textAlign: theme.heroAlign || 'center' }}
         value={currentLang === 'KO' ? (theme.heroSubtitleKO ?? '') : currentLang === 'DE' ? (theme.heroSubtitleDE ?? '') : (theme.heroSubtitle ?? '')}
         onPointerDownCapture={(e) => e.stopPropagation()}
         onChange={(e) => {
           const val = e.target.value;
           setTheme(prev => ({
             ...prev,
             [currentLang === 'KO' ? 'heroSubtitleKO' : currentLang === 'DE' ? 'heroSubtitleDE' : 'heroSubtitle']: val
           }));
         }}
       />
     ) : (
       getHeroSubtitle()
     )}
   </motion.div>

   {/* Main Title */}
   <motion.div
     drag={isEditingHeroText}
     dragMomentum={false}
     onDragEnd={(e, info) => {
       setTheme(prev => ({
         ...prev,
         heroTitleOffsetX: (prev.heroTitleOffsetX || 0) + info.offset.x,
         heroTitleOffsetY: (prev.heroTitleOffsetY || 0) + info.offset.y
       }));
     }}
     initial={{ opacity: 0, scale: 0.98, y: theme.heroTitleOffsetY || 0, x: theme.heroTitleOffsetX || 0 }}
     animate={{ opacity: 1, scale: 1, y: theme.heroTitleOffsetY || 0, x: theme.heroTitleOffsetX || 0 }}
     transition={isEditingHeroText ? { duration: 0 } : { duration: 1.2, delay: 0.2 }}
     className={`text-4xl sm:text-6xl md:text-8xl font-serif font-light tracking-[0.1em] uppercase leading-none ${isEditingHeroText ? `cursor-move p-2 border border-dashed border-[#C9A227]/50 hover:bg-white/5 rounded relative w-full flex items-center ${theme.heroAlign === 'left' ? 'justify-start' : theme.heroAlign === 'right' ? 'justify-end' : 'justify-center'}` : ''}`}
     style={{ fontSize: theme.heroTitleSize ? `${theme.heroTitleSize}px` : undefined }}
   >
     {isEditingHeroText && <span className="absolute -top-4 left-0 text-[8px] text-[#C9A227] tracking-widest uppercase font-sans">Main Title</span>}
     {isEditingHeroText ? (
       <input
         type="text"
         className="bg-transparent border-none w-full focus:outline-none focus:ring-1 focus:ring-[#C9A227]/50 rounded cursor-text"
         style={{ textAlign: theme.heroAlign || 'center' }}
         value={currentLang === 'KO' ? (theme.heroTitleKO ?? '') : currentLang === 'DE' ? (theme.heroTitleDE ?? '') : (theme.heroTitle ?? '')}
         onPointerDownCapture={(e) => e.stopPropagation()}
         onChange={(e) => {
           const val = e.target.value;
           setTheme(prev => ({
             ...prev,
             [currentLang === 'KO' ? 'heroTitleKO' : currentLang === 'DE' ? 'heroTitleDE' : 'heroTitle']: val
           }));
         }}
       />
     ) : (
       getHeroTitle()
     )}
   </motion.div>

   {/* Description */}
   <motion.div
     drag={isEditingHeroText}
     dragMomentum={false}
     onDragEnd={(e, info) => {
       setTheme(prev => ({
         ...prev,
         heroDescOffsetX: (prev.heroDescOffsetX || 0) + info.offset.x,
         heroDescOffsetY: (prev.heroDescOffsetY || 0) + info.offset.y
       }));
     }}
     initial={{ opacity: 0, y: 15 + (theme.heroDescOffsetY || 0), x: theme.heroDescOffsetX || 0 }}
     animate={{ opacity: 1, y: theme.heroDescOffsetY || 0, x: theme.heroDescOffsetX || 0 }}
     transition={isEditingHeroText ? { duration: 0 } : { duration: 1, delay: 0.4 }}
     className={`font-sans text-xs sm:text-sm md:text-base tracking-[0.2em] font-light max-w-xl uppercase pt-6 ${isEditingHeroText ? `cursor-move p-2 border border-dashed border-[#C9A227]/50 hover:bg-white/5 rounded relative w-full flex items-center ${theme.heroAlign === 'left' ? 'justify-start' : theme.heroAlign === 'right' ? 'justify-end' : 'justify-center'}` : ''}`}
     style={{ 
       fontSize: theme.heroDescSize ? `${theme.heroDescSize}px` : undefined,
       marginLeft: theme.heroAlign === 'right' ? 'auto' : theme.heroAlign === 'left' ? '0' : 'auto',
       marginRight: theme.heroAlign === 'left' ? 'auto' : theme.heroAlign === 'right' ? '0' : 'auto'
     }}
   >
     {isEditingHeroText && <span className="absolute -top-4 left-0 text-[8px] text-[#C9A227] tracking-widest uppercase">Description</span>}
     {isEditingHeroText ? (
       <textarea
         rows={2}
         className="bg-transparent border-none w-full focus:outline-none focus:ring-1 focus:ring-[#C9A227]/50 rounded cursor-text resize-none"
         style={{ textAlign: theme.heroAlign || 'center' }}
         value={currentLang === 'KO' ? (theme.heroDescriptionKO ?? '') : currentLang === 'DE' ? (theme.heroDescriptionDE ?? '') : (theme.heroDescription ?? '')}
         onPointerDownCapture={(e) => e.stopPropagation()}
         onChange={(e) => {
           const val = e.target.value;
           setTheme(prev => ({
             ...prev,
             [currentLang === 'KO' ? 'heroDescriptionKO' : currentLang === 'DE' ? 'heroDescriptionDE' : 'heroDescription']: val
           }));
         }}
       />
     ) : (
       getHeroDescription()
     )}
   </motion.div>

   {/* Button */}
   <motion.div
     drag={isEditingHeroText}
     dragMomentum={false}
     onDragEnd={(e, info) => {
       setTheme(prev => ({
         ...prev,
         heroButtonOffsetX: (prev.heroButtonOffsetX || 0) + info.offset.x,
         heroButtonOffsetY: (prev.heroButtonOffsetY || 0) + info.offset.y
       }));
     }}
     initial={{ opacity: 0, y: 20 + (theme.heroButtonOffsetY || 0), x: theme.heroButtonOffsetX || 0 }}
     animate={{ opacity: 1, y: theme.heroButtonOffsetY || 0, x: theme.heroButtonOffsetX || 0 }}
     transition={isEditingHeroText ? { duration: 0 } : { duration: 1, delay: 0.6 }}
     className={`pt-8 ${isEditingHeroText ? 'cursor-move p-2 border border-dashed border-[#C9A227]/50 hover:bg-white/5 rounded relative w-full flex flex-col items-center justify-center' : ''}`}
   >
     {isEditingHeroText && <span className="absolute -top-4 left-0 text-[8px] text-[#C9A227] tracking-widest uppercase font-sans">Button</span>}
     {isEditingHeroText ? (
       <input
         type="text"
         className="bg-transparent border border-black/10 px-8 py-3.5 focus:outline-none focus:ring-1 focus:ring-[#C9A227]/50 rounded cursor-text text-center text-xs tracking-[0.25em] uppercase w-full max-w-[200px] block"
         style={{ fontSize: theme.heroButtonSize ? `${theme.heroButtonSize}px` : undefined }}
         value={currentLang === 'KO' ? (theme.heroDiscoverKO ?? '') : currentLang === 'DE' ? (theme.heroDiscoverDE ?? '') : (theme.heroDiscover ?? '')}
         onPointerDownCapture={(e) => e.stopPropagation()}
         onChange={(e) => {
           const val = e.target.value;
           setTheme(prev => ({
             ...prev,
             [currentLang === 'KO' ? 'heroDiscoverKO' : currentLang === 'DE' ? 'heroDiscoverDE' : 'heroDiscover']: val
           }));
         }}
       />
     ) : (
       <button
         id="discover-button"
         onClick={() => scrollToSection('biography')}
         className="group px-8 py-3.5 border border-black/10 hover:text-black hover:bg-white font-sans text-xs tracking-[0.25em] uppercase rounded-sm transition-all duration-500 flex items-center space-x-2 mx-auto cursor-pointer"
         style={{ fontSize: theme.heroButtonSize ? `${theme.heroButtonSize}px` : undefined }}
       >
         <span>{getHeroDiscover()}</span>
         <ChevronDown className="w-4 h-4 transform group-hover:translate-y-1 transition-transform group-hover:text-black" />
       </button>
     )}
   </motion.div>
 </div>
 {/* Hero Background Copyright */}
 {theme.homeBgType === 'image' && theme.heroCopyright && (
   <div className="absolute bottom-4 right-4 z-20 pointer-events-auto hidden md:block">
     <div className="text-[9px] md:text-[10px] text-white/50 hover:text-white/80 transition-colors font-sans tracking-widest uppercase font-medium bg-black/20 px-2 py-1 rounded backdrop-blur-sm">
       {theme.heroCopyrightUrl ? (
         <a href={theme.heroCopyrightUrl} target="_blank" rel="noopener noreferrer" className="hover:text-[#C9A227] transition-colors" title={theme.heroCopyright}>
           {theme.heroCopyright.startsWith('©') ? theme.heroCopyright : `© ${theme.heroCopyright}`}
         </a>
       ) : (
         <span>{theme.heroCopyright.startsWith('©') ? theme.heroCopyright : `© ${theme.heroCopyright}`}</span>
       )}
     </div>
   </div>
 )}
 {/* Scroll helper */}
 <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 flex flex-col items-center animate-scroll-elegant select-none pointer-events-none">
 <span className="text-[10px] tracking-[0.5em] uppercase font-light mb-2">
 SCROLL
 </span>
 <div className="w-[1px] h-10 bg-white/60" />
 </div>
 </section>

 {/* 2.5 SELECTED PERFORMANCES SLIDER */}
 <SelectedPerformances 
   currentLang={currentLang} 
   setLang={setLang}
   slides={slides} 
   user={user}
   activeEditSection={activeEditSection}
   setActiveEditSection={setActiveEditSection}
   onItemsUpdated={(newItems) => setSlides(newItems)}
   onRefreshData={() => loadAllData(false)}
 />

 
 {/* 3. BIOGRAPHY SECTION */}
 <BiographySection 
   bio={bio}
   currentLang={currentLang}
   setLang={setLang}
   t={t}
   user={user}
   onBioUpdated={(newBio) => {
     setBio(newBio);
     window.dispatchEvent(new CustomEvent('bioChanged', { detail: newBio }));
   }}
   activeEditSection={activeEditSection}
   setActiveEditSection={setActiveEditSection}
 />

 {/* 3.5 PRESS REVIEWS SECTION */}
 <section 
 id="press" 
 className="page-section bg-transparent"
 >
 <div className="max-w-7xl mx-auto space-y-8 md:space-y-10">
 <Reveal>
 <div className="text-center">
 <h2 className="text-xl md:text-3xl font-serif font-light uppercase tracking-[0.25em] leading-none">
 PRESS
 </h2>
 </div>
 </Reveal>

 <Reveal delay={0.15}>
 <PressSection 
   currentLang={currentLang} 
   setLang={setLang} 
   user={user} 
   activeEditSection={activeEditSection}
   setActiveEditSection={setActiveEditSection}
   theme={theme}
   onThemeUpdated={async (newTheme) => {
     setTheme(newTheme);
     try {
       await saveThemeSettings(newTheme);
       window.dispatchEvent(new CustomEvent('themeChanged', { detail: newTheme }));
     } catch (err) {
       console.error("Failed to save theme:", err);
     }
   }}
 />
 </Reveal>
 </div>
 </section>

 {/* 4. PORTFOLIO SECTION */}
 <section 
 id="portfolio" 
 className="page-section bg-transparent/5/30"
 >
 <div className="max-w-7xl mx-auto space-y-8 md:space-y-10">
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
   setLang={setLang}
   user={user}
   activeEditSection={activeEditSection}
   setActiveEditSection={setActiveEditSection}
   onItemsUpdated={(newItems) => setPortfolioItems(newItems)}
   onRefreshData={() => loadAllData(false)}
 />
 </Reveal>
 </div>
 </section>

 {/* 5. VIDEOS SECTION */}
 <section 
 id="videos" 
 className="page-section bg-transparent"
 >
 <div className="max-w-7xl mx-auto space-y-8 md:space-y-10">
 <Reveal>
 <div className="text-center -mt-4 md:-mt-8">
 <h2 className="text-xl md:text-3xl font-serif font-light uppercase tracking-[0.25em] leading-none">
 PERFORMANCES
 </h2>
 </div>
 </Reveal>

 <Reveal delay={0.15}>
 <VideoPlayer 
   items={videoItems} 
   currentLang={currentLang} 
   setLang={setLang}
   user={user}
   activeEditSection={activeEditSection}
   setActiveEditSection={setActiveEditSection}
   onItemsUpdated={(newItems) => setVideoItems(newItems)}
   onRefreshData={() => loadAllData(false)}
 />
 </Reveal>
 </div>
 </section>

 {/* 6. SCHEDULE SECTION */}
 <section 
 id="schedule" 
 className="page-section bg-transparent/5/30"
 >
 <div className="max-w-4xl mx-auto space-y-8 md:space-y-10">
 <Reveal>
 <div className="text-center">
 <h2 className="text-xl md:text-3xl font-serif font-light uppercase tracking-[0.25em] leading-none">
 UPCOMING
 </h2>
 </div>
 </Reveal>

 {/* Schedule List */}
 <Reveal delay={0.15}>
 <ScheduleSection 
   items={scheduleItems} 
   currentLang={currentLang} 
   setLang={setLang}
   user={user} 
   activeEditSection={activeEditSection}
   setActiveEditSection={setActiveEditSection}
   onItemsUpdated={(newItems) => setScheduleItems(newItems)}
   onRefreshData={() => loadAllData(false)}
 />
 </Reveal>
 </div>
 </section>

 {/* 7. CONTACT SECTION */}
 <ContactSection 
  contact={contact}
  currentLang={currentLang}
  t={t}
/>

 {/* 8. FOOTER */}
 <footer id="main-footer" className="bg-transparent border-t border-black/10 py-12 px-6 text-center text-xs">
 <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 items-center gap-6">
 <div className="space-y-1 text-center md:text-left">
 <h4 className="font-serif text-sm tracking-widest uppercase">
 {theme?.footerBrandName || t.heroTitle}
 </h4>
 <p className="text-[10px] tracking-wider opacity-75">
 {theme?.footerContactEmail || t.footerDesc}
 </p>
 {/* Social Links */}
 {(theme?.footerSocialInstagram || theme?.footerSocialYoutube || theme?.footerSocialFacebook || theme?.footerSocialTwitter) && (
   <div className="flex items-center space-x-3 justify-center md:justify-start pt-1.5">
     {theme?.footerSocialInstagram && (
       <a href={theme.footerSocialInstagram} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--color-accent)] transition-colors" title="Instagram">
         <Instagram className="w-3.5 h-3.5" />
       </a>
     )}
     {theme?.footerSocialYoutube && (
       <a href={theme.footerSocialYoutube} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--color-accent)] transition-colors" title="YouTube">
         <Youtube className="w-3.5 h-3.5" />
       </a>
     )}
     {theme?.footerSocialFacebook && (
       <a href={theme.footerSocialFacebook} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--color-accent)] transition-colors" title="Facebook">
         <Facebook className="w-3.5 h-3.5" />
       </a>
     )}
     {theme?.footerSocialTwitter && (
       <a href={theme.footerSocialTwitter} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--color-accent)] transition-colors" title="Twitter/X">
         <Twitter className="w-3.5 h-3.5" />
       </a>
     )}
   </div>
 )}
 </div>

 <div className="flex flex-col items-center text-center gap-2 text-[10px] tracking-wider ">
 <div>
 {theme?.footerCopyrightText ? (
   theme.footerCopyrightText.replace('{year}', new Date().getFullYear().toString())
 ) : (
   `© ${new Date().getFullYear()} ${theme?.footerBrandName || t.heroTitle}. ${t.footerRights}.`
 )}
 </div>
 <div className="flex items-center space-x-3">
 <button 
 onClick={() => setLegalModal({ isOpen: true, type: 'impressum' })}
 className=" hover: transition-colors duration-300 uppercase tracking-widest text-[10px] cursor-pointer"
 >
 Impressum
 </button>
 <span className="">|</span>
 <button 
 onClick={() => setLegalModal({ isOpen: true, type: 'privacy' })}
 className=" hover: transition-colors duration-300 uppercase tracking-widest text-[10px] cursor-pointer"
 >
 Privacy Policy
 </button>
 </div>
 </div>

 {/* Secure Admin door lock icon */}
 <button
 id="admin-lock-btn"
 onClick={() => setIsAdminOpen(true)}
 className="justify-self-center md:justify-self-end flex items-center space-x-1.5 hover: transition-colors p-2 rounded cursor-pointer"
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
 key="admin-panel"
 currentLang={currentLang}
 setLang={setLang}
 isOpen={isAdminOpen}
 onClose={() => setIsAdminOpen(false)}
 user={user}
 scheduleItems={scheduleItems}
 portfolioItems={portfolioItems}
 refreshData={() => loadAllData(false)}
 />
 )}
 {legalModal.isOpen && (
 <LegalModal
 key="legal-modal"
 isOpen={legalModal.isOpen}
 type={legalModal.type}
 currentLang={currentLang}
 theme={theme}
 onClose={() => setLegalModal(prev => ({ ...prev, isOpen: false }))}
 />
 )}
 
 </AnimatePresence>
 </div>
 );
}