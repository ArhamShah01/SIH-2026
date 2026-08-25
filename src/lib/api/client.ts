import { DashboardStats, Incident, Vessel, TrajectoryPoint, DetectionInferResult } from "@/data/types"
import { MOCK_STATS, MOCK_INCIDENTS, MOCK_VESSELS, MOCK_TRAJECTORY, MOCK_DETECTION_RESULT } from "./mockData"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api"

/**
 * Helper to safely fetch from API with seamless demo fallback when offline.
 */
async function safeFetch<T>(endpoint: string, fallback: T, options?: RequestInit): Promise<T> {
  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      // Add a generous timeout to allow for physics simulations to run
      signal: AbortSignal.timeout(60000), 
      ...options,
      cache: "no-store"
    })
    
    if (!res.ok) {
      return fallback
    }
    
    return await res.json()
  } catch (error) {
    return fallback
  }
}

export const api = {
  dashboard: {
    getStats: async (): Promise<DashboardStats> => {
      return safeFetch<DashboardStats>("/dashboard/stats", MOCK_STATS)
    }
  },

  incidents: {
    getAll: async (): Promise<Incident[]> => {
      return safeFetch<Incident[]>("/incidents", MOCK_INCIDENTS)
    },
    getById: async (id: string): Promise<Incident> => {
      const found = MOCK_INCIDENTS.find(inc => inc.id === id) || MOCK_INCIDENTS[0]
      return safeFetch<Incident>(`/incidents/${id}`, found)
    }
  },
  
  vessels: {
    getNearby: async (incidentId: string): Promise<Vessel[]> => {
      return safeFetch<Vessel[]>(`/ais/vessels?incidentId=${incidentId}`, MOCK_VESSELS)
    }
  },

  trajectories: {
    getByIncidentId: async (incidentId: string): Promise<TrajectoryPoint[]> => {
      return safeFetch<TrajectoryPoint[]>(`/trajectories/${incidentId}`, MOCK_TRAJECTORY)
    }
  },

  detection: {
    runInference: async (file: File | null, config: any): Promise<DetectionInferResult> => {
      const formData = new FormData()
      if (file) formData.append("file", file)
      formData.append("config", JSON.stringify(config))

      const result = await safeFetch<DetectionInferResult>("/detection/infer", MOCK_DETECTION_RESULT, {
        method: "POST",
        body: formData
      })

      if (result === MOCK_DETECTION_RESULT) {
        await new Promise(resolve => setTimeout(resolve, 1500))
      }

      return result
    }
  }
}
