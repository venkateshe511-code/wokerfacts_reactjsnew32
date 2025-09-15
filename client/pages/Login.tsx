import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { db, auth } from "../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import {
  Loader2,
  Apple,
  Mail,
  UserPlus,
  LogIn,
  LogOut,
  ShieldCheck,
  UserCircle,
  ArrowRight,
} from "lucide-react";

export default function Login() {
  const {
    loginWithGoogle,
    loginWithApple,
    signInWithEmail,
    signUpWithEmail,
    user,
    selectedProfileId,
    setSelectedProfileId,
  } = useAuth();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect");
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await withLoading(() =>
      mode === "signin"
        ? signInWithEmail(email, password)
        : signUpWithEmail(email, password),
    );
  };

  const postLoginRedirect = async () => {
    try {
      if (redirect && !redirect.startsWith("/register")) {
        navigate(redirect);
        return;
      }
      const uid = auth.currentUser?.uid || user?.uid;
      if (!uid) {
        navigate("/profiles");
        return;
      }
      const q = query(
        collection(db, "evaluatorProfiles"),
        where("ownerId", "==", uid),
      );
      const snap = await getDocs(q);
      const ids: string[] = [];
      snap.forEach((d) => ids.push(d.id));

      if (ids.length === 0) {
        navigate("/register");
        return;
      }

      // At least one profile exists: take user to selector
      navigate("/profiles");
    } catch {
      navigate("/profiles");
    }
  };

  const withLoading = async (fn: () => Promise<void>) => {
    setError(null);
    setLoading(true);
    try {
      await fn();
      await postLoginRedirect();
    } catch (e: any) {
      setError(e?.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">
            Sign {mode === "signin" ? "in" : "up"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="text-sm text-red-600 border border-red-200 rounded-md p-2">
              {error}
            </div>
          )}

          <Button
            type="button"
            disabled={loading}
            onClick={() => withLoading(loginWithGoogle)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? <Loader2 className="animate-spin" /> : <UserCircle />}{" "}
            Continue with Google
          </Button>

          <Button
            type="button"
            disabled={loading}
            onClick={() => withLoading(loginWithApple)}
            className="w-full bg-black hover:bg-black/90 text-white"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Apple />}{" "}
            Continue with Apple
          </Button>

          <form className="grid gap-2 pt-2" onSubmit={handleSubmit}>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : mode === "signin" ? (
                <LogIn />
              ) : (
                <UserPlus />
              )}{" "}
              {mode === "signin" ? "Sign in" : "Create account"}
            </Button>
            <button
              className="text-sm text-blue-600 hover:underline"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            >
              {mode === "signin"
                ? "Need an account? Sign up"
                : "Have an account? Sign in"}
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
