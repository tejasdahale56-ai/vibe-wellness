"use client";

import { useEffect, useState } from "react";
import InsightCard from "@/components/InsightCard";
import MetricCard from "@/components/MetricCard";
import Navbar from "@/components/Navbar";
import { getDashboardFromApi, getTodayInsightFromApi } from "@/lib/api";
import type { DashboardData, Insight } from "@/types";
import Link from "next/link";

export default function Home() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [insight, setInsight] = useState<Insight | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadPreview() {
      const [dashboardResult, insightResult] = await Promise.allSettled([
        getDashboardFromApi(),
        getTodayInsightFromApi(),
      ]);

      if (!isMounted) return;
      if (dashboardResult.status === "fulfilled") {
        setDashboard(dashboardResult.value);
      }
      if (insightResult.status === "fulfilled") {
        setInsight(insightResult.value);
      }
    }

    void loadPreview();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className="page-shell" id="home">
      <Navbar />
      <section className="hero wrap" aria-labelledby="hero-title">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> PERSONAL WELLNESS, MADE CLEARER</div>
          <h1 className="landing-hero-title" id="hero-title">Your body has <em>patterns.</em><br />We find them.</h1>
          <p className="hero-tagline">VIBE is a calm place to observe your rhythms and learn from your own history.</p>
          <p className="hero-description">Start with a few everyday signals. VIBE helps you notice what repeats, explore a small change, and keep what you learn.</p>
          <div className="hero-actions" id="get-started"><Link className="button button-dark" href="/signup">Start your check-in <span aria-hidden="true">→</span></Link><span className="no-pressure">No perfect routine required.</span></div>
        </div>
        <div className="hero-visual" aria-label="A preview of your personal wellness insights">
          <div className="sun-glow" aria-hidden="true" /><div className="orbit orbit-one" aria-hidden="true" /><div className="orbit orbit-two" aria-hidden="true" />
          <span className="sparkle sparkle-one" aria-hidden="true">✳</span><span className="sparkle sparkle-two" aria-hidden="true">✳</span>
          <article className="insight-card">
            {insight ? <InsightCard insight={insight} /> : (
              <div className="insight-summary">
                <div className="card-topline"><span className="card-kicker">YOUR DAILY VIBE</span></div>
                <div className="score-copy"><span className="score-label">A PLACE TO START</span><strong>Check in to see your personal patterns.</strong></div>
              </div>
            )}
            <div className="preview-metrics" aria-label="Today’s wellness signals">
              {dashboard?.metrics.length ? dashboard.metrics.map((metric) => <MetricCard key={metric.id} metric={metric} />) : (
                <p>Complete a check-in to see your wellness signals here.</p>
              )}
            </div>
            <div className="card-foot"><span className="foot-sparkle" aria-hidden="true">✦</span><span>Small steps count, too.</span><span className="foot-arrow" aria-hidden="true">↗</span></div>
          </article>
          <div className="floating-note"><span className="note-icon" aria-hidden="true">✿</span><span><strong>Your pace is the right pace.</strong><small>One day at a time</small></span></div>
          <span className="visual-caption">A clearer picture, at your pace.</span>
        </div>
      </section>
      <section className="landing-section wrap" id="how-it-works" aria-labelledby="how-it-works-title">
        <div className="landing-section-heading">
          <p className="section-eyebrow">HOW VIBE WORKS</p>
          <h2 id="how-it-works-title">A simple loop for learning from your own days.</h2>
          <p>There is no generic score to chase. Just a clear, repeatable way to get curious about your routine.</p>
        </div>
        <ol className="vibe-loop">
          <li><span>01</span><strong>Observe</strong><p>Record the signals and moments that matter to you.</p></li>
          <li><span>02</span><strong>Hypothesize</strong><p>Notice a small question worth exploring.</p></li>
          <li><span>03</span><strong>Intervene</strong><p>Try one manageable change at a time.</p></li>
          <li><span>04</span><strong>Measure</strong><p>Check what happened in your own record.</p></li>
          <li><span>05</span><strong>Learn</strong><p>Keep observations, not assumptions.</p></li>
        </ol>
      </section>
      <section className="landing-section landing-approach wrap" id="our-approach" aria-labelledby="our-approach-title">
        <div className="landing-section-heading">
          <p className="section-eyebrow">OUR APPROACH</p>
          <h2 id="our-approach-title">Evidence-aware, personal, and deliberately modest.</h2>
        </div>
        <div className="approach-grid">
          <p><strong>Your baseline first.</strong> VIBE looks for context in your own history rather than comparing you to a generic average.</p>
          <p><strong>Small N-of-1 experiments.</strong> One focused change can be easier to understand than a complete routine overhaul.</p>
          <p><strong>Deterministic analytics, with AI where appropriate.</strong> Clear calculations come first; assistance should add context, not certainty.</p>
          <p><strong>Explanations with evidence in mind.</strong> We distinguish personal observations from population evidence and model estimates.</p>
        </div>
      </section>
      <section className="landing-cta wrap" aria-labelledby="landing-cta-title">
        <div><p className="section-eyebrow">BEGIN WITH ONE CHECK-IN</p><h2 id="landing-cta-title">Make space to notice what works for you.</h2><p>Your history stays yours. Start with a small signal, then build from there.</p></div>
        <Link className="button button-dark" href="/signup">Create your VIBE space <span aria-hidden="true">→</span></Link>
      </section>
      <footer className="footer wrap"><Link className="brand footer-brand" href="/"><span className="brand-mark" aria-hidden="true">v</span>VIBE<span className="brand-period">.</span></Link><span>Wellness, on your wavelength.</span><span>© 2026 VIBE</span></footer>
    </main>
  );
}
