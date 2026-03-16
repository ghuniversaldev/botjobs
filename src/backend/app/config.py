from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    supabase_url: str
    supabase_key: str
    database_url: str  # postgresql+asyncpg://...
    secret_key: str = "change-me-in-production"
    debug: bool = False

    class Config:
        env_file = ".env"


settings = Settings()
