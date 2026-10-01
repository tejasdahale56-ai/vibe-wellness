"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";

import Navbar from "@/components/Navbar";
import { importHealthDataFromApi, type HealthDataImportResult } from "@/lib/api";

export default function HealthDataPage() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<HealthDataImportResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      setResult(await importHealthDataFromApi(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not import this file.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page-shell">
      <Navbar variant="product" />
      <div className="wrap dashboard-main">
        <header className="dashboard-greeting">
          <p className="section-eyebrow">YOUR PERSONAL HEALTH HISTORY</p>
          <h1>Daily Data</h1>
          <p>Import a CSV export from your wearable. Missing measurements stay blank.</p>
        </header>
        <section className="dashboard-section" aria-labelledby="import-title">
          <h2 id="import-title">Import a CSV file</h2>
          <p>Fitbit daily activity and sleep exports are supported. Files up to 5 MB.</p>
          <form onSubmit={submit}>
            <label htmlFor="health-csv">CSV file</label>
            <input id="health-csv" type="file" accept=".csv,text/csv" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
            <button className="button button-dark" type="submit" disabled={!file || loading}>
              {loading ? "Importing…" : "Import daily data"}
            </button>
          </form>
          {error && <p role="alert">{error}</p>}
          {result && (
            <div role="status" aria-live="polite">
              <h3>Import complete</h3>
              <p>{result.days_imported} day(s) added; {result.days_skipped_as_duplicates} duplicate day(s) skipped.</p>
              {result.date_range && <p>Date range: {result.date_range.start} to {result.date_range.end}</p>}
              <p>Measurements found: {result.imported_metrics.join(", ") || "none"}.</p>
              {result.warnings.map((warning) => <p key={warning}>{warning}</p>)}
              <Link className="text-link" href="/history">View health history →</Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
