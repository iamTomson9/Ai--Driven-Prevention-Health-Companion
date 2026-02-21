import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDCeCLiM_tJ9XAVXC_frNww6Dkbepz1Shc",
  authDomain: "ai-hcp267.firebaseapp.com",
  projectId: "ai-hcp267",
  storageBucket: "ai-hcp267.firebasestorage.app",
  messagingSenderId: "215351716227",
  appId: "1:215351716227:web:ad06aaef7d35542908eeb6",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
