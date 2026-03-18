import os
from dataclasses import dataclass
from urllib.parse import urlparse
from dotenv import load_dotenv

load_dotenv()


@dataclass(frozen=True)
class Settings:
    service_name: str = os.getenv("SERVICE_NAME", "ai-triage-service")
    ollama_endpoint: str = os.getenv("OLLAMA_ENDPOINT", "http://localhost:11434/api/generate")
    ollama_model: str = os.getenv("OLLAMA_MODEL", "llama3.2")
    ollama_temperature: float = float(os.getenv("OLLAMA_TEMPERATURE", "0.2"))
    database_url: str = os.getenv("DATABASE_URL", "postgresql://localhost:5432/admin")
    db_user: str = os.getenv("DB_USER", "admin")
    db_password: str = os.getenv("DB_PASSWORD", "admin123")
    request_timeout_seconds: float = float(os.getenv("REQUEST_TIMEOUT_SECONDS", "8"))
    max_candidate_distance_km: float = float(os.getenv("MAX_CANDIDATE_DISTANCE_KM", "150"))

    def database_connection_kwargs(self) -> dict:
        normalized_url = self.database_url[5:] if self.database_url.startswith("jdbc:") else self.database_url
        parsed = urlparse(normalized_url)

        return {
            "host": parsed.hostname or "localhost",
            "port": parsed.port or 5432,
            "dbname": (parsed.path or "/medlink").lstrip("/"),
            "user": parsed.username or self.db_user,
            "password": parsed.password or self.db_password,
        }


settings = Settings()
