import sys
import unittest
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.auth import hash_password
from app.database import Base, get_db
from app.main import app
from app.models import Meal, User


class AuthenticationApiTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine(
            "sqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        Base.metadata.create_all(bind=self.engine)
        self.db = sessionmaker(bind=self.engine)()
        app.dependency_overrides[get_db] = lambda: self.db
        self.client = TestClient(app)

    def tearDown(self):
        app.dependency_overrides.clear()
        self.client.close()
        self.db.close()
        Base.metadata.drop_all(bind=self.engine)
        self.engine.dispose()

    @staticmethod
    def signup_payload(**overrides):
        payload = {
            "name": "Alex Example",
            "email": "alex@example.test",
            "password": "secure-passphrase",
        }
        payload.update(overrides)
        return payload

    def signup(self, **overrides):
        return self.client.post("/api/auth/signup", json=self.signup_payload(**overrides))

    def login(self, **overrides):
        payload = self.signup_payload(**overrides)
        return self.client.post(
            "/api/auth/login",
            json={"email": payload["email"], "password": payload["password"]},
        )

    def test_signup_success_hashes_password_and_does_not_return_it(self):
        response = self.signup()

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json(), {
            "id": response.json()["id"],
            "name": "Alex Example",
            "email": "alex@example.test",
        })
        user = self.db.query(User).filter(User.email == "alex@example.test").one()
        self.assertNotEqual(user.password_hash, "secure-passphrase")
        self.assertTrue(user.password_hash.startswith("$2"))

    def test_duplicate_email_returns_conflict(self):
        self.assertEqual(self.signup().status_code, 201)
        self.assertEqual(self.signup().status_code, 409)

    def test_invalid_password_returns_validation_error(self):
        response = self.signup(password="short")
        self.assertEqual(response.status_code, 422)

    def test_login_sets_http_only_cookie_and_returns_safe_user(self):
        self.signup()
        response = self.login()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["email"], "alex@example.test")
        self.assertNotIn("password", response.json())
        cookie = response.headers["set-cookie"].lower()
        self.assertIn("vibe_session=", cookie)
        self.assertIn("httponly", cookie)

    def test_wrong_password_returns_unauthorized(self):
        self.signup()
        response = self.login(password="wrong-passphrase")
        self.assertEqual(response.status_code, 401)

    def test_me_requires_authentication(self):
        response = self.client.get("/api/auth/me")
        self.assertEqual(response.status_code, 401)

    def test_me_returns_authenticated_user(self):
        self.signup()
        self.login()
        response = self.client.get("/api/auth/me")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["name"], "Alex Example")
        self.assertNotIn("password_hash", response.json())

    def test_logout_invalidates_session_and_clears_cookie(self):
        self.signup()
        self.login()
        response = self.client.post("/api/auth/logout")

        self.assertEqual(response.status_code, 204)
        self.assertIn("max-age=0", response.headers["set-cookie"].lower())
        self.assertEqual(self.client.get("/api/auth/me").status_code, 401)

    def test_protected_endpoint_requires_authentication(self):
        response = self.client.get("/api/meals")
        self.assertEqual(response.status_code, 401)

    def test_authenticated_requests_are_scoped_to_the_session_user(self):
        self.signup()
        alex = self.db.query(User).filter(User.email == "alex@example.test").one()
        other = User(
            name="Other User",
            email="other@example.test",
            password_hash=hash_password("another-secure-passphrase"),
        )
        self.db.add(other)
        self.db.flush()
        self.db.add_all([
            Meal(
                user_id=alex.id,
                name="Alex meal",
                description="Visible only to Alex",
                logged_at=datetime(2026, 1, 1, 12),
                time_label="12:00 PM",
                tags=[],
            ),
            Meal(
                user_id=other.id,
                name="Other meal",
                description="Must remain isolated",
                logged_at=datetime(2026, 1, 1, 12),
                time_label="12:00 PM",
                tags=[],
            ),
        ])
        self.db.commit()

        self.login()
        response = self.client.get("/api/meals")

        self.assertEqual(response.status_code, 200)
        self.assertEqual([meal["name"] for meal in response.json()], ["Alex meal"])


if __name__ == "__main__":
    unittest.main()
