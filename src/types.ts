export type Language = 'EN' | 'DE' | 'KO';

export interface ScheduleItem {
  id: string;
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
  url: string;
  category: 'Portrait' | 'Stage' | 'Backstage';
  title?: {
    EN: string;
    DE: string;
    KO: string;
  };
}

export interface VideoItem {
  id: string;
  youtubeId: string;
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
  accent: string;
  homeBg?: string;
  homeBgType?: 'image' | 'video' | 'youtube';
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
}

export interface ContactSettings {
  email: string;
  phone: string;
  management: string;
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
}
