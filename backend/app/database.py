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


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()
