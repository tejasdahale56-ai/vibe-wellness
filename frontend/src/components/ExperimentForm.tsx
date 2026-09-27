"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { completeExperiment } from "@/data/demoData";
import type { Experiment } from "@/types";

type ExperimentFormProps = { experiment: Experiment };

export default function ExperimentForm({ experiment }: ExperimentFormProps) {
  const router = useRouter();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const energy = Number(formData.get("energy")) || 7;
    const reflection = String(formData.get("reflection") ?? "");

    completeExperiment(energy, reflection);
    router.push("/result");
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
                <input type="radio" name="energy" value={value} defaultChecked={value === 7} />
                <span>{value}</span>
              </label>
            ))}
          </div>
          <div className="energy-scale-hints" aria-hidden="true"><span>Lower</span><span>Higher</span></div>
        </fieldset>

        <div className="form-field experiment-reflection-field">
          <label className="form-label" htmlFor="experiment-reflection">Anything else you noticed? <span>(optional)</span></label>
          <textarea className="meal-textarea" id="experiment-reflection" name="reflection" placeholder="e.g. I felt more focused..." rows={3} />
        </div>

        <button className="button button-dark complete-experiment-button" type="submit">Complete experiment <span aria-hidden="true">→</span></button>
      </form>
    </div>
  );
}
