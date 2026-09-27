import ExperimentForm from "@/components/ExperimentForm";
import Navbar from "@/components/Navbar";
import { getExperiments } from "@/data/demoData";

export default function ExperimentPage() {
  const experiment = getExperiments()[0];

  return (
    <main className="page-shell experiment-page">
      <Navbar variant="product" />
      <div className="experiment-page-wrap">
        <header className="experiment-page-heading">
          <p className="section-eyebrow">A LITTLE CURIOSITY, NO PRESSURE</p>
          <h1>Try a small experiment</h1>
          <p>One observation can become the beginning of a pattern.</p>
        </header>
        <ExperimentForm experiment={experiment} />
      </div>
    </main>
  );
}
