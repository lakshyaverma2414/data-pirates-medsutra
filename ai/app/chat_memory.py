from collections import deque


class ChatMemoryService:
    def __init__(self, max_history: int = 10) -> None:
        self.max_history = max_history
        self._conversation_history: dict[str, deque[str]] = {}

    def add_message(self, hospital_id: str, role: str, message: str) -> None:
        history = self._conversation_history.setdefault(
            hospital_id,
            deque(maxlen=self.max_history),
        )
        history.append(f"{role}: {message}")

    def get_conversation_context(self, hospital_id: str) -> str:
        history = self._conversation_history.get(hospital_id)
        if not history:
            return ""
        return "\n".join(history)

    def clear_history(self, hospital_id: str) -> None:
        self._conversation_history.pop(hospital_id, None)

    def get_conversation_count(self, hospital_id: str) -> int:
        history = self._conversation_history.get(hospital_id)
        return len(history) if history else 0
