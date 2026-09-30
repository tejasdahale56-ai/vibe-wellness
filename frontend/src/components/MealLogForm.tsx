"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createMealFromApi } from "@/lib/api";
import type { Meal } from "@/types";

type Portion = "Small" | "Medium" | "Large";
const portions: Portion[] = ["Small", "Medium", "Large"];

export default function MealLogForm() {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [portion, setPortion] = useState<Portion>("Medium");
  const [showValidation, setShowValidation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("description") ?? "").trim();
    const selectedPortion = String(formData.get("portion") ?? "Medium") as Portion;
    const selectedTime = String(formData.get("time") ?? "13:15");

    if (!name) {
      setShowValidation(true);
      return;
    }

    const [hours, minutes] = selectedTime.split(":").map(Number);
    const loggedAt = new Date();
    loggedAt.setHours(hours, minutes, 0, 0);

    const meal: Omit<Meal, "id"> = {
      name,
      description: `${selectedPortion} portion`,
      loggedAt: loggedAt.toISOString(),
      timeLabel: loggedAt.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }),
      tags: [],
    };

    try {
      setIsSubmitting(true);
      setError(null);
      await createMealFromApi(meal);
      router.push("/dashboard");
    } catch (err) {
      console.error("Failed to create meal:", err);
      setError("We couldn\u2019t save your meal. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="meal-log-form" onSubmit={handleSubmit} noValidate>
      <div className="form-field">
        <label className="form-label" htmlFor="meal-description">What did you eat?</label>
        <textarea
          autoComplete="off"
          className="meal-textarea"
          id="meal-description"
          name="description"
          placeholder="e.g. Chicken biryani, dal and rice, sandwich..."
          value={description}
          onChange={(event) => {
            setDescription(event.target.value);
            if (event.target.value.trim()) setShowValidation(false);
            if (error) setError(null);
          }}
          disabled={isSubmitting}
          aria-required="true"
          aria-invalid={showValidation}
          aria-describedby={showValidation ? "meal-validation" : undefined}
          rows={4}
        />
        {showValidation && <p className="meal-validation" id="meal-validation" role="status" aria-live="polite">Tell us what you ate first.</p>}
      </div>

      <fieldset className="form-field portion-field">
        <legend className="form-label">How much?</legend>
        <div className="portion-options">
          {portions.map((option) => (
            <label className={`portion-option${portion === option ? " is-selected" : ""}`} key={option}>
              <input
                type="radio"
                name="portion"
                value={option}
                checked={portion === option}
                onChange={() => setPortion(option)}
                disabled={isSubmitting}
              />
              <span>{option}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="form-field time-field">
        <label className="form-label" htmlFor="meal-time">When did you eat?</label>
        <input className="meal-time-input" id="meal-time" name="time" type="time" defaultValue="13:15" disabled={isSubmitting} />
      </div>

      {error && <p className="meal-validation" role="alert">{error}</p>}
      <button className="button button-dark save-meal-button" type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving meal..." : <>Save meal <span aria-hidden="true">→</span></>}</button>
    </form>
  );
}
