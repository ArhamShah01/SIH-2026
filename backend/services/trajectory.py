"""
Lagrangian Particle Trajectory Simulator

Physics: v_particle = v_current(uo,vo) + wind_drift_factor * v_wind(u10,v10) + diffusion
Integration: RK2 (midpoint method), 30-minute time steps
Particles: N=500, seeded with Gaussian spread around spill centroid

Supports forward (predict movement) and backward (estimate origin) simulation.
"""
import numpy as np
import logging
from datetime import datetime, timedelta
from typing import List, Literal
from models import TrajectoryPoint, Coordinates
from services.ocean_current import OceanCurrentService
from services.wind import WindService

logger = logging.getLogger(__name__)

# Singletons
_ocean_service = OceanCurrentService()
_wind_service = WindService()

WIND_DRIFT_FACTOR = 0.03         # 3% of 10m wind speed
HORIZ_DIFFUSIVITY = 10.0         # m^2/s — turbulent diffusion coefficient
EARTH_RADIUS_M = 6_371_000.0     # meters
DEG_TO_M_LAT = 111_320.0         # meters per degree latitude


def _deg_to_m_lon(lat: float) -> float:
    """Meters per degree longitude at given latitude."""
    return DEG_TO_M_LAT * np.cos(np.radians(lat))


class TrajectorySimulator:
    """
    Simulates oil spill particle trajectories using ocean currents and wind.
    """
    
    async def simulate(
        self,
        lat: float,
        lon: float,
        timestamp: datetime,
        duration_hours: int = 48,
        direction: Literal["forward", "backward"] = "forward",
        num_particles: int = 500,
        dt_minutes: int = 30,
        initial_radius_m: float = 3000.0,
        output_interval_hours: int = 6,
    ) -> List[TrajectoryPoint]:
        """
        Run a Lagrangian particle simulation.
        
        Args:
            lat, lon: Spill centroid coordinates
            timestamp: Spill detection time
            duration_hours: How long to simulate
            direction: 'forward' for prediction, 'backward' for origin estimation
            num_particles: Number of particles to simulate (more = smoother but slower)
            dt_minutes: Integration time step in minutes
            initial_radius_m: Initial spread radius for seeding particles
            output_interval_hours: Time interval between output trajectory points
        
        Returns:
            List of TrajectoryPoint with mean positions and uncertainty radii
        """
        logger.info(
            f"Simulating {direction} trajectory from ({lat:.3f}, {lon:.3f}) "
            f"for {duration_hours}h with {num_particles} particles"
        )
        
        # Time direction multiplier
        time_sign = 1.0 if direction == "forward" else -1.0
        dt_seconds = dt_minutes * 60.0 * time_sign
        total_steps = int((duration_hours * 60) / dt_minutes)
        output_every = max(1, int(output_interval_hours * 60 / dt_minutes))
        
        # Seed particles with Gaussian spread around centroid
        rng = np.random.default_rng(seed=42)  # Reproducible for demo
        
        # Convert initial radius from meters to degrees
        init_radius_lat = initial_radius_m / DEG_TO_M_LAT
        init_radius_lon = initial_radius_m / _deg_to_m_lon(lat)
        
        particle_lats = rng.normal(lat, init_radius_lat / 2, num_particles)
        particle_lons = rng.normal(lon, init_radius_lon / 2, num_particles)
        
        # Active mask (all start active)
        active = np.ones(num_particles, dtype=bool)
        
        # Collect output points
        trajectory_points: List[TrajectoryPoint] = []
        
        # Record initial position (t=0)
        trajectory_points.append(self._aggregate_particles(
            particle_lats, particle_lons, active,
            time_offset_hours=0.0
        ))
        
        current_time = timestamp
        
        for step in range(1, total_steps + 1):
            # -- RK2 Midpoint Method --
            
            # Step 1: Get velocities at current positions
            v1_lat, v1_lon = await self._get_velocities(
                particle_lats[active], particle_lons[active],
                current_time, num_active=int(active.sum())
            )
            
            # Step 2: Compute midpoint positions
            mid_dt = dt_seconds / 2.0
            mid_lats = particle_lats[active] + v1_lat * mid_dt / DEG_TO_M_LAT
            mid_lons = particle_lons[active] + v1_lon * mid_dt / _deg_to_m_lon(np.mean(particle_lats[active]))
            mid_time = current_time + timedelta(seconds=mid_dt)
            
            # Step 3: Get velocities at midpoint
            v2_lat, v2_lon = await self._get_velocities(
                mid_lats, mid_lons, mid_time,
                num_active=int(active.sum())
            )
            
            # Step 4: Full step using midpoint velocities
            dlat_m = v2_lat * dt_seconds  # displacement in meters
            dlon_m = v2_lon * dt_seconds
            
            # Add turbulent diffusion (random walk)
            diffusion_scale = np.sqrt(2 * HORIZ_DIFFUSIVITY * abs(dt_seconds))
            dlat_m += rng.normal(0, diffusion_scale, int(active.sum()))
            dlon_m += rng.normal(0, diffusion_scale, int(active.sum()))
            
            # Convert displacement from meters to degrees
            mean_lat = float(np.mean(particle_lats[active]))
            particle_lats[active] += dlat_m / DEG_TO_M_LAT
            particle_lons[active] += dlon_m / _deg_to_m_lon(mean_lat)
            
            # Simple coastline check — deactivate if lat/lon out of ocean bounds
            # (Rough check: land above 25°N or below 5°N in Arabian Sea)
            out_of_bounds = (
                (particle_lats[active] > 28.0) |
                (particle_lats[active] < 2.0) |
                (particle_lons[active] > 80.0) |
                (particle_lons[active] < 45.0)
            )
            active_indices = np.where(active)[0]
            active[active_indices[out_of_bounds]] = False
            
            # Advance time
            current_time += timedelta(seconds=dt_seconds)
            
            # Record output at intervals
            if step % output_every == 0:
                elapsed_hours = (step * dt_minutes / 60.0) * time_sign
                if active.sum() > 0:
                    trajectory_points.append(self._aggregate_particles(
                        particle_lats, particle_lons, active,
                        time_offset_hours=elapsed_hours
                    ))
        
        logger.info(
            f"{direction.capitalize()} trajectory complete: {len(trajectory_points)} points, "
            f"data mode: ocean={_ocean_service.mode}, wind={_wind_service.mode}"
        )
        
        return trajectory_points
    
    async def _get_velocities(
        self, lats: np.ndarray, lons: np.ndarray, time: datetime, num_active: int
    ) -> tuple:
        """
        Get effective particle velocity (ocean current + wind drift) for all active particles.
        Returns (v_lat_ms, v_lon_ms) — velocity components in m/s (north, east).
        """
        # For performance, sample environment at the mean position
        # (For a production system, you'd interpolate per-particle)
        mean_lat = float(np.mean(lats))
        mean_lon = float(np.mean(lons))
        
        # Ocean current (uo = eastward, vo = northward) in m/s
        uo, vo = _ocean_service.get_current_at(mean_lat, mean_lon, time)
        
        # Wind (u10 = eastward, v10 = northward) in m/s  
        u10, v10 = await _wind_service.get_wind_at(mean_lat, mean_lon, time)
        
        # Total velocity: current + wind_drift_factor * wind
        v_east = uo + WIND_DRIFT_FACTOR * u10   # m/s eastward
        v_north = vo + WIND_DRIFT_FACTOR * v10  # m/s northward
        
        # Add slight per-particle variation to prevent all particles moving identically
        n = len(lats)
        rng = np.random.default_rng()
        v_east_arr = np.full(n, v_east) + rng.normal(0, 0.02, n)
        v_north_arr = np.full(n, v_north) + rng.normal(0, 0.02, n)
        
        return v_north_arr, v_east_arr  # (lat direction, lon direction)
    
    def _aggregate_particles(
        self, lats: np.ndarray, lons: np.ndarray, active: np.ndarray,
        time_offset_hours: float
    ) -> TrajectoryPoint:
        """
        Aggregate particle cloud into a single TrajectoryPoint.
        Mean position = trajectory centroid.
        Uncertainty = 2-sigma spread of particles, converted to km.
        """
        active_lats = lats[active]
        active_lons = lons[active]
        
        mean_lat = float(np.mean(active_lats))
        mean_lon = float(np.mean(active_lons))
        
        # Compute spread in km
        lat_std_km = float(np.std(active_lats)) * 111.0
        lon_std_km = float(np.std(active_lons)) * 111.0 * np.cos(np.radians(mean_lat))
        uncertainty_km = round(np.sqrt(lat_std_km**2 + lon_std_km**2) * 2, 1)  # 2-sigma
        uncertainty_km = max(uncertainty_km, 1.0)  # Minimum 1 km
        
        return TrajectoryPoint(
            timeOffsetHours=round(time_offset_hours, 1),
            coordinates=Coordinates(lat=round(mean_lat, 4), lon=round(mean_lon, 4)),
            uncertaintyRadiusKm=uncertainty_km
        )
