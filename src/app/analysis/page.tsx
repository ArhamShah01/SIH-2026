import { api } from "@/lib/api/client"
import { IncidentTable } from "@/components/dashboard/IncidentTable"
import { ServerCrash } from "lucide-react"

export default async function AnalysisIndexPage() {
  const incidentsRes = await api.incidents.getAll()
  
  const isOffline = incidentsRes && 'error' in incidentsRes
  const incidents = !isOffline && Array.isArray(incidentsRes) ? incidentsRes : []
  
  return (
    <div className="flex flex-col gap-6">
      {isOffline && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg flex items-center gap-3">
          <ServerCrash size={20} />
          <div>
            <p className="font-semibold text-sm">Pipeline Offline</p>
            <p className="text-xs">Cannot connect to backend services. Displaying limited functionality.</p>
          </div>
        </div>
      )}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">Analysis</h1>
        <p className="text-muted-foreground mt-1">
          Select an incident to view detailed satellite and model analysis.
        </p>
      </div>
      <IncidentTable incidents={incidents} isOffline={isOffline} />
    </div>
  )
}
