"""
Severity and Risk Score Calculation Service

Severity: Incident-level classification (LOW/MEDIUM/HIGH/CRITICAL)
Risk Score: Per-vessel attribution score (0-100%)
"""


def calculate_severity(
    spill_area_km2: float,
    confidence: float,
    wind_speed_ms: float = 8.0,
    current_speed_ms: float = 0.3,
    distance_to_coast_km: float = 200.0
) -> str:
    """
    Calculate incident severity from environmental and detection parameters.
    
    Returns: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
    """
    score = 0
    
    # Size factor (0-30 points)
    if spill_area_km2 > 50:
        score += 30
    elif spill_area_km2 > 20:
        score += 20
    elif spill_area_km2 > 5:
        score += 10
    
    # Confidence factor (0-20 points)
    if confidence > 90:
        score += 20
    elif confidence > 70:
        score += 15
    elif confidence > 50:
        score += 10
    
    # Environmental urgency (0-30 points)
    # High wind/current = faster spread = more urgent
    env_speed = current_speed_ms + 0.03 * wind_speed_ms
    if env_speed > 0.8:
        score += 30
    elif env_speed > 0.4:
        score += 20
    elif env_speed > 0.2:
        score += 10
    
    # Proximity to coast (0-20 points)
    if distance_to_coast_km < 10:
        score += 20
    elif distance_to_coast_km < 50:
        score += 15
    elif distance_to_coast_km < 100:
        score += 10
    
    # Map to severity level
    if score >= 70:
        return "CRITICAL"
    elif score >= 50:
        return "HIGH"
    elif score >= 30:
        return "MEDIUM"
    else:
        return "LOW"


def calculate_vessel_risk_score(
    spatial_distance_km: float,
    time_compatibility_hours: float,
    drift_consistency: float,
    behavior_anomaly: float
) -> int:
    """
    Calculate vessel attribution risk score.
    
    S_v = w_s × S_space + w_t × S_time + w_d × S_drift + w_b × S_behavior
    
    Args:
        spatial_distance_km: Distance from vessel to estimated spill origin
        time_compatibility_hours: Time gap between vessel presence and estimated release
        drift_consistency: 0-1, how well drift model connects vessel to spill
        behavior_anomaly: 0-1, how anomalous vessel behavior is (slow speed, course changes)
    
    Returns: Risk score 0-100
    """
    # Spatial score: closer = higher risk, linear decay to 0 at 50km
    S_space = max(0, 100 - spatial_distance_km * 2)
    
    # Temporal score: closer in time = higher, 0 at 10h gap
    S_time = max(0, 100 - time_compatibility_hours * 10)
    
    # Drift consistency score
    S_drift = drift_consistency * 100
    
    # Behavior anomaly score
    S_behavior = behavior_anomaly * 100
    
    # Weighted combination
    w_s, w_t, w_d, w_b = 0.25, 0.25, 0.35, 0.15
    
    risk = w_s * S_space + w_t * S_time + w_d * S_drift + w_b * S_behavior
    return min(100, max(0, round(risk)))
