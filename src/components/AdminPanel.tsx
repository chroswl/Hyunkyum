import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, X, LayoutDashboard, Calendar, Image as ImageIcon, FileText, Tv, Monitor, Layers, FileSignature, MessageSquare, Settings, LayoutGrid, Palette, Tablet, Smartphone } from 'lucide-react';
import { loginWithGoogle, auth } from '../firebase';
import type { Language, ScheduleItem, PortfolioItem, VideoItem, PressItem, ThemeSettings, BiographySettings, ContactSettings, PerformanceSlide } from '../types';
import type { User } from 'firebase/auth';
import { AppearanceProvider } from '../contexts/AppearanceContext';
import IFramePreview from './admin/IFramePreview';
import WebsiteContent from './WebsiteContent';

// Tab Components (We will replace these with Property Panels)
import AdminDashboard from './admin/AdminDashboard';
import AdminSchedule from './admin/AdminSchedule';
import AdminPortfolio from './admin/AdminPortfolio';
import AdminPress from './admin/AdminPress';
import AdminVideos from './admin/AdminVideos';
import AdminHero from './admin/AdminHero';
import AdminSlides from './admin/AdminSlides';
import AdminBiography from './admin/AdminBiography';
import AdminContact from './admin/AdminContact';
import AdminSettings from './admin/AdminSettings';
import AdminFooter from './admin/AdminFooter';
import AdminTheme from './admin/AdminTheme';

export type AdminTab = 
  | 'dashboard' 
  | 'theme'
  | 'schedule' 
  | 'portfolio' 
  | 'press' 
  | 'videos' 
  | 'hero' 
  | 'slides' 
  | 'biography' 
  | 'contact' 
  | 'footer'
  | 'settings';

export interface AdminPanelProps {
  currentLang: Language; setLang: (lang: Language) => void;
  isOpen: boolean; onClose: () => void;
  user: User | null;
  scheduleItems: ScheduleItem[]; setScheduleItems: any;
  portfolioItems: PortfolioItem[]; setPortfolioItems: any;
  videoItems: VideoItem[]; setVideoItems: any;
  pressItems: PressItem[]; setPressItems: any;
  theme: ThemeSettings; setTheme: any;
  bio: BiographySettings; setBio: any;
  contact: ContactSettings; setContact: any;
  slides: PerformanceSlide[]; setSlides: any;
  activeEditSection: any; setActiveEditSection: any;
  isEditingHeroText: boolean; setIsEditingHeroText: any;
  initialThemeRef: any; loadAllData: any;
  legalModal: any; setLegalModal: any; t: any;
  isHeroVideoPlaying: boolean; setIsHeroVideoPlaying: any;
  heroVideoRef: any;
  refreshData: () => void;
  key?: string;
}

export default function AdminPanel(props: AdminPanelProps) {
  const {
    currentLang, setLang, isOpen, onClose, user,
    scheduleItems, portfolioItems, refreshData, theme, setTheme
  } = props;
  
  const [activeTab, setActiveTab] = useState<AdminTab>('theme');
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const savedTab = sessionStorage.getItem('adminActiveTab') as AdminTab;
      if (savedTab) setActiveTab(savedTab);
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen]);

  const handleTabChange = (tab: AdminTab) => {
    setActiveTab(tab);
    sessionStorage.setItem('adminActiveTab', tab);
    setSelectedBlock(null);
    
    // Auto-scroll the preview iframe to the corresponding section
    const sectionMap: Record<string, string> = {
      'hero': 'home',
      'slides': 'performances',
      'biography': 'biography',
      'portfolio': 'portfolio',
      'videos': 'videos',
      'press': 'press',
      'schedule': 'schedule',
      'contact': 'contact',
      'footer': 'main-footer'
    };
    const targetId = sectionMap[tab];
    if (targetId) {
      const iframe = document.querySelector('iframe') as HTMLIFrameElement;
      if (iframe && iframe.contentWindow) {
        const el = iframe.contentDocument?.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }
  };

  const handleBlockSelect = (tabId: AdminTab, blockId: string) => {
    if (activeTab !== tabId) {
      setActiveTab(tabId);
      sessionStorage.setItem('adminActiveTab', tabId);
    }
    setSelectedBlock(blockId);
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'main' },
    { id: 'theme', label: 'Theme (테마)', icon: Palette, group: 'content' },
    { id: 'hero', label: 'Hero Design', icon: Monitor, group: 'content' },
    { id: 'slides', label: 'Hero Slides', icon: Layers, group: 'content' },
    { id: 'biography', label: 'Biography', icon: FileSignature, group: 'content' },
    { id: 'portfolio', label: 'Gallery', icon: ImageIcon, group: 'content' },
    { id: 'videos', label: 'Videos', icon: Tv, group: 'content' },
    { id: 'press', label: 'Press', icon: FileText, group: 'content' },
    { id: 'schedule', label: 'Schedule', icon: Calendar, group: 'content' },
    { id: 'contact', label: 'Contact', icon: MessageSquare, group: 'content' },
    { id: 'footer', label: 'Footer', icon: LayoutGrid, group: 'content' },
    { id: 'settings', label: 'System Settings', icon: Settings, group: 'system' }
  ] as const;

  if (!isOpen) return null;

  return (
    <AppearanceProvider>
      <div id="admin-panel-root" className="fixed inset-0 z-[100] flex bg-black/90 backdrop-blur-sm text-white font-sans">
        {!user ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-4">
            {/* Login UI unchanged */}
            <div className="bg-[#111] border border-neutral-900 p-8 rounded text-center space-y-6 w-[400px]">
              <h2 className="text-xl font-serif text-[var(--color-text)]">Admin Authentication</h2>
              <button onClick={loginWithGoogle} className="w-full py-3 bg-[#C9A227] hover:bg-[#ebd04e] text-black rounded flex items-center justify-center space-x-2">
                <LogIn className="w-5 h-5" /><span>Sign in with Google</span>
              </button>
              <button onClick={onClose} className="text-neutral-500 hover:text-white text-sm">Cancel</button>
            </div>
          </div>
        ) : (
          <>
            {/* 1. Sidebar (Navigation) */}
            <div className="w-64 bg-[#111] border-r border-neutral-900 flex flex-col h-full shrink-0">
              <div className="p-6 border-b border-neutral-900 flex justify-between items-center">
                <h2 className="text-sm font-serif tracking-widest text-[#C9A227] uppercase">Control Center</h2>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                <div>
                  <h3 className="text-[10px] uppercase tracking-widest text-neutral-500 mb-3 px-2">Design System</h3>
                  {tabs.filter(t => t.id === 'theme').map(tab => (
                    <button key={tab.id} onClick={() => handleTabChange(tab.id as AdminTab)} className={`w-full flex items-center space-x-3 px-3 py-2 rounded text-sm transition-colors ${activeTab === tab.id ? 'bg-[#C9A227]/10 text-[#C9A227]' : 'text-neutral-400 hover:bg-white/5 hover:text-white'}`}>
                      <tab.icon className="w-4 h-4" /><span>{tab.label}</span>
                    </button>
                  ))}
                </div>
                <div>
                  <h3 className="text-[10px] uppercase tracking-widest text-neutral-500 mb-3 px-2">Content Blocks</h3>
                  <div className="space-y-1">
                    {tabs.filter(t => t.group === 'content' && t.id !== 'theme').map(tab => (
                      <button key={tab.id} onClick={() => handleTabChange(tab.id as AdminTab)} className={`w-full flex items-center space-x-3 px-3 py-2 rounded text-sm transition-colors ${activeTab === tab.id ? 'bg-[#C9A227]/10 text-[#C9A227]' : 'text-neutral-400 hover:bg-white/5 hover:text-white'}`}>
                        <tab.icon className="w-4 h-4" /><span>{tab.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-[10px] uppercase tracking-widest text-neutral-500 mb-3 px-2">System</h3>
                  {tabs.filter(t => t.group === 'system' || t.group === 'main').map(tab => (
                    <button key={tab.id} onClick={() => handleTabChange(tab.id as AdminTab)} className={`w-full flex items-center space-x-3 px-3 py-2 rounded text-sm transition-colors ${activeTab === tab.id ? 'bg-[#C9A227]/10 text-[#C9A227]' : 'text-neutral-400 hover:bg-white/5 hover:text-white'}`}>
                      <tab.icon className="w-4 h-4" /><span>{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-4 border-t border-neutral-900 flex justify-between items-center">
                <button onClick={() => setLang(currentLang === 'EN' ? 'KO' : 'EN')} className="text-xs text-neutral-500 hover:text-white">{currentLang}</button>
                <button onClick={() => auth.signOut()} className="text-xs text-neutral-500 hover:text-white">Sign Out</button>
              </div>
            </div>

            {/* 2. Middle Panel (Properties) */}
            <div className="w-[340px] xl:w-[380px] bg-[#111] border-r border-neutral-900 flex flex-col shrink-0 h-full">
              <div className="flex-1 overflow-y-auto custom-scrollbar p-0 flex flex-col h-full">
                {/* Dynamically render properties based on activeTab */}
                {activeTab === 'theme' && <AdminTheme currentLang={currentLang} theme={theme} setTheme={setTheme} initialTheme={props.initialThemeRef.current} onRefreshData={refreshData} onClose={onClose} />}
                {/* For now we render the existing full components, but we will strip them down */}
                {activeTab === 'dashboard' && <AdminDashboard currentLang={currentLang} setLang={setLang} scheduleItems={scheduleItems} portfolioItems={portfolioItems} onNavigate={handleTabChange} onClose={onClose} />}
                {activeTab === 'hero' && <AdminHero currentLang={currentLang} theme={theme} setTheme={setTheme} initialTheme={props.initialThemeRef.current} onRefreshData={refreshData} onClose={onClose} />}
                {activeTab === 'slides' && <AdminSlides currentLang={currentLang} theme={theme} setTheme={setTheme} slides={props.slides} setSlides={props.setSlides} onRefreshData={refreshData} onClose={onClose} />}
                {activeTab === 'biography' && <AdminBiography currentLang={currentLang} bio={props.bio} setBio={props.setBio} onRefreshData={refreshData} onClose={onClose} />}
                {activeTab === 'portfolio' && <AdminPortfolio currentLang={currentLang} portfolioItems={portfolioItems} setPortfolioItems={props.setPortfolioItems} onRefreshData={refreshData} onClose={onClose} />}
                {activeTab === 'videos' && <AdminVideos currentLang={currentLang} videoItems={props.videoItems} setVideoItems={props.setVideoItems} onRefreshData={refreshData} onClose={onClose} />}
                {activeTab === 'press' && <AdminPress currentLang={currentLang} pressItems={props.pressItems} setPressItems={props.setPressItems} onRefreshData={refreshData} onClose={onClose} />}
                {activeTab === 'schedule' && <AdminSchedule currentLang={currentLang} scheduleItems={scheduleItems} setScheduleItems={props.setScheduleItems} onRefreshData={refreshData} onClose={onClose} />}
                {activeTab === 'contact' && <AdminContact currentLang={currentLang} contact={props.contact} setContact={props.setContact} onRefreshData={refreshData} onClose={onClose} />}
                {activeTab === 'footer' && <AdminFooter currentLang={currentLang} theme={theme} setTheme={setTheme} initialTheme={props.initialThemeRef.current} onRefreshData={refreshData} onClose={onClose} />}
                {activeTab === 'settings' && <AdminSettings currentLang={currentLang} onClose={onClose} />}
              </div>
            </div>

            {/* 3. Right Panel (Unified Live Preview) */}
            <div className="flex-1 bg-neutral-950 flex flex-col h-full overflow-hidden relative">
              <div className="h-14 border-b border-neutral-900 bg-[#111] flex items-center justify-center px-6 shrink-0">
                 <div className="flex items-center space-x-2 bg-neutral-900 border border-neutral-800 p-0.5 rounded-md">
                    <button onClick={() => setViewport('desktop')} className={`px-3 py-1 rounded text-[10px] tracking-wider uppercase transition-all flex items-center space-x-1.5 ${viewport === 'desktop' ? 'bg-[#C9A227] text-black font-semibold' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'}`}><Monitor className="w-3 h-3" /><span>Desktop</span></button>
                    <button onClick={() => setViewport('tablet')} className={`px-3 py-1 rounded text-[10px] tracking-wider uppercase transition-all flex items-center space-x-1.5 ${viewport === 'tablet' ? 'bg-[#C9A227] text-black font-semibold' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'}`}><Tablet className="w-3 h-3" /><span>Tablet</span></button>
                    <button onClick={() => setViewport('mobile')} className={`px-3 py-1 rounded text-[10px] tracking-wider uppercase transition-all flex items-center space-x-1.5 ${viewport === 'mobile' ? 'bg-[#C9A227] text-black font-semibold' : 'text-neutral-400 hover:text-white hover:bg-neutral-800'}`}><Smartphone className="w-3 h-3" /><span>Mobile</span></button>
                 </div>
              </div>
              <div className="flex-1 p-6 overflow-hidden flex items-center justify-center bg-neutral-950 relative">
                <div className={`transition-all duration-300 h-full relative flex flex-col bg-black overflow-hidden ${
                  viewport === 'desktop' ? 'w-full rounded-none border-none' :
                  viewport === 'tablet' ? 'w-[768px] max-w-full border border-neutral-800 ring-4 ring-neutral-900/50 rounded-md shadow-2xl' :
                  'w-[375px] max-w-full border border-neutral-800 ring-4 ring-neutral-900/50 rounded-md shadow-2xl'
                }`}>
                   <IFramePreview className="w-full h-full bg-black">
                      <div className="relative min-h-screen">
                        <WebsiteContent 
                          {...props} 
                          adminMode={true} 
                          selectedBlock={selectedBlock} 
                          onBlockSelect={handleBlockSelect} 
                        />
                      </div>
                   </IFramePreview>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppearanceProvider>
  );
}
