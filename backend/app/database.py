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


def ensure_firebase_uid_schema():
    """Add the Firebase identity column to databases created before auth."""
    inspector = inspect(engine)
    if "users" not in inspector.get_table_names():
        return

    if "firebase_uid" not in {
        column["name"] for column in inspector.get_columns("users")
    }:
        with engine.begin() as connection:
            connection.execute(text("ALTER TABLE users ADD COLUMN firebase_uid VARCHAR(128)"))

    with engine.begin() as connection:
        connection.execute(
            text(
                "CREATE UNIQUE INDEX IF NOT EXISTS "
                "ix_users_firebase_uid ON users (firebase_uid)"
            )
        )


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()
