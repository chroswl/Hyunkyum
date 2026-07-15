export interface LayoutMetrics {
  viewport: {
    width: number;
    height: number;
  };
  navigation: {
    height: number;
  };
  sections: Record<string, {
    top: number;
    bottom: number;
    height: number;
    isSticky: boolean;
  }>;
  anchors: Record<string, number>;
  breakpoints: {
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
  };
  timestamp: number;
}

let currentMetrics: LayoutMetrics | null = null;
const listeners = new Set<(metrics: LayoutMetrics) => void>();

export const getLayoutMetrics = () => currentMetrics;

export const subscribeToLayoutMetrics = (listener: (metrics: LayoutMetrics) => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const triggerLayoutSync = () => {
  console.log('[LayoutSync] Initiating layout recalculation...');

  // 1. Force layout reflow
  void document.body.offsetHeight;

  // 2. Measure DOM generically (no section-specific logic)
  const newMetrics: LayoutMetrics = {
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
    navigation: {
      height: 0,
    },
    sections: {},
    anchors: {},
    breakpoints: {
      isMobile: window.innerWidth < 768,
      isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
      isDesktop: window.innerWidth >= 1024,
    },
    timestamp: Date.now(),
  };

  // Measure Navigation Height
  const navElement = document.querySelector('nav') || document.querySelector('header');
  if (navElement) {
    newMetrics.navigation.height = navElement.offsetHeight;
  } else {
    const rootStyles = getComputedStyle(document.documentElement);
    const navVar = rootStyles.getPropertyValue('--navbar-height');
    if (navVar) {
      newMetrics.navigation.height = parseInt(navVar, 10) || 80;
    }
  }

  // Measure GenericSections, Anchors, and generic scroll targets
  const layoutElements = document.querySelectorAll('section[id], [data-section-id], [data-anchor]');
  layoutElements.forEach((el) => {
    const element = el as HTMLElement;
    const id = element.getAttribute('id') || element.getAttribute('data-section-id') || element.getAttribute('data-anchor');
    
    if (id) {
      const rect = element.getBoundingClientRect();
      const offsetTop = rect.top + window.scrollY;
      
      newMetrics.sections[id] = {
        top: offsetTop,
        bottom: offsetTop + rect.height,
        height: rect.height,
        isSticky: getComputedStyle(element).position === 'sticky',
      };
      
      newMetrics.anchors[id] = offsetTop;
    }
  });

  currentMetrics = newMetrics;

  // Broadcast layout measurements to any subscribers
  listeners.forEach(listener => listener(newMetrics));

  // 3. Force a resize event to trigger ResizeObservers and responsive calculations
  window.dispatchEvent(new Event('resize'));
  
  // 4. Trigger it in the parent or child window for iframe previews
  try {
    if (window.parent && window.parent !== window) {
      window.parent.dispatchEvent(new Event('resize'));
    }
  } catch (e) {
    // Ignore cross-origin frame errors
  }

  // 5. Find scroll containers and trigger scroll events to refresh sticky offsets
  window.dispatchEvent(new Event('scroll'));
  try {
    if (window.parent && window.parent !== window) {
      window.parent.dispatchEvent(new Event('scroll'));
    }
  } catch (e) {
    // Ignore cross-origin frame errors
  }
  
  // Log confirmation
  console.log('[LayoutSync] Layout recalculation completed.', newMetrics);
};
