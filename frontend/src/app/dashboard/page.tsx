import Link from "next/link";
import ExperimentCard from "@/components/ExperimentCard";
import InsightCard from "@/components/InsightCard";
import MetricCard from "@/components/MetricCard";
import Navbar from "@/components/Navbar";
import PatternCard from "@/components/PatternCard";
import TodayMeal from "@/components/TodayMeal";
import { getDashboardData, getExperiments, getInsight, getPatterns } from "@/data/demoData";

export default function DashboardPage() {
  const dashboard = getDashboardData();
  const insight = getInsight();
  const experiment = getExperiments()[0];
  const patterns = getPatterns();

  return (
    <main className="page-shell dashboard-page">
      <Navbar variant="product" activePage="today" />

      <div className="dashboard-main wrap">
        <header className="dashboard-greeting">
          <p className="dashboard-date">TUESDAY <span aria-hidden="true">·</span> OCTOBER 14</p>
          <h1>Good afternoon, Alex.</h1>
          <p>Here&apos;s what your day is looking like so far.</p>
        </header>

        <section className="dashboard-section" aria-labelledby="signals-title">
          <div className="section-heading"><h2 id="signals-title">Today&apos;s signals</h2><span>A snapshot of your day</span></div>
          <div className="signals-grid">
            {dashboard.metrics.map((metric) => <MetricCard key={metric.id} metric={metric} />)}
          </div>
        </section>

        <div className="dashboard-feature-grid">
          <section className="dashboard-section meal-section" aria-labelledby="meal-title">
            <div className="section-heading"><h2 id="meal-title">Today&apos;s meal</h2></div>
            <TodayMeal />
            <Link className="text-link" href="/meal">Log another meal <span aria-hidden="true">↗</span></Link>
          </section>

          <section className="dashboard-section insight-section" aria-labelledby="featured-insight-heading">
            <InsightCard insight={insight} variant="featured" />
            <Link className="button button-dark insight-action" href="/insight">Explore this insight <span aria-hidden="true">→</span></Link>
          </section>
        </div>

        <section className="dashboard-section experiment-section" aria-labelledby="experiment-title">
          <div className="section-heading"><div><p className="section-eyebrow">A GENTLE WAY TO GET CURIOUS</p><h2 id="experiment-title">Try a small experiment</h2></div></div>
          <div className="experiment-preview">
            <ExperimentCard experiment={experiment} />
            <Link className="button button-outline" href="/experiment">Try it <span aria-hidden="true">→</span></Link>
          </div>
        </section>

        <section className="dashboard-section patterns-section" aria-labelledby="patterns-title">
          <div className="section-heading"><div><p className="section-eyebrow">OBSERVATIONS, NOT CONCLUSIONS</p><h2 id="patterns-title">Your patterns</h2></div><Link className="text-link" href="/patterns">View all patterns <span aria-hidden="true">→</span></Link></div>
          <div className="patterns-grid">{patterns.map((pattern) => <PatternCard key={pattern.id} pattern={pattern} />)}</div>
        </section>
      </div>

      <footer className="footer wrap dashboard-footer"><Link className="brand footer-brand" href="/"><span className="brand-mark" aria-hidden="true">v</span>VIBE<span className="brand-period">.</span></Link><span>Wellness, on your wavelength.</span><span>© 2026 VIBE</span></footer>
    </main>
  );
}
