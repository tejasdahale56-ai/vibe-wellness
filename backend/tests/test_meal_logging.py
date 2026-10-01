import sys
import unittest
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.current_user import get_current_user
from app.database import Base, get_db
from app.main import app
from app.meal_tagging import extract_heuristic_tags
from app.models import User


class MealLoggingApiTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine(
            "sqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        Base.metadata.create_all(bind=self.engine)
        self.db = sessionmaker(bind=self.engine)()
        self.user = User(name="Meal User", email="meal@example.test")
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

    @staticmethod
    def meal_payload(**overrides):
        payload = {
            "name": "Chicken biryani and curd",
            "meal_type": "Lunch",
            "description": "Medium portion",
            "logged_at": datetime(2026, 1, 1, 13, 15).isoformat(),
            "time_label": "1:15 PM",
            "tags": [],
        }
        payload.update(overrides)
        return payload

    def create_meal(self, **overrides):
        return self.client.post("/api/meals", json=self.meal_payload(**overrides))

    def test_simple_meal_description_returns_structured_tags(self):
        response = self.create_meal()

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["name"], "Chicken biryani and curd")
        self.assertEqual(body["description"], "Medium portion")
        self.assertEqual(
            body["tags"],
            ["protein", "dairy", "grains", "high_carb", "spicy"],
        )

    def test_recognized_meal_returns_a_labeled_nutrition_estimate(self):
        response = self.create_meal(portion_size="medium")

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["estimated_calories"], 650)
        self.assertEqual(body["estimated_protein_g"], 28)
        self.assertEqual(body["estimated_carbs_g"], 75)
        self.assertEqual(body["estimated_fat_g"], 25)
        self.assertEqual(body["estimated_fiber_g"], 5)
        self.assertEqual(body["nutrition_confidence"], "medium")
        self.assertEqual(
            body["nutrition_estimate_note"],
            "Estimated from recognized meal text and portion size.",
        )

    def test_portion_size_changes_a_recognized_estimate_deterministically(self):
        small = self.create_meal(portion_size="small")
        large = self.create_meal(portion_size="large")

        self.assertEqual(small.status_code, 200)
        self.assertEqual(large.status_code, 200)
        self.assertEqual(small.json()["estimated_calories"], 488)
        self.assertEqual(large.json()["estimated_calories"], 812)
        self.assertLess(
            small.json()["estimated_calories"],
            large.json()["estimated_calories"],
        )

    def test_unknown_meal_returns_no_fabricated_nutrition_values(self):
        response = self.create_meal(
            name="Mystery meal",
            description="A homemade dish",
        )

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertIsNone(body["estimated_calories"])
        self.assertIsNone(body["estimated_protein_g"])
        self.assertIsNone(body["estimated_carbs_g"])
        self.assertIsNone(body["estimated_fat_g"])
        self.assertIsNone(body["estimated_fiber_g"])
        self.assertIsNone(body["nutrition_confidence"])
        self.assertIsNone(body["nutrition_estimate_note"])

    def test_nutrition_estimate_values_are_non_negative(self):
        response = self.create_meal()

        self.assertEqual(response.status_code, 200)
        body = response.json()
        for field in (
            "estimated_calories",
            "estimated_protein_g",
            "estimated_carbs_g",
            "estimated_fat_g",
            "estimated_fiber_g",
        ):
            self.assertGreaterEqual(body[field], 0)

    def test_invalid_portion_size_is_rejected(self):
        response = self.create_meal(portion_size="extra_large")

        self.assertEqual(response.status_code, 422)

        null_response = self.create_meal(portion_size=None)
        self.assertEqual(null_response.status_code, 422)

    def test_tag_extraction_is_deterministic(self):
        description = "Chicken biryani and curd"
        expected = ["protein", "dairy", "grains", "high_carb", "spicy"]

        self.assertEqual(extract_heuristic_tags(description), expected)
        self.assertEqual(extract_heuristic_tags(description), expected)

    def test_meal_type_is_inferred_only_when_not_provided(self):
        response = self.create_meal(
            meal_type=None,
            logged_at=datetime(2026, 1, 1, 8, 0).isoformat(),
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["meal_type"], "Breakfast")

    def test_blank_description_is_rejected(self):
        response = self.create_meal(description="   ")

        self.assertEqual(response.status_code, 422)

    def test_meals_are_scoped_to_the_authenticated_user(self):
        created = self.create_meal()
        self.assertEqual(created.status_code, 200)

        self.current_user = self.other_user
        response = self.client.get("/api/meals")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [])

    def test_existing_creation_fields_and_submitted_tags_remain_compatible(self):
        response = self.create_meal(
            name="Vegetable sandwich",
            meal_type="Snack",
            description="Small portion",
            tags=["Favorite", "favorite", ""],
        )

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["meal_type"], "Snack")
        self.assertEqual(body["description"], "Small portion")
        self.assertEqual(
            body["tags"],
            ["favorite", "grains", "vegetables", "high_carb"],
        )
        self.assertEqual(body["portion_size"], "medium")
        self.assertEqual(body["estimated_calories"], 350)


if __name__ == "__main__":
    unittest.main()
