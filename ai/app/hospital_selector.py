from __future__ import annotations

from collections import defaultdict
from typing import Iterable
import psycopg2
from psycopg2.extras import RealDictCursor
from app.config import Settings
from app.models import (
    HospitalCandidate,
    HospitalRecommendation,
    TriageAnalysis,
    TriageRequest,
    TriageResponse,
)
from app.utils import clean_capabilities, haversine_km, normalize_text


SPECIALIZATION_RESOURCE_MAP = {
    "cardiology": ("icu", "ventilator"),
    "neurology": ("icu", "ventilator"),
    "orthopedics": ("general bed", "ambulance"),
    "gynecology": ("general bed", "emergency"),
    "pulmonology": ("oxygen cylinder", "ventilator", "icu"),
    "pediatrics": ("general bed", "emergency"),
    "general medicine": ("general bed", "emergency"),
}


class HospitalSelector:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    def select_best_hospital(self, request: TriageRequest, analysis: TriageAnalysis) -> TriageResponse:
        hospitals = self._load_hospital_candidates()
        if not hospitals:
            raise ValueError("No hospitals found in PostgreSQL.")

        if analysis.severity == "critical":
            stabilization_hospital = self._select_stabilization_hospital(request, hospitals)
            transfer_hospital = self._select_transfer_hospital(
                request,
                analysis,
                hospitals,
                exclude_hospital_id=stabilization_hospital.id,
            )

            if transfer_hospital is None:
                transfer_hospital = stabilization_hospital

            return TriageResponse(
                severity=analysis.severity,
                specialization=analysis.specialization,
                stabilizationHospital=self._to_recommendation(stabilization_hospital),
                transferHospital=self._to_recommendation(transfer_hospital),
            )

        recommended_hospital = self._select_best_match(request, analysis, hospitals)
        return TriageResponse(
            severity=analysis.severity,
            specialization=analysis.specialization,
            recommendedHospital=self._to_recommendation(recommended_hospital),
        )

    def _load_hospital_candidates(self) -> list[HospitalCandidate]:
        base_rows = self._fetch_hospital_base_rows()
        specialties_by_hospital = self._fetch_doctor_specialties()

        hospitals: list[HospitalCandidate] = []
        for row in base_rows:
            resources = {
                "icu": float(row["icu_units"]),
                "ventilator": float(row["ventilator_units"]),
                "ambulance": float(row["ambulance_units"]),
                "general bed": float(row["general_bed_units"]),
                "oxygen cylinder": float(row["oxygen_units"]),
                "blood units": float(row["blood_units"]),
                "active emergencies": float(row["active_emergencies"]),
                "pending transfers": float(row["pending_transfers"]),
            }

            capabilities = clean_capabilities(
                self._derive_capabilities(
                    row["name"],
                    resources,
                    specialties_by_hospital.get(row["id"], []),
                )
            )

            hospitals.append(
                HospitalCandidate(
                    id=int(row["id"]),
                    name=row["name"],
                    phone=row["phone"],
                    email=row["email"],
                    address=row["address"],
                    lat=float(row["lat"]),
                    lng=float(row["lng"]),
                    capabilities=capabilities,
                    resources=resources,
                )
            )

        return hospitals

    def _fetch_hospital_base_rows(self) -> list[dict]:
        query = """
            SELECT
                h.id,
                h.name,
                h.phone,
                h.email,
                h.address,
                h.lat,
                h.lng,
                COALESCE(SUM(CASE WHEN r.name::text = 'ICU Bed' THEN r.units ELSE 0 END), 0) AS icu_units,
                COALESCE(SUM(CASE WHEN r.name::text = 'Ventilator' THEN r.units ELSE 0 END), 0) AS ventilator_units,
                COALESCE(SUM(CASE WHEN r.name::text = 'Ambulance' THEN r.units ELSE 0 END), 0) AS ambulance_units,
                COALESCE(SUM(CASE WHEN r.name::text = 'General Bed' THEN r.units ELSE 0 END), 0) AS general_bed_units,
                COALESCE(SUM(CASE WHEN r.name::text = 'Oxygen Cylinder' THEN r.units ELSE 0 END), 0) AS oxygen_units,
                COALESCE(SUM(bs.units), 0) AS blood_units,
                COUNT(DISTINCT fe.id) FILTER (WHERE fe.status::text = 'PENDING') AS active_emergencies,
                COUNT(DISTINCT ft.id) FILTER (WHERE ft.status::text = 'PENDING') AS pending_transfers
            FROM "Hospital" h
            LEFT JOIN "Resource" r ON h.id = r."hospitalId"
            LEFT JOIN "BloodStock" bs ON h.id = bs."hospitalId"
            LEFT JOIN "FeatureEmergency" fe ON h.id = fe."createdById"
            LEFT JOIN "FeatureTransfer" ft ON h.id = ft."fromHospitalId"
            GROUP BY h.id, h.name, h.phone, h.email, h.address, h.lat, h.lng
            ORDER BY h.name
        """

        with self._connect() as connection:
            with connection.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute(query)
                return list(cursor.fetchall())

    def _fetch_doctor_specialties(self) -> dict[int, list[str]]:
        query = """
            SELECT
                "hospitalId" AS hospital_id,
                specialization
            FROM "Doctor"
        """

        try:
            with self._connect() as connection:
                with connection.cursor(cursor_factory=RealDictCursor) as cursor:
                    cursor.execute(query)
                    specialties_by_hospital: dict[int, list[str]] = defaultdict(list)
                    for row in cursor.fetchall():
                        values = row["specialization"] or []
                        for value in values:
                            specialties_by_hospital[int(row["hospital_id"])].append(str(value))
                    return specialties_by_hospital
        except psycopg2.Error:
            return {}

    def _derive_capabilities(
        self,
        hospital_name: str,
        resources: dict[str, float],
        doctor_specialties: Iterable[str],
    ) -> list[str]:
        capabilities = ["general medicine", "emergency"]
        capabilities.extend(doctor_specialties)

        if resources.get("icu", 0) > 0:
            capabilities.append("icu")
        if resources.get("ventilator", 0) > 0:
            capabilities.append("critical care")
        if resources.get("ambulance", 0) > 0:
            capabilities.append("ambulance")
        if resources.get("oxygen cylinder", 0) > 0:
            capabilities.append("pulmonology")

        normalized_name = normalize_text(hospital_name)
        if any(token in normalized_name for token in ("apollo", "medanta", "care", "bombay")):
            capabilities.extend(["cardiology", "neurology"])
        if any(token in normalized_name for token in ("government", "myh", "trauma")):
            capabilities.append("trauma")
        if any(token in normalized_name for token in ("choithram", "shalby", "index")):
            capabilities.append("orthopedics")

        return capabilities

    def _select_stabilization_hospital(
        self,
        request: TriageRequest,
        hospitals: list[HospitalCandidate],
    ) -> HospitalCandidate:
        capable = [
            hospital for hospital in hospitals
            if hospital.resources.get("icu", 0) > 0
            or hospital.resources.get("ventilator", 0) > 0
            or hospital.resources.get("ambulance", 0) > 0
        ]
        candidates = capable or hospitals

        return min(
            candidates,
            key=lambda hospital: (
                haversine_km(request.userLat, request.userLng, hospital.lat, hospital.lng),
                -self._stabilization_capacity(hospital),
            ),
        )

    def _select_transfer_hospital(
        self,
        request: TriageRequest,
        analysis: TriageAnalysis,
        hospitals: list[HospitalCandidate],
        exclude_hospital_id: int | None,
    ) -> HospitalCandidate | None:
        candidates = [hospital for hospital in hospitals if hospital.id != exclude_hospital_id]
        if not candidates:
            return None

        return max(
            candidates,
            key=lambda hospital: (
                self._specialization_score(hospital, analysis),
                self._resource_match_score(hospital, analysis),
                -haversine_km(request.userLat, request.userLng, hospital.lat, hospital.lng),
            ),
        )

    def _select_best_match(
        self,
        request: TriageRequest,
        analysis: TriageAnalysis,
        hospitals: list[HospitalCandidate],
    ) -> HospitalCandidate:
        return max(
            hospitals,
            key=lambda hospital: (
                self._specialization_score(hospital, analysis),
                self._resource_match_score(hospital, analysis),
                -haversine_km(request.userLat, request.userLng, hospital.lat, hospital.lng),
            ),
        )

    def _specialization_score(self, hospital: HospitalCandidate, analysis: TriageAnalysis) -> float:
        capabilities = set(clean_capabilities(hospital.capabilities))
        score = 0.0

        if analysis.specialization in capabilities:
            score += 5.0

        required_capabilities = set(clean_capabilities(analysis.required_capabilities))
        score += float(len(capabilities.intersection(required_capabilities))) * 2.0

        if analysis.severity == "critical" and "icu" in capabilities:
            score += 2.0
        if "emergency" in capabilities:
            score += 1.0

        return score

    def _resource_match_score(self, hospital: HospitalCandidate, analysis: TriageAnalysis) -> float:
        resource_names = SPECIALIZATION_RESOURCE_MAP.get(
            analysis.specialization,
            ("general bed", "ambulance"),
        )
        score = sum(hospital.resources.get(resource_name, 0.0) for resource_name in resource_names)

        if analysis.severity == "critical":
            score += hospital.resources.get("icu", 0.0) * 1.5
            score += hospital.resources.get("ventilator", 0.0) * 1.2

        return score

    def _stabilization_capacity(self, hospital: HospitalCandidate) -> float:
        return (
            (hospital.resources.get("icu", 0.0) * 2.0)
            + (hospital.resources.get("ventilator", 0.0) * 1.5)
            + hospital.resources.get("ambulance", 0.0)
        )

    def _to_recommendation(self, hospital: HospitalCandidate) -> HospitalRecommendation:
        return HospitalRecommendation(
            name=hospital.name,
            phone=hospital.phone,
            email=hospital.email,
            address=hospital.address,
            lat=hospital.lat,
            lng=hospital.lng,
        )

    def _connect(self):
        return psycopg2.connect(**self.settings.database_connection_kwargs())
