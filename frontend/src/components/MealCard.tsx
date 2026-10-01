"use client";

import type { Meal } from "@/types";
import { Utensils, Sun, Moon, Coffee, Clock } from "lucide-react";

type MealCardProps = { meal: Meal };

function MealTypeIcon({ mealType, style }: { mealType?: string; style?: React.CSSProperties }) {
  const Icon = mealType === "Breakfast" ? Sun : mealType === "Lunch" ? Utensils : mealType === "Dinner" ? Moon : mealType === "Snack" ? Coffee : Utensils;
  return <Icon size={14} style={style} />;
}

export default function MealCard({ meal }: MealCardProps) {
  const hasNutritionEstimate = [
    meal.estimatedCalories,
    meal.estimatedProteinG,
    meal.estimatedCarbsG,
    meal.estimatedFatG,
    meal.estimatedFiberG,
  ].some((value) => value !== undefined);
  const macroValues = [
    meal.estimatedProteinG !== undefined && `${meal.estimatedProteinG}g protein`,
    meal.estimatedCarbsG !== undefined && `${meal.estimatedCarbsG}g carbs`,
    meal.estimatedFatG !== undefined && `${meal.estimatedFatG}g fat`,
    meal.estimatedFiberG !== undefined && `${meal.estimatedFiberG}g fiber`,
  ].filter(Boolean);

  return (
    <article className="content-card meal-card">
      <div className="content-card-heading" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span className="card-kicker" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <MealTypeIcon mealType={meal.mealType} style={{ color: "var(--color-accent)" }} />
          {meal.mealType ?? "Your meal"}
        </span>
        <time dateTime={meal.loggedAt} style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--color-subtle)", fontSize: "11px" }}>
          <Clock size={12} />
          {meal.timeLabel}
        </time>
      </div>
      <h2>{meal.name}</h2>
      <p>{meal.description}</p>
      {(meal.portionSize || meal.mealType) && (
        <p className="meal-context">
          {meal.portionSize && <span className="meal-portion">{meal.portionSize} portion</span>}
          {meal.portionSize && meal.mealType && " · "}
          {meal.mealType}
        </p>
      )}
      {meal.tags.length > 0 && <div className="tag-list">{meal.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div>}
      {hasNutritionEstimate && (
        <section className="meal-nutrition" aria-label="Estimated nutrition">
          <div className="meal-nutrition-heading">
            <h3>Estimated nutrition</h3>
            {meal.nutritionConfidence && (
              <span className="nutrition-confidence">{meal.nutritionConfidence} confidence</span>
            )}
          </div>
          {meal.estimatedCalories !== undefined && (
            <strong className="meal-nutrition-calories">~{meal.estimatedCalories} kcal</strong>
          )}
          {macroValues.length > 0 && <p className="meal-nutrition-macros">{macroValues.join(" · ")}</p>}
          <p className="meal-nutrition-note">Estimated from the meal description and portion size.</p>
        </section>
      )}
    </article>
  );
}
