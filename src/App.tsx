import { set, cloneDeep } from "lodash";
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
 saveThemeSettings, saveBiographySettings, saveContactSettings,
 db
} from './firebase';
import { writeBatch, doc } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';

import WebsiteContent from "./components/WebsiteContent";
// Component Imports
import Navbar from './components/Navbar';
import PortfolioGallery from './components/PortfolioGallery';
import VideoPlayer from './components/VideoPlayer';
import ScheduleSection from './components/ScheduleSection';
import ContactSection from './components/ContactSection';
import AdminToolbar from './components/AdminToolbar';
import { loginWithGoogle } from './firebase';
import BiographySection from './components/BiographySection';
import SelectedPerformances from './components/SelectedPerformances';
import PressSection from './components/PressSection';
import { LegalModal } from './components/LegalModals';
import Reveal from './components/Reveal';
import HeroEditorPanel from './components/HeroEditorPanel';
import { getMediaSource } from './lib/mediaUtils';

import { EditingProvider } from './contexts/EditingContext';

const getInitialLang = (): Language => {
  let saved: string | null = null;
  try {
    saved = localStorage.getItem('preferredLang');
  } catch (e) {
    // Ignore localStorage access errors (e.g. in restricted sandboxed iframes)
  }

  if (saved === 'EN' || saved === 'DE' || saved === 'KO') {
    return saved as Language;
  }

  try {
    const browserLangs = navigator.languages || [navigator.language];
    for (let lang of browserLangs) {
      if (!lang) continue;
      const lowerLang = lang.toLowerCase();
      if (lowerLang.startsWith('de')) {
        try {
          localStorage.setItem('preferredLang', 'DE');
        } catch (e) {}
        return 'DE';
      }
      if (lowerLang.startsWith('ko')) {
        try {
          localStorage.setItem('preferredLang', 'KO');
        } catch (e) {}
        return 'KO';
      }
    }
  } catch (e) {
    // Ignore navigator or language array access errors
  }

  try {
    localStorage.setItem('preferredLang', 'EN');
  } catch (e) {}
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
 
 useEffect(() => {
   if (window.location.pathname === "/admin") {
     loginWithGoogle().then(() => {
       window.history.replaceState(null, "", "/");
     });
   }
 }, []);

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
 const [theme, setTheme] = useState<ThemeSettings>({ bg: '#000000', text: '#ffffff' });
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
 email: 'contact@hyunkyumkim.com',
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


 const handleEditSchedule = (item: ScheduleItem) => {
 // Editing will be handled inline or via overlay later
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
     theme.websiteFont
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
     <div className="w-16 h-16 border-2 border-[var(--color-text)] border-t-transparent rounded-full animate-spin mb-4" style={{ borderColor: theme.text || "#ffffff", borderTopColor: "transparent" }} />
     <div className="text-lg tracking-widest uppercase font-light animate-pulse mb-1">
      HYUNKYUM KIM
     </div>
     <p className="text-xs tracking-wider opacity-60 uppercase font-mono">
      Loading...
     </p>
    </div>
   </div>
  );
 }





  const handleSave = async (state: Record<string, any>, baseState?: Record<string, any>) => {
    const newTheme = cloneDeep(theme) || {} as ThemeSettings;
    let hasThemeUpdates = false;

    const newBio = cloneDeep(bio) || {} as BiographySettings;
    let hasBioUpdates = false;

    const newContact = cloneDeep(contact) || {} as ContactSettings;
    let hasContactUpdates = false;

    for (const [key, value] of Object.entries(state)) {
      if (key === 'theme') {
        Object.assign(newTheme, value);
        hasThemeUpdates = true;
      } else if (key === 'bio') {
        Object.assign(newBio, value);
        hasBioUpdates = true;
      } else if (key === 'contact') {
        Object.assign(newContact, value);
        hasContactUpdates = true;
      } else if (key.startsWith('theme.')) {
        const path = key.substring(6); // Remove 'theme.'
        set(newTheme, path, value);
        hasThemeUpdates = true;
      } else if (key.startsWith('bio.')) {
        const path = key.substring(4); // Remove 'bio.'
        set(newBio, path, value);
        hasBioUpdates = true;
      } else if (key.startsWith('contact.')) {
        const path = key.substring(8); // Remove 'contact.'
        set(newContact, path, value);
        hasContactUpdates = true;
      }
    }

    const promises = [];

    if (hasThemeUpdates) {
      promises.push(saveThemeSettings(newTheme).then(() => setTheme(newTheme)));
    }

    if (hasBioUpdates) {
      promises.push(saveBiographySettings(newBio).then(() => setBio(newBio)));
    }

    if (hasContactUpdates) {
      promises.push(saveContactSettings(newContact).then(() => setContact(newContact)));
    }

    const base = baseState || {};

    // Portfolio Items Save
    if (state['portfolioItems']) {
      const initial = base['portfolioItems'] || [];
      const current = state['portfolioItems'];
      const batch = writeBatch(db);
      initial.forEach((item: any) => {
        if (!current.find((i: any) => i.id === item.id)) {
          batch.delete(doc(db, 'portfolio', item.id));
        }
      });
      current.forEach((item: any, index: number) => {
        const itemToSave = { ...item, order: index };
        const initialItem = initial.find((i: any) => i.id === item.id);
        if (!initialItem || JSON.stringify({ ...initialItem, order: initial.findIndex((i: any) => i.id === item.id) }) !== JSON.stringify(itemToSave)) {
          batch.set(doc(db, 'portfolio', item.id), itemToSave);
        }
      });
      promises.push(batch.commit());
    }

    // Schedule Items Save
    if (state['scheduleItems']) {
      const initial = base['scheduleItems'] || [];
      const current = state['scheduleItems'];
      const batch = writeBatch(db);
      initial.forEach((item: any) => {
        if (!current.find((i: any) => i.id === item.id)) {
          batch.delete(doc(db, 'schedule', item.id));
        }
      });
      current.forEach((item: any, index: number) => {
        const itemToSave = { ...item, order: index };
        const initialItem = initial.find((i: any) => i.id === item.id);
        if (!initialItem || JSON.stringify({ ...initialItem, order: initial.findIndex((i: any) => i.id === item.id) }) !== JSON.stringify(itemToSave)) {
          batch.set(doc(db, 'schedule', item.id), itemToSave);
        }
      });
      promises.push(batch.commit());
    }

    // Video Items Save
    if (state['videoItems']) {
      const initial = base['videoItems'] || [];
      const current = state['videoItems'];
      const batch = writeBatch(db);
      initial.forEach((item: any) => {
        if (!current.find((i: any) => i.id === item.id)) {
          batch.delete(doc(db, 'videos', item.id));
        }
      });
      current.forEach((item: any, index: number) => {
        const itemToSave = { ...item, order: index };
        const initialItem = initial.find((i: any) => i.id === item.id);
        if (!initialItem || JSON.stringify({ ...initialItem, order: initial.findIndex((i: any) => i.id === item.id) }) !== JSON.stringify(itemToSave)) {
          batch.set(doc(db, 'videos', item.id), itemToSave);
        }
      });
      promises.push(batch.commit());
    }

    // Press Items Save
    if (state['pressItems']) {
      const initial = base['pressItems'] || [];
      const current = state['pressItems'];
      const batch = writeBatch(db);
      initial.forEach((item: any) => {
        if (!current.find((i: any) => i.id === item.id)) {
          batch.delete(doc(db, 'press', item.id));
        }
      });
      current.forEach((item: any, index: number) => {
        const itemToSave = { ...item, order: index };
        const initialItem = initial.find((i: any) => i.id === item.id);
        if (!initialItem || JSON.stringify({ ...initialItem, order: initial.findIndex((i: any) => i.id === item.id) }) !== JSON.stringify(itemToSave)) {
          batch.set(doc(db, 'press', item.id), itemToSave);
        }
      });
      promises.push(batch.commit());
    }

    // Selected Performances Slides Save
    if (state['slides']) {
      const initial = base['slides'] || [];
      const current = state['slides'];
      const batch = writeBatch(db);
      initial.forEach((item: any) => {
        if (!current.find((i: any) => i.id === item.id)) {
          batch.delete(doc(db, 'selected_performances', item.id));
        }
      });
      current.forEach((item: any, index: number) => {
        const itemToSave = { ...item, order: index };
        const initialItem = initial.find((i: any) => i.id === item.id);
        if (!initialItem || JSON.stringify({ ...initialItem, order: initial.findIndex((i: any) => i.id === item.id) }) !== JSON.stringify(itemToSave)) {
          batch.set(doc(db, 'selected_performances', item.id), itemToSave);
        }
      });
      promises.push(batch.commit());
    }

    await Promise.all(promises);
  };

  return (
    <EditingProvider
      onSave={handleSave}
      theme={theme}
      setTheme={setTheme}
      bio={bio}
      setBio={setBio}
      contact={contact}
      setContact={setContact}
      portfolioItems={portfolioItems}
      setPortfolioItems={setPortfolioItems}
      scheduleItems={scheduleItems}
      setScheduleItems={setScheduleItems}
      videoItems={videoItems}
      setVideoItems={setVideoItems}
      pressItems={pressItems}
      setPressItems={setPressItems}
      slides={slides}
      setSlides={setSlides}
    >
      <WebsiteContent
        currentLang={currentLang} setLang={setLang} user={user}
        scheduleItems={scheduleItems} setScheduleItems={setScheduleItems} portfolioItems={portfolioItems} setPortfolioItems={setPortfolioItems}
        videoItems={videoItems} setVideoItems={setVideoItems} pressItems={pressItems} setPressItems={setPressItems}
        theme={theme} setTheme={setTheme} bio={bio} setBio={setBio} contact={contact} setContact={setContact} slides={slides} setSlides={setSlides}
        activeEditSection={activeEditSection} setActiveEditSection={setActiveEditSection}
        isEditingHeroText={isEditingHeroText} setIsEditingHeroText={setIsEditingHeroText}
        initialThemeRef={initialThemeRef} loadAllData={loadAllData} legalModal={legalModal} setLegalModal={setLegalModal} t={t}
        isHeroVideoPlaying={isHeroVideoPlaying} setIsHeroVideoPlaying={setIsHeroVideoPlaying} heroVideoRef={heroVideoRef}
        adminMode={!!user}
      />
      <AnimatePresence>
        {user && <AdminToolbar />}
        
        {legalModal.isOpen && (
          <LegalModal adminMode={!!user}
            key="legal-modal"
            isOpen={legalModal.isOpen}
            type={legalModal.type}
            currentLang={currentLang}
            theme={theme}
            onClose={() => setLegalModal(prev => ({ ...prev, isOpen: false }))}
          />
        )}
      </AnimatePresence>
    </EditingProvider>
  );
}
