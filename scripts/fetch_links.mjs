import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: ["AIzaSy", "CC0bGIdDWaarO8orICqahXBr77WUBCAoI"].join(""),
  projectId: "hyunkyum-kim-home"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
async function run() {
  const colls = ["press", "schedule", "portfolio", "videos", "slides"];
  for (const c of colls) {
    const docs = await getDocs(collection(db, c));
    docs.forEach(doc => {
      const str = JSON.stringify(doc.data());
      const links = str.match(/https?:\/\/[^"'\\]+/g);
      if (links) console.log(c, doc.id, links);
    });
  }
  process.exit();
}
run();
