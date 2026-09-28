"use client";

import type { Meal } from "@/types";
import { Utensils, Sun, Moon, Coffee, Clock } from "lucide-react";

type MealCardProps = { meal: Meal };

function MealTypeIcon({ mealType, style }: { mealType?: string; style?: React.CSSProperties }) {
  const Icon = mealType === "Breakfast" ? Sun : mealType === "Lunch" ? Utensils : mealType === "Dinner" ? Moon : mealType === "Snack" ? Coffee : Utensils;
  return <Icon size={14} style={style} />;
}

export default function MealCard({ meal }: MealCardProps) {
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
      {meal.tags.length > 0 && <div className="tag-list">{meal.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div>}
    </article>
  );
}