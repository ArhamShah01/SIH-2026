from fastapi import APIRouter, HTTPException
from models import Incident
import json
from pathlib import Path
from typing import List

router = APIRouter()

def _load_incidents() -> List[dict]:
    data_path = Path(__file__).parent.parent / "data" / "demo_incidents.json"
    with open(data_path) as f:
        return json.load(f)

@router.get("/incidents", response_model=List[Incident])
async def get_all_incidents():
    return _load_incidents()

@router.get("/incidents/{incident_id}", response_model=Incident)
async def get_incident_by_id(incident_id: str):
    incidents = _load_incidents()
    for inc in incidents:
        if inc["id"] == incident_id:
            return inc
    raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found")
