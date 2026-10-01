"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import {
  getBiometricCheckinsFromApi,
  updateBiometricFromApi,
  type BiometricCheckin,
} from "@/lib/api";

const fields = [
  { key: "sleepMinutes", label: "Sleep", unit: "minutes", min: "0", max: "1440", step: "1" },
  { key: "steps", label: "Steps", unit: "steps", min: "0", max: "200000", step: "1" },
  { key: "restingHeartRateBpm", label: "Resting heart rate", unit: "bpm", min: "1", max: "250", step: "1" },
  { key: "hrvMilliseconds", label: "Heart rate variability", unit: "milliseconds", min: "0", max: "1000", step: "1" },
  { key: "energyScore", label: "Energy", unit: "out of 10", min: "0", max: "10", step: "0.1" },
  { key: "activeMinutes", label: "Active minutes", unit: "minutes", min: "0", max: "1440", step: "1" },
] as const;

type SignalForm = Record<(typeof fields)[number]["key"], string>;

const emptyForm: SignalForm = {
  sleepMinutes: "",
  steps: "",
  restingHeartRateBpm: "",
  hrvMilliseconds: "",
  energyScore: "",
  activeMinutes: "",
};

function formFromCheckin(checkin: BiometricCheckin): SignalForm {
  return Object.fromEntries(
    fields.map(({ key }) => [key, String(checkin[key] ?? "")]),
  ) as SignalForm;
}

export default function CheckInPage() {
  const router = useRouter();
  const [checkin, setCheckin] = useState<BiometricCheckin | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getBiometricCheckinsFromApi()
      .then((checkins) => {
        if (!active) return;
        const latest = checkins[0] ?? null;
        setCheckin(latest);
        if (latest) setForm(formFromCheckin(latest));
      })
      .catch((loadError) => {
        console.error("Failed to load the latest check-in:", loadError);
        if (active) setError("We couldn’t load your latest check-in. Please try again.");
      })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!checkin) return;
    if (fields.every(({ key }) => form[key].trim() === "")) {
      setError("Enter at least one measurement before saving.");
      return;
    }
    const measurement = (value: string) => value.trim() === "" ? null : Number(value);
    try {
      setIsSaving(true);
      setError(null);
      await updateBiometricFromApi(checkin.id, {
        recordedAt: checkin.recordedAt,
        sleepMinutes: measurement(form.sleepMinutes),
        steps: measurement(form.steps),
        restingHeartRateBpm: measurement(form.restingHeartRateBpm),
        hrvMilliseconds: measurement(form.hrvMilliseconds),
        energyScore: measurement(form.energyScore),
        activeMinutes: measurement(form.activeMinutes),
      });
      router.push("/dashboard");
    } catch (saveError) {
      console.error("Failed to update today's signals:", saveError);
      setError("We couldn’t update your signals. Please check the values and try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="page-shell meal-logger-page">
      <Navbar variant="product" />
      <div className="meal-logger-wrap">
        <header className="meal-page-heading">
          <span className="eyebrow"><span className="eyebrow-dot" /> LATEST CHECK-IN</span>
          <h1>Update today&apos;s signals</h1>
          <p>Edit the latest check-in used for your dashboard. Saving updates that entry in your history.</p>
        </header>

        {isLoading && <p aria-live="polite">Loading your latest check-in...</p>}
        {!isLoading && !checkin && !error && (
          <section className="content-card">
            <h2>No check-in to update yet</h2>
            <p>Add your first set of signals to start your dashboard.</p>
            <Link className="button button-dark" href="/onboarding">Add a check-in <span aria-hidden="true">→</span></Link>
          </section>
        )}
        {!isLoading && checkin && (
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
                  disabled={isSaving}
                />
              </div>
            ))}
            {error && <p className="meal-validation" role="alert">{error}</p>}
            <button className="button button-dark save-meal-button" type="submit" disabled={isSaving}>
              {isSaving ? "Updating your signals..." : <>Update signals <span aria-hidden="true">→</span></>}
            </button>
          </form>
        )}
        {error && !checkin && <p className="meal-validation" role="alert">{error}</p>}
        <p className="meal-page-note"><Link href="/dashboard">Back to your dashboard</Link></p>
      </div>
    </main>
  );
}
