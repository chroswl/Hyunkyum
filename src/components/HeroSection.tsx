import { InlineEditor } from "../lib/editing/InlineEditor";
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Settings } from 'lucide-react';
import { ThemeSettings, Language } from '../types';
import { MediaEngine } from '../lib/editing/mediaEngine';
import { MediaPreview } from './admin/media';
import { User } from 'firebase/auth';
import EditableBlock from './admin/EditableBlock';

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
  adminMode?: boolean;
  selectedBlock?: string | null;
  onBlockSelect?: (tab: any, blockId: string) => void;
  onOpenSettings?: () => void;
}
import { useSectionDirty } from '../hooks/useSectionDirty';

export default function HeroSection({
  theme,
  setTheme,
  currentLang,
  t,
  user,
  scrollToSection = () => {},
  adminMode,
  selectedBlock,
  onBlockSelect,
  onOpenSettings
}: HeroSectionProps) {
  const [isHeroVideoPlaying, setIsHeroVideoPlaying] = useState(false);
  const heroVideoRef = useRef<HTMLVideoElement | null>(null);
  const isDirty = useSectionDirty('hero');

  React.useEffect(() => {
    const video = heroVideoRef.current;
    if (!video) return;

    video.muted = true;
    video.defaultMuted = true;

    const playVideo = () => {
      video.play().then(() => setIsHeroVideoPlaying(true)).catch(() => {});
    };

    playVideo();
    
    const handleInteraction = () => {
      if (video.paused) {
        video.play().then(() => setIsHeroVideoPlaying(true)).catch(() => {});
      } else {
        setIsHeroVideoPlaying(true);
      }
    };

    window.addEventListener('click', handleInteraction, { passive: true, once: true });
    window.addEventListener('touchstart', handleInteraction, { passive: true, once: true });
    
    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
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
      {/* Admin Settings Overlay */}
      {user && (
        <div className="absolute top-24 left-6 z-50 pointer-events-auto">
          <button 
            onClick={onOpenSettings}
            className="flex items-center space-x-2 bg-black/60 hover:bg-black border border-white/10 hover:border-[#C9A227] backdrop-blur-md px-4 py-2 rounded-sm text-xs font-sans tracking-widest uppercase transition-all shadow-xl group"
          >
            <Settings className="w-3.5 h-3.5 text-[#C9A227] group-hover:rotate-90 transition-transform duration-500" />
            <span className="text-white/90 group-hover:text-white">Hero Settings</span>
          </button>
        </div>
      )}

      {/* Background opera stage image or video */}
      {(() => {
        const media = MediaEngine.resolve(theme.homeBg || '', theme.homeBgType as any);
        if (media.type === 'video') {
          return (
            <div className="absolute inset-0 w-full h-full pointer-events-none">
              <MediaPreview
                url={theme.homeBg}
                explicitType={theme.homeBgType as any}
                className="absolute inset-0 w-full h-full pointer-events-none select-none"
                videoClassName="animate-kenburns pointer-events-none"
                videoRef={heroVideoRef}
                onLoadedData={() => setIsHeroVideoPlaying(true)}
                muted={true}
                loop={true}
                autoPlay={true}
                controls={false}
                showPlayIcon={false}
              />
              <AnimatePresence>
                {!isHeroVideoPlaying && (
                  <motion.div
                    initial={{ opacity: 1 }} exit={{ opacity: 0 }}
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
              <MediaPreview
                url={theme.homeBg}
                explicitType={theme.homeBgType as any}
                className="absolute inset-0 w-full h-full pointer-events-none select-none"
                iframeClassName="absolute top-1/2 left-1/2 w-[300vw] h-[300vh] min-w-[100vw] min-h-[100vh] -translate-x-1/2 -translate-y-1/2 opacity-70 pointer-events-none"
                muted={true}
                loop={true}
                autoPlay={true}
                controls={false}
                showPlayIcon={false}
              />
              <div className="absolute inset-0 bg-transparent z-10 pointer-events-auto" />
            </div>
          );
        } else {
          return (
            <div className="absolute inset-0 pointer-events-none">
              <MediaPreview
                url={theme.homeBg || '/src/assets/images/opera_stage_1783548365279.jpg'}
                explicitType={theme.homeBgType as any}
                className="absolute inset-0 pointer-events-none select-none"
                imageClassName="animate-kenburns pointer-events-none"
                showPlayIcon={false}
              />
            </div>
          );
        }
      })()}
      
      {/* Dark classic curtain gradient overlay */}
      <div id="hero-overlay" className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/45 to-black pointer-events-none" />

      {/* Hero Content */}
      <div 
        id="hero-content" 
        className={`relative z-10 px-6 global-container space-y-6 flex flex-col transition-all duration-300 ${
          theme.heroAlign === 'left' ? 'text-left items-start mr-auto' :
          theme.heroAlign === 'right' ? 'text-right items-end ml-auto' :
          'text-center items-center mx-auto'
        }`}
        style={{ transform: `translate(${theme.heroContentOffsetX ?? 0}px, ${theme.heroContentOffsetY ?? theme.heroOffsetY ?? 0}px)`, '--hero-title-size': theme.heroTitleSize ? `${theme.heroTitleSize}px` : '64px', '--hero-btn-size': theme.heroButtonSize ? `${theme.heroButtonSize}px` : '11px', '--hero-subtitle-size': theme.heroSubtitleSize ? `${theme.heroSubtitleSize}px` : undefined, '--hero-desc-size': theme.heroDescSize ? `${theme.heroDescSize}px` : undefined } as React.CSSProperties}
      >


        <EditableBlock
          id="hero-subtitle" adminMode={adminMode} selectedBlock={selectedBlock}
          onSelect={(id) => onBlockSelect && onBlockSelect('hero', id)}
        >
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className={`font-sans text-[length:min(var(--hero-subtitle-size,12px),20px)] lg:text-[length:var(--hero-subtitle-size,14px)] tracking-[0.4em] uppercase font-semibold relative inline-flex items-center`}
          >
            <InlineEditor 
              id="theme.heroSubtitle" 
              initialValue={getHeroSubtitle()} 
              readonly={!adminMode} 
              placeholder="Hero Subtitle"
              toolbarTools={["typography"]}
            />
            <AnimatePresence>
              {isDirty && (
                <motion.span
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  className="absolute -right-6 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#C9A227]"
                  title="Unsaved changes"
                />
              )}
            </AnimatePresence>
          </motion.div>
        </EditableBlock>

        <EditableBlock
          id="hero-title" adminMode={adminMode} selectedBlock={selectedBlock}
          onSelect={(id) => onBlockSelect && onBlockSelect('hero', id)}
        >
          <motion.h1
            initial={{ opacity: 0, scale: 0.98, y: 0 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.2 }}
            className={`text-[length:min(var(--hero-title-size,64px),36px)] md:text-[length:min(var(--hero-title-size,64px),52px)] lg:text-[length:var(--hero-title-size,64px)] font-serif font-light tracking-[0.1em] uppercase leading-none`}
            
          >
            <InlineEditor 
              id="theme.heroTitle" 
              initialValue={getHeroTitle()} 
              readonly={!adminMode} 
              placeholder="Hero Title"
              toolbarTools={["typography"]}
            />
          </motion.h1>
        </EditableBlock>

        <EditableBlock
          id="hero-description" adminMode={adminMode} selectedBlock={selectedBlock}
          onSelect={(id) => onBlockSelect && onBlockSelect('hero', id)}
        >
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className={`font-sans text-[length:min(var(--hero-desc-size,16px),20px)] lg:text-[length:var(--hero-desc-size,16px)] tracking-[0.2em] font-light max-w-xl uppercase pt-6`}
            style={{ 
              marginLeft: theme.heroAlign === 'right' ? 'auto' : theme.heroAlign === 'left' ? '0' : 'auto',
              marginRight: theme.heroAlign === 'left' ? 'auto' : theme.heroAlign === 'right' ? '0' : 'auto'
            }}
          >
            <InlineEditor 
              id="theme.heroDescription" 
              initialValue={getHeroDescription()} 
              readonly={!adminMode} 
              placeholder="Hero Description"
              toolbarTools={["typography"]}
            />
          </motion.div>
        </EditableBlock>

        <EditableBlock
          id="hero-cta" adminMode={adminMode} selectedBlock={selectedBlock}
          onSelect={(id) => onBlockSelect && onBlockSelect('hero', id)}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6 }}
            className={`pt-8`}
          >
            <button
              id="discover-button"
              onClick={(e) => {
                if (!adminMode) scrollToSection('biography');
                else e.preventDefault();
              }}
              className="group px-8 py-3.5 border border-white/20 font-sans text-[length:min(var(--hero-btn-size,11px),15px)] lg:text-[length:max(var(--hero-btn-size,11px),15px)] tracking-[0.25em] uppercase rounded-sm transition-all duration-250 flex items-center space-x-2 mx-auto cursor-pointer"
              style={{ color: theme.text || "#ffffff" }}
            >
              <InlineEditor 
                id="theme.heroDiscover" 
                initialValue={getHeroDiscover()} 
                readonly={!adminMode} 
                placeholder="Button Text"
                toolbarTools={["typography"]}
              />
              <ChevronDown className="w-4 h-4 transition-transform duration-200 group-hover:translate-y-1 text-current" />
            </button>
          </motion.div>
        </EditableBlock>
      </div>

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
        <span className="text-[10px] tracking-[0.5em] uppercase font-light mb-2">SCROLL</span>
        <div className="w-[1px] h-10 bg-white/60" />
      </div>
    </section>
  );
}
