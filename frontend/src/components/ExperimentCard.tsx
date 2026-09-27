import type { Experiment } from "@/types";

type ExperimentCardProps = { experiment: Experiment };

export default function ExperimentCard({ experiment }: ExperimentCardProps) {
  return (
    <article className="content-card experiment-card">
      <div className="content-card-heading"><span className={`status-pill status-${experiment.status}`}>{experiment.statusLabel}</span><span>{experiment.durationDays} {experiment.durationDays === 1 ? "day" : "days"}</span></div>
      <h2>{experiment.title}</h2><p>{experiment.description}</p>
      <div className="progress-track" role="progressbar" aria-label="Experiment progress" aria-valuenow={experiment.progressPercent} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${experiment.progressPercent}%` }} /></div>
      <small className="card-supporting-text">{experiment.progressPercent}% complete</small>
    </article>
  );
}
