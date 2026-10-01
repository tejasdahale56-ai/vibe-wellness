from sqlalchemy import create_engine, event, inspect, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from .config import settings


connect_args = {}

if settings.database_url.startswith("sqlite"):
    connect_args = {
        "check_same_thread": False
    }


engine = create_engine(
    settings.database_url,
    connect_args=connect_args,
)


if settings.database_url.startswith("sqlite"):
    @event.listens_for(engine, "connect")
    def enable_sqlite_foreign_keys(
        dbapi_connection,
        connection_record,
    ):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
)


class Base(DeclarativeBase):
    pass


def ensure_schema_compatibility() -> None:
    """Add nullable columns required by existing hackathon databases.

    ``create_all`` creates new tables but does not alter existing tables.
    Added fields remain nullable so seeded users and wellness records stay
    intact.
    """

    inspector = inspect(engine)
    table_names = set(inspector.get_table_names())

    if "users" in table_names:
        user_columns = {
            column["name"] for column in inspector.get_columns("users")
        }
        if "password_hash" not in user_columns:
            with engine.begin() as connection:
                connection.execute(
                    text("ALTER TABLE users ADD COLUMN password_hash VARCHAR(255)")
                )

    timestamp_type = "DATETIME" if settings.database_url.startswith("sqlite") else "TIMESTAMP"
    for table_name in ("experiments", "patterns"):
        if table_name not in table_names:
            continue
        column_names = {
            column["name"] for column in inspector.get_columns(table_name)
        }
        if "created_at" not in column_names:
            with engine.begin() as connection:
                connection.execute(
                    text(
                        f"ALTER TABLE {table_name} "
                        f"ADD COLUMN created_at {timestamp_type}"
                    )
                )

    if "meals" in table_names:
        meal_columns = {
            column["name"] for column in inspector.get_columns("meals")
        }
        missing_meal_columns = {
            "portion_size": "VARCHAR(10)",
            "estimated_calories": "INTEGER",
            "estimated_protein_g": "INTEGER",
            "estimated_carbs_g": "INTEGER",
            "estimated_fat_g": "INTEGER",
            "estimated_fiber_g": "INTEGER",
            "nutrition_confidence": "VARCHAR(20)",
        }
        with engine.begin() as connection:
            for column_name, column_type in missing_meal_columns.items():
                if column_name not in meal_columns:
                    connection.execute(
                        text(
                            f"ALTER TABLE meals ADD COLUMN "
                            f"{column_name} {column_type}"
                        )
                    )

    if "biometrics" in table_names:
        biometric_columns = inspector.get_columns("biometrics")
        nullable_fields = {
            "sleep_minutes", "steps", "resting_heart_rate_bpm",
            "hrv_milliseconds", "energy_score", "active_minutes",
        }
        required_migration = nullable_fields.intersection(
            column["name"] for column in biometric_columns if not column["nullable"]
        )
        if required_migration and settings.database_url.startswith("sqlite"):
            # SQLite cannot directly drop NOT NULL. Rebuild this one table,
            # preserving every existing row and its indexes.
            raw_connection = engine.raw_connection()
            try:
                cursor = raw_connection.cursor()
                cursor.execute("PRAGMA foreign_keys=OFF")
                cursor.execute(
                    "SELECT sql FROM sqlite_master WHERE type='index' "
                    "AND tbl_name='biometrics' AND sql IS NOT NULL"
                )
                index_sql = [row[0] for row in cursor.fetchall()]
                cursor.execute(
                    "CREATE TABLE biometrics_nullable ("
                    "id INTEGER NOT NULL PRIMARY KEY, user_id INTEGER NOT NULL, "
                    "recorded_at DATETIME NOT NULL, sleep_minutes INTEGER, "
                    "steps INTEGER, resting_heart_rate_bpm INTEGER, "
                    "hrv_milliseconds INTEGER, energy_score FLOAT, "
                    "active_minutes INTEGER, "
                    "FOREIGN KEY(user_id) REFERENCES users(id))"
                )
                cursor.execute(
                    "INSERT INTO biometrics_nullable "
                    "SELECT id, user_id, recorded_at, sleep_minutes, steps, "
                    "resting_heart_rate_bpm, hrv_milliseconds, energy_score, "
                    "active_minutes FROM biometrics"
                )
                cursor.execute("DROP TABLE biometrics")
                cursor.execute("ALTER TABLE biometrics_nullable RENAME TO biometrics")
                for statement in index_sql:
                    cursor.execute(statement)
                raw_connection.commit()
                cursor.execute("PRAGMA foreign_keys=ON")
            except Exception:
                raw_connection.rollback()
                raise
            finally:
                raw_connection.close()
        elif required_migration:
            with engine.begin() as connection:
                for field in sorted(required_migration):
                    connection.execute(text(f"ALTER TABLE biometrics ALTER COLUMN {field} DROP NOT NULL"))


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()
