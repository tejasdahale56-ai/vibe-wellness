"use client";

import { useSyncExternalStore } from "react";
import MealCard from "@/components/MealCard";
import { getTodayMeal, subscribeToTodayMeal } from "@/data/demoData";

export default function TodayMeal() {
  const meal = useSyncExternalStore(subscribeToTodayMeal, getTodayMeal, getTodayMeal);
  return <MealCard meal={meal} />;
}
