import requests
from app.config import Settings


class OllamaClient:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.session = requests.Session()

    def generate(self, prompt: str) -> str:
        payload = {
            "model": self.settings.ollama_model,
            "prompt": prompt,
            "temperature": self.settings.ollama_temperature,
            "stream": False,
        }

        response = self.session.post(
            self.settings.ollama_endpoint,
            json=payload,
            timeout=self.settings.request_timeout_seconds,
        )
        response.raise_for_status()
        body = response.json()
        return str(body.get("response", "")).strip()
