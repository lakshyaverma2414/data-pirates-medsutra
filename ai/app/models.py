from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class TriageRequest(BaseModel):
    emergencyType: str = Field(..., min_length=2)
    description: str = Field(..., min_length=5)
    patientAge: int = Field(..., ge=0, le=130)
    userLat: float
    userLng: float


class TriageAnalysis(BaseModel):
    severity: str
    specialization: str
    required_capabilities: List[str] = Field(default_factory=list)
    summary: str


class HospitalCandidate(BaseModel):
    id: Optional[int] = None
    name: str
    phone: str
    email: str
    address: str
    lat: float
    lng: float
    capabilities: List[str] = Field(default_factory=list)
    resources: Dict[str, float] = Field(default_factory=dict)


class HospitalRecommendation(BaseModel):
    name: str
    phone: str
    email: str
    address: str
    lat: float
    lng: float


class TriageResponse(BaseModel):
    severity: str
    specialization: str
    stabilizationHospital: Optional[HospitalRecommendation] = None
    transferHospital: Optional[HospitalRecommendation] = None
    recommendedHospital: Optional[HospitalRecommendation] = None


class ChatRequest(BaseModel):
    hospitalId: str = Field(default="1")
    message: str = Field(..., min_length=1)


class ChatResponse(BaseModel):
    reply: str


class ResourceAnalysisDTO(BaseModel):
    icuBeds: int
    ventilators: int
    oxygenBeds: int
    capacityStatus: str
    recommendation: str


class EmergencyAnalysisDTO(BaseModel):
    activeEmergencies: int
    criticalCases: int
    recommendation: str


class ForecastDTO(BaseModel):
    availableICU: int
    activeEmergencies: int
    pendingTransfers: int
    criticalPatients: int
    predictedDemand: int
    riskLevel: str
    recommendation: str


class ChatContextDTO(BaseModel):
    hospital: Dict[str, Any] = Field(default_factory=dict)
    resources: List[Dict[str, Any]] = Field(default_factory=list)
    bloodStock: Dict[str, Any] = Field(default_factory=dict)
    networkBlood: List[Dict[str, Any]] = Field(default_factory=list)
    patients: List[Dict[str, Any]] = Field(default_factory=list)
    emergencies: List[Dict[str, Any]] = Field(default_factory=list)
    transfers: List[Dict[str, Any]] = Field(default_factory=list)
    bloodTransfers: List[Dict[str, Any]] = Field(default_factory=list)
