from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    supabase_url: str
    supabase_key: str           # anon key (used by frontend)
    supabase_jwt_secret: str    # Project Settings → API → JWT Secret
    database_url: str           # postgresql+asyncpg://...
    secret_key: str = "change-me-in-production"
    debug: bool = False

    class Config:
        env_file = ".env"


settings = Settings()
