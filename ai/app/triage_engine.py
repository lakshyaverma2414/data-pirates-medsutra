from __future__ import annotations

from app.models import TriageAnalysis, TriageRequest
from app.ollama_client import OllamaClient
from app.utils import clean_capabilities, infer_severity, infer_specialization, safe_json_loads


class TriageEngine:
    def __init__(self, ollama_client: OllamaClient) -> None:
        self.ollama_client = ollama_client

    def analyze_request(self, request: TriageRequest) -> TriageAnalysis:
        prompt = self._build_prompt(request)

        try:
            raw_response = self.ollama_client.generate(prompt)
            parsed = safe_json_loads(raw_response)
            if parsed:
                return self._normalize_analysis(parsed, request)
        except Exception:
            pass

        return self._fallback_analysis(request)

    def _build_prompt(self, request: TriageRequest) -> str:
        return f"""
Analyze the following emergency description and classify severity and required hospital type.

Return JSON only with this exact shape:
{{
  "severity": "low|moderate|critical",
  "specialization": "cardiology|neurology|orthopedics|gynecology|pulmonology|pediatrics|general medicine",
  "required_capabilities": ["emergency", "icu"],
  "summary": "short clinical reasoning"
}}

Emergency type: {request.emergencyType}
Description: {request.description}
Patient age: {request.patientAge}
Location coordinates: {request.userLat}, {request.userLng}
""".strip()

    def _normalize_analysis(self, payload: dict, request: TriageRequest) -> TriageAnalysis:
        fallback_specialization, fallback_capabilities = infer_specialization(
            f"{request.emergencyType} {request.description}"
        )
        severity = str(payload.get("severity") or infer_severity(f"{request.emergencyType} {request.description}")).lower()
        if severity not in {"low", "moderate", "critical"}:
            severity = infer_severity(f"{request.emergencyType} {request.description}")

        specialization = str(payload.get("specialization") or fallback_specialization).lower()
        capabilities = payload.get("required_capabilities") or fallback_capabilities
        if not isinstance(capabilities, list):
            capabilities = fallback_capabilities

        normalized_capabilities = clean_capabilities(capabilities)
        if severity == "critical" and "icu" not in normalized_capabilities:
            normalized_capabilities.append("icu")
        if "emergency" not in normalized_capabilities:
            normalized_capabilities.append("emergency")

        return TriageAnalysis(
            severity=severity,
            specialization=specialization,
            required_capabilities=normalized_capabilities,
            summary=str(payload.get("summary") or "LLM analysis unavailable; used normalized fallback output."),
        )

    def _fallback_analysis(self, request: TriageRequest) -> TriageAnalysis:
        combined = f"{request.emergencyType} {request.description}"
        severity = infer_severity(combined)
        specialization, capabilities = infer_specialization(combined)
        if severity == "critical" and "icu" not in capabilities:
            capabilities.append("icu")
        if "emergency" not in capabilities:
            capabilities.append("emergency")

        return TriageAnalysis(
            severity=severity,
            specialization=specialization,
            required_capabilities=clean_capabilities(capabilities),
            summary="Used rule-based fallback because Ollama output was unavailable or not valid JSON.",
        )
