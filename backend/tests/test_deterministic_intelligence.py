import sys
import unittest
from datetime import datetime, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.analytics.experiments import summarize_experiment_energy
from app.analytics.patterns import analyze_meal_experiment_patterns
from app.api.analytics import get_analytics_summary
from app.api.insights import get_today_insight
from app.database import Base
from app.models import Experiment, Meal, User


class DeterministicIntelligenceTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine(
            "sqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        Base.metadata.create_all(bind=self.engine)
        self.session_factory = sessionmaker(bind=self.engine)
        self.db = self.session_factory()
        self.user = User(name="Test User", email="test@example.test")
        self.other_user = User(name="Other User", email="other@example.test")
        self.db.add_all([self.user, self.other_user])
        self.db.commit()
        self.db.refresh(self.user)
        self.db.refresh(self.other_user)

    def tearDown(self):
        self.db.close()
        Base.metadata.drop_all(bind=self.engine)
        self.engine.dispose()

    def add_experiment(
        self,
        user_id,
        completed_at,
        baseline_energy=5.0,
        energy_after=6.0,
        duration_days=1,
    ):
        experiment = Experiment(
            user_id=user_id,
            title="Test experiment",
            description="A test record",
            duration_days=duration_days,
            status="completed",
            completed_at=completed_at,
            baseline_energy=baseline_energy,
            energy_after=energy_after,
        )
        self.db.add(experiment)
        return experiment

    def add_meal(
        self,
        user_id,
        logged_at,
        name="Oats",
        meal_type="Breakfast",
    ):
        meal = Meal(
            user_id=user_id,
            name=name,
            meal_type=meal_type,
            description="A test meal",
            logged_at=logged_at,
            time_label="8:00 AM",
            tags=[],
        )
        self.db.add(meal)
        return meal

    def test_energy_summary_requires_three_measurable_experiments(self):
        experiments = [
            Experiment(energy_after=6.0, baseline_energy=5.0),
            Experiment(energy_after=4.0, baseline_energy=5.0),
        ]
        summary = summarize_experiment_energy(experiments)
        self.assertFalse(summary["enough_data_for_pattern"])

        experiments.append(
            Experiment(energy_after=7.0, baseline_energy=5.0)
        )
        summary = summarize_experiment_energy(experiments)
        self.assertTrue(summary["enough_data_for_pattern"])
        self.assertEqual(summary["analyzed_experiments"], 3)

    def test_missing_energy_values_are_excluded_not_zero_filled(self):
        summary = summarize_experiment_energy(
            [
                Experiment(energy_after=7.0, baseline_energy=5.0),
                Experiment(energy_after=None, baseline_energy=5.0),
                Experiment(energy_after=8.0, baseline_energy=None),
            ]
        )
        self.assertEqual(summary["completed_experiments"], 3)
        self.assertEqual(summary["analyzed_experiments"], 1)
        self.assertEqual(summary["average_energy_change"], 2.0)
        self.assertEqual(summary["positive_energy_changes"], 1)

        empty_summary = summarize_experiment_energy(
            [Experiment(energy_after=None, baseline_energy=None)]
        )
        self.assertIsNone(empty_summary["average_energy_change"])
        self.assertEqual(empty_summary["analyzed_experiments"], 0)

    def test_pattern_analysis_returns_no_observation_below_threshold(self):
        first_completion = datetime(2026, 1, 4, 12)
        for offset in (0, 3):
            completion = first_completion + timedelta(days=offset)
            self.add_experiment(self.user.id, completion)
            self.add_meal(
                self.user.id,
                completion - timedelta(hours=12),
            )
        self.db.commit()

        result = analyze_meal_experiment_patterns(self.db, self.user.id)
        self.assertFalse(result["enough_data_for_pattern"])
        self.assertEqual(result["observations"], [])

    def test_pattern_analysis_reports_repeated_meal_after_threshold(self):
        first_completion = datetime(2026, 1, 4, 12)
        for offset in (0, 3, 6):
            completion = first_completion + timedelta(days=offset)
            self.add_experiment(self.user.id, completion)
            self.add_meal(
                self.user.id,
                completion - timedelta(hours=12),
            )
        self.db.commit()

        result = analyze_meal_experiment_patterns(self.db, self.user.id)
        self.assertTrue(result["enough_data_for_pattern"])
        self.assertTrue(result["observations"])
        self.assertEqual(
            result["observations"][0]["positive_experiments_with_feature"],
            3,
        )
        self.assertFalse(result["observations"][0]["causal_claim"])

    def test_pattern_analysis_excludes_other_users_records(self):
        first_completion = datetime(2026, 2, 4, 12)
        for offset in (0, 3):
            completion = first_completion + timedelta(days=offset)
            self.add_experiment(self.user.id, completion)
            self.add_meal(
                self.user.id,
                completion - timedelta(hours=12),
            )
        for offset in (0, 3, 6):
            completion = first_completion + timedelta(days=offset)
            self.add_experiment(self.other_user.id, completion)
            self.add_meal(
                self.other_user.id,
                completion - timedelta(hours=12),
            )
        self.db.commit()

        result = analyze_meal_experiment_patterns(self.db, self.user.id)
        self.assertEqual(result["completed_experiments"], 2)
        self.assertEqual(result["positive_experiments_analyzed"], 2)
        self.assertFalse(result["enough_data_for_pattern"])
        self.assertEqual(result["observations"], [])

    def test_today_insight_is_neutral_when_data_is_insufficient(self):
        self.add_experiment(
            self.user.id,
            datetime(2026, 3, 4, 12),
        )
        self.db.commit()

        insight = get_today_insight(self.user, self.db)
        self.assertEqual(insight["title"], "Not enough data yet.")
        self.assertEqual(insight["category"], "general")
        self.assertIsNone(insight["score"])

    def test_analytics_summary_is_safe_without_records(self):
        summary = get_analytics_summary(self.user, self.db)
        self.assertEqual(summary["user_id"], self.user.id)
        self.assertEqual(summary["observations"]["biometric_days"], 0)
        self.assertEqual(summary["observations"]["meals_logged"], 0)
        self.assertEqual(summary["baseline"]["days"], 0)
        self.assertIsNone(summary["baseline"]["average_energy_score"])
        self.assertIsNone(summary["latest_meal"])
        self.assertEqual(
            summary["insight"]["comparison"]["comparable_days"],
            0,
        )


if __name__ == "__main__":
    unittest.main()
