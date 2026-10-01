"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import ExperimentForm from "@/components/ExperimentForm";
import CreateExperimentForm from "@/components/CreateExperimentForm";
import ExperimentCard from "@/components/ExperimentCard";
import { Plus } from "lucide-react";
import { getExperimentFromApi, getExperimentsFromApi } from "@/lib/api";
import type { Experiment } from "@/types";

export default function ExperimentPage() {
  return (
    <Suspense fallback={<main className="page-shell experiment-page"><Navbar variant="product" /><p>Loading your experiment...</p></main>}>
      <ExperimentPageContent />
    </Suspense>
  );
}

function ExperimentPageContent() {
  const searchParams = useSearchParams();
  const experimentId = searchParams.get("experiment_id");
  const [experiment, setExperiment] = useState<Experiment | null>(null);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadExperiment() {
      try {
        setLoading(true);
        setError(false);
        setExperiment(null);
        if (experimentId) {
          const selectedExperiment = await getExperimentFromApi(experimentId);
          if (isMounted) setExperiment(selectedExperiment);
        } else {
          const experimentList = await getExperimentsFromApi();
          if (isMounted) setExperiments(experimentList);
        }
      } catch (err) {
        console.error("Failed to load experiment:", err);
        if (isMounted) setError(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    void loadExperiment();
    return () => {
      isMounted = false;
    };
  }, [experimentId]);

  const handleCreateExperiment = (newExperiment: Experiment) => {
    setExperiment(newExperiment);
    setShowCreateForm(false);
  };

  return (
    <main className="page-shell experiment-page">
      <Navbar variant="product" />
      <div className="experiment-page-wrap">
        <header className="experiment-page-heading">
          <div className="experiment-heading-row">
            <div>
              <p className="section-eyebrow">A LITTLE CURIOSITY, NO PRESSURE</p>
              <h1>Try a small experiment</h1>
              <p>One observation can become the beginning of a pattern.</p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="button"
            >
              <Plus size={16} /> New Experiment
            </button>
          </div>
        </header>

        {showCreateForm && (
          <CreateExperimentForm onClose={() => setShowCreateForm(false)} onCreated={handleCreateExperiment} />
        )}

        {!showCreateForm && loading && <p className="page-state">Loading your experiment...</p>}
        {!showCreateForm && error && <p className="page-state">We couldn\u2019t load your experiment.</p>}
        {!showCreateForm && !loading && !error && experiment?.status === "completed" && (
          <section className="latest-experiment-card" aria-labelledby="completed-experiment-title">
            <p className="latest-experiment-status">Observation recorded</p>
            <h2 id="completed-experiment-title">{experiment.title}</h2>
            <p>This experiment is already complete.</p>
            <Link className="button button-outline" href={`/result?experiment_id=${encodeURIComponent(experiment.id)}`}>
              View result <span aria-hidden="true">→</span>
            </Link>
          </section>
        )}
        {!showCreateForm && !loading && !error && experiment && experiment.status !== "completed" && <ExperimentForm experiment={experiment} />}
        {!showCreateForm && !loading && !error && !experiment && experiments.length > 0 && (
          <>
            <p className="page-state">Choose an experiment to continue.</p>
            <div className="experiment-preview">
              {experiments.filter((item) => item.status !== "completed").map((item) => (
                <div key={item.id}>
                  <ExperimentCard experiment={item} />
                  <Link className="button button-outline" href={`/experiment?experiment_id=${encodeURIComponent(item.id)}`}>
                    Open experiment <span aria-hidden="true">→</span>
                  </Link>
                </div>
              ))}
              {experiments.every((item) => item.status === "completed") && <p>No active experiments. Create one to get started.</p>}
            </div>
          </>
        )}
        {!showCreateForm && !loading && !error && !experiment && experiments.length === 0 && <p className="page-state">No experiments yet. Create one to get started.</p>}

        {!showCreateForm && (
          <Link className="text-link" href="/experiment/create">
            Create a new experiment instead{" "}
            <span aria-hidden="true">↗</span>
          </Link>
        )}
      </div>
    </main>
  );
}
