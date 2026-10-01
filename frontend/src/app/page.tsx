import InsightCard from "@/components/InsightCard";
import MetricCard from "@/components/MetricCard";
import Navbar from "@/components/Navbar";
import type { Insight, WellnessMetric } from "@/types";
import Link from "next/link";

const previewInsight: Insight = {
  id: "sample-insight",
  dateLabel: "SAMPLE WEEK",
  heading: "A pattern worth noticing",
  score: 78,
  title: "A little more sleep, brighter afternoons.",
  summary: "In this sample, afternoon energy averaged 7.2/10 after longer nights and 6.1/10 after shorter ones.",
  context: "An illustrative example, not a conclusion about your health.",
  comparison: { comparableDays: 8, averageAfternoonEnergy: 7.2 },
  category: "sleep",
};

const previewSignals: WellnessMetric[] = [
  { id: "sleep", label: "Sleep", value: "7.6h", description: "+35 min vs sample baseline", icon: "moon", tone: "green" },
  { id: "steps", label: "Steps", value: "6,820", description: "+540 vs sample baseline", icon: "footprints", tone: "green" },
  { id: "resting-heart-rate", label: "Resting HR", value: "64 bpm", description: "2 bpm below sample baseline", icon: "heart", tone: "green" },
  { id: "hrv", label: "HRV", value: "38 ms", description: "+4 ms vs sample baseline", icon: "activity", tone: "green" },
  { id: "energy", label: "Energy", value: "7.4/10", description: "+0.6 vs sample baseline", icon: "bolt", tone: "green" },
  { id: "active-minutes", label: "Active minutes", value: "32 min", description: "+8 min vs sample baseline", icon: "activity", tone: "green" },
];

export default function Home() {

  return (
    <main className="page-shell landing-page" id="home">
      <Navbar />
      <section className="hero wrap" aria-labelledby="hero-title">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> PERSONAL WELLNESS, MADE CLEARER</div>
          <h1 className="landing-hero-title" id="hero-title">Your body has <em>patterns.</em><br />We find them.</h1>
          <p className="hero-tagline">VIBE is a calm place to observe your rhythms and learn from your own history.</p>
          <p className="hero-description">Start with a few everyday signals. VIBE helps you notice what repeats, explore a small change, and keep what you learn.</p>
          <div className="hero-actions" id="get-started"><Link className="button button-dark" href="/signup">Start your check-in <span aria-hidden="true">→</span></Link><span className="no-pressure">No perfect routine required.</span></div>
        </div>
        <div className="hero-visual" aria-label="Illustrative sample of wellness insights">
          <div className="sun-glow" aria-hidden="true" /><div className="orbit orbit-one" aria-hidden="true" /><div className="orbit orbit-two" aria-hidden="true" />
          <span className="sparkle sparkle-one" aria-hidden="true">✳</span><span className="sparkle sparkle-two" aria-hidden="true">✳</span>
          <article className="insight-card">
            <p className="preview-data-label">ILLUSTRATIVE SAMPLE · NOT PERSONAL DATA</p>
            <InsightCard insight={previewInsight} />
            <div className="preview-metrics" aria-label="Today’s wellness signals">
              {previewSignals.map((metric) => <MetricCard key={metric.id} metric={metric} />)}
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
