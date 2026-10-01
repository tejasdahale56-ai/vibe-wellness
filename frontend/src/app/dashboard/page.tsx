"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import ExperimentCard from "@/components/ExperimentCard";
import ChatWidget from "@/components/ChatWidget";
import MetricCard from "@/components/MetricCard";
import Navbar from "@/components/Navbar";
import PatternCard from "@/components/PatternCard";
import TodayMeal from "@/components/TodayMeal";

import {
  getDashboardFromApi,
  createExperimentFromApi,
  getTodayHealthDataStatus,
  getExperimentsFromApi,
  getMealsFromApi,
  getPersonalBaselineFromApi,
  getPersonalMetricBaselinesFromApi,
  getPatternsFromApi,
  type PersonalBaseline,
  type PersonalMetricBaselines,
} from "@/lib/api";

import type {
  DashboardData,
  Experiment,
  Meal,
  Pattern,
  WellnessMetric,
} from "@/types";

const suggestedExperiments = [
  {
    title: "Take a short walk after lunch",
    description: "Try a comfortable 10-minute walk after one meal, then note how your afternoon energy feels.",
    why: "Explore whether a little movement after eating fits your day.",
    context: "A one-day personal experiment. Keep the pace comfortable.",
  },
  {
    title: "Make space for a calmer evening",
    description: "Set aside 20 screen-free minutes before bed and notice how you feel the next morning.",
    why: "Explore whether a gentler wind-down feels helpful for your rest.",
    context: "Try this once, then record your energy and reflection.",
  },
  {
    title: "Start with a glass of water",
    description: "Have a glass of water after waking and check in with your energy later in the morning.",
    why: "Notice whether this small morning cue fits your routine.",
    context: "A one-day personal experiment. Use your usual amount of water.",
  },
];

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

function buildBaselineMetrics(
  baseline: PersonalBaseline,
  personalValues: PersonalMetricBaselines | null,
): WellnessMetric[] {
  const definitions = [
    ["sleep", "Sleep", "sleepMinutes", "hours"],
    ["steps", "Steps", "steps", "count"],
    ["resting-heart-rate", "Resting HR", "restingHeartRateBpm", "bpm"],
    ["hrv", "HRV", "hrvMilliseconds", "ms"],
    ["energy", "Energy", "energyScore", "score"],
    ["active-minutes", "Active minutes", "activeMinutes", "minutes"],
  ] as const;
  const personalKeys = {
    sleepMinutes: "sleepMinutes",
    steps: "steps",
    restingHeartRateBpm: "restingHeartRateBpm",
    hrvMilliseconds: "hrvMilliseconds",
    activeMinutes: "activeMinutes",
    energyScore: "energyScore",
  } as const;

  return definitions.map(([id, label, key, unit]) => {
    const metric = baseline.metrics[key];
    const personalValue = personalValues?.[personalKeys[key]] ?? null;
    const reference = personalValue ?? metric.baseline;
    const latest = metric.latest;

    return {
      id,
      label,
      value: formatBaselineValue(latest ?? reference, unit),
      description: latest === null
        ? (reference === null ? "Personal baseline unavailable" : "Your personal baseline")
        : reference === null
          ? "Set a personal baseline to compare"
          : `Baseline ${formatBaselineValue(reference, unit)} · ${formatBaselineDifference(latest - reference, unit)}`,
      icon: id,
      tone: "neutral",
    };
  });
}

const comparisonDefinitions = [
  { id: "sleep", label: "Sleep", key: "sleepMinutes", unit: "hours" },
  { id: "steps", label: "Steps", key: "steps", unit: "count" },
  { id: "resting-heart-rate", label: "Resting HR", key: "restingHeartRateBpm", unit: "bpm" },
  { id: "hrv", label: "HRV", key: "hrvMilliseconds", unit: "ms" },
  { id: "energy", label: "Energy", key: "energyScore", unit: "score" },
  { id: "active-minutes", label: "Active minutes", key: "activeMinutes", unit: "minutes" },
] as const;

function buildComparisonRows(
  dashboard: DashboardData,
  history: PersonalBaseline | null,
  configured: PersonalMetricBaselines | null,
) {
  return comparisonDefinitions.map(({ id, label, key, unit }) => ({
    id,
    label,
    unit,
    today: dashboard.biometrics[key],
    baseline: configured?.[key] ?? history?.metrics[key].baseline ?? null,
  }));
}

function isMissingBiometricDataError(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.message.startsWith("API request failed (404):") &&
    error.message.includes("No biometric data found for this user.")
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [dashboard, setDashboard] =
    useState<DashboardData | null>(null);

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
  const [personalBaselineValues, setPersonalBaselineValues] =
    useState<PersonalMetricBaselines | null>(null);
  const [baselineLoading, setBaselineLoading] = useState(true);
  const [baselineError, setBaselineError] = useState(false);
  const [startingExperiment, setStartingExperiment] = useState<string | null>(null);
  const [experimentStartError, setExperimentStartError] = useState<string | null>(null);
  const [dailyImportReminder, setDailyImportReminder] = useState(false);
  const localDate = useSyncExternalStore(
    subscribeToLocalDate,
    getLocalDate,
    () => null,
  );
  const [weekday, monthDay] = localDate?.split("|") ?? [];

  useEffect(() => {
    const now = new Date();
    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    void getTodayHealthDataStatus(date)
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
          getExperimentsFromApi(),
          getPatternsFromApi(),
          getMealsFromApi(),
        ]);

        setDashboard(dashboardData);
        setHasNoBiometricData(dashboardData === null);
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
        const [history, configured] = await Promise.all([
          getPersonalBaselineFromApi(),
          getPersonalMetricBaselinesFromApi(),
        ]);
        setPersonalBaseline(history);
        setPersonalBaselineValues(configured);
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
    ? buildBaselineMetrics(personalBaseline, personalBaselineValues)
    : [];
  const comparisonRows = dashboard
    ? buildComparisonRows(dashboard, personalBaseline, personalBaselineValues)
    : [];

  async function startSuggestedExperiment(suggestion: (typeof suggestedExperiments)[number]) {
    try {
      setStartingExperiment(suggestion.title);
      setExperimentStartError(null);
      const experiment = await createExperimentFromApi({
        ...suggestion,
        durationDays: 1,
        progressPercent: 0,
        status: "planned",
        statusLabel: "Planned",
      });
      router.push(`/experiment?experiment_id=${encodeURIComponent(experiment.id)}`);
    } catch (startError) {
      console.error("Failed to start suggested experiment:", startError);
      setExperimentStartError("We couldn’t start that experiment. Please try again.");
    } finally {
      setStartingExperiment(null);
    }
  }

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
                <div>
                  <h2 id="signals-title">Today&apos;s signals</h2>
                  <span>A snapshot of your day</span>
                </div>
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
                <>
                  <p>Your first check-in gives VIBE a starting point for your personal signals.</p>
                  {personalBaseline && personalBaselineValues && (
                    <div className="signals-grid">
                      {buildBaselineMetrics(personalBaseline, personalBaselineValues).map((metric) => (
                        <MetricCard key={metric.id} metric={metric} />
                      ))}
                    </div>
                  )}
                  <Link className="button button-outline dashboard-action" href="/baseline">
                    {personalBaselineValues ? "Edit personal baselines" : "Set personal baselines"} <span aria-hidden="true">↗</span>
                  </Link>
                </>
              )}
            </section>
          </>
        )}

        {!loading &&
          !error &&
          dashboard && (
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
                  <div className="dashboard-actions">
                    <Link className="button button-outline dashboard-action" href="/check-in">
                      Update today&apos;s signals <span aria-hidden="true">↗</span>
                    </Link>
                  </div>
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
                  <Link className="button button-outline dashboard-action" href="/baseline">
                    {personalBaselineValues ? "Edit personal baselines" : "Set personal baselines"} <span aria-hidden="true">↗</span>
                  </Link>
                </div>

                {baselineLoading && <p>Loading your personal baseline...</p>}
                {!baselineLoading && baselineError && <p>We couldn&apos;t load your personal baseline.</p>}
                {!baselineLoading && !baselineError && personalBaseline?.observationCount === 0 && !personalBaselineValues && <p>No biometric observations yet. Set your personal baselines to get started.</p>}
                {!baselineLoading && !baselineError && personalBaseline && (personalBaseline.observationCount > 0 || personalBaselineValues) && (
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

                <section className="dashboard-section comparison-panel" id="baseline-comparison" aria-labelledby="comparison-heading">
                  <div className="comparison-heading">
                    <div>
                      <p className="section-eyebrow">YOUR SIX DAILY SIGNALS</p>
                      <h2 id="comparison-heading">Today vs. your baseline</h2>
                    </div>
                    <Link className="text-link" href="/baseline">Edit baselines <span aria-hidden="true">↗</span></Link>
                  </div>
                  <div className="comparison-legend" aria-label="Chart legend">
                    <span><i className="comparison-legend-baseline" /> Baseline</span>
                    <span><i className="comparison-legend-today" /> Today</span>
                  </div>
                  <div className="comparison-chart">
                    {comparisonRows.map((row) => {
                      const scale = Math.max(row.today ?? 0, row.baseline ?? 0, 1);
                      const baselineWidth = row.baseline === null ? 0 : (row.baseline / scale) * 100;
                      const todayWidth = row.today === null ? 0 : (row.today / scale) * 100;
                      return (
                        <div className="comparison-row" key={row.id}>
                          <div className="comparison-row-heading">
                            <strong>{row.label}</strong>
                            <span>Today {formatBaselineValue(row.today, row.unit)} <span aria-hidden="true">·</span> Baseline {formatBaselineValue(row.baseline, row.unit)}</span>
                          </div>
                          <div className="comparison-bars" role="img" aria-label={`${row.label}: today ${formatBaselineValue(row.today, row.unit)}, baseline ${formatBaselineValue(row.baseline, row.unit)}`}>
                            <div className="comparison-track"><i className="comparison-bar-baseline" style={{ width: `${baselineWidth}%` }} /></div>
                            <div className="comparison-track"><i className="comparison-bar-today" style={{ width: `${todayWidth}%` }} /></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>

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

            </>
          )}

        {!loading && !error && (
          <section className="dashboard-section experiment-section" aria-labelledby="experiments-title">
            <div className="section-heading">
              <div>
                <p className="section-eyebrow">A GENTLE WAY TO GET CURIOUS</p>
                <h2 id="experiments-title">Small experiments to try</h2>
                <span>Complete one, reflect on what you noticed, then save it as a pattern.</span>
              </div>
              <Link className="text-link" href="/experiment/create">Create your own <span aria-hidden="true">↗</span></Link>
            </div>

            {experiments.some((item) => item.status !== "completed") && (
              <div className="experiment-preview dashboard-active-experiments">
                {experiments.filter((item) => item.status !== "completed").map((item) => (
                  <div key={item.id}>
                    <ExperimentCard experiment={item} />
                    <Link className="button button-outline" href={`/experiment?experiment_id=${encodeURIComponent(item.id)}`}>
                      Continue experiment <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                ))}
              </div>
            )}

            {experimentStartError && <p className="meal-validation" role="alert">{experimentStartError}</p>}
            <div className="suggested-experiment-grid">
              {suggestedExperiments.map((suggestion) => (
                <article className="content-card suggested-experiment-card" key={suggestion.title}>
                  <span className="suggested-experiment-label">ONE-DAY EXPERIMENT</span>
                  <h3>{suggestion.title}</h3>
                  <p>{suggestion.description}</p>
                  <button
                    className="button button-outline"
                    type="button"
                    onClick={() => void startSuggestedExperiment(suggestion)}
                    disabled={startingExperiment !== null}
                  >
                    {startingExperiment === suggestion.title ? "Starting..." : "Try this experiment"}
                    {startingExperiment !== suggestion.title && <span aria-hidden="true">→</span>}
                  </button>
                </article>
              ))}
            </div>
            <p className="suggested-experiment-note">Experiments are personal observations, not medical advice. When you finish, choose “Save this pattern” on your result to add it to your patterns.</p>
          </section>
        )}

        {!loading && !error && dailyImportReminder && (
          <section className="dashboard-section" aria-label="Daily data reminder">
            <p>No health data has been recorded for today yet.</p>
            <Link className="button button-outline" href="/health-data">
              Import Daily Data <span aria-hidden="true">→</span>
            </Link>
          </section>
        )}

        {!loading && !error && dashboard && (
          <section className="dashboard-section chat-section" aria-labelledby="chat-title">
            <div className="section-heading">
              <div>
                <p className="section-eyebrow">YOUR WELLNESS COMPANION</p>
                <h2 id="chat-title">Ask VIBE anything</h2>
              </div>
            </div>
            <ChatWidget />
          </section>
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
