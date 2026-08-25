"""
Wind Data Service  
Primary: Open-Meteo Weather API (free, no API key required)
Fallback: Synthetic Arabian Sea SW monsoon wind field
"""
import numpy as np
import httpx
import logging
from datetime import datetime
from typing import Tuple, Optional, Dict

logger = logging.getLogger(__name__)

# Cache wind data to avoid hammering the API
_wind_cache: Dict[str, Tuple[float, float]] = {}


class WindService:
    """Provides 10m wind components (u10, v10) at any lat/lon/time."""
    
    def __init__(self):
        self._mode = "open_meteo"  # Will fallback to synthetic on failure
    
    @property
    def mode(self) -> str:
        return self._mode
    
    async def get_wind_at(self, lat: float, lon: float, time: Optional[datetime] = None) -> Tuple[float, float]:
        """
        Get 10m wind components at a point.
        Returns (u10, v10) in m/s — eastward and northward components.
        """
        # Try Open-Meteo first
        try:
            return await self._get_open_meteo_wind(lat, lon, time)
        except Exception as e:
            logger.warning(f"Open-Meteo failed ({e}), using synthetic wind")
            self._mode = "synthetic"
            return self._get_synthetic_wind(lat, lon, time)
    
    async def _get_open_meteo_wind(self, lat: float, lon: float, time: Optional[datetime]) -> Tuple[float, float]:
        """
        Fetch real wind data from Open-Meteo Weather API.
        Free, no API key, returns JSON directly.
        """
        # Round coords and time (to the hour) for cache key
        cache_time_str = time.strftime("%Y-%m-%d-%H") if time else 'now'
        cache_key = f"{lat:.2f},{lon:.2f},{cache_time_str}"
        if cache_key in _wind_cache:
            return _wind_cache[cache_key]
        
        # Build API URL
        # Open-Meteo provides wind_speed_10m and wind_direction_10m
        # We need to convert to u10, v10 components
        params = {
            "latitude": round(lat, 4),
            "longitude": round(lon, 4),
            "current": "wind_speed_10m,wind_direction_10m",
            "wind_speed_unit": "ms",
            "timezone": "UTC"
        }
        
        # If we have a specific time, use hourly forecast/history
        if time is not None:
            date_str = time.strftime("%Y-%m-%d")
            params["hourly"] = "wind_speed_10m,wind_direction_10m"
            params["start_date"] = date_str
            params["end_date"] = date_str
        
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get("https://api.open-meteo.com/v1/forecast", params=params)
            resp.raise_for_status()
            data = resp.json()
        
        if time is not None and "hourly" in data:
            # Find the closest hour
            target_hour = time.hour
            hourly = data["hourly"]
            idx = min(target_hour, len(hourly["wind_speed_10m"]) - 1)
            wind_speed = hourly["wind_speed_10m"][idx]
            wind_dir = hourly["wind_direction_10m"][idx]
        elif "current" in data:
            wind_speed = data["current"]["wind_speed_10m"]
            wind_dir = data["current"]["wind_direction_10m"]
        else:
            raise ValueError("No wind data in Open-Meteo response")
        
        if wind_speed is None or wind_dir is None:
            raise ValueError("Null wind values from Open-Meteo")
        
        # Convert from speed + meteorological direction (FROM) to u10, v10
        # Meteorological direction: 0° = from North, 90° = from East
        # u10 = -speed * sin(dir), v10 = -speed * cos(dir)  [direction wind comes FROM]
        wind_dir_rad = np.radians(wind_dir)
        u10 = float(-wind_speed * np.sin(wind_dir_rad))
        v10 = float(-wind_speed * np.cos(wind_dir_rad))
        
        # Cache the result
        _wind_cache[cache_key] = (u10, v10)
        
        self._mode = "open_meteo"
        return (u10, v10)
    
    def _get_synthetic_wind(self, lat: float, lon: float, time: Optional[datetime]) -> Tuple[float, float]:
        """
        Generate realistic synthetic Arabian Sea SW monsoon wind.
        August monsoon: strong southwesterly winds (blowing from SW to NE).
        Typical speed: 8-15 m/s over Arabian Sea in summer.
        """
        # Normalize coordinates
        lat_n = (lat - 5.0) / 25.0
        lon_n = (lon - 50.0) / 30.0
        
        # SW monsoon base wind — blowing northeast (from southwest)
        # u10 > 0 (eastward), v10 > 0 (northward)
        base_speed = 8.0 + 4.0 * np.sin(lat_n * np.pi * 0.8)  # 8-12 m/s
        base_dir_rad = np.radians(225)  # FROM southwest (225°)
        
        base_u10 = -base_speed * np.sin(base_dir_rad)  # positive = eastward
        base_v10 = -base_speed * np.cos(base_dir_rad)  # positive = northward
        
        # Add spatial variation
        var_u = 1.5 * np.sin(lon_n * np.pi * 2)
        var_v = 1.0 * np.cos(lat_n * np.pi * 2)
        
        # Add temporal variation if time provided
        if time is not None:
            hour_frac = time.hour + time.minute / 60.0
            # Diurnal wind variation: stronger afternoon, weaker at night
            diurnal = 1.0 + 0.15 * np.sin((hour_frac - 6) / 24.0 * np.pi * 2)
            base_u10 *= diurnal
            base_v10 *= diurnal
        
        u10 = float(base_u10 + var_u)
        v10 = float(base_v10 + var_v)
        
        return (u10, v10)
