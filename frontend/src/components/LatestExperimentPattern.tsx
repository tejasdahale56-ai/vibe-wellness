"use client";

import { useEffect, useState } from "react";
import { getExperimentsFromApi } from "@/lib/api";
import type { Experiment } from "@/types";

export default function LatestExperimentPattern() {
  const [experiment, setExperiment] = useState<Experiment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function loadLatestExperiment() {
      try {
        const experiments = await getExperimentsFromApi();
        setExperiment(
          experiments.find(
            (item) => item.status === "completed",
          ) ?? null,
        );
      } catch (err) {
        console.error("Failed to load latest experiment:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    void loadLatestExperiment();
  }, []);

  if (loading) {
    return <article className="latest-experiment-card"><p>Loading your latest experiment...</p></article>;
  }

  if (error) {
    return <article className="latest-experiment-card"><p>We couldn&apos;t load your latest experiment.</p></article>;
  }

  if (!experiment) {
    return <article className="latest-experiment-card"><p>No completed experiments yet.</p></article>;
  }

  const energy = experiment.energyAfter;
  const baseline = experiment.baselineEnergy;
  const difference = energy !== undefined && baseline !== undefined
    ? energy - baseline
    : undefined;

  return (
    <article className="latest-experiment-card" aria-label="Latest experiment result">
      <div className="latest-experiment-heading">
        <span className="pattern-symbol" aria-hidden="true">↗</span>
        <span className="latest-experiment-status">Observation recorded</span>
      </div>
      <h3>{experiment.title}</h3>
      <div className="latest-experiment-metrics">
        <p><strong>{energy !== undefined ? energy.toFixed(1) : "—"} / 10</strong><span>reported energy</span></p>
        <p><strong>{baseline !== undefined ? baseline.toFixed(1) : "—"} / 10</strong><span>comparable-day baseline</span></p>
        <p className="latest-experiment-difference"><strong>{difference !== undefined ? `${difference > 0 ? "+" : ""}${difference.toFixed(1)}` : "—"}</strong><span>difference</span></p>
      </div>
      <p className="latest-experiment-caution">One observation, not proof of cause.</p>
    </article>
  );
}
