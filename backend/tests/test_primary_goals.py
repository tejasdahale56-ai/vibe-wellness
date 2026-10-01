import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.current_user import get_current_user
from app.database import Base, get_db
from app.main import app
from app.models import User


class PrimaryGoalApiTests(unittest.TestCase):
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
        self.current_user = self.user
        app.dependency_overrides[get_db] = lambda: self.db
        app.dependency_overrides[get_current_user] = lambda: self.current_user
        self.client = TestClient(app)

    def tearDown(self):
        app.dependency_overrides.clear()
        self.db.close()
        Base.metadata.drop_all(bind=self.engine)
        self.engine.dispose()

    def put_goal(self, payload):
        return self.client.put("/api/goals/primary", json=payload)

    def test_no_goal_returns_null(self):
        response = self.client.get("/api/goals/primary")

        self.assertEqual(response.status_code, 200)
        self.assertIsNone(response.json())

    def test_create_goal(self):
        response = self.put_goal(
            {
                "goal_type": "energy",
                "display_label": "Improve my daily energy",
            }
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["goal_type"], "energy")
        self.assertEqual(payload["display_label"], "Improve my daily energy")
        self.assertIsNone(payload["custom_text"])
        self.assertIn("created_at", payload)
        self.assertIn("updated_at", payload)

    def test_retrieve_goal(self):
        self.put_goal(
            {
                "goal_type": "sleep",
                "display_label": "Sleep more consistently",
            }
        )

        response = self.client.get("/api/goals/primary")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["goal_type"], "sleep")

    def test_update_goal_reuses_primary_goal(self):
        created = self.put_goal(
            {
                "goal_type": "movement",
                "display_label": "Move more often",
            }
        ).json()

        updated = self.put_goal(
            {
                "goal_type": "focus",
                "display_label": "Protect my focus",
            }
        )

        self.assertEqual(updated.status_code, 200)
        self.assertEqual(updated.json()["id"], created["id"])
        self.assertEqual(updated.json()["goal_type"], "focus")

    def test_rejects_invalid_goal_type(self):
        response = self.put_goal(
            {
                "goal_type": "hydration",
                "display_label": "Drink more water",
            }
        )

        self.assertEqual(response.status_code, 422)

    def test_custom_goal_requires_custom_text(self):
        missing_text = self.put_goal(
            {
                "goal_type": "custom",
                "display_label": "My own goal",
            }
        )
        blank_text = self.put_goal(
            {
                "goal_type": "custom",
                "display_label": "My own goal",
                "custom_text": "   ",
            }
        )
        valid_custom_goal = self.put_goal(
            {
                "goal_type": "custom",
                "display_label": "My own goal",
                "custom_text": "Build a calmer evening routine",
            }
        )

        self.assertEqual(missing_text.status_code, 422)
        self.assertEqual(blank_text.status_code, 422)
        self.assertEqual(valid_custom_goal.status_code, 200)

    def test_user_scoping_does_not_expose_another_users_goal(self):
        self.current_user = self.other_user
        self.put_goal(
            {
                "goal_type": "recovery",
                "display_label": "Support recovery",
            }
        )

        self.current_user = self.user
        response = self.client.get("/api/goals/primary")

        self.assertEqual(response.status_code, 200)
        self.assertIsNone(response.json())


if __name__ == "__main__":
    unittest.main()
