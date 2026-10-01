from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "VIBE Wellness API"
    database_url: str = "sqlite:///./vibe.db"
    debug: bool = True
    session_cookie_name: str = "vibe_session"
    session_duration_hours: int = 24 * 7
    # Keep this False locally because browsers do not send Secure cookies over
    # plain HTTP. Set SESSION_COOKIE_SECURE=true in an HTTPS deployment.
    session_cookie_secure: bool = False

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )


settings = Settings()
