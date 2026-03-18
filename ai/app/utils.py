import json
import math
import re
from typing import Any, Iterable, Optional


EARTH_RADIUS_KM = 6371.0


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    lat1_rad = math.radians(lat1)
    lng1_rad = math.radians(lng1)
    lat2_rad = math.radians(lat2)
    lng2_rad = math.radians(lng2)

    delta_lat = lat2_rad - lat1_rad
    delta_lng = lng2_rad - lng1_rad

    a = (
        math.sin(delta_lat / 2) ** 2
        + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lng / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(EARTH_RADIUS_KM * c, 2)


def normalize_text(value: str) -> str:
    return re.sub(r"\s+", " ", value.lower()).strip()


def contains_any(value: str, candidates: Iterable[str]) -> bool:
    normalized = normalize_text(value)
    return any(candidate in normalized for candidate in candidates)


def safe_json_loads(raw_text: str) -> Optional[dict[str, Any]]:
    if not raw_text:
        return None

    try:
        loaded = json.loads(raw_text)
        return loaded if isinstance(loaded, dict) else None
    except json.JSONDecodeError:
        pass

    match = re.search(r"\{.*\}", raw_text, re.DOTALL)
    if not match:
        return None

    try:
        loaded = json.loads(match.group(0))
        return loaded if isinstance(loaded, dict) else None
    except json.JSONDecodeError:
        return None


def infer_severity(text: str) -> str:
    critical_terms = (
        "unconscious", "not breathing", "cardiac arrest", "severe bleeding",
        "stroke", "seizure", "chest pain", "crash", "critical", "collapse"
    )
    moderate_terms = (
        "fracture", "shortness of breath", "high fever", "burn", "pregnant",
        "labor", "trauma", "vomiting", "dehydration", "infection"
    )

    normalized = normalize_text(text)
    if contains_any(normalized, critical_terms):
        return "critical"
    if contains_any(normalized, moderate_terms):
        return "moderate"
    return "low"


def infer_specialization(text: str) -> tuple[str, list[str]]:
    normalized = normalize_text(text)
    mapping = [
        (("cardiac", "heart", "chest pain"), ("cardiology", ["cardiology", "icu", "emergency"])),
        (("stroke", "brain", "seizure", "neurology"), ("neurology", ["neurology", "icu", "emergency"])),
        (("fracture", "bone", "orthopedic", "trauma"), ("orthopedics", ["orthopedics", "trauma", "emergency"])),
        (("pregnant", "labor", "delivery", "gyne"), ("gynecology", ["gynecology", "emergency"])),
        (("breathing", "asthma", "lung", "oxygen"), ("pulmonology", ["pulmonology", "icu", "emergency"])),
        (("child", "infant", "pediatric"), ("pediatrics", ["pediatrics", "emergency"])),
    ]

    for keywords, result in mapping:
        if contains_any(normalized, keywords):
            return result

    return "general medicine", ["general", "emergency"]


def clean_capabilities(capabilities: Iterable[str]) -> list[str]:
    return sorted({normalize_text(capability) for capability in capabilities if capability})
