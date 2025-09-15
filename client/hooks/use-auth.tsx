import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { auth, googleProvider, appleProvider } from "../firebase";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  User,
} from "firebase/auth";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  selectedProfileId: string | null;
  setSelectedProfileId: (id: string | null) => void;
  loginWithGoogle: () => Promise<void>;
  loginWithApple: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProfileId, setSelectedProfileIdState] = useState<
    string | null
  >(() => localStorage.getItem("selectedEvaluatorProfileId"));

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const setSelectedProfileId = (id: string | null) => {
    setSelectedProfileIdState(id);
    if (id) localStorage.setItem("selectedEvaluatorProfileId", id);
    else localStorage.removeItem("selectedEvaluatorProfileId");
  };

  const loginWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const loginWithApple = async () => {
    await signInWithPopup(auth, appleProvider);
  };

  const signInWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUpWithEmail = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setSelectedProfileId(null);
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      selectedProfileId,
      setSelectedProfileId,
      loginWithGoogle,
      loginWithApple,
      signInWithEmail,
      signUpWithEmail,
      resetPassword,
      signOut,
    }),
    [user, loading, selectedProfileId],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
