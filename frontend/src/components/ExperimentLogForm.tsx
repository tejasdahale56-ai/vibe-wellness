"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createExperimentFromApi } from "@/lib/api";

const durations = [1, 3, 5, 7, 14, 21, 30];

export default function ExperimentLogForm() {
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

  const validateForm = () => {
    const newErrors: Partial<typeof formData> = {};
    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.description.trim()) newErrors.description = "Description is required";
    if (!formData.why.trim()) newErrors.why = "Why is required";
    if (!formData.context.trim()) newErrors.context = "Context is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
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
      router.push(`/experiment?experiment_id=${encodeURIComponent(experiment.id)}`);
    } catch (err) {
      console.error("Failed to create experiment:", err);
      alert("Failed to create experiment. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  return (
    <form className="meal-log-form" onSubmit={handleSubmit} noValidate>
      <div className="form-field">
        <label className="form-label" htmlFor="experiment-title">Experiment title</label>
        <input
          type="text"
          name="title"
          id="experiment-title"
          value={formData.title}
          onChange={handleChange}
          placeholder="e.g., Morning hydration routine"
          className="meal-textarea"
          style={{ minHeight: "48px", padding: "12px 15px", fontSize: "13px" }}
          aria-required="true"
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? "experiment-title-validation" : undefined}
        />
        {errors.title && <p className="meal-validation" id="experiment-title-validation" role="status" aria-live="polite">{errors.title}</p>}
      </div>

      <div className="form-field">
        <label className="form-label" htmlFor="experiment-description">What will you do?</label>
        <textarea
          name="description"
          id="experiment-description"
          value={formData.description}
          onChange={handleChange}
          placeholder="e.g., Drink a glass of water within 30 minutes of waking up"
          className="meal-textarea"
          rows={3}
          aria-required="true"
          aria-invalid={!!errors.description}
          aria-describedby={errors.description ? "experiment-description-validation" : undefined}
        />
        {errors.description && <p className="meal-validation" id="experiment-description-validation" role="status" aria-live="polite">{errors.description}</p>}
      </div>

      <div className="form-field">
        <label className="form-label" htmlFor="experiment-why">Why this experiment?</label>
        <textarea
          name="why"
          id="experiment-why"
          value={formData.why}
          onChange={handleChange}
          placeholder="What pattern or curiosity led to this? e.g., I notice I feel more energized on days I hydrate early"
          className="meal-textarea"
          rows={3}
          aria-required="true"
          aria-invalid={!!errors.why}
          aria-describedby={errors.why ? "experiment-why-validation" : undefined}
        />
        {errors.why && <p className="meal-validation" id="experiment-why-validation" role="status" aria-live="polite">{errors.why}</p>}
      </div>

      <div className="form-field">
        <label className="form-label" htmlFor="experiment-context">Context</label>
        <textarea
          name="context"
          id="experiment-context"
          value={formData.context}
          onChange={handleChange}
          placeholder="Any relevant context? e.g., My current morning routine is coffee first, water later"
          className="meal-textarea"
          rows={2}
          aria-required="true"
          aria-invalid={!!errors.context}
          aria-describedby={errors.context ? "experiment-context-validation" : undefined}
        />
        {errors.context && <p className="meal-validation" id="experiment-context-validation" role="status" aria-live="polite">{errors.context}</p>}
      </div>

      <div className="form-field">
        <label className="form-label" htmlFor="experiment-duration">Duration</label>
        <select
          name="durationDays"
          id="experiment-duration"
          value={formData.durationDays}
          onChange={handleChange}
          className="meal-time-input"
          style={{ minHeight: "48px", padding: "0 13px", fontSize: "13px" }}
        >
          {durations.map((days) => (
            <option key={days} value={days}>{days} {days === 1 ? "day" : "days"}</option>
          ))}
        </select>
      </div>

      <button className="button button-dark save-meal-button" type="submit" disabled={isLoading}>
        {isLoading ? "Creating..." : "Create experiment <span aria-hidden=\"true\">→</span>"}
      </button>
    </form>
  );
}
