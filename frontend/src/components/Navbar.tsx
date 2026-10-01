"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { logout } from "@/lib/api";

type NavbarProps = {
  variant?: "landing" | "product";
  activePage?: "today" | "patterns" | "history";
};

const appLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/health-data", label: "Daily Data" },
  { href: "/history", label: "Health History" },
  { href: "/patterns", label: "Patterns" },
  { href: "/experiment", label: "Experiments" },
  { href: "/experiment/create", label: "Create Experiment" },
  { href: "/meal", label: "Meals / Log Meal" },
  { href: "/insight", label: "Insights" },
  { href: "/onboarding", label: "Goals" },
];

function Brand() {
  return (
    <Link className="brand" href="/" aria-label="VIBE home">
      <span className="brand-mark" aria-hidden="true">v</span>
      VIBE<span className="brand-period">.</span>
    </Link>
  );
}

export default function Navbar({ variant = "landing" }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isDrawerMounted, setIsDrawerMounted] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        window.setTimeout(() => setIsDrawerMounted(false), 180);
      }
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  async function handleLogout() {
    try {
      setIsLoggingOut(true);
      await logout();
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
      closeDrawer();
      router.push("/login");
    }
  }

  function isCurrentRoute(href: string) {
    if (href === "/experiment") {
      return pathname === "/experiment" || pathname === "/result";
    }
    return pathname === href;
  }

  function openDrawer() {
    setIsDrawerMounted(true);
    window.requestAnimationFrame(() => setIsOpen(true));
  }

  function closeDrawer() {
    setIsOpen(false);
    menuButtonRef.current?.focus();
    window.setTimeout(() => setIsDrawerMounted(false), 180);
  }

  if (variant === "product") {
    return (
      <>
        <nav className="nav wrap app-nav" aria-label="Main navigation">
          <Brand />
          <button
            className="menu-toggle"
            type="button"
            ref={menuButtonRef}
            aria-label="Open navigation menu"
            aria-expanded={isOpen}
            aria-controls="app-navigation-drawer"
            onClick={openDrawer}
          >
            <span aria-hidden="true" />
            <span aria-hidden="true" />
            <span aria-hidden="true" />
          </button>
        </nav>

        {isDrawerMounted && (
          <div className={`app-drawer-layer${isOpen ? " is-open" : ""}`} onMouseDown={closeDrawer}>
            <aside
              className="app-drawer"
              id="app-navigation-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="VIBE navigation"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className="app-drawer-header">
                <Brand />
                <button
                  className="drawer-close"
                  type="button"
                  ref={closeButtonRef}
                  aria-label="Close navigation menu"
                  onClick={closeDrawer}
                >
                  <span aria-hidden="true">×</span>
                </button>
              </div>

              <nav className="drawer-links" aria-label="Product navigation">
                {appLinks.map((link) => (
                  <Link
                    href={link.href}
                    key={link.href}
                    aria-current={isCurrentRoute(link.href) ? "page" : undefined}
                    onClick={closeDrawer}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              <div className="drawer-divider" />

              <nav className="drawer-links drawer-links-secondary" aria-label="About VIBE">
                <Link href="/#how-it-works" onClick={closeDrawer}>How VIBE Works</Link>
                <Link href="/#our-approach" onClick={closeDrawer}>Our Approach</Link>
              </nav>

              <button
                className="drawer-logout"
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? "Logging out..." : "Log out"}
              </button>
            </aside>
          </div>
        )}
      </>
    );
  }

  return (
    <nav className="nav wrap" aria-label="Main navigation">
      <Brand />
      <div className="nav-links">
        <Link href="/#how-it-works">How VIBE Works</Link>
        <Link href="/#our-approach">Our Approach</Link>
      </div>
      <div className="nav-auth-links">
        <Link className="nav-login" href="/login">Log in</Link>
        <Link className="nav-cta" href="/signup">Sign up <span aria-hidden="true">↗</span></Link>
      </div>
    </nav>
  );
}
