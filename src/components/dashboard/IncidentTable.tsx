import { Incident } from "@/data/types"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface IncidentTableProps {
  incidents: Incident[]
  isOffline?: boolean
}

export function IncidentTable({ incidents, isOffline }: IncidentTableProps) {
  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "CRITICAL": return <Badge variant="destructive">CRITICAL</Badge>
      case "HIGH": return <Badge variant="destructive">HIGH</Badge>
      case "MEDIUM": return <Badge variant="warning">MEDIUM</Badge>
      default: return <Badge variant="safe">LOW</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DETECTED": return <Badge variant="secondary">DETECTED</Badge>
      case "INVESTIGATING": return <Badge variant="ai">INVESTIGATING</Badge>
      case "RESOLVED": return <Badge variant="safe">RESOLVED</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full text-sm text-left">
        <thead className="bg-secondary/50 text-muted-foreground uppercase text-xs">
          <tr>
            <th className="px-4 py-3 font-medium">Incident ID</th>
            <th className="px-4 py-3 font-medium">Timestamp</th>
            <th className="px-4 py-3 font-medium">Location</th>
            <th className="px-4 py-3 font-medium">Area</th>
            <th className="px-4 py-3 font-medium">Confidence</th>
            <th className="px-4 py-3 font-medium">Severity</th>
            <th className="px-4 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {incidents.map((incident) => (
            <tr key={incident.id} className="hover:bg-secondary/20 transition-colors">
              <td className="px-4 py-3 font-medium text-primary">
                <Link href={`/analysis/${incident.id}`} className="hover:underline">
                  {incident.id}
                </Link>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {new Date(incident.timestamp).toLocaleString()}
              </td>
              <td className="px-4 py-3">{incident.location?.lat}°, {incident.location?.lon}°</td>
              <td className="px-4 py-3">{incident.areaKm2?.toFixed(1) || 0} km²</td>
              <td className="px-4 py-3">
                <span className="text-destructive font-semibold">{incident.confidence?.toFixed(1) || 0}%</span>
              </td>
              <td className="px-4 py-3">{getSeverityBadge(incident.severity)}</td>
              <td className="px-4 py-3">{getStatusBadge(incident.status)}</td>
            </tr>
          ))}
          {incidents.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                {isOffline ? "Awaiting data — Pipeline offline" : "No active incidents found."}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
