"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import Navbar from "@/components/Navbar";
import {
  getHealthHistoryFromApi,
  type HealthHistoryEvent,
} from "@/lib/api";

const eventLabels: Record<HealthHistoryEvent["type"], string> = {
  biometric: "Wellness check-in",
  meal: "Meal",
  experiment: "Experiment",
  pattern: "Pattern",
  goal: "Goal",
};

function formatTimestamp(timestamp: string) {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }

  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function EventMetadata({ event }: { event: HealthHistoryEvent }) {
  const { metadata } = event;
  const details: string[] = [];

  if (event.type === "biometric") {
    if (typeof metadata.sleep_minutes === "number") {
      details.push(`${metadata.sleep_minutes} min sleep`);
    }
    if (typeof metadata.steps === "number") {
      details.push(`${metadata.steps.toLocaleString()} steps`);
    }
    if (typeof metadata.energy_score === "number") {
      details.push(`Energy ${metadata.energy_score}`);
    }
  }

  if (event.type === "meal" && metadata.meal_type) {
    details.push(metadata.meal_type);
  }

  if (event.type === "experiment") {
    if (metadata.status) {
      details.push(`Status: ${metadata.status}`);
    }
    if (typeof metadata.duration_days === "number") {
      details.push(`${metadata.duration_days} days`);
    }
    if (typeof metadata.progress_percent === "number") {
      details.push(`${metadata.progress_percent}% complete`);
    }
  }

  if (event.type === "pattern") {
    if (metadata.category) {
      details.push(metadata.category);
    }
    if (typeof metadata.observation_count === "number") {
      details.push(`${metadata.observation_count} observations`);
    }
  }

  if (event.type === "goal" && metadata.goal_type) {
    details.push(metadata.goal_type);
  }

  if (details.length === 0 && (!metadata.tags || metadata.tags.length === 0)) {
    return null;
  }

  return (
    <div className="history-event-metadata">
      {details.length > 0 && (
        <p>{details.join(" · ")}</p>
      )}
      {metadata.tags && metadata.tags.length > 0 && (
        <div className="tag-list" aria-label="Meal tags">
          {metadata.tags.map((tag) => (
            <span className="tag" key={tag}>{tag}</span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function HistoryPage() {
  const [events, setEvents] = useState<HealthHistoryEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function loadHistory() {
      try {
        setEvents(await getHealthHistoryFromApi());
      } catch (loadError) {
        console.error("Failed to load health history:", loadError);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    void loadHistory();
  }, []);

  return (
    <main className="page-shell history-page">
      <Navbar variant="product" activePage="history" />
      <div className="history-page-main wrap">
        <header className="history-page-heading">
          <p className="section-eyebrow">YOUR RECORD</p>
          <h1>Health History</h1>
          <p>Your wellness story over time.</p>
        </header>

        {loading && (
          <section className="history-state content-card" aria-live="polite">
            <h2>Loading your history...</h2>
            <p>Gathering your recorded wellness events.</p>
          </section>
        )}

        {!loading && error && (
          <section className="history-state content-card" aria-live="assertive">
            <h2>We couldn&apos;t load your history.</h2>
            <p>Please try again shortly.</p>
          </section>
        )}

        {!loading && !error && events.length === 0 && (
          <section className="history-state content-card">
            <h2>Your history will begin here.</h2>
            <p>Complete your first wellness check-in to start building your personal timeline.</p>
            <Link className="button button-dark" href="/onboarding">
              Complete your first check-in <span aria-hidden="true">→</span>
            </Link>
          </section>
        )}

        {!loading && !error && events.length > 0 && (
          <section className="history-timeline" aria-label="Health history">
            {events.map((event, index) => (
              <article className="history-event content-card" key={`${event.type}-${event.timestamp}-${index}`}>
                <div className="history-event-time">
                  <time dateTime={event.timestamp}>{formatTimestamp(event.timestamp)}</time>
                </div>
                <div className="history-event-content">
                  <span className="history-event-type" data-type={event.type}>
                    {eventLabels[event.type]}
                  </span>
                  <h2>{event.title}</h2>
                  <p>{event.description}</p>
                  <EventMetadata event={event} />
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
