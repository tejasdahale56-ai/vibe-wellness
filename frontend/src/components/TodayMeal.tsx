"use client";

import { useEffect, useState } from "react";
import MealCard from "@/components/MealCard";
import { getMealsFromApi } from "@/lib/api";
import type { Meal } from "@/types";

export default function TodayMeal() {
  const [meal, setMeal] = useState<Meal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadMeal() {
      try {
        const meals = await getMealsFromApi();
        if (isMounted) setMeal(meals[0] ?? null);
      } catch (err) {
        console.error("Failed to load meals:", err);
        if (isMounted) setError(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    void loadMeal();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return <article className="content-card meal-card"><p>Loading your latest meal...</p></article>;
  }

  if (error) {
    return <article className="content-card meal-card"><p>We couldn\u2019t load your latest meal.</p></article>;
  }

  if (!meal) {
    return <article className="content-card meal-card"><p>No meals logged yet.</p></article>;
  }

  return <MealCard meal={meal} />;
}
