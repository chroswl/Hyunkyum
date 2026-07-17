#!/bin/bash
echo "import React from 'react';" > src/components/WebsiteContent.tsx
echo "import { motion, AnimatePresence } from 'motion/react';" >> src/components/WebsiteContent.tsx
echo "import { ChevronDown, Edit3, X, Instagram, Youtube, Facebook, Twitter, Lock } from 'lucide-react';" >> src/components/WebsiteContent.tsx
echo "import Navbar from './Navbar';" >> src/components/WebsiteContent.tsx
echo "import SelectedPerformances from './SelectedPerformances';" >> src/components/WebsiteContent.tsx
echo "import BiographySection from './BiographySection';" >> src/components/WebsiteContent.tsx
echo "import PressSection from './PressSection';" >> src/components/WebsiteContent.tsx
echo "import PortfolioGallery from './PortfolioGallery';" >> src/components/WebsiteContent.tsx
echo "import VideoPlayer from './VideoPlayer';" >> src/components/WebsiteContent.tsx
echo "import ScheduleSection from './ScheduleSection';" >> src/components/WebsiteContent.tsx
echo "import ContactSection from './ContactSection';" >> src/components/WebsiteContent.tsx
echo "import HeroEditorPanel from './HeroEditorPanel';" >> src/components/WebsiteContent.tsx
echo "import Reveal from './Reveal';" >> src/components/WebsiteContent.tsx
echo "import { getMediaSource } from '../lib/mediaUtils';" >> src/components/WebsiteContent.tsx
echo "import { saveThemeSettings } from '../firebase';" >> src/components/WebsiteContent.tsx
echo "" >> src/components/WebsiteContent.tsx
echo "export default function WebsiteContent(props: any) {" >> src/components/WebsiteContent.tsx
echo "  const {" >> src/components/WebsiteContent.tsx
echo "    currentLang, setLang, user, setIsAdminOpen," >> src/components/WebsiteContent.tsx
echo "    scheduleItems, setScheduleItems, portfolioItems, setPortfolioItems," >> src/components/WebsiteContent.tsx
echo "    videoItems, setVideoItems, pressItems, setPressItems," >> src/components/WebsiteContent.tsx
echo "    theme, setTheme, bio, setBio, contact, setContact, slides, setSlides," >> src/components/WebsiteContent.tsx
echo "    activeEditSection, setActiveEditSection," >> src/components/WebsiteContent.tsx
echo "    isEditingHeroText, setIsEditingHeroText," >> src/components/WebsiteContent.tsx
echo "    initialThemeRef, loadAllData, legalModal, setLegalModal, t," >> src/components/WebsiteContent.tsx
echo "    isHeroVideoPlaying, setIsHeroVideoPlaying, heroVideoRef" >> src/components/WebsiteContent.tsx
echo "  } = props;" >> src/components/WebsiteContent.tsx
echo "" >> src/components/WebsiteContent.tsx

# Include the helper functions
sed -n '283,333p' src/App.tsx >> src/components/WebsiteContent.tsx

echo "  return (" >> src/components/WebsiteContent.tsx

# Include everything from <div id="app-container" ... to before <AnimatePresence>
sed -n '357,1086p' src/App.tsx >> src/components/WebsiteContent.tsx

echo "  );" >> src/components/WebsiteContent.tsx
echo "}" >> src/components/WebsiteContent.tsx
