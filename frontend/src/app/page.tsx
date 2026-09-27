import InsightCard from "@/components/InsightCard";
import MetricCard from "@/components/MetricCard";
import Navbar from "@/components/Navbar";
import { getDashboardData, getInsight } from "@/data/demoData";
import Link from "next/link";

export default function Home() {
  const dashboard = getDashboardData();
  const insight = getInsight();

  return (
    <main className="page-shell" id="home">
      <Navbar />
      <section className="hero wrap" aria-labelledby="hero-title">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> YOUR WELLNESS, IN A NEW LIGHT</div>
          <h1 id="hero-title">Feel more<br />like <em>you.</em></h1>
          <p className="hero-tagline">Your body has patterns. We help you discover them.</p>
          <p className="hero-description">Wellness isn’t one-size-fits-all. VIBE helps you notice the little things, understand your patterns, and find what feels right for you.</p>
          <div className="hero-actions" id="get-started"><Link className="button button-dark" href="/dashboard">Find your rhythm <span aria-hidden="true">↗</span></Link><span className="no-pressure">A gentler way to check in with yourself.</span></div>
          <div className="social-proof"><div className="avatars" aria-hidden="true"><span>J</span><span>M</span><span>A</span></div><p>Made for real life, <strong>not perfection.</strong></p></div>
        </div>
        <div className="hero-visual" aria-label="A preview of your personal wellness insights">
          <div className="sun-glow" aria-hidden="true" /><div className="orbit orbit-one" aria-hidden="true" /><div className="orbit orbit-two" aria-hidden="true" />
          <span className="sparkle sparkle-one" aria-hidden="true">✳</span><span className="sparkle sparkle-two" aria-hidden="true">✳</span>
          <article className="insight-card">
            <InsightCard insight={insight} />
            <div className="preview-metrics" aria-label="Today’s wellness signals">{dashboard.metrics.map((metric) => <MetricCard key={metric.id} metric={metric} />)}</div>
            <div className="card-foot"><span className="foot-sparkle" aria-hidden="true">✦</span><span>Small steps count, too.</span><span className="foot-arrow" aria-hidden="true">↗</span></div>
          </article>
          <div className="floating-note"><span className="note-icon" aria-hidden="true">✿</span><span><strong>Your pace is the right pace.</strong><small>One day at a time</small></span></div>
          <span className="visual-caption">A clearer picture, at your pace.</span>
        </div>
      </section>
      <section className="bottom-strip wrap" id="how-it-works" aria-label="How VIBE works">
        <div className="strip-intro"><span className="strip-star" aria-hidden="true">✳</span><p>Less pressure.<br /><strong>More understanding.</strong></p></div>
        <div className="strip-item"><span aria-hidden="true">01</span><p><strong>Get curious</strong><small>Notice what your days are telling you.</small></p></div>
        <div className="strip-item"><span aria-hidden="true">02</span><p><strong>Find your patterns</strong><small>See how the little things connect.</small></p></div>
        <div className="strip-item"><span aria-hidden="true">03</span><p><strong>Choose what feels right</strong><small>Make wellness yours, one step at a time.</small></p></div>
      </section>
      <footer className="footer wrap" id="why-vibe"><Link className="brand footer-brand" href="/"><span className="brand-mark" aria-hidden="true">v</span>VIBE<span className="brand-period">.</span></Link><span>Wellness, on your wavelength.</span><span>© 2026 VIBE</span></footer>
    </main>
  );
}
