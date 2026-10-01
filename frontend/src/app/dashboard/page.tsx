"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";

import ExperimentCard from "@/components/ExperimentCard";
import InsightCard from "@/components/InsightCard";
import ChatWidget from "@/components/ChatWidget";
import MetricCard from "@/components/MetricCard";
import Navbar from "@/components/Navbar";
import PatternCard from "@/components/PatternCard";
import TodayMeal from "@/components/TodayMeal";

import {
  getDashboardFromApi,
  getTodayHealthDataStatus,
  getExperimentsFromApi,
  getMealsFromApi,
  getPersonalBaselineFromApi,
  getPatternsFromApi,
  getTodayInsightFromApi,
  type PersonalBaseline,
} from "@/lib/api";

import type {
  DashboardData,
  Experiment,
  Insight,
  Meal,
  Pattern,
  WellnessMetric,
} from "@/types";

function subscribeToLocalDate() {
  return () => {};
}

function getLocalDate() {
  const today = new Date();
  const weekday = today
    .toLocaleDateString("en-US", { weekday: "long" })
    .toUpperCase();
  const monthDay = today
    .toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
    })
    .toUpperCase();

  return `${weekday}|${monthDay}`;
}

function formatBaselineValue(
  value: number | null,
  unit: "hours" | "count" | "bpm" | "ms" | "minutes" | "score",
) {
  if (value === null) return "—";

  switch (unit) {
    case "hours":
      return `${(value / 60).toFixed(1)}h`;
    case "count":
      return Math.round(value).toLocaleString();
    case "bpm":
      return `${Math.round(value)} bpm`;
    case "ms":
      return `${Math.round(value)} ms`;
    case "minutes":
      return `${Math.round(value)} min`;
    case "score":
      return `${value.toFixed(1)} / 10`;
  }
}

function formatBaselineDifference(
  value: number | null,
  unit: "hours" | "count" | "bpm" | "ms" | "minutes" | "score",
) {
  if (value === null) return "No difference available";

  const sign = value > 0 ? "+" : "";
  const adjustedValue = unit === "hours" ? value / 60 : value;
  const formatted = unit === "score"
    ? adjustedValue.toFixed(1)
    : unit === "hours"
      ? adjustedValue.toFixed(1)
      : Math.round(adjustedValue).toLocaleString();
  const suffix = unit === "hours" ? "h" : unit === "bpm" ? " bpm" : unit === "ms" ? " ms" : unit === "minutes" ? " min" : "";

  return `${sign}${formatted}${suffix} vs baseline`;
}

function buildBaselineMetrics(baseline: PersonalBaseline): WellnessMetric[] {
  const definitions = [
    ["sleep", "Sleep", "sleepMinutes", "hours"],
    ["steps", "Steps", "steps", "count"],
    ["resting-heart-rate", "Resting HR", "restingHeartRateBpm", "bpm"],
    ["hrv", "HRV", "hrvMilliseconds", "ms"],
    ["active-minutes", "Active minutes", "activeMinutes", "minutes"],
    ["energy", "Energy", "energyScore", "score"],
  ] as const;

  return definitions.map(([id, label, key, unit]) => {
    const metric = baseline.metrics[key];

    return {
      id,
      label,
      value: formatBaselineValue(metric.latest, unit),
      description: metric.baseline === null
        ? "Personal baseline unavailable"
        : `Baseline ${formatBaselineValue(metric.baseline, unit)} · ${formatBaselineDifference(metric.difference, unit)}`,
      icon: id,
      tone: "neutral",
    };
  });
}

function isMissingBiometricDataError(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.message.startsWith("API request failed (404):") &&
    error.message.includes("No biometric data found for this user.")
  );
}

export default function DashboardPage() {
  const [dashboard, setDashboard] =
    useState<DashboardData | null>(null);

  const [insight, setInsight] =
    useState<Insight | null>(null);

  const [experiments, setExperiments] =
    useState<Experiment[]>([]);

  const [patterns, setPatterns] =
    useState<Pattern[]>([]);

  const [meal, setMeal] =
    useState<Meal | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] =
    useState<string | null>(null);
  const [hasNoBiometricData, setHasNoBiometricData] = useState(false);
  const [personalBaseline, setPersonalBaseline] =
    useState<PersonalBaseline | null>(null);
  const [baselineLoading, setBaselineLoading] = useState(true);
  const [baselineError, setBaselineError] = useState(false);
  const [dailyImportReminder, setDailyImportReminder] = useState(false);
  const localDate = useSyncExternalStore(
    subscribeToLocalDate,
    getLocalDate,
    () => null,
  );
  const [weekday, monthDay] = localDate?.split("|") ?? [];

  useEffect(() => {
    const now = new Date();
    const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    void getTodayHealthDataStatus(localDate)
      .then((status) => setDailyImportReminder(!status.has_data))
      .catch((statusError) => console.error("Failed to check today's health data:", statusError));
  }, []);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError(null);
        setHasNoBiometricData(false);
        const [
          dashboardData,
          insightData,
          experimentsData,
          patternsData,
          mealsData,
        ] = await Promise.all([
          getDashboardFromApi().catch((dashboardError) => {
            if (isMissingBiometricDataError(dashboardError)) {
              return null;
            }
            throw dashboardError;
          }),
          getTodayInsightFromApi(),
          getExperimentsFromApi(),
          getPatternsFromApi(),
          getMealsFromApi(),
        ]);

        setDashboard(dashboardData);
        setHasNoBiometricData(dashboardData === null);
        setInsight(insightData);
        setExperiments(experimentsData);
        setPatterns(patternsData);
        setMeal(mealsData[0] ?? null);
      } catch (err) {
        console.error("Failed to load dashboard:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong while loading your dashboard.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  useEffect(() => {
    async function loadPersonalBaseline() {
      try {
        setBaselineLoading(true);
        setBaselineError(false);
        setPersonalBaseline(await getPersonalBaselineFromApi());
      } catch (err) {
        console.error("Failed to load personal baseline:", err);
        setBaselineError(true);
      } finally {
        setBaselineLoading(false);
      }
    }

    void loadPersonalBaseline();
  }, []);

  const baselineMetrics = personalBaseline
    ? buildBaselineMetrics(personalBaseline)
    : [];

  return (
    <main className="page-shell dashboard-page">
      <Navbar
        variant="product"
        activePage="today"
      />

      <div className="dashboard-main wrap">
        <header className="dashboard-greeting">
          <p className="dashboard-date">
            {localDate && (
              <>
                {weekday}{" "}
                <span aria-hidden="true">·</span>{" "}
                {monthDay}
              </>
            )}
          </p>

          <h1>Good afternoon.</h1>

          <p>
            Here&apos;s what your day is looking
            like so far.
          </p>
        </header>

        {dailyImportReminder && (
          <section className="dashboard-section" aria-label="Daily data reminder">
            <p>No health data has been recorded for today yet.</p>
            <Link className="button button-outline" href="/health-data">
              Import Daily Data <span aria-hidden="true">→</span>
            </Link>
          </section>
        )}

        {loading && (
          <section
            className="dashboard-section"
            aria-live="polite"
          >
            <p>Loading your wellness data...</p>
          </section>
        )}

        {!loading && error && (
          <section
            className="dashboard-section"
            aria-live="assertive"
          >
            <p>
              We couldn&apos;t load your wellness
              data.
            </p>

            <p>{error}</p>
          </section>
        )}

        {!loading && !error && hasNoBiometricData && (
          <>
            <section
              className="dashboard-section"
              aria-labelledby="signals-title"
            >
              <div className="section-heading">
                <h2 id="signals-title">Today&apos;s signals</h2>
                <span>A snapshot of your day</span>
              </div>
              <p>
                VIBE needs your first wellness check-in before it can show
                your personal signals.
              </p>
              <Link className="button button-dark" href="/onboarding">
                Complete your first check-in <span aria-hidden="true">→</span>
              </Link>
            </section>

            <section
              className="dashboard-section experiment-section"
              aria-labelledby="personal-baseline-title"
            >
              <div className="section-heading">
                <div>
                  <p className="section-eyebrow">YOUR PERSONAL HISTORY</p>
                  <h2 id="personal-baseline-title">Personal baseline</h2>
                </div>
                <span>Waiting for your first data point</span>
              </div>
              {baselineLoading && <p>Loading your personal baseline...</p>}
              {!baselineLoading && baselineError && (
                <p>We couldn&apos;t load your personal baseline.</p>
              )}
              {!baselineLoading && !baselineError && (
                <p>
                  Your first check-in gives VIBE a starting point for your
                  personal baseline.
                </p>
              )}
            </section>
          </>
        )}

        {!loading &&
          !error &&
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

              <section
                className="dashboard-section experiment-section"
                aria-labelledby="personal-baseline-title"
              >
                <div className="section-heading">
                  <div>
                    <p className="section-eyebrow">
                      YOUR PERSONAL HISTORY
                    </p>
                    <h2 id="personal-baseline-title">
                      Personal baseline
                    </h2>
                  </div>
                  <span>
                    {personalBaseline
                      ? `${personalBaseline.observationCount} observations`
                      : "Latest values and averages"}
                  </span>
                </div>

                {baselineLoading && <p>Loading your personal baseline...</p>}
                {!baselineLoading && baselineError && <p>We couldn&apos;t load your personal baseline.</p>}
                {!baselineLoading && !baselineError && personalBaseline?.observationCount === 0 && <p>No biometric observations yet.</p>}
                {!baselineLoading && !baselineError && personalBaseline && personalBaseline.observationCount > 0 && (
                  <div className="signals-grid">
                    {baselineMetrics.map((metric) => (
                      <MetricCard key={metric.id} metric={metric} />
                    ))}
                  </div>
                )}
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

                {experiments.some((item) => item.status !== "completed") ? (
                  <div className="experiment-preview">
                    {experiments.filter((item) => item.status !== "completed").map((item) => (
                      <div key={item.id}>
                        <ExperimentCard experiment={item} />
                        <Link
                          className="button button-outline"
                          href={`/experiment?experiment_id=${encodeURIComponent(item.id)}`}
                        >
                          Try it <span aria-hidden="true">→</span>
                        </Link>
                      </div>
                    ))}
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
