"""
Ocean Current Data Service
Primary: HYCOM GOFS 3.1 via OPeNDAP (no registration required)
Fallback: Synthetic Arabian Sea monsoon-driven current field
"""
import numpy as np
import logging
from datetime import datetime
from typing import Tuple, Optional

logger = logging.getLogger(__name__)


class OceanCurrentService:
    """Provides ocean surface current (uo, vo) at any lat/lon/time."""
    
    def __init__(self):
        self._hycom_data = None
        self._mode = "initializing"
        self._try_load_hycom()
    
    def _try_load_hycom(self):
        """Attempt to load real HYCOM data via OPeNDAP."""
        try:
            import xarray as xr
            # HYCOM GOFS 3.1 latest analysis — OPeNDAP, no auth needed
            # Using the "latest" expt which has recent data
            url = "https://tds.hycom.org/thredds/dodsC/GLBy0.08/expt_93.0/uv3z"
            
            logger.info("Connecting to HYCOM OPeNDAP server...")
            ds = xr.open_dataset(url, decode_times=True)
            
            # Subset to Arabian Sea region and surface level
            # HYCOM uses 0-360 longitude, so Arabian Sea is roughly lon 50-78
            # Latitude is -80 to 80
            self._hycom_data = ds.sel(
                depth=0.0, method="nearest"
            )
            self._mode = "hycom_live"
            logger.info("HYCOM OPeNDAP connected — using REAL ocean current data")
        except Exception as e:
            logger.warning(f"HYCOM OPeNDAP unavailable ({e}), using synthetic fallback")
            self._hycom_data = None
            self._mode = "synthetic"
    
    @property
    def mode(self) -> str:
        return self._mode
    
    def get_current_at(self, lat: float, lon: float, time: Optional[datetime] = None) -> Tuple[float, float]:
        """
        Get ocean surface current at a point.
        Returns (uo, vo) in m/s — eastward and northward components.
        """
        if self._mode == "hycom_live" and self._hycom_data is not None:
            return self._get_hycom_current(lat, lon, time)
        else:
            return self._get_synthetic_current(lat, lon, time)
    
    def _get_hycom_current(self, lat: float, lon: float, time: Optional[datetime]) -> Tuple[float, float]:
        """Fetch from live HYCOM OPeNDAP data."""
        try:
            # HYCOM uses 0-360 longitude
            hycom_lon = lon if lon >= 0 else lon + 360
            
            if time is not None:
                point = self._hycom_data.sel(
                    lat=lat, lon=hycom_lon, time=time,
                    method="nearest"
                )
            else:
                # Use the latest available time
                point = self._hycom_data.sel(
                    lat=lat, lon=hycom_lon,
                    method="nearest"
                ).isel(time=-1)
            
            uo = float(point["water_u"].values)
            vo = float(point["water_v"].values)
            
            # Handle NaN (land points)
            if np.isnan(uo): uo = 0.0
            if np.isnan(vo): vo = 0.0
            
            return (uo, vo)
        except Exception as e:
            logger.warning(f"HYCOM point query failed at ({lat}, {lon}): {e}")
            return self._get_synthetic_current(lat, lon, time)
    
    def _get_synthetic_current(self, lat: float, lon: float, time: Optional[datetime]) -> Tuple[float, float]:
        """
        Generate realistic synthetic Arabian Sea current field.
        Based on August SW monsoon circulation patterns:
        - Somali Current (strong northeastward along Somalia coast)
        - Arabian Sea warm-core eddies
        - Generally northeastward surface flow in summer monsoon
        """
        # Normalize coordinates to Arabian Sea domain
        lat_n = (lat - 5.0) / 25.0   # 0 at 5°N, 1 at 30°N
        lon_n = (lon - 50.0) / 30.0   # 0 at 50°E, 1 at 80°E
        
        # Base monsoon current: generally eastward/northeastward
        base_uo = 0.25 + 0.15 * np.sin(lat_n * np.pi)  # Stronger in mid-latitudes
        base_vo = 0.10 + 0.10 * np.cos(lon_n * np.pi)   # Slight northward component
        
        # Add mesoscale eddy pattern (rotating features)
        eddy_phase = lat_n * 3 + lon_n * 2
        eddy_uo = 0.08 * np.sin(eddy_phase * np.pi * 2)
        eddy_vo = 0.08 * np.cos(eddy_phase * np.pi * 2)
        
        # Add slight temporal variation if time provided
        time_var = 0.0
        if time is not None:
            # Tidal-like semi-diurnal variation
            hour_frac = time.hour + time.minute / 60.0
            time_var = 0.05 * np.sin(hour_frac / 12.0 * np.pi * 2)
        
        uo = float(base_uo + eddy_uo + time_var)
        vo = float(base_vo + eddy_vo + time_var * 0.5)
        
        return (uo, vo)
