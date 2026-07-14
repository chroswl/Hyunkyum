import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Edit3, X, ChevronDown } from 'lucide-react';
import { ThemeSettings, Language } from '../types';
import HeroEditorPanel from './HeroEditorPanel';
import { getMediaSource } from '../lib/mediaUtils';
import { saveThemeSettings } from '../firebase';
import { User } from 'firebase/auth';

interface HeroSectionProps {
  theme: ThemeSettings;
  setTheme: React.Dispatch<React.SetStateAction<ThemeSettings>>;
  currentLang: Language;
  t: any;
  user: User | null;
  isAdminOpen: boolean;
  activeEditSection: string;
  setActiveEditSection: (section: any) => void;
  isEditingHeroText: boolean;
  setIsEditingHeroText: (val: boolean) => void;
  scrollToSection?: (id: string) => void;
}

export default function HeroSection({
  theme,
  setTheme,
  currentLang,
  t,
  user,
  isAdminOpen,
  activeEditSection,
  setActiveEditSection,
  isEditingHeroText,
  setIsEditingHeroText,
  scrollToSection = () => {},
}: HeroSectionProps) {
  const initialThemeRef = useRef<ThemeSettings | null>(theme);
  const [isHeroVideoPlaying, setIsHeroVideoPlaying] = useState(false);
  const heroVideoRef = useRef<HTMLVideoElement | null>(null);

  React.useEffect(() => {
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
          console.log("HeroSection autoplay prevented, waiting for interaction:", err);
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
            console.log("HeroSection interaction play failed:", err);
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

  return (
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
         className="px-8 py-3.5 border border-white/20 hover:border-white/60 font-sans  text-xs tracking-[0.25em] uppercase rounded-sm transition-all duration-250 flex items-center space-x-2 mx-auto cursor-pointer hover:-translate-y-0.5"
          style={{ fontSize: theme.heroButtonSize ? `${theme.heroButtonSize}px` : undefined, color: theme.text || "#ffffff" }}
       >
         <span>{getHeroDiscover()}</span>
         <ChevronDown className="w-4 h-4 transform hover:translate-y-1 transition-transform text-current" />
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
  );
}
