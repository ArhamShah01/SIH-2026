import { DashboardStats, Incident, Vessel, TrajectoryPoint, DetectionInferResult, ApiError } from "@/data/types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api"

/**
 * Helper to safely fetch from API and catch network errors (like ECONNREFUSED when offline).
 */
async function safeFetch<T>(endpoint: string, options?: RequestInit): Promise<T | ApiError> {
  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      // Add a short timeout so pages don't hang indefinitely if backend is offline
      signal: AbortSignal.timeout(3000), 
      ...options,
      // For Next.js server components, revalidate frequently or set to no-store for real-time
      cache: "no-store"
    })
    
    if (!res.ok) {
      return { error: true, message: `HTTP Error: ${res.status}` }
    }
    
    return await res.json()
  } catch (error) {
    return { error: true, message: "Pipeline offline / Backend unreachable" }
  }
}

export const api = {
  dashboard: {
    getStats: async (): Promise<DashboardStats | ApiError> => {
      return safeFetch<DashboardStats>("/dashboard/stats")
    }
  },

  incidents: {
    getAll: async (): Promise<Incident[] | ApiError> => {
      return safeFetch<Incident[]>("/incidents")
    },
    getById: async (id: string): Promise<Incident | ApiError> => {
      return safeFetch<Incident>(`/incidents/${id}`)
    }
  },
  
  vessels: {
    getNearby: async (incidentId: string): Promise<Vessel[] | ApiError> => {
      // Future API might accept parameters, assuming query params for now
      return safeFetch<Vessel[]>(`/ais/vessels?incidentId=${incidentId}`)
    }
  },

  trajectories: {
    getByIncidentId: async (incidentId: string): Promise<TrajectoryPoint[] | ApiError> => {
      return safeFetch<TrajectoryPoint[]>(`/trajectories/${incidentId}`)
    }
  },

  detection: {
    runInference: async (file: File | null, config: any): Promise<DetectionInferResult | ApiError> => {
      const formData = new FormData()
      if (file) formData.append("file", file)
      formData.append("config", JSON.stringify(config))

      return safeFetch<DetectionInferResult>("/detection/infer", {
        method: "POST",
        body: formData
      })
    }
  }
}
