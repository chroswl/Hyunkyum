import { collection, doc, getDocs, setDoc, query, onSnapshot, addDoc, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { AppearanceSettings, defaultAppearanceSettings, AppearanceHistoryEntry, CustomTheme } from '../types/appearance';

const COLLECTION_NAME = 'appearance';
const DOC_ID = 'settings';

export const sanitizeSettings = (data: any): AppearanceSettings => {
  const settings = { ...defaultAppearanceSettings, ...data } as AppearanceSettings;
  if (typeof settings.theme !== 'string' || !['dark', 'light', 'system'].includes(settings.theme)) {
    settings.theme = 'dark';
  }
  return settings;
};

export const fetchAppearanceSettings = async (): Promise<AppearanceSettings> => {
  try {
    const qSnapshot = await getDocs(query(collection(db, COLLECTION_NAME)));
    let appearanceDoc = qSnapshot.docs.find(d => d.id === DOC_ID);
    if (!appearanceDoc) {
      return defaultAppearanceSettings;
    }
    return sanitizeSettings(appearanceDoc.data());
  } catch (error) {
    console.error("Error fetching appearance settings:", error);
    return defaultAppearanceSettings;
  }
};

export const fetchAppearanceHistory = async (): Promise<AppearanceHistoryEntry[]> => {
  try {
    const qSnapshot = await getDocs(query(collection(db, 'appearanceHistory'), orderBy('publishedAt', 'desc'), limit(100)));
    return qSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as AppearanceHistoryEntry));
  } catch (error) {
    console.error("Error fetching appearance history:", error);
    return [];
  }
};

export const saveAppearanceSettings = async (settings: AppearanceSettings, note?: string, userEmail?: string): Promise<void> => {
  try {
    // Save to active settings
    await setDoc(doc(db, COLLECTION_NAME, DOC_ID), settings);
    
    // Determine new version number
    let newVersion = 1;
    try {
      const hist = await getDocs(query(collection(db, 'appearanceHistory'), orderBy('version', 'desc'), limit(1)));
      if (!hist.empty) {
        newVersion = (hist.docs[0].data().version || 0) + 1;
      }
    } catch (e) {
      console.error("Error getting last version", e);
    }

    // Save snapshot
    const snapshot: AppearanceHistoryEntry = {
      version: newVersion,
      publishedAt: Date.now(),
      publishedBy: userEmail || 'Admin',
      note: note || '',
      appearance: settings
    };
    await addDoc(collection(db, 'appearanceHistory'), snapshot);

  } catch (error) {
    console.error("Error saving appearance settings:", error);
    throw error;
  }
};

export const subscribeToAppearanceSettings = (callback: (settings: AppearanceSettings) => void) => {
  return onSnapshot(doc(db, COLLECTION_NAME, DOC_ID), (docSnap) => {
    if (docSnap.exists()) {
      callback(sanitizeSettings(docSnap.data()));
    } else {
      callback(defaultAppearanceSettings);
    }
  }, (error) => {
    console.error("Error subscribing to appearance settings:", error);
  });
};

export const fetchCustomThemes = async (): Promise<CustomTheme[]> => {
  try {
    const qSnapshot = await getDocs(query(collection(db, 'appearanceThemes'), orderBy('createdAt', 'desc')));
    return qSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as CustomTheme));
  } catch (error) {
    console.error("Error fetching custom themes:", error);
    return [];
  }
};

export const saveCustomTheme = async (theme: CustomTheme): Promise<void> => {
  try {
    await setDoc(doc(db, 'appearanceThemes', theme.id), theme);
  } catch (error) {
    console.error("Error saving custom theme:", error);
    throw error;
  }
};

export const deleteCustomTheme = async (themeId: string): Promise<void> => {
  try {
    const { deleteDoc } = await import('firebase/firestore');
    await deleteDoc(doc(db, 'appearanceThemes', themeId));
  } catch (error) {
    console.error("Error deleting custom theme:", error);
    throw error;
  }
};
