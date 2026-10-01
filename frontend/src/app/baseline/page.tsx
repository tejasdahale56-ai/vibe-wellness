"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import {
  getPersonalBaselineFromApi,
  getPersonalMetricBaselinesFromApi,
  savePersonalMetricBaselinesToApi,
  type PersonalMetricBaselines,
} from "@/lib/api";

const fields = [
  { key: "sleepMinutes", label: "Sleep", unit: "minutes", min: "1", max: "1440", step: "1" },
  { key: "steps", label: "Steps", unit: "steps", min: "0", max: "200000", step: "1" },
  { key: "restingHeartRateBpm", label: "Resting heart rate", unit: "bpm", min: "1", max: "250", step: "1" },
  { key: "hrvMilliseconds", label: "Heart rate variability", unit: "milliseconds", min: "0", max: "1000", step: "1" },
  { key: "energyScore", label: "Energy", unit: "out of 10", min: "0", max: "10", step: "0.1" },
  { key: "activeMinutes", label: "Active minutes", unit: "minutes", min: "0", max: "1440", step: "1" },
] as const;

type BaselineForm = Record<(typeof fields)[number]["key"], string>;

const emptyForm: BaselineForm = {
  sleepMinutes: "",
  steps: "",
  restingHeartRateBpm: "",
  hrvMilliseconds: "",
  energyScore: "",
  activeMinutes: "",
};

function formFromValues(values: Partial<Record<keyof PersonalMetricBaselines, number | null>>): BaselineForm {
  return Object.fromEntries(
    fields.map(({ key }) => {
      const value = values[key];
      return [key, value == null ? "" : String(key === "energyScore" ? value : Math.round(value))];
    }),
  ) as BaselineForm;
}

export default function BaselinePage() {
  const router = useRouter();
  const [form, setForm] = useState(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function loadValues() {
      try {
        const [saved, history] = await Promise.all([
          getPersonalMetricBaselinesFromApi(),
          getPersonalBaselineFromApi(),
        ]);
        if (!active) return;
        if (saved) {
          setForm(formFromValues(saved));
        } else {
          const metrics = history.metrics;
          const averages: Partial<Record<keyof PersonalMetricBaselines, number | null>> = {
            sleepMinutes: metrics.sleepMinutes.baseline,
            steps: metrics.steps.baseline,
            restingHeartRateBpm: metrics.restingHeartRateBpm.baseline,
            hrvMilliseconds: metrics.hrvMilliseconds.baseline,
            energyScore: metrics.energyScore.baseline,
            activeMinutes: metrics.activeMinutes.baseline,
          };
          setForm(formFromValues(averages));
        }
      } catch (loadError) {
        console.error("Failed to load baseline values:", loadError);
        if (active) setError("We couldn’t load your baseline values. Please try again.");
      } finally {
        if (active) setIsLoading(false);
      }
    }
    void loadValues();
    return () => { active = false; };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setIsSaving(true);
      setError(null);
      const values = Object.fromEntries(
        fields.map(({ key }) => [key, Number(form[key])]),
      ) as unknown as PersonalMetricBaselines;
      await savePersonalMetricBaselinesToApi(values);
      router.push("/dashboard");
    } catch (saveError) {
      console.error("Failed to save baseline values:", saveError);
      setError("We couldn’t save your personal baselines. Please check the values and try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="page-shell meal-logger-page">
      <Navbar variant="product" />
      <div className="meal-logger-wrap">
        <header className="meal-page-heading">
          <span className="eyebrow"><span className="eyebrow-dot" /> YOUR PERSONAL REFERENCE</span>
          <h1>Set your baselines</h1>
          <p>Choose the values that feel typical for you. VIBE will compare your latest signals against these numbers.</p>
        </header>

        {isLoading ? <p aria-live="polite">Loading your baseline values...</p> : (
          <form className="meal-log-form" onSubmit={handleSubmit}>
            {fields.map(({ key, label, unit, min, max, step }) => (
              <div className="form-field" key={key}>
                <label className="form-label" htmlFor={key}>{label} <span>({unit})</span></label>
                <input
                  className="meal-time-input"
                  id={key}
                  type="number"
                  min={min}
                  max={max}
                  step={step}
                  value={form[key]}
                  onChange={(event) => setForm((previous) => ({ ...previous, [key]: event.target.value }))}
                  required
                  disabled={isSaving}
                />
              </div>
            ))}
            {error && <p className="meal-validation" role="alert">{error}</p>}
            <button className="button button-dark save-meal-button" type="submit" disabled={isSaving || isLoading}>
              {isSaving ? "Saving your baselines..." : <>Save personal baselines <span aria-hidden="true">→</span></>}
            </button>
          </form>
        )}
        <p className="meal-page-note"><Link href="/dashboard">Back to your dashboard</Link></p>
      </div>
    </main>
  );
}
