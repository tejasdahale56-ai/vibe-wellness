import type { Insight } from "@/types";

type InsightCardProps = { insight: Insight; variant?: "default" | "featured" | "detail" };

export default function InsightCard({ insight, variant = "default" }: InsightCardProps) {
  if (variant === "detail") {
    return (
      <article className="insight-summary detail-insight-card">
        <div className="card-topline"><span className="card-kicker">{insight.dateLabel}</span><span className="insight-sparkle" aria-hidden="true">✳</span></div>
        <h2 className="detail-insight-title">{insight.title}</h2>
        <p className="detail-insight-summary">{insight.summary}</p>
        {insight.context && <p className="detail-insight-context">{insight.context}</p>}
        {insight.methodNote && <p className="detail-insight-method">{insight.methodNote}</p>}
      </article>
    );
  }

  if (variant === "featured") {
    return (
      <article className="insight-summary featured-insight">
        <div className="card-topline"><span className="card-kicker">{insight.dateLabel}</span><span className="insight-sparkle" aria-hidden="true">✳</span></div>
        <h2 className="featured-heading" id="featured-insight-heading">{insight.heading}</h2>
        <p className="featured-title">{insight.title}</p>
        <p className="featured-summary">{insight.summary}</p>
        {insight.context && <p className="featured-context">{insight.context}</p>}
      </article>
    );
  }

  return (
    <div className="insight-summary">
      <div className="card-topline"><div><span className="card-kicker">YOUR DAILY VIBE</span>{insight.dateLabel && <p className="card-date">{insight.dateLabel}</p>}</div><span className="more-button" aria-hidden="true">···</span></div>
      <div className="vibe-score">
        {insight.score !== undefined && <div className="score-ring" aria-label={`Wellness score ${insight.score} out of 100`}><span>{insight.score}</span><small>your rhythm</small></div>}
        <div className="score-copy"><span className="score-label">TODAY’S OUTLOOK</span><strong>{insight.title}</strong><span className="score-note">{insight.summary}</span></div>
      </div>
      <div className="card-divider" />
      <div className="signals-heading"><span>A FEW THINGS WE NOTICED</span><span className="signals-date">TODAY</span></div>
    </div>
  );
}
