import ExperimentResultView from "@/components/ExperimentResultView";
import Navbar from "@/components/Navbar";

export default function ResultPage() {
  return (
    <main className="page-shell result-page">
      <Navbar variant="product" />
      <ExperimentResultView />
    </main>
  );
}
