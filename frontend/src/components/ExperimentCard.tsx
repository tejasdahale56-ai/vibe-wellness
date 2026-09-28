"use client";

import type { Experiment } from "@/types";
import { FlaskConical, Clock, CheckCircle } from "lucide-react";

type ExperimentCardProps = { experiment: Experiment };

function StatusIcon({ status }: { status: string }) {
  const statusColor = status === "active" ? "var(--color-accent)" : status === "completed" ? "var(--color-accent-strong)" : "var(--color-attention)";
  const Icon = status === "active" ? FlaskConical : status === "completed" ? CheckCircle : Clock;
  return <Icon size={14} style={{ color: statusColor }} />;
}

export default function ExperimentCard({ experiment }: ExperimentCardProps) {
  return (
    <article className="content-card experiment-card">
      <div className="content-card-heading">
        <span className={`status-pill status-${experiment.status}`} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <StatusIcon status={experiment.status} />
          {experiment.statusLabel}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Clock size={14} style={{ color: "var(--color-subtle)" }} />
          {experiment.durationDays} {experiment.durationDays === 1 ? "day" : "days"}
        </span>
      </div>
      <h2>{experiment.title}</h2>
      <p>{experiment.description}</p>
      <div className="progress-track" role="progressbar" aria-label="Experiment progress" aria-valuenow={experiment.progressPercent} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${experiment.progressPercent}%` }} /></div>
      <small className="card-supporting-text">{experiment.progressPercent}% complete</small>
    </article>
  );
}