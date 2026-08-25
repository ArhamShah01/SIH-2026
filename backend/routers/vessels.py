from fastapi import APIRouter, Query
from models import Vessel
from services.severity import calculate_vessel_risk_score
import json
from pathlib import Path
from typing import List, Optional
import math

router = APIRouter()

def _load_vessel_groups() -> list:
    data_path = Path(__file__).parent.parent / "data" / "demo_vessels.json"
    with open(data_path) as f:
        return json.load(f)

def _load_incident(incident_id: str) -> Optional[dict]:
    data_path = Path(__file__).parent.parent / "data" / "demo_incidents.json"
    with open(data_path) as f:
        incidents = json.load(f)
    for inc in incidents:
        if inc["id"] == incident_id:
            return inc
    return None

def _haversine_km(lat1, lon1, lat2, lon2):
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

@router.get("/ais/vessels", response_model=List[Vessel])
async def get_nearby_vessels(incidentId: str = Query(...)):
    vessel_groups = _load_vessel_groups()
    incident = _load_incident(incidentId)
    
    vessels = []
    for vg in vessel_groups:
        if vg["incidentId"] == incidentId:
            vessels = vg["vessels"]
            break
    
    if not vessels:
        return []
    
    # Calculate risk scores for each vessel
    scored_vessels = []
    for v in vessels:
        if incident:
            dist_km = _haversine_km(
                incident["location"]["lat"], incident["location"]["lon"],
                v["position"]["lat"], v["position"]["lon"]
            )
            # Estimate time compatibility (hours between vessel timestamp and incident)
            from datetime import datetime
            inc_time = datetime.fromisoformat(incident["timestamp"].replace("Z", "+00:00"))
            ves_time = datetime.fromisoformat(v["timestamp"].replace("Z", "+00:00"))
            time_diff_hours = abs((inc_time - ves_time).total_seconds()) / 3600
            
            # Speed anomaly: slow speed near spill is suspicious
            behavior_anomaly = max(0, 1.0 - v["speed"] / 15.0) if v["speed"] < 8 else 0.1
            
            risk = calculate_vessel_risk_score(
                spatial_distance_km=dist_km,
                time_compatibility_hours=time_diff_hours,
                drift_consistency=max(0.3, 1.0 - dist_km / 50.0),  # rough estimate
                behavior_anomaly=behavior_anomaly
            )
            v["riskScore"] = risk
        else:
            v["riskScore"] = 0
        
        scored_vessels.append(v)
    
    # Sort by risk score descending
    scored_vessels.sort(key=lambda x: x.get("riskScore", 0), reverse=True)
    return scored_vessels
