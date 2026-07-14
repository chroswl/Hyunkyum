export type Language = 'EN' | 'DE' | 'KO';

export interface ScheduleItem {
  id: string;
  order?: number;
  date: string; // YYYY-MM-DD
  title: {
    EN: string;
    DE: string;
    KO: string;
  };
  location: {
    EN: string;
    DE: string;
    KO: string;
  };
  role: {
    EN: string;
    DE: string;
    KO: string;
  };
  category: 'Opera' | 'Concert' | 'Recital' | 'Gala';
  link?: string;
}

export interface PortfolioItem {
  id: string;
  order?: number;
  url: string;
  category: 'Portrait' | 'Stage' | 'Backstage';
  title?: {
    EN: string;
    DE: string;
    KO: string;
  };
  copyright?: string;
  copyrightUrl?: string;
}

export interface VideoItem {
  id: string;
  order?: number;
  youtubeId?: string;
  videoUrl?: string;
  title: {
    EN: string;
    DE: string;
    KO: string;
  };
  role?: {
    EN: string;
    DE: string;
    KO: string;
  };
}

export interface PressItem {
  id: string;
  order?: number;
  source: string;
  rating?: number;
  quote: {
    EN: string;
    DE: string;
    KO: string;
  };
  author?: string;
  date: string;
  link?: string;
  type: 'Review' | 'Interview' | 'Article';
}

export interface ThemeSettings {
  bg: string;
  text: string;
  homeBg?: string;
  homeBgType?: 'image' | 'video' | 'youtube';
  contactFormBg?: string;
  pressFontSize?: number;
  // Font Customization
  websiteFont?: string;
  websiteTextSize?: number;
  navFontSize?: number;
  // Spacing Customization
  spacingContentWidth?: number;
  spacingSection?: number;
  spacingNavHeight?: number;
  spacingNavGap?: number;
  
  // Font presets
  fontPreset?: string;
  colorHeroSlideText?: string;
  colorPerformancesText?: string;
  colorContactText?: string;
  // Home Main Text Customization
  heroTitle?: string;
  heroSubtitle?: string;
  heroDescription?: string;
  heroDiscover?: string;
  heroTitleDE?: string;
  heroSubtitleDE?: string;
  heroDescriptionDE?: string;
  heroDiscoverDE?: string;
  heroTitleKO?: string;
  heroSubtitleKO?: string;
  heroDescriptionKO?: string;
  heroDiscoverKO?: string;
  // Hero Layout Customization
  heroOffsetY?: number;
  heroAlign?: 'left' | 'center' | 'right';
  heroTitleSize?: number;
  heroDescSize?: number;
  heroSubtitleSize?: number;
  heroButtonSize?: number;

  heroSubtitleOffsetX?: number;
  heroSubtitleOffsetY?: number;
  heroTitleOffsetX?: number;
  heroTitleOffsetY?: number;
  heroDescOffsetX?: number;
  heroDescOffsetY?: number;
  heroButtonOffsetX?: number;
  heroButtonOffsetY?: number;
  heroCopyright?: string;
  heroCopyrightUrl?: string;
  // Footer Customization
  footerBrandName?: string;
  footerCopyrightText?: string;
  footerImpressum?: string;
  footerPrivacyPolicy?: string;
  footerContactEmail?: string;
  footerSocialInstagram?: string;
  footerSocialYoutube?: string;
  footerSocialFacebook?: string;
  footerSocialTwitter?: string;
}

export interface TimelineItem {
  id?: string;
  order?: number;
  year: string;
  textEN: string;
  textDE: string;
  textKO: string;
}

export interface TimelineData {
  education: TimelineItem[];
  awards: TimelineItem[];
  roles: TimelineItem[];
  concert: TimelineItem[];
  [key: string]: TimelineItem[];
}

export interface TimelineTitles {
  education?: { EN: string; DE: string; KO: string; };
  awards?: { EN: string; DE: string; KO: string; };
  roles?: { EN: string; DE: string; KO: string; };
  concert?: { EN: string; DE: string; KO: string; };
}

export interface BiographySettings {
  bioIntro: {
    EN: string;
    DE: string;
    KO: string;
  };
  bioLong: {
    EN: string;
    DE: string;
    KO: string;
  };
  bioImage?: string;
  bioImageCopyright?: string;
  bioImageCopyrightUrl?: string;
  photoCredit?: string;
  photoCreditLink?: string;
  timeline?: TimelineData;
  timelineTitles?: TimelineTitles;
}

export interface ContactSettings {
  email: string;
  phone: string;
  management: string;
  connectTitle?: { EN: string; DE: string; KO: string };
  connectDescription?: { EN: string; DE: string; KO: string };
  instagramLink?: string;
  youtubeLink?: string;
}

export interface ContactMessage {
  id?: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
}

export interface PerformanceSlide {
  id: string;
  order?: number;
  image: string;
  mediaType?: 'image' | 'video' | 'youtube';
  bgPosition?: string;
  production: {
    EN: string;
    DE: string;
    KO: string;
  };
  role: {
    EN: string;
    DE: string;
    KO: string;
  };
  house: {
    EN: string;
    DE: string;
    KO: string;
  };
  copyright?: string;
  copyrightUrl?: string;
}
