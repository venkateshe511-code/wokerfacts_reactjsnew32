// src/firebase.ts or src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, OAuthProvider } from "firebase/auth";

// const firebaseConfig = {
//   apiKey: "AIzaSyCbwtG-ld7EQw2iKcHCjjjaHNYYBnIa8II",
//   authDomain: "worker-facts-1sfbuz.firebaseapp.com",
//   projectId: "worker-facts-1sfbuz",
//   storageBucket: "worker-facts-1sfbuz.firebasestorage.app",
//   messagingSenderId: "41851697160",
//   appId: "1:41851697160:web:63adba049c38d67b9079bd",
// };

const firebaseConfig = {
  apiKey: "AIzaSyDnKn5KgsfhsQEPmwefcc1OAIWXi7IPYMA",
  authDomain: "workerfacts-60c02.firebaseapp.com",
  projectId: "workerfacts-60c02",
  storageBucket: "workerfacts-60c02.firebasestorage.app",
  messagingSenderId: "474718663619",
  appId: "1:474718663619:web:df8d6c7a99ee66168a4376",
  measurementId: "G-VKEBTTW6NS",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Providers
const googleProvider = new GoogleAuthProvider();
// For Apple Sign-In via Firebase
const appleProvider = new OAuthProvider("apple.com");

export { app, db, auth, googleProvider, appleProvider };
