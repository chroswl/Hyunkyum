import React, { useState, useEffect } from 'react';
import ImageCropperModal from './ImageCropperModal';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, LogIn, LogOut, Plus, Edit, Trash2, Calendar, Image, MessageSquare, 
  Save, Check, AlertTriangle, ChevronRight, User as UserIcon, Link, ShieldAlert,
  Tv, Award, Settings, Palette, FileText, Info, Upload
} from 'lucide-react';
import { db, auth, loginWithGoogle, logout } from '../firebase';
import { collection, getDocs, doc, setDoc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { 
  ScheduleItem, PortfolioItem, ContactMessage, Language, PressItem, VideoItem,
  ThemeSettings, BiographySettings, ContactSettings, PerformanceSlide
} from '../types';
import { translations } from '../translations';
import { User } from 'firebase/auth';
import { 
  fetchVideos, saveVideoItem, deleteVideoItem,
  fetchPress, savePressItem, deletePressItem,
  fetchThemeSettings, saveThemeSettings,
  fetchBiographySettings, saveBiographySettings,
  fetchContactSettings, saveContactSettings,
  fetchSelectedPerformances, saveSelectedPerformance, deleteSelectedPerformance
} from '../firebase';

const compressAndGetBase64 = (file: File, maxWidth = 1000, quality = 0.6): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Cap maximum dimensions to 1600px to balance quality and file size
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else if (height > maxWidth) {
          width = Math.round((width * maxWidth) / height);
          height = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        
        // Output as highly efficient progressive jpeg
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = (err) => {
        reject(err);
      };
    };
    reader.onerror = (err) => {
      reject(err);
    };
  });
};

interface AdminPanelProps {
  currentLang: Language;
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  scheduleItems: ScheduleItem[];
  portfolioItems: PortfolioItem[];
  refreshData: () => void;
}

type AdminTab = 'settings' | 'biography' | 'slides' | 'schedule' | 'portfolio' | 'press' | 'videos' | 'messages';

export default function AdminPanel({ 
  currentLang, 
  isOpen, 
  onClose, 
  user, 
  scheduleItems, 
  portfolioItems, 
  refreshData 
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('settings');
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [pressItems, setPressItems] = useState<PressItem[]>([]);
  const [slides, setSlides] = useState<PerformanceSlide[]>([]);
  const [localScheduleItems, setLocalScheduleItems] = useState<ScheduleItem[]>(scheduleItems);
  const [localPortfolioItems, setLocalPortfolioItems] = useState<PortfolioItem[]>(portfolioItems);

  useEffect(() => {
    setLocalScheduleItems(scheduleItems);
  }, [scheduleItems]);

  useEffect(() => {
    setLocalPortfolioItems(portfolioItems);
  }, [portfolioItems]);
  
  // Settings states
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>({ bg: '#000000', text: '#ffffff', accent: '#ffffff' });
  const [bioSettings, setBioSettings] = useState<BiographySettings>({ bioIntro: { EN: '', DE: '', KO: '' }, bioLong: { EN: '', DE: '', KO: '' } });
  const [contactSettings, setContactSettings] = useState<ContactSettings>({ email: '', phone: '', management: '' });

  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [loadingPress, setLoadingPress] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [loadingSlides, setLoadingSlides] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [confirmPrompt, setConfirmPrompt] = useState<{ message: string, onConfirm: () => void } | null>(null);

  const t = translations[currentLang];

  // Forms states
  const [editingSchedule, setEditingSchedule] = useState<Partial<ScheduleItem> | null>(null);
  const [editingPortfolio, setEditingPortfolio] = useState<Partial<PortfolioItem> | null>(null);
  const [editingVideo, setEditingVideo] = useState<Partial<VideoItem> | null>(null);
  const [editingPress, setEditingPress] = useState<Partial<PressItem> | null>(null);
  const [editingSlide, setEditingSlide] = useState<Partial<PerformanceSlide> | null>(null);
  const [cropTarget, setCropTarget] = useState<{ src: string, aspect?: number, onCrop: (base64: string) => void } | null>(null);

  useEffect(() => {
    if (user && isOpen) {
      if (activeTab === 'messages') fetchMessages();
      if (activeTab === 'videos') fetchVideosList();
      if (activeTab === 'press') fetchPressList();
      if (activeTab === 'settings') fetchAllSettings();
      if (activeTab === 'slides') fetchSlidesList();
    }
  }, [user, activeTab, isOpen]);

  // Load all settings on mount if user is logged in
  useEffect(() => {
    if (user && isOpen) {
      fetchAllSettings();
      fetchSlidesList();
    }
  }, [user, isOpen]);

  const fetchSlidesList = async () => {
    setLoadingSlides(true);
    try {
      const s = await fetchSelectedPerformances();
      setSlides(s);
    } catch (error) {
      console.error("Error loading selected performances:", error);
    } finally {
      setLoadingSlides(false);
    }
  };

  const fetchMessages = async () => {
    setLoadingMessages(true);
    try {
      const qSnapshot = await getDocs(collection(db, "contacts"));
      const msgs: ContactMessage[] = [];
      qSnapshot.forEach((doc) => {
        msgs.push({ ...doc.data(), id: doc.id } as ContactMessage);
      });
      msgs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setMessages(msgs);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const fetchVideosList = async () => {
    setLoadingVideos(true);
    try {
      const v = await fetchVideos();
      setVideos(v);
    } catch (error) {
      console.error("Error loading videos:", error);
    } finally {
      setLoadingVideos(false);
    }
  };

  const fetchPressList = async () => {
    setLoadingPress(true);
    try {
      const p = await fetchPress();
      setPressItems(p);
    } catch (error) {
      console.error("Error loading press reviews:", error);
    } finally {
      setLoadingPress(false);
    }
  };

  const fetchAllSettings = async () => {
    setLoadingSettings(true);
    try {
      const [theme, bio, contact] = await Promise.all([
        fetchThemeSettings(),
        fetchBiographySettings(),
        fetchContactSettings()
      ]);
      setThemeSettings(theme);
      setBioSettings(bio);
      setContactSettings(contact);
    } catch (error) {
      console.error("Error loading CMS settings:", error);
    } finally {
      setLoadingSettings(false);
    }
  };


  const handleImageCropUpload = (file: File | undefined, onCropSuccess: (base64: string) => void, aspect?: number) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target?.result === 'string') {
        setCropTarget({ 
          src: e.target.result, 
          aspect, 
          onCrop: (base64) => { 
            onCropSuccess(base64); 
            setCropTarget(null); 
            triggerAlert('success', 'Image processed successfully!');
          } 
        });
      }
    };
    reader.readAsDataURL(file);
  };
  const handleLogin = async () => {
    try {
      await loginWithGoogle();
      triggerAlert('success', 'Logged in successfully!');
      refreshData();
    } catch (err) {
      triggerAlert('error', 'Login failed. Please verify credentials.');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      triggerAlert('success', 'Logged out successfully!');
    } catch (err) {
      triggerAlert('error', 'Logout failed.');
    }
  };

  const triggerAlert = (type: 'success' | 'error', text: string) => {
    setAlertMsg({ type, text });
    setTimeout(() => setAlertMsg(null), 4000);
  };

  // Schedule CRUD
  const startNewSchedule = () => {
    setEditingSchedule({
      date: new Date().toISOString().split('T')[0],
      title: { EN: '', DE: '', KO: '' },
      location: { EN: '', DE: '', KO: '' },
      role: { EN: '', DE: '', KO: '' },
      category: 'Opera',
      link: ''
    });
  };

  const saveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSchedule) return;
    setLoadingAction(true);
    try {
      const scheduleRef = collection(db, "schedule");
      if (editingSchedule.id) {
        await updateDoc(doc(db, "schedule", editingSchedule.id), editingSchedule);
        triggerAlert('success', t.adminUpdateSuccess);
      } else {
        await addDoc(scheduleRef, editingSchedule);
        triggerAlert('success', t.adminAddSuccess);
      }
      setEditingSchedule(null);
      refreshData();
    } catch (error) {
      console.error("Error saving schedule:", error);
      triggerAlert('error', 'Error saving performance.');
    } finally {
      setLoadingAction(false);
    }
  };

  const deleteSchedule = async (id: string) => {
    setConfirmPrompt({
      message: "Are you sure you want to delete this performance?",
      onConfirm: async () => {
        setConfirmPrompt(null);
        setLoadingAction(true);
        // Optimistic Update: filter out deleted item immediately
        setLocalScheduleItems(prev => prev.filter(item => item.id !== id));
        try {
          await deleteDoc(doc(db, "schedule", id));
          triggerAlert('success', t.adminDeleteSuccess);
          refreshData();
        } catch (err) {
          console.error("Error deleting schedule performance:", err);
          triggerAlert('error', 'Error deleting performance.');
          // Revert from original props if failed
          setLocalScheduleItems(scheduleItems);
        } finally {
          setLoadingAction(false);
        }
      }
    });
  };

  // Portfolio CRUD
  const startNewPortfolio = () => {
    setEditingPortfolio({
      url: '',
      category: 'Portrait',
      title: { EN: '', DE: '', KO: '' }
    });
  };

  const savePortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPortfolio) return;
    setLoadingAction(true);
    try {
      const portfolioRef = collection(db, "portfolio");
      if (editingPortfolio.id) {
        await updateDoc(doc(db, "portfolio", editingPortfolio.id), editingPortfolio);
        triggerAlert('success', t.adminUpdateSuccess);
      } else {
        await addDoc(portfolioRef, editingPortfolio);
        triggerAlert('success', t.adminAddSuccess);
      }
      setEditingPortfolio(null);
      refreshData();
    } catch (error) {
      console.error("Error saving portfolio:", error);
      triggerAlert('error', 'Error saving photo.');
    } finally {
      setLoadingAction(false);
    }
  };

  const deletePortfolio = async (id: string) => {
    setConfirmPrompt({
      message: "Are you sure you want to delete this photo?",
      onConfirm: async () => {
        setConfirmPrompt(null);
        setLoadingAction(true);
        // Optimistic Update: filter out deleted item immediately
        setLocalPortfolioItems(prev => prev.filter(item => item.id !== id));
        try {
          await deleteDoc(doc(db, "portfolio", id));
          triggerAlert('success', t.adminDeleteSuccess);
          refreshData();
        } catch (err) {
          console.error("Error deleting portfolio item:", err);
          triggerAlert('error', 'Error deleting portfolio photo.');
          // Revert from original props if failed
          setLocalPortfolioItems(portfolioItems);
        } finally {
          setLoadingAction(false);
        }
      }
    });
  };

  // Videos CRUD
  const startNewVideo = () => {
    setEditingVideo({
      youtubeId: '',
      title: { EN: '', DE: '', KO: '' },
      role: { EN: '', DE: '', KO: '' }
    });
  };

  const saveVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVideo) return;
    setLoadingAction(true);
    try {
      await saveVideoItem(editingVideo as VideoItem);
      triggerAlert('success', t.adminUpdateSuccess);
      setEditingVideo(null);
      fetchVideosList();
      refreshData();
    } catch (err) {
      console.error(err);
      triggerAlert('error', 'Error saving video.');
    } finally {
      setLoadingAction(false);
    }
  };

  const deleteVideo = async (id: string) => {
    setConfirmPrompt({
      message: "Delete this video from list?",
      onConfirm: async () => {
        setConfirmPrompt(null);
        setLoadingAction(true);
        // Filter locally immediately for a seamless, lag-free UI update
        setVideos(prev => prev.filter(v => v.id !== id));
        try {
          await deleteVideoItem(id);
          triggerAlert('success', t.adminDeleteSuccess);
          refreshData();
        } catch (err) {
          console.error("Error deleting video:", err);
          triggerAlert('error', 'Error deleting video.');
          fetchVideosList();
        } finally {
          setLoadingAction(false);
        }
      }
    });
  };

  // Press Reviews CRUD
  const startNewPress = () => {
    setEditingPress({
      source: '',
      rating: 5,
      quote: { EN: '', DE: '', KO: '' },
      author: '',
      date: new Date().toISOString().split('T')[0],
      link: '',
      type: 'Review'
    });
  };

  const savePress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPress) return;
    setLoadingAction(true);
    try {
      await savePressItem(editingPress as PressItem);
      triggerAlert('success', t.adminUpdateSuccess);
      setEditingPress(null);
      fetchPressList();
    } catch (err) {
      console.error(err);
      triggerAlert('error', 'Error saving press review.');
    } finally {
      setLoadingAction(false);
    }
  };

  const deletePress = async (id: string) => {
    setConfirmPrompt({
      message: "Are you sure you want to delete this press review?",
      onConfirm: async () => {
        setConfirmPrompt(null);
        setLoadingAction(true);
        // Filter locally immediately for a seamless, lag-free UI update
        setPressItems(prev => prev.filter(p => p.id !== id));
        try {
          await deletePressItem(id);
          triggerAlert('success', t.adminDeleteSuccess);
        } catch (err) {
          console.error("Error deleting press review:", err);
          triggerAlert('error', 'Error deleting press review.');
          fetchPressList();
        } finally {
          setLoadingAction(false);
        }
      }
    });
  };

  // Settings savers
  const saveThemeSettingsAction = async () => {
    setLoadingAction(true);
    try {
      await saveThemeSettings(themeSettings);
      triggerAlert('success', 'Theme settings saved successfully!');
      
      // Dynamic apply theme CSS styles immediately to the DOM
      const rootStyle = document.documentElement.style;
      rootStyle.setProperty('--color-bg', themeSettings.bg);
      rootStyle.setProperty('--color-text', themeSettings.text);
      rootStyle.setProperty('--color-accent', themeSettings.accent);
      
      window.dispatchEvent(new CustomEvent('themeChanged', { detail: themeSettings }));
    } catch (err) {
      triggerAlert('error', 'Failed to save theme settings.');
    } finally {
      setLoadingAction(false);
    }
  };

  const saveBiographySettingsAction = async () => {
    setLoadingAction(true);
    try {
      await saveBiographySettings(bioSettings);
      triggerAlert('success', 'Biography texts updated!');
      window.dispatchEvent(new CustomEvent('bioChanged', { detail: bioSettings }));
    } catch (err) {
      triggerAlert('error', 'Failed to save biography.');
    } finally {
      setLoadingAction(false);
    }
  };

  const saveContactSettingsAction = async () => {
    setLoadingAction(true);
    try {
      await saveContactSettings(contactSettings);
      triggerAlert('success', 'Contact info updated!');
      window.dispatchEvent(new CustomEvent('contactChanged', { detail: contactSettings }));
    } catch (err) {
      triggerAlert('error', 'Failed to save contact info.');
    } finally {
      setLoadingAction(false);
    }
  };

  const deleteMessage = async (id: string) => {
    setConfirmPrompt({
      message: "Delete this inquiry log?",
      onConfirm: async () => {
        setConfirmPrompt(null);
        // Filter locally immediately for a seamless, lag-free UI update
        setMessages(prev => prev.filter(msg => msg.id !== id));
        try {
          await deleteDoc(doc(db, "contacts", id));
          triggerAlert('success', 'Inquiry deleted successfully!');
        } catch (err) {
          console.error("Error deleting inquiry:", err);
          triggerAlert('error', 'Error deleting inquiry.');
          fetchMessages();
        }
      }
    });
  };

  const selectThemePreset = (preset: { bg: string, text: string, accent: string }) => {
    setThemeSettings(preset);
  };

  // Slides CRUD
  const startNewSlide = () => {
    setEditingSlide({
      image: '',
      bgPosition: 'center',
      production: { EN: '', DE: '', KO: '' },
      role: { EN: '', DE: '', KO: '' },
      house: { EN: '', DE: '', KO: '' }
    });
  };

  const saveSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlide) return;
    setLoadingAction(true);
    try {
      await saveSelectedPerformance(editingSlide as PerformanceSlide);
      triggerAlert('success', t.adminUpdateSuccess);
      setEditingSlide(null);
      fetchSlidesList();
      refreshData();
    } catch (err) {
      console.error(err);
      triggerAlert('error', 'Error saving slide.');
    } finally {
      setLoadingAction(false);
    }
  };

  const deleteSlide = async (id: string) => {
    setConfirmPrompt({
      message: "Delete this hero performance slide?",
      onConfirm: async () => {
        setConfirmPrompt(null);
        setLoadingAction(true);
        // Filter locally immediately for a seamless, lag-free UI update
        setSlides(prev => prev.filter(s => s.id !== id));
        try {
          await deleteSelectedPerformance(id);
          triggerAlert('success', t.adminDeleteSuccess);
          refreshData();
        } catch (err) {
          console.error("Error deleting slide:", err);
          triggerAlert('error', 'Error deleting slide.');
          fetchSlidesList();
        } finally {
          setLoadingAction(false);
        }
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div id="admin-panel-backdrop" className="fixed inset-0 z-110 bg-black/80 backdrop-blur-sm flex justify-end">
      <motion.div
        id="admin-drawer-container"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'tween', duration: 0.35 }}
        className="w-full max-w-3xl bg-neutral-950 border-l border-neutral-900 h-screen flex flex-col relative"
      >
        {/* Header bar */}
        <div className="p-6 border-b border-neutral-900 flex justify-between items-center bg-black/40 animate-none">
          <div className="flex items-center space-x-2.5">
            <div className="w-2.5 h-2.5 bg-[#C9A227] rounded-full animate-pulse accent-bg" />
            <h2 className="font-serif text-lg tracking-[0.1em] text-white uppercase">
              {t.adminTitle}
            </h2>
          </div>
          <button
            id="close-admin-panel"
            onClick={onClose}
            className="p-1.5 border border-neutral-800 hover:border-neutral-500 rounded text-neutral-400 hover:text-white transition-all cursor-pointer accent-hover-border"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Alert Notification */}
        <AnimatePresence>
          {alertMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`absolute top-20 left-6 right-6 z-120 p-4 border rounded flex items-center space-x-2 ${
                alertMsg.type === 'success' 
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' 
                  : 'border-rose-500/30 bg-rose-500/10 text-rose-400'
              }`}
            >
              {alertMsg.type === 'success' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              <span className="text-xs font-sans tracking-wide">{alertMsg.text}</span>
            </motion.div>
          )}

          {/* Confirm Prompt Modal */}
          {confirmPrompt && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-130 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
            >
              <div className="bg-neutral-900 border border-neutral-800 p-6 rounded shadow-2xl max-w-sm w-full space-y-5 text-center">
                <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
                <div className="space-y-1">
                  <h4 className="text-sm font-serif tracking-wider text-white">Confirm Deletion</h4>
                  <p className="text-xs text-neutral-400 font-sans leading-relaxed">{confirmPrompt.message}</p>
                </div>
                <div className="flex space-x-3 pt-2">
                  <button
                    onClick={() => setConfirmPrompt(null)}
                    className="flex-1 py-2.5 border border-neutral-800 hover:border-neutral-600 rounded text-neutral-400 hover:text-white text-xs tracking-wider uppercase transition-colors font-sans"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmPrompt.onConfirm}
                    className="flex-1 py-2.5 bg-rose-500/20 hover:bg-rose-500/80 text-rose-400 hover:text-white border border-rose-500/30 hover:border-rose-500 rounded text-xs tracking-wider uppercase font-semibold transition-colors font-sans"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Non-Authenticated State (Sign-In page) */}
        {!user ? (
          <div id="admin-login-wrapper" className="flex-1 flex flex-col justify-center items-center p-8 max-w-md mx-auto text-center space-y-6">
            <div className="w-16 h-16 border border-neutral-800 bg-neutral-900/20 rounded-full flex items-center justify-center text-[#C9A227] mb-2 accent-color">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-serif text-xl tracking-wide text-white mb-2">
                Authorized Access Only
              </h3>
              <p className="text-xs text-neutral-500 leading-relaxed font-sans">
                This secure portal allows Baritone Hyunkyum Kim to perform real-time content management over schedules, portfolios, videos, reviews, and design configurations.
              </p>
            </div>
            
            <button
              id="admin-google-login"
              onClick={handleLogin}
              className="w-full py-3.5 bg-[#C9A227] hover:bg-[#ebd04e] text-black font-semibold rounded-sm shadow-md transition-all flex items-center justify-center space-x-3 text-xs tracking-widest uppercase cursor-pointer font-sans accent-bg"
            >
              <LogIn className="w-4 h-4" />
              <span>{t.loginWithGoogle}</span>
            </button>
          </div>
        ) : (
          /* Authenticated Admin Dashboard (CRUD control) */
          <div id="admin-dashboard-container" className="flex-1 flex flex-col min-h-0">
            {/* Top Auth User Indicator & Tabs */}
            <div className="p-4 border-b border-neutral-900 bg-neutral-950/60 flex flex-wrap justify-between items-center gap-3">
              <div className="flex items-center space-x-2.5 bg-neutral-900 px-3 py-1.5 rounded-sm">
                <UserIcon className="w-3.5 h-3.5 text-[#C9A227] accent-color" />
                <span className="text-xs text-neutral-300 font-sans tracking-wide">
                  {user.displayName || user.email}
                </span>
              </div>

              {/* Toggle Content tabs */}
              <div className="flex flex-wrap gap-1">
                {(['settings', 'biography', 'slides', 'schedule', 'portfolio', 'press', 'videos', 'messages'] as AdminTab[]).map((tab) => (
                  <button
                    key={tab}
                    id={`tab-admin-${tab}`}
                    onClick={() => { 
                      setActiveTab(tab); 
                      setEditingSchedule(null); 
                      setEditingPortfolio(null);
                      setEditingVideo(null);
                      setEditingPress(null);
                      setEditingSlide(null);
                    }}
                    className={`px-3 py-1.5 text-[10px] uppercase font-semibold font-sans tracking-wider rounded-sm flex items-center space-x-1 border transition-colors ${
                      activeTab === tab 
                        ? 'border-[#C9A227]/40 bg-[#C9A227]/10 text-[#C9A227] accent-color' 
                        : 'border-transparent text-neutral-400 hover:text-white'
                    }`}
                  >
                    {tab === 'schedule' && <Calendar className="w-3 h-3" />}
                    {tab === 'portfolio' && <Image className="w-3 h-3" />}
                    {tab === 'press' && <Award className="w-3 h-3" />}
                    {tab === 'videos' && <Tv className="w-3 h-3" />}
                    {tab === 'settings' && <Settings className="w-3 h-3" />}
                    {tab === 'messages' && <MessageSquare className="w-3 h-3" />}
                    {tab === 'slides' && <Image className="w-3 h-3 text-[#C9A227]" />}
                    {tab === 'biography' && <FileText className="w-3 h-3 text-[#C9A227]" />}
                    <span>
                      {tab === 'messages' ? 'Inquiries' : 
                       tab === 'press' ? t.navPress : 
                       tab === 'slides' ? 'Hero Slides' : 
                       tab === 'biography' ? 'Biography' :
                       tab}
                    </span>
                  </button>
                ))}
              </div>

              <button
                id="admin-logout-btn"
                onClick={handleLogout}
                className="px-2.5 py-1 text-[10px] border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-500 rounded transition-all cursor-pointer font-sans"
              >
                {t.logout}
              </button>
            </div>

            {/* Dashboard Workspace */}
            <div className="flex-1 overflow-y-auto p-6 min-h-0">
              
              {/* TAB 1: SCHEDULE MANAGEMENT */}
              {activeTab === 'schedule' && (
                <div id="admin-schedule-tab" className="space-y-6">
                  {!editingSchedule ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-serif tracking-wider text-neutral-300">
                          Performances Directory
                        </h3>
                        <button
                          id="admin-add-schedule-btn"
                          onClick={startNewSchedule}
                          className="px-4 py-2 bg-[#C9A227] hover:bg-[#ebd04e] text-black rounded-sm text-xs font-semibold tracking-wider uppercase flex items-center space-x-1.5 transition-colors cursor-pointer font-sans accent-bg"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add New</span>
                        </button>
                      </div>

                      <div className="divide-y divide-neutral-900 border border-neutral-900 bg-neutral-950/40 rounded-sm">
                        {localScheduleItems.length === 0 ? (
                          <div className="p-8 text-center text-neutral-500 text-xs font-sans">No scheduled performances found.</div>
                        ) : localScheduleItems.map((item) => (
                          <div key={item.id} className="p-4 flex justify-between items-center hover:bg-neutral-900/20 transition-all">
                            <div className="space-y-1">
                              <span className="text-[10px] font-mono tracking-wider text-neutral-500 block">
                                {item.date} • {item.category}
                              </span>
                              <h4 className="text-sm font-sans font-medium text-white">
                                {item.title[currentLang] || item.title['EN']}
                              </h4>
                              <p className="text-xs text-neutral-400">
                                {item.role[currentLang] || item.role['EN']} @ {item.location[currentLang] || item.location['EN']}
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                id={`admin-edit-schedule-${item.id}`}
                                onClick={() => setEditingSchedule(item)}
                                className="p-1.5 border border-neutral-800 hover:border-neutral-500 text-neutral-400 hover:text-white rounded transition-colors cursor-pointer"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                id={`admin-delete-schedule-${item.id}`}
                                onClick={() => deleteSchedule(item.id)}
                                className="p-1.5 border border-rose-500/20 hover:border-rose-500 text-rose-400 hover:bg-rose-500/5 rounded transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* Schedule Editor form */
                    <form id="schedule-edit-form" onSubmit={saveSchedule} className="space-y-4 bg-neutral-950 p-5 rounded-sm border border-neutral-900">
                      <h4 className="text-sm font-serif tracking-wider text-[#C9A227] uppercase accent-color">
                        {editingSchedule.id ? 'Edit Performance' : 'New Performance Schedule'}
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] tracking-wider text-neutral-400 font-sans uppercase block">{t.fieldDate}</label>
                          <input
                            type="date"
                            required
                            value={editingSchedule.date || ''}
                            onChange={(e) => setEditingSchedule({ ...editingSchedule, date: e.target.value })}
                            className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#C9A227]/50 rounded-sm px-3 py-2 text-xs text-white"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] tracking-wider text-neutral-400 font-sans uppercase block">{t.fieldCategory}</label>
                          <select
                            value={editingSchedule.category || 'Opera'}
                            onChange={(e) => setEditingSchedule({ ...editingSchedule, category: e.target.value as any })}
                            className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#C9A227]/50 rounded-sm px-3 py-2 text-xs text-white"
                          >
                            <option value="Opera">Opera</option>
                            <option value="Concert">Concert</option>
                            <option value="Recital">Recital</option>
                            <option value="Gala">Gala</option>
                          </select>
                        </div>
                      </div>

                      {/* Translatable Titles */}
                      <div className="space-y-1">
                        <label className="text-[10px] tracking-wider text-neutral-400 font-sans uppercase block">Performance Title</label>
                        <div className="grid grid-cols-1 gap-2 border border-neutral-900 p-3 rounded bg-black/25">
                          <input
                            type="text"
                            required
                            placeholder="EN: e.g. Le Nozze di Figaro"
                            value={editingSchedule.title?.EN || ''}
                            onChange={(e) => setEditingSchedule({
                              ...editingSchedule,
                              title: { ...editingSchedule.title!, EN: e.target.value }
                            })}
                            className="w-full bg-neutral-900 border border-neutral-800 px-3 py-1.5 text-xs text-white"
                          />
                          <input
                            type="text"
                            placeholder="DE: e.g. Die Hochzeit des Figaro"
                            value={editingSchedule.title?.DE || ''}
                            onChange={(e) => setEditingSchedule({
                              ...editingSchedule,
                              title: { ...editingSchedule.title!, DE: e.target.value }
                            })}
                            className="w-full bg-neutral-900 border border-neutral-800 px-3 py-1.5 text-xs text-white"
                          />
                          <input
                            type="text"
                            placeholder="KO: e.g. 피가로의 결혼"
                            value={editingSchedule.title?.KO || ''}
                            onChange={(e) => setEditingSchedule({
                              ...editingSchedule,
                              title: { ...editingSchedule.title!, KO: e.target.value }
                            })}
                            className="w-full bg-neutral-900 border border-neutral-800 px-3 py-1.5 text-xs text-white"
                          />
                        </div>
                      </div>

                      {/* Translatable Roles */}
                      <div className="space-y-1">
                        <label className="text-[10px] tracking-wider text-neutral-400 font-sans uppercase block">Roles / Description</label>
                        <div className="grid grid-cols-1 gap-2 border border-neutral-900 p-3 rounded bg-black/25">
                          <input
                            type="text"
                            required
                            placeholder="EN: e.g. Figaro"
                            value={editingSchedule.role?.EN || ''}
                            onChange={(e) => setEditingSchedule({
                              ...editingSchedule,
                              role: { ...editingSchedule.role!, EN: e.target.value }
                            })}
                            className="w-full bg-neutral-900 border border-neutral-800 px-3 py-1.5 text-xs text-white"
                          />
                          <input
                            type="text"
                            placeholder="DE: e.g. Figaro"
                            value={editingSchedule.role?.DE || ''}
                            onChange={(e) => setEditingSchedule({
                              ...editingSchedule,
                              role: { ...editingSchedule.role!, DE: e.target.value }
                            })}
                            className="w-full bg-neutral-900 border border-neutral-800 px-3 py-1.5 text-xs text-white"
                          />
                          <input
                            type="text"
                            placeholder="KO: e.g. 피가로 역"
                            value={editingSchedule.role?.KO || ''}
                            onChange={(e) => setEditingSchedule({
                              ...editingSchedule,
                              role: { ...editingSchedule.role!, KO: e.target.value }
                            })}
                            className="w-full bg-neutral-900 border border-neutral-800 px-3 py-1.5 text-xs text-white"
                          />
                        </div>
                      </div>

                      {/* Translatable Locations */}
                      <div className="space-y-1">
                        <label className="text-[10px] tracking-wider text-neutral-400 font-sans uppercase block">Locations</label>
                        <div className="grid grid-cols-1 gap-2 border border-neutral-900 p-3 rounded bg-black/25">
                          <input
                            type="text"
                            required
                            placeholder="EN: e.g. National Theatre, Munich"
                            value={editingSchedule.location?.EN || ''}
                            onChange={(e) => setEditingSchedule({
                              ...editingSchedule,
                              location: { ...editingSchedule.location!, EN: e.target.value }
                            })}
                            className="w-full bg-neutral-900 border border-neutral-800 px-3 py-1.5 text-xs text-white"
                          />
                          <input
                            type="text"
                            placeholder="DE: e.g. Nationaltheater, München"
                            value={editingSchedule.location?.DE || ''}
                            onChange={(e) => setEditingSchedule({
                              ...editingSchedule,
                              location: { ...editingSchedule.location!, DE: e.target.value }
                            })}
                            className="w-full bg-neutral-900 border border-neutral-800 px-3 py-1.5 text-xs text-white"
                          />
                          <input
                            type="text"
                            placeholder="KO: e.g. 뮌헨 국립극장"
                            value={editingSchedule.location?.KO || ''}
                            onChange={(e) => setEditingSchedule({
                              ...editingSchedule,
                              location: { ...editingSchedule.location!, KO: e.target.value }
                            })}
                            className="w-full bg-neutral-900 border border-neutral-800 px-3 py-1.5 text-xs text-white"
                          />
                        </div>
                      </div>

                      {/* Optional Ticket link */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] tracking-wider text-neutral-400 font-sans uppercase block">Ticket/Details URL Link</label>
                        <div className="flex items-center space-x-2 bg-neutral-900 border border-neutral-800 rounded-sm px-3 py-2 text-xs text-white">
                          <Link className="w-4 h-4 text-[#C9A227] shrink-0 accent-color" />
                          <input
                            type="url"
                            placeholder="https://..."
                            value={editingSchedule.link || ''}
                            onChange={(e) => setEditingSchedule({ ...editingSchedule, link: e.target.value })}
                            className="w-full bg-transparent border-0 focus:ring-0 p-0 text-xs"
                          />
                        </div>
                      </div>

                      {/* Form Actions */}
                      <div className="flex justify-end space-x-2.5 pt-2">
                        <button
                          type="button"
                          id="cancel-schedule-edit"
                          onClick={() => setEditingSchedule(null)}
                          className="px-4 py-2 border border-neutral-800 hover:border-neutral-600 rounded text-neutral-400 hover:text-white text-xs tracking-wider uppercase transition-colors cursor-pointer font-sans"
                        >
                          {t.adminCancel}
                        </button>
                        <button
                          type="submit"
                          id="save-schedule-btn"
                          disabled={loadingAction}
                          className="px-5 py-2 bg-[#C9A227] hover:bg-[#ebd04e] text-black rounded text-xs tracking-wider uppercase font-semibold transition-colors cursor-pointer font-sans accent-bg"
                        >
                          {loadingAction ? t.adminSaving : t.adminSave}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* TAB 2: PORTFOLIO MANAGEMENT */}
              {activeTab === 'portfolio' && (
                <div id="admin-portfolio-tab" className="space-y-6">
                  {!editingPortfolio ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-serif tracking-wider text-neutral-300">
                          Portfolio Gallery
                        </h3>
                        <button
                          id="admin-add-portfolio-btn"
                          onClick={startNewPortfolio}
                          className="px-4 py-2 bg-[#C9A227] hover:bg-[#ebd04e] text-black rounded-sm text-xs font-semibold tracking-wider uppercase flex items-center space-x-1.5 transition-colors cursor-pointer font-sans accent-bg"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Photo</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {localPortfolioItems.map((item) => (
                          <div key={item.id} className="relative group rounded-sm overflow-hidden border border-neutral-900 bg-neutral-950 aspect-square">
                            <img 
                              src={item.url} 
                              alt="Portfolio small thumb" 
                              className="w-full h-full object-cover" 
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3">
                              <span className="text-[9px] tracking-widest text-[#C9A227] font-sans uppercase font-bold accent-color">
                                {item.category}
                              </span>
                              <div className="flex justify-end space-x-1.5">
                                <button
                                  id={`admin-edit-portfolio-${item.id}`}
                                  onClick={() => setEditingPortfolio(item)}
                                  className="p-1 border border-neutral-700 bg-neutral-900 text-neutral-400 hover:text-white rounded hover:border-neutral-500 cursor-pointer"
                                >
                                  <Edit className="w-3 h-3" />
                                </button>
                                <button
                                  id={`admin-delete-portfolio-${item.id}`}
                                  onClick={() => deletePortfolio(item.id)}
                                  className="p-1 border border-rose-500/30 bg-neutral-900 text-rose-400 hover:text-rose-300 rounded hover:border-rose-500 cursor-pointer"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* Portfolio Editor form */
                    <form id="portfolio-edit-form" onSubmit={savePortfolio} className="space-y-4 bg-neutral-950 p-5 rounded-sm border border-neutral-900">
                      <h4 className="text-sm font-serif tracking-wider text-[#C9A227] uppercase accent-color">
                        {editingPortfolio.id ? 'Edit Portfolio Photo' : 'New Portfolio Photo'}
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <label className="text-[10px] tracking-wider text-neutral-400 font-sans uppercase block">Image File Upload / URL</label>
                          
                          {/* Computer File Upload Block */}
                          <div className="border border-dashed border-neutral-800 rounded-sm p-4 bg-neutral-900/30 hover:bg-neutral-900/60 transition-colors flex flex-col items-center justify-center space-y-2 relative group text-center min-h-[110px]">
                            <input
                              type="file"
                              accept="image/*"
                              disabled={isUploadingFile}
                              onChange={(e) => {
                                handleImageCropUpload(e.target.files?.[0], (base64) => {
                                  setEditingPortfolio({ ...editingPortfolio, url: base64 });
                                });
                                e.target.value = '';
                              }}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <Upload className={`w-5 h-5 ${isUploadingFile ? 'animate-bounce text-[#C9A227]' : 'text-neutral-500 group-hover:text-[#C9A227]'} transition-colors`} />
                            <div className="space-y-0.5">
                              <p className="text-[11px] text-neutral-300 font-sans font-medium">
                                {isUploadingFile ? 'Processing...' : 'Upload from Computer'}
                              </p>
                              <p className="text-[9px] text-neutral-500 font-sans">
                                Click or drag any photo file
                              </p>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[9px] text-neutral-500 uppercase block font-sans">Or Enter Raw Image URL</span>
                            <input
                              type="text"
                              required
                              placeholder="e.g. https://images.unsplash.com/... or base64"
                              value={editingPortfolio.url || ''}
                              onChange={(e) => setEditingPortfolio({ ...editingPortfolio, url: e.target.value })}
                              className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#C9A227]/50 rounded-sm px-3 py-2 text-xs text-white"
                            />
                          </div>
                        </div>

                        {/* Image Preview Block */}
                        <div className="space-y-1.5 flex flex-col">
                          <span className="text-[10px] tracking-wider text-neutral-400 font-sans uppercase block">Image Preview</span>
                          <div className="flex-1 min-h-[150px] bg-neutral-900/20 border border-neutral-800 rounded-sm flex items-center justify-center overflow-hidden p-2 relative">
                            {editingPortfolio.url ? (
                              <>
                                <img
                                  src={editingPortfolio.url}
                                  alt="Preview"
                                  className="max-h-[160px] max-w-full object-contain rounded-sm"
                                  referrerPolicy="no-referrer"
                                />
                                <button
                                  type="button"
                                  onClick={() => setEditingPortfolio({ ...editingPortfolio, url: '' })}
                                  className="absolute top-2 right-2 p-1 bg-black/60 hover:bg-black/90 text-neutral-400 hover:text-white rounded-full transition-colors cursor-pointer"
                                  title="Clear Image"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : (
                              <div className="text-center text-neutral-600 space-y-1 p-4">
                                <Image className="w-8 h-8 mx-auto stroke-1" />
                                <p className="text-[10px] font-sans">No image selected or uploaded yet.</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] tracking-wider text-neutral-400 font-sans uppercase block">{t.fieldImageCategory}</label>
                        <select
                          value={editingPortfolio.category || 'Portrait'}
                          onChange={(e) => setEditingPortfolio({ ...editingPortfolio, category: e.target.value as any })}
                          className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#C9A227]/50 rounded-sm px-3 py-2 text-xs text-white"
                        >
                          <option value="Portrait">Portrait</option>
                          <option value="Stage">Stage</option>
                          <option value="Backstage">Backstage</option>
                        </select>
                      </div>

                      {/* Photo Description text */}
                      <div className="space-y-1">
                        <label className="text-[10px] tracking-wider text-neutral-400 font-sans uppercase block">Photo Description / Title</label>
                        <div className="grid grid-cols-1 gap-2 border border-neutral-900 p-3 rounded bg-black/25">
                          <input
                            type="text"
                            placeholder="EN Description"
                            value={editingPortfolio.title?.EN || ''}
                            onChange={(e) => setEditingPortfolio({
                              ...editingPortfolio,
                              title: { ...editingPortfolio.title!, EN: e.target.value }
                            })}
                            className="w-full bg-neutral-900 border border-neutral-800 px-3 py-1.5 text-xs text-white"
                          />
                          <input
                            type="text"
                            placeholder="DE Beschreibung"
                            value={editingPortfolio.title?.DE || ''}
                            onChange={(e) => setEditingPortfolio({
                              ...editingPortfolio,
                              title: { ...editingPortfolio.title!, DE: e.target.value }
                            })}
                            className="w-full bg-neutral-900 border border-neutral-800 px-3 py-1.5 text-xs text-white"
                          />
                          <input
                            type="text"
                            placeholder="KO 설명"
                            value={editingPortfolio.title?.KO || ''}
                            onChange={(e) => setEditingPortfolio({
                              ...editingPortfolio,
                              title: { ...editingPortfolio.title!, KO: e.target.value }
                            })}
                            className="w-full bg-neutral-900 border border-neutral-800 px-3 py-1.5 text-xs text-white"
                          />
                        </div>
                      </div>

                      {/* Form Actions */}
                      <div className="flex justify-end space-x-2.5 pt-2">
                        <button
                          type="button"
                          id="cancel-portfolio-edit"
                          onClick={() => setEditingPortfolio(null)}
                          className="px-4 py-2 border border-neutral-800 hover:border-neutral-600 rounded text-neutral-400 hover:text-white text-xs tracking-wider uppercase transition-colors cursor-pointer font-sans"
                        >
                          {t.adminCancel}
                        </button>
                        <button
                          type="submit"
                          id="save-portfolio-btn"
                          disabled={loadingAction}
                          className="px-5 py-2 bg-[#C9A227] hover:bg-[#ebd04e] text-black rounded text-xs tracking-wider uppercase font-semibold transition-colors cursor-pointer font-sans accent-bg"
                        >
                          {loadingAction ? t.adminSaving : t.adminSave}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* TAB 3: PRESS REVIEW MANAGEMENT */}
              {activeTab === 'press' && (
                <div id="admin-press-tab" className="space-y-6">
                  {!editingPress ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-serif tracking-wider text-neutral-300">
                          Press Reviews & Articles
                        </h3>
                        <button
                          id="admin-add-press-btn"
                          onClick={startNewPress}
                          className="px-4 py-2 bg-[#C9A227] hover:bg-[#ebd04e] text-black rounded-sm text-xs font-semibold tracking-wider uppercase flex items-center space-x-1.5 transition-colors cursor-pointer font-sans accent-bg"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Review</span>
                        </button>
                      </div>

                      {loadingPress ? (
                        <div className="text-center py-10 text-neutral-500 text-xs">Loading press reviews...</div>
                      ) : (
                        <div className="divide-y divide-neutral-900 border border-neutral-900 bg-neutral-950/40 rounded-sm">
                          {pressItems.length === 0 ? (
                            <div className="p-8 text-center text-neutral-500 text-xs font-sans">No reviews created yet. Seeded defaults will show.</div>
                          ) : pressItems.map((item) => (
                            <div key={item.id} className="p-4 flex justify-between items-center hover:bg-neutral-900/20 transition-all">
                              <div className="space-y-1">
                                <span className="text-[10px] font-mono tracking-wider text-[#C9A227] block accent-color">
                                  {item.source} • {item.date} • {item.type} {'★'.repeat(item.rating || 5)}
                                </span>
                                <h4 className="text-xs font-sans font-medium text-neutral-300 italic max-w-xl line-clamp-2">
                                  "{item.quote[currentLang] || item.quote['EN']}"
                                </h4>
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  id={`admin-edit-press-${item.id}`}
                                  onClick={() => setEditingPress(item)}
                                  className="p-1.5 border border-neutral-800 hover:border-neutral-500 text-neutral-400 hover:text-white rounded transition-colors cursor-pointer"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  id={`admin-delete-press-${item.id}`}
                                  onClick={() => deletePress(item.id)}
                                  className="p-1.5 border border-rose-500/20 hover:border-rose-500 text-rose-400 hover:bg-rose-500/5 rounded transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Press Review Editor Form */
                    <form id="press-edit-form" onSubmit={savePress} className="space-y-4 bg-neutral-950 p-5 rounded-sm border border-neutral-900">
                      <h4 className="text-sm font-serif tracking-wider text-[#C9A227] uppercase accent-color">
                        {editingPress.id ? 'Edit Review' : 'New Press Review / Article'}
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] tracking-wider text-neutral-400 font-sans uppercase block">Review Source</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Opera Magazine"
                            value={editingPress.source || ''}
                            onChange={(e) => setEditingPress({ ...editingPress, source: e.target.value })}
                            className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#C9A227]/50 rounded-sm px-3 py-2 text-xs text-white"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] tracking-wider text-neutral-400 font-sans uppercase block">Rating Star (1-5)</label>
                          <select
                            value={editingPress.rating || 5}
                            onChange={(e) => setEditingPress({ ...editingPress, rating: parseInt(e.target.value) })}
                            className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#C9A227]/50 rounded-sm px-3 py-2 text-xs text-white"
                          >
                            <option value={5}>★★★★★ (5 Stars)</option>
                            <option value={4}>★★★★ (4 Stars)</option>
                            <option value={3}>★★★ (3 Stars)</option>
                            <option value={2}>★★ (2 Stars)</option>
                            <option value={1}>★ (1 Star)</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] tracking-wider text-neutral-400 font-sans uppercase block">Publishing Date</label>
                          <input
                            type="date"
                            required
                            value={editingPress.date || ''}
                            onChange={(e) => setEditingPress({ ...editingPress, date: e.target.value })}
                            className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#C9A227]/50 rounded-sm px-3 py-2 text-xs text-white"
                          />
                        </div>
                      </div>

                      {/* Translatable Quotes */}
                      <div className="space-y-1">
                        <label className="text-[10px] tracking-wider text-neutral-400 font-sans uppercase block">Highlight Quote / Review Excerpt</label>
                        <div className="grid grid-cols-1 gap-2 border border-neutral-900 p-3 rounded bg-black/25">
                          <textarea
                            required
                            rows={2}
                            placeholder="EN Translation"
                            value={editingPress.quote?.EN || ''}
                            onChange={(e) => setEditingPress({
                              ...editingPress,
                              quote: { ...editingPress.quote!, EN: e.target.value }
                            })}
                            className="w-full bg-neutral-900 border border-neutral-800 px-3 py-2 text-xs text-white resize-none"
                          />
                          <textarea
                            placeholder="DE Translation"
                            value={editingPress.quote?.DE || ''}
                            onChange={(e) => setEditingPress({
                              ...editingPress,
                              quote: { ...editingPress.quote!, DE: e.target.value }
                            })}
                            className="w-full bg-neutral-900 border border-neutral-800 px-3 py-2 text-xs text-white resize-none"
                          />
                          <textarea
                            placeholder="KO 번역"
                            value={editingPress.quote?.KO || ''}
                            onChange={(e) => setEditingPress({
                              ...editingPress,
                              quote: { ...editingPress.quote!, KO: e.target.value }
                            })}
                            className="w-full bg-neutral-900 border border-neutral-800 px-3 py-2 text-xs text-white resize-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] tracking-wider text-neutral-400 font-sans uppercase block">Author Name</label>
                          <input
                            type="text"
                            placeholder="e.g. Richard Morrison"
                            value={editingPress.author || ''}
                            onChange={(e) => setEditingPress({ ...editingPress, author: e.target.value })}
                            className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#C9A227]/50 rounded-sm px-3 py-2 text-xs text-white"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] tracking-wider text-neutral-400 font-sans uppercase block">Article External Link / PDF</label>
                          <input
                            type="url"
                            placeholder="https://..."
                            value={editingPress.link || ''}
                            onChange={(e) => setEditingPress({ ...editingPress, link: e.target.value })}
                            className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#C9A227]/50 rounded-sm px-3 py-2 text-xs text-white"
                          />
                        </div>
                      </div>

                      {/* Form Actions */}
                      <div className="flex justify-end space-x-2.5 pt-2">
                        <button
                          type="button"
                          id="cancel-press-edit"
                          onClick={() => setEditingPress(null)}
                          className="px-4 py-2 border border-neutral-800 hover:border-neutral-600 rounded text-neutral-400 hover:text-white text-xs tracking-wider uppercase transition-colors cursor-pointer font-sans"
                        >
                          {t.adminCancel}
                        </button>
                        <button
                          type="submit"
                          id="save-press-btn"
                          disabled={loadingAction}
                          className="px-5 py-2 bg-[#C9A227] hover:bg-[#ebd04e] text-black rounded text-xs tracking-wider uppercase font-semibold transition-colors cursor-pointer font-sans accent-bg"
                        >
                          {loadingAction ? t.adminSaving : t.adminSave}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* TAB 4: VIDEOS MANAGEMENT */}
              {activeTab === 'videos' && (
                <div id="admin-videos-tab" className="space-y-6">
                  {!editingVideo ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-serif tracking-wider text-neutral-300">
                          Repertoire Videos
                        </h3>
                        <button
                          id="admin-add-video-btn"
                          onClick={startNewVideo}
                          className="px-4 py-2 bg-[#C9A227] hover:bg-[#ebd04e] text-black rounded-sm text-xs font-semibold tracking-wider uppercase flex items-center space-x-1.5 transition-colors cursor-pointer font-sans accent-bg"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Video</span>
                        </button>
                      </div>

                      {loadingVideos ? (
                        <div className="text-center py-10 text-neutral-500 text-xs">Loading videos...</div>
                      ) : (
                        <div className="divide-y divide-neutral-900 border border-neutral-900 bg-neutral-950/40 rounded-sm">
                          {videos.length === 0 ? (
                            <div className="p-8 text-center text-neutral-500 text-xs font-sans">No videos created yet. Seeded defaults will show.</div>
                          ) : videos.map((item) => (
                            <div key={item.id} className="p-4 flex justify-between items-center hover:bg-neutral-900/20 transition-all">
                              <div className="space-y-1">
                                <span className="text-[10px] font-mono tracking-wider text-[#C9A227] block accent-color">
                                  YouTube ID: {item.youtubeId}
                                </span>
                                <h4 className="text-xs font-sans font-medium text-white">
                                  {item.title[currentLang] || item.title['EN']}
                                </h4>
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  id={`admin-edit-video-${item.id}`}
                                  onClick={() => setEditingVideo(item)}
                                  className="p-1.5 border border-neutral-800 hover:border-neutral-500 text-neutral-400 hover:text-white rounded transition-colors cursor-pointer"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  id={`admin-delete-video-${item.id}`}
                                  onClick={() => deleteVideo(item.id)}
                                  className="p-1.5 border border-rose-500/20 hover:border-rose-500 text-rose-400 hover:bg-rose-500/5 rounded transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Video Editor form */
                    <form id="video-edit-form" onSubmit={saveVideo} className="space-y-4 bg-neutral-950 p-5 rounded-sm border border-neutral-900">
                      <h4 className="text-sm font-serif tracking-wider text-[#C9A227] uppercase accent-color">
                        {editingVideo.id ? 'Edit Video Link' : 'Add New Video'}
                      </h4>

                      <div className="space-y-1.5">
                        <label className="text-[10px] tracking-wider text-neutral-400 font-sans uppercase block">YouTube Video ID (11 chars)</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. dQw4w9WgXcQ"
                          value={editingVideo.youtubeId || ''}
                          onChange={(e) => setEditingVideo({ ...editingVideo, youtubeId: e.target.value })}
                          className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#C9A227]/50 rounded-sm px-3 py-2 text-xs text-white"
                        />
                      </div>

                      {/* Translatable Titles */}
                      <div className="space-y-1">
                        <label className="text-[10px] tracking-wider text-neutral-400 font-sans uppercase block">Video Title</label>
                        <div className="grid grid-cols-1 gap-2 border border-neutral-900 p-3 rounded bg-black/25">
                          <input
                            type="text"
                            required
                            placeholder="EN Title"
                            value={editingVideo.title?.EN || ''}
                            onChange={(e) => setEditingVideo({
                              ...editingVideo,
                              title: { ...editingVideo.title!, EN: e.target.value }
                            })}
                            className="w-full bg-neutral-900 border border-neutral-800 px-3 py-1.5 text-xs text-white"
                          />
                          <input
                            type="text"
                            placeholder="DE Titel"
                            value={editingVideo.title?.DE || ''}
                            onChange={(e) => setEditingVideo({
                              ...editingVideo,
                              title: { ...editingVideo.title!, DE: e.target.value }
                            })}
                            className="w-full bg-neutral-900 border border-neutral-800 px-3 py-1.5 text-xs text-white"
                          />
                          <input
                            type="text"
                            placeholder="KO 제목"
                            value={editingVideo.title?.KO || ''}
                            onChange={(e) => setEditingVideo({
                              ...editingVideo,
                              title: { ...editingVideo.title!, KO: e.target.value }
                            })}
                            className="w-full bg-neutral-900 border border-neutral-800 px-3 py-1.5 text-xs text-white"
                          />
                        </div>
                      </div>

                      {/* Translatable Roles */}
                      <div className="space-y-1">
                        <label className="text-[10px] tracking-wider text-neutral-400 font-sans uppercase block">Opera Role / Concert Solo (Optional)</label>
                        <div className="grid grid-cols-1 gap-2 border border-neutral-900 p-3 rounded bg-black/25">
                          <input
                            type="text"
                            placeholder="EN Role (e.g. Papageno)"
                            value={editingVideo.role?.EN || ''}
                            onChange={(e) => setEditingVideo({
                              ...editingVideo,
                              role: { ...editingVideo.role!, EN: e.target.value }
                            })}
                            className="w-full bg-neutral-900 border border-neutral-800 px-3 py-1.5 text-xs text-white"
                          />
                          <input
                            type="text"
                            placeholder="DE Rolle"
                            value={editingVideo.role?.DE || ''}
                            onChange={(e) => setEditingVideo({
                              ...editingVideo,
                              role: { ...editingVideo.role!, DE: e.target.value }
                            })}
                            className="w-full bg-neutral-900 border border-neutral-800 px-3 py-1.5 text-xs text-white"
                          />
                          <input
                            type="text"
                            placeholder="KO 역할"
                            value={editingVideo.role?.KO || ''}
                            onChange={(e) => setEditingVideo({
                              ...editingVideo,
                              role: { ...editingVideo.role!, KO: e.target.value }
                            })}
                            className="w-full bg-neutral-900 border border-neutral-800 px-3 py-1.5 text-xs text-white"
                          />
                        </div>
                      </div>

                      {/* Form Actions */}
                      <div className="flex justify-end space-x-2.5 pt-2">
                        <button
                          type="button"
                          id="cancel-video-edit"
                          onClick={() => setEditingVideo(null)}
                          className="px-4 py-2 border border-neutral-800 hover:border-neutral-600 rounded text-neutral-400 hover:text-white text-xs tracking-wider uppercase transition-colors cursor-pointer font-sans"
                        >
                          {t.adminCancel}
                        </button>
                        <button
                          type="submit"
                          id="save-video-btn"
                          disabled={loadingAction}
                          className="px-5 py-2 bg-[#C9A227] hover:bg-[#ebd04e] text-black rounded text-xs tracking-wider uppercase font-semibold transition-colors cursor-pointer font-sans accent-bg"
                        >
                          {loadingAction ? t.adminSaving : t.adminSave}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* TAB 5: SYSTEM GENERAL SETTINGS */}
              {activeTab === 'settings' && (
                <div id="admin-settings-tab" className="space-y-8 pb-10">
                  {loadingSettings ? (
                    <div className="text-center py-10 text-neutral-500 text-xs">Loading application config...</div>
                  ) : (
                    <>
                      {/* Sub-section 1: Theme Customizer */}
                      <div className="space-y-4 border border-neutral-900 bg-neutral-950 p-5 rounded">
                        <div className="flex items-center space-x-2 border-b border-neutral-900 pb-2">
                          <Palette className="w-4 h-4 text-[#C9A227] accent-color" />
                          <h3 className="font-serif text-sm tracking-widest text-white uppercase">Theme Layout Color Schemes</h3>
                        </div>

                        {/* Presets Grid */}
                        <div className="space-y-2">
                          <span className="text-[10px] tracking-wider text-neutral-500 font-sans uppercase">Quick Color Presets</span>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <button
                              type="button"
                              onClick={() => selectThemePreset({ bg: '#000000', text: '#ffffff', accent: '#C9A227' })}
                              className="px-3 py-2 text-left border border-neutral-800 rounded bg-black flex items-center justify-between text-[10px] uppercase tracking-wider text-white"
                            >
                              <span>Gold Accent</span>
                              <div className="w-2.5 h-2.5 rounded-full bg-[#C9A227]" />
                            </button>
                            <button
                              type="button"
                              onClick={() => selectThemePreset({ bg: '#0B0B0B', text: '#f3f4f6', accent: '#A1A1AA' })}
                              className="px-3 py-2 text-left border border-neutral-800 rounded bg-zinc-950 flex items-center justify-between text-[10px] uppercase tracking-wider text-white"
                            >
                              <span>Silver Accent</span>
                              <div className="w-2.5 h-2.5 rounded-full bg-[#A1A1AA]" />
                            </button>
                            <button
                              type="button"
                              onClick={() => selectThemePreset({ bg: '#0A0103', text: '#fafafa', accent: '#800020' })}
                              className="px-3 py-2 text-left border border-neutral-800 rounded bg-red-950/20 flex items-center justify-between text-[10px] uppercase tracking-wider text-white"
                            >
                              <span>Burgundy Accent</span>
                              <div className="w-2.5 h-2.5 rounded-full bg-[#800020]" />
                            </button>
                            <button
                              type="button"
                              onClick={() => selectThemePreset({ bg: '#020617', text: '#f8fafc', accent: '#1E3A8A' })}
                              className="px-3 py-2 text-left border border-neutral-800 rounded bg-blue-950/20 flex items-center justify-between text-[10px] uppercase tracking-wider text-white"
                            >
                              <span>Dark Blue Accent</span>
                              <div className="w-2.5 h-2.5 rounded-full bg-[#1E3A8A]" />
                            </button>
                          </div>
                        </div>

                        {/* Presets custom color picker */}
                        <div className="grid grid-cols-3 gap-4 pt-2">
                          <div className="space-y-1">
                            <span className="text-[10px] text-neutral-400 block font-sans">Background</span>
                            <div className="flex items-center space-x-2">
                              <input
                                type="color"
                                value={themeSettings.bg}
                                onChange={(e) => setThemeSettings({ ...themeSettings, bg: e.target.value })}
                                className="w-7 h-7 bg-transparent border-0 p-0 cursor-pointer"
                              />
                              <span className="text-[10px] font-mono">{themeSettings.bg}</span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] text-neutral-400 block font-sans">Text Content</span>
                            <div className="flex items-center space-x-2">
                              <input
                                type="color"
                                value={themeSettings.text}
                                onChange={(e) => setThemeSettings({ ...themeSettings, text: e.target.value })}
                                className="w-7 h-7 bg-transparent border-0 p-0 cursor-pointer"
                              />
                              <span className="text-[10px] font-mono">{themeSettings.text}</span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] text-neutral-400 block font-sans">Accent Highlight</span>
                            <div className="flex items-center space-x-2">
                              <input
                                type="color"
                                value={themeSettings.accent}
                                onChange={(e) => setThemeSettings({ ...themeSettings, accent: e.target.value })}
                                className="w-7 h-7 bg-transparent border-0 p-0 cursor-pointer"
                              />
                              <span className="text-[10px] font-mono">{themeSettings.accent}</span>
                            </div>
                          </div>
                        </div>

                        {/* Start Home Screen Background Image */}
                        <div className="border-t border-neutral-900 pt-4 mt-4 space-y-4">
                          <span className="text-[11px] font-sans text-neutral-400 uppercase tracking-wider block font-medium">
                            Start Home Screen Background (홈 첫화면 배경)
                          </span>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-3">
                              <span className="text-[10px] text-neutral-500 uppercase block font-sans">
                                Image File Upload / URL
                              </span>
                              
                              {/* Computer File Upload Block */}
                              <div className="border border-dashed border-neutral-800 rounded bg-neutral-900/10 hover:bg-neutral-900/30 transition-colors flex flex-col items-center justify-center space-y-2 relative group text-center min-h-[110px]">
                                <input
                                  type="file"
                                  accept="image/*,video/*"
                                  disabled={isUploadingFile}
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    if (file.type.startsWith('video/')) {
                                      if (file.size > 800 * 1024) {
                                        triggerAlert('error', 'Video file is too large! Maximum 800KB allowed. Use a URL instead.');
                                        return;
                                      }
                                      const reader = new FileReader();
                                      reader.onload = (re) => {
                                        if (typeof re.target?.result === 'string') {
                                          setThemeSettings({ ...themeSettings, homeBg: re.target.result, homeBgType: 'video' });
                                          triggerAlert('success', 'Video processed successfully!');
                                        }
                                      };
                                      reader.readAsDataURL(file);
                                    } else {
                                      handleImageCropUpload(file, (base64) => {
                                        setThemeSettings({ ...themeSettings, homeBg: base64, homeBgType: 'image' });
                                      });
                                    }
                                    e.target.value = '';
                                  }}
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                <Upload className={`w-5 h-5 ${isUploadingFile ? 'animate-bounce text-[#C9A227]' : 'text-neutral-500 group-hover:text-[#C9A227]'} transition-colors`} />
                                <div className="space-y-0.5">
                                  <p className="text-[11px] text-neutral-300 font-sans font-medium">
                                    {isUploadingFile ? 'Processing...' : 'Upload new background'}
                                  </p>
                                  <p className="text-[9px] text-neutral-500 font-sans">
                                    Click or drag any photo file
                                  </p>
                                </div>
                              </div>

                              <div className="space-y-1">
                                <span className="text-[9px] text-neutral-500 uppercase block font-sans">Or Enter Image/Video URL (YouTube supported)</span>
                                <input
                                  type="text"
                                  placeholder="Image URL, MP4 URL, or YouTube URL"
                                  value={themeSettings.homeBg || ''}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    let type: 'image' | 'video' | 'youtube' = 'image';
                                    if (val.includes('youtube.com') || val.includes('youtu.be')) {
                                      type = 'youtube';
                                    } else if (val.match(/\.(mp4|webm|ogg)$/i)) {
                                      type = 'video';
                                    }
                                    setThemeSettings({ ...themeSettings, homeBg: val, homeBgType: type });
                                  }}
                                  className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#C9A227]/50 rounded px-3 py-2 text-xs text-white"
                                />
                              </div>
                            </div>

                            {/* Image Preview Block */}
                            <div className="space-y-1.5 flex flex-col">
                              <span className="text-[10px] tracking-wider text-neutral-400 font-sans uppercase block">Background Image Preview</span>
                              <div className="flex-1 min-h-[150px] bg-neutral-900/20 border border-neutral-800 rounded flex items-center justify-center overflow-hidden p-2 relative">
                                {themeSettings.homeBg ? (
                                  <>
                                    <img
                                      src={themeSettings.homeBg}
                                      alt="Preview"
                                      className="max-h-[160px] max-w-full object-contain rounded"
                                      referrerPolicy="no-referrer"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setThemeSettings({ ...themeSettings, homeBg: '/src/assets/images/opera_stage_1783548365279.jpg' })}
                                      className="absolute top-2 right-2 p-1 bg-black/60 hover:bg-black/90 text-neutral-400 hover:text-white rounded-full transition-colors cursor-pointer"
                                      title="Reset to Default"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                ) : (
                                  <div className="text-center text-neutral-600 space-y-1 p-4">
                                    <Image className="w-8 h-8 mx-auto stroke-1" />
                                    <p className="text-[10px] font-sans">No custom background selected.</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end pt-2">
                          <button
                            type="button"
                            onClick={saveThemeSettingsAction}
                            disabled={loadingAction}
                            className="px-4 py-2 bg-[#C9A227] hover:bg-[#ebd04e] text-black text-xs font-semibold tracking-wider uppercase rounded flex items-center space-x-1.5 transition-colors cursor-pointer accent-bg"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>Save Theme Configuration</span>
                          </button>
                        </div>
                      </div>

                      {/* Sub-section 3: Contact & Management Details */}
                      <div className="space-y-4 border border-neutral-900 bg-neutral-950 p-5 rounded">
                        <div className="flex items-center space-x-2 border-b border-neutral-900 pb-2">
                          <Info className="w-4 h-4 text-[#C9A227] accent-color" />
                          <h3 className="font-serif text-sm tracking-widest text-white uppercase">Contact Details & Management</h3>
                        </div>

                        <div className="space-y-3">
                          <div className="space-y-1.5">
                            <label className="text-[10px] tracking-wider text-neutral-400 font-sans uppercase block">Official Artist Email</label>
                            <input
                              type="email"
                              value={contactSettings.email}
                              onChange={(e) => setContactSettings({ ...contactSettings, email: e.target.value })}
                              className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#C9A227]/50 rounded-sm px-3 py-2 text-xs text-white"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] tracking-wider text-neutral-400 font-sans uppercase block">Management Office Phone</label>
                            <input
                              type="text"
                              value={contactSettings.phone}
                              onChange={(e) => setContactSettings({ ...contactSettings, phone: e.target.value })}
                              className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#C9A227]/50 rounded-sm px-3 py-2 text-xs text-white"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] tracking-wider text-neutral-400 font-sans uppercase block">Agency / Management Label Name</label>
                            <input
                              type="text"
                              value={contactSettings.management}
                              onChange={(e) => setContactSettings({ ...contactSettings, management: e.target.value })}
                              className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#C9A227]/50 rounded-sm px-3 py-2 text-xs text-white"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end pt-2">
                          <button
                            type="button"
                            onClick={saveContactSettingsAction}
                            disabled={loadingAction}
                            className="px-4 py-2 bg-[#C9A227] hover:bg-[#ebd04e] text-black text-xs font-semibold tracking-wider uppercase rounded flex items-center space-x-1.5 transition-colors cursor-pointer accent-bg"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>Update Contact Info</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* TAB: BIOGRAPHY */}
              {activeTab === 'biography' && (
                <div id="admin-biography-tab" className="space-y-8 pb-10">
                  {loadingSettings ? (
                    <div className="text-center py-10 text-neutral-500 text-xs">Loading application config...</div>
                  ) : (
                    <>
                      {/* Sub-section 2: Biography Text Editor */}
                      <div className="space-y-4 border border-neutral-900 bg-neutral-950 p-5 rounded">
                        <div className="flex items-center space-x-2 border-b border-neutral-900 pb-2">
                          <FileText className="w-4 h-4 text-[#C9A227] accent-color" />
                          <h3 className="font-serif text-sm tracking-widest text-white uppercase">Biography Narratives</h3>
                        </div>

                        {/* Intro texts */}
                        <div className="space-y-2">
                          <span className="text-[10px] tracking-wider text-[#C9A227] font-sans uppercase accent-color">Short Introductory Paragraph</span>
                          <div className="space-y-2.5">
                            <div className="space-y-1">
                              <label className="text-[9px] text-neutral-500 font-mono">ENGLISH</label>
                              <textarea
                                rows={2}
                                value={bioSettings.bioIntro.EN}
                                onChange={(e) => setBioSettings({
                                  ...bioSettings,
                                  bioIntro: { ...bioSettings.bioIntro, EN: e.target.value }
                                })}
                                className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white resize-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] text-neutral-500 font-mono">GERMAN (DEUTSCH)</label>
                              <textarea
                                rows={2}
                                value={bioSettings.bioIntro.DE}
                                onChange={(e) => setBioSettings({
                                  ...bioSettings,
                                  bioIntro: { ...bioSettings.bioIntro, DE: e.target.value }
                                })}
                                className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white resize-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] text-neutral-500 font-mono">KOREAN (한국어)</label>
                              <textarea
                                rows={2}
                                value={bioSettings.bioIntro.KO}
                                onChange={(e) => setBioSettings({
                                  ...bioSettings,
                                  bioIntro: { ...bioSettings.bioIntro, KO: e.target.value }
                                })}
                                className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white resize-none"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Long texts */}
                        <div className="space-y-2 pt-2">
                          <span className="text-[10px] tracking-wider text-[#C9A227] font-sans uppercase accent-color">Comprehensive Biography Body</span>
                          <div className="space-y-2.5">
                            <div className="space-y-1">
                              <label className="text-[9px] text-neutral-500 font-mono">ENGLISH</label>
                              <textarea
                                rows={4}
                                value={bioSettings.bioLong.EN}
                                onChange={(e) => setBioSettings({
                                  ...bioSettings,
                                  bioLong: { ...bioSettings.bioLong, EN: e.target.value }
                                })}
                                className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white resize-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] text-neutral-500 font-mono">GERMAN (DEUTSCH)</label>
                              <textarea
                                rows={4}
                                value={bioSettings.bioLong.DE}
                                onChange={(e) => setBioSettings({
                                  ...bioSettings,
                                  bioLong: { ...bioSettings.bioLong, DE: e.target.value }
                                })}
                                className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white resize-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] text-neutral-500 font-mono">KOREAN (한국어)</label>
                              <textarea
                                rows={4}
                                value={bioSettings.bioLong.KO}
                                onChange={(e) => setBioSettings({
                                  ...bioSettings,
                                  bioLong: { ...bioSettings.bioLong, KO: e.target.value }
                                })}
                                className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white resize-none"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Biography Image */}
                        <div className="space-y-3 pt-2">
                          <span className="text-[10px] tracking-wider text-[#C9A227] font-sans uppercase accent-color">Biography Image</span>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-3">
                              {/* Computer File Upload Block */}
                              <div className="border border-dashed border-neutral-800 rounded-sm p-4 bg-neutral-900/30 hover:bg-neutral-900/60 transition-colors flex flex-col items-center justify-center space-y-2 relative group text-center min-h-[110px]">
                                <input
                                  type="file"
                                  accept="image/*"
                                  disabled={isUploadingFile}
                                  onChange={(e) => {
                                    handleImageCropUpload(e.target.files?.[0], (base64) => {
                                      setBioSettings({ ...bioSettings, bioImage: base64 });
                                    }, 3 / 4); // specific aspect ratio for portrait
                                    e.target.value = '';
                                  }}
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                <Upload className={`w-5 h-5 ${isUploadingFile ? 'animate-bounce text-[#C9A227]' : 'text-neutral-500 group-hover:text-[#C9A227]'} transition-colors`} />
                                <div className="space-y-0.5">
                                  <p className="text-[11px] text-neutral-300 font-sans font-medium">
                                    {isUploadingFile ? 'Processing...' : 'Upload new image'}
                                  </p>
                                  <p className="text-[9px] text-neutral-500 font-sans">
                                    Click or drag any photo file
                                  </p>
                                </div>
                              </div>

                              <div className="space-y-1">
                                <span className="text-[9px] text-neutral-500 uppercase block font-sans">Or Enter Raw Image URL</span>
                                <input
                                  type="text"
                                  value={bioSettings.bioImage || ''}
                                  onChange={(e) => setBioSettings({ ...bioSettings, bioImage: e.target.value })}
                                  placeholder="https://..."
                                  className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-2 text-xs text-white"
                                />
                              </div>
                            </div>
                            <div className="flex justify-center items-center bg-neutral-900/30 rounded border border-neutral-800 p-2 overflow-hidden h-[180px]">
                              {bioSettings.bioImage ? (
                                <img src={bioSettings.bioImage} alt="Biography Preview" className="h-full w-auto object-cover rounded" />
                              ) : (
                                <div className="text-center text-neutral-600 space-y-1 p-4">
                                  <Image className="w-8 h-8 mx-auto stroke-1" />
                                  <p className="text-[10px] font-sans">No custom image selected.</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end pt-2">
                          <button
                            type="button"
                            onClick={saveBiographySettingsAction}
                            disabled={loadingAction}
                            className="px-4 py-2 bg-[#C9A227] hover:bg-[#ebd04e] text-black text-xs font-semibold tracking-wider uppercase rounded flex items-center space-x-1.5 transition-colors cursor-pointer accent-bg"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>Update Biography</span>
                          </button>
                        </div>
                      </div>

                    </>
                  )}
                </div>
              )}

              {/* TAB 6: CONTACT MESSAGES */}
              {activeTab === 'messages' && (
                <div id="admin-messages-tab" className="space-y-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-serif tracking-wider text-neutral-300">
                      Inquiries & Correspondence logs
                    </h3>
                    <button
                      id="refresh-messages-btn"
                      onClick={fetchMessages}
                      className="text-[10px] border border-neutral-800 hover:border-neutral-600 text-neutral-400 px-3 py-1 rounded cursor-pointer"
                    >
                      Refresh
                    </button>
                  </div>

                  {loadingMessages ? (
                    <div className="text-center py-10 text-neutral-500 text-xs font-sans">Loading inquiries...</div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-16 border border-neutral-900 bg-neutral-950/40 rounded-sm">
                      <MessageSquare className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
                      <p className="text-sm text-neutral-500 tracking-wider font-sans">No customer inquiries recorded.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((msg) => (
                        <div key={msg.id} className="bg-neutral-950 p-4 border border-neutral-900 rounded-sm relative space-y-2">
                          <button
                            id={`delete-msg-btn-${msg.id}`}
                            onClick={() => deleteMessage(msg.id!)}
                            className="absolute top-4 right-4 text-neutral-500 hover:text-rose-400 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-neutral-500 font-mono">
                              {new Date(msg.createdAt).toLocaleString()}
                            </span>
                            <h4 className="text-xs md:text-sm font-sans font-medium text-white">
                              {msg.name} ({msg.email})
                            </h4>
                          </div>
                          <p className="text-xs text-neutral-300 bg-black/30 p-3 rounded font-sans leading-relaxed whitespace-pre-wrap">
                            {msg.message}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 7: SELECTED PERFORMANCES (HERO SLIDES) */}
              {activeTab === 'slides' && (
                <div id="admin-slides-tab" className="space-y-6">
                  {editingSlide ? (
                    <form onSubmit={saveSlide} className="space-y-4 border border-neutral-900 bg-neutral-950 p-5 rounded">
                      <div className="flex justify-between items-center border-b border-neutral-900 pb-3">
                        <h3 className="font-serif text-sm tracking-widest text-[#C9A227] uppercase">
                          {editingSlide.id ? 'Edit Hero Performance' : 'Add New Hero Performance'}
                        </h3>
                        <button
                          type="button"
                          onClick={() => setEditingSlide(null)}
                          className="text-neutral-400 hover:text-white text-xs cursor-pointer animate-none"
                        >
                          Cancel
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <label className="text-[10px] tracking-wider text-neutral-400 font-sans uppercase block">Slide Image/Video File or URL</label>
                          
                          {/* Computer File Upload Block */}
                          <div className="border border-dashed border-neutral-800 rounded-sm p-4 bg-neutral-900/30 hover:bg-neutral-900/60 transition-colors flex flex-col items-center justify-center space-y-2 relative group text-center min-h-[110px]">
                            <input
                              type="file"
                              accept="image/*,video/*"
                              disabled={isUploadingFile}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                if (file.type.startsWith('video/')) {
                                  if (file.size > 800 * 1024) {
                                    triggerAlert('error', 'Video file is too large! Maximum 800KB allowed. Use a URL instead.');
                                    return;
                                  }
                                  const reader = new FileReader();
                                  reader.onload = (re) => {
                                    if (typeof re.target?.result === 'string') {
                                      setEditingSlide({ ...editingSlide, image: re.target.result, mediaType: 'video' });
                                      triggerAlert('success', 'Video processed successfully!');
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                } else {
                                  handleImageCropUpload(file, (base64) => {
                                    setEditingSlide({ ...editingSlide, image: base64, mediaType: 'image' });
                                  });
                                }
                                e.target.value = '';
                              }}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <Upload className={`w-5 h-5 ${isUploadingFile ? 'animate-bounce text-[#C9A227]' : 'text-neutral-500 group-hover:text-[#C9A227]'} transition-colors`} />
                            <div className="space-y-0.5">
                              <p className="text-[11px] text-neutral-300 font-sans font-medium">
                                {isUploadingFile ? 'Processing...' : 'Upload Image/Video'}
                              </p>
                              <p className="text-[9px] text-neutral-500 font-sans">
                                Click or drag photo/video file
                              </p>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[9px] text-neutral-500 uppercase block font-sans">Or Enter Raw Image/Video/YouTube URL</span>
                            <input
                              type="text"
                              required
                              placeholder="Image/Video MP4/YouTube URL"
                              value={editingSlide.image || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                let type: 'image' | 'video' | 'youtube' = 'image';
                                if (val.includes('youtube.com') || val.includes('youtu.be')) {
                                  type = 'youtube';
                                } else if (val.match(/\.(mp4|webm|ogg)$/i)) {
                                  type = 'video';
                                }
                                setEditingSlide({ ...editingSlide, image: val, mediaType: type });
                              }}
                              className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#C9A227]/50 rounded-sm px-3 py-2 text-xs text-white"
                            />
                          </div>

                          <div className="space-y-1.5 pt-1">
                            <label className="text-[10px] tracking-wider text-neutral-400 font-sans uppercase block">Background Position (CSS)</label>
                            <input
                              type="text"
                              placeholder="e.g. center, center 35%, top"
                              value={editingSlide.bgPosition || 'center'}
                              onChange={(e) => setEditingSlide({ ...editingSlide, bgPosition: e.target.value })}
                              className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#C9A227]/50 rounded-sm px-3 py-1.5 text-xs text-white"
                            />
                            <span className="text-[8px] text-neutral-500">Controls vertical alignment (only applies to static image slides).</span>
                          </div>
                        </div>

                        {/* Slide Preview Block */}
                        <div className="space-y-1.5 flex flex-col">
                          <span className="text-[10px] tracking-wider text-neutral-400 font-sans uppercase block">Live Hero Slide Preview</span>
                          <div className="flex-1 min-h-[180px] bg-neutral-900/20 border border-neutral-800 rounded-sm flex flex-col justify-end overflow-hidden relative group">
                            {editingSlide.image ? (
                              <>
                                {(() => {
                                  const previewMediaType = editingSlide.mediaType || (
                                    editingSlide.image.includes('youtube.com') || editingSlide.image.includes('youtu.be') ? 'youtube' :
                                    editingSlide.image.match(/\.(mp4|webm|ogg)$/i) ? 'video' : 'image'
                                  );

                                  if (previewMediaType === 'video') {
                                    return (
                                      <video
                                        autoPlay
                                        loop
                                        muted
                                        playsInline
                                        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                                        src={editingSlide.image}
                                        onCanPlay={(e) => {
                                          e.currentTarget.play().catch((err) => {
                                            console.log("Admin preview video autoplay prevented:", err);
                                          });
                                        }}
                                      />
                                    );
                                  } else if (previewMediaType === 'youtube') {
                                    return (
                                      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
                                        <iframe
                                          className="absolute top-1/2 left-1/2 w-[300%] h-[300%] min-w-[100%] min-h-[100%] -translate-x-1/2 -translate-y-1/2 opacity-70 pointer-events-none"
                                          src={`https://www.youtube.com/embed/${(() => {
                                            const match = editingSlide.image.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
                                            return match ? match[1] : '';
                                          })()}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&loop=1&iv_load_policy=3&modestbranding=1&disablekb=1&fs=0&enablejsapi=1&playsinline=1&playlist=${(() => {
                                            const match = editingSlide.image.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
                                            return match ? match[1] : '';
                                          })()}`}
                                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        />
                                      </div>
                                    );
                                  } else {
                                    return (
                                      <div 
                                        className="absolute inset-0 bg-cover bg-no-repeat transition-all duration-300"
                                        style={{ 
                                          backgroundImage: `url(${editingSlide.image})`,
                                          backgroundPosition: editingSlide.bgPosition || 'center'
                                        }}
                                      />
                                    );
                                  }
                                })()}
                                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 to-transparent" />
                                <div className="absolute bottom-3 left-3 right-3 z-10">
                                  <span className="text-[8px] text-[#C9A227] bg-black/60 px-1 py-0.5 rounded font-sans tracking-widest uppercase">
                                    Preview Mode
                                  </span>
                                  <h4 className="text-xs font-serif text-white tracking-wide mt-1">
                                    Hero Performance Preview
                                  </h4>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setEditingSlide({ ...editingSlide, image: '', mediaType: 'image' })}
                                  className="absolute top-2 right-2 p-1 bg-black/60 hover:bg-black/95 text-neutral-400 hover:text-white rounded-full transition-colors cursor-pointer z-10"
                                  title="Clear Content"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : (
                              <div className="h-full w-full flex flex-col items-center justify-center text-center text-neutral-600 space-y-1 p-4">
                                <Image className="w-8 h-8 stroke-1" />
                                <p className="text-[10px] font-sans">No slide image/video uploaded or selected.</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Multilingual Production */}
                      <div className="border-t border-neutral-900 pt-4 space-y-3">
                        <h4 className="text-[10px] tracking-widest font-sans uppercase text-neutral-400">Production Name</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <label className="text-[9px] text-neutral-500 uppercase block">English</label>
                            <input
                              type="text"
                              required
                              value={editingSlide.production?.EN || ''}
                              onChange={(e) => setEditingSlide({
                                ...editingSlide,
                                production: { EN: e.target.value, DE: editingSlide.production?.DE || '', KO: editingSlide.production?.KO || '' }
                              })}
                              className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#C9A227]/50 rounded-sm px-2.5 py-1.5 text-xs text-white"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] text-neutral-500 uppercase block">German</label>
                            <input
                              type="text"
                              required
                              value={editingSlide.production?.DE || ''}
                              onChange={(e) => setEditingSlide({
                                ...editingSlide,
                                production: { DE: e.target.value, EN: editingSlide.production?.EN || '', KO: editingSlide.production?.KO || '' }
                              })}
                              className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#C9A227]/50 rounded-sm px-2.5 py-1.5 text-xs text-white"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] text-neutral-500 uppercase block">Korean</label>
                            <input
                              type="text"
                              required
                              value={editingSlide.production?.KO || ''}
                              onChange={(e) => setEditingSlide({
                                ...editingSlide,
                                production: { KO: e.target.value, EN: editingSlide.production?.EN || '', DE: editingSlide.production?.DE || '' }
                              })}
                              className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#C9A227]/50 rounded-sm px-2.5 py-1.5 text-xs text-white"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Multilingual Role */}
                      <div className="border-t border-neutral-900 pt-4 space-y-3">
                        <h4 className="text-[10px] tracking-widest font-sans uppercase text-neutral-400">Role Played</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <label className="text-[9px] text-neutral-500 uppercase block">English</label>
                            <input
                              type="text"
                              required
                              value={editingSlide.role?.EN || ''}
                              onChange={(e) => setEditingSlide({
                                ...editingSlide,
                                role: { EN: e.target.value, DE: editingSlide.role?.DE || '', KO: editingSlide.role?.KO || '' }
                              })}
                              className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#C9A227]/50 rounded-sm px-2.5 py-1.5 text-xs text-white"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] text-neutral-500 uppercase block">German</label>
                            <input
                              type="text"
                              required
                              value={editingSlide.role?.DE || ''}
                              onChange={(e) => setEditingSlide({
                                ...editingSlide,
                                role: { DE: e.target.value, EN: editingSlide.role?.EN || '', KO: editingSlide.role?.KO || '' }
                              })}
                              className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#C9A227]/50 rounded-sm px-2.5 py-1.5 text-xs text-white"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] text-neutral-500 uppercase block">Korean</label>
                            <input
                              type="text"
                              required
                              value={editingSlide.role?.KO || ''}
                              onChange={(e) => setEditingSlide({
                                ...editingSlide,
                                role: { KO: e.target.value, EN: editingSlide.role?.EN || '', DE: editingSlide.role?.DE || '' }
                              })}
                              className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#C9A227]/50 rounded-sm px-2.5 py-1.5 text-xs text-white"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Multilingual Opera House */}
                      <div className="border-t border-neutral-900 pt-4 space-y-3">
                        <h4 className="text-[10px] tracking-widest font-sans uppercase text-neutral-400">Opera House / Location</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <label className="text-[9px] text-neutral-500 uppercase block">English</label>
                            <input
                              type="text"
                              required
                              value={editingSlide.house?.EN || ''}
                              onChange={(e) => setEditingSlide({
                                ...editingSlide,
                                house: { EN: e.target.value, DE: editingSlide.house?.DE || '', KO: editingSlide.house?.KO || '' }
                              })}
                              className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#C9A227]/50 rounded-sm px-2.5 py-1.5 text-xs text-white"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] text-neutral-500 uppercase block">German</label>
                            <input
                              type="text"
                              required
                              value={editingSlide.house?.DE || ''}
                              onChange={(e) => setEditingSlide({
                                ...editingSlide,
                                house: { DE: e.target.value, EN: editingSlide.house?.EN || '', KO: editingSlide.house?.KO || '' }
                              })}
                              className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#C9A227]/50 rounded-sm px-2.5 py-1.5 text-xs text-white"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] text-neutral-500 uppercase block">Korean</label>
                            <input
                              type="text"
                              required
                              value={editingSlide.house?.KO || ''}
                              onChange={(e) => setEditingSlide({
                                ...editingSlide,
                                house: { KO: e.target.value, EN: editingSlide.house?.EN || '', DE: editingSlide.house?.DE || '' }
                              })}
                              className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#C9A227]/50 rounded-sm px-2.5 py-1.5 text-xs text-white"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end pt-4 border-t border-neutral-900 space-x-3">
                        <button
                          type="button"
                          onClick={() => setEditingSlide(null)}
                          className="px-4 py-2 border border-neutral-800 hover:border-neutral-600 rounded text-neutral-400 hover:text-white text-xs font-semibold uppercase cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={loadingAction}
                          className="px-5 py-2 bg-[#C9A227] hover:bg-[#ebd04e] text-black text-xs font-semibold tracking-wider uppercase rounded flex items-center space-x-1.5 transition-colors cursor-pointer accent-bg"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>{loadingAction ? 'Saving...' : 'Save Performance'}</span>
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-serif tracking-wider text-neutral-300">
                          Selected Performance Hero Slides
                        </h3>
                        <button
                          id="add-slide-btn"
                          onClick={startNewSlide}
                          className="bg-[#C9A227] hover:bg-[#ebd04e] text-black text-[10px] font-semibold tracking-wider uppercase px-3 py-1.5 rounded-sm flex items-center space-x-1 transition-all cursor-pointer accent-bg"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Performance</span>
                        </button>
                      </div>

                      {loadingSlides ? (
                        <div className="text-center py-10 text-neutral-500 text-xs font-sans">Loading slides...</div>
                      ) : slides.length === 0 ? (
                        <div className="text-center py-12 border border-neutral-900 bg-neutral-950/40 rounded-sm">
                          <Image className="w-10 h-10 text-neutral-600 mx-auto mb-3 animate-none" />
                          <p className="text-sm text-neutral-500 tracking-wider font-sans">No custom performances. Using fallback defaults.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {slides.map((s) => (
                            <div key={s.id} className="bg-neutral-950 border border-neutral-900 rounded overflow-hidden flex flex-col relative group">
                              <div className="h-32 w-full bg-neutral-900 relative">
                                <img
                                  src={s.image}
                                  alt={s.production[currentLang]}
                                  className="w-full h-full object-cover opacity-60"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 to-transparent" />
                                <div className="absolute bottom-3 left-3 right-3">
                                  <span className="text-[9px] text-[#C9A227] bg-black/50 px-1.5 py-0.5 rounded font-sans tracking-widest uppercase">
                                    {s.role[currentLang]}
                                  </span>
                                  <h4 className="text-sm font-serif text-white tracking-wide mt-1 line-clamp-1">
                                    {s.production[currentLang]}
                                  </h4>
                                </div>
                              </div>

                              <div className="p-3.5 flex-1 flex flex-col justify-between">
                                <p className="text-[10px] text-neutral-400 font-sans uppercase tracking-wider mb-3">
                                  {s.house[currentLang]}
                                </p>

                                <div className="flex justify-end space-x-2 border-t border-neutral-900 pt-3">
                                  <button
                                    id={`edit-slide-btn-${s.id}`}
                                    onClick={() => setEditingSlide(s)}
                                    className="p-1.5 text-neutral-400 hover:text-[#C9A227] transition-all cursor-pointer hover:bg-neutral-900/60 rounded"
                                    title="Edit Slide"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    id={`delete-slide-btn-${s.id}`}
                                    onClick={() => deleteSlide(s.id!)}
                                    className="p-1.5 text-neutral-400 hover:text-rose-400 transition-all cursor-pointer hover:bg-neutral-900/60 rounded"
                                    title="Delete Slide"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>

        )}

        {cropTarget && (
          <ImageCropperModal
            imageSrc={cropTarget.src}
            aspect={cropTarget.aspect}
            onCropDone={(base64) => cropTarget.onCrop(base64)}
            onCropCancel={() => setCropTarget(null)}
          />
        )}
      </motion.div>
    </div>
  );
}

