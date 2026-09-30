from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "VIBE Wellness API"
    database_url: str = "sqlite:///./vibe.db"
    debug: bool = True
    development_current_user_id: int = 1

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )


settings = Settings()
