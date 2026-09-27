from datetime import datetime, timedelta

from .database import Base, SessionLocal, engine
from .models import Biometric, Experiment, Meal, Pattern, User


def seed_database():
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        # Prevent duplicate demo data.
        existing_user = (
            db.query(User)
            .filter(User.email == "demo@vibe.app")
            .first()
        )

        if existing_user:
            print("Demo data already exists.")
            return

        # -------------------------
        # Demo user
        # -------------------------

        user = User(
            name="Demo User",
            email="demo@vibe.app",
        )

        db.add(user)
        db.flush()

        # -------------------------
        # Demo biometric history
        # -------------------------

        today = datetime(2026, 10, 14, 9, 0)

        biometric_data = [
            {
                "sleep_minutes": 462,
                "steps": 8240,
                "resting_heart_rate_bpm": 67,
                "hrv_milliseconds": 31,
                "energy_score": 6.4,
                "active_minutes": 41,
            },
            {
                "sleep_minutes": 435,
                "steps": 6100,
                "resting_heart_rate_bpm": 69,
                "hrv_milliseconds": 28,
                "energy_score": 5.6,
                "active_minutes": 28,
            },
            {
                "sleep_minutes": 390,
                "steps": 5200,
                "resting_heart_rate_bpm": 71,
                "hrv_milliseconds": 25,
                "energy_score": 5.2,
                "active_minutes": 22,
            },
            {
                "sleep_minutes": 480,
                "steps": 9100,
                "resting_heart_rate_bpm": 65,
                "hrv_milliseconds": 34,
                "energy_score": 7.1,
                "active_minutes": 48,
            },
            {
                "sleep_minutes": 450,
                "steps": 7600,
                "resting_heart_rate_bpm": 66,
                "hrv_milliseconds": 32,
                "energy_score": 6.6,
                "active_minutes": 39,
            },
            {
                "sleep_minutes": 405,
                "steps": 5800,
                "resting_heart_rate_bpm": 70,
                "hrv_milliseconds": 27,
                "energy_score": 5.4,
                "active_minutes": 25,
            },
            {
                "sleep_minutes": 470,
                "steps": 8400,
                "resting_heart_rate_bpm": 66,
                "hrv_milliseconds": 33,
                "energy_score": 6.8,
                "active_minutes": 44,
            },
        ]

        for index, data in enumerate(biometric_data):
            record = Biometric(
                user_id=user.id,
                recorded_at=(
                    today
                    - timedelta(
                        days=len(biometric_data) - 1 - index
                    )
                ),
                **data,
            )

            db.add(record)

        # -------------------------
        # Demo meal
        # -------------------------

        meal = Meal(
            user_id=user.id,
            name="Chicken Biryani",
            meal_type="Lunch",
            description="Medium portion",
            logged_at=datetime(2026, 10, 14, 13, 15),
            time_label="1:15 PM",
            tags=[
                "rice",
                "chicken",
                "lunch",
            ],
        )

        db.add(meal)

        # -------------------------
        # Demo experiment
        # -------------------------

        experiment = Experiment(
            user_id=user.id,
            title="10-minute post-lunch walk",
            description="Take a short walk after lunch.",
            why=(
                "Test whether light movement is associated "
                "with better afternoon energy."
            ),
            context=(
                "Initial personal experiment based on "
                "recent comparable days."
            ),
            duration_days=1,
            progress_percent=100,
            status="completed",
            status_label="Completed",
            self_reported_energy=7.0,
            energy_after=7.1,
            baseline_energy=5.8,
            reflection=(
                "Felt slightly more alert after the walk."
            ),
            completed_at=datetime(2026, 10, 14, 15, 0),
            pattern_saved=True,
        )

        db.add(experiment)

        # -------------------------
        # Demo patterns
        # -------------------------

        patterns = [
            Pattern(
                user_id=user.id,
                title="Sleep & afternoon energy",
                description=(
                    "Short-sleep days coincided with "
                    "lower afternoon energy."
                ),
                category="sleep",
                observation_count=6,
                supporting_detail=(
                    "Observed across recent comparable days."
                ),
            ),
            Pattern(
                user_id=user.id,
                title="Post-lunch movement",
                description=(
                    "Post-lunch movement appeared on "
                    "several higher-energy days."
                ),
                category="movement",
                observation_count=3,
                supporting_detail=(
                    "Observed on several days with "
                    "higher reported energy."
                ),
            ),
            Pattern(
                user_id=user.id,
                title="Meals & afternoon energy",
                description=(
                    "Heavier lunches combined with lower "
                    "activity were associated with lower "
                    "afternoon energy."
                ),
                category="meals",
                observation_count=4,
                supporting_detail=(
                    "Association does not establish that "
                    "the meal or activity caused the change."
                ),
            ),
        ]

        db.add_all(patterns)

        # -------------------------
        # Save everything
        # -------------------------

        db.commit()

        print("Demo data created successfully.")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    seed_database()