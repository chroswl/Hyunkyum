import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppearanceSettings, defaultAppearanceSettings } from '../types/appearance';
import { fetchAppearanceSettings, subscribeToAppearanceSettings } from '../services/appearanceService';

interface AppearanceContextProps {
  appearance: AppearanceSettings;
  updateAppearance: (newSettings: Partial<AppearanceSettings>) => void;
  isLoaded: boolean;
}

const AppearanceContext = createContext<AppearanceContextProps>({
  appearance: defaultAppearanceSettings,
  updateAppearance: () => {},
  isLoaded: false
});

export const useAppearance = () => useContext(AppearanceContext);

export const AppearanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [appearance, setAppearance] = useState<AppearanceSettings>(defaultAppearanceSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Initial fetch to avoid flashing default if possible
    fetchAppearanceSettings().then(settings => {
      const hasOldGoldOrBlue = settings.colors && (
        settings.colors.accent === '#C9A227' || 
        settings.colors.accent === '#4ea8de' ||
        settings.colors.background === '#000814' ||
        (settings.colors.hero && (settings.colors.hero.buttonBg === '#C9A227' || settings.colors.hero.buttonBg === '#4ea8de')) ||
        (settings.colors.navigation && (settings.colors.navigation.hover === '#C9A227' || settings.colors.navigation.hover === '#4ea8de'))
      );

      if (hasOldGoldOrBlue) {
        console.log("Old gold or blue accent detected in database settings. Migrating database to clean monochrome...");
        import('../services/appearanceService').then(({ saveAppearanceSettings }) => {
          saveAppearanceSettings(defaultAppearanceSettings, "Auto-migrate theme to clean monochrome", "System Migration")
            .then(() => {
              console.log("Firestore successfully updated to default monochrome settings!");
            })
            .catch(err => {
              console.error("Failed to auto-migrate Firestore settings:", err);
            });
        });
        setAppearance(defaultAppearanceSettings);
        applyCssVariables(defaultAppearanceSettings);
      } else {
        setAppearance(settings);
        applyCssVariables(settings);
      }
      setIsLoaded(true);
    });

    const unsubscribe = subscribeToAppearanceSettings((settings) => {
      setAppearance(settings);
      setIsLoaded(true);
      applyCssVariables(settings);
    });

    return () => unsubscribe();
  }, []);

  const updateAppearance = (newSettings: Partial<AppearanceSettings>) => {
    setAppearance(prev => {
      const updated = { ...prev, ...newSettings };
      applyCssVariables(updated);
      return updated;
    });
  };

  const applyCssVariables = (settings: AppearanceSettings) => {
    const root = document.documentElement;

    // Colors
    root.style.setProperty('--color-primary', settings.colors.primary || '#ffffff');
    root.style.setProperty('--color-secondary', settings.colors.secondary || '#bdbdbd');
    root.style.setProperty('--color-accent', settings.colors.accent || '#C9A227');
    root.style.setProperty('--color-bg', settings.colors.background || '#000000');
    root.style.setProperty('--color-surface', settings.colors.surface || '#111111');
    root.style.setProperty('--color-text', settings.colors.text || '#ffffff');
    root.style.setProperty('--color-muted', settings.colors.muted || '#999999');
    root.style.setProperty('--color-buttons', settings.colors.buttons || '#C9A227');
    root.style.setProperty('--color-links', settings.colors.links || '#C9A227');
    root.style.setProperty('--color-hover', settings.colors.hover || '#ffffff');
    root.style.setProperty('--color-borders', settings.colors.borders || '#333333');

    // Hero Customization
    if (settings.colors.hero) {
      root.style.setProperty('--hero-title', settings.colors.hero.title || '#ffffff');
      root.style.setProperty('--hero-subtitle', settings.colors.hero.subtitle || '#ffffff');
      root.style.setProperty('--hero-button-bg', settings.colors.hero.buttonBg || '#C9A227');
      root.style.setProperty('--hero-button-text', settings.colors.hero.buttonText || '#000000');
      root.style.setProperty('--hero-button-hover', settings.colors.hero.buttonHover || '#ebd04e');
      root.style.setProperty('--hero-overlay', settings.colors.hero.overlay || '#000000');
      root.style.setProperty('--hero-gradient', settings.colors.hero.gradient || 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.8) 100%)');
      root.style.setProperty('--hero-arrow', settings.colors.hero.arrow || '#ffffff');
      root.style.setProperty('--hero-overlay-opacity', `${settings.colors.hero.backgroundOverlayOpacity ?? 0.5}`);
    }    // Navigation Customization
    if (settings.colors.navigation) {
      root.style.setProperty('--nav-bg', settings.colors.navigation.background || '#000000');
      root.style.setProperty('--nav-text', settings.colors.navigation.text || '#ffffff');
      root.style.setProperty('--nav-hover', settings.colors.navigation.hover || '#C9A227');
      root.style.setProperty('--nav-active', settings.colors.navigation.active || '#ffffff');
      root.style.setProperty('--nav-border', settings.colors.navigation.border || '#333333');
      root.style.setProperty('--nav-shadow', settings.colors.navigation.shadow || 'none');
    }
    if (settings.colors.navigationTransparent) {
      root.style.setProperty('--nav-transparent-bg', settings.colors.navigationTransparent.background || 'transparent');
      root.style.setProperty('--nav-transparent-text', settings.colors.navigationTransparent.text || '#ffffff');
      root.style.setProperty('--nav-transparent-hover', settings.colors.navigationTransparent.hover || '#C9A227');
      root.style.setProperty('--nav-transparent-active', settings.colors.navigationTransparent.active || '#ffffff');
      root.style.setProperty('--nav-transparent-border', settings.colors.navigationTransparent.border || 'transparent');
      root.style.setProperty('--nav-transparent-shadow', settings.colors.navigationTransparent.shadow || 'none');
    }

    // Footer Customization
    if (settings.colors.footer) {
      root.style.setProperty('--footer-bg', settings.colors.footer.background || '#000000');
      root.style.setProperty('--footer-heading', settings.colors.footer.heading || '#ffffff');
      root.style.setProperty('--footer-text', settings.colors.footer.text || '#999999');
      root.style.setProperty('--footer-links', settings.colors.footer.links || '#ffffff');
      root.style.setProperty('--footer-hover', settings.colors.footer.hover || '#C9A227');
      root.style.setProperty('--footer-border', settings.colors.footer.border || '#333333');
    }
    // Portfolio Customization
    if (settings.colors.portfolio) {
      root.style.setProperty('--portfolio-bg', settings.colors.portfolio.background || '#000000');
      root.style.setProperty('--portfolio-title', settings.colors.portfolio.title || '#ffffff');
      root.style.setProperty('--portfolio-desc', settings.colors.portfolio.description || '#999999');
      root.style.setProperty('--portfolio-card-bg', settings.colors.portfolio.cardBg || '#111111');
      root.style.setProperty('--portfolio-card-text', settings.colors.portfolio.cardText || '#ffffff');
      root.style.setProperty('--portfolio-hover-overlay', settings.colors.portfolio.hoverOverlay || 'rgba(0,0,0,0.7)');
    }

    // Biography Customization
    if (settings.colors.biography) {
      root.style.setProperty('--bio-bg', settings.colors.biography.background || '#000000');
      root.style.setProperty('--bio-title', settings.colors.biography.title || '#ffffff');
      root.style.setProperty('--bio-text', settings.colors.biography.text || '#999999');
      root.style.setProperty('--bio-highlight', settings.colors.biography.highlight || '#C9A227');
    }

    // Videos Customization
    if (settings.colors.videos) {
      root.style.setProperty('--videos-bg', settings.colors.videos.background || '#000000');
      root.style.setProperty('--videos-title', settings.colors.videos.title || '#ffffff');
      root.style.setProperty('--videos-text', settings.colors.videos.text || '#999999');
      root.style.setProperty('--videos-play', settings.colors.videos.playButton || '#C9A227');
    }

    // Schedule Customization
    if (settings.colors.schedule) {
      root.style.setProperty('--schedule-bg', settings.colors.schedule.background || '#000000');
      root.style.setProperty('--schedule-title', settings.colors.schedule.title || '#ffffff');
      root.style.setProperty('--schedule-text', settings.colors.schedule.text || '#999999');
      root.style.setProperty('--schedule-card-bg', settings.colors.schedule.cardBg || '#111111');
      root.style.setProperty('--schedule-card-border', settings.colors.schedule.cardBorder || '#333333');
      root.style.setProperty('--schedule-btn-bg', settings.colors.schedule.buttonBg || '#ffffff');
      root.style.setProperty('--schedule-btn-text', settings.colors.schedule.buttonText || '#000000');
      root.style.setProperty('--schedule-btn-hover', settings.colors.schedule.buttonHover || '#C9A227');
    }

    // Forms Customization
    if (settings.colors.forms) {
      root.style.setProperty('--forms-bg', settings.colors.forms.background || '#111111');
      root.style.setProperty('--forms-text', settings.colors.forms.text || '#ffffff');
      root.style.setProperty('--forms-border', settings.colors.forms.border || '#333333');
      root.style.setProperty('--forms-focus', settings.colors.forms.focus || '#C9A227');
      root.style.setProperty('--forms-btn-bg', settings.colors.forms.buttonBg || '#C9A227');
      root.style.setProperty('--forms-btn-text', settings.colors.forms.buttonText || '#000000');
      root.style.setProperty('--forms-btn-hover', settings.colors.forms.buttonHover || '#ffffff');
    }


    // Typography
    const useGlobalFont = !settings.typography.overrideIndividualFonts;
    const globalFont = settings.typography.globalFont || 'Inter';

    root.style.setProperty('--font-hero', useGlobalFont ? globalFont : settings.typography.heroFont);
    root.style.setProperty('--font-heading', useGlobalFont ? globalFont : settings.typography.headingFont);
    root.style.setProperty('--font-navigation', useGlobalFont ? globalFont : settings.typography.navigationFont);
    root.style.setProperty('--font-button', useGlobalFont ? globalFont : settings.typography.buttonFont);
    root.style.setProperty('--font-quote', useGlobalFont ? globalFont : settings.typography.quoteFont);
    root.style.setProperty('--font-body', useGlobalFont ? globalFont : settings.typography.bodyFont);
    root.style.setProperty('--font-base-size', `${settings.typography.baseFontSize}px`);
    root.style.setProperty('--font-heading-scale', `${settings.typography.headingScale}`);
    root.style.setProperty('--font-line-height', `${settings.typography.lineHeight}`);
    root.style.setProperty('--font-weight', `${settings.typography.fontWeight}`);

    // Layout
    root.style.setProperty('--layout-max-width', `${settings.layout.maxWidth}px`);
    root.style.setProperty('--layout-section-spacing', `${settings.layout.sectionSpacing}px`);
    root.style.setProperty('--layout-content-spacing', `${settings.layout.contentSpacing}px`);
    root.style.setProperty('--layout-border-radius', `${settings.layout.borderRadius}px`);
    root.style.setProperty('--layout-card-padding', `${settings.layout.cardPadding}px`);
    root.style.setProperty('--layout-vertical-rhythm', `${settings.layout.verticalRhythm}px`);

    // Navigation
    root.style.setProperty('--nav-height', `${settings.navigation.height}px`);
    root.style.setProperty('--nav-logo-size', `${settings.navigation.logoSize}px`);
    root.style.setProperty('--nav-menu-gap', `${settings.navigation.menuGap}px`);

    // Portfolio
    root.style.setProperty('--portfolio-columns', `${settings.portfolio.columns}`);
    root.style.setProperty('--portfolio-gap', `${settings.portfolio.gap}px`);
    
    // Animation specific speeds
    const speedMap = { slow: '0.8s', normal: '0.4s', fast: '0.2s' };
    root.style.setProperty('--animation-speed', speedMap[settings.animation.speed] || '0.4s');

    // Theme mode
    if (settings.theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else if (settings.theme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
    } else {
      // System
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.add('light');
        root.classList.remove('dark');
      }
    }
  };

  
  // Update Google Fonts
  useEffect(() => {
    if (!isLoaded) return;
    
    const fontHeading = appearance.typography.headingFont;
    const fontBody = appearance.typography.bodyFont;
    
    const systemFonts = ['Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Georgia', 'serif', 'sans-serif', 'monospace', 'system-ui', 'inherit'];    const uniqueGoogleFonts = Array.from(new Set([
      appearance.typography.globalFont,
      appearance.typography.heroFont,
      appearance.typography.headingFont,
      appearance.typography.bodyFont,
      appearance.typography.navigationFont,
      appearance.typography.buttonFont,
      appearance.typography.quoteFont
    ]))
      .filter(f => typeof f === 'string' && f && !systemFonts.includes(f));
      
    if (uniqueGoogleFonts.length === 0) return;
    
    const fontParams = uniqueGoogleFonts
      .map(f => `family=${f.replace(/\s+/g, '+')}:wght@300;400;500;600;700`)
      .join('&');
      
    const styleId = 'appearance-google-fonts';
    let styleEl = document.getElementById(styleId);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    styleEl.innerHTML = `@import url('https://fonts.googleapis.com/css2?${fontParams}&display=swap');`;
    
  }, [appearance.typography.headingFont, appearance.typography.bodyFont, isLoaded]);

  return (
    <AppearanceContext.Provider value={{ appearance, updateAppearance, isLoaded }}>
      {children}
    </AppearanceContext.Provider>
  );
};
