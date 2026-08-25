from fastapi import APIRouter, UploadFile, File, Form
from models import DetectionInferResult
from typing import Optional

import json
import random
from pathlib import Path
from datetime import datetime

router = APIRouter()

def get_data_path() -> Path:
    return Path(__file__).parent.parent / "data" / "demo_incidents.json"

@router.post("/detection/infer", response_model=DetectionInferResult)
async def run_inference(
    file: Optional[UploadFile] = File(None),
    config: Optional[str] = Form(None)
):
    """Simulates a live ML inference and injects the new detection into the database for the SIH demo."""
    
    # Generate somewhat random realistic values
    area = round(random.uniform(5.0, 45.0), 1)
    confidence = round(random.uniform(0.75, 0.98), 3)
    lat = round(random.uniform(14.0, 23.0), 3)
    lon = round(random.uniform(64.0, 72.0), 3)
    
    new_id = f"SPL-2026-NEW-{random.randint(1000, 9999)}"
    now_str = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
    
    # Determine severity based on area
    if area > 30: severity = "CRITICAL"
    elif area > 15: severity = "HIGH"
    elif area > 8: severity = "MEDIUM"
    else: severity = "LOW"
    
    # 1. Update the "database" (JSON file)
    data_path = get_data_path()
    if data_path.exists():
        with open(data_path, "r") as f:
            incidents = json.load(f)
            
        new_incident = {
            "id": new_id,
            "timestamp": now_str,
            "location": {"lat": lat, "lon": lon},
            "areaKm2": area,
            "confidence": confidence * 100,
            "severity": severity,
            "status": "DETECTED"
        }
        
        # Add to the top of the list
        incidents.insert(0, new_incident)
        
        with open(data_path, "w") as f:
            json.dump(incidents, f, indent=2)
            
    # 2. Return the result to the frontend
    return DetectionInferResult(
        sampleId=new_id,
        predictionAvailable=True,
        confidence=confidence,
        spillAreaKm2=area,
        maskUrl="/demo-mask.png",
        modelName="Oil Spill Segmentation Model (UNet)",
        modelVersion="v1.0-dynamic-demo"
    )
