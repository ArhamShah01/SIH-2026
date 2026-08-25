from fastapi import APIRouter, HTTPException
from models import TrajectoryPoint
from services.trajectory import TrajectorySimulator
from typing import List
import json
from pathlib import Path
from datetime import datetime

router = APIRouter()
simulator = TrajectorySimulator()

def get_data_dir() -> Path:
    return Path(__file__).parent.parent / "data"

def _load_incident(incident_id: str):
    data_path = get_data_dir() / "demo_incidents.json"
    if not data_path.exists():
        return None
    with open(data_path) as f:
        incidents = json.load(f)
    for inc in incidents:
        if inc["id"] == incident_id:
            return inc
    return None

def _get_cache_path() -> Path:
    return get_data_dir() / "trajectory_cache.json"

def _load_cache() -> dict:
    cache_path = _get_cache_path()
    if cache_path.exists():
        with open(cache_path, "r") as f:
            try:
                return json.load(f)
            except:
                return {}
    return {}

def _save_cache(cache: dict):
    with open(_get_cache_path(), "w") as f:
        json.dump(cache, f)

@router.get("/trajectories/{incident_id}", response_model=List[TrajectoryPoint])
async def get_trajectory(incident_id: str):
    # 1. Check persistent cache first
    cache = _load_cache()
    if incident_id in cache:
        return cache[incident_id]

    # 2. If not in cache, load incident details
    incident = _load_incident(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found")
    
    lat = incident["location"]["lat"]
    lon = incident["location"]["lon"]
    timestamp = datetime.fromisoformat(incident["timestamp"].replace("Z", "+00:00"))
    
    # Run backward trajectory (origin estimation) — 6 hours back
    backward_points = await simulator.simulate(
        lat=lat, lon=lon, timestamp=timestamp,
        duration_hours=6, direction="backward",
        num_particles=100, dt_minutes=60
    )
    
    # Run forward trajectory (spill prediction) — 6 hours forward
    forward_points = await simulator.simulate(
        lat=lat, lon=lon, timestamp=timestamp,
        duration_hours=6, direction="forward",
        num_particles=100, dt_minutes=60
    )
    
    # Combine: backward (negative offsets) + current position + forward (positive offsets)
    all_points = backward_points + [p for p in forward_points if p.timeOffsetHours > 0]
    all_points.sort(key=lambda p: p.timeOffsetHours)
    
    # Convert points to dicts for JSON serialization
    serialized_points = [p.dict() for p in all_points]
    
    # 3. Save to persistent cache
    cache[incident_id] = serialized_points
    _save_cache(cache)
    
    return all_points
