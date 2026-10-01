"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createMealFromApi } from "@/lib/api";
import MealCard from "@/components/MealCard";
import type { Meal } from "@/types";

type Portion = NonNullable<Meal["portionSize"]>;
const portions: { label: string; value: Portion }[] = [
  { label: "Small", value: "small" },
  { label: "Medium", value: "medium" },
  { label: "Large", value: "large" },
];

export default function MealLogForm() {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [portion, setPortion] = useState<Portion>("medium");
  const [showValidation, setShowValidation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdMeal, setCreatedMeal] = useState<Meal | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("description") ?? "").trim();
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
      description: `${portion[0].toUpperCase()}${portion.slice(1)} portion`,
      loggedAt: loggedAt.toISOString(),
      timeLabel: loggedAt.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }),
      tags: [],
      portionSize: portion,
    };

    try {
      setIsSubmitting(true);
      setError(null);
      const created = await createMealFromApi(meal);
      setCreatedMeal(created);
      setDescription("");
    } catch (err) {
      console.error("Failed to create meal:", err);
      if (err instanceof Error && err.message.includes("(422)")) {
        setShowValidation(true);
        setError("Tell us what you ate first.");
      } else {
        setError("We couldn\u2019t save your meal. Please try again.");
      }
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
            <label className={`portion-option${portion === option.value ? " is-selected" : ""}`} key={option.value}>
              <input
                type="radio"
                name="portion"
                value={option.value}
                checked={portion === option.value}
                onChange={() => setPortion(option.value)}
                disabled={isSubmitting}
              />
              <span>{option.label}</span>
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

      {createdMeal && (
        <section aria-live="polite">
          <p className="section-eyebrow">DETECTED FROM YOUR MEAL</p>
          <MealCard meal={createdMeal} />
          <button className="button button-outline save-meal-button" type="button" onClick={() => router.push("/dashboard")}>
            Back to today
          </button>
        </section>
      )}
    </form>
  );
}
