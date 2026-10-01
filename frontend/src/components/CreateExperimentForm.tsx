"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, X } from "lucide-react";

import { createExperimentFromApi } from "@/lib/api";
import type { Experiment } from "@/types";

type CreateExperimentFormProps = {
  onClose: () => void;
  onCreated: (experiment: Experiment) => void;
};

const durations = [1, 3, 5, 7, 14, 21, 30];

export default function CreateExperimentForm({ onClose, onCreated }: CreateExperimentFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    why: "",
    context: "",
    durationDays: 1,
  });
  const [errors, setErrors] = useState<Partial<typeof formData>>({});

  function validateForm() {
    const nextErrors: Partial<typeof formData> = {};
    if (!formData.title.trim()) nextErrors.title = "Title is required";
    if (!formData.description.trim()) nextErrors.description = "Description is required";
    if (!formData.why.trim()) nextErrors.why = "Why is required";
    if (!formData.context.trim()) nextErrors.context = "Context is required";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const experiment = await createExperimentFromApi({
        ...formData,
        progressPercent: 0,
        status: "planned",
        statusLabel: "Planned",
      });
      onCreated(experiment);
      onClose();
      router.push(`/experiment?experiment_id=${encodeURIComponent(experiment.id)}`);
    } catch (error) {
      console.error("Failed to create experiment:", error);
      setErrors((current) => ({ ...current, title: "We couldn’t create this experiment. Please try again." }));
    } finally {
      setIsLoading(false);
    }
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    if (errors[name as keyof typeof errors]) {
      setErrors((current) => ({ ...current, [name]: undefined }));
    }
  }

  return (
    <div className="create-experiment-modal" role="presentation" onMouseDown={onClose}>
      <section className="create-experiment-dialog" role="dialog" aria-modal="true" aria-labelledby="create-experiment-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="create-experiment-header">
          <div><p className="section-eyebrow">A SMALL CURIOSITY</p><h2 id="create-experiment-title">Create an experiment</h2></div>
          <button className="dialog-close" type="button" onClick={onClose} aria-label="Close create experiment form"><X size={18} /></button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit} noValidate>
          <div className="form-field">
            <label className="form-label" htmlFor="modal-experiment-title">Experiment title</label>
            <input className="form-input" id="modal-experiment-title" type="text" name="title" value={formData.title} onChange={handleChange} placeholder="e.g., Morning hydration routine" aria-invalid={!!errors.title} />
            {errors.title && <p className="meal-validation" role="alert">{errors.title}</p>}
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="modal-experiment-description">What will you do?</label>
            <textarea className="meal-textarea" id="modal-experiment-description" name="description" value={formData.description} onChange={handleChange} placeholder="e.g., Drink water within 30 minutes of waking up" rows={3} aria-invalid={!!errors.description} />
            {errors.description && <p className="meal-validation" role="alert">{errors.description}</p>}
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="modal-experiment-why">Why this experiment?</label>
            <textarea className="meal-textarea" id="modal-experiment-why" name="why" value={formData.why} onChange={handleChange} placeholder="What pattern or curiosity led to this?" rows={3} aria-invalid={!!errors.why} />
            {errors.why && <p className="meal-validation" role="alert">{errors.why}</p>}
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="modal-experiment-context">Context</label>
            <textarea className="meal-textarea" id="modal-experiment-context" name="context" value={formData.context} onChange={handleChange} placeholder="Any relevant context?" rows={2} aria-invalid={!!errors.context} />
            {errors.context && <p className="meal-validation" role="alert">{errors.context}</p>}
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="modal-experiment-duration">Duration</label>
            <select className="form-input" id="modal-experiment-duration" name="durationDays" value={formData.durationDays} onChange={handleChange}>
              {durations.map((days) => <option key={days} value={days}>{days} {days === 1 ? "day" : "days"}</option>)}
            </select>
          </div>
          <div className="modal-form-actions">
            <button className="button button-outline" type="button" onClick={onClose} disabled={isLoading}>Cancel</button>
            <button className="button button-dark" type="submit" disabled={isLoading}>{isLoading ? <Loader2 size={16} className="animate-spin" /> : <>Create experiment <Plus size={16} /></>}</button>
          </div>
        </form>
      </section>
    </div>
  );
}
