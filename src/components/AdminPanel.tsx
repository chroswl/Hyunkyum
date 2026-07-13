import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, X, LayoutDashboard, Calendar, Image as ImageIcon, FileText, Tv, Monitor, Layers, FileSignature, MessageSquare, Settings, LayoutGrid, Palette } from 'lucide-react';
import { loginWithGoogle, auth } from '../firebase';
import type { Language, ScheduleItem, PortfolioItem } from '../types';
import type { User } from 'firebase/auth';

// Tab Components
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
import AppearanceControlCenter from './admin/appearance/AppearanceControlCenter';
import AdminFooter from './admin/AdminFooter';

export type AdminTab = 
  | 'dashboard' 
  | 'schedule' 
  | 'portfolio' 
  | 'press' 
  | 'videos' 
  | 'hero' 
  | 'slides' 
  | 'biography' 
  | 'contact' 
  | 'footer'
  | 'appearance'
  | 'settings';

export interface AdminPanelProps {
  currentLang: Language;
  setLang: (lang: Language) => void;
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  scheduleItems: ScheduleItem[];
  portfolioItems: PortfolioItem[];
  refreshData: () => void;
  key?: string;
}

export default function AdminPanel({
  currentLang,
  setLang,
  isOpen,
  onClose,
  user,
  scheduleItems,
  portfolioItems,
  refreshData
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  useEffect(() => {
    const handler = () => {
      setActiveTab('appearance');
    };
    window.addEventListener('open-admin-appearance', handler);
    return () => window.removeEventListener('open-admin-appearance', handler);
  }, []);


  useEffect(() => {
    if (isOpen) {
      const savedTab = sessionStorage.getItem('adminActiveTab') as AdminTab;
      if (savedTab) setActiveTab(savedTab);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && activeTab !== 'appearance') {
      document.body.style.overflow = 'hidden';
      document.body.classList.remove('appearance-preview-mode');
    } else if (isOpen && activeTab === 'appearance') {
      document.body.style.overflow = 'auto';
      document.body.classList.add('appearance-preview-mode');
    } else {
      document.body.style.overflow = 'auto';
      document.body.classList.remove('appearance-preview-mode');
    }
    return () => { 
      document.body.style.overflow = 'auto'; 
      document.body.classList.remove('appearance-preview-mode');
    };
  }, [isOpen, activeTab]);


  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + Shift + A to toggle Appearance
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        if (activeTab === 'appearance') {
          handleTabChange('dashboard');
        } else {
          handleTabChange('appearance');
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [activeTab]);

  const handleTabChange = (tab: AdminTab) => {
    setActiveTab(tab);
    sessionStorage.setItem('adminActiveTab', tab);
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'main' },
    { id: 'hero', label: 'Hero Design', icon: Monitor, group: 'content' },
    { id: 'slides', label: 'Hero Slides', icon: Layers, group: 'content' },
    { id: 'biography', label: 'Biography', icon: FileSignature, group: 'content' },
    { id: 'portfolio', label: 'Gallery', icon: ImageIcon, group: 'content' },
    { id: 'videos', label: 'Videos', icon: Tv, group: 'content' },
    { id: 'press', label: 'Press', icon: FileText, group: 'content' },
    { id: 'schedule', label: 'Schedule', icon: Calendar, group: 'content' },
    { id: 'contact', label: 'Contact', icon: MessageSquare, group: 'content' },
    { id: 'footer', label: 'Footer', icon: LayoutGrid, group: 'content' },
    { id: 'appearance', label: 'Appearance', icon: Palette, group: 'system' },
    { id: 'settings', label: 'System Settings', icon: Settings, group: 'system' }
  ] as const;

  if (!isOpen) return null;

  if (activeTab === 'appearance' && user) {
    return <AppearanceControlCenter currentLang={currentLang} onClose={() => handleTabChange('dashboard')} />;
  }

  return (
    <div className="fixed inset-0 z-[100] flex bg-black/90 backdrop-blur-sm">
      {!user ? (
        <div className="w-full h-full flex flex-col items-center justify-center p-4">
          <div className="bg-[#111] border border-neutral-900 p-8 rounded text-center space-y-6 w-[400px]">
            <h2 className="text-xl font-serif text-[var(--color-text)]">Admin Authentication</h2>
            <p className="text-sm text-neutral-400">Please sign in with your authorized Google account to access the control center.</p>
            <button
              onClick={loginWithGoogle}
              className="w-full py-3 bg-accent hover:bg-[#ebd04e] text-black rounded font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <LogIn className="w-5 h-5" />
              <span>Sign in with Google</span>
            </button>
            <button onClick={onClose} className="text-neutral-500 hover:text-white text-sm">Cancel</button>
          </div>
        </div>
      ) : (
        <>
          {/* Sidebar */}
          <div className="w-64 bg-[#111] border-r border-neutral-900 flex flex-col h-full shrink-0">
            <div className="p-6 border-b border-neutral-900 flex justify-between items-center">
              <h2 className="text-sm font-serif tracking-widest text-accent uppercase">Control Center</h2>
            </div>

            {/* Global Language Switcher */}
            <div className="px-6 py-4 border-b border-neutral-900/40 flex flex-col space-y-2 shrink-0">
              <span className="text-[9px] uppercase tracking-widest text-neutral-500 font-sans">Global Language</span>
              <div className="grid grid-cols-3 gap-1 bg-black p-1 rounded border border-neutral-900/60">
                {(['EN', 'DE', 'KO'] as const).map(lang => (
                  <button
                    key={lang}
                    onClick={() => setLang(lang)}
                    className={`py-1 text-[10px] tracking-wider uppercase font-semibold transition-all rounded-[2px] ${currentLang === lang ? 'bg-accent text-black font-bold' : 'text-neutral-400 hover:text-white hover:bg-neutral-900'}`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              
              <div>
                <h3 className="text-[10px] uppercase tracking-widest text-neutral-500 mb-3 px-2">Overview</h3>
                {tabs.filter(t => t.group === 'main').map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id as AdminTab)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded text-sm transition-colors ${activeTab === tab.id ? 'bg-accent/10 text-accent' : 'text-neutral-400 hover:bg-white/5 hover:text-white'}`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              <div>
                <h3 className="text-[10px] uppercase tracking-widest text-neutral-500 mb-3 px-2">Content Editors</h3>
                <div className="space-y-1">
                  {tabs.filter(t => t.group === 'content').map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id as AdminTab)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded text-sm transition-colors ${activeTab === tab.id ? 'bg-accent/10 text-accent' : 'text-neutral-400 hover:bg-white/5 hover:text-white'}`}
                    >
                      <tab.icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-[10px] uppercase tracking-widest text-neutral-500 mb-3 px-2">System</h3>
                {tabs.filter(t => t.group === 'system').map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id as AdminTab)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded text-sm transition-colors ${activeTab === tab.id ? 'bg-accent/10 text-accent' : 'text-neutral-400 hover:bg-white/5 hover:text-white'}`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

            </div>
            
            <div className="p-4 border-t border-neutral-900">
               <button onClick={() => auth.signOut()} className="w-full py-2 text-xs text-neutral-500 hover:text-white transition-colors">Sign Out</button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col h-full bg-[#0a0a0a] overflow-hidden">
            <div className="h-16 border-b border-neutral-900 flex justify-between items-center px-6 shrink-0 bg-[#111]">
              <h1 className="text-lg font-serif text-white tracking-wider">
                {tabs.find(t => t.id === activeTab)?.label}
              </h1>
              <button onClick={onClose} className="p-2 text-neutral-400 hover:text-white transition-colors rounded-full hover:bg-white/5">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="w-full h-full overflow-hidden">

                {activeTab === 'dashboard' && <AdminDashboard currentLang={currentLang} setLang={setLang} scheduleItems={scheduleItems} portfolioItems={portfolioItems} onNavigate={handleTabChange} />}
                {activeTab === 'hero' && <AdminHero currentLang={currentLang} />}
                {activeTab === 'slides' && <AdminSlides currentLang={currentLang} />}
                {activeTab === 'biography' && <AdminBiography currentLang={currentLang} />}
                {activeTab === 'portfolio' && <AdminPortfolio currentLang={currentLang} />}
                {activeTab === 'videos' && <AdminVideos currentLang={currentLang} />}
                {activeTab === 'press' && <AdminPress currentLang={currentLang} />}
                {activeTab === 'schedule' && <AdminSchedule currentLang={currentLang} />}
                {activeTab === 'contact' && <AdminContact currentLang={currentLang} />}
                {activeTab === 'footer' && <AdminFooter currentLang={currentLang} />}
                {/* appearance is handled outside the main wrapper to float above the site */}
                {activeTab === 'settings' && <AdminSettings currentLang={currentLang} />}
              
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
