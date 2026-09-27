import type { Meal } from "@/types";

type MealCardProps = { meal: Meal };

export default function MealCard({ meal }: MealCardProps) {
  return (
    <article className="content-card meal-card">
      <div className="content-card-heading"><span className="card-kicker">{meal.mealType ?? "Your meal"}</span><time dateTime={meal.loggedAt}>{meal.timeLabel}</time></div>
      <h2>{meal.name}</h2><p>{meal.description}</p>
      {meal.tags.length > 0 && <div className="tag-list">{meal.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div>}
    </article>
  );
}
