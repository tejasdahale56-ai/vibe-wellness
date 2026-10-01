"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import {
  createBiometricFromApi,
  getPrimaryGoalFromApi,
  savePrimaryGoalToApi,
  type PrimaryGoalType,
} from "@/lib/api";

const goalOptions: Array<{ label: string; value: PrimaryGoalType }> = [
  { label: "Improve energy", value: "energy" },
  { label: "Improve sleep", value: "sleep" },
  { label: "Improve recovery", value: "recovery" },
  { label: "Increase movement", value: "movement" },
  { label: "Improve meal consistency", value: "meals" },
  { label: "Improve focus", value: "focus" },
  { label: "Custom", value: "custom" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [goalType, setGoalType] = useState<PrimaryGoalType | "">("");
  const [customGoal, setCustomGoal] = useState("");
  const [goalLoading, setGoalLoading] = useState(true);

  useEffect(() => {
    async function loadPrimaryGoal() {
      try {
        const goal = await getPrimaryGoalFromApi();
        if (goal) {
          setGoalType(goal.goalType);
          setCustomGoal(goal.customText ?? "");
        }
      } catch (err) {
        console.error("Failed to load primary goal:", err);
        setError("We couldn’t load your wellness goal. Please try again.");
      } finally {
        setGoalLoading(false);
      }
    }

    void loadPrimaryGoal();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const recordedDate = String(formData.get("recordedDate"));

    if (!goalType) {
      setError("Choose a primary wellness goal to continue.");
      return;
    }
    if (goalType === "custom" && !customGoal.trim()) {
      setError("Describe your custom wellness goal to continue.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const selectedGoal = goalOptions.find(
        (option) => option.value === goalType,
      );
      await savePrimaryGoalToApi({
        goalType,
        displayLabel: selectedGoal?.label ?? "Custom",
        customText: goalType === "custom" ? customGoal.trim() : undefined,
      });
      await createBiometricFromApi({
        recordedAt: new Date(`${recordedDate}T12:00:00`).toISOString(),
        sleepMinutes: Number(formData.get("sleepMinutes")),
        steps: Number(formData.get("steps")),
        restingHeartRateBpm: Number(formData.get("restingHeartRateBpm")),
        hrvMilliseconds: Number(formData.get("hrvMilliseconds")),
        energyScore: Number(formData.get("energyScore")),
        activeMinutes: Number(formData.get("activeMinutes")),
      });
      router.push("/dashboard");
    } catch (err) {
      console.error("Failed to save onboarding check-in:", err);
      setError("We couldn’t save your check-in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="page-shell meal-logger-page">
      <Navbar variant="product" />
      <div className="meal-logger-wrap">
        <header className="meal-page-heading">
          <span className="eyebrow"><span className="eyebrow-dot" /> A FIRST CHECK-IN</span>
          <h1>Start with today</h1>
          <p>Share a few wellness signals to give your personal dashboard a starting point.</p>
        </header>

        <form className="meal-log-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label className="form-label" htmlFor="primary-goal">
              Your primary wellness goal
            </label>
            <select
              className="meal-time-input"
              id="primary-goal"
              value={goalType}
              onChange={(event) => {
                setGoalType(event.target.value as PrimaryGoalType);
                setError(null);
              }}
              required
              disabled={isSubmitting || goalLoading}
            >
              <option value="">
                {goalLoading ? "Loading your goal..." : "Choose a goal"}
              </option>
              {goalOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          {goalType === "custom" && (
            <div className="form-field">
              <label className="form-label" htmlFor="custom-goal">
                What would you like to focus on?
              </label>
              <input
                className="meal-time-input"
                id="custom-goal"
                value={customGoal}
                onChange={(event) => {
                  setCustomGoal(event.target.value);
                  setError(null);
                }}
                required
                disabled={isSubmitting || goalLoading}
              />
            </div>
          )}
          <div className="form-field">
            <label className="form-label" htmlFor="recorded-date">Date</label>
            <input className="meal-time-input" id="recorded-date" name="recordedDate" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required disabled={isSubmitting} />
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="sleep-minutes">Sleep (minutes)</label>
            <input className="meal-time-input" id="sleep-minutes" name="sleepMinutes" type="number" min="0" step="1" placeholder="e.g. 450" required disabled={isSubmitting} />
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="steps">Steps</label>
            <input className="meal-time-input" id="steps" name="steps" type="number" min="0" step="1" placeholder="e.g. 6200" required disabled={isSubmitting} />
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="resting-heart-rate">Resting heart rate (bpm)</label>
            <input className="meal-time-input" id="resting-heart-rate" name="restingHeartRateBpm" type="number" min="1" step="1" placeholder="e.g. 68" required disabled={isSubmitting} />
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="hrv">HRV (milliseconds)</label>
            <input className="meal-time-input" id="hrv" name="hrvMilliseconds" type="number" min="0" step="1" placeholder="e.g. 32" required disabled={isSubmitting} />
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="energy">Energy (0–10)</label>
            <input className="meal-time-input" id="energy" name="energyScore" type="number" min="0" max="10" step="0.1" placeholder="e.g. 6.5" required disabled={isSubmitting} />
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="active-minutes">Active minutes</label>
            <input className="meal-time-input" id="active-minutes" name="activeMinutes" type="number" min="0" step="1" placeholder="e.g. 30" required disabled={isSubmitting} />
          </div>

          {error && <p className="meal-validation" role="alert">{error}</p>}
          <button className="button button-dark save-meal-button" type="submit" disabled={isSubmitting || goalLoading}>
            {isSubmitting ? "Saving your check-in..." : <>Continue to your dashboard <span aria-hidden="true">→</span></>}
          </button>
        </form>
        <p className="meal-page-note">Your check-in is saved to your personal wellness history.</p>
      </div>
    </main>
  );
}
