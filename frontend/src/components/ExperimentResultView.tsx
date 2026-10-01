"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  createPatternFromApi,
  getExperimentResultFromApi,
  type ExperimentMeasurement,
} from "@/lib/api";

type ExperimentResultViewProps = {
  experimentId?: string;
};

const measurementLabels: Record<string, string> = {
  sleep_minutes: "Sleep",
  steps: "Steps",
  resting_heart_rate_bpm: "Resting heart rate",
  hrv_milliseconds: "HRV",
  active_minutes: "Active minutes",
};

function formatMeasurementValue(key: string, value: number) {
  if (key === "resting_heart_rate_bpm") return `${value.toFixed(0)} bpm`;
  if (key === "hrv_milliseconds") return `${value.toFixed(0)} ms`;
  if (key === "sleep_minutes" || key === "active_minutes") {
    return `${value.toFixed(0)} min`;
  }
  return value.toFixed(0);
}

export default function ExperimentResultView({
  experimentId,
}: ExperimentResultViewProps) {
  const router = useRouter();
  const [result, setResult] = useState<ExperimentMeasurement | null>(null);
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
        const measurement = await getExperimentResultFromApi(id);
        if (measurement.id !== id) {
          throw new Error("The requested experiment result did not match.");
        }
        if (isMounted) setResult(measurement);
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
  const currentEnergy = experiment.experimentPeriodEnergy;
  const baselineEnergy = experiment.baselineEnergy;
  const difference = experiment.observedEnergyDifference;
  const completedAt = new Date(result.completedAt).toLocaleString();
  const additionalMeasurements = Object.entries(
    experiment.additionalMeasurements,
  );

  async function handleSavePattern() {
    const energyDetail = currentEnergy !== null && baselineEnergy !== null
      ? `Recorded energy was ${currentEnergy.toFixed(1)} / 10 during the experiment and ${baselineEnergy.toFixed(1)} / 10 in the baseline period.`
      : "This completed experiment adds one observation to your personal history.";

    try {
      setIsSavingPattern(true);
      setSaveError(null);
      await createPatternFromApi({
        title: `${experiment.title} observation`,
        description: `An observation from the completed "${experiment.title}" experiment. ${energyDetail}`,
        category: "meals",
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
        <p>{result.description}</p>
      </header>

      <section className="result-comparison-card" aria-labelledby="result-comparison-heading">
        <span className="card-kicker">{result.sufficientData ? "YOUR RECORDED COMPARISON" : "MORE DATA NEEDED"}</span>
        <h2 id="result-comparison-heading">{result.title}</h2>
        {result.hypothesis && <p className="result-comparison-copy">Hypothesis: {result.hypothesis}</p>}
        {result.context && <p className="result-comparison-copy">Context: {result.context}</p>}
        <div className="result-metrics">
          <div className="result-metric"><span>DURING EXPERIMENT</span><strong>{currentEnergy !== null ? currentEnergy.toFixed(1) : "—"} <small>/ 10</small></strong></div>
          <span className="result-divider" aria-hidden="true">vs.</span>
          <div className="result-metric"><span>BASELINE</span><strong>{baselineEnergy !== null ? baselineEnergy.toFixed(1) : "—"} <small>/ 10</small></strong></div>
          <div className="result-difference"><span>OBSERVED DIFFERENCE</span><strong>{difference !== null ? `${difference > 0 ? "+" : ""}${difference.toFixed(1)}` : "—"}</strong></div>
        </div>
        <p className="result-comparison-copy">Duration: {result.durationDays} {result.durationDays === 1 ? "day" : "days"}. {result.baselineObservationCount} baseline observation{result.baselineObservationCount === 1 ? "" : "s"} and {result.experimentPeriodObservationCount} during-experiment measurement{result.experimentPeriodObservationCount === 1 ? "" : "s"} were usable.</p>
        {!result.sufficientData && <p className="result-comparison-copy">At least {result.minimumBaselineObservations} baseline observations and {result.minimumExperimentPeriodObservations} during-experiment measurement are required for a measured comparison.</p>}
        <p className="result-comparison-copy">{result.summary}</p>
        <p className="result-comparison-copy">Completed {completedAt}.</p>
      </section>

      {result.reflection?.trim() && (
        <section className="result-reflection-card" aria-labelledby="reflection-heading">
          <p className="section-eyebrow">YOUR REFLECTION</p>
          <h2 id="reflection-heading">You noticed:</h2>
          <blockquote>{result.reflection}</blockquote>
        </section>
      )}

      {additionalMeasurements.length > 0 && (
        <section className="result-learning-card" aria-labelledby="biometric-comparisons-heading">
          <span className="philosophy-mark" aria-hidden="true">✳</span>
          <div>
            <p className="section-eyebrow">SUPPORTED BIOMETRIC COMPARISONS</p>
            <h2 id="biometric-comparisons-heading">Before and during</h2>
            {additionalMeasurements.map(([key, measurement]) => (
              <p key={key}>
                {measurementLabels[key] ?? key}: {formatMeasurementValue(key, measurement.baseline)} before, {formatMeasurementValue(key, measurement.experiment_period)} during, {measurement.observed_difference > 0 ? "+" : ""}{formatMeasurementValue(key, measurement.observed_difference)} observed difference.
              </p>
            ))}
          </div>
        </section>
      )}

      <section className="result-learning-card" aria-labelledby="learned-heading">
        <span className="philosophy-mark" aria-hidden="true">✳</span>
        <div><p className="section-eyebrow">ONE STEP IN A LONGER STORY</p><h2 id="learned-heading">What VIBE learned</h2><p>{result.summary}</p><p>Over time, repeated observations can help reveal whether this pattern shows up consistently for you.</p></div>
      </section>

      <div className="result-actions">
        {saveError && <p className="meal-validation" role="alert">{saveError}</p>}
        <button className="button button-dark" type="button" onClick={handleSavePattern} disabled={isSavingPattern}>{isSavingPattern ? "Saving pattern..." : <>Save this pattern <span aria-hidden="true">→</span></>}</button>
        <Link className="result-back-link" href="/dashboard">Back to today</Link>
      </div>
    </div>
  );
}
