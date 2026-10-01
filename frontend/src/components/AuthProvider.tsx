"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import { firebaseAuth, firebaseConfigured } from "@/lib/firebase";

type AuthState = {
  user: User | null;
  status: "loading" | "authenticated" | "unauthenticated" | "unavailable";
};

const AuthContext = createContext<AuthState>({ user: null, status: "loading" });

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthState["status"]>(
    firebaseConfigured ? "loading" : "unavailable",
  );
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!firebaseConfigured || !firebaseAuth) {
      return;
    }

    return onAuthStateChanged(firebaseAuth, (currentUser) => {
      setUser(currentUser);
      setStatus(currentUser ? "authenticated" : "unauthenticated");
    }, () => {
      setUser(null);
      setStatus("unavailable");
    });
  }, []);

  useEffect(() => {
    const publicRoute = pathname === "/" || pathname === "/login" || pathname === "/register";
    if (!publicRoute && (status === "unauthenticated" || status === "unavailable")) {
      router.replace("/login");
    }
  }, [pathname, router, status]);

  const value = useMemo(() => ({ user, status }), [user, status]);
  const isPublicRoute = pathname === "/" || pathname === "/login" || pathname === "/register";

  if (!isPublicRoute && (status === "loading" || status === "unauthenticated" || status === "unavailable")) {
    return <main className="auth-loading" aria-live="polite">Checking your account…</main>;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
