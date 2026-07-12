import React, { useState, useEffect } from 'react';
import type { Language, ScheduleItem, PortfolioItem, ThemeSettings } from '../../types';
import { 
  Monitor, Image, FileText, Tv, Calendar, MessageSquare, HardDrive, 
  Activity, Globe, Settings, Layers, Shield, Sliders, User, ExternalLink, ArrowRight, Instagram, Youtube, Facebook, Twitter, LayoutGrid
} from 'lucide-react';
import { auth, fetchThemeSettings } from '../../firebase';

interface AdminDashboardProps {
  currentLang: Language;
  setLang: (lang: Language) => void;
  scheduleItems: ScheduleItem[];
  portfolioItems: PortfolioItem[];
  onNavigate: (tab: any) => void;
}

export default function AdminDashboard({ 
  currentLang, 
  setLang, 
  scheduleItems, 
  portfolioItems,
  onNavigate
}: AdminDashboardProps) {
  const user = auth.currentUser;
  const [theme, setTheme] = useState<ThemeSettings | null>(null);

  useEffect(() => {
    fetchThemeSettings().then(data => {
      setTheme(data);
    });
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 p-6 lg:p-10 max-w-6xl mx-auto overflow-y-auto h-full custom-scrollbar">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-neutral-950 via-[#111] to-neutral-950 border border-neutral-900 rounded-lg p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-full border border-neutral-800 bg-neutral-900 flex items-center justify-center overflow-hidden">
            {user?.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <User className="w-6 h-6 text-neutral-500" />
            )}
          </div>
          <div>
            <h2 className="text-sm font-serif text-white tracking-widest uppercase">
              Welcome, {user?.displayName || 'Authorized Administrator'}
            </h2>
            <p className="text-[10px] text-neutral-500 font-mono uppercase tracking-wider mt-0.5">
              Role: System Administrator • {user?.email}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] uppercase tracking-widest text-emerald-500 font-semibold">Active Session</span>
        </div>
      </div>

      {/* Grid Layout of Bento Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* 1. Website Info Card */}
        <div className="bg-[#111] border border-neutral-900 p-6 rounded-lg relative overflow-hidden flex flex-col justify-between group h-full">
          <div>
            <div className="flex justify-between items-start">
              <h3 className="text-[10px] font-sans tracking-widest text-neutral-500 uppercase mb-4">Website</h3>
              <Globe className="w-4 h-4 text-neutral-500" />
            </div>
            <p className="text-xl font-serif text-white leading-tight">
              Hyunkyum Kim
            </p>
            <p className="text-xs text-[#C9A227] tracking-wider uppercase font-light mt-1">
              Baritone Official Portal
            </p>
          </div>
          <div className="border-t border-neutral-900/60 pt-4 mt-6 flex justify-between text-[10px] uppercase font-mono tracking-wider text-neutral-400">
            <span>Framework: React / Vite</span>
            <span>Status: Live</span>
          </div>
        </div>

        {/* 2. Global Language Card */}
        <div className="bg-[#111] border border-neutral-900 p-6 rounded-lg relative overflow-hidden flex flex-col justify-between group h-full">
          <div>
            <div className="flex justify-between items-start">
              <h3 className="text-[10px] font-sans tracking-widest text-[#C9A227] uppercase mb-4 font-semibold">Global Language Switch</h3>
              <Sliders className="w-4 h-4 text-[#C9A227]" />
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed mb-4">
              Select the active presentation language. Previews will update immediately.
            </p>
            <div className="grid grid-cols-3 gap-1 bg-black p-1 rounded border border-neutral-900">
              {(['EN', 'DE', 'KO'] as const).map(lang => (
                <button
                  key={lang}
                  onClick={() => setLang(lang)}
                  className={`py-2 text-xs tracking-wider uppercase font-semibold transition-all rounded-[2px] ${currentLang === lang ? 'bg-[#C9A227] text-black font-bold' : 'text-neutral-400 hover:text-white hover:bg-neutral-900'}`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>
          <div className="text-[9px] text-neutral-500 uppercase tracking-widest font-mono mt-4">
            Current active locale: <span className="text-white font-bold">{currentLang}</span>
          </div>
        </div>

        {/* 3. Footer Summary Card */}
        <div className="bg-[#111] border border-neutral-900 p-6 rounded-lg relative overflow-hidden flex flex-col justify-between group h-full">
          <div>
            <div className="flex justify-between items-start">
              <h3 className="text-[10px] font-sans tracking-widest text-neutral-500 uppercase mb-4">Footer Configuration</h3>
              <Shield className="w-4 h-4 text-neutral-500" />
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between border-b border-neutral-900/50 pb-1.5">
                <span className="text-neutral-500 uppercase tracking-wider">Brand Name:</span>
                <span className="text-white font-mono truncate max-w-[120px]">
                  {theme?.footerBrandName || 'Default'}
                </span>
              </div>
              <div className="flex justify-between border-b border-neutral-900/50 pb-1.5">
                <span className="text-neutral-500 uppercase tracking-wider">Copyright:</span>
                <span className="text-white font-mono truncate max-w-[120px]">
                  {theme?.footerCopyrightText ? 'Custom' : 'Standard'}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-neutral-900/50 pb-1.5">
                <span className="text-neutral-500 uppercase tracking-wider">Social Links:</span>
                <div className="flex space-x-1">
                  {theme?.footerSocialInstagram && <Instagram className="w-3.5 h-3.5 text-neutral-400" />}
                  {theme?.footerSocialYoutube && <Youtube className="w-3.5 h-3.5 text-neutral-400" />}
                  {theme?.footerSocialFacebook && <Facebook className="w-3.5 h-3.5 text-neutral-400" />}
                  {theme?.footerSocialTwitter && <Twitter className="w-3.5 h-3.5 text-neutral-400" />}
                </div>
              </div>
            </div>
          </div>
          <button 
            onClick={() => onNavigate('footer')}
            className="w-full mt-4 flex items-center justify-between py-2 px-3 bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 rounded text-[10px] uppercase tracking-wider text-neutral-300 hover:text-white transition-colors"
          >
            <span>Customize Footer</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#C9A227]" />
          </button>
        </div>

      </div>

      {/* Quick Actions & Content Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* 4. Content Managers / Quick Actions */}
        <div className="md:col-span-2 border border-neutral-900 bg-[#111] p-6 rounded-lg space-y-4">
          <div className="flex items-center space-x-2 border-b border-neutral-900 pb-3">
            <Sliders className="w-4 h-4 text-[#C9A227]" />
            <h4 className="text-xs font-sans tracking-widest text-neutral-300 uppercase">Quick Navigation / Page Editors</h4>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <button 
              onClick={() => onNavigate('hero')}
              className="flex items-center space-x-2.5 p-3 rounded bg-black/40 hover:bg-black/80 border border-neutral-900 hover:border-neutral-800 text-left transition-all"
            >
              <Monitor className="w-4 h-4 text-[#C9A227]" />
              <div className="min-w-0">
                <span className="block text-[10px] uppercase tracking-wider text-white">Hero Design</span>
              </div>
            </button>
            <button 
              onClick={() => onNavigate('slides')}
              className="flex items-center space-x-2.5 p-3 rounded bg-black/40 hover:bg-black/80 border border-neutral-900 hover:border-neutral-800 text-left transition-all"
            >
              <Layers className="w-4 h-4 text-[#C9A227]" />
              <div className="min-w-0">
                <span className="block text-[10px] uppercase tracking-wider text-white">Hero Slides</span>
              </div>
            </button>
            <button 
              onClick={() => onNavigate('biography')}
              className="flex items-center space-x-2.5 p-3 rounded bg-black/40 hover:bg-black/80 border border-neutral-900 hover:border-neutral-800 text-left transition-all"
            >
              <FileText className="w-4 h-4 text-[#C9A227]" />
              <div className="min-w-0">
                <span className="block text-[10px] uppercase tracking-wider text-white">Biography</span>
              </div>
            </button>
            <button 
              onClick={() => onNavigate('portfolio')}
              className="flex items-center space-x-2.5 p-3 rounded bg-black/40 hover:bg-black/80 border border-neutral-900 hover:border-neutral-800 text-left transition-all"
            >
              <Image className="w-4 h-4 text-[#C9A227]" />
              <div className="min-w-0">
                <span className="block text-[10px] uppercase tracking-wider text-white">Gallery</span>
              </div>
            </button>
            <button 
              onClick={() => onNavigate('videos')}
              className="flex items-center space-x-2.5 p-3 rounded bg-black/40 hover:bg-black/80 border border-neutral-900 hover:border-neutral-800 text-left transition-all"
            >
              <Tv className="w-4 h-4 text-[#C9A227]" />
              <div className="min-w-0">
                <span className="block text-[10px] uppercase tracking-wider text-white">Videos</span>
              </div>
            </button>
            <button 
              onClick={() => onNavigate('press')}
              className="flex items-center space-x-2.5 p-3 rounded bg-black/40 hover:bg-black/80 border border-neutral-900 hover:border-neutral-800 text-left transition-all"
            >
              <FileText className="w-4 h-4 text-[#C9A227]" />
              <div className="min-w-0">
                <span className="block text-[10px] uppercase tracking-wider text-white">Press</span>
              </div>
            </button>
            <button 
              onClick={() => onNavigate('schedule')}
              className="flex items-center space-x-2.5 p-3 rounded bg-black/40 hover:bg-black/80 border border-neutral-900 hover:border-neutral-800 text-left transition-all"
            >
              <Calendar className="w-4 h-4 text-[#C9A227]" />
              <div className="min-w-0">
                <span className="block text-[10px] uppercase tracking-wider text-white">Schedule</span>
              </div>
            </button>
            <button 
              onClick={() => onNavigate('contact')}
              className="flex items-center space-x-2.5 p-3 rounded bg-black/40 hover:bg-black/80 border border-neutral-900 hover:border-neutral-800 text-left transition-all"
            >
              <MessageSquare className="w-4 h-4 text-[#C9A227]" />
              <div className="min-w-0">
                <span className="block text-[10px] uppercase tracking-wider text-white">Contact Info</span>
              </div>
            </button>
            <button 
              onClick={() => onNavigate('footer')}
              className="flex items-center space-x-2.5 p-3 rounded bg-black/40 hover:bg-black/80 border border-neutral-900 hover:border-neutral-800 text-left transition-all"
            >
              <LayoutGrid className="w-4 h-4 text-[#C9A227]" />
              <div className="min-w-0">
                <span className="block text-[10px] uppercase tracking-wider text-white">Footer Settings</span>
              </div>
            </button>
          </div>
        </div>

        {/* 5. Storage Card */}
        <div className="border border-neutral-900 bg-[#111] p-6 rounded-lg space-y-4">
          <div className="flex items-center space-x-2 border-b border-neutral-900 pb-3">
            <HardDrive className="w-4 h-4 text-neutral-500" />
            <h4 className="text-xs font-sans tracking-widest text-neutral-300 uppercase">Storage & Cloud Status</h4>
          </div>
          <div className="space-y-4 text-xs font-sans">
            <div className="flex justify-between border-b border-neutral-900/50 pb-2">
              <span className="text-neutral-500 uppercase tracking-widest">Primary Assets</span>
              <span className="text-white">Cloudflare R2</span>
            </div>
            <div className="flex justify-between border-b border-neutral-900/50 pb-2">
              <span className="text-neutral-500 uppercase tracking-widest">Database</span>
              <span className="text-white">Firestore DB</span>
            </div>
            <div className="flex justify-between border-b border-neutral-900/50 pb-2">
              <span className="text-neutral-500 uppercase tracking-widest">Total Events</span>
              <span className="text-[#C9A227] font-mono font-semibold">{scheduleItems.length}</span>
            </div>
            <div className="flex justify-between pb-1">
              <span className="text-neutral-500 uppercase tracking-widest">Total Photos</span>
              <span className="text-[#C9A227] font-mono font-semibold">{portfolioItems.length}</span>
            </div>
          </div>
        </div>

      </div>

      {/* System Status & Recent Activity Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* 6. System Status Card */}
        <div className="border border-neutral-900 bg-[#111] p-6 rounded-lg space-y-4">
          <div className="flex items-center space-x-2 border-b border-neutral-900 pb-3">
            <Settings className="w-4 h-4 text-neutral-500" />
            <h4 className="text-xs font-sans tracking-widest text-neutral-300 uppercase">Deployment & Platform</h4>
          </div>
          <div className="space-y-3 text-xs font-sans">
            <div className="flex justify-between">
              <span className="text-neutral-500">Platform</span>
              <span className="text-white">Vercel & GitHub</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Auth Engine</span>
              <span className="text-white">Firebase Auth</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">SSL State</span>
              <span className="text-emerald-500 uppercase text-[10px] tracking-widest font-mono">Secured (SSL)</span>
            </div>
          </div>
        </div>

        {/* 7. Recent Activity Card */}
        <div className="md:col-span-2 border border-neutral-900 bg-[#111] p-6 rounded-lg space-y-4">
          <div className="flex items-center space-x-2 border-b border-neutral-900 pb-3">
            <Activity className="w-4 h-4 text-neutral-500" />
            <h4 className="text-xs font-sans tracking-widest text-neutral-300 uppercase">Control Center Logs</h4>
          </div>
          <div className="space-y-3 text-xs font-sans text-neutral-500">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#C9A227] mt-1.5" />
                <span className="leading-relaxed text-neutral-300">Admin Control Center opened successfully</span>
              </div>
              <span className="text-[9px] font-mono opacity-50">Just now</span>
            </div>
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className="w-1.5 h-1.5 rounded-full bg-neutral-700 mt-1.5" />
                <span className="leading-relaxed">Synchronized with Firebase Cloud Database</span>
              </div>
              <span className="text-[9px] font-mono opacity-50">Loaded</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
