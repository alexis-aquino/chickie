from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str
    auth_secret: str
    cors_origin: str = "http://localhost:5173"
    access_token_expire_minutes: int = 60 * 24 * 7


settings = Settings()
