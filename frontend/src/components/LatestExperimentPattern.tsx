"use client";

import { useSyncExternalStore } from "react";
import { getExperimentResult, hasCompletedExperimentThisSession, subscribeToExperimentResult } from "@/data/demoData";

export default function LatestExperimentPattern() {
  const experiment = useSyncExternalStore(subscribeToExperimentResult, getExperimentResult, getExperimentResult);
  const completedThisSession = useSyncExternalStore(subscribeToExperimentResult, hasCompletedExperimentThisSession, () => false);
  const energy = experiment.energyAfter ?? 7.1;
  const baseline = experiment.baselineEnergy ?? 5.8;
  const difference = energy - baseline;

  return (
    <article className="latest-experiment-card" aria-label="Latest experiment result">
      <div className="latest-experiment-heading">
        <span className="pattern-symbol" aria-hidden="true">↗</span>
        <span className="latest-experiment-status">{completedThisSession ? "Observation recorded" : "Demo result"}</span>
      </div>
      <h3>10-minute post-lunch walk</h3>
      <div className="latest-experiment-metrics">
        <p><strong>{energy.toFixed(1)} / 10</strong><span>reported energy</span></p>
        <p><strong>{baseline.toFixed(1)} / 10</strong><span>comparable-day baseline</span></p>
        <p className="latest-experiment-difference"><strong>{difference > 0 ? "+" : ""}{difference.toFixed(1)}</strong><span>difference</span></p>
      </div>
      <p className="latest-experiment-caution">One observation, not proof of cause.</p>
    </article>
  );
}
