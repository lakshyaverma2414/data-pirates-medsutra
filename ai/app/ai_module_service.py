from app.ai_context_loader import AIContextLoader
from app.models import ChatContextDTO, EmergencyAnalysisDTO, ForecastDTO, ResourceAnalysisDTO
from app.ollama_client import OllamaClient


class AIChatService:
    def __init__(self, context_loader: AIContextLoader, ollama_client: OllamaClient) -> None:
        self.context_loader = context_loader
        self.ollama_client = ollama_client

    def chat(self, hospital_id: str, user_message: str, jwt_token: str = "") -> str:
        try:
            self.context_loader.sync_hospital_ai_context(hospital_id)
            context = self.context_loader.load_context_data(hospital_id)
            resource_analysis = self.get_resource_analysis(hospital_id)
            emergency_analysis = self.get_emergency_analysis(hospital_id)
            forecast = self.get_forecast(hospital_id)
            system_prompt = self._build_system_prompt(
                self.context_loader.format_context_for_llm(context),
                resource_analysis,
                emergency_analysis,
                forecast,
            )

            self.context_loader.save_message(hospital_id, "user", user_message)
            ai_response = self.ollama_client.generate(
                system_prompt + f"\n\nUser: {user_message}\n\nAssistant:"
            )
            self.context_loader.save_message(hospital_id, "assistant", ai_response)
            return ai_response
        except Exception as exc:
            return f"Error processing request: {exc}"

    def get_resource_analysis(self, hospital_id: str) -> ResourceAnalysisDTO:
        context = self.context_loader.load_context_data(hospital_id)
        icu_beds = self.context_loader.get_resource_units(context, "ICU Bed")
        ventilators = self.context_loader.get_resource_units(context, "Ventilator")
        oxygen_beds = self.context_loader.get_resource_units(context, "Oxygen Cylinder")

        if icu_beds <= 2 or ventilators <= 1:
            capacity_status = "CRITICAL"
            recommendation = "Escalate capacity planning immediately and prepare inter-hospital support."
        elif icu_beds <= 5 or ventilators <= 3 or oxygen_beds <= 10:
            capacity_status = "MODERATE"
            recommendation = "Monitor ICU and ventilator usage closely during the next shift."
        else:
            capacity_status = "STABLE"
            recommendation = "Current resource levels are healthy; continue routine monitoring."

        return ResourceAnalysisDTO(
            icuBeds=icu_beds,
            ventilators=ventilators,
            oxygenBeds=oxygen_beds,
            capacityStatus=capacity_status,
            recommendation=recommendation,
        )

    def get_emergency_analysis(self, hospital_id: str) -> EmergencyAnalysisDTO:
        context = self.context_loader.load_context_data(hospital_id)
        active_emergencies = self.context_loader.get_active_emergency_count(context)
        critical_cases = self.context_loader.get_critical_emergency_count(context)

        if critical_cases > 0:
            recommendation = "Allocate ICU-ready staff and equipment to the critical queue immediately."
        elif active_emergencies > 0:
            recommendation = "Keep emergency triage active and review resource readiness every hour."
        else:
            recommendation = "Emergency load is stable; no immediate escalation is required."

        return EmergencyAnalysisDTO(
            activeEmergencies=active_emergencies,
            criticalCases=critical_cases,
            recommendation=recommendation,
        )

    def get_forecast(self, hospital_id: str) -> ForecastDTO:
        context: ChatContextDTO = self.context_loader.load_context_data(hospital_id)
        available_icu = self.context_loader.get_resource_units(context, "ICU Bed")
        active_emergencies = self.context_loader.get_active_emergency_count(context)
        pending_transfers = self.context_loader.get_pending_transfer_count(context)
        critical_patients = self.context_loader.get_critical_patient_count(context)
        predicted_demand = active_emergencies + pending_transfers + critical_patients

        if predicted_demand <= available_icu:
            risk_level = "LOW"
            recommendation = "Current ICU availability looks manageable; continue routine monitoring."
        elif predicted_demand <= available_icu + 2:
            risk_level = "MEDIUM"
            recommendation = "Monitor ICU admissions closely and keep one transfer pathway ready."
        else:
            risk_level = "HIGH"
            recommendation = "Request additional ICU beds from nearby hospitals and pre-alert transfer teams."

        return ForecastDTO(
            availableICU=available_icu,
            activeEmergencies=active_emergencies,
            pendingTransfers=pending_transfers,
            criticalPatients=critical_patients,
            predictedDemand=predicted_demand,
            riskLevel=risk_level,
            recommendation=recommendation,
        )

    def get_network_status(self) -> str:
        return self.context_loader.load_hospital_network_data()

    def get_hospital_status(self, hospital_id: str) -> str:
        context = self.context_loader.load_context_data(hospital_id)
        return self.context_loader.format_context_for_llm(context)

    def _build_system_prompt(
        self,
        hospital_context: str,
        resource_analysis: ResourceAnalysisDTO,
        emergency_analysis: EmergencyAnalysisDTO,
        forecast: ForecastDTO,
    ) -> str:
        return f"""
You are an AI assistant for MedLink, a healthcare coordination platform.
You have access to real-time hospital network data and operational analytics.

Your responsibilities:
1. Provide hospital resource availability information.
2. Help coordinate emergency responses.
3. Assist with patient transfers between hospitals.
4. Provide ICU demand forecasting and operational recommendations.
5. Keep answers concise, practical, and safe.

Current hospital context:
{hospital_context}

Current analysis:
- ICU Beds Available: {resource_analysis.icuBeds}
- Ventilators Available: {resource_analysis.ventilators}
- Oxygen Beds Available: {resource_analysis.oxygenBeds}
- Capacity Status: {resource_analysis.capacityStatus}
- Active Emergencies: {emergency_analysis.activeEmergencies}
- Critical Emergency Cases: {emergency_analysis.criticalCases}
- Forecast Available ICU: {forecast.availableICU}
- Forecast Predicted Demand: {forecast.predictedDemand}
- Forecast Risk Level: {forecast.riskLevel}

Recommendations:
- Resource Recommendation: {resource_analysis.recommendation}
- Emergency Recommendation: {emergency_analysis.recommendation}
- Forecast Recommendation: {forecast.recommendation}

Guidelines:
- Prioritize patient safety and fast escalation paths.
- Base answers on the supplied hospital data.
- If capacity is tight, recommend concrete next actions.
- Respond in a professional and helpful manner.
""".strip()
