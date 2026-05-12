import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCAKiKDfqUzPY1fMH9QDsUb7R8fL_HqzN0",
  authDomain: "andreanails-5159e.firebaseapp.com",
  projectId: "andreanails-5159e",
  storageBucket: "andreanails-5159e.firebasestorage.app",
  messagingSenderId: "221266360945",
  appId: "1:221266360945:web:a997a2ad4e4b23c1f2b9d0",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
