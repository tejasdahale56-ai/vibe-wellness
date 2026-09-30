"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";

type AuthPageProps = { mode: "login" | "register" };

export default function AuthPage({ mode }: AuthPageProps) {
  const isRegister = mode === "register";
  const [notice, setNotice] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("This form is a frontend preview. Account access isn’t connected yet.");
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
            {!isRegister && <div className="auth-form-meta"><label className="auth-checkbox"><input type="checkbox" name="remember" /> Remember me</label><a href="#forgot-password" onClick={(event) => { event.preventDefault(); setNotice("Password recovery isn’t connected yet."); }}>Forgot password?</a></div>}
            <button className="button button-dark auth-submit" type="submit">{isRegister ? "Create account" : "Log in"}<span aria-hidden="true">↗</span></button>
            {notice && <p className="auth-notice" role="status">{notice}</p>}
          </form>
          <p className="auth-switch">{isRegister ? "Already have an account?" : "New to VIBE?"} <Link href={isRegister ? "/login" : "/register"}>{isRegister ? "Log in" : "Create an account"}</Link></p>
          <p className="auth-privacy">Your wellness journey is personal. We’ll treat it that way.</p>
        </div>
      </section>
      <footer className="auth-footer wrap"><span>Wellness, on your wavelength.</span><Link href="/">© 2026 VIBE</Link></footer>
    </main>
  );
}
