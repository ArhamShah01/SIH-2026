import { api } from "@/lib/api/client"
import { KpiCard } from "@/components/dashboard/KpiCard"
import { IncidentTable } from "@/components/dashboard/IncidentTable"
import { DetectionCard } from "@/components/dashboard/DetectionCard"
import { MapPreview } from "@/components/dashboard/MapPreview"
import { AlertTriangle, Map, Ship, ShieldCheck, ArrowRight, ServerCrash } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function DashboardPage() {
  const statsRes = await api.dashboard.getStats()
  const incidentsRes = await api.incidents.getAll()
  
  const isOffline = (statsRes && 'error' in statsRes) || (incidentsRes && 'error' in incidentsRes)
  
  const stats = !isOffline && statsRes && !('error' in statsRes) ? statsRes : {
    activeIncidents: 0,
    detectedSpillAreaKm2: 0,
    highRiskAlerts: 0,
    vesselsAnalyzed: 0
  }

  const incidents = !isOffline && incidentsRes && Array.isArray(incidentsRes) ? incidentsRes : []
  
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

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Maritime Oil Spill Monitoring</h1>
          <p className="text-muted-foreground mt-1 max-w-3xl">
            AI-assisted detection and source attribution from Sentinel-1 SAR and AIS data.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/map">
            <Button variant="outline" className="gap-2">
              <Map size={16} /> Open Maritime Map
            </Button>
          </Link>
          <Link href="/detection">
            <Button className="gap-2">
              <ShieldCheck size={16} /> Analyze Satellite Scene
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Active Incidents"
          value={isOffline ? "N/A" : stats.activeIncidents}
          icon={AlertTriangle}
          description={isOffline ? "Awaiting data" : ""}
        />
        <KpiCard
          title="Detected Spill Area"
          value={isOffline ? "N/A" : `${stats.detectedSpillAreaKm2.toFixed(1)} km²`}
          icon={Map}
          description={isOffline ? "Awaiting data" : ""}
        />
        <KpiCard
          title="High-Risk Alerts"
          value={isOffline ? "N/A" : stats.highRiskAlerts}
          icon={ShieldCheck}
          description={isOffline ? "Awaiting data" : ""}
          className={stats.highRiskAlerts > 0 ? "border-destructive/50 bg-destructive/10" : ""}
        />
        <KpiCard
          title="Vessels Analyzed"
          value={isOffline ? "N/A" : stats.vesselsAnalyzed}
          icon={Ship}
          description={isOffline ? "Awaiting data" : ""}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-tight">Active Incidents</h2>
            <Link href="/reports" className="text-sm text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <IncidentTable incidents={incidents} isOffline={isOffline} />
        </div>
        
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold tracking-tight">Recent Detections</h2>
          <div className="flex flex-col gap-4">
            {isOffline ? (
              <div className="h-32 border border-border border-dashed rounded-xl flex items-center justify-center text-muted-foreground text-sm bg-secondary/20">
                Awaiting prediction data
              </div>
            ) : incidents.length === 0 ? (
              <div className="h-32 border border-border border-dashed rounded-xl flex items-center justify-center text-muted-foreground text-sm bg-secondary/20">
                No recent detections
              </div>
            ) : (
              incidents.slice(0, 2).map(incident => (
                <DetectionCard key={incident.id} incident={incident} />
              ))
            )}
          </div>
        </div>
      </div>

      <div className="h-96 rounded-xl overflow-hidden border border-border mt-4 relative">
        <MapPreview incidents={incidents} />
      </div>
    </div>
  )
}
