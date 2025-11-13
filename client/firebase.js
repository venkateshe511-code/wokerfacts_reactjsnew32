// src/firebase.ts or src/firebase.js
import { initializeApp } from "firebase/app";
import { initializeFirestore } from "firebase/firestore";
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
  apiKey: "AIzaSyComJg3GyCTJS-OFfgV8cavVWgRnoEt_lM",
  authDomain: "workerfacts-43760.firebaseapp.com",
  projectId: "workerfacts-43760",
  storageBucket: "workerfacts-43760.firebasestorage.app",
  messagingSenderId: "155819983592",
  appId: "1:155819983592:web:378ffa4e5f1276b037bf5d",
  measurementId: "G-J9FR1LKMLZ",
};

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {
  ignoreUndefinedProperties: true,
  experimentalAutoDetectLongPolling: true,
  useFetchStreams: false,
});
const auth = getAuth(app);

// Providers
const googleProvider = new GoogleAuthProvider();
// For Apple Sign-In via Firebase
const appleProvider = new OAuthProvider("apple.com");
// Request email and full name on the first sign-in (Apple only returns them once)
appleProvider.addScope("email");
appleProvider.addScope("name");
// Optional: set locale for the Apple sign-in page
appleProvider.setCustomParameters({ locale: "en" });

export { app, db, auth, googleProvider, appleProvider };
