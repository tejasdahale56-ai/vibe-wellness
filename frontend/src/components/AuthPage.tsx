"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { browserLocalPersistence, browserSessionPersistence, createUserWithEmailAndPassword, sendPasswordResetEmail, setPersistence, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { firebaseAuth, firebaseConfigured } from "@/lib/firebase";
import { syncAccountFromApi } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";

type AuthPageProps = { mode: "login" | "register" };

export default function AuthPage({ mode }: AuthPageProps) {
  const isRegister = mode === "register";
  const router = useRouter();
  const { status } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const didAttemptAuth = useRef(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "authenticated" && !didAttemptAuth.current) router.replace("/dashboard");
  }, [router, status]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!firebaseAuth) return;
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));
    didAttemptAuth.current = true;
    setIsSubmitting(true);
    setError("");
    setNotice("");

    try {
      if (isRegister) {
        const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
        const name = String(form.get("name")).trim();
        if (name) {
          await updateProfile(credential.user, { displayName: name });
          await credential.user.getIdToken(true);
        }
      } else {
        const remember = Boolean(form.get("remember"));
        await setPersistence(firebaseAuth, remember ? browserLocalPersistence : browserSessionPersistence);
        await signInWithEmailAndPassword(firebaseAuth, email, password);
      }
      await syncAccountFromApi();
      router.replace(isRegister ? "/onboarding" : "/dashboard");
    } catch (authError) {
      const code = typeof authError === "object" && authError && "code" in authError
        ? String(authError.code)
        : "";
      if (code === "auth/email-already-in-use") setError("An account already exists for this email. Try logging in.");
      else if (code === "auth/invalid-credential" || code === "auth/user-not-found" || code === "auth/wrong-password") setError("That email and password combination wasn’t recognized.");
      else if (code === "auth/weak-password") setError("Choose a password with at least 8 characters.");
      else if (code === "auth/invalid-email") setError("Enter a valid email address.");
      else if (code.startsWith("auth/")) setError("We couldn’t complete that request. Please try again.");
      else if (authError instanceof Error && authError.message.includes("API request failed (503)")) {
        setError("Firebase signed you in, but the VIBE backend couldn’t verify your session. Check FIREBASE_PROJECT_ID and Firebase Admin credentials in the backend settings, then restart the backend.");
      } else if (authError instanceof Error && authError.message.includes("API request failed (401)")) {
        setError("Firebase signed you in, but the backend rejected the session. Check that the frontend and backend use the same Firebase project.");
      } else if (authError instanceof Error && authError.message.includes("API request failed (409)")) {
        setError("Your account is signed in, but its profile conflicts with an existing VIBE profile. Please contact support.");
      } else if (authError instanceof TypeError && authError.message.includes("fetch")) {
        setError("Firebase signed you in, but VIBE’s backend could not be reached. Check that the backend is running, then try again.");
      } else {
        setError("Your account was authenticated, but we couldn’t connect it to your wellness data. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePasswordReset() {
    if (!firebaseAuth) return;
    const email = (document.querySelector<HTMLInputElement>('input[name="email"]')?.value || "").trim();
    if (!email) {
      setError("Enter your email address first, then choose forgot password.");
      return;
    }
    try {
      await sendPasswordResetEmail(firebaseAuth, email);
      setError("");
      setNotice("If an account exists for that email, a password reset link has been sent.");
    } catch {
      setError("We couldn’t send a password reset email. Please check the address and try again.");
    }
  }

  return (
    <main className="auth-shell">
      <header className="auth-header wrap">
        <Link className="brand" href="/" aria-label="VIBE home"><span className="brand-mark" aria-hidden="true">v</span>VIBE<span className="brand-period">.</span></Link>
        <Link className="auth-home-link" href="/">Back to home <span aria-hidden="true">↗</span></Link>
      </header>
      <section className="auth-layout wrap" aria-labelledby="auth-title">
        <div className="auth-intro">
          <span className="eyebrow"><span className="eyebrow-dot" /> A LITTLE MORE YOU</span>
          <h1>{isRegister ? <>Make room<br />for <em>you.</em></> : <>Welcome<br /><em>back.</em></>}</h1>
          <p>{isRegister ? "Start noticing what helps you feel your best. Your wellness journey can begin with one small check-in." : "Pick up where you left off and keep discovering the rhythms that feel right for you."}</p>
          <div className="auth-note"><span aria-hidden="true">✳</span><p><strong>No perfect days required.</strong><br />Just a little curiosity, at your own pace.</p></div>
        </div>
        <div className="auth-card">
          <p className="section-eyebrow">{isRegister ? "YOUR NEXT CHAPTER" : "GOOD TO SEE YOU"}</p>
          <h2 id="auth-title">{isRegister ? "Create your account" : "Log in to VIBE"}</h2>
          <p className="auth-card-subtitle">{isRegister ? "A calmer way to understand your everyday wellness." : "Your personal wellness space is ready when you are."}</p>
          {!firebaseConfigured && <p className="auth-notice" role="status">Firebase isn’t configured yet. Add the Firebase environment variables to enable account access.</p>}
          <form className="auth-form" onSubmit={handleSubmit}>
            {isRegister && <label>First name<input name="name" type="text" autoComplete="given-name" placeholder="Your name" required disabled={!firebaseConfigured || isSubmitting} /></label>}
            <label>Email address<input name="email" type="email" autoComplete="email" placeholder="you@example.com" required disabled={!firebaseConfigured || isSubmitting} /></label>
            <label>Password<input name="password" type="password" autoComplete={isRegister ? "new-password" : "current-password"} placeholder={isRegister ? "At least 8 characters" : "Your password"} minLength={isRegister ? 8 : undefined} required disabled={!firebaseConfigured || isSubmitting} /></label>
            {!isRegister && <div className="auth-form-meta"><label className="auth-checkbox"><input type="checkbox" name="remember" /> Remember me</label><button className="auth-text-button" type="button" onClick={handlePasswordReset}>Forgot password?</button></div>}
            {error && <p className="auth-error" role="alert">{error}</p>}
            {notice && <p className="auth-notice" role="status">{notice}</p>}
            <button className="button button-dark auth-submit" type="submit" disabled={!firebaseConfigured || isSubmitting}>{isSubmitting ? "Please wait…" : isRegister ? "Create account" : "Log in"}<span aria-hidden="true">↗</span></button>
          </form>
          <p className="auth-switch">{isRegister ? "Already have an account?" : "New to VIBE?"} <Link href={isRegister ? "/login" : "/register"}>{isRegister ? "Log in" : "Create an account"}</Link></p>
          <p className="auth-privacy">Your wellness journey is personal. We’ll treat it that way.</p>
        </div>
      </section>
      <footer className="auth-footer wrap"><span>Wellness, on your wavelength.</span><Link href="/">© 2026 VIBE</Link></footer>
    </main>
  );
}
