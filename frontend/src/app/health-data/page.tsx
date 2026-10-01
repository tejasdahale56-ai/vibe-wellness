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
    <main className="page-shell meal-logger-page">
      <Navbar variant="product" />
      <div className="meal-logger-wrap">
        <header className="meal-page-heading">
          <span className="eyebrow"><span className="eyebrow-dot" /> YOUR PERSONAL HEALTH HISTORY</span>
          <h1>Daily Data</h1>
          <p>Import a CSV export from your wearable. Measurements missing from the file stay blank.</p>
        </header>
        <section className="dashboard-section" aria-labelledby="import-title">
          <h2 id="import-title">Import a CSV file</h2>
          <p>Fitbit daily activity and sleep exports are supported. Files up to 5 MB.</p>
          <form className="meal-log-form" onSubmit={submit}>
            <div className="form-field">
              <label className="form-label" htmlFor="health-csv">CSV file</label>
              <input className="meal-time-input" id="health-csv" type="file" accept=".csv,text/csv" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
            </div>
            <button className="button button-dark" type="submit" disabled={!file || loading}>
              {loading ? "Importing…" : "Import daily data"}
            </button>
            {error && <p className="meal-validation" role="alert">{error}</p>}
          </form>
          {result && (
            <div className="content-card" role="status" aria-live="polite">
              <h3>Import complete</h3>
              <p>{result.days_imported} day(s) added or completed; {result.days_skipped_as_duplicates} duplicate day(s) skipped.</p>
              {result.date_range && <p>Date range: {result.date_range.start} to {result.date_range.end}</p>}
              <p>Measurements found: {result.imported_metrics.join(", ") || "none"}.</p>
              {result.warnings.map((warning) => <p key={warning}>{warning}</p>)}
              <Link className="text-link" href="/history">View health history →</Link>
            </div>
          )}
          <p className="meal-page-note"><Link href="/dashboard">Back to your dashboard</Link></p>
        </section>
      </div>
    </main>
  );
}
