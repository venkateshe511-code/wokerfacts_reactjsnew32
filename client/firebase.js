// src/firebase.ts or src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCbwtG-ld7EQw2iKcHCjjjaHNYYBnIa8II",
  authDomain: "worker-facts-1sfbuz.firebaseapp.com",
  projectId: "worker-facts-1sfbuz",
  storageBucket: "worker-facts-1sfbuz.firebasestorage.app",
  messagingSenderId: "41851697160",
  appId: "1:41851697160:web:63adba049c38d67b9079bd",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
