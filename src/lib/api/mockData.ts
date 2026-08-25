import { DashboardStats, Incident, Vessel, TrajectoryPoint, DetectionInferResult } from "@/data/types"

export const MOCK_STATS: DashboardStats = {
  activeIncidents: 3,
  detectedSpillAreaKm2: 42.8,
  highRiskAlerts: 1,
  vesselsAnalyzed: 14
}

export const MOCK_INCIDENTS: Incident[] = [
  {
    id: "INC-2026-0825-01",
    timestamp: "2026-08-25T14:32:00Z",
    location: { lat: 15.42, lon: 67.83 },
    areaKm2: 24.5,
    confidence: 94.8,
    severity: "CRITICAL",
    status: "INVESTIGATING"
  },
  {
    id: "INC-2026-0824-02",
    timestamp: "2026-08-24T09:15:00Z",
    location: { lat: 16.12, lon: 68.45 },
    areaKm2: 12.3,
    confidence: 88.2,
    severity: "MEDIUM",
    status: "DETECTED"
  },
  {
    id: "INC-2026-0823-03",
    timestamp: "2026-08-23T18:40:00Z",
    location: { lat: 14.85, lon: 66.90 },
    areaKm2: 6.0,
    confidence: 76.5,
    severity: "LOW",
    status: "RESOLVED"
  }
]

export const MOCK_VESSELS: Vessel[] = [
  {
    mmsi: 311000123,
    name: "MT PETRO VOYAGER",
    type: "Crude Oil Tanker",
    position: { lat: 15.44, lon: 67.81 },
    speed: 12.4,
    heading: 235,
    course: 238,
    timestamp: "2026-08-25T14:30:00Z",
    riskScore: 92
  },
  {
    mmsi: 477218900,
    name: "MV ARABIAN HORIZON",
    type: "Container Ship",
    position: { lat: 15.38, lon: 67.89 },
    speed: 18.1,
    heading: 50,
    course: 52,
    timestamp: "2026-08-25T14:28:00Z",
    riskScore: 35
  },
  {
    mmsi: 563098220,
    name: "MT GULF SEA",
    type: "Chemical Tanker",
    position: { lat: 15.50, lon: 67.75 },
    speed: 10.2,
    heading: 190,
    course: 192,
    timestamp: "2026-08-25T14:25:00Z",
    riskScore: 68
  }
]

export const MOCK_TRAJECTORY: TrajectoryPoint[] = [
  { timeOffsetHours: 0, coordinates: { lat: 15.42, lon: 67.83 }, uncertaintyRadiusKm: 0.5 },
  { timeOffsetHours: 3, coordinates: { lat: 15.46, lon: 67.87 }, uncertaintyRadiusKm: 1.2 },
  { timeOffsetHours: 6, coordinates: { lat: 15.51, lon: 67.92 }, uncertaintyRadiusKm: 2.0 },
  { timeOffsetHours: 12, coordinates: { lat: 15.60, lon: 68.03 }, uncertaintyRadiusKm: 3.8 },
  { timeOffsetHours: 24, coordinates: { lat: 15.78, lon: 68.25 }, uncertaintyRadiusKm: 6.5 }
]

export const MOCK_DETECTION_RESULT: DetectionInferResult = {
  sampleId: "S1A_IW_GRDH_1SDV_20260825_ARABIAN_SEA",
  predictionAvailable: true,
  confidence: 94.5,
  spillAreaKm2: 18.5,
  maskUrl: "/demo/segmentation_mask.png",
  modelName: "DeepLabV3+ ResNet-50 SAR-Spill",
  modelVersion: "v2.1.0-SAR-ArabianSea"
}
