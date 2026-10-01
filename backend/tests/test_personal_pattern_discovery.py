import sys
import unittest
from datetime import datetime, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.analytics.discovery import discover_personal_patterns
from app.api.analytics import get_discovered_patterns
from app.database import Base
from app.models import Biometric, Meal, User


class PersonalPatternDiscoveryTests(unittest.TestCase):
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

    def add_biometric(self, user_id, recorded_at, sleep_minutes, energy_score):
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

    def add_meal(self, user_id, logged_at):
        self.db.add(
            Meal(
                user_id=user_id,
                name="Test meal",
                description="A test meal",
                logged_at=logged_at,
                time_label="8:00 PM",
                tags=[],
            )
        )

    def test_biometric_patterns_require_balanced_support(self):
        first_day = datetime(2026, 1, 1, 9)
        for offset, (sleep, energy) in enumerate(
            ((360, 4.0), (370, 4.5), (380, 5.0), (480, 7.0), (490, 7.5))
        ):
            self.add_biometric(
                self.user.id,
                first_day + timedelta(days=offset),
                sleep,
                energy,
            )
        self.db.commit()

        result = get_discovered_patterns(self.user, self.db)

        self.assertEqual(result["patterns"], [])
        self.assertEqual(result["biometric_observations"], 5)

    def test_discovers_non_causal_sleep_association(self):
        first_day = datetime(2026, 1, 1, 9)
        for offset, (sleep, energy) in enumerate(
            (
                (360, 4.0),
                (370, 4.5),
                (380, 5.0),
                (480, 7.0),
                (490, 7.5),
                (500, 8.0),
            )
        ):
            self.add_biometric(
                self.user.id,
                first_day + timedelta(days=offset),
                sleep,
                energy,
            )
        self.db.commit()

        biometrics = self.db.query(Biometric).all()
        result = discover_personal_patterns(biometrics, [])

        sleep_pattern = next(
            pattern
            for pattern in result["patterns"]
            if pattern["category"] == "sleep"
        )
        self.assertEqual(sleep_pattern["observation_count"], 6)
        self.assertIn("associated with", sleep_pattern["title"])
        self.assertIn("not evidence of causation", sleep_pattern["supporting_detail"])

    def test_meal_timing_uses_only_next_day_biometric_matches(self):
        first_day = datetime(2026, 1, 1, 9)
        for offset, (meal_hour, energy) in enumerate(
            ((12, 4.0), (13, 4.5), (14, 5.0), (19, 7.0), (20, 7.5), (21, 8.0))
        ):
            meal_day = first_day + timedelta(days=offset)
            self.add_meal(
                self.user.id,
                meal_day.replace(hour=meal_hour),
            )
            self.add_biometric(
                self.user.id,
                meal_day + timedelta(days=1),
                420,
                energy,
            )
        self.db.commit()

        result = get_discovered_patterns(self.user, self.db)

        self.assertEqual(result["meal_timing_observations"], 6)
        self.assertTrue(
            any(pattern["category"] == "meals" for pattern in result["patterns"])
        )

    def test_current_user_scope_excludes_other_users_records(self):
        first_day = datetime(2026, 1, 1, 9)
        for offset in range(6):
            self.add_biometric(
                self.other_user.id,
                first_day + timedelta(days=offset),
                360 + offset * 30,
                4.0 + offset,
            )
        self.db.commit()

        result = get_discovered_patterns(self.user, self.db)

        self.assertEqual(result["biometric_observations"], 0)
        self.assertEqual(result["patterns"], [])


if __name__ == "__main__":
    unittest.main()
