"use client";

import type { Pattern } from "@/types";
import { Moon, Utensils, Zap, Circle } from "lucide-react";

type PatternCardProps = { pattern: Pattern };

function CategoryIcon({ category }: { category: string }) {
  switch (category) {
    case "sleep": return <Moon size={18} />;
    case "meals": return <Utensils size={18} />;
    case "movement": return <Zap size={18} />;
    default: return <Circle size={18} />;
  }
}

function getCategoryColor(category: string) {
  switch (category) {
    case "sleep": return "#87967e";
    case "meals": return "#b99c7d";
    case "movement": return "#829a77";
    default: return "var(--color-accent)";
  }
}

export default function PatternCard({ pattern }: PatternCardProps) {
  const categoryColor = getCategoryColor(pattern.category);

  return (
    <article className="content-card pattern-card" data-category={pattern.category}>
      <div className="content-card-heading">
        <span className="pattern-symbol" aria-hidden="true" style={{ 
          display: "flex", alignItems: "center", justifyContent: "center", 
          width: "28px", height: "28px", borderRadius: "50%", 
          background: `${categoryColor}20`, color: categoryColor 
        }}>
          <CategoryIcon category={pattern.category} />
        </span>
        <span className="pattern-category-label">{pattern.category}</span>
      </div>
      <h2>{pattern.title}</h2>
      <p>{pattern.description}</p>
      <small className="card-supporting-text">{pattern.supportingDetail}</small>
    </article>
  );
}