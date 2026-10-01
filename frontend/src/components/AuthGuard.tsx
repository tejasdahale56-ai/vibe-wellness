"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

import { getCurrentUser } from "@/lib/api";

const publicRoutes = new Set(["/", "/login", "/register", "/signup"]);

type AuthCheck = {
  pathname: string;
  status: "checking" | "authenticated";
};

export default function AuthGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isPublicRoute = publicRoutes.has(pathname);
  const [authCheck, setAuthCheck] = useState<AuthCheck>({
    pathname: "",
    status: "checking",
  });

  useEffect(() => {
    let cancelled = false;

    if (isPublicRoute) {
      return;
    }

    void getCurrentUser()
      .then(() => {
        if (!cancelled) {
          setAuthCheck({ pathname, status: "authenticated" });
        }
      })
      .catch(() => {
        if (!cancelled) {
          router.replace("/login");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isPublicRoute, pathname, router]);

  if (
    isPublicRoute ||
    (authCheck.pathname === pathname && authCheck.status === "authenticated")
  ) {
    return <>{children}</>;
  }

  return (
    <main className="page-shell" aria-live="polite">
      <p className="wrap">Checking your session...</p>
    </main>
  );
}
