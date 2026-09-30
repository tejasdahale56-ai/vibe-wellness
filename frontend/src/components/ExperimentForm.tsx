"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { completeExperimentFromApi } from "@/lib/api";
import type { Experiment } from "@/types";

type ExperimentFormProps = { experiment: Experiment };

export default function ExperimentForm({ experiment }: ExperimentFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const energyValue = formData.get("energy");
    if (typeof energyValue !== "string" || energyValue.length === 0) {
      setError("Choose an energy rating to complete your experiment.");
      return;
    }
    const energy = Number(energyValue);
    const reflection = String(formData.get("reflection") ?? "");

    try {
      setIsSubmitting(true);
      setError(null);
      const completedExperiment = await completeExperimentFromApi(experiment.id, energy, reflection);
      router.push(`/result?experiment_id=${encodeURIComponent(completedExperiment.id)}`);
    } catch (err) {
      console.error("Failed to complete experiment:", err);
      setError("We couldn\u2019t complete your experiment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="experiment-detail-card">
      <div className="experiment-detail-intro">
        <span className="card-kicker">A SMALL PERSONAL OBSERVATION</span>
        <h2>{experiment.title}</h2>
        <p>{experiment.context}</p>
        <p className="experiment-try-note">Try this once and see what you notice afterward.</p>
      </div>

      <div className="experiment-rationale">
        <span className="card-kicker">WHY THIS EXPERIMENT?</span>
        <p>{experiment.why}</p>
      </div>

      <form className="experiment-reflection-form" onSubmit={handleSubmit}>
        <fieldset className="energy-fieldset">
          <legend>WHAT TO NOTICE <span>How is your energy right now?</span></legend>
          <div className="energy-scale" role="radiogroup" aria-label="Energy from 1 to 10">
            {Array.from({ length: 10 }, (_, index) => index + 1).map((value) => (
              <label className="energy-option" key={value}>
                <input type="radio" name="energy" value={value} required={value === 1} disabled={isSubmitting} />
                <span>{value}</span>
              </label>
            ))}
          </div>
          <div className="energy-scale-hints" aria-hidden="true"><span>Lower</span><span>Higher</span></div>
        </fieldset>

        <div className="form-field experiment-reflection-field">
          <label className="form-label" htmlFor="experiment-reflection">Anything else you noticed? <span>(optional)</span></label>
          <textarea className="meal-textarea" id="experiment-reflection" name="reflection" placeholder="e.g. I felt more focused..." rows={3} disabled={isSubmitting} />
        </div>

        {error && <p className="meal-validation" role="alert">{error}</p>}
        <button className="button button-dark complete-experiment-button" type="submit" disabled={isSubmitting}>{isSubmitting ? "Completing experiment..." : <>Complete experiment <span aria-hidden="true">→</span></>}</button>
      </form>
    </div>
  );
}
