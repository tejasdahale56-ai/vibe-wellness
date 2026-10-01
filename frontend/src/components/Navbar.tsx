"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Clock, Sun, List } from "lucide-react";

import { logout } from "@/lib/api";

type NavbarProps = {
  variant?: "landing" | "product";
  activePage?: "today" | "patterns" | "history";
};

export default function Navbar({ variant = "landing", activePage }: NavbarProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    try {
      setIsLoggingOut(true);
      await logout();
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
      router.push("/login");
    }
  }

  if (variant === "product") {
    return (
      <nav className="nav wrap dashboard-nav" aria-label="Main navigation">
        <Link className="brand" href="/" aria-label="VIBE home"><span className="brand-mark" aria-hidden="true">v</span>VIBE<span className="brand-period">.</span></Link>
        <div className="nav-links dashboard-links">
          <Link href="/dashboard" aria-current={activePage === "today" ? "page" : undefined} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Sun size={14} style={{ opacity: activePage === "today" ? 1 : 0.6 }} />
            Today
          </Link>
          <Link href="/patterns" aria-current={activePage === "patterns" ? "page" : undefined} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <List size={14} style={{ opacity: activePage === "patterns" ? 1 : 0.6 }} />
            Patterns
          </Link>
          <Link href="/history" aria-current={activePage === "history" ? "page" : undefined} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Clock size={14} style={{ opacity: activePage === "history" ? 1 : 0.6 }} />
            History
          </Link>
        </div>
        <div className="dashboard-user"><span className="user-avatar" aria-hidden="true">•</span><span>Your account</span><button className="nav-logout" type="button" onClick={handleLogout} disabled={isLoggingOut}>{isLoggingOut ? "Logging out..." : "Log out"}</button></div>
      </nav>
    );
  }

  return (
    <nav className="nav wrap" aria-label="Main navigation">
      <Link className="brand" href="/" aria-label="VIBE home"><span className="brand-mark" aria-hidden="true">v</span>VIBE<span className="brand-period">.</span></Link>
      <div className="nav-links"><a href="#how-it-works">How it works</a><a href="#why-vibe">Our approach</a></div>
      <div className="nav-auth-links">
        <Link className="nav-login" href="/login">Log in</Link>
        <Link className="nav-cta" href="/signup">Sign up <span aria-hidden="true">{"\u2197"}</span></Link>
      </div>
    </nav>
  );
}
