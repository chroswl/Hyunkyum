const fs = require('fs');
const appTsx = fs.readFileSync('src/App.tsx', 'utf-8');

const match = appTsx.match(/<section\s+id="home"[^>]*>([\s\S]*?)<\/section>/);
if (match) {
  let heroContent = match[0];
  const componentStr = `import React, { useState, useRef } from 'react';
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
}: HeroSectionProps) {
  const initialThemeRef = useRef<ThemeSettings | null>(theme);
  const [isHeroVideoPlaying, setIsHeroVideoPlaying] = useState(false);

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
    ${heroContent}
  );
}
`;
  fs.writeFileSync('src/components/HeroSection.tsx', componentStr);
  console.log('HeroSection.tsx generated successfully.');
} else {
  console.error('Could not find hero section in App.tsx');
}
