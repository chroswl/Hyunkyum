const fs = require('fs');

const appTsx = fs.readFileSync('src/App.tsx', 'utf8');

const imports = `import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Edit3, X, Instagram, Youtube, Facebook, Twitter, Lock } from 'lucide-react';
import Navbar from './Navbar';
import SelectedPerformances from './SelectedPerformances';
import BiographySection from './BiographySection';
import PressSection from './PressSection';
import PortfolioGallery from './PortfolioGallery';
import VideoPlayer from './VideoPlayer';
import ScheduleSection from './ScheduleSection';
import ContactSection from './ContactSection';
import HeroEditorPanel from './HeroEditorPanel';
import { LegalModal } from './LegalModals';
import Reveal from './Reveal';
import { getMediaSource } from '../lib/mediaUtils';
import { saveThemeSettings } from '../firebase';`;

const propsDef = `
export default function WebsiteContent(props: any) {
  const {
    currentLang, setLang, user, setIsAdminOpen,
    scheduleItems, setScheduleItems, portfolioItems, setPortfolioItems,
    videoItems, setVideoItems, pressItems, setPressItems,
    theme, setTheme, bio, setBio, contact, setContact, slides, setSlides,
    activeEditSection, setActiveEditSection,
    isEditingHeroText, setIsEditingHeroText,
    initialThemeRef, loadAllData, legalModal, setLegalModal, t,
    isHeroVideoPlaying, setIsHeroVideoPlaying, heroVideoRef
  } = props;`;

// Extract helper functions (lines before return)
// Find index of "const scrollToSection"
const startHelpers = appTsx.indexOf('const scrollToSection = (id: string) => {');
const endHelpers = appTsx.indexOf('if (isLoading) {');
const helpers = appTsx.substring(startHelpers, endHelpers);

// Extract the app-container
const startAppContainer = appTsx.indexOf('<div id="app-container"');
const endAppContainer = appTsx.indexOf('{/* 9. FIREBASE DRAWER ADMIN MANAGEMENT PANEL */}');
const appContainer = appTsx.substring(startAppContainer, endAppContainer);

// Make sure it closes nicely
const fixedAppContainer = appContainer.trim() + '\n  );\n}';

const finalCode = `${imports}\n${propsDef}\n${helpers}\n  return (\n${fixedAppContainer}\n`;
fs.writeFileSync('src/components/WebsiteContent.tsx', finalCode);
console.log('WebsiteContent generated');
