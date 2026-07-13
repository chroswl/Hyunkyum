export interface AppearanceSettings {
  theme: "dark" | "light" | "system";
  colors: {
    hero: {
      title: string;
      subtitle: string;
      buttonBg: string;
      buttonText: string;
      buttonHover: string;
      overlay: string;
      gradient: string;
      arrow: string;
      backgroundOverlayOpacity: number;
    };
    navigation: {

      background: string;

      text: string;

      hover: string;

      active: string;

      border: string;

      shadow: string;

    };

    navigationTransparent: {
      background: string;
      text: string;
      hover: string;
      active: string;
      border: string;
      shadow: string;
    };
    footer: {
      background: string;
      heading: string;
      text: string;
      links: string;
      hover: string;
      border: string;
    };
    portfolio: {
      background: string;
      title: string;
      description: string;
      cardBg: string;
      cardText: string;
      hoverOverlay: string;
    };
    biography: {
      background: string;
      title: string;
      text: string;
      highlight: string;
    };
    videos: {
      background: string;
      title: string;
      text: string;
      playButton: string;
    };
    schedule: {
      background: string;
      title: string;
      text: string;
      cardBg: string;
      cardBorder: string;
      buttonBg: string;
      buttonText: string;
      buttonHover: string;
    };
    forms: {
      background: string;
      text: string;
      border: string;
      focus: string;
      buttonBg: string;
      buttonText: string;
      buttonHover: string;
    };
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    muted: string;
    buttons: string;
    links: string;
    hover: string;
    borders: string;
  };
  typography: {

    globalFont: string;

    overrideIndividualFonts: boolean;
    heroFont: string;
    headingFont: string;
    navigationFont: string;
    buttonFont: string;
    quoteFont: string;
    bodyFont: string;
    baseFontSize: number;
    headingScale: number;
    lineHeight: number;
    fontWeight: number;
  };
  layout: {
    maxWidth: number;
    sectionSpacing: number;
    contentSpacing: number;
    borderRadius: number;
    cardPadding: number;
    verticalRhythm: number;
  };
  navigation: {
    sticky: boolean;
    transparent: boolean;
    blur: boolean;
    height: number;
    logoSize: number;
    menuGap: number;
  };
  animation: {
    enabled: boolean;
    speed: "slow" | "normal" | "fast";
    style: "fade" | "slide" | "none";
  };
  portfolio: {
    columns: number;
    gap: number;
    hoverEffect: boolean;
    roundedCorners: boolean;
  };
}

export const defaultAppearanceSettings: AppearanceSettings = {
  theme: "dark",
  colors: {
    hero: {
      title: "#ffffff",
      subtitle: "#ffffff",
      buttonBg: "#ffffff",
      buttonText: "#000000",
      buttonHover: "#e5e5e5",
      overlay: "#000000",
      gradient: "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.8) 100%)",
      arrow: "#ffffff",
      backgroundOverlayOpacity: 0.5
    },
    navigation: {

      background: "#000000",

      text: "#ffffff",

      hover: "#ffffff",

      active: "#ffffff",

      border: "#333333",

      shadow: "none"

    },

    navigationTransparent: {

      background: "transparent",

      text: "#ffffff",

      hover: "#ffffff",

      active: "#ffffff",

      border: "transparent",

      shadow: "none"

    },
    footer: {
      background: "#000000",
      heading: "#ffffff",
      text: "#999999",
      links: "#ffffff",
      hover: "#ffffff",
      border: "#333333"
    },
    portfolio: {
      background: "#000000",
      title: "#ffffff",
      description: "#999999",
      cardBg: "#111111",
      cardText: "#ffffff",
      hoverOverlay: "rgba(0,0,0,0.7)"
    },
    biography: {
      background: "#000000",
      title: "#ffffff",
      text: "#999999",
      highlight: "#ffffff"
    },
    videos: {
      background: "#000000",
      title: "#ffffff",
      text: "#999999",
      playButton: "#ffffff"
    },
    schedule: {
      background: "#000000",
      title: "#ffffff",
      text: "#999999",
      cardBg: "#111111",
      cardBorder: "#333333",
      buttonBg: "#ffffff",
      buttonText: "#000000",
      buttonHover: "#e5e5e5"
    },
    forms: {
      background: "#111111",
      text: "#ffffff",
      border: "#333333",
      focus: "#ffffff",
      buttonBg: "#ffffff",
      buttonText: "#000000",
      buttonHover: "#e5e5e5"
    },
    primary: "#ffffff",
    secondary: "#bdbdbd",
    accent: "#ffffff",
    background: "#000000",
    surface: "#111111",
    text: "#ffffff",
    muted: "#999999",
    buttons: "#ffffff",
    links: "#ffffff",
    hover: "#ffffff",
    borders: "#333333"
  },
  typography: {

    globalFont: "Inter",

    overrideIndividualFonts: true,

    heroFont: "Space Grotesk",
    headingFont: "Playfair Display",
    navigationFont: "Inter",
    buttonFont: "JetBrains Mono",
    quoteFont: "Playfair Display",
    bodyFont: "Inter",
    baseFontSize: 16,
    headingScale: 1.25,
    lineHeight: 1.6,
    fontWeight: 400
  },
  layout: {
    maxWidth: 1400,
    sectionSpacing: 120,
    contentSpacing: 40,
    borderRadius: 8,
    cardPadding: 24,
    verticalRhythm: 24
  },
  navigation: {
    sticky: true,
    transparent: true,
    blur: true,
    height: 80,
    logoSize: 24,
    menuGap: 32
  },
  animation: {
    enabled: true,
    speed: "normal",
    style: "fade"
  },
  portfolio: {
    columns: 3,
    gap: 32,
    hoverEffect: true,
    roundedCorners: true
  }
};

export interface AppearanceHistoryEntry {
  id?: string;
  version: number;
  publishedAt: number;
  publishedBy?: string;
  note?: string;
  appearance: AppearanceSettings;
}

export interface CustomTheme {
  id: string;
  name: string;
  createdAt: number;
  settings: AppearanceSettings;
  favorite?: boolean;
}
