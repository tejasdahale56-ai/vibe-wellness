"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import ExperimentCard from "@/components/ExperimentCard";
import InsightCard from "@/components/InsightCard";
import ChatWidget from "@/components/ChatWidget";
import MetricCard from "@/components/MetricCard";
import Navbar from "@/components/Navbar";
import PatternCard from "@/components/PatternCard";
import TodayMeal from "@/components/TodayMeal";
import {
  getDashboardData as getDemoDashboard,
  getExperiments as getDemoExperiments,
  getInsight as getDemoInsight,
  getPatterns as getDemoPatterns,
  getTodayMeal as getDemoMeal,
} from "@/data/demoData";

import {
  getDashboardFromApi,
  getExperimentsFromApi,
  getMealsFromApi,
  getPatternsFromApi,
  getTodayInsightFromApi,
} from "@/lib/api";

import type {
  DashboardData,
  Experiment,
  Insight,
  Meal,
  Pattern,
} from "@/types";

export default function DashboardPage() {
  const [dashboard, setDashboard] =
    useState<DashboardData | null>(null);

  const [insight, setInsight] =
    useState<Insight | null>(null);

  const [experiment, setExperiment] =
    useState<Experiment | null>(null);

  const [patterns, setPatterns] =
    useState<Pattern[]>([]);

  const [meal, setMeal] =
    useState<Meal | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        const [
          dashboardData,
          insightData,
          experimentsData,
          patternsData,
          mealsData,
        ] = await Promise.all([
          getDashboardFromApi(),
          getTodayInsightFromApi(),
          getExperimentsFromApi(),
          getPatternsFromApi(),
          getMealsFromApi(),
        ]);

        setDashboard(dashboardData);
        setInsight(insightData);
        setExperiment(experimentsData[0] ?? null);
        setPatterns(patternsData);
        setMeal(mealsData[0] ?? null);
      } catch (err) {
        console.warn("Dashboard API unavailable; using demo data.", err);
        setDashboard(getDemoDashboard());
        setInsight(getDemoInsight());
        setExperiment(getDemoExperiments()[0] ?? null);
        setPatterns(getDemoPatterns());
        setMeal(getDemoMeal());
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  return (
    <main className="page-shell dashboard-page">
      <Navbar
        variant="product"
        activePage="today"
      />

      <div className="dashboard-main wrap">
        <header className="dashboard-greeting">
          <p className="dashboard-date">
            TUESDAY{" "}
            <span aria-hidden="true">·</span>{" "}
            OCTOBER 14
          </p>

          <h1>Good afternoon, Alex.</h1>

          <p>
            Here&apos;s what your day is looking
            like so far.
          </p>
        </header>

        {loading && (
          <section
            className="dashboard-section"
            aria-live="polite"
          >
            <p>Loading your wellness data...</p>
          </section>
        )}

        {!loading &&
          dashboard &&
          insight && (
            <>
              <section
                className="dashboard-section"
                aria-labelledby="signals-title"
              >
                <div className="section-heading">
                  <h2 id="signals-title">
                    Today&apos;s signals
                  </h2>

                  <span>
                    A snapshot of your day
                  </span>
                </div>

                <div className="signals-grid">
                  {dashboard.metrics.map(
                    (metric) => (
                      <MetricCard
                        key={metric.id}
                        metric={metric}
                      />
                    ),
                  )}
                </div>
              </section>

              <div className="dashboard-feature-grid">
                <section
                  className="dashboard-section meal-section"
                  aria-labelledby="meal-title"
                >
                  <div className="section-heading">
                    <h2 id="meal-title">
                      Today&apos;s meal
                    </h2>
                  </div>

                  {meal ? (
                    <TodayMeal />
                  ) : (
                    <p>
                      No meal logged yet today.
                    </p>
                  )}

                  <Link
                    className="text-link"
                    href="/meal"
                  >
                    Log another meal{" "}
                    <span aria-hidden="true">
                      ↗
                    </span>
                  </Link>
                </section>

                <section
                  className="dashboard-section insight-section"
                  aria-labelledby="featured-insight-heading"
                >
                  <InsightCard
                    insight={insight}
                    variant="featured"
                  />

                  <Link
                    className="button button-dark insight-action"
                    href="/insight"
                  >
                    Explore this insight{" "}
                    <span aria-hidden="true">
                      →
                    </span>
                  </Link>
                </section>
              </div>

              <section
                className="dashboard-section experiment-section"
                aria-labelledby="experiment-title"
              >
                <div className="section-heading">
                  <div>
                    <p className="section-eyebrow">
                      A GENTLE WAY TO GET CURIOUS
                    </p>

                    <h2 id="experiment-title">
                      Try a small experiment
                    </h2>
                  </div>
                </div>

                {experiment ? (
                  <div className="experiment-preview">
                    <ExperimentCard
                      experiment={experiment}
                    />

                    <Link
                      className="button button-outline"
                      href="/experiment"
                    >
                      Try it{" "}
                      <span aria-hidden="true">
                        →
                      </span>
                    </Link>
                  </div>
                ) : (
                  <p>
                    No experiment is available
                    yet.
                  </p>
                )}

                <Link
                  className="text-link"
                  href="/experiment/create"
                >
                  Create new experiment{" "}
                  <span aria-hidden="true">
                    ↗
                  </span>
                </Link>
              </section>

              <section
                className="dashboard-section patterns-section"
                aria-labelledby="patterns-title"
              >
                <div className="section-heading">
                  <div>
                    <p className="section-eyebrow">
                      OBSERVATIONS, NOT CONCLUSIONS
                    </p>

                    <h2 id="patterns-title">
                      Your patterns
                    </h2>
                  </div>

                  <Link
                    className="text-link"
                    href="/patterns"
                  >
                    View all patterns{" "}
                    <span aria-hidden="true">
                      →
                    </span>
                  </Link>
                </div>

                <div className="patterns-grid">
                  {patterns.map((pattern) => (
                    <PatternCard
                      key={pattern.id}
                      pattern={pattern}
                    />
                  ))}
                </div>
              </section>

              <section
                className="dashboard-section chat-section"
                aria-labelledby="chat-title"
              >
                <div className="section-heading">
                  <div>
                    <p className="section-eyebrow">
                      YOUR WELLNESS COMPANION
                    </p>

                    <h2 id="chat-title">
                      Ask VIBE anything
                    </h2>
                  </div>
                </div>
                <ChatWidget />
              </section>
            </>
          )}
      </div>

      <footer className="footer wrap dashboard-footer">
        <Link
          className="brand footer-brand"
          href="/"
        >
          <span
            className="brand-mark"
            aria-hidden="true"
          >
            v
          </span>

          VIBE
          <span className="brand-period">
            .
          </span>
        </Link>

        <span>
          Wellness, on your wavelength.
        </span>

        <span>© 2026 VIBE</span>
      </footer>
    </main>
  );
}
