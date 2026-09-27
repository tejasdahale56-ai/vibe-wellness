"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";
import { getExperimentResult, saveExperimentPattern, subscribeToExperimentResult } from "@/data/demoData";

export default function ExperimentResultView() {
  const router = useRouter();
  const result = useSyncExternalStore(subscribeToExperimentResult, getExperimentResult, getExperimentResult);
  const currentEnergy = result.energyAfter ?? 7.1;
  const baselineEnergy = result.baselineEnergy ?? 5.8;
  const difference = currentEnergy - baselineEnergy;

  function handleSavePattern() {
    saveExperimentPattern();
    router.push("/patterns");
  }

  return (
    <div className="result-page-wrap">
      <header className="result-page-heading">
        <p className="section-eyebrow">A MOMENT TO REFLECT</p>
        <h1>Your experiment result</h1>
        <p>Here&apos;s how today&apos;s observation compares with your recent history.</p>
      </header>

      <section className="result-comparison-card" aria-labelledby="result-comparison-heading">
        <span className="card-kicker">YOUR RECENT HISTORY</span>
        <h2 id="result-comparison-heading">A new observation for your pattern.</h2>
        <div className="result-metrics">
          <div className="result-metric"><span>TODAY</span><strong>{currentEnergy.toFixed(1)} <small>/ 10</small></strong></div>
          <span className="result-divider" aria-hidden="true">vs.</span>
          <div className="result-metric"><span>COMPARABLE DAYS</span><strong>{baselineEnergy.toFixed(1)} <small>/ 10</small></strong></div>
          <div className="result-difference"><span>DIFFERENCE</span><strong>{difference > 0 ? "+" : ""}{difference.toFixed(1)}</strong></div>
        </div>
        <p className="result-comparison-copy">Your check-in was {result.selfReportedEnergy ?? 7} / 10. This demo compares a mock current-energy value of {currentEnergy.toFixed(1)} / 10 with {baselineEnergy.toFixed(1)} / 10 on comparable days.</p>
        <p className="result-caution">This is one observation, not proof that the experiment caused the difference.</p>
      </section>

      {result.reflection?.trim() && (
        <section className="result-reflection-card" aria-labelledby="reflection-heading">
          <p className="section-eyebrow">YOUR REFLECTION</p>
          <h2 id="reflection-heading">You noticed:</h2>
          <blockquote>{result.reflection}</blockquote>
        </section>
      )}

      <section className="result-learning-card" aria-labelledby="learned-heading">
        <span className="philosophy-mark" aria-hidden="true">✳</span>
        <div><p className="section-eyebrow">ONE STEP IN A LONGER STORY</p><h2 id="learned-heading">What VIBE learned</h2><p>Today&apos;s observation adds another data point to your personal history.</p><p>Over time, repeated observations can help reveal whether this pattern shows up consistently for you.</p></div>
      </section>

      <div className="result-actions">
        <button className="button button-dark" type="button" onClick={handleSavePattern}>Save this pattern <span aria-hidden="true">→</span></button>
        <Link className="result-back-link" href="/dashboard">Back to today</Link>
      </div>
    </div>
  );
}
