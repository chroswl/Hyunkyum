import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadString } from 'firebase/storage';
import fs from 'fs';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: "hyunkyum-kim-home.firebaseapp.com",
  projectId: "hyunkyum-kim-home",
  storageBucket: "hyunkyum-kim-home.firebasestorage.app",
  messagingSenderId: "123",
  appId: "123"
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const testRef = ref(storage, 'test.txt');
uploadString(testRef, 'hello world').then(() => {
  console.log('Upload success');
}).catch(e => {
  console.error('Upload failed', e.message);
});
