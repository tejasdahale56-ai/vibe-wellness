from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "VIBE Wellness API"
    database_url: str = "sqlite:///./vibe.db"
    debug: bool = True
    firebase_project_id: str | None = None
    firebase_credentials_path: str | None = None

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )


settings = Settings()
