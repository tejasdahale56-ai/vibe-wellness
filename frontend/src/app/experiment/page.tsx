"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import ExperimentForm from "@/components/ExperimentForm";
import CreateExperimentForm from "@/components/CreateExperimentForm";
import { Plus } from "lucide-react";
import { getExperimentsFromApi } from "@/lib/api";
import type { Experiment } from "@/types";

export default function ExperimentPage() {
  const [experiment, setExperiment] = useState<Experiment | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function loadExperiments() {
      try {
        const experiments = await getExperimentsFromApi();
        if (experiments.length > 0) {
          setExperiment(experiments[0]);
        }
      } catch (err) {
        console.error("Failed to load experiments:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    loadExperiments();
  }, []);

  const handleCreateExperiment = (newExperiment: Experiment) => {
    setExperiment(newExperiment);
    setShowCreateForm(false);
  };

  return (
    <main className="page-shell experiment-page">
      <Navbar variant="product" />
      <div className="experiment-page-wrap">
        <header className="experiment-page-heading">
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "20px" }}>
            <div>
              <p className="section-eyebrow">A LITTLE CURIOSITY, NO PRESSURE</p>
              <h1>Try a small experiment</h1>
              <p>One observation can become the beginning of a pattern.</p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              style={{
                display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 16px",
                border: "1px solid var(--color-border)", borderRadius: "var(--radius-control)",
                background: "transparent", color: "var(--color-accent)", fontSize: "12px", fontWeight: 600,
                cursor: "pointer", transition: "all 0.2s"
              }}
              onMouseOver={(e) => { e.currentTarget.style.background = "var(--color-surface-raised)"; }}
              onMouseOut={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              <Plus size={16} /> New Experiment
            </button>
          </div>
        </header>

        {showCreateForm && (
          <CreateExperimentForm onClose={() => setShowCreateForm(false)} onCreated={handleCreateExperiment} />
        )}

        {!showCreateForm && loading && <p>Loading your experiment...</p>}
        {!showCreateForm && error && <p>We couldn\u2019t load your experiment.</p>}
        {!showCreateForm && !loading && !error && experiment && <ExperimentForm experiment={experiment} />}
        {!showCreateForm && !loading && !error && !experiment && <p>No experiments yet. Create one to get started.</p>}

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
