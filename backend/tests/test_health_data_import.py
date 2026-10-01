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

    def test_import_is_owned_scoped_and_skips_duplicate_days(self):
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

    def test_today_status_uses_only_the_current_users_records(self):
        self.db.add(Biometric(user_id=self.other.id, recorded_at=datetime(2026, 9, 30), steps=10))
        self.db.commit()
        result = self.client.get("/api/health-data/today", params={"local_date": "2026-09-30"})
        self.assertEqual(result.status_code, 200)
        self.assertFalse(result.json()["has_data"])


if __name__ == "__main__":
    unittest.main()
