import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  setDoc,
  query,
  orderBy
} from 'firebase/firestore';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { ScheduleItem, PortfolioItem, VideoItem, ContactMessage, PressItem, ThemeSettings, BiographySettings, ContactSettings, PerformanceSlide } from './types';

const firebaseConfig = {
  apiKey: "AIzaSyCC0bGIdDWaarO8orICqahXBr77WUBCAoI",
  authDomain: "hyunkyum-kim-home.firebaseapp.com",
  projectId: "hyunkyum-kim-home",
  storageBucket: "hyunkyum-kim-home.firebasestorage.app",
  messagingSenderId: "324689885969",
  appId: "1:324689885969:web:cadd5b85dcb38a67b66ab0",
  measurementId: "G-275E9CWL5E"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore (using default database for the new project)
export const db = getFirestore(app);


export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Standard login
export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    if (result.user.email !== 'chroswl@gmail.com') {
      await signOut(auth);
      throw new Error('Unauthorized email address');
    }
    return result.user;
  } catch (error) {
    console.error("Auth error:", error);
    throw error;
  }
};

export const logout = async () => {
  await signOut(auth);
};

// Fallback / Seed Data
export const initialSchedule: ScheduleItem[] = [
  {
    id: "sch-1",
    date: "2026-08-18",
    title: {
      EN: "Die Zauberflöte (The Magic Flute)",
      DE: "Die Zauberflöte",
      KO: "마술피리"
    },
    location: {
      EN: "Berlin State Opera, Germany",
      DE: "Staatsoper Berlin, Deutschland",
      KO: "독일 베를린 국립 오페라 극장"
    },
    role: {
      EN: "Papageno",
      DE: "Papageno",
      KO: "파파게노"
    },
    category: "Opera"
  },
  {
    id: "sch-2",
    date: "2026-09-03",
    title: {
      EN: "Don Giovanni",
      DE: "Don Giovanni",
      KO: "돈 조반니"
    },
    location: {
      EN: "Hamburg State Opera, Germany",
      DE: "Staatsoper Hamburg, Deutschland",
      KO: "독일 함부르크 국립 오페라 극장"
    },
    role: {
      EN: "Masetto",
      DE: "Masetto",
      KO: "마제토"
    },
    category: "Opera"
  },
  {
    id: "sch-3",
    date: "2026-10-21",
    title: {
      EN: "Grand Opera Gala Concert",
      DE: "Operngala Konzert",
      KO: "그랜드 오페라 갈라 콘서트"
    },
    location: {
      EN: "Hercules Hall, Munich, Germany",
      DE: "Herkulessaal, München, Deutschland",
      KO: "독일 뮌헨 헤라클레스 홀"
    },
    role: {
      EN: "Baritone Soloist",
      DE: "Baritonsolist",
      KO: "바리톤 솔리스트"
    },
    category: "Gala"
  },
  {
    id: "sch-4",
    date: "2026-11-15",
    title: {
      EN: "Liederabend: Schubert & Schumann",
      DE: "Liederabend: Schubert & Schumann",
      KO: "리더아벤트: 슈베르트와 슈만 가곡의 밤"
    },
    location: {
      EN: "Alte Oper, Frankfurt, Germany",
      DE: "Alte Oper Frankfurt, Deutschland",
      KO: "독일 프랑크푸르트 알테 오페르"
    },
    role: {
      EN: "Baritone Recitalist",
      DE: "Bariton-Rezitator",
      KO: "독창자"
    },
    category: "Recital"
  }
];

export const initialPortfolio: PortfolioItem[] = [
  {
    id: "port-1",
    url: "/src/assets/images/hyunkyum_portrait_1783548337837.jpg",
    category: "Portrait",
    title: {
      EN: "Official Artistic Portrait",
      DE: "Offizielles Künstlerportrait",
      KO: "공식 프로필 포트레이트"
    }
  },
  {
    id: "port-2",
    url: "/src/assets/images/opera_stage_1783548365279.jpg",
    category: "Stage",
    title: {
      EN: "Performing Don Giovanni at Berlin",
      DE: "Don Giovanni Aufführung in Berlin",
      KO: "베를린 돈 조반니 공연 현장"
    }
  },
  {
    id: "port-3",
    url: "/src/assets/images/opera_backstage_1783548390414.jpg",
    category: "Backstage",
    title: {
      EN: "Backstage Moments before Curtains Up",
      DE: "Hinter den Kulissen vor dem Vorhang",
      KO: "공연 시작 직전 무대 뒤 현장"
    }
  },
  {
    id: "port-4",
    url: "https://images.unsplash.com/photo-1514306191717-452ec28c7814?auto=format&fit=crop&q=80&w=800",
    category: "Stage",
    title: {
      EN: "Classic Opera Recital",
      DE: "Klassischer Liederabend",
      KO: "클래식 오페라 리사이틀"
    }
  },
  {
    id: "port-5",
    url: "https://images.unsplash.com/photo-1507838153414-b4b713384a76?auto=format&fit=crop&q=80&w=800",
    category: "Stage",
    title: {
      EN: "Orchestra Hall Performance",
      DE: "Konzertsaal Aufführung",
      KO: "오케스트라 협연 무대"
    }
  },
  {
    id: "port-6",
    url: "https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?auto=format&fit=crop&q=80&w=800",
    category: "Backstage",
    title: {
      EN: "Preparation in Dressing Room",
      DE: "Vorbereitung in der Garderobe",
      KO: "대기실 분장 및 준비"
    }
  }
];

export const initialVideos: VideoItem[] = [
  {
    id: "vid-1",
    youtubeId: "vA2uJg7O104", // Don Giovanni "Finch'han dal vino" or similar placeholder
    title: {
      EN: "Don Giovanni - Finch'han dal vino",
      DE: "Don Giovanni - Finch'han dal vino",
      KO: "돈 조반니 - 샴페인의 노래"
    },
    role: {
      EN: "Don Giovanni (Berlin, 2025)",
      DE: "Don Giovanni (Berlin, 2025)",
      KO: "돈 조반니 역 (베를린, 2025)"
    }
  },
  {
    id: "vid-2",
    youtubeId: "WzD_H_mG44k", // Figaro aria
    title: {
      EN: "Le Nozze di Figaro - Non più andrai",
      DE: "Le Nozze di Figaro - Non più andrai",
      KO: "피가로의 결혼 - 더이상 날지 못하리"
    },
    role: {
      EN: "Figaro (Munich, 2025)",
      DE: "Figaro (München, 2025)",
      KO: "피가로 역 (뮌헨, 2025)"
    }
  },
  {
    id: "vid-3",
    youtubeId: "l8bU-yG6Rps", // Rigoletto Cortigiani
    title: {
      EN: "Rigoletto - Cortigiani, vil razza dannata",
      DE: "Rigoletto - Cortigiani, vil razza dannata",
      KO: "리골레토 - 가련한 가신들이여"
    },
    role: {
      EN: "Rigoletto (Frankfurt, 2024)",
      DE: "Rigoletto (Frankfurt, 2024)",
      KO: "리골레토 역 (프랑크푸르트, 2024)"
    }
  }
];

// Helper to fetch schedule from Firestore
export const fetchSchedule = async (): Promise<ScheduleItem[]> => {
  try {
    const q = query(collection(db, "schedule"));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      // Seed if empty and logged in
      if (auth.currentUser) {
        for (const item of initialSchedule) {
          await setDoc(doc(db, "schedule", item.id), item);
        }
      }
      return initialSchedule;
    }
    const items: ScheduleItem[] = [];
    querySnapshot.forEach((doc) => {
      items.push({ ...doc.data(), id: doc.id } as ScheduleItem);
    });
    // Sort by date ascending
    return items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  } catch (error) {
    console.error("Error fetching schedule:", error);
    return initialSchedule;
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

// Helper to delete schedule item
export const deleteScheduleItem = async (id: string) => {
  await deleteDoc(doc(db, "schedule", id));
};

// Helper to fetch portfolio
export const fetchPortfolio = async (): Promise<PortfolioItem[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, "portfolio"));
    if (querySnapshot.empty) {
      // Seed if empty and logged in
      if (auth.currentUser) {
        for (const item of initialPortfolio) {
          await setDoc(doc(db, "portfolio", item.id), item);
        }
      }
      return initialPortfolio;
    }
    const items: PortfolioItem[] = [];
    querySnapshot.forEach((doc) => {
      items.push({ ...doc.data(), id: doc.id } as PortfolioItem);
    });
    return items;
  } catch (error) {
    console.error("Error fetching portfolio:", error);
    return initialPortfolio;
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

// Helper to delete portfolio item
export const deletePortfolioItem = async (id: string) => {
  await deleteDoc(doc(db, "portfolio", id));
};

// Helper to save contact message (can be public submit)
export const saveContactMessage = async (message: ContactMessage) => {
  await addDoc(collection(db, "contacts"), message);
};

// --- VIDEOS DATABASE CMS ---
export const fetchVideos = async (): Promise<VideoItem[]> => {
  try {
    const qSnapshot = await getDocs(collection(db, "videos"));
    if (qSnapshot.empty) {
      // Seed if empty and logged in
      if (auth.currentUser) {
        for (const item of initialVideos) {
          await setDoc(doc(db, "videos", item.id), item);
        }
      }
      return initialVideos;
    }
    const items: VideoItem[] = [];
    qSnapshot.forEach((doc) => {
      items.push({ ...doc.data(), id: doc.id } as VideoItem);
    });
    return items;
  } catch (error) {
    console.error("Error fetching videos:", error);
    return initialVideos;
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
  await deleteDoc(doc(db, "videos", id));
};

// --- PRESS REVIEWS DATABASE CMS ---
export const initialPress: PressItem[] = [
  {
    id: "press-1",
    source: "Opera Magazine",
    rating: 5,
    quote: {
      EN: "His rich, velvety baritone captivated the audience from the very first note. A performance of dramatic depth and vocal masterclass.",
      DE: "Sein reicher, samtiger Bariton zog das Publikum vom ersten Ton an in seinen Bann. Eine Aufführung von dramatischer Tiefe und vokaler Meisterklasse.",
      KO: "그의 풍부하고 부드러운 바리톤 성음은 첫 음부터 관객을 사로잡았다. 극적인 깊이와 보컬의 정수를 보여준 무대."
    },
    author: "Richard Morrison",
    date: "2025-11-20",
    link: "https://www.opera.co.uk",
    type: "Review"
  },
  {
    id: "press-2",
    source: "Das Opernglas",
    rating: 5,
    quote: {
      EN: "Kim's Papageno was not only vocally pristine but delivered with an infectious comic timing that stole the show.",
      DE: "Kims Papageno war nicht nur gesanglich makellos, sondern auch mit einem ansteckenden komödiantischen Timing dargeboten, das allen die Show stahl.",
      KO: "김현겸의 파파게노는 음악적으로 완벽했을 뿐만 아니라, 극 전체를 압도하는 유쾌하고 흡입력 있는 연기력을 선보였다."
    },
    author: "Dr. L. Schmidt",
    date: "2026-03-12",
    link: "https://opernglas.de",
    type: "Review"
  }
];

export const fetchPress = async (): Promise<PressItem[]> => {
  try {
    const qSnapshot = await getDocs(collection(db, "press"));
    if (qSnapshot.empty) {
      // Seed if empty and logged in
      if (auth.currentUser) {
        for (const item of initialPress) {
          await setDoc(doc(db, "press", item.id), item);
        }
      }
      return initialPress;
    }
    const items: PressItem[] = [];
    qSnapshot.forEach((doc) => {
      items.push({ ...doc.data(), id: doc.id } as PressItem);
    });
    // Sort by date descending
    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    console.error("Error fetching press:", error);
    return initialPress;
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
  await deleteDoc(doc(db, "press", id));
};

// --- SETTINGS: THEME, BIOGRAPHY & CONTACTS CMS ---
const DEFAULT_THEME: ThemeSettings = {
  bg: "#000000",
  text: "#ffffff",
  accent: "#C9A227",
  homeBg: "/src/assets/images/opera_stage_1783548365279.jpg"
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
  }
};

const DEFAULT_CONTACT: ContactSettings = {
  email: "info@hyunkyumbaritone.de",
  phone: "+49 (0) 30 1234 5678",
  management: "Aura Classical Artists Management GmbH, Berlin"
};

// Theme Settings helpers
export const fetchThemeSettings = async (): Promise<ThemeSettings> => {
  try {
    const qSnapshot = await getDocs(collection(db, "settings"));
    let themeDoc = qSnapshot.docs.find(d => d.id === "theme");
    if (!themeDoc) {
      if (auth.currentUser) {
        await setDoc(doc(db, "settings", "theme"), DEFAULT_THEME);
      }
      return DEFAULT_THEME;
    }
    return themeDoc.data() as ThemeSettings;
  } catch (error) {
    console.error("Error fetching theme settings:", error);
    return DEFAULT_THEME;
  }
};

export const saveThemeSettings = async (settings: ThemeSettings) => {
  await setDoc(doc(db, "settings", "theme"), settings);
};

// Biography Settings helpers
export const fetchBiographySettings = async (): Promise<BiographySettings> => {
  try {
    const qSnapshot = await getDocs(collection(db, "settings"));
    let bioDoc = qSnapshot.docs.find(d => d.id === "biography");
    if (!bioDoc) {
      if (auth.currentUser) {
        await setDoc(doc(db, "settings", "biography"), DEFAULT_BIOGRAPHY);
      }
      return DEFAULT_BIOGRAPHY;
    }
    return bioDoc.data() as BiographySettings;
  } catch (error) {
    console.error("Error fetching biography settings:", error);
    return DEFAULT_BIOGRAPHY;
  }
};

export const saveBiographySettings = async (settings: BiographySettings) => {
  await setDoc(doc(db, "settings", "biography"), settings);
};

// Contact Settings helpers
export const fetchContactSettings = async (): Promise<ContactSettings> => {
  try {
    const qSnapshot = await getDocs(collection(db, "settings"));
    let contactDoc = qSnapshot.docs.find(d => d.id === "contact");
    if (!contactDoc) {
      if (auth.currentUser) {
        await setDoc(doc(db, "settings", "contact"), DEFAULT_CONTACT);
      }
      return DEFAULT_CONTACT;
    }
    return contactDoc.data() as ContactSettings;
  } catch (error) {
    console.error("Error fetching contact settings:", error);
    return DEFAULT_CONTACT;
  }
};

export const saveContactSettings = async (settings: ContactSettings) => {
  await setDoc(doc(db, "settings", "contact"), settings);
};

// --- SELECTED PERFORMANCES SLIDES DATABASE CMS ---
export const initialSelectedPerformances: PerformanceSlide[] = [
  {
    id: 'perf-slide-dead-man',
    image: '/src/assets/images/opera_backstage_1783548390414.jpg',
    bgPosition: 'center 35%',
    production: {
      EN: "Dead Man Walking",
      DE: "Dead Man Walking",
      KO: "데드 맨 워킹"
    },
    role: {
      EN: "Joseph de Rocher",
      DE: "Joseph de Rocher",
      KO: "조셉 드 로셰"
    },
    house: {
      EN: "Pfalztheater Kaiserslautern",
      DE: "Pfalztheater Kaiserslautern",
      KO: "팔츠 시어터 카이저슬라우테른"
    }
  },
  {
    id: 'perf-slide-1',
    image: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?q=80&w=1600&auto=format&fit=crop',
    bgPosition: 'center',
    production: {
      EN: "Don Giovanni",
      DE: "Don Giovanni",
      KO: "돈 조반니"
    },
    role: {
      EN: "Don Giovanni (Title Role)",
      DE: "Don Giovanni (Titelrolle)",
      KO: "돈 조반니 (주역)"
    },
    house: {
      EN: "State Opera House, Prague",
      DE: "Staatsoper, Prag",
      KO: "프라하 국립 오페라 극장"
    }
  },
  {
    id: 'perf-slide-2',
    image: 'https://images.unsplash.com/photo-1460881680858-30d872d5b530?q=80&w=1600&auto=format&fit=crop',
    bgPosition: 'center',
    production: {
      EN: "Rigoletto",
      DE: "Rigoletto",
      KO: "리골레토"
    },
    role: {
      EN: "Rigoletto (Title Role)",
      DE: "Rigoletto (Titelrolle)",
      KO: "리골레토 (주역)"
    },
    house: {
      EN: "Deutsche Oper Berlin",
      DE: "Deutsche Oper Berlin",
      KO: "도이체 오페라 베를린"
    }
  },
  {
    id: 'perf-slide-3',
    image: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=1600&auto=format&fit=crop',
    bgPosition: 'center',
    production: {
      EN: "Die Zauberflöte",
      DE: "Die Zauberflöte",
      KO: "마술피리"
    },
    role: {
      EN: "Papageno",
      DE: "Papageno",
      KO: "파파게노"
    },
    house: {
      EN: "Vienna Volksoper",
      DE: "Volksoper Wien",
      KO: "빈 폴크스오퍼"
    }
  },
  {
    id: 'perf-slide-4',
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1600&auto=format&fit=crop',
    bgPosition: 'center',
    production: {
      EN: "Le Nozze di Figaro",
      DE: "Le Nozze di Figaro",
      KO: "피가로의 결혼"
    },
    role: {
      EN: "Figaro",
      DE: "Figaro",
      KO: "피가로"
    },
    house: {
      EN: "Hamburg State Opera",
      DE: "Staatsoper Hamburg",
      KO: "함부르크 국립 오페라 극장"
    }
  }
];

export const fetchSelectedPerformances = async (): Promise<PerformanceSlide[]> => {
  try {
    const qSnapshot = await getDocs(collection(db, "selected_performances"));
    if (qSnapshot.empty) {
      if (auth.currentUser) {
        for (const item of initialSelectedPerformances) {
          await setDoc(doc(db, "selected_performances", item.id), item);
        }
      }
      return initialSelectedPerformances;
    }
    const items: PerformanceSlide[] = [];
    qSnapshot.forEach((doc) => {
      items.push({ ...doc.data(), id: doc.id } as PerformanceSlide);
    });
    return items;
  } catch (error) {
    console.error("Error fetching selected performances:", error);
    return initialSelectedPerformances;
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
  await deleteDoc(doc(db, "selected_performances", id));
};


