"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ExperimentCard from "@/components/ExperimentCard";
import InsightCard from "@/components/InsightCard";
import ChatWidget from "@/components/ChatWidget";
import MetricCard from "@/components/MetricCard";
import Navbar from "@/components/Navbar";
import TodayMeal from "@/components/TodayMeal";
import {
  getDashboardFromApi,
  getExperimentsFromApi,
  getTodayInsightFromApi,
} from "@/lib/api";
import type { DashboardData, Experiment, Insight } from "@/types";

const contextMetricIds = new Set(["sleep", "resting-heart-rate", "hrv", "steps", "energy"]);

export default function InsightPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [insight, setInsight] = useState<Insight | null>(null);
  const [experiment, setExperiment] = useState<Experiment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function loadLiveData() {
      try {
        const [dashData, insData, expData] = await Promise.all([
          getDashboardFromApi(),
          getTodayInsightFromApi(),
          getExperimentsFromApi(),
        ]);
        setDashboard(dashData);
        setInsight(insData);
        setExperiment(expData[0] ?? null);
      } catch (err) {
        console.error("Failed to load insight data:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    loadLiveData();
  }, []);

  const contextMetrics = dashboard?.metrics.filter((metric) => contextMetricIds.has(metric.id)) ?? [];
  const comparableEnergy = insight?.comparison.averageAfternoonEnergy;
  const currentEnergy = dashboard?.biometrics.energyScore;

  return (
    <main className="page-shell insight-page">
      <Navbar variant="product" />
      <div className="insight-page-wrap">
        <header className="insight-page-heading">
          <p className="section-eyebrow">ANALYTICS & PATTERNS</p>
          <h1>Something worth noticing</h1>
          <p>VIBE noticed a possible pattern in your recent days.</p>
        </header>

        {loading && <p>Loading your insight...</p>}
        {!loading && error && <p>We couldn&apos;t load your insight right now.</p>}

        {!loading && !error && insight && <section className="insight-page-spotlight" aria-label="Today's insight">
          <InsightCard insight={insight} variant="detail" />
        </section>}

        {!loading && !error && dashboard && <section className="insight-page-section" aria-labelledby="looked-at-heading">
          <div className="insight-section-heading">
            <div>
              <p className="section-eyebrow">PERSONAL CONTEXT</p>
              <h2 id="looked-at-heading">What VIBE looked at</h2>
            </div>
            <span>Signals from your day</span>
          </div>
          <div className="insight-context-grid">
            <div className="insight-context-signals">
              {contextMetrics.map((metric) => (
                <MetricCard key={metric.id} metric={metric} />
              ))}
            </div>
            <div className="insight-meal-context">
              <h3>Today&apos;s meal</h3>
              <TodayMeal />
            </div>
          </div>
        </section>}

        {!loading && !error && insight && dashboard && comparableEnergy !== undefined && currentEnergy !== undefined && <section className="insight-page-section comparison-section" aria-labelledby="comparison-heading">
          <div className="insight-section-heading">
            <div>
              <p className="section-eyebrow">A SIMPLE COMPARISON</p>
              <h2 id="comparison-heading">How today compares</h2>
            </div>
          </div>
          <div className="comparison-card">
            <div className="comparison-row">
              <div className="comparison-row-copy">
                <span>Your recent comparable days</span>
                <strong>{comparableEnergy.toFixed(1)} <small>/ 10</small></strong>
              </div>
              <div className="comparison-track" aria-hidden="true">
                <span style={{ width: `${Math.min(comparableEnergy * 10, 100)}%` }} />
              </div>
            </div>
            <div className="comparison-row">
              <div className="comparison-row-copy">
                <span>Today&apos;s current energy</span>
                <strong>{currentEnergy.toFixed(1)} <small>/ 10</small></strong>
              </div>
              <div className="comparison-track comparison-track-today" aria-hidden="true">
                <span style={{ width: `${Math.min(currentEnergy * 10, 100)}%` }} />
              </div>
            </div>
            <p className="comparison-note">
              Comparable days are days with broadly similar recent signals. This comparison is descriptive, not a prediction.
            </p>
          </div>
        </section>}

        <section className="insight-philosophy" aria-labelledby="philosophy-heading">
          <span className="philosophy-mark" aria-hidden="true">✳</span>
          <div>
            <p className="section-eyebrow">YOUR HISTORY, YOUR CHOICES</p>
            <h2 id="philosophy-heading">Why we&apos;re showing you this</h2>
            <p>
              VIBE isn&apos;t trying to tell you what your body should do. It helps you notice patterns in your own history so you can decide what you want to explore.
            </p>
          </div>
        </section>

        {!loading && !error && experiment && (
          <section className="insight-experiment" aria-labelledby="explore-pattern-heading">
            <div className="insight-experiment-copy">
              <p className="section-eyebrow">KEEP IT CURIOUS</p>
              <h2 id="explore-pattern-heading">Want to explore the pattern?</h2>
            </div>
            <div className="insight-experiment-content">
              <ExperimentCard experiment={experiment} />
              <Link className="button button-dark" href="/experiment">
                Start experiment <span aria-hidden="true">→</span>
              </Link>
            </div>
          </section>
        )}

        <section className="insight-page-section chat-section" aria-labelledby="chat-title">
          <div className="insight-section-heading">
            <div>
              <p className="section-eyebrow">YOUR WELLNESS COMPANION</p>
              <h2 id="chat-title">Ask VIBE anything</h2>
            </div>
          </div>
          <ChatWidget />
        </section>
      </div>
    </main>
  );
}
