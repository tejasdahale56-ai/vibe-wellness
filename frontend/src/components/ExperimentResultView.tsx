"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createPatternFromApi, getExperimentFromApi } from "@/lib/api";
import type { Experiment } from "@/types";

type ExperimentResultViewProps = {
  experimentId?: string;
};

export default function ExperimentResultView({
  experimentId,
}: ExperimentResultViewProps) {
  const router = useRouter();
  const [result, setResult] = useState<Experiment | null>(null);
  const [loading, setLoading] = useState(Boolean(experimentId));
  const [error, setError] = useState<string | null>(
    experimentId ? null : "We couldn\u2019t find an experiment to display.",
  );
  const [isSavingPattern, setIsSavingPattern] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!experimentId) return;

    const id = experimentId;
    let isMounted = true;

    async function loadExperiment() {
      try {
        const experiment = await getExperimentFromApi(id);
        if (experiment.id !== id || experiment.status !== "completed") {
          throw new Error("The requested experiment is not completed.");
        }
        if (isMounted) setResult(experiment);
      } catch (err) {
        console.error("Failed to load experiment result:", err);
        if (isMounted) {
          setError("We couldn\u2019t load your experiment result. Please try again.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    void loadExperiment();

    return () => {
      isMounted = false;
    };
  }, [experimentId]);

  if (loading) {
    return <div className="result-page-wrap"><p>Loading your experiment result...</p></div>;
  }

  if (error || !result) {
    return <div className="result-page-wrap"><p>{error ?? "We couldn\u2019t find your experiment result."}</p></div>;
  }

  const experiment = result;
  const currentEnergy = experiment.energyAfter;
  const baselineEnergy = experiment.baselineEnergy;
  const difference = currentEnergy !== undefined && baselineEnergy !== undefined
    ? currentEnergy - baselineEnergy
    : undefined;
  const completedAt = result.completedAt
    ? new Date(result.completedAt).toLocaleString()
    : "Not recorded";

  async function handleSavePattern() {
    const supportedCategories = ["sleep", "meals", "movement"] as const;
    const categoryCandidate = experiment.category ?? experiment.type;
    const category = supportedCategories.find(
      (supportedCategory) => supportedCategory === categoryCandidate,
    ) ?? "meals";
    const energyDetail = currentEnergy !== undefined && baselineEnergy !== undefined
      ? `Recorded energy was ${currentEnergy.toFixed(1)} / 10 after the experiment and ${baselineEnergy.toFixed(1)} / 10 in the recent-history baseline.`
      : "This completed experiment adds one observation to your personal history.";

    try {
      setIsSavingPattern(true);
      setSaveError(null);
      await createPatternFromApi({
        title: `${experiment.title} observation`,
        description: `An observation from the completed "${experiment.title}" experiment. ${energyDetail}`,
        category,
        observationCount: 1,
        supportingDetail: experiment.reflection?.trim() || `Completed ${completedAt}.`,
      });
      router.push("/patterns");
    } catch (err) {
      console.error("Failed to save pattern:", err);
      setSaveError("We couldn\u2019t save this observation. Please try again.");
    } finally {
      setIsSavingPattern(false);
    }
  }

  return (
    <div className="result-page-wrap">
      <header className="result-page-heading">
        <p className="section-eyebrow">A MOMENT TO REFLECT</p>
        <h1>Your experiment result</h1>
        <p>{result.title}</p>
      </header>

      <section className="result-comparison-card" aria-labelledby="result-comparison-heading">
        <span className="card-kicker">YOUR RECENT HISTORY</span>
        <h2 id="result-comparison-heading">A new observation for your pattern.</h2>
        <div className="result-metrics">
          <div className="result-metric"><span>TODAY</span><strong>{currentEnergy !== undefined ? currentEnergy.toFixed(1) : "—"} <small>/ 10</small></strong></div>
          <span className="result-divider" aria-hidden="true">vs.</span>
          <div className="result-metric"><span>COMPARABLE DAYS</span><strong>{baselineEnergy !== undefined ? baselineEnergy.toFixed(1) : "—"} <small>/ 10</small></strong></div>
          <div className="result-difference"><span>DIFFERENCE</span><strong>{difference !== undefined ? `${difference > 0 ? "+" : ""}${difference.toFixed(1)}` : "—"}</strong></div>
        </div>
        <p className="result-comparison-copy">Your check-in was {result.selfReportedEnergy !== undefined ? result.selfReportedEnergy.toFixed(1) : "—"} / 10. This compares your recorded energy after the experiment with your recent-history baseline.</p>
        <p className="result-comparison-copy">Completed {completedAt}.</p>
        <p className="result-caution">This is one observation, not proof that the experiment caused the difference.</p>
      </section>

      {result.reflection?.trim() && (
        <section className="result-reflection-card" aria-labelledby="reflection-heading">
          <p className="section-eyebrow">YOUR REFLECTION</p>
          <h2 id="reflection-heading">You noticed:</h2>
          <blockquote>{result.reflection}</blockquote>
        </section>
      )}

      <section className="result-learning-card" aria-labelledby="learned-heading">
        <span className="philosophy-mark" aria-hidden="true">✳</span>
        <div><p className="section-eyebrow">ONE STEP IN A LONGER STORY</p><h2 id="learned-heading">What VIBE learned</h2><p>Today&apos;s observation adds another data point to your personal history.</p><p>Over time, repeated observations can help reveal whether this pattern shows up consistently for you.</p></div>
      </section>

      <div className="result-actions">
        {saveError && <p className="meal-validation" role="alert">{saveError}</p>}
        <button className="button button-dark" type="button" onClick={handleSavePattern} disabled={isSavingPattern}>{isSavingPattern ? "Saving pattern..." : <>Save this pattern <span aria-hidden="true">→</span></>}</button>
        <Link className="result-back-link" href="/dashboard">Back to today</Link>
      </div>
    </div>
  );
}
