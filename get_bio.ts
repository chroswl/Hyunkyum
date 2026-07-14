import { initializeApp } from 'firebase/app';
import { initializeFirestore, getDoc, doc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCC0bGIdDWaarO8orICqahXBr77WUBCAoI",
  authDomain: "hyunkyum-kim-home.firebaseapp.com",
  projectId: "hyunkyum-kim-home",
  storageBucket: "hyunkyum-kim-home.firebasestorage.app",
  messagingSenderId: "324689885969",
  appId: "1:324689885969:web:cadd5b85dcb38a67b66ab0",
};

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {});

async function run() {
  try {
    const docRef = doc(db, 'settings', 'biography');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      console.log("BIOGRAPHY DATA:");
      console.log(JSON.stringify(docSnap.data(), null, 2));
    } else {
      console.log("No biography document found!");
    }
  } catch (error) {
    console.error("Error reading biography document:", error);
  }
}

run();
