import type { WellnessMetric } from "@/types";

type MetricCardProps = { metric: WellnessMetric };

export default function MetricCard({ metric }: MetricCardProps) {
  return (
    <div className="metric-card">
      <span className={`signal-icon ${metric.tone}`} aria-hidden="true">{metric.icon}</span>
      <span className="signal-info"><strong>{metric.label}</strong><small>{metric.description}</small></span>
      <span className="signal-value">{metric.value}</span>
    </div>
  );
}
