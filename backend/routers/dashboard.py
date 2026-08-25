from fastapi import APIRouter
from models import DashboardStats
import json
from pathlib import Path

router = APIRouter()

@router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats():
    # Load demo incidents to compute stats
    data_path = Path(__file__).parent.parent / "data" / "demo_incidents.json"
    with open(data_path) as f:
        incidents = json.load(f)
    
    # Load demo vessels to count
    vessels_path = Path(__file__).parent.parent / "data" / "demo_vessels.json"
    with open(vessels_path) as f:
        vessel_groups = json.load(f)
    
    active = [i for i in incidents if i["status"] != "RESOLVED"]
    high_risk = [i for i in active if i["severity"] in ("HIGH", "CRITICAL")]
    total_area = sum(i["areaKm2"] for i in active)
    total_vessels = sum(len(vg["vessels"]) for vg in vessel_groups)
    
    return DashboardStats(
        activeIncidents=len(active),
        detectedSpillAreaKm2=round(total_area, 1),
        highRiskAlerts=len(high_risk),
        vesselsAnalyzed=total_vessels
    )
