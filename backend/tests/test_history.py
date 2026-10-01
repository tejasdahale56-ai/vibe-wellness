import sys
import unittest
from datetime import datetime, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.current_user import get_current_user
from app.database import Base, get_db
from app.main import app
from app.models import Biometric, Experiment, Goal, Meal, Pattern, User


class HealthHistoryApiTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine(
            "sqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        Base.metadata.create_all(bind=self.engine)
        self.db = sessionmaker(bind=self.engine)()
        self.user = User(name="History User", email="history@example.test")
        self.other_user = User(name="Other User", email="other@example.test")
        self.db.add_all([self.user, self.other_user])
        self.db.commit()
        self.db.refresh(self.user)
        self.db.refresh(self.other_user)
        self.current_user = self.user
        app.dependency_overrides[get_db] = lambda: self.db
        app.dependency_overrides[get_current_user] = lambda: self.current_user
        self.client = TestClient(app)

    def tearDown(self):
        app.dependency_overrides.clear()
        self.client.close()
        self.db.close()
        Base.metadata.drop_all(bind=self.engine)
        self.engine.dispose()

    def add_history_records(self, user_id: int, prefix: str = ""):
        start = datetime(2026, 1, 1, 9)
        self.db.add_all([
            Biometric(
                user_id=user_id,
                recorded_at=start,
                sleep_minutes=450,
                steps=6000,
                resting_heart_rate_bpm=65,
                hrv_milliseconds=30,
                energy_score=6.5,
                active_minutes=35,
            ),
            Meal(
                user_id=user_id,
                name=f"{prefix}Lunch",
                description="Medium portion",
                logged_at=start + timedelta(hours=3),
                time_label="12:00 PM",
                tags=["grains"],
            ),
            Experiment(
                user_id=user_id,
                title=f"{prefix}Walk after lunch",
                description="Take a short walk.",
                duration_days=1,
                status="active",
                created_at=start + timedelta(hours=4),
            ),
            Pattern(
                user_id=user_id,
                title=f"{prefix}Meal timing",
                description="A repeated observation.",
                category="meals",
                observation_count=3,
                supporting_detail="Observed in saved records.",
                created_at=start + timedelta(hours=5),
            ),
            Goal(
                user_id=user_id,
                goal_type="energy",
                display_label=f"{prefix}Improve energy",
                created_at=start + timedelta(hours=1),
                updated_at=start + timedelta(hours=6),
            ),
        ])
        self.db.commit()

    def test_authenticated_user_can_retrieve_multiple_history_event_types(self):
        self.add_history_records(self.user.id)

        response = self.client.get("/api/history")

        self.assertEqual(response.status_code, 200)
        events = response.json()
        self.assertEqual(
            {event["type"] for event in events},
            {"biometric", "meal", "experiment", "pattern", "goal"},
        )
        self.assertIn("status", next(
            event["metadata"]
            for event in events
            if event["type"] == "experiment"
        ))

    def test_newest_history_events_are_returned_first(self):
        self.add_history_records(self.user.id)

        events = self.client.get("/api/history").json()

        timestamps = [datetime.fromisoformat(event["timestamp"]) for event in events]
        self.assertEqual(timestamps, sorted(timestamps, reverse=True))
        self.assertEqual(events[0]["type"], "goal")

    def test_empty_history_returns_an_empty_list(self):
        response = self.client.get("/api/history")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [])

    def test_other_users_history_is_not_exposed(self):
        self.add_history_records(self.other_user.id, prefix="Other ")

        response = self.client.get("/api/history")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [])

    def test_unauthenticated_history_access_is_rejected(self):
        app.dependency_overrides.pop(get_current_user)

        response = self.client.get("/api/history")

        self.assertEqual(response.status_code, 401)


if __name__ == "__main__":
    unittest.main()
