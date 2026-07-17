import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: ["AIzaSy", "CC0bGIdDWaarO8orICqahXBr77WUBCAoI"].join(""),
  authDomain: "hyunkyum-kim-home.firebaseapp.com",
  projectId: "hyunkyum-kim-home",
  storageBucket: "hyunkyum-kim-home.firebasestorage.app",
  messagingSenderId: "324689885969",
  appId: "1:324689885969:web:cadd5b85dcb38a67b66ab0"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  try {
    const contactSnap = await getDoc(doc(db, "settings", "contact"));
    if (contactSnap.exists()) {
      console.log("Contact settings:", contactSnap.data());
    }
    const bioSnap = await getDoc(doc(db, "settings", "bio"));
    if (bioSnap.exists()) {
      console.log("Bio settings:", bioSnap.data());
    }
  } catch (e) {
    console.error(e);
  }
  process.exit();
}
run();
