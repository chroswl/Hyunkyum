import { initializeApp } from 'firebase/app';
import { 
  initializeFirestore, 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  setDoc,
  query,
  orderBy,
  getDoc
} from 'firebase/firestore';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { getStorage, ref, uploadString, getDownloadURL, deleteObject, uploadBytesResumable } from 'firebase/storage';
import { ScheduleItem, PortfolioItem, VideoItem, ContactMessage, PressItem, ThemeSettings, BiographySettings, ContactSettings, PerformanceSlide } from './types';
import { deleteFromR2 } from './r2';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || ["AIzaSy", "CC0bGIdDWaarO8orICqahXBr77WUBCAoI"].join(""),
  authDomain: "hyunkyum-kim-home.firebaseapp.com",
  projectId: "hyunkyum-kim-home",
  storageBucket: "hyunkyum-kim-home.firebasestorage.app",
  messagingSenderId: "324689885969",
  appId: "1:324689885969:web:cadd5b85dcb38a67b66ab0",
  measurementId: "G-275E9CWL5E"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore (using default database for the new project with force long-polling enabled)
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

// Initialize Storage
export const storage = getStorage(app);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');

let cachedAccessToken: string | null = null;

export const getGoogleAccessToken = (): string | null => cachedAccessToken;
export const setGoogleAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

// Clear token on auth state change to logged out
onAuthStateChanged(auth, (user) => {
  if (!user) {
    cachedAccessToken = null;
  }
});

// Standard login
export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    if (result.user.email !== 'chroswl@gmail.com') {
      await signOut(auth);
      throw new Error('Unauthorized email address');
    }
    const credential = GoogleAuthProvider.credentialFromResult(result);
    cachedAccessToken = credential?.accessToken || null;
    return result.user;
  } catch (error) {
    console.error("Auth error:", error);
    throw error;
  }
};

export const logout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

// Firestore is the ONLY source of truth. All fallback / seed data and automatic initialization logic has been removed.

// Helper to fetch schedule from Firestore
export const fetchSchedule = async (): Promise<ScheduleItem[]> => {
  try {
    const q = query(collection(db, "schedule"));
    const querySnapshot = await getDocs(q);
    const items: ScheduleItem[] = [];
    querySnapshot.forEach((doc) => {
      items.push({ ...doc.data(), id: doc.id } as ScheduleItem);
    });
    // Sort by custom order first, then by date ascending
    return items.sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order;
      }
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  } catch (error) {
    console.error("Error fetching schedule:", error);
    return [];
  }
};

// Helper to save schedule item
export const saveScheduleItem = async (item: Omit<ScheduleItem, 'id'> & { id?: string }) => {
  if (item.id) {
    await setDoc(doc(db, "schedule", item.id), item);
    return item as ScheduleItem;
  } else {
    const docRef = await addDoc(collection(db, "schedule"), item);
    return { ...item, id: docRef.id } as ScheduleItem;
  }
};

// Secure Deletion Helper
export const verifyAuthAndDelete = async (collectionName: string, id: string): Promise<void> => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error(`AuthenticationRequired: You must be logged in to delete items.`);
  }
  
  if (user.email !== 'chroswl@gmail.com') {
    throw new Error(`PermissionDenied: User is not authorized. Authenticated as: ${user.email}. Required: chroswl@gmail.com`);
  }
  
  try {
    // Force refresh ID token to ensure it's valid
    await user.getIdToken(true);
  } catch (tokenErr: any) {
    console.error("Failed to validate auth token before deletion:", tokenErr);
    throw new Error(`AuthTokenInvalid (code: ${tokenErr.code || 'token-validation-failed'}). Message: ${tokenErr.message || 'Failed to validate auth token.'}`);
  }
  
  try {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
  } catch (err: any) {
    console.error(`Error deleting doc from collection "${collectionName}" with ID "${id}":`, err);
    let errMsg = err.message || 'Unknown error';
    if (err.code === 'permission-denied' || (err.message && err.message.includes('permission-denied'))) {
      errMsg = `Permission Denied (code: ${err.code || 'permission-denied'}). Authenticated email: ${user.email}. Required authorized email: chroswl@gmail.com. Detail: ${err.message || ''}`;
    } else {
      errMsg = `Firebase Error (code: ${err.code || 'unknown'}): ${err.message || ''}`;
    }
    const formattedError = new Error(errMsg) as any;
    formattedError.code = err.code || 'unknown';
    throw formattedError;
  }
};

// Helper to delete schedule item
export const deleteScheduleItem = async (id: string) => {
  await verifyAuthAndDelete("schedule", id);
};

// Helper to fetch portfolio
export const fetchPortfolio = async (): Promise<PortfolioItem[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, "portfolio"));
    const items: PortfolioItem[] = [];
    querySnapshot.forEach((doc) => {
      items.push({ ...doc.data(), id: doc.id } as PortfolioItem);
    });
    // Sort by custom order ascending
    return items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  } catch (error) {
    console.error("Error fetching portfolio:", error);
    return [];
  }
};

// Helper to save portfolio item
export const savePortfolioItem = async (item: Omit<PortfolioItem, 'id'> & { id?: string }) => {
  if (item.id) {
    await setDoc(doc(db, "portfolio", item.id), item);
    return item as PortfolioItem;
  } else {
    const docRef = await addDoc(collection(db, "portfolio"), item);
    return { ...item, id: docRef.id } as PortfolioItem;
  }
};

// Helper to upload Base64 images to Firebase Storage
export const uploadBase64ImageToStorage = async (path: string, base64Data: string): Promise<string> => {
  const storageRef = ref(storage, path);
  try {
    const uploadResult = await uploadString(storageRef, base64Data, 'data_url');
    const downloadURL = await getDownloadURL(uploadResult.ref);
    return downloadURL;
  } catch (error: any) {
    console.error("Firebase Storage upload failed:", error);
    throw error;
  }
};

// Helper to upload Base64 images with progress reporting
export const uploadBase64ImageWithProgress = (
  path: string,
  base64Data: string,
  onProgress: (progress: number) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const storageRef = ref(storage, path);
      const arr = base64Data.split(',');
      const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
      const bstr = atob(arr[arr.length - 1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const blob = new Blob([u8arr], { type: mime });
      
      const uploadTask = uploadBytesResumable(storageRef, blob);
      
      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress(Math.round(progress));
        }, 
        (error) => {
          console.error("Firebase Storage upload task failed:", error);
          reject(error);
        }, 
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    } catch (err) {
      console.error("Firebase Storage prepare upload failed:", err);
      reject(err);
    }
  });
};

// Helper to delete portfolio item
export const deletePortfolioItem = async (id: string) => {
  try {
    const docRef = doc(db, "portfolio", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data && data.url) {
        // Delete from Cloudflare R2
        await deleteFromR2(data.url);
        // Keep the legacy Firebase Storage cleanup just in case
        if (data.url.includes('firebasestorage.googleapis.com')) {
          try {
            const imageRef = ref(storage, data.url);
            await deleteObject(imageRef);
            console.log("Successfully deleted legacy portfolio image from Storage:", data.url);
          } catch (storageErr) {
            console.warn("Failed to delete legacy portfolio image from Storage:", storageErr);
          }
        }
      }
    }
  } catch (err) {
    console.warn("Could not retrieve portfolio item for storage cleanup:", err);
  }
  await verifyAuthAndDelete("portfolio", id);
};

// Helper to delete contact message
export const deleteContactMessage = async (id: string) => {
  await verifyAuthAndDelete("contacts", id);
};

// Helper to save contact message (can be public submit)
export const saveContactMessage = async (message: ContactMessage) => {
  await addDoc(collection(db, "contacts"), message);
};

// --- VIDEOS DATABASE CMS ---
export const fetchVideos = async (): Promise<VideoItem[]> => {
  try {
    const qSnapshot = await getDocs(collection(db, "videos"));
    const items: VideoItem[] = [];
    qSnapshot.forEach((doc) => {
      items.push({ ...doc.data(), id: doc.id } as VideoItem);
    });
    // Sort by custom order ascending
    return items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  } catch (error) {
    console.error("Error fetching videos:", error);
    return [];
  }
};

export const saveVideoItem = async (item: Omit<VideoItem, 'id'> & { id?: string }) => {
  if (item.id) {
    await setDoc(doc(db, "videos", item.id), item);
    return item as VideoItem;
  } else {
    const docRef = await addDoc(collection(db, "videos"), item);
    return { ...item, id: docRef.id } as VideoItem;
  }
};

export const deleteVideoItem = async (id: string) => {
  try {
    const docRef = doc(db, "videos", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data) {
        if (data.url) await deleteFromR2(data.url);
        if (data.thumbnail) await deleteFromR2(data.thumbnail);
      }
    }
  } catch (err) {
    console.warn("Could not retrieve video item for R2 cleanup:", err);
  }
  await verifyAuthAndDelete("videos", id);
};

// --- PRESS REVIEWS DATABASE CMS ---
export const fetchPress = async (): Promise<PressItem[]> => {
  try {
    const qSnapshot = await getDocs(collection(db, "press"));
    const items: PressItem[] = [];
    qSnapshot.forEach((doc) => {
      items.push({ ...doc.data(), id: doc.id } as PressItem);
    });
    // Sort by custom order first, then by date descending
    return items.sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order;
      }
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  } catch (error) {
    console.error("Error fetching press:", error);
    return [];
  }
};

export const savePressItem = async (item: Omit<PressItem, 'id'> & { id?: string }) => {
  if (item.id) {
    await setDoc(doc(db, "press", item.id), item);
    return item as PressItem;
  } else {
    const docRef = await addDoc(collection(db, "press"), item);
    return { ...item, id: docRef.id } as PressItem;
  }
};

export const deletePressItem = async (id: string) => {
  try {
    const docRef = doc(db, "press", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data && data.imageUrl) {
        await deleteFromR2(data.imageUrl);
      }
    }
  } catch (err) {
    console.warn("Could not retrieve press item for R2 cleanup:", err);
  }
  await verifyAuthAndDelete("press", id);
};

// --- SETTINGS: THEME, BIOGRAPHY & CONTACTS CMS ---

// Theme Settings helpers
export const fetchThemeSettings = async (): Promise<ThemeSettings> => {
  try {
    const qSnapshot = await getDocs(collection(db, "settings"));
    let themeDoc = qSnapshot.docs.find(d => d.id === "theme");
    if (!themeDoc) {
      return { bg: "#000000", text: "#ffffff", accent: "#ffffff", homeBg: "", homeBgType: 'image' };
    }
    const data = themeDoc.data() as ThemeSettings;
    
    // Check for old gold or blue
    const hasOldColor = data.accent === '#C9A227' || data.accent === '#4ea8de' || data.bg === '#000814';
    if (hasOldColor) {
      const migrated: ThemeSettings = {
        ...data,
        accent: '#ffffff',
        bg: data.bg === '#000814' ? '#000000' : data.bg
      };
      try {
        await setDoc(doc(db, "settings", "theme"), migrated);
        console.log("Firestore settings/theme successfully auto-migrated to monochrome!");
      } catch (err) {
        console.error("Failed to auto-migrate settings/theme:", err);
      }
      return migrated;
    }
    
    return data;
  } catch (error) {
    console.error("Error fetching theme settings:", error);
    return { bg: "#000000", text: "#ffffff", accent: "#ffffff", homeBg: "", homeBgType: 'image' };
  }
};

export const saveThemeSettings = async (settings: ThemeSettings) => {
  await setDoc(doc(db, "settings", "theme"), settings);
};

const DEFAULT_BIOGRAPHY: BiographySettings = {
  bioIntro: {
    EN: "Hyunkyum Kim is a Korean baritone based in Germany. His repertoire ranges from Mozart to Verdi, performing both opera and concert works throughout Europe.",
    DE: "Hyunkyum Kim ist ein koreanischer Bariton, der in Deutschland lebt und arbeitet. Sein Repertoire reicht von Mozart bis Verdi und umfasst sowohl Opern- als auch Konzertwerke in ganz Europa.",
    KO: "김현겸은 독일을 중심으로 유럽 전역에서 활동하고 있는 한국인 바리톤입니다. 모차르트부터 베르디에 이르는 넓은 레퍼토리를 지니고 있으며 오페라와 콘서트 무대를 넘나들며 종횡무진 활약하고 있습니다."
  },
  bioLong: {
    EN: "Known for his rich, warm timber and compelling stage presence, baritone Hyunkyum Kim has captivated audiences in major opera houses and concert halls. Highly expressive and vocally versatile, he brings deep intellectual interpretation and dramatic truth to characters ranging from the comedic Papageno in Die Zauberflöte to the dark, intense Rigoletto.",
    DE: "Bekannt für sein reiches, warmes Timbre und seine fesselnde Bühnenpräsenz hat der Bariton Hyunkyum Kim das Publikum in bedeutenden Opernhäusern und Konzertsälen begeistert. Äußerst ausdrucksstark und stimmlich vielseitig verleiht er Charakteren, vom komödiantischen Papageno in der Zauberflöte bis zum düsteren, intensiven Rigoletto, tiefe intellektuelle Interpretation und dramatische Wahrheit.",
    KO: "풍부하고 따뜻한 음색과 압도적인 무대 장악력으로 국내외 평단과 관객의 마음을 사로잡고 있습니다. 풍부한 표현력과 보컬의 유연성을 통해 마술피리의 유쾌한 파파게노부터 깊고 강렬한 리골레토에 이르기까지 깊이 있는 학구적 해석과 드라마틱한 진실함을 무대 위 캐릭터에 불어넣습니다."
  },
  bioImage: "/src/assets/images/hyunkyum_portrait_1783548337837.jpg",
  timeline: {
    education: [
      { year: "2021 - 2024", textEN: "Master of Music in Opera, Hochschule für Musik, Germany", textDE: "Master of Music in Oper, Hochschule für Musik, Deutschland", textKO: "독일 국립음대 오페라과 석사 졸업" },
      { year: "2016 - 2020", textEN: "Bachelor of Music in Voice, Seoul National University, Korea", textDE: "Bachelor of Music in Gesang, Seoul National University, Korea", textKO: "서울대학교 음악대학 성악과 학사 졸업" }
    ],
    awards: [
      { year: "2025", textEN: "1st Prize, International Opera Singer Competition, Germany", textDE: "1. Preis, Internationaler Opernsänger-Wettbewerb, Deutschland", textKO: "독일 국제 성악 콩쿠르 1위" },
      { year: "2024", textEN: "Special Audience Award, Spoleto Opera Competition, Italy", textDE: "Sonderpreis des Publikums, Spoleto Opernwettbewerb, Italien", textKO: "이탈리아 스폴레토 오페라 콩쿠르 청중 특별상" }
    ],
    roles: [
      { year: "Papageno", textEN: "Die Zauberflöte (Mozart)", textDE: "Die Zauberflöte (Mozart)", textKO: "마술피리 - 파파게노 역" },
      { year: "Don Giovanni", textEN: "Don Giovanni (Mozart)", textDE: "Don Giovanni (Mozart)", textKO: "돈 조반니 - 돈 조반니 역" },
      { year: "Masetto", textEN: "Don Giovanni (Mozart)", textDE: "Don Giovanni (Mozart)", textKO: "돈 조반니 - 마제토 역" },
      { year: "Rigoletto", textEN: "Rigoletto (Verdi)", textDE: "Rigoletto (Verdi)", textKO: "리골레토 - 리골레토 역" },
      { year: "Figaro", textEN: "Le Nozze di Figaro (Mozart)", textDE: "Le Nozze di Figaro (Mozart)", textKO: "피가로의 결혼 - 피가로 역" }
    ],
    concert: [
      { year: "Verdi Requiem", textEN: "Baritone Soloist, Munich Philharmonic", textDE: "Baritonsolist, Münchner Philharmoniker", textKO: "베르디 레퀴엠 바리톤 솔리스트 (뮌헨 필하모닉 협연)" },
      { year: "Handel Messiah", textEN: "Bass Soloist, Berlin Bach Choir", textDE: "Basssolist, Berliner Bach-Chor", textKO: "헨델 메시아 베이스 솔리스트 (베를린 바흐 합창단 협연)" }
    ]
  }
};

// Biography Settings helpers
export const fetchBiographySettings = async (): Promise<BiographySettings> => {
  try {
    const qSnapshot = await getDocs(collection(db, "settings"));
    let bioDoc = qSnapshot.docs.find(d => d.id === "biography");
    if (!bioDoc) {
      return DEFAULT_BIOGRAPHY;
    }
    const data = bioDoc.data() as BiographySettings;
    return {
      bioIntro: data.bioIntro || DEFAULT_BIOGRAPHY.bioIntro,
      bioLong: data.bioLong || DEFAULT_BIOGRAPHY.bioLong,
      bioImage: data.bioImage || DEFAULT_BIOGRAPHY.bioImage,
      photoCredit: data.photoCredit || "",
      photoCreditLink: data.photoCreditLink || "",
      timeline: data.timeline || DEFAULT_BIOGRAPHY.timeline,
      timelineTitles: data.timelineTitles || DEFAULT_BIOGRAPHY.timelineTitles
    };
  } catch (error) {
    console.error("Error fetching biography settings:", error);
    return DEFAULT_BIOGRAPHY;
  }
};

export const saveBiographySettings = async (settings: BiographySettings) => {
  const sanitized = JSON.parse(JSON.stringify(settings));
  if (!sanitized.timelineTitles) {
    sanitized.timelineTitles = {};
  }
  await setDoc(doc(db, "settings", "biography"), sanitized);
};

// Contact Settings helpers
export const fetchContactSettings = async (): Promise<ContactSettings> => {
  try {
    const qSnapshot = await getDocs(collection(db, "settings"));
    let contactDoc = qSnapshot.docs.find(d => d.id === "contact");
    if (!contactDoc) {
      return {
        email: "",
        phone: "",
        management: ""
      };
    }
    return contactDoc.data() as ContactSettings;
  } catch (error) {
    console.error("Error fetching contact settings:", error);
    return {
      email: "",
      phone: "",
      management: ""
    };
  }
};

export const saveContactSettings = async (settings: ContactSettings) => {
  await setDoc(doc(db, "settings", "contact"), settings);
};

// --- SELECTED PERFORMANCES SLIDES DATABASE CMS ---
export const fetchSelectedPerformances = async (): Promise<PerformanceSlide[]> => {
  try {
    const qSnapshot = await getDocs(collection(db, "selected_performances"));
    const items: PerformanceSlide[] = [];
    qSnapshot.forEach((doc) => {
      items.push({ ...doc.data(), id: doc.id } as PerformanceSlide);
    });
    // Sort by custom order ascending
    return items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  } catch (error) {
    console.error("Error fetching selected performances:", error);
    return [];
  }
};

export const saveSelectedPerformance = async (item: Omit<PerformanceSlide, 'id'> & { id?: string }) => {
  if (item.id) {
    await setDoc(doc(db, "selected_performances", item.id), item);
    return item as PerformanceSlide;
  } else {
    const docRef = await addDoc(collection(db, "selected_performances"), item);
    return { ...item, id: docRef.id } as PerformanceSlide;
  }
};

export const deleteSelectedPerformance = async (id: string) => {
  try {
    const docRef = doc(db, "selected_performances", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data && data.image) {
        await deleteFromR2(data.image);
      }
    }
  } catch (err) {
    console.warn("Could not retrieve selected performance item for R2 cleanup:", err);
  }
  await verifyAuthAndDelete("selected_performances", id);
};


