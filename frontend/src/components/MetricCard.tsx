"use client";

import type { WellnessMetric } from "@/types";
import { Moon, Heart, Footprints, Activity, Sparkles, Clock } from "lucide-react";

type MetricCardProps = { metric: WellnessMetric };

function MetricIcon({ id, label, tone }: { id: string; label: string; tone: string }) {
  const iconColor = tone === "green" ? "var(--color-accent)" : tone === "amber" ? "var(--color-attention)" : "var(--color-subtle)";
  if (label.toLowerCase().includes("active")) return <Clock size={18} style={{ color: iconColor }} />;
  
  switch (id) {
    case "sleep":
      return <Moon size={18} style={{ color: iconColor }} />;
    case "resting-heart-rate":
      return <Heart size={18} style={{ color: iconColor }} />;
    case "steps":
      return <Footprints size={18} style={{ color: iconColor }} />;
    case "hrv":
      return <Activity size={18} style={{ color: iconColor }} />;
    case "energy":
      return <Sparkles size={18} style={{ color: iconColor }} />;
    case "active-minutes":
      return <Clock size={18} style={{ color: iconColor }} />;
    default:
      return <span className={`signal-icon ${tone}`} aria-hidden="true" />;
  }
}

export default function MetricCard({ metric }: MetricCardProps) {
  return (
    <div className="metric-card">
      <span aria-hidden="true"><MetricIcon id={metric.id} label={metric.label} tone={metric.tone} /></span>
      <span className="signal-info"><strong>{metric.label}</strong><small>{metric.description}</small></span>
      <span className="signal-value">{metric.value}</span>
    </div>
  );
}
