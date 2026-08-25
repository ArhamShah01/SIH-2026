import { api } from "@/lib/api/client"
import { FullMap } from "@/components/map/FullMap"
import { ServerCrash } from "lucide-react"
export const dynamic = 'force-dynamic'

export default async function MapPage() {
  const incidentsRes = await api.incidents.getAll()
  const isOffline = incidentsRes && 'error' in incidentsRes
  
  const incidents = !('error' in incidentsRes) && Array.isArray(incidentsRes) ? incidentsRes : []

  // Fetch associated data for ALL incidents
  const vesselsPromises = incidents.map(inc => api.vessels.getNearby(inc.id))
  const trajectoriesPromises = incidents.map(inc => api.trajectories.getByIncidentId(inc.id))
  
  const vesselsResponses = await Promise.all(vesselsPromises)
  const trajectoriesResponses = await Promise.all(trajectoriesPromises)

  const vessels = vesselsResponses.flatMap(res => !('error' in res) && Array.isArray(res) ? res : [])
  const trajectories = trajectoriesResponses.map(res => !('error' in res) && Array.isArray(res) ? res : [])

  console.log(`[DEBUG] Rendered map with ${incidents.length} incidents and ${trajectories.length} trajectories`);

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
      <div className="flex-1 relative bg-secondary rounded-xl overflow-hidden border border-border shadow-sm">
        <FullMap incidents={incidents} vessels={vessels} trajectories={trajectories} />
      </div>
    </div>
  )
}
