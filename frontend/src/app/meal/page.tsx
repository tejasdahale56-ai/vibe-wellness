import MealLogForm from "@/components/MealLogForm";
import Navbar from "@/components/Navbar";

export default function MealPage() {
  return (
    <main className="page-shell meal-logger-page">
      <Navbar variant="product" />
      <div className="meal-logger-wrap">
        <header className="meal-page-heading">
          <span className="eyebrow"><span className="eyebrow-dot" /> A MOMENT FOR YOURSELF</span>
          <h1>Log a meal</h1>
          <p>Give VIBE a little more context about your day.</p>
        </header>
        <MealLogForm />
        <p className="meal-page-note">Just a little context to help you notice your own patterns.</p>
      </div>
    </main>
  );
}
