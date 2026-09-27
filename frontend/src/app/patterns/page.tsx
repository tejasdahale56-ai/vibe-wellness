import Link from "next/link";
import LatestExperimentPattern from "@/components/LatestExperimentPattern";
import Navbar from "@/components/Navbar";
import PatternCard from "@/components/PatternCard";
import { getPatternSummary, getPatterns } from "@/data/demoData";

const categories = [
  { title: "Sleep", description: "How changes in sleep line up with your energy.", symbol: "☾", tone: "sleep" },
  { title: "Meals", description: "How meal timing and meal context appear alongside your daily signals.", symbol: "◌", tone: "meals" },
  { title: "Movement", description: "How activity appears alongside your energy and daily rhythm.", symbol: "↗", tone: "movement" },
] as const;

export default function PatternsPage() {
  const patterns = getPatterns();
  const summary = getPatternSummary();

  return (
    <main className="page-shell patterns-page">
      <Navbar variant="product" activePage="patterns" />
      <div className="patterns-page-main wrap">
        <header className="patterns-page-heading">
          <p className="section-eyebrow">BASED ON YOUR RECENT HISTORY</p>
          <h1>Your patterns</h1>
          <p>Small observations become more useful when they start to repeat.</p>
        </header>

        <section className="pattern-summary" aria-labelledby="pattern-summary-title">
          <div><p className="section-eyebrow">A PERSONAL COLLECTION</p><h2 id="pattern-summary-title">Your history so far</h2></div>
          <dl className="pattern-summary-stats">
            <div><dt>Comparable days</dt><dd>{summary.comparableDays}</dd></div>
            <div><dt>Observations</dt><dd>{summary.observations}</dd></div>
            <div><dt>Experiment completed</dt><dd>{summary.experimentsCompleted}</dd></div>
          </dl>
        </section>

        <section className="patterns-page-section" aria-labelledby="collected-patterns-title">
          <div className="patterns-page-section-heading"><div><p className="section-eyebrow">OBSERVATIONS, NOT CONCLUSIONS</p><h2 id="collected-patterns-title">What has appeared in your history</h2></div><span>{patterns.length} observations</span></div>
          <div className="patterns-collection-grid">
            {patterns.map((pattern) => <PatternCard key={pattern.id} pattern={pattern} />)}
          </div>
        </section>

        <section className="patterns-page-section latest-experiment-section" aria-labelledby="latest-experiment-title">
          <div className="patterns-page-section-heading"><div><p className="section-eyebrow">ONE MORE DATA POINT</p><h2 id="latest-experiment-title">Your latest experiment</h2></div></div>
          <LatestExperimentPattern />
        </section>

        <section className="patterns-page-section watch-section" aria-labelledby="watch-title">
          <div className="patterns-page-section-heading"><div><p className="section-eyebrow">DESCRIPTIVE, NOT PRESCRIPTIVE</p><h2 id="watch-title">What VIBE is watching</h2></div></div>
          <div className="watch-grid">
            {categories.map((category) => (
              <article className={`watch-card watch-card-${category.tone}`} key={category.title}>
                <span className="watch-symbol" aria-hidden="true">{category.symbol}</span>
                <h3>{category.title}</h3>
                <p>{category.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="patterns-cta" aria-labelledby="keep-exploring-title">
          <div><p className="section-eyebrow">YOUR HISTORY, YOUR CHOICES</p><h2 id="keep-exploring-title">Keep exploring</h2><p>Log another meal or try another small experiment to give your history more context.</p></div>
          <div className="patterns-cta-actions">
            <Link className="button button-dark" href="/meal">Log a meal <span aria-hidden="true">→</span></Link>
            <Link className="button button-outline" href="/dashboard">Back to today</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
