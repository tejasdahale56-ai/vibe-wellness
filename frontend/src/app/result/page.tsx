import ExperimentResultView from "@/components/ExperimentResultView";
import Navbar from "@/components/Navbar";

type ResultPageProps = {
  searchParams: Promise<{ experiment_id?: string }>;
};

export default async function ResultPage({
  searchParams,
}: ResultPageProps) {
  const { experiment_id: experimentId } = await searchParams;

  return (
    <main className="page-shell result-page">
      <Navbar variant="product" />
      <ExperimentResultView experimentId={experimentId} />
    </main>
  );
}
