from __future__ import annotations

from typing import Any
import psycopg2
from psycopg2.extras import RealDictCursor
from app.chat_memory import ChatMemoryService
from app.config import Settings
from app.models import ChatContextDTO


class AIContextLoader:
    BLOOD_GROUPS = ("A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-")
    BLOOD_GROUP_ALIASES = {
        "A+": "A+",
        "A_PLUS": "A+",
        "A-": "A-",
        "A_MINUS": "A-",
        "B+": "B+",
        "B_PLUS": "B+",
        "B-": "B-",
        "B_MINUS": "B-",
        "AB+": "AB+",
        "AB_PLUS": "AB+",
        "AB-": "AB-",
        "AB_MINUS": "AB-",
        "O+": "O+",
        "O_PLUS": "O+",
        "O-": "O-",
        "O_MINUS": "O-",
    }
    RESOURCE_NAME_ALIASES = {
        "icu": "icu bed",
        "icu bed": "icu bed",
        "icu_bed": "icu bed",
        "general bed": "general bed",
        "general_bed": "general bed",
        "ventilator": "ventilator",
        "oxygen cylinder": "oxygen cylinder",
        "oxygen_cylinder": "oxygen cylinder",
        "ambulance": "ambulance",
    }

    def __init__(self, settings: Settings, chat_memory_service: ChatMemoryService) -> None:
        self.settings = settings
        self.chat_memory_service = chat_memory_service

    def load_hospital_network_data(self) -> str:
        query = """
            SELECT
                h.id,
                h.name,
                h.phone,
                h.email,
                h.address,
                COUNT(DISTINCT r.id) AS total_resources,
                COUNT(DISTINCT bs.id) AS total_blood_stocks,
                COUNT(DISTINCT fe.id) FILTER (WHERE fe.status::text = 'PENDING') AS active_emergencies,
                COUNT(DISTINCT ft.id) FILTER (WHERE ft.status::text = 'PENDING') AS pending_transfers
            FROM "Hospital" h
            LEFT JOIN "Resource" r ON h.id = r."hospitalId"
            LEFT JOIN "BloodStock" bs ON h.id = bs."hospitalId"
            LEFT JOIN "FeatureEmergency" fe ON h.id = fe."createdById"
            LEFT JOIN "FeatureTransfer" ft ON h.id = ft."fromHospitalId"
            GROUP BY h.id, h.name, h.phone, h.email, h.address
            ORDER BY h.name
        """
        hospitals = self._fetch_all(query)

        if not hospitals:
            return "No hospitals available in the network."

        lines = ["=== MedLink Hospital Network Status ===", ""]
        for hospital in hospitals:
            lines.extend([
                f"Hospital: {hospital['name']}",
                f"  ID: {hospital['id']}",
                f"  Email: {hospital['email']}",
                f"  Phone: {hospital['phone']}",
                f"  Address: {hospital['address']}",
                f"  Total Resources: {hospital['total_resources']}",
                f"  Blood Stocks: {hospital['total_blood_stocks']}",
                f"  Active Emergencies: {hospital['active_emergencies']}",
                f"  Pending Transfers: {hospital['pending_transfers']}",
                "",
            ])
        return "\n".join(lines)

    def load_hospital_context(self, hospital_id: str) -> str:
        context = self.load_context_data(hospital_id)
        if not context.hospital:
            return "Hospital not found."

        lines = [
            "=== Hospital Context ===",
            f"Name: {context.hospital.get('name', 'N/A')}",
            f"Email: {context.hospital.get('email', 'N/A')}",
            f"Phone: {context.hospital.get('phone', 'N/A')}",
            f"Address: {context.hospital.get('address', 'N/A')}",
            f"Location: {context.hospital.get('lat', 'N/A')}, {context.hospital.get('lng', 'N/A')}",
            "",
        ]

        if context.resources:
            lines.append("=== Available Resources ===")
            lines.extend(
                f"- {resource.get('name', 'Unknown')}: {resource.get('units', 0)} units"
                for resource in context.resources
            )
            lines.append("")

        if context.bloodStock:
            lines.append("=== Blood Stocks ===")
            lines.extend(
                f"- {blood_group}: {context.bloodStock.get(blood_group, 0)} units"
                for blood_group in self.BLOOD_GROUPS
            )
            lines.append("")

        if context.emergencies:
            lines.append("=== Active Emergencies ===")
            for emergency in context.emergencies[:5]:
                lines.append(
                    f"- ID: {emergency.get('id')} | Type: {emergency.get('type')} "
                    f"| Priority: {emergency.get('priority')} | Status: {emergency.get('status')}"
                )
            lines.append("")

        if context.transfers:
            lines.append("=== Pending Transfers ===")
            for transfer in context.transfers[:5]:
                lines.append(
                    f"- Transfer ID: {transfer.get('id')} | Patient: {transfer.get('patientId')} "
                    f"| Progress: {transfer.get('progress')}"
                )
            lines.append("")

        return "\n".join(lines)

    def load_context(self, hospital_id: str) -> str:
        resolved_hospital_id = self._resolve_hospital_id(hospital_id)
        context_parts = [self.load_hospital_context(resolved_hospital_id), ""]

        try:
            messages = self._fetch_all(
                """
                    SELECT role, message, created_at
                    FROM chat_messages
                    WHERE hospital_id = %s
                    ORDER BY created_at DESC
                    LIMIT 10
                """,
                (resolved_hospital_id,),
            )
        except psycopg2.Error:
            messages = []
        if messages:
            context_parts.append("=== Recent Conversation ===")
            for message in reversed(messages):
                context_parts.append(f"{message['role']}: {message['message']}")
            context_parts.append("")

        memory_context = self.chat_memory_service.get_conversation_context(str(resolved_hospital_id))
        if memory_context:
            context_parts.append("=== Current Session ===")
            context_parts.append(memory_context)
            context_parts.append("")

        return "\n".join(context_parts)

    def load_context_data(self, hospital_id: str) -> ChatContextDTO:
        resolved_hospital_id = self._resolve_hospital_id(hospital_id)
        return ChatContextDTO(
            hospital=self._fetch_one(
                """
                    SELECT id, name, email, phone, address, lat, lng
                    FROM "Hospital"
                    WHERE id = %s
                """,
                (resolved_hospital_id,),
            ) or {},
            resources=self._fetch_all(
                """
                    SELECT name::text AS name, units
                    FROM "Resource"
                    WHERE "hospitalId" = %s
                    ORDER BY name
                """,
                (resolved_hospital_id,),
            ),
            bloodStock=self._load_blood_stock(resolved_hospital_id),
            networkBlood=self._fetch_all(
                """
                    SELECT h.name AS "hospitalName", bs."bloodGroup"::text AS "bloodType", bs.units
                    FROM "BloodStock" bs
                    JOIN "Hospital" h ON h.id = bs."hospitalId"
                    WHERE bs."hospitalId" <> %s
                    ORDER BY bs.units DESC, h.name
                    LIMIT 10
                """,
                (resolved_hospital_id,),
            ),
            patients=self._fetch_all(
                """
                    SELECT id, name, age, "bloodGroup"::text AS "bloodGroup", condition
                    FROM "Patient"
                    ORDER BY id DESC
                    LIMIT 10
                """
            ),
            emergencies=self._fetch_all(
                """
                    SELECT id, type::text AS type, priority::text AS priority, status::text AS status, "additionalInfo"
                    FROM "FeatureEmergency"
                    WHERE "createdById" = %s AND status::text <> 'RESOLVED'
                    ORDER BY
                        CASE priority::text
                            WHEN 'CRITICAL' THEN 1
                            WHEN 'HIGH' THEN 2
                            ELSE 3
                        END,
                        "createdAt" DESC
                """,
                (resolved_hospital_id,),
            ),
            transfers=self._fetch_all(
                """
                    SELECT id, "patientId", "toHospitalId", status::text AS status, progress::text AS progress
                    FROM "FeatureTransfer"
                    WHERE "fromHospitalId" = %s
                    ORDER BY "createdAt" DESC
                """,
                (resolved_hospital_id,),
            ),
            bloodTransfers=self._fetch_all(
                """
                    SELECT id, "bloodGroup"::text AS "bloodType", units, status::text AS status, progress::text AS progress
                    FROM "FeatureBloodNetworkTransfer"
                    WHERE "fromHospitalId" = %s OR "toHospitalId" = %s
                    ORDER BY "createdAt" DESC
                """,
                (resolved_hospital_id, resolved_hospital_id),
            ),
        )

    def format_context_for_llm(self, context: ChatContextDTO) -> str:
        lines = ["=== HOSPITAL INFORMATION ==="]
        if context.hospital:
            hospital = context.hospital
            lines.extend([
                f"Name: {hospital.get('name', 'N/A')}",
                f"Address: {hospital.get('address', 'N/A')}",
                f"Phone: {hospital.get('phone', 'N/A')}",
                f"Email: {hospital.get('email', 'N/A')}",
            ])
        else:
            lines.append("No hospital information available.")
        lines.append("")

        lines.append("=== RESOURCE INVENTORY ===")
        if context.resources:
            for resource in context.resources:
                lines.append(f"- {resource.get('name', 'Unknown')}: {resource.get('units', 0)} units")
        else:
            lines.append("No resources available.")
        lines.append("")

        lines.append("=== BLOOD STOCK ===")
        if context.bloodStock:
            for blood_group in self.BLOOD_GROUPS:
                lines.append(f"- {blood_group}: {context.bloodStock.get(blood_group, 0)} units")
        else:
            lines.append("No blood stock information available.")
        lines.append("")

        lines.append("=== ACTIVE EMERGENCIES ===")
        if context.emergencies:
            for emergency in context.emergencies:
                lines.append(
                    f"- Type: {emergency.get('type', 'Unknown')}, "
                    f"Priority: {emergency.get('priority', 'Unknown')}, "
                    f"Status: {emergency.get('status', 'Unknown')}"
                )
        else:
            lines.append("No active emergencies.")
        lines.append("")

        lines.append("=== PATIENT TRANSFERS ===")
        if context.transfers:
            for transfer in context.transfers:
                lines.append(
                    f"- Transfer ID: {transfer.get('id', 'Unknown')}, "
                    f"Status: {transfer.get('status', 'Unknown')}, "
                    f"Progress: {transfer.get('progress', 'Unknown')}"
                )
        else:
            lines.append("No patient transfers in progress.")
        lines.append("")

        lines.append("=== PATIENT SNAPSHOT ===")
        if context.patients:
            for patient in context.patients:
                lines.append(
                    f"- {patient.get('name', 'Unknown')} | "
                    f"Condition: {patient.get('condition', 'Unknown')} | "
                    f"Blood Group: {patient.get('bloodGroup', 'Unknown')}"
                )
        else:
            lines.append("No patient records available.")
        lines.append("")

        hospital_id = str(context.hospital.get("id", "1"))
        memory_context = self.chat_memory_service.get_conversation_context(hospital_id)
        if memory_context:
            lines.append("=== CURRENT SESSION ===")
            lines.append(memory_context)
            lines.append("")

        return "\n".join(lines)

    def get_resource_units(self, context: ChatContextDTO, resource_name: str) -> int:
        normalized_target = self._normalize_resource_name(resource_name)
        return sum(
            int(resource.get("units", 0))
            for resource in context.resources
            if self._normalize_resource_name(str(resource.get("name", ""))) == normalized_target
        )

    def get_active_emergency_count(self, context: ChatContextDTO) -> int:
        return len(context.emergencies)

    def get_critical_emergency_count(self, context: ChatContextDTO) -> int:
        return sum(
            1
            for emergency in context.emergencies
            if str(emergency.get("priority", "")).upper() == "CRITICAL"
        )

    def get_pending_transfer_count(self, context: ChatContextDTO) -> int:
        return sum(
            1
            for transfer in context.transfers
            if str(transfer.get("status", "")).upper() == "PENDING"
        )

    def get_critical_patient_count(self, context: ChatContextDTO) -> int:
        return sum(
            1
            for patient in context.patients
            if self._is_critical_condition(str(patient.get("condition", "")))
        )

    def save_message(self, hospital_id: str, role: str, message: str) -> None:
        resolved_hospital_id = self._resolve_hospital_id(hospital_id)
        try:
            self._execute(
                """
                    INSERT INTO chat_messages (hospital_id, role, message, created_at, updated_at)
                    VALUES (%s, %s, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """,
                (resolved_hospital_id, role, message),
            )
        except psycopg2.Error:
            pass
        self.chat_memory_service.add_message(str(resolved_hospital_id), role, message)

    def get_conversation_context(self, hospital_id: str) -> str:
        return self.chat_memory_service.get_conversation_context(str(self._resolve_hospital_id(hospital_id)))

    def sync_hospital_ai_context(self, hospital_id: str) -> None:
        resolved_hospital_id = self._resolve_hospital_id(hospital_id)
        try:
            self._execute(
                """
                    INSERT INTO hospital_ai_context (
                        hospital_id,
                        hospital_name,
                        city,
                        state,
                        phone,
                        email,
                        icu_beds_available,
                        ventilators_available,
                        oxygen_beds_available,
                        blood_units_available,
                        ambulances_available,
                        active_emergency_requests,
                        occupancy_rate,
                        last_synced,
                        last_updated
                    )
                    SELECT
                        h.id,
                        h.name,
                        h.address,
                        'India',
                        h.phone,
                        h.email,
                        COALESCE(SUM(CASE WHEN r.name::text IN ('ICU Bed', 'ICU_BED') THEN r.units ELSE 0 END), 0),
                        COALESCE(SUM(CASE WHEN r.name::text = 'Ventilator' THEN r.units ELSE 0 END), 0),
                        COALESCE(SUM(CASE WHEN r.name::text IN ('Oxygen Cylinder', 'OXYGEN_CYLINDER') THEN r.units ELSE 0 END), 0),
                        COALESCE(SUM(bs.units), 0),
                        COALESCE(SUM(CASE WHEN r.name::text = 'Ambulance' THEN r.units ELSE 0 END), 0),
                        COUNT(DISTINCT CASE WHEN fe.status::text = 'PENDING' THEN fe.id END),
                        0.0,
                        CURRENT_TIMESTAMP,
                        CURRENT_TIMESTAMP
                    FROM "Hospital" h
                    LEFT JOIN "Resource" r ON h.id = r."hospitalId"
                    LEFT JOIN "BloodStock" bs ON h.id = bs."hospitalId"
                    LEFT JOIN "FeatureEmergency" fe ON h.id = fe."createdById"
                    WHERE h.id = %s
                    GROUP BY h.id, h.name, h.address, h.phone, h.email
                    ON CONFLICT (hospital_id) DO UPDATE SET
                        hospital_name = EXCLUDED.hospital_name,
                        city = EXCLUDED.city,
                        state = EXCLUDED.state,
                        phone = EXCLUDED.phone,
                        email = EXCLUDED.email,
                        icu_beds_available = EXCLUDED.icu_beds_available,
                        ventilators_available = EXCLUDED.ventilators_available,
                        oxygen_beds_available = EXCLUDED.oxygen_beds_available,
                        blood_units_available = EXCLUDED.blood_units_available,
                        ambulances_available = EXCLUDED.ambulances_available,
                        active_emergency_requests = EXCLUDED.active_emergency_requests,
                        last_synced = CURRENT_TIMESTAMP,
                        last_updated = CURRENT_TIMESTAMP
                """,
                (resolved_hospital_id,),
            )
        except psycopg2.Error:
            pass

    def _load_blood_stock(self, hospital_id: int) -> dict[str, Any]:
        rows = self._fetch_all(
            """
                SELECT "bloodGroup"::text AS blood_group, units
                FROM "BloodStock"
                WHERE "hospitalId" = %s
                ORDER BY "bloodGroup"
            """,
            (hospital_id,),
        )
        stock = {blood_group: 0 for blood_group in self.BLOOD_GROUPS}
        for row in rows:
            normalized_blood_group = self._normalize_blood_group(str(row["blood_group"]))
            if normalized_blood_group in stock:
                stock[normalized_blood_group] = int(row["units"])
        return stock

    def _fetch_all(self, query: str, params: tuple[Any, ...] = ()) -> list[dict[str, Any]]:
        with self._connect() as connection:
            with connection.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute(query, params)
                return [dict(row) for row in cursor.fetchall()]

    def _fetch_one(self, query: str, params: tuple[Any, ...] = ()) -> dict[str, Any] | None:
        rows = self._fetch_all(query, params)
        return rows[0] if rows else None

    def _execute(self, query: str, params: tuple[Any, ...] = ()) -> None:
        with self._connect() as connection:
            with connection.cursor() as cursor:
                cursor.execute(query, params)
            connection.commit()

    def _connect(self):
        return psycopg2.connect(**self.settings.database_connection_kwargs())

    def _resolve_hospital_id(self, hospital_id: str | int | None) -> int:
        if hospital_id in (None, ""):
            return 1
        try:
            return int(hospital_id)
        except (TypeError, ValueError):
            return 1

    def _normalize_blood_group(self, blood_group: str) -> str:
        return self.BLOOD_GROUP_ALIASES.get(str(blood_group).strip().upper(), str(blood_group).strip().upper())

    def _normalize_resource_name(self, resource_name: str) -> str:
        normalized = str(resource_name).strip().lower().replace("-", " ").replace("_", " ")
        normalized = " ".join(normalized.split())
        return self.RESOURCE_NAME_ALIASES.get(normalized, normalized)

    def _is_critical_condition(self, condition: str) -> bool:
        normalized = condition.lower()
        return any(
            token in normalized
            for token in ("critical", "severe", "trauma", "respiratory", "head injury")
        )
