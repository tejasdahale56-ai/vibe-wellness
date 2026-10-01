import sys
import unittest
from datetime import datetime, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.analytics.experiments import calculate_experiment_measurement
from app.api.experiments import get_experiment_result
from app.database import Base
from app.models import Biometric, Experiment, User


class ExperimentMeasurementTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine(
            "sqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        Base.metadata.create_all(bind=self.engine)
        self.db = sessionmaker(bind=self.engine)()
        self.user = User(name="Test User", email="test@example.test")
        self.other_user = User(
            name="Other User",
            email="other@example.test",
        )
        self.db.add_all([self.user, self.other_user])
        self.db.commit()
        self.db.refresh(self.user)
        self.db.refresh(self.other_user)

    def tearDown(self):
        self.db.close()
        Base.metadata.drop_all(bind=self.engine)
        self.engine.dispose()

    def add_biometric(self, user_id, recorded_at, energy_score, sleep_minutes):
        self.db.add(
            Biometric(
                user_id=user_id,
                recorded_at=recorded_at,
                sleep_minutes=sleep_minutes,
                steps=5000,
                resting_heart_rate_bpm=65,
                hrv_milliseconds=30,
                energy_score=energy_score,
                active_minutes=30,
            )
        )

    def add_completed_experiment(
        self,
        user_id,
        completed_at,
        self_reported_energy=None,
    ):
        experiment = Experiment(
            user_id=user_id,
            title="Test experiment",
            description="Test a small behavior",
            why="To observe an energy change",
            context="Morning routine",
            duration_days=2,
            status="completed",
            completed_at=completed_at,
            self_reported_energy=self_reported_energy,
            energy_after=self_reported_energy,
        )
        self.db.add(experiment)
        self.db.commit()
        self.db.refresh(experiment)
        return experiment

    def test_compares_adjacent_baseline_and_experiment_windows(self):
        completed_at = datetime(2026, 1, 10, 12)
        self.add_biometric(self.user.id, datetime(2026, 1, 7, 9), 4.0, 400)
        self.add_biometric(self.user.id, datetime(2026, 1, 8, 9), 5.0, 420)
        self.add_biometric(self.user.id, datetime(2026, 1, 9, 9), 6.0, 450)
        self.add_biometric(self.user.id, datetime(2026, 1, 10, 9), 7.0, 480)
        self.db.commit()
        experiment = self.add_completed_experiment(self.user.id, completed_at)

        result = get_experiment_result(experiment.id, self.user, self.db)

        self.assertTrue(result["sufficient_data"])
        self.assertEqual(result["baseline_energy"], 4.5)
        self.assertEqual(result["experiment_period_energy"], 6.5)
        self.assertEqual(result["observed_energy_difference"], 2.0)
        self.assertEqual(result["baseline_observation_count"], 2)
        self.assertEqual(result["experiment_period_observation_count"], 2)
        self.assertEqual(result["experiment_period_source"], "biometric_history")
        self.assertEqual(
            result["additional_measurements"]["sleep_minutes"][
                "observed_difference"
            ],
            55.0,
        )
        self.assertIn("not evidence", result["summary"])

    def test_uses_completion_check_in_when_period_biometrics_are_missing(self):
        completed_at = datetime(2026, 1, 10, 12)
        self.add_biometric(self.user.id, datetime(2026, 1, 7, 9), 4.0, 400)
        self.add_biometric(self.user.id, datetime(2026, 1, 8, 9), 5.0, 420)
        self.db.commit()
        experiment = self.add_completed_experiment(
            self.user.id,
            completed_at,
            self_reported_energy=7.0,
        )

        result = get_experiment_result(experiment.id, self.user, self.db)

        self.assertTrue(result["sufficient_data"])
        self.assertEqual(result["experiment_period_energy"], 7.0)
        self.assertEqual(result["experiment_period_observation_count"], 1)
        self.assertEqual(result["experiment_period_source"], "completion_check_in")
        self.assertEqual(result["additional_measurements"], {})

    def test_returns_explicit_insufficient_result_without_baseline_support(self):
        completed_at = datetime(2026, 1, 10, 12)
        self.add_biometric(self.user.id, datetime(2026, 1, 10, 9), 7.0, 480)
        self.db.commit()
        experiment = self.add_completed_experiment(self.user.id, completed_at)

        biometrics = self.db.query(Biometric).all()
        result = calculate_experiment_measurement(experiment, biometrics)

        self.assertFalse(result["sufficient_data"])
        self.assertIsNone(result["observed_energy_difference"])
        self.assertIn("not enough measurements", result["summary"])

    def test_result_endpoint_excludes_other_users_experiment(self):
        experiment = self.add_completed_experiment(
            self.other_user.id,
            datetime(2026, 1, 10, 12),
        )

        with self.assertRaises(HTTPException) as raised:
            get_experiment_result(experiment.id, self.user, self.db)

        self.assertEqual(raised.exception.status_code, 404)


if __name__ == "__main__":
    unittest.main()
