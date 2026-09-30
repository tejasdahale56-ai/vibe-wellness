"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import LatestExperimentPattern from "@/components/LatestExperimentPattern";
import Navbar from "@/components/Navbar";
import PatternCard from "@/components/PatternCard";
import {
  getAnalyticsSummaryFromApi,
  getExperimentsFromApi,
  getPatternAnalysisFromApi,
  getPatternsFromApi,
} from "@/lib/api";
import type { PatternAnalysisResponse } from "@/lib/api";
import type { Pattern, PatternSummary } from "@/types";

const categories = [
  { title: "Sleep", description: "How changes in sleep line up with your energy.", symbol: "☾", tone: "sleep" },
  { title: "Meals", description: "How meal timing and meal context appear alongside your daily signals.", symbol: "◌", tone: "meals" },
  { title: "Movement", description: "How activity appears alongside your energy and daily rhythm.", symbol: "↗", tone: "movement" },
] as const;

export default function PatternsPage() {
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [summary, setSummary] = useState<PatternSummary | null>(null);
  const [analysis, setAnalysis] = useState<PatternAnalysisResponse | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(true);
  const [analysisError, setAnalysisError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function loadPatternAnalysis() {
      try {
        setAnalysis(await getPatternAnalysisFromApi());
      } catch (err) {
        console.error("Failed to load pattern analysis:", err);
        setAnalysisError(true);
      } finally {
        setAnalysisLoading(false);
      }
    }

    async function loadPatterns() {
      try {
        const [patternData, analytics, experiments] = await Promise.all([
          getPatternsFromApi(),
          getAnalyticsSummaryFromApi(),
          getExperimentsFromApi(),
        ]);
        setPatterns(patternData);
        setSummary({
          comparableDays: analytics.insight.comparison.comparable_days,
          observations: patternData.length,
          experimentsCompleted: experiments.filter(
            (experiment) => experiment.status === "completed",
          ).length,
        });
      } catch (err) {
        console.error("Failed to load patterns:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    void loadPatternAnalysis();
    void loadPatterns();
  }, []);

  const observations = analysis?.enough_data_for_pattern
    ? analysis.observations.filter(
        (observation) =>
          observation.causal_claim === false &&
          observation.positive_experiments_with_feature >= 2,
      )
    : [];

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
            <div><dt>Comparable days</dt><dd>{summary?.comparableDays ?? "—"}</dd></div>
            <div><dt>Observations</dt><dd>{summary?.observations ?? "—"}</dd></div>
            <div><dt>Experiment completed</dt><dd>{summary?.experimentsCompleted ?? "—"}</dd></div>
          </dl>
        </section>

        <section className="patterns-page-section" aria-labelledby="collected-patterns-title">
          <div className="patterns-page-section-heading"><div><p className="section-eyebrow">OBSERVATIONS, NOT CONCLUSIONS</p><h2 id="collected-patterns-title">What has appeared in your history</h2></div><span>{summary ? `${patterns.length} observations` : "— observations"}</span></div>
          <div className="patterns-collection-grid">
            {loading && <p>Loading your saved observations...</p>}
            {error && <p>We couldn&apos;t load your saved observations.</p>}
            {!loading && !error && patterns.length === 0 && <p>No saved observations yet.</p>}
            {!loading && !error && patterns.map((pattern) => <PatternCard key={pattern.id} pattern={pattern} />)}
          </div>
        </section>

        <section className="patterns-page-section" aria-labelledby="analysis-title">
          <div className="patterns-page-section-heading">
            <div>
              <p className="section-eyebrow">DETERMINISTIC OBSERVATIONS</p>
              <h2 id="analysis-title">Meals around positive experiment results</h2>
            </div>
            <span>{analysis ? `${observations.length} observations` : ""}</span>
          </div>
          <div className="watch-grid">
            {analysisLoading && <p>Checking your experiment and meal history...</p>}
            {analysisError && <p>We couldn&apos;t load pattern analysis right now.</p>}
            {!analysisLoading && !analysisError && analysis && !analysis.enough_data_for_pattern && (
              <p>
                Not enough completed experiments with recorded energy changes yet.
                At least {analysis.minimum_positive_experiments} experiments with
                positive energy changes are needed before repeated meal observations
                can be shown.
              </p>
            )}
            {!analysisLoading && !analysisError && analysis?.enough_data_for_pattern && observations.length === 0 && (
              <p>No repeated meal observations were found in the analyzed experiment windows yet.</p>
            )}
            {!analysisLoading && !analysisError && observations.map((observation) => {
              const featureLabel = observation.feature_type === "meal_type"
                ? "Meal type"
                : "Meal";

              return (
                <article className="watch-card watch-card-meals" key={`${observation.feature_type}-${observation.feature_value}`}>
                  <span className="watch-symbol" aria-hidden="true">◌</span>
                  <h3>{featureLabel}: {observation.feature_value}</h3>
                  <p>
                    Logged during the analysis window for {observation.positive_experiments_with_feature} of {observation.positive_experiments_analyzed} completed experiments with a positive recorded energy change.
                  </p>
                  <p>This is a co-occurrence in your records and does not show that the meal caused an energy change.</p>
                </article>
              );
            })}
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
