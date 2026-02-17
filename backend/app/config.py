from pathlib import Path

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "LitHelper"
    backend_port: int = 8711
    db_path: Path = Path.home() / ".lithelper" / "lithelper.db"
    openalex_email: str = ""  # Set to your email for polite pool access
    cache_staleness_days: int = 7

    @property
    def database_url(self) -> str:
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        return f"sqlite+aiosqlite:///{self.db_path}"

    model_config = {"env_prefix": "LITHELPER_"}


settings = Settings()
