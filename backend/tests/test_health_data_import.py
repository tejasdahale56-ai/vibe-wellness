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
from app.health_import import HealthDataParseError, parse_health_csv
from app.main import app
from app.models import Biometric, User


class HealthDataImportTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
        Base.metadata.create_all(bind=self.engine)
        self.db = sessionmaker(bind=self.engine)()
        self.user = User(name="Import User", email="import@example.test")
        self.other = User(name="Other User", email="other-import@example.test")
        self.db.add_all([self.user, self.other])
        self.db.commit()
        self.db.refresh(self.user)
        self.db.refresh(self.other)
        app.dependency_overrides[get_db] = lambda: self.db
        app.dependency_overrides[get_current_user] = lambda: self.user
        self.client = TestClient(app)

    def tearDown(self):
        app.dependency_overrides.clear()
        self.client.close()
        self.db.close()
        Base.metadata.drop_all(bind=self.engine)
        self.engine.dispose()

    def test_fitbit_daily_activity_parses_without_inventing_energy(self):
        parsed = parse_health_csv(b"ActivityDate,Steps,Minutes Asleep\n2026-09-30,8000,420\n")
        self.assertEqual(len(parsed.days), 1)
        self.assertEqual(parsed.days[0].steps, 8000)
        self.assertEqual(parsed.days[0].sleep_minutes, 420)
        self.assertIsNone(parsed.days[0].energy_score)

    def test_invalid_metric_rejects_the_csv(self):
        with self.assertRaises(HealthDataParseError):
            parse_health_csv(b"Date,Steps\n2026-09-30,not-a-number\n")

    def test_out_of_range_metric_rejects_the_csv(self):
        with self.assertRaises(HealthDataParseError):
            parse_health_csv(b"Date,Steps\n2026-09-30,999999999999999999999999999999999999999\n")

    def test_rows_without_measurements_do_not_create_empty_biometric_days(self):
        with self.assertRaises(HealthDataParseError):
            parse_health_csv(b"Date,Steps\n2026-09-30,\n")

    def test_import_is_user_scoped_and_skips_exact_duplicates(self):
        csv_data = b"Date,Steps\n2026-09-30,8000\n"
        first = self.client.post("/api/health-data/import", files={"file": ("fitbit.csv", csv_data, "text/csv")})
        second = self.client.post("/api/health-data/import", files={"file": ("fitbit.csv", csv_data, "text/csv")})
        self.assertEqual(first.status_code, 200, first.text)
        self.assertEqual(first.json()["days_imported"], 1)
        self.assertEqual(second.status_code, 200, second.text)
        self.assertEqual(second.json()["days_skipped_as_duplicates"], 1)
        record = self.db.query(Biometric).one()
        self.assertEqual(record.user_id, self.user.id)
        self.assertEqual(record.recorded_at, datetime(2026, 9, 30))
        self.assertIsNone(record.energy_score)

    def test_import_fills_missing_values_without_overwriting_existing_values(self):
        self.db.add(Biometric(user_id=self.user.id, recorded_at=datetime(2026, 9, 30), steps=123, energy_score=7.0))
        self.db.commit()
        response = self.client.post(
            "/api/health-data/import",
            files={"file": ("fitbit.csv", b"Date,Steps,Minutes Asleep\n2026-09-30,8000,420\n", "text/csv")},
        )
        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(response.json()["days_imported"], 1)
        record = self.db.query(Biometric).one()
        self.assertEqual(record.steps, 123)
        self.assertEqual(record.sleep_minutes, 420)
        self.assertEqual(record.energy_score, 7.0)

    def test_today_status_only_sees_current_users_records(self):
        self.db.add(Biometric(user_id=self.other.id, recorded_at=datetime(2026, 9, 30), steps=10))
        self.db.commit()
        result = self.client.get("/api/health-data/today", params={"local_date": "2026-09-30"})
        self.assertEqual(result.status_code, 200)
        self.assertFalse(result.json()["has_data"])

    def test_dashboard_renders_partial_imports_without_treating_missing_values_as_zero(self):
        response = self.client.post(
            "/api/health-data/import",
            files={"file": ("fitbit.csv", b"Date,Steps\n2026-09-30,8000\n", "text/csv")},
        )
        self.assertEqual(response.status_code, 200, response.text)
        dashboard = self.client.get("/api/dashboard")
        self.assertEqual(dashboard.status_code, 200, dashboard.text)
        self.assertIsNone(dashboard.json()["biometrics"]["energy_score"])
        self.assertEqual(dashboard.json()["biometrics"]["steps"], 8000)
        self.assertEqual(dashboard.json()["metrics"][0]["value"], "—")

    def test_non_csv_upload_is_rejected(self):
        response = self.client.post("/api/health-data/import", files={"file": ("data.txt", b"hello", "text/plain")})
        self.assertEqual(response.status_code, 415)

    def test_import_requires_a_cookie_session(self):
        app.dependency_overrides.pop(get_current_user)
        try:
            response = self.client.post(
                "/api/health-data/import",
                files={"file": ("fitbit.csv", b"Date,Steps\n2026-09-30,8000\n", "text/csv")},
            )
        finally:
            app.dependency_overrides[get_current_user] = lambda: self.user
        self.assertEqual(response.status_code, 401)


if __name__ == "__main__":
    unittest.main()
