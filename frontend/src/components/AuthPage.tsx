"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { login, signup } from "@/lib/api";

type AuthPageProps = { mode: "login" | "signup" };

export default function AuthPage({ mode }: AuthPageProps) {
  const isRegister = mode === "signup";
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    try {
      setIsSubmitting(true);
      setError("");
      if (isRegister) {
        await signup({
          name: String(formData.get("name") ?? ""),
          email,
          password,
        });
        router.push("/login");
      } else {
        await login({ email, password });
        router.push("/dashboard");
      }
    } catch (err) {
      console.error("Authentication request failed:", err);
      setError(
        isRegister
          ? "We couldn’t create your account. Check your details and try again."
          : "We couldn’t log you in. Check your email and password and try again.",
      );
    } finally {
      setIsSubmitting(false);
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
          <form className="auth-form" onSubmit={handleSubmit}>
            {isRegister && <label>First name<input name="name" type="text" autoComplete="given-name" placeholder="Your name" required /></label>}
            <label>Email address<input name="email" type="email" autoComplete="email" placeholder="you@example.com" required /></label>
            <label>Password<input name="password" type="password" autoComplete={isRegister ? "new-password" : "current-password"} placeholder={isRegister ? "At least 8 characters" : "Your password"} minLength={isRegister ? 8 : undefined} required /></label>
            <button className="button button-dark auth-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? (isRegister ? "Creating account..." : "Logging in...") : <>{isRegister ? "Create account" : "Log in"}<span aria-hidden="true">↗</span></>}</button>
            {error && <p className="auth-notice" role="alert">{error}</p>}
          </form>
          <p className="auth-switch">{isRegister ? "Already have an account?" : "New to VIBE?"} <Link href={isRegister ? "/login" : "/signup"}>{isRegister ? "Log in" : "Create an account"}</Link></p>
          <p className="auth-privacy">Your wellness journey is personal. We’ll treat it that way.</p>
        </div>
      </section>
      <footer className="auth-footer wrap"><span>Wellness, on your wavelength.</span><Link href="/">© 2026 VIBE</Link></footer>
    </main>
  );
}
