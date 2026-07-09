from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str
    # Legacy shared secret (HS256 projects). Optional when the project uses
    # asymmetric signing keys — those are fetched from supabase_url's JWKS.
    supabase_jwt_secret: str = ""
    supabase_url: str = ""
    cors_origin: str = "http://localhost:5173"


settings = Settings()
