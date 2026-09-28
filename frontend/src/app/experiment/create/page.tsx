import Navbar from "@/components/Navbar";
import ExperimentLogForm from "@/components/ExperimentLogForm";

export default function ExperimentLogPage() {
  return (
    <main className="page-shell meal-logger-page">
      <Navbar variant="product" />
      <div className="meal-logger-wrap">
        <header className="meal-page-heading">
          <span className="eyebrow"><span className="eyebrow-dot" /> A SMALL CURIOSITY</span>
          <h1>Create an experiment</h1>
          <p>One observation can become the beginning of a pattern.</p>
        </header>
        <ExperimentLogForm />
        <p className="meal-page-note">A gentle way to get curious about your own patterns.</p>
      </div>
    </main>
  );
}