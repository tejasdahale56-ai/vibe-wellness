import type { Pattern } from "@/types";

type PatternCardProps = { pattern: Pattern };

export default function PatternCard({ pattern }: PatternCardProps) {
  return (
    <article className="content-card pattern-card" data-category={pattern.category}>
      <div className="content-card-heading"><span className="pattern-symbol" aria-hidden="true">✳</span><span className="pattern-category-label">{pattern.category}</span></div>
      <h2>{pattern.title}</h2><p>{pattern.description}</p>
      <small className="card-supporting-text">{pattern.supportingDetail}</small>
    </article>
  );
}
