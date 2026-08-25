from pydantic import BaseModel
from typing import Optional, Literal

class Coordinates(BaseModel):
    lat: float
    lon: float

class DashboardStats(BaseModel):
    activeIncidents: int
    detectedSpillAreaKm2: float
    highRiskAlerts: int
    vesselsAnalyzed: int

class Incident(BaseModel):
    id: str
    timestamp: str
    location: Coordinates
    areaKm2: float
    confidence: float
    severity: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL", "UNKNOWN"]
    status: Literal["DETECTED", "INVESTIGATING", "RESOLVED"]

class DetectionInferResult(BaseModel):
    sampleId: str
    predictionAvailable: bool
    confidence: float
    spillAreaKm2: float
    maskUrl: str
    modelName: str
    modelVersion: str

class Vessel(BaseModel):
    mmsi: int
    name: str
    type: str
    position: Coordinates
    speed: float
    heading: float
    course: float
    timestamp: str
    riskScore: Optional[int] = None

class TrajectoryPoint(BaseModel):
    timeOffsetHours: float
    coordinates: Coordinates
    uncertaintyRadiusKm: float
