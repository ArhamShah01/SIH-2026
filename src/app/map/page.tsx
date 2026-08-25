import { api } from "@/lib/api/client"
import { FullMap } from "@/components/map/FullMap"
import { ServerCrash } from "lucide-react"

export default async function MapPage() {
  const incidentsRes = await api.incidents.getAll()
  const isOffline = incidentsRes && 'error' in incidentsRes
  
  const incidents = !isOffline && Array.isArray(incidentsRes) ? incidentsRes : []
  const defaultIncidentId = incidents.length > 0 ? incidents[0].id : null
  
  // Fetch associated data for the map overlay if we have an active incident
  const vesselsRes = defaultIncidentId ? await api.vessels.getNearby(defaultIncidentId) : []
  const trajectoryRes = defaultIncidentId ? await api.trajectories.getByIncidentId(defaultIncidentId) : []

  const vessels = !('error' in vesselsRes) && Array.isArray(vesselsRes) ? vesselsRes : []
  const trajectory = !('error' in trajectoryRes) && Array.isArray(trajectoryRes) ? trajectoryRes : []

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {isOffline && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg flex items-center gap-3 mb-4">
          <ServerCrash size={20} />
          <div>
            <p className="font-semibold text-sm">Pipeline Offline</p>
            <p className="text-xs">Cannot connect to backend APIs. Displaying base map layers only.</p>
          </div>
        </div>
      )}
      <div className="mb-4">
        <h1 className="text-3xl font-bold tracking-tight text-primary">Maritime Map</h1>
        <p className="text-muted-foreground mt-1">
          Interactive visualization of spills, vessels, and drift trajectories.
        </p>
      </div>
      <div className="flex-1 min-h-[500px]">
        <FullMap incidents={incidents} vessels={vessels} trajectory={trajectory} />
      </div>
    </div>
  )
}
