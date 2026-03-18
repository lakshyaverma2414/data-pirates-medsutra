from fastapi import FastAPI, Header, Query
from fastapi.middleware.cors import CORSMiddleware
from app.ai_context_loader import AIContextLoader
from app.ai_module_service import AIChatService
from app.chat_memory import ChatMemoryService
from app.config import settings
from app.hospital_selector import HospitalSelector
from app.models import (
    ChatRequest,
    ChatResponse,
    EmergencyAnalysisDTO,
    ForecastDTO,
    ResourceAnalysisDTO,
    TriageRequest,
    TriageResponse,
)
from app.ollama_client import OllamaClient
from app.triage_engine import TriageEngine


app = FastAPI(
    title="MedLink AI Triage Service",
    version="1.0.0",
    description="Standalone FastAPI triage and AI module powered by Ollama.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ollama_client = OllamaClient(settings)
triage_engine = TriageEngine(ollama_client)
hospital_selector = HospitalSelector(settings)
chat_memory_service = ChatMemoryService()
ai_context_loader = AIContextLoader(settings, chat_memory_service)
ai_chat_service = AIChatService(ai_context_loader, ollama_client)


@app.post("/triage", response_model=TriageResponse)
def triage(request: TriageRequest) -> TriageResponse:
    analysis = triage_engine.analyze_request(request)
    return hospital_selector.select_best_hospital(request, analysis)


@app.post("/ai/chat", response_model=ChatResponse)
@app.post("/api/ai/chat", response_model=ChatResponse)
def chat(request: ChatRequest, authorization: str | None = Header(default=None)) -> ChatResponse:
    jwt_token = extract_token(authorization)
    reply = ai_chat_service.chat(request.hospitalId, request.message, jwt_token=jwt_token)
    return ChatResponse(reply=reply)


@app.get("/ai/analysis/resources", response_model=ResourceAnalysisDTO)
@app.get("/api/ai/analysis/resources", response_model=ResourceAnalysisDTO)
def get_resource_analysis(hospitalId: str = Query(default="1")) -> ResourceAnalysisDTO:
    return ai_chat_service.get_resource_analysis(hospitalId)


@app.get("/ai/analysis/emergencies", response_model=EmergencyAnalysisDTO)
@app.get("/api/ai/analysis/emergencies", response_model=EmergencyAnalysisDTO)
def get_emergency_analysis(hospitalId: str = Query(default="1")) -> EmergencyAnalysisDTO:
    return ai_chat_service.get_emergency_analysis(hospitalId)


@app.get("/ai/analysis/forecast", response_model=ForecastDTO)
@app.get("/api/ai/analysis/forecast", response_model=ForecastDTO)
def get_forecast(hospitalId: str = Query(default="1")) -> ForecastDTO:
    return ai_chat_service.get_forecast(hospitalId)


@app.get("/ai/chat/network-status", response_model=ChatResponse)
@app.get("/api/ai/chat/network-status", response_model=ChatResponse)
def get_network_status() -> ChatResponse:
    return ChatResponse(reply=ai_chat_service.get_network_status())


@app.get("/ai/chat/hospital-status/{hospital_id}", response_model=ChatResponse)
@app.get("/api/ai/chat/hospital-status/{hospital_id}", response_model=ChatResponse)
def get_hospital_status(hospital_id: str) -> ChatResponse:
    return ChatResponse(reply=ai_chat_service.get_hospital_status(hospital_id))


def extract_token(authorization: str | None) -> str:
    if authorization and authorization.startswith("Bearer "):
        return authorization[7:]
    return ""
